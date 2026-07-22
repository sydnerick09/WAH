// pages/api/correction-email.js
// Admin-only: sends the "Task Submission Returned for Corrections" email to a
// single user. The Task Name is inserted automatically and the correction
// Reason is editable from the admin panel before sending. Dynamic placeholders
// ({TASK_NAME}, {USER_NAME}, {USER_EMAIL}, {UNSUBSCRIBE_LINK}) are replaced here.
//   ADMIN_SECRET               = same secret the admin panel uses
//   SMTP_USER / SMTP_PASS      = Gmail address + App Password (see /api/notify)
//   SUPABASE_* (optional)      = used only to honour the unsubscribe opt-out
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { unsubscribeUrl } from '../../lib/unsubToken';

const LOGIN_URL = process.env.PUBLIC_BASE_URL || 'https://onlinejob-pi.vercel.app';

const SUBJECT = 'Task Submission Returned for Corrections';

// Plain-text template with the dynamic placeholders.
const TEMPLATE = `Hi {USER_NAME},

Kindly note that your submission has been sent back for corrections.

Reason for Correction:
{CORRECTION_REASON}

Failure to make the required corrections may result in your account being placed on hold.

Log in to ${LOGIN_URL} to view the correction details.

Reference Task:
{TASK_NAME}

If you no longer wish to receive account-related emails, including OTPs and important account notifications, you may unsubscribe using the link below.

Please note that unsubscribing will permanently stop all OTP and account-related email communications.

This message was sent to {USER_EMAIL}.

Unsubscribe: {UNSUBSCRIBE_LINK}`;

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fillTemplate(str, vars) {
  return str
    .replace(/\{USER_NAME\}/g,         vars.userName)
    .replace(/\{USER_EMAIL\}/g,        vars.userEmail)
    .replace(/\{TASK_NAME\}/g,         vars.taskName)
    .replace(/\{CORRECTION_REASON\}/g, vars.reason)
    .replace(/\{UNSUBSCRIBE_LINK\}/g,  vars.unsubscribeLink);
}

function toHtml(vars) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
      <p>Hi ${esc(vars.userName) || 'there'},</p>
      <p>Kindly note that your submission has been <strong>sent back for corrections</strong>.</p>
      <div style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:12px 14px;margin:14px 0;">
        <div style="font-weight:700;color:#374151;margin-bottom:4px;">Reason for Correction</div>
        <div style="white-space:pre-wrap;color:#1f2937;">${esc(vars.reason) || '—'}</div>
      </div>
      <p style="color:#1f2937;"><strong>Failure to make the required corrections may result in your account being placed on hold.</strong></p>
      <p>Log in to <a href="${LOGIN_URL}" style="color:#111827;font-weight:600;">${LOGIN_URL}</a> to view the correction details.</p>
      <p style="margin:14px 0;">
        <span style="font-weight:700;color:#374151;">Reference Task:</span><br/>
        <span style="display:inline-block;margin-top:4px;background:#F1F5F9;border-radius:6px;padding:6px 10px;font-weight:700;color:#0F172A;">${esc(vars.taskName) || '—'}</span>
      </p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:18px 0;"/>
      <p style="font-size:12px;color:#94A3B8;">
        This message was sent to ${esc(vars.userEmail)}. If you no longer wish to receive account-related emails,
        including OTPs and important account notifications, you may
        <a href="${esc(vars.unsubscribeLink)}" style="color:#94A3B8;">unsubscribe</a>.
        Unsubscribing will permanently stop all OTP and account-related email communications.
      </p>
      <p style="margin-top:16px;color:#1f2937;font-weight:600;">— The Business Hub Team</p>
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
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { adminSecret, taskName, userName, userEmail, userId, reason } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(userEmail))) {
    return res.status(200).json({ success: false, message: 'A valid recipient email is required.' });
  }

  // Honour the unsubscribe opt-out (best-effort — needs the DB configured).
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key && userId) {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { data: u } = await db.from('users').select('unsubscribed').eq('id', userId).maybeSingle();
      if (u && u.unsubscribed) {
        return res.status(200).json({ success: false, unsubscribed: true, message: 'This user has unsubscribed from emails.' });
      }
    }
  } catch (_) { /* if the check fails, still allow the important correction notice */ }

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(200).json({ success: false, configured: false, message: 'Email (SMTP) is not configured.' });
  }

  const vars = {
    userName:        userName || 'there',
    userEmail:       String(userEmail),
    taskName:        taskName || 'your task',
    reason:          (reason && String(reason).trim()) || 'Please review and resubmit your work.',
    unsubscribeLink: unsubscribeUrl(userId || userEmail),
  };

  try {
    await transporter.sendMail({
      from: `"Business Hub" <${process.env.SMTP_USER}>`,
      to: vars.userEmail,
      subject: SUBJECT,
      text: fillTemplate(TEMPLATE, vars),
      html: toHtml(vars),
    });
    return res.status(200).json({ success: true, configured: true });
  } catch (err) {
    console.error('[correction-email] send error:', err.message);
    return res.status(200).json({ success: false, configured: true, message: err.message });
  }
}
