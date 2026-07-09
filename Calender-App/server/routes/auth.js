import { Router } from "express";
import { google } from "googleapis";
import crypto from "crypto";
import pool from "../db.js";
import { slugify, uniqueSlug } from "../middleware/auth.js";

const router = Router();

// ── Google OAuth client ─────────────────────────────────────────────────────
const oauthClient = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL,
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.send",
];

// Temporary in-memory store for pending auth claims.
// key = claimToken (random hex), value = { token: apiToken, user: {...} }
// Each claim is deleted after first use or after 2 minutes.
const authClaims = new Map();

// ── Step 1: redirect to Google sign-in ──────────────────────────────────────
// GET /google
router.get("/google", (req, res) => {
  const authUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", //req.query.force === "true" ? "consent" : "select_account",
  });
  res.redirect(authUrl);
});

// ── Step 2: Google redirects here after consent ─────────────────────────────
// GET /api/auth/callback?code=xxx
router.get("/api/auth/callback", async (req, res) => {
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
        `[OAUTH] No refresh_token for new account ${email}.`, // — forcing consent.`,
      );
      //   return res.redirect("/google?force=true");
    }

    // Generate unique slug for new users
    let slug;
    if (existing.rowCount > 0) {
      slug = existing.rows[0].slug;
    } else {
      slug = await uniqueSlug(slugify(email.split("@")[0]));
    }

    const refreshToken =
      tokens.refresh_token || existing.rows[0]?.refresh_token;
    const apiToken = crypto.randomBytes(32).toString("hex");

    // Auto-detect timezone from Google Calendar
    let timezone =
      existing.rowCount > 0 ? existing.rows[0].timezone : "America/Chicago";
    try {
      const calAuth = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URL,
      );
      calAuth.setCredentials({ refresh_token: refreshToken });
      const calendar = google.calendar({ version: "v3", auth: calAuth });
      const settings = await calendar.settings.get({ setting: "timezone" });
      if (settings.data.value) {
        timezone = settings.data.value;
      }
    } catch (tzErr) {
      console.warn("[OAUTH] Could not detect timezone:", tzErr.message);
    }

    await pool.query(
      `INSERT INTO google_credentials (email, name, slug, refresh_token, api_token, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         name          = EXCLUDED.name,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_credentials.refresh_token),
         api_token     = EXCLUDED.api_token,
         timezone      = EXCLUDED.timezone,
         updated_at    = NOW()`,
      [email, name, slug, refreshToken, apiToken, timezone],
    );

    // Create a short-lived claim token (one-time use, expires in 2 min)
    const claimToken = crypto.randomBytes(32).toString("hex");
    authClaims.set(claimToken, {
      token: apiToken,
      user: { email, name, slug },
    });
    setTimeout(() => authClaims.delete(claimToken), 2 * 60 * 1000);

    // Redirect the browser to the frontend's callback page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?claim=${claimToken}`);
  } catch (err) {
    console.error("[OAUTH] Callback error:", err);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
  }
});

// ── Step 3: Frontend exchanges claim token for real API token ────────────────
// GET /api/auth/claim/:claimToken
router.get("/api/auth/claim/:claimToken", (req, res) => {
  const claim = authClaims.get(req.params.claimToken);
  if (!claim) {
    return res.status(404).json({ error: "Claim not found or already used." });
  }
  authClaims.delete(req.params.claimToken); // one-time use
  res.json(claim); // { token: string, user: { email, name, slug } }
});

// ── Verify token and return current user info ───────────────────────────────
// GET /api/me
import { requireAuth } from "../middleware/auth.js";

router.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.clinic });
});

export default router;
