// pages/api/broadcast.js
// Admin-only: sends a message to a selected registered-client group.
// Protected by ADMIN_SECRET; sends through the configured Gmail SMTP account.

import { createClient } from '@supabase/supabase-js';
import { createEmailTransport } from '../../lib/emailTransport';
import { unsubscribeUrl } from '../../lib/unsubToken';
import crypto from 'node:crypto';

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

function bodyToHtml(body, name, optOutUrl) {
  const greetingDone = /dear\s/i.test(body.slice(0, 40));
  const intro = greetingDone ? '' : `<p>Hi ${esc(name) || 'there'},</p>`;
  const paragraphs = String(body)
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
  const optOutFooter = optOutUrl
    ? `<p style="margin-top:22px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">To stop receiving promotional and broadcast emails from Gweno Hub, <a href="${esc(optOutUrl)}">unsubscribe here</a>.</p>`
    : '';
  return `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
      ${intro}${paragraphs}
      <p style="margin-top:18px;color:#1f2937;font-weight:600;">— The Gweno Hub Team</p>
      ${optOutFooter}
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

  let transporter;
  try {
    transporter = getTransporter();
  } catch (err) {
    console.error('[broadcast] SMTP configuration error:', err?.message || err);
    return res.status(503).json({ success: false, configured: false, message: err?.message || 'Gmail SMTP is not configured.' });
  }


  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(200).json({ success: false, configured: false, message: 'Database is not configured.' });
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  // Supabase returns a limited number of rows per request. Page through the
  // full table so broadcasts do not silently omit clients beyond the first page.
  const PAGE_SIZE = 1000;
  const rows = [];
  let offset = 0;
  let queryError = null;
  while (true) {
    const result = await db
      .from('users')
      .select('id, email, full_name, unsubscribed, premium, premium_paid_at, task_submissions')
      .range(offset, offset + PAGE_SIZE - 1);
    if (result.error) {
      queryError = result.error;
      break;
    }
    const page = result.data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  if (queryError) {
    // Do not silently fall back to incomplete recipient data: targeting groups
    // requires activation and Premium fields to be present and correctly read.
    return res.status(500).json({
      success: false,
      message: 'Could not load the complete client list. Check the users table fields and database permissions.',
    });
  }

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
  let recipients = rows
    .filter(r => !r.unsubscribed && !(r.task_submissions || {})._marketingUnsubscribed && matchesGroup(r))
    .map(r => ({ id: r.id, email: String(r.email || '').trim().toLowerCase(), name: r.full_name || '' }))
    .filter(r => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) || seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

  if (test) {
    const adminEmail = (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.RESEND_REPLY_TO_EMAIL || '').trim().toLowerCase();
    recipients = adminEmail ? [{ email: adminEmail, name: 'Admin (test)' }] : [];
  }

  const subj = (subject && String(subject).trim()) || DEFAULT_SUBJECT;
  const rawBody = (body && String(body).trim()) || DEFAULT_BODY;
  // A stable campaign key lets interrupted broadcasts resume without resending
  // messages Gmail already accepted. Run db/broadcast-tracking.sql once in Supabase.
  const campaignKey = crypto.createHash('sha256')
    .update(JSON.stringify({ subject: subj, body: rawBody, recipientType: test ? 'test' : recipientType }))
    .digest('hex');
  let trackingReady = false;
  const trackingByEmail = new Map();
  if (!test) {
    const { data: tracked, error: trackingError } = await db.from('broadcast_recipients')
      .select('email,status').eq('campaign_key', campaignKey);
    if (trackingError) {
      try { transporter.close(); } catch (_) {}
      return res.status(503).json({
        success: false, configured: true,
        message: 'Broadcast tracking is not ready. Run db/broadcast-tracking.sql in Supabase, then retry.',
      });
    }
    (tracked || []).forEach(row => trackingByEmail.set(String(row.email).toLowerCase(), row.status));
    const missing = recipients.filter(r => !trackingByEmail.has(r.email));
    if (missing.length) {
      const { error: insertError } = await db.from('broadcast_recipients').insert(missing.map(r => ({
        campaign_key: campaignKey, email: r.email,
        // The users table may use timestamp/string IDs rather than UUIDs.
        // broadcast_recipients.user_id is UUID, so only store IDs that are valid UUIDs.
        user_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(r.id || '')) ? String(r.id) : null,
        full_name: r.name || '', status: 'pending', last_error: null,
      })));
      if (insertError) {
        try { transporter.close(); } catch (_) {}
        return res.status(503).json({ success: false, configured: true, message: 'Could not initialize broadcast tracking: ' + insertError.message });
      }
      missing.forEach(r => trackingByEmail.set(r.email, 'pending'));
    }
    recipients = recipients.filter(r => trackingByEmail.get(r.email) !== 'accepted');
    trackingReady = true;
  }
  const markRecipient = async (email, status, errorText = null) => {
    if (!trackingReady) return;
    const { error } = await db.from('broadcast_recipients').update({
      status, last_error: errorText, updated_at: new Date().toISOString(),
    }).eq('campaign_key', campaignKey).eq('email', email);
    if (error) console.error('[broadcast] tracking update failed:', email, error.message);
    trackingByEmail.set(email, status);
  };
  const configuredBase = process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const requestHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const requestProto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const baseUrl = (configuredBase || (requestHost ? `${requestProto}://${requestHost}` : '')).replace(/\/$/, '');

  let sent = 0; // Accepted by Gmail SMTP; acceptance does not guarantee inbox delivery.
  let failed = 0;
  const errors = [];
  const recordError = (email, err) => {
    failed += 1;
    if (errors.length < 20) errors.push({ email, error: String(err?.message || err || 'Unknown Gmail SMTP error') });
    console.error('[broadcast] send error:', email, err?.message || err);
  };

  // Send with low concurrency and bounded exponential backoff for temporary SMTP errors.
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const isTemporary = err => /(?:^|\\D)(?:421|450|451|452|454)(?:\\D|$)|4\\.7\\.0|temporar|timeout|timed out|connection reset|socket hang up|try again/i.test(String(err?.message || err));
  const MAX_ATTEMPTS = 4;
  for (const r of recipients) {
    const optOutUrl = r.id && baseUrl ? unsubscribeUrl(r.id, baseUrl) : '';
    const textBody = optOutUrl
      ? `${rawBody}\\n\\n— The Gweno Hub Team\\n\\nTo stop receiving promotional and broadcast emails from Gweno Hub, unsubscribe here: ${optOutUrl}`
      : `${rawBody}\\n\\n— The Gweno Hub Team`;
    const message = {
      to: r.email, subject: subj, text: textBody,
      html: bodyToHtml(rawBody, r.name, optOutUrl),
    };
    if (optOutUrl) message.headers = { 'List-Unsubscribe': `<${optOutUrl}>` };

    let lastError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        await transporter.sendMail(message);
        sent += 1;
        await markRecipient(r.email, 'accepted');
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (!isTemporary(err) || attempt === MAX_ATTEMPTS) break;
        await sleep(Math.min(30000, 1000 * (2 ** (attempt - 1))));
      }
    }
    if (lastError) {
      await markRecipient(r.email, 'failed', String(lastError.message || lastError).slice(0, 1000));
      recordError(r.email, lastError);
    }
    // Keep Gmail request pressure low, even when the provider responds quickly.
    await sleep(350);
  }

  try { transporter.close(); } catch (_) {}

  return res.status(200).json({
    success: sent > 0 || recipients.length === 0,
    complete: failed === 0,
    configured: true,
    total: recipients.length,
    campaignKey: test ? undefined : campaignKey,
    skippedPreviouslyAccepted: test ? 0 : [...trackingByEmail.values()].filter(status => status === 'accepted').length - sent,
    sent,
    failed,
    test: Boolean(test),
    recipientType: test ? 'test' : recipientType,
    errors,
    message: failed > 0
      ? `Gmail SMTP accepted ${sent} email(s); ${failed} failed. Acceptance does not guarantee inbox delivery. Review the returned errors.`
      : `Gmail SMTP accepted ${sent} email(s). Acceptance does not guarantee inbox delivery.`,
  });
}
