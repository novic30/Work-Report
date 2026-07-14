import { Router } from "express";
import { google } from "googleapis";
import crypto from "crypto";
import pool from "../db.js";
import { getCalendarClient } from "./bookings.js";
import { sendMail } from "../mail.js";
import { DateTime } from "luxon";

const router = Router();

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC BOOKING  (no auth — this is what clients see via the booking URL)
//  URL pattern: /<clinicSlug>/<eventSlug>  →  the UI handles the page render
//  API pattern: /api/public/<clinicSlug>/<eventSlug>/...
// ════════════════════════════════════════════════════════════════════════════

// List all active event types for a clinic (public landing page)
// GET /api/public/:clinicSlug
router.get("/:clinicSlug", async (req, res) => {
  const { clinicSlug } = req.params;
  try {
    const clinic = await pool.query(
      "SELECT email, name, slug FROM google_credentials WHERE slug = $1",
      [clinicSlug],
    );
    if (clinic.rowCount === 0)
      return res.status(404).json({ error: "Clinic not found." });

    const eventTypes = await pool.query(
      `SELECT id, name, slug, description, slot_duration_minutes, lead_time_hours
       FROM event_types
       WHERE clinic_email = $1 AND is_active = TRUE
       ORDER BY id`,
      [clinic.rows[0].email],
    );

    res.json({ clinic: clinic.rows[0], eventTypes: eventTypes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clinic." });
  }
});

// Get public info about a bookable event type
// GET /api/public/:clinicSlug/:eventSlug
router.get("/:clinicSlug/:eventSlug", async (req, res) => {
  const { clinicSlug, eventSlug } = req.params;
  try {
    const result = await pool.query(
      `SELECT et.id, et.name, et.slug, et.description,
              et.slot_duration_minutes, et.lead_time_hours,
              et.buffer_time_minutes, et.max_advance_days,
              et.custom_questions,
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

// Get available slots for a given date
// POST /api/public/:clinicSlug/:eventSlug/slots
// Body: { date: "YYYY-MM-DD" , timezone?: "America/Los_Angeles"}
router.post("/:clinicSlug/:eventSlug/slots", async (req, res) => {
  const { clinicSlug, eventSlug } = req.params;
  const { date, timezone } = req.body;
  if (!date)
    return res.status(400).json({ error: "date (YYYY-MM-DD) is required." });

  try {
    const etRes = await pool.query(
      `SELECT et.*, gc.email AS clinic_email, gc.timezone AS clinic_timezone
       FROM event_types et
       JOIN google_credentials gc ON gc.email = et.clinic_email
       WHERE gc.slug = $1 AND et.slug = $2 AND et.is_active = TRUE`,
      [clinicSlug, eventSlug],
    );
    if (etRes.rowCount === 0)
      return res.status(404).json({ error: "Not found." });

    const et = etRes.rows[0];
    const slotMs = et.slot_duration_minutes * 60_000;
    const clinicTz = et.clinic_timezone || "America/Chicago";
    const userTz = timezone || clinicTz;
    const stepMs = et.step_minutes * 60_000;
    const leadMs = et.lead_time_hours * 3_600_000;
    const bufferMs = (et.buffer_time_minutes || 0) * 60_000;
    const maxAdvanceMs = (et.max_advance_days || 30) * 86_400_000;
    const now = Date.now();

    // Check max advance booking window (in clinic timezone)
    const dateStart = DateTime.fromISO(date, { zone: clinicTz }).startOf("day");
    if (dateStart.toMillis() > now + maxAdvanceMs) {
      return res.json({
        date,
        slots: [],
        message: "Date is beyond the maximum advance booking window.",
      });
    }

    // Day-of-week check (in clinic timezone)
    const dayOfWeek = dateStart.weekday % 7;
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
    const startStr = String(start_time).substring(0, 5);
    const endStr = String(end_time).substring(0, 5);
    const windowStart = DateTime.fromISO(`${date}T${startStr}`, {
      zone: clinicTz,
    }).toMillis();
    const windowEnd = DateTime.fromISO(`${date}T${endStr}`, {
      zone: clinicTz,
    }).toMillis();

    if (windowEnd < now + leadMs) {
      return res.json({
        date,
        slots: [],
        message: "Date is within lead time restriction.",
      });
    }

    // Collect busy intervals
    const busy = [];

    // 1. From our own bookings table (according to clinic timeone)
    const localBusy = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed' AND (start_time AT TIME ZONE $3)::date = $2`,
      [et.id, date, clinicTz],
    );
    localBusy.rows.forEach((b) => {
      // Include buffer time around each booking
      const bStart = new Date(b.start_time).getTime() - bufferMs;
      const bEnd = new Date(b.end_time).getTime() + bufferMs;
      busy.push({ start: bStart, end: bEnd });
    });

    // 2. From Google Calendar (catches events made outside this app)
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
      gcalBusy.forEach((b) => {
        const bStart = new Date(b.start).getTime() - bufferMs;
        const bEnd = new Date(b.end).getTime() + bufferMs;
        busy.push({ start: bStart, end: bEnd });
      });
    } catch (calErr) {
      console.warn("[GCal] Freebusy check failed:", calErr.message);
    }

    // Generate candidate slots and filter out anything that overlaps
    const slots = [];
    for (let t = windowStart; t + slotMs <= windowEnd; t += stepMs) {
      if (t < now + leadMs) continue;
      const end = t + slotMs;
      const blocked = busy.some((b) => t < b.end && end > b.start);
      if (!blocked) {
        slots.push(DateTime.fromMillis(t, { zone: userTz }).toFormat("HH:mm"));
      }
    }

    res.json({
      date,
      slots,
      durationMinutes: et.slot_duration_minutes,
      timezone: userTz,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute available slots." });
  }
});

// Create a booking (the form submit from the client's booking page)
// POST /api/public/:clinicSlug/:eventSlug/book
// Body: { clientName, clientEmail, clientPhone?, meetingNotes?, date, time, timezone?, customAnswers? }
router.post("/:clinicSlug/:eventSlug/book", async (req, res) => {
  const { clinicSlug, eventSlug } = req.params;
  const {
    clientName,
    clientEmail,
    clientPhone,
    date,
    time,
    timezone,
    customAnswers,
    meetingNotes,
  } = req.body;

  if (!clientName || !clientEmail || !date || !time) {
    return res
      .status(400)
      .json({ error: "clientName, clientEmail, date, and time are required." });
  }

  try {
    const etRes = await pool.query(
      `SELECT et.*, gc.email AS clinic_email, gc.name AS clinic_name, gc.timezone AS clinic_timezone
       FROM event_types et
       JOIN google_credentials gc ON gc.email = et.clinic_email
       WHERE gc.slug = $1 AND et.slug = $2 AND et.is_active = TRUE`,
      [clinicSlug, eventSlug],
    );
    if (etRes.rowCount === 0)
      return res.status(404).json({ error: "Not found." });

    const et = etRes.rows[0];
    const clinicTz = et.clinic_timezone || "America/Chicago";
    const userTz = timezone || clinicTz;
    const startTime = DateTime.fromISO(`${date}T${time}:00`, {
      zone: userTz,
    }).toJSDate();
    const endTime = DateTime.fromJSDate(startTime)
      .plus({ minutes: et.slot_duration_minutes })
      .toJSDate();

    // ── Double-booking guard ─────────────────────────────────────────────
    const localConflict = await pool.query(
      `SELECT id FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed'
       AND start_time < $2 AND end_time > $3`,
      [et.id, endTime, startTime],
    );
    if (localConflict.rowCount > 0) {
      return res.status(409).json({
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
        return res.status(409).json({
          error: "This time conflicts with an existing calendar event.",
        });
      }
    } catch (calErr) {
      console.warn("[GCal] Pre-book conflict check failed:", calErr.message);
    }
    // ────────────────────────────────────────────────────────────────────

    let googleEventId = null;
    try {
      const cal = google.calendar({
        version: "v3",
        auth: await getCalendarClient(et.clinic_email),
      });

      const description = [
        `${et.slot_duration_minutes}-min appointment`,
        `Client: ${clientEmail}`,
        clientPhone ? `Phone: ${clientPhone}` : null,
        meetingNotes ? `Notes:\n${meetingNotes}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const event = await cal.events.insert({
        calendarId: et.google_calendar_id || "primary",
        sendUpdates: "all",
        requestBody: {
          summary: `${et.name}: ${clientName}`,
          description,
          start: { dateTime: startTime.toISOString(), timeZone: "UTC" },
          end: { dateTime: endTime.toISOString(), timeZone: "UTC" },
          attendees: [{ email: clientEmail }, { email: et.clinic_email }],
        },
      });
      googleEventId = event.data.id;
    } catch (calErr) {
      console.warn("[GCal] Event creation failed:", calErr.message);
    }

    // Generate cancel token
    const cancelToken = crypto.randomBytes(32).toString("hex");

    // Persist booking
    const bookingRes = await pool.query(
      `INSERT INTO bookings (event_type_id, client_name, client_email, client_phone,
         custom_answers, start_time, end_time, google_event_id, cancel_token, meeting_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        et.id,
        clientName,
        clientEmail,
        clientPhone || null,
        JSON.stringify(customAnswers || {}),
        startTime,
        endTime,
        googleEventId,
        cancelToken,
        meetingNotes || null,
      ],
    );
    const bookingId = bookingRes.rows[0].id;

    // Confirmation email → client
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const cancelUrl = `${frontendUrl}/cancel/${cancelToken}`;
    try {
      await sendMail(et.clinic_email, {
        to: clientEmail,
        subject: `Confirmed: ${et.name}`,
        text:
          `Hello ${clientName},\n\nYour booking is confirmed!\n\n` +
          `${et.name}\n${date} at ${time} (${userTz}) (${et.slot_duration_minutes} min)\n\n` +
          (meetingNotes ? `Notes:\n${meetingNotes}\n\n` : "") +
          `You'll receive reminders 24 hours and 1 hour before your appointment.\n\n` +
          `To cancel: ${cancelUrl}\n\nSee you soon!`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#1a1a2e">Booking Confirmed ✓</h2>
          <p>Hello <strong>${clientName}</strong>,</p>
          <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0">
            <p style="margin:0"><strong>${et.name}</strong></p>
            <p style="margin:4px 0">${date} at ${time}</p>
            <p style="margin:4px 0;color:#666">${et.slot_duration_minutes} minutes</p>
          </div>
          <p>You'll receive reminders 24 hours and 1 hour before your appointment.</p>
          <p><a href="${cancelUrl}" style="color:#dc2626">Cancel this booking</a></p>
        </div>
      `,
      });

      // Notification → clinic
      if (et.clinic_email !== clientEmail) {
        await sendMail(et.clinic_email, {
          to: et.clinic_email,
          subject: `New booking: ${clientName} — ${et.name}`,
          text:
            `New appointment booked.\n\nClient: ${clientName} (${clientEmail})\n` +
            `Event: ${et.name}\nDate: ${date} at ${time}\nDuration: ${et.slot_duration_minutes} min\n` +
            (meetingNotes ? `Notes:\n${meetingNotes}\n` : ""),
        });
      }
    } catch (mailErr) {
      console.log(
        "[MAIL] Confirmation email failed but Booking Still Created: ",
        mailErr.message,
      );
    }

    res.status(201).json({ success: true, bookingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking." });
  }
});

// Cancel a booking via cancel token (public, no auth)
// MUST be before /:clinicSlug routes – Express matches in order
// GET /api/public/cancel/:cancelToken
router.get("/cancel/:cancelToken", async (req, res) => {
  const { cancelToken } = req.params;

  try {
    const booking = await pool.query(
      `SELECT b.*, et.clinic_email, et.google_calendar_id, et.name AS event_name, gc.timezone AS clinic_timezone
       FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       JOIN google_credentials gc ON gc.email = et.clinic_email
       WHERE b.cancel_token = $1 AND b.status = 'confirmed'`,
      [cancelToken],
    );

    if (booking.rowCount === 0)
      return res
        .status(404)
        .json({ error: "Booking not found or already cancelled." });

    const b = booking.rows[0];
    const cancelTz = b.clinic_timezone || "America/Chicago";
    const cancelTimeStr = DateTime.fromJSDate(new Date(b.start_time), {
      zone: "utc",
    })
      .setZone(cancelTz)
      .toFormat("yyyy-MM-dd HH:mm");

    // Remove from Google Calendar
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

    // Notify client
    try {
      await sendMail(b.clinic_email, {
        to: b.client_email,
        subject: `Booking cancelled: ${b.event_name}`,
        text: `Hello ${b.client_name},\n\nYour appointment on ${cancelTimeStr} (${cancelTz}) has been cancelled.\n\nPlease get in touch to reschedule.`,
      });

      // Notify clinic
      await sendMail(b.clinic_email, {
        to: b.clinic_email,
        subject: `Cancellation: ${b.client_name} – ${b.event_name}`,
        text: `${b.client_name} cancelled their ${b.event_name} on ${cancelTimeStr} (${cancelTz}).`,
      });
    } catch (mailErr) {
      console.log("[MAIL] Cancellation email failed:", mailErr.message);
    }

    res.json({ success: true, message: "Booking cancelled." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel booking." });
  }
});

export default router;
