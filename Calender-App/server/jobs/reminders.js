import cron from "node-cron";
import pool from "../db.js";
import { sendMail } from "../mail.js";
import { DateTime } from "luxon";

// ── Mail ────────────────────────────────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════
//  CRON — Reminder emails (runs every 15 min)
// ════════════════════════════════════════════════════════════════════════════
export function startReminderCron() {
  cron.schedule("*/15 * * * *", async () => {
    try {
      // 24-hour reminders (sent in a ±15 min window around the 24h mark)
      const due24h = await pool.query(`
        SELECT b.*, et.name AS event_name, et.custom_reminder_template, et.clinic_email, gc.timezone AS clinic_timezone
        FROM bookings b
        JOIN event_types et ON et.id = b.event_type_id
        JOIN google_credentials gc ON gc.email = et.clinic_email
        WHERE b.reminder_24h = FALSE
          AND b.status = 'confirmed'
          AND b.start_time BETWEEN NOW() + INTERVAL '23 hours 45 minutes'
                                AND NOW() + INTERVAL '24 hours 15 minutes'
      `);
      for (const b of due24h.rows) {
        try {
          const clinicTz = b.clinic_timezone || "America/Chicago";
          const timeStr = DateTime.fromJSDate(new Date(b.start_time), {
            zone: "utc",
          })
            .setZone(clinicTz)
            .toFormat("HH:mm");

          const notesText = b.meeting_notes
            ? `\n\nNotes provided:\n${b.meeting_notes}`
            : "";

          const body = b.custom_reminder_template
            ? b.custom_reminder_template
                .replace(/{{clientName}}/g, b.client_name)
                .replace(/{{eventName}}/g, b.event_name)
                .replace(/{{startTime}}/g, timeStr)
            : `Hello ${b.client_name},\n\nA reminder that your ${b.event_name} is tomorrow at ${timeStr} (${clinicTz}).\n\nSee you then!`;

          await sendMail(b.clinic_email, {
            to: b.client_email,
            subject: `Reminder: ${b.event_name} tomorrow`,
            text: body + notesText,
          });

          // Also notify clinic staff
          // const etRes = await pool.query(
          //   "SELECT clinic_email FROM event_types WHERE id = $1",
          //   [b.event_type_id],
          // );
          // if (etRes.rowCount > 0) {
          //   await sendMail({
          //     to: etRes.rows[0].clinic_email,
          //     subject: `Reminder: ${b.client_name} — ${b.event_name} tomorrow`,
          //     text: `${b.client_name}'s ${b.event_name} is tomorrow at ${timeStr}.`,
          //   });
          // }
          await sendMail(b.clinic_email, {
            to: b.clinic_email,
            subject: `Reminder: ${b.client_name} — ${b.event_name} tomorrow`,
            text: `${b.client_name}'s ${b.event_name} is tomorrow at ${timeStr}. ${notesText}`,
          });

          await pool.query(
            "UPDATE bookings SET reminder_24h = TRUE WHERE id = $1",
            [b.id],
          );
        } catch (err) {
          console.error(`[CRON] 24h reminder sweep failed #${b.id}: `, err);
        }
      }
      // 1-hour reminders
      try {
        const due1h = await pool.query(`
        SELECT b.*, et.name AS event_name, et.clinic_email, gc.timezone AS clinic_timezone
        FROM bookings b
        JOIN event_types et ON et.id = b.event_type_id
        JOIN google_credentials gc ON gc.email = et.clinic_email
        WHERE b.reminder_1h = FALSE
          AND b.status = 'confirmed'
          AND b.start_time BETWEEN NOW() + INTERVAL '45 minutes'
                                AND NOW() + INTERVAL '75 minutes'
      `);

        for (const b of due1h.rows) {
          const notesText = b.meeting_notes
            ? `\n\nNotes provided:\n${b.meeting_notes}`
            : "";

          await sendMail(b.clinic_email, {
            to: b.client_email,
            subject: `Starting soon: ${b.event_name}`,
            text: `Hello ${b.client_name},\n\nYour ${b.event_name} starts in about 1 hour. See you soon! ${notesText}`,
          });

          await sendMail(b.clinic_email, {
            to: b.clinic_email,
            subject: `Starting soon: ${b.client_name} — ${b.event_name}`,
            text: `${b.client_name}'s ${b.event_name} starts in about 1 hour. ${notesText}`,
          });

          await pool.query(
            "UPDATE bookings SET reminder_1h = TRUE WHERE id = $1",
            [b.id],
          );
        }
      } catch (err) {
        console.error(`[CRON] Failed 1h remind for booking: `, err);
      }
    } catch (err) {
      console.error(`[CRON] Reminder sweep failed:`, err);
    }
  });

  console.log("[CRON] Reminder job scheduled (every 15 min).");
}
