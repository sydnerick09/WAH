// pages/api/admin/send-email.js
// Admin-only: send an email to one registered client.
// SMTP credentials stay server-side and are never exposed to the browser.

import nodemailer from 'nodemailer';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bodyToHtml(body, name) {
  const greetingDone = /dear\s/i.test(body.slice(0, 40));
  const intro = greetingDone ? '' : `<p>Hi ${esc(name) || 'there'},</p>`;
  const paragraphs = String(body)
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
      ${intro}${paragraphs}
      <p style="margin-top:18px;color:#1f2937;font-weight:600;">— The Gweno Hub Team</p>
    </div>`;
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: { user, pass },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { adminSecret, to, name, subject, body } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const email = String(to || '').trim().toLowerCase();
  const subj = String(subject || '').trim();
  const rawBody = String(body || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid recipient email is required.',
    });
  }

  if (!subj || !rawBody) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message cannot be empty.',
    });
  }

  const transporter = getTransporter();

  if (!transporter) {
    return res.status(500).json({
      success: false,
      configured: false,
      message: 'Email (SMTP) is not configured.',
    });
  }

  try {
    await transporter.sendMail({
      from: `"Gweno Hub" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subj,
      text: rawBody,
      html: bodyToHtml(rawBody, name),
    });

    try { transporter.close(); } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Email sent to ${email}.`,
    });
  } catch (err) {
    try { transporter.close(); } catch (_) {}

    console.error('[admin/send-email] send error:', err);

    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to send email.',
    });
  }
}
