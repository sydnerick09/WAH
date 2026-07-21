// pages/api/broadcast.js
// Admin-only: emails a message to EVERY registered client in the database.
// Protected by ADMIN_SECRET. Fetches all user emails from Supabase (service
// role) and sends them the given subject/body via the Gmail SMTP account.
//   ADMIN_SECRET                 = same secret used by the admin panel
//   SUPABASE_SERVICE_ROLE_KEY    = server-side Supabase key (see /api/db)
//   SMTP_USER / SMTP_PASS        = Gmail address + App Password (see /api/notify)
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Default message — the Business Hub welcome / announcement.
const DEFAULT_SUBJECT = 'Welcome to Business Hub';
const DEFAULT_BODY = `Dear Client,

Welcome to Business Hub! We are delighted to have you as part of our community.

We have been working hard to improve our services and address your concerns. We are pleased to introduce a few simple steps that will make it easier for you to manage your Activation Fee and Premium Fee at your convenience.

We also encourage you to carefully complete the available tasks and assessments, as they provide genuine earning opportunities that can help you cover your activation and premium fees.

For your security, we kindly ask you to withdraw your earnings promptly. In line with our policies, Business Hub does not hold clients' funds. We operate as a secure bridge between clients and service providers, not as a bank.

Our mission is to create opportunities, empower our community, and give back to society through a reliable and transparent platform.

Thank you for choosing Business Hub. We look forward to supporting your success.`;

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Turn a plain-text body into simple HTML paragraphs.
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
      <p style="margin-top:18px;color:#125C37;font-weight:600;">— The Business Hub Team</p>
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
    secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { adminSecret, subject, body, test } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(200).json({ success: false, configured: false, message: 'Email (SMTP) is not configured.' });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(200).json({ success: false, configured: false, message: 'Database is not configured.' });
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  // Prefer excluding opted-out users; fall back gracefully if the `unsubscribed`
  // column hasn't been added yet (db/admin-tables.sql not run).
  let { data: rows, error } = await db.from('users').select('email, full_name, unsubscribed');
  if (error) {
    ({ data: rows, error } = await db.from('users').select('email, full_name'));
  }
  if (error) return res.status(500).json({ success: false, message: error.message });

  // Unique, valid, lower-cased recipient list — excluding opted-out users
  const seen = new Set();
  let recipients = (rows || [])
    .filter(r => !r.unsubscribed)
    .map(r => ({ email: String(r.email || '').trim().toLowerCase(), name: r.full_name || '' }))
    .filter(r => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) || seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

  // `test: true` sends only to the admin's own inbox for a dry run.
  if (test) {
    const adminEmail = (process.env.NOTIFY_EMAIL || process.env.SMTP_USER || '').toLowerCase();
    recipients = adminEmail ? [{ email: adminEmail, name: 'Admin (test)' }] : [];
  }

  const subj    = (subject && String(subject).trim()) || DEFAULT_SUBJECT;
  const rawBody = (body && String(body).trim()) || DEFAULT_BODY;
  const from    = `"Business Hub" <${process.env.SMTP_USER}>`;

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const r of recipients) {
    try {
      await transporter.sendMail({
        from,
        to: r.email,
        subject: subj,
        text: rawBody,
        html: bodyToHtml(rawBody, r.name),
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      if (errors.length < 20) errors.push({ email: r.email, error: err.message });
      console.error('[broadcast] send error:', r.email, err.message);
    }
  }

  try { transporter.close(); } catch (_) {}

  return res.status(200).json({
    success: sent > 0 || recipients.length === 0,
    configured: true,
    total: recipients.length,
    sent,
    failed,
    test: Boolean(test),
    errors,
  });
}
