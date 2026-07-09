import crypto from "crypto";
import pool from "../db.js";

// ── Auth middleware ──────────────────────────────────────────────────────────
// All admin routes require: Authorization: Bearer <api_token>
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header required." });
  }

  const token = header.slice(7);
  const result = await pool
    .query(
      "SELECT email, name, slug, timezone FROM google_credentials WHERE api_token = $1",
      [token],
    )
    .catch(() => null);

  if (!result || result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.clinic = result.rows[0]; // { email, name, slug }
  next();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a unique slug by appending a random suffix if needed.
 */
export async function uniqueSlug(baseSlug) {
  let slug = baseSlug;
  while (true) {
    const check = await pool.query(
      "SELECT 1 FROM google_credentials WHERE slug = $1",
      [slug],
    );
    if (check.rowCount === 0) return slug;
    slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
  }
}
