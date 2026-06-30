import pkg from "pg";
import "dotenv/config.js";

const { Pool } = pkg;

const logRed = (t) => console.log(`\x1b[31m${t}\x1b[0m`);
const logGreen = (t) => console.log(`\x1b[92m${t}\x1b[0m`);

// ── Schema ──────────────────────────────────────────────────────────────────
// Everything is written through the API at runtime — nothing is seeded here.
//
// google_credentials  — one row per clinic owner (Google account)
// event_types         — each clinic's bookable services (replaces Cal.com "event types")
// availabilities      — per-event-type weekly schedule
// bookings            — confirmed/cancelled appointments
// ────────────────────────────────────────────────────────────────────────────
const SCHEMA = `
  DROP TABLE IF EXISTS bookings, consultant_availabilities, consultants, google_credentials CASCADE;

  CREATE TABLE IF NOT EXISTS google_credentials (
    id           SERIAL PRIMARY KEY,
    email        VARCHAR(255) UNIQUE NOT NULL,
    name         VARCHAR(255),
    slug         VARCHAR(255) UNIQUE NOT NULL,   -- e.g. "techclinic" → /techclinic/...
    refresh_token TEXT,
    api_token    VARCHAR(255) UNIQUE,            -- bearer token returned to the UI after OAuth
    updated_at   TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS event_types (
    id                       SERIAL PRIMARY KEY,
    clinic_email             VARCHAR(255) REFERENCES google_credentials(email) ON DELETE CASCADE,
    name                     VARCHAR(255) NOT NULL,
    slug                     VARCHAR(255) NOT NULL,   -- e.g. "90-min-consult" → /techclinic/90-min-consult
    description              TEXT,
    google_calendar_id       VARCHAR(255) DEFAULT 'primary',
    lead_time_hours          INT  DEFAULT 24,
    slot_duration_minutes    INT  DEFAULT 30,
    step_minutes             INT  DEFAULT 30,         -- interval between slot start times
    custom_reminder_template TEXT,                    -- supports {{clientName}} {{eventName}} {{startTime}}
    is_active                BOOLEAN DEFAULT TRUE,
    UNIQUE(clinic_email, slug)
  );

  CREATE TABLE IF NOT EXISTS availabilities (
    id             SERIAL PRIMARY KEY,
    event_type_id  INT REFERENCES event_types(id) ON DELETE CASCADE,
    day_of_week    INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    UNIQUE(event_type_id, day_of_week)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id              SERIAL PRIMARY KEY,
    event_type_id   INT REFERENCES event_types(id) ON DELETE CASCADE,
    client_name     VARCHAR(255) NOT NULL,
    client_email    VARCHAR(255) NOT NULL,
    start_time      TIMESTAMP   NOT NULL,
    end_time        TIMESTAMP   NOT NULL,
    google_event_id VARCHAR(255),                -- stored so we can cancel on Google Calendar
    status          VARCHAR(50) DEFAULT 'confirmed',
    reminder_24h    BOOLEAN DEFAULT FALSE,
    reminder_1h     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
  );
`;

async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  const dbName = dbUrl.substring(dbUrl.lastIndexOf("/") + 1);
  const sysUrl = dbUrl.substring(0, dbUrl.lastIndexOf("/")) + "/postgres";

  // Ensure the target database exists
  const sysPool = new Pool({ connectionString: sysUrl });
  try {
    const check = await sysPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (check.rowCount === 0) {
      await sysPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[DB] Created database: ${dbName}`);
    }
  } catch (err) {
    logRed(`[DB] Bootstrap warning: ${err.message}`);
  } finally {
    await sysPool.end();
  }

  const pool = new Pool({ connectionString: dbUrl });
  try {
    await pool.query(SCHEMA);
    logGreen(`[DB] Schema verified — ready.`);
  } catch (err) {
    logRed(`[DB] Schema init failed: ${err.stack}`);
    throw err;
  }

  return pool;
}

const pool = await initDb();
export default pool;
