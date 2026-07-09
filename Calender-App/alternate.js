import "dotenv/config.js";
import express from "express";
import { google } from "googleapis";
import cron from "node-cron";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pool from "../db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── CORS ─────────────────────────────────────────────────────────────────────
// In development the frontend runs on a different port (Vite: 5173).
// FRONTEND_URL should be "http://localhost:5173" in dev; your deployed URL in prod.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Mail ────────────────────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendMail(opts) {
  return mailer
    .sendMail({ from: process.env.SMTP_USER, ...opts })
    .catch((err) =>
      console.error(`[MAIL] Failed to ${opts.to}: ${err.message}`),
    );
}

// ── Google OAuth ─────────────────────────────────────────────────────────────
const oauthClient = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL,
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

async function getCalendarClient(clinicEmail) {
  const res = await pool.query(
    "SELECT refresh_token FROM google_credentials WHERE email = $1",
    [clinicEmail],
  );
  if (res.rowCount === 0)
    throw new Error(`No credentials stored for ${clinicEmail}`);

  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL,
  );
  client.setCredentials({ refresh_token: res.rows[0].refresh_token });
  return client;
}

// ── Auth middleware ──────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header required." });
  }

  const token = header.slice(7);
  const result = await pool
    .query(
      "SELECT email, name, slug FROM google_credentials WHERE api_token = $1",
      [token],
    )
    .catch(() => null);

  if (!result || result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.clinic = result.rows[0];
  next();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTH
//
//  HOW THE OAUTH FLOW WORKS WITH THE FRONTEND:
//  1. User clicks "Sign in with Google" → browser navigates to GET /google
//  2. Backend redirects user to Google's OAuth consent screen
//  3. Google redirects back to GET /api/auth/callback?code=xxx (this backend URL
//     is set as REDIRECT_URL in your Google Cloud Console)
//  4. Backend exchanges code for tokens, stores them, creates a short-lived
//     "claim token" in memory, then REDIRECTS the browser to the FRONTEND at
//     /auth/callback?claim=<claimToken>
//  5. Frontend's AuthCallback page reads the claim token from the URL and
//     calls GET /api/auth/claim/:token to exchange it for the real API token
//  6. Frontend stores the API token in localStorage and redirects to dashboard
//
//  Why the two-step claim exchange?
//  - The OAuth callback MUST redirect to a URL registered in Google Cloud Console.
//    That's the backend URL. But after auth, we need to hand the token to the SPA.
//  - Embedding the real API token in a URL redirect is dangerous (it lands in
//    browser history and server logs). A short-lived claim token mitigates this.
// ════════════════════════════════════════════════════════════════════════════

// Temporary in-memory store for pending auth claims.
// key = claimToken (random hex), value = { token: apiToken, user: {...} }
// Each claim is deleted after first use or after 5 minutes.
const authClaims = new Map();

// Step 1 — redirect to Google sign-in
app.get("/google", (req, res) => {
  const authUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: req.query.force === "true" ? "consent" : "select_account",
  });
  res.redirect(authUrl);
});

// Step 2 — Google redirects here after the user grants consent
app.get("/api/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code parameter." });

  try {
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const { data: userInfo } = await oauth2.userinfo.get();
    const { email, name } = userInfo;

    const existing = await pool.query(
      "SELECT slug, refresh_token FROM google_credentials WHERE email = $1",
      [email],
    );

    if (!tokens.refresh_token && existing.rowCount === 0) {
      console.warn(
        `[OAUTH] No refresh_token for new account ${email} — forcing consent.`,
      );
      return res.redirect("/google?force=true");
    }

    const slug =
      existing.rowCount > 0
        ? existing.rows[0].slug
        : slugify(email.split("@")[0]);

    const refreshToken =
      tokens.refresh_token || existing.rows[0]?.refresh_token;
    const apiToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO google_credentials (email, name, slug, refresh_token, api_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         name          = EXCLUDED.name,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_credentials.refresh_token),
         api_token     = EXCLUDED.api_token,
         updated_at    = NOW()`,
      [email, name, slug, refreshToken, apiToken],
    );

    // Create a short-lived claim token (one-time use, expires in 5 min)
    const claimToken = crypto.randomBytes(32).toString("hex");
    authClaims.set(claimToken, {
      token: apiToken,
      user: { email, name, slug },
    });
    setTimeout(() => authClaims.delete(claimToken), 5 * 60 * 1000);

    // Redirect the browser to the frontend's callback page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?claim=${claimToken}`);
  } catch (err) {
    console.error("[OAUTH] Callback error:", err);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
  }
});

