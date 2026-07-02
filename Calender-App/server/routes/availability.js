import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ════════════════════════════════════════════════════════════════════════════
//  AVAILABILITY  (admin — requires auth)
// ════════════════════════════════════════════════════════════════════════════

// Get availability for an event type
// GET /api/event-types/:id/availability
router.get("/:id/availability", requireAuth, async (req, res) => {
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

// Replace the full weekly schedule for an event type
// PUT /api/event-types/:id/availability
// Body: { availability: [{ dayOfWeek, startTime, endTime }] }
router.put("/:id/availability", requireAuth, async (req, res) => {
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

    // Full replace — delete then insert
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

export default router;
