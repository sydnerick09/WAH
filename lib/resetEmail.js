// lib/resetEmail.js — SERVER-ONLY: builds and sends the password-reset email.
import nodemailer from 'nodemailer';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
  });
}

export function buildResetEmail({ userName, resetUrl }) {
  const name = userName || 'there';
  const subject = 'Reset your Gweno password';
  const text = `Hello ${name},

We received a request to reset your Gweno password.

Reset it using the link below. This link expires in 30 minutes and can only be used once:
${resetUrl}

If you didn't request this, you can safely ignore this email, your password will not change.

Gweno Team`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
      <p>Hello <strong>${esc(name)}</strong>,</p>
      <p>We received a request to reset your <strong>Gweno</strong> password.</p>
      <p style="margin:18px 0;">
        <a href="${esc(resetUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;">Reset my password</a>
      </p>
      <p style="font-size:13px;color:#64748B;">This link expires in <strong>30 minutes</strong> and can only be used once. If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="font-size:12px;color:#64748B;word-break:break-all;">${esc(resetUrl)}</p>
      <p style="font-size:13px;color:#64748B;">If you didn't request this, you can safely ignore this email, your password will not change.</p>
      <p style="color:#111827;font-weight:700;margin-top:14px;">Gweno Team</p>
    </div>`;

  return { subject, text, html };
}

// Never throws; returns { success, message?, configured? }.
export async function sendResetEmail({ userEmail, userName, resetUrl }) {
  try {
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(userEmail))) {
      return { success: false, message: 'Invalid recipient email.' };
    }
    const transporter = getTransporter();
    if (!transporter) return { success: false, configured: false, message: 'SMTP not configured.' };

    const { subject, text, html } = buildResetEmail({ userName, resetUrl });
    await transporter.sendMail({
      from: `"Gweno" <${process.env.SMTP_USER}>`,
      to: String(userEmail),
      subject, text, html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, message: err?.message || 'Send failed.' };
  }
}