// Step 3 — Frontend exchanges the claim token for the real API token
// This is called by the AuthCallback React page, NOT by the user's browser directly.
// The claim is deleted after first use to prevent replay attacks.
app.get("/api/auth/claim/:claimToken", (req, res) => {
  const claim = authClaims.get(req.params.claimToken);
  if (!claim) {
    return res.status(404).json({ error: "Claim not found or already used." });
  }
  authClaims.delete(req.params.claimToken); // one-time use
  res.json(claim); // { token: string, user: { email, name, slug } }
});

// Verify token and return current user info
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.clinic });
});

// ════════════════════════════════════════════════════════════════════════════
//  EVENT TYPES  (admin — requires auth)
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/event-types", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT et.*,
         COALESCE(
           json_agg(a ORDER BY a.day_of_week) FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS availability
       FROM event_types et
       LEFT JOIN availabilities a ON a.event_type_id = et.id
       WHERE et.clinic_email = $1
       GROUP BY et.id
       ORDER BY et.id`,
      [req.clinic.email],
    );
    res.json({ eventTypes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list event types." });
  }
});

app.post("/api/event-types", requireAuth, async (req, res) => {
  const {
    name,
    description = null,
    googleCalendarId = "primary",
    leadTimeHours = 24,
    slotDurationMinutes = 30,
    stepMinutes = 30,
    availability = [],
  } = req.body;

  if (!name) return res.status(400).json({ error: "name is required." });

  const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);

  try {
    const etRes = await pool.query(
      `INSERT INTO event_types
         (clinic_email, name, slug, description, google_calendar_id,
          lead_time_hours, slot_duration_minutes, step_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.clinic.email,
        name,
        slug,
        description,
        googleCalendarId,
        leadTimeHours,
        slotDurationMinutes,
        stepMinutes,
      ],
    );

    const eventType = etRes.rows[0];

    for (const a of availability) {
      await pool.query(
        `INSERT INTO availabilities (event_type_id, day_of_week, start_time, end_time)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (event_type_id, day_of_week) DO UPDATE
           SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time`,
        [eventType.id, a.dayOfWeek, a.startTime, a.endTime],
      );
    }

    res.status(201).json({ eventType });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: `Slug "${slug}" is already in use.` });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create event type." });
  }
});

