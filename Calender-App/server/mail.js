import nodemailer from "nodemailer";
import { google } from "googleapis";
import pool from "./db.js";

// — Mail helper
// Uses the clinic's Google OAuth refresh_token to send email via Gmail SMTP.
// No App Password needed – XOAUTH2 handles authentication.
// —————————————————————————————————————————————————————————————————————

/*
 Send an email via Gmail SMTP using the clinic's OAuth token.
 The clinic must have logged in via Google OAuth (refresh_token stored in DB).

 @param {string} clinicEmail - The clinic's Google email (sender)
 @param {object} opts
 @param {string} opts.to - Recipient email
 @param {string} opts.subject - Email subject
 @param {string} opts.text - Plain text body
 @param {string} [opts.html] - HTML body (optional)
 */
export async function sendMail(clinicEmail, opts) {
  // Look up the clinic's refresh token
  const res = await pool.query(
    "SELECT refresh_token FROM google_credentials WHERE email = $1",
    [clinicEmail],
  );
  if (res.rowCount === 0)
    throw new Error(`No Google credentials for ${clinicEmail}`);

  // Get a fresh access token using the refresh token
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL,
  );
  oauth2Client.setCredentials({ refresh_token: res.rows[0].refresh_token });
  const accessToken = await oauth2Client.getAccessToken();

  //Create a transporter authenticated using Clinic gmail
  const mailer = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: clinicEmail,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: res.rows[0].refresh_token,
      accessToken: accessToken.token,
    },
  });

  return mailer.sendMail({
    from: clinicEmail,
    ...opts,
  });
}
