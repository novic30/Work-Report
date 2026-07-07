import "dotenv/config.js";
import express from "express";
import cors from "cors";

// Route imports
import authRoutes from "./routes/auth.js";
import eventTypeRoutes from "./routes/eventTypes.js";
import availabilityRoutes from "./routes/availability.js";
import bookingRoutes from "./routes/bookings.js";
import publicRoutes from "./routes/public.js";
import { startReminderCron } from "./jobs/reminders.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use(authRoutes); // /google, /api/auth/*, /api/me
app.use("/api/event-types", eventTypeRoutes); // CRUD for event types
app.use("/api/event-types", availabilityRoutes); // /api/event-types/:id/availability
app.use("/api/bookings", bookingRoutes); // Admin bookings
app.use("/api/public", publicRoutes); // Public booking flow

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// ── Start ───────────────────────────────────────────────────────────────────
startReminderCron();

app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
