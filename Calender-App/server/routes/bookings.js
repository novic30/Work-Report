import { Router } from "express";
import { google } from "googleapis";
import crypto from "crypto";
import { sendMail } from "../mail.js";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── Mail helper ─────────────────────────────────────────────────────────────

// const mailer = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

// async function sendMail(opts) {
//   return mailer
//     .sendMail({ from: process.env.SMTP_USER, ...opts })
//     .catch((err) =>
//       console.error(`[MAIL] Failed to ${opts.to}: ${err.message}`),
//     );
// }

// ── Google Calendar helper ──────────────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════
//  BOOKINGS  (admin — requires auth)
// ════════════════════════════════════════════════════════════════════════════

// List bookings for the clinic. Query params: status, from, to
// GET /api/bookings
router.get("/", requireAuth, async (req, res) => {
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

// Get booking stats for dashboard
// GET /api/bookings/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const upcoming = await pool.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       WHERE et.clinic_email = $1 AND b.status = 'confirmed'
       AND b.start_time >= NOW()`,
      [req.clinic.email],
    );
    const today = await pool.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       WHERE et.clinic_email = $1 AND b.status = 'confirmed'
       AND b.start_time::date = CURRENT_DATE`,
      [req.clinic.email],
    );
    const total = await pool.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN event_types et ON et.id = b.event_type_id
       WHERE et.clinic_email = $1`,
      [req.clinic.email],
    );
    const eventTypes = await pool.query(
      "SELECT COUNT(*) FROM event_types WHERE clinic_email = $1 AND is_active = TRUE",
      [req.clinic.email],
    );

    res.json({
      stats: {
        upcoming: parseInt(upcoming.rows[0].count),
        today: parseInt(today.rows[0].count),
        total: parseInt(total.rows[0].count),
        activeEventTypes: parseInt(eventTypes.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Cancel a booking (marks as cancelled, removes from Google Calendar)
// DELETE /api/bookings/:id
router.delete("/:id", requireAuth, async (req, res) => {
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

    // Notify client of cancellation
    await sendMail(b.clinic_email, {
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

export default router;
export { getCalendarClient, sendMail };
