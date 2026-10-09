// pages/api/broadcast.js
// Admin-only: sends a message to a selected registered-client group.
// Protected by ADMIN_SECRET; sends through Namecheap Private Email SMTP.

import { createClient } from '@supabase/supabase-js';
import { createEmailTransport } from '../../lib/emailTransport';

const DEFAULT_SUBJECT = 'Welcome to Gweno Hub';
const DEFAULT_BODY = `Dear Client,

Welcome to Gweno Hub! We are delighted to have you as part of our community.

We have been working hard to improve our services and address your concerns. We are pleased to introduce a few simple steps that will make it easier for you to manage your Activation Fee and Premium Fee at your convenience.

We also encourage you to carefully complete the available tasks and assessments, as they provide genuine earning opportunities that can help you cover your activation and premium fees.

For your security, we kindly ask you to withdraw your earnings promptly. In line with our policies, Gweno Hub does not hold clients' funds. We operate as a secure bridge between clients and service providers, not as a bank.

Our mission is to create opportunities, empower our community, and give back to society through a reliable and transparent platform.

Thank you for choosing Gweno Hub. We look forward to supporting your success.`;

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  return createEmailTransport('broadcast');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { adminSecret, subject, body, test, recipientType = 'all' } = req.body || {};
  const allowedRecipientTypes = ['all', 'active', 'inactive', 'premium', 'basic'];
  if (!test && !allowedRecipientTypes.includes(recipientType)) {
    return res.status(400).json({ success: false, message: 'Invalid recipient group.' });
  }
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

  let { data: rows, error } = await db.from('users').select('id, email, full_name, unsubscribed, premium, premium_paid_at, task_submissions');
  if (error) {
    ({ data: rows, error } = await db.from('users').select('id, email, full_name, unsubscribed'));
  }
  if (error) return res.status(500).json({ success: false, message: error.message });

  const now = Date.now();
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const matchesGroup = (r) => {
    const submissions = r.task_submissions || {};
    const activatedAt = Number(submissions._act || 0);
    const active = !!activatedAt && now <= activatedAt + ONE_MONTH_MS;
    const premiumPaidAt = Number(r.premium_paid_at || 0);
    const premium = !!r.premium && !!premiumPaidAt && now <= premiumPaidAt + ONE_MONTH_MS;
    if (recipientType === 'active') return active;
    if (recipientType === 'inactive') return !active;
    if (recipientType === 'premium') return premium;
    if (recipientType === 'basic') return !premium;
    return true;
  };

  const seen = new Set();
  let recipients = (rows || [])
    .filter(r => !r.unsubscribed && matchesGroup(r))
    .map(r => ({ email: String(r.email || '').trim().toLowerCase(), name: r.full_name || '' }))
    .filter(r => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) || seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

  if (test) {
    const adminEmail = (process.env.NOTIFY_EMAIL || process.env.SMTP_USER || '').toLowerCase();
    recipients = adminEmail ? [{ email: adminEmail, name: 'Admin (test)' }] : [];
  }

  const subj = (subject && String(subject).trim()) || DEFAULT_SUBJECT;
  const rawBody = (body && String(body).trim()) || DEFAULT_BODY;
  const from = `"Gweno Hub" <${process.env.SMTP_USER}>`;

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
    recipientType: test ? 'test' : recipientType,
    errors,
  });
}
