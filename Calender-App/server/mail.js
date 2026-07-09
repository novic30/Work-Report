import nodemailer from "nodemailer";

// — Mail helper
// Uses a dedicated SMTP email from .env to send email reminders
// —————————————————————————————————————————————————————————————————————
const mailer = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });

/*
 Send an email via SMTP .env creds
 */
export async function sendMail(clinicEmail, opts) {
  // Look up the clinic's refresh token
  return mailer.sendMail({
    from: process.env.SMTP_USER,
    ...opts,
  });
}