app.put("/api/event-types/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    googleCalendarId,
    leadTimeHours,
    slotDurationMinutes,
    stepMinutes,
    customReminderTemplate,
    isActive,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE event_types SET
         name                     = COALESCE($1,  name),
         slug                     = COALESCE($2,  slug),
         description              = COALESCE($3,  description),
         google_calendar_id       = COALESCE($4,  google_calendar_id),
         lead_time_hours          = COALESCE($5,  lead_time_hours),
         slot_duration_minutes    = COALESCE($6,  slot_duration_minutes),
         step_minutes             = COALESCE($7,  step_minutes),
         custom_reminder_template = COALESCE($8,  custom_reminder_template),
         is_active                = COALESCE($9,  is_active)
       WHERE id = $10 AND clinic_email = $11
       RETURNING *`,
      [
        name,
        slug ? slugify(slug) : null,
        description,
        googleCalendarId,
        leadTimeHours,
        slotDurationMinutes,
        stepMinutes,
        customReminderTemplate,
        isActive,
        id,
        req.clinic.email,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event type not found." });
    }
    res.json({ eventType: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event type." });
  }
});

app.delete("/api/event-types/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM event_types WHERE id = $1 AND clinic_email = $2 RETURNING id",
      [req.params.id, req.clinic.email],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Event type not found." });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event type." });
  }
});

app.get("/api/event-types/:id/availability", requireAuth, async (req, res) => {
  try {
    const check = await pool.query(
      "SELECT id FROM event_types WHERE id = $1 AND clinic_email = $2",
      [req.params.id, req.clinic.email],
    );
    if (check.rowCount === 0)
      return res.status(404).json({ error: "Event type not found." });

    const result = await pool.query(
      "SELECT * FROM availabilities WHERE event_type_id = $1 ORDER BY day_of_week",
      [req.params.id],
    );
    res.json({ availability: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch availability." });
  }
});

app.put("/api/event-types/:id/availability", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;

  if (!Array.isArray(availability)) {
    return res.status(400).json({ error: "availability must be an array." });
  }

  try {
    const check = await pool.query(
      "SELECT id FROM event_types WHERE id = $1 AND clinic_email = $2",
      [id, req.clinic.email],
    );
    if (check.rowCount === 0)
      return res.status(404).json({ error: "Event type not found." });

    await pool.query("DELETE FROM availabilities WHERE event_type_id = $1", [
      id,
    ]);

    for (const a of availability) {
      await pool.query(
        "INSERT INTO availabilities (event_type_id, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4)",
        [id, a.dayOfWeek, a.startTime, a.endTime],
      );
    }

    const result = await pool.query(
      "SELECT * FROM availabilities WHERE event_type_id = $1 ORDER BY day_of_week",
      [id],
    );
    res.json({ availability: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update availability." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  BOOKINGS  (admin — requires auth)
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/bookings", requireAuth, async (req, res) => {
  const { status = "confirmed", from, to } = req.query;
  const params = [req.clinic.email, status];
  let query = `
    SELECT b.*, et.name AS event_type_name, et.slug AS event_type_slug,
           et.slot_duration_minutes
    FROM bookings b
    JOIN event_types et ON et.id = b.event_type_id
    WHERE et.clinic_email = $1 AND b.status = $2`;

  if (from) {
    params.push(from);
    query += ` AND b.start_time >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    query += ` AND b.start_time <= $${params.length}`;
  }
  query += " ORDER BY b.start_time";

  try {
    const result = await pool.query(query, params);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
  try {
    const booking = await pool.query(
      `SELECT b.*, et.clinic_email, et.google_calendar_id, et.name AS event_name
       FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       WHERE b.id = $1 AND et.clinic_email = $2`,
      [req.params.id, req.clinic.email],
    );
    if (booking.rowCount === 0)
      return res.status(404).json({ error: "Booking not found." });

    const b = booking.rows[0];

    if (b.google_event_id) {
      try {
        const cal = google.calendar({
          version: "v3",
          auth: await getCalendarClient(b.clinic_email),
        });
        await cal.events.delete({
          calendarId: b.google_calendar_id || "primary",
          eventId: b.google_event_id,
          sendUpdates: "all",
        });
      } catch (calErr) {
        console.warn("[GCal] Could not delete event:", calErr.message);
      }
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [
      b.id,
    ]);

    await sendMail({
      to: b.client_email,
      subject: `Booking cancelled: ${b.event_name}`,
      text: `Hello ${b.client_name},\n\nYour appointment on ${new Date(b.start_time).toLocaleString()} has been cancelled.\n\nPlease get in touch to reschedule.`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel booking." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC BOOKING  (no auth)
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/public/:clinicSlug/:eventSlug", async (req, res) => {
  const { clinicSlug, eventSlug } = req.params;
  try {
    const result = await pool.query(
      `SELECT et.id, et.name, et.slug, et.description,
              et.slot_duration_minutes, et.lead_time_hours,
              gc.name AS clinic_name, gc.slug AS clinic_slug
       FROM event_types et
       JOIN google_credentials gc ON gc.email = et.clinic_email
       WHERE gc.slug = $1 AND et.slug = $2 AND et.is_active = TRUE`,
      [clinicSlug, eventSlug],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Not found." });
    res.json({ eventType: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event type." });
  }
});

app.post("/api/public/:clinicSlug/:eventSlug/slots", async (req, res) => {
  const { clinicSlug, eventSlug } = req.params;
  const { date } = req.body;
  if (!date)
    return res.status(400).json({ error: "date (YYYY-MM-DD) is required." });

  try {
    const etRes = await pool.query(
      `SELECT et.*, gc.email AS clinic_email
       FROM event_types et
       JOIN google_credentials gc ON gc.email = et.clinic_email
       WHERE gc.slug = $1 AND et.slug = $2 AND et.is_active = TRUE`,
      [clinicSlug, eventSlug],
    );
    if (etRes.rowCount === 0)
      return res.status(404).json({ error: "Not found." });

    const et = etRes.rows[0];
    const slotMs = et.slot_duration_minutes * 60_000;
    const stepMs = et.step_minutes * 60_000;
    const leadMs = et.lead_time_hours * 3_600_000;
    const now = Date.now();

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const availRes = await pool.query(
      "SELECT start_time, end_time FROM availabilities WHERE event_type_id = $1 AND day_of_week = $2",
      [et.id, dayOfWeek],
    );
    if (availRes.rowCount === 0) {
      return res.json({
        date,
        slots: [],
        message: "No availability on this day.",
      });
    }

    const { start_time, end_time } = availRes.rows[0];
    const windowStart = new Date(`${date}T${start_time}`).getTime();
    const windowEnd = new Date(`${date}T${end_time}`).getTime();

    if (windowEnd < now + leadMs) {
      return res.json({
        date,
        slots: [],
        message: "Date is within lead time restriction.",
      });
    }

    const busy = [];

    const localBusy = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed' AND start_time::date = $2`,
      [et.id, date],
    );
    localBusy.rows.forEach((b) =>
      busy.push({
        start: new Date(b.start_time).getTime(),
        end: new Date(b.end_time).getTime(),
      }),
    );

    try {
      const cal = google.calendar({
        version: "v3",
        auth: await getCalendarClient(et.clinic_email),
      });
      const fbRes = await cal.freebusy.query({
        requestBody: {
          timeMin: new Date(windowStart).toISOString(),
          timeMax: new Date(windowEnd).toISOString(),
          items: [{ id: et.google_calendar_id || "primary" }],
        },
      });
      const gcalBusy =
        fbRes.data.calendars[et.google_calendar_id || "primary"].busy || [];
      gcalBusy.forEach((b) =>
        busy.push({
          start: new Date(b.start).getTime(),
          end: new Date(b.end).getTime(),
        }),
      );
    } catch (calErr) {
      console.warn("[GCal] Freebusy check failed:", calErr.message);
    }

    const slots = [];
    for (let t = windowStart; t + slotMs <= windowEnd; t += stepMs) {
      if (t < now + leadMs) continue;
      const end = t + slotMs;
      const blocked = busy.some((b) => t < b.end && end > b.start);
      if (!blocked) {
        slots.push(
          new Date(t).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
      }
    }

    res.json({ date, slots, durationMinutes: et.slot_duration_minutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute available slots." });
  }
});

app.post("/api/public/:clinicSlug/:eventSlug/book", async (req, res) => {
  const { clinicSlug, eventSlug } = req.params;
  const { clientName, clientEmail, date, time } = req.body;

  if (!clientName || !clientEmail || !date || !time) {
    return res
      .status(400)
      .json({ error: "clientName, clientEmail, date, and time are required." });
  }

  try {
    const etRes = await pool.query(
      `SELECT et.*, gc.email AS clinic_email, gc.name AS clinic_name
       FROM event_types et
       JOIN google_credentials gc ON gc.email = et.clinic_email
       WHERE gc.slug = $1 AND et.slug = $2 AND et.is_active = TRUE`,
      [clinicSlug, eventSlug],
    );
    if (etRes.rowCount === 0)
      return res.status(404).json({ error: "Not found." });

    const et = etRes.rows[0];
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(
      startTime.getTime() + et.slot_duration_minutes * 60_000,
    );

    const localConflict = await pool.query(
      `SELECT id FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed'
       AND start_time < $2 AND end_time > $3`,
      [et.id, endTime, startTime],
    );
    if (localConflict.rowCount > 0) {
      return res
        .status(409)
        .json({
          error: "This slot was just taken. Please choose another time.",
        });
    }

    try {
      const cal = google.calendar({
        version: "v3",
        auth: await getCalendarClient(et.clinic_email),
      });
      const fbRes = await cal.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: et.google_calendar_id || "primary" }],
        },
      });
      const gcalBusy =
        fbRes.data.calendars[et.google_calendar_id || "primary"].busy || [];
      if (gcalBusy.length > 0) {
        return res
          .status(409)
          .json({
            error: "This time conflicts with an existing calendar event.",
          });
      }
    } catch (calErr) {
      console.warn("[GCal] Pre-book conflict check failed:", calErr.message);
    }

    let googleEventId = null;
    try {
      const cal = google.calendar({
        version: "v3",
        auth: await getCalendarClient(et.clinic_email),
      });
      const event = await cal.events.insert({
        calendarId: et.google_calendar_id || "primary",
        sendUpdates: "all",
        requestBody: {
          summary: `${et.name}: ${clientName}`,
          description: `${et.slot_duration_minutes}-min appointment. Client: ${clientEmail}`,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          attendees: [{ email: clientEmail }, { email: et.clinic_email }],
        },
      });
      googleEventId = event.data.id;
    } catch (calErr) {
      console.warn("[GCal] Event creation failed:", calErr.message);
    }

    const bookingRes = await pool.query(
      `INSERT INTO bookings (event_type_id, client_name, client_email, start_time, end_time, google_event_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [et.id, clientName, clientEmail, startTime, endTime, googleEventId],
    );
    const bookingId = bookingRes.rows[0].id;

    await sendMail({
      to: clientEmail,
      subject: `Confirmed: ${et.name}`,
      text:
        `Hello ${clientName},\n\nYour booking is confirmed!\n\n` +
        `${et.name}\n${date} at ${time} (${et.slot_duration_minutes} min)\n\n` +
        `You'll receive reminders 24 hours and 1 hour before your appointment.\n\nSee you soon!`,
    });

    await sendMail({
      to: et.clinic_email,
      subject: `New booking: ${clientName} — ${et.name}`,
      text:
        `New appointment booked.\n\nClient: ${clientName} (${clientEmail})\n` +
        `Event: ${et.name}\nDate: ${date} at ${time}\nDuration: ${et.slot_duration_minutes} min`,
    });

    res.status(201).json({ success: true, bookingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  CRON — Reminder emails (runs every 15 min)
// ════════════════════════════════════════════════════════════════════════════
cron.schedule("*/15 * * * *", async () => {
  try {
    const due24h = await pool.query(`
      SELECT b.*, et.name AS event_name, et.custom_reminder_template
      FROM bookings b
      JOIN event_types et ON et.id = b.event_type_id
      WHERE b.reminder_24h = FALSE
        AND b.status = 'confirmed'
        AND b.start_time BETWEEN NOW() + INTERVAL '23 hours 45 minutes'
                              AND NOW() + INTERVAL '24 hours 15 minutes'
    `);

    for (const b of due24h.rows) {
      const body = b.custom_reminder_template
        ? b.custom_reminder_template
            .replace(/{{clientName}}/g, b.client_name)
            .replace(/{{eventName}}/g, b.event_name)
            .replace(
              /{{startTime}}/g,
              new Date(b.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            )
        : `Hello ${b.client_name},\n\nA reminder that your ${b.event_name} is tomorrow at ` +
          `${new Date(b.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.\n\nSee you then!`;

      await sendMail({
        to: b.client_email,
        subject: `Reminder: ${b.event_name} tomorrow`,
        text: body,
      });
      await pool.query(
        "UPDATE bookings SET reminder_24h = TRUE WHERE id = $1",
        [b.id],
      );
    }

    const due1h = await pool.query(`
      SELECT b.*, et.name AS event_name
      FROM bookings b
      JOIN event_types et ON et.id = b.event_type_id
      WHERE b.reminder_1h = FALSE
        AND b.status = 'confirmed'
        AND b.start_time BETWEEN NOW() + INTERVAL '45 minutes'
                              AND NOW() + INTERVAL '75 minutes'
    `);

    for (const b of due1h.rows) {
      await sendMail({
        to: b.client_email,
        subject: `Starting soon: ${b.event_name}`,
        text: `Hello ${b.client_name},\n\nYour ${b.event_name} starts in about 1 hour. See you soon!`,
      });
      await pool.query("UPDATE bookings SET reminder_1h = TRUE WHERE id = $1", [
        b.id,
      ]);
    }
  } catch (err) {
    console.error("[CRON] Reminder sweep failed:", err);
  }
});

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
