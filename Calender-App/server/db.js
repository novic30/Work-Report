import pkg from "pg";
import "dotenv/config.js";

const { Pool } = pkg;

const logRed = (t) => console.log(`\x1b[31m${t}\x1b[0m`);
const logGreen = (t) => console.log(`\x1b[92m${t}\x1b[0m`);

// ── Schema ──────────────────────────────────────────────────────────────────
// Uses CREATE TABLE IF NOT EXISTS so existing data survives restarts.
// Tables are only created, never dropped.
// ────────────────────────────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS google_credentials (
    id           SERIAL PRIMARY KEY,
    email        VARCHAR(255) UNIQUE NOT NULL,
    name         VARCHAR(255),
    slug         VARCHAR(255) UNIQUE NOT NULL,
    refresh_token TEXT,
    api_token    VARCHAR(255) UNIQUE,
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    updated_at   TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS event_types (
    id                       SERIAL PRIMARY KEY,
    clinic_email             VARCHAR(255) REFERENCES google_credentials(email) ON DELETE CASCADE,
    name                     VARCHAR(255) NOT NULL,
    slug                     VARCHAR(255) NOT NULL,
    description              TEXT,
    google_calendar_id       VARCHAR(255) DEFAULT 'primary',
    lead_time_hours          INT  DEFAULT 24,
    slot_duration_minutes    INT  DEFAULT 30,
    step_minutes             INT  DEFAULT 30,
    buffer_time_minutes      INT  DEFAULT 0,
    max_advance_days         INT  DEFAULT 30,
    custom_questions         JSONB DEFAULT '[]',
    custom_reminder_template TEXT,
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
    client_phone    VARCHAR(50),
    custom_answers  JSONB DEFAULT '{}',
    start_time      TIMESTAMPTZ   NOT NULL,
    end_time        TIMESTAMPTZ   NOT NULL,
    google_event_id VARCHAR(255),
    status          VARCHAR(50) DEFAULT 'confirmed',
    reminder_24h    BOOLEAN DEFAULT FALSE,
    reminder_1h     BOOLEAN DEFAULT FALSE,
    cancel_token    VARCHAR(255) UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    meeting_notes   TEXT
  );

  -- Add columns if they don't exist (for upgrades from the old schema)
  DO $$ BEGIN
    ALTER TABLE event_types ADD COLUMN IF NOT EXISTS buffer_time_minutes INT DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE event_types ADD COLUMN IF NOT EXISTS max_advance_days INT DEFAULT 30;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE event_types ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50);
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_token VARCHAR(255) UNIQUE;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_notes TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE google_credentials ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Chicago';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$;
  
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
