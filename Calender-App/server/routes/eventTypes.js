import { Router } from "express";
import pool from "../db.js";
import { requireAuth, slugify } from "../middleware/auth.js";

const router = Router();

// ════════════════════════════════════════════════════════════════════════════
//  EVENT TYPES  (admin — requires auth)
//  These are the bookable services, e.g. "90-min consult", "30-min intro call"
// ════════════════════════════════════════════════════════════════════════════

// List all event types for the authenticated clinic (includes their availability)
// GET /api/event-types
router.get("/", requireAuth, async (req, res) => {
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

// Get a single event type by ID
// GET /api/event-types/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT et.*,
         COALESCE(
           json_agg(a ORDER BY a.day_of_week) FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS availability
       FROM event_types et
       LEFT JOIN availabilities a ON a.event_type_id = et.id
       WHERE et.id = $1 AND et.clinic_email = $2
       GROUP BY et.id`,
      [req.params.id, req.clinic.email],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Event type not found." });
    res.json({ eventType: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event type." });
  }
});

// Create an event type
// POST /api/event-types
router.post("/", requireAuth, async (req, res) => {
  const {
    name,
    description = null,
    googleCalendarId = "primary",
    leadTimeHours = 24,
    slotDurationMinutes = 30,
    stepMinutes = 30,
    bufferTimeMinutes = 0,
    maxAdvanceDays = 30,
    customQuestions = [],
    availability = [],
  } = req.body;

  if (!name) return res.status(400).json({ error: "name is required." });

  const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);

  try {
    const etRes = await pool.query(
      `INSERT INTO event_types
         (clinic_email, name, slug, description, google_calendar_id,
          lead_time_hours, slot_duration_minutes, step_minutes,
          buffer_time_minutes, max_advance_days, custom_questions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
        bufferTimeMinutes,
        maxAdvanceDays,
        JSON.stringify(customQuestions),
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

    // Fetch the full event type with availability
    const full = await pool.query(
      `SELECT et.*,
         COALESCE(
           json_agg(a ORDER BY a.day_of_week) FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS availability
       FROM event_types et
       LEFT JOIN availabilities a ON a.event_type_id = et.id
       WHERE et.id = $1
       GROUP BY et.id`,
      [eventType.id],
    );

    res.status(201).json({ eventType: full.rows[0] });
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

// Update an event type (only fields included in the body are changed)
// PUT /api/event-types/:id
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    googleCalendarId,
    leadTimeHours,
    slotDurationMinutes,
    stepMinutes,
    bufferTimeMinutes,
    maxAdvanceDays,
    customQuestions,
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
         buffer_time_minutes      = COALESCE($8,  buffer_time_minutes),
         max_advance_days         = COALESCE($9,  max_advance_days),
         custom_questions         = COALESCE($10, custom_questions),
         custom_reminder_template = COALESCE($11, custom_reminder_template),
         is_active                = COALESCE($12, is_active)
       WHERE id = $13 AND clinic_email = $14
       RETURNING *`,
      [
        name,
        slug ? slugify(slug) : null,
        description,
        googleCalendarId,
        leadTimeHours,
        slotDurationMinutes,
        stepMinutes,
        bufferTimeMinutes,
        maxAdvanceDays,
        customQuestions ? JSON.stringify(customQuestions) : null,
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

// Delete an event type (cascades to availabilities and bookings)
// DELETE /api/event-types/:id
router.delete("/:id", requireAuth, async (req, res) => {
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

export default router;
