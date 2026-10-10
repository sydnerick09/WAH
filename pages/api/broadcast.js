// pages/api/broadcast.js
// Admin-only: sends a message to a selected registered-client group.
// Protected by ADMIN_SECRET; sends through the configured Gmail SMTP account.

import { createClient } from '@supabase/supabase-js';
import { createEmailTransport } from '../../lib/emailTransport';
import { unsubscribeUrl } from '../../lib/unsubToken';

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

  // Process recipients in manageable groups. Gmail SMTP sends one message per connection.
  const BATCH_SIZE = 100;
  for (let offset = 0; offset < recipients.length; offset += BATCH_SIZE) {
    const batch = recipients.slice(offset, offset + BATCH_SIZE);
    const prepared = batch.map((r) => {
      const optOutUrl = r.id && baseUrl ? unsubscribeUrl(r.id, baseUrl) : '';
      const textBody = optOutUrl
        ? `${rawBody}\n\n— The Gweno Hub Team\n\nTo stop receiving promotional and broadcast emails from Gweno Hub, unsubscribe here: ${optOutUrl}`
        : `${rawBody}\n\n— The Gweno Hub Team`;
      const message = {
        to: r.email,
        subject: subj,
        text: textBody,
        html: bodyToHtml(rawBody, r.name, optOutUrl),
      };
      if (optOutUrl) message.headers = { 'List-Unsubscribe': `<${optOutUrl}>` };
      return { recipient: r, message };
    });

    if (typeof transporter.sendBatch === 'function' && prepared.length > 1) {
      try {
        const result = await transporter.sendBatch(prepared.map(item => item.message));
        const accepted = Array.isArray(result?.data) ? result.data : null;
        if (accepted && accepted.length === prepared.length) {
          sent += prepared.length;
          continue;
        }
        // A successful HTTP response without one result per message is
        // ambiguous; fall back to individual sends for accurate accounting.
        if (accepted && accepted.length > 0) {
          sent += accepted.length;
          for (let i = accepted.length; i < prepared.length; i += 1) {
            try {
              await transporter.sendMail(prepared[i].message);
              sent += 1;
            } catch (err) {
              recordError(prepared[i].recipient.email, err);
            }
          }
          continue;
        }
        throw new Error('Email provider returned an unexpected batch response.');
      } catch (batchErr) {
        const batchMessage = String(batchErr?.message || batchErr);
        console.error('[broadcast] batch failed:', batchMessage);
        const systemicFailure = /domain.*not verified|verify.*domain|testing.*email|only.*test|api key|unauthorized|forbidden|rate limit|monthly.*limit|quota|restricted/i.test(batchMessage);
        if (systemicFailure) {
          // These errors affect the sender/account rather than one recipient;
          // retrying every address would waste execution time and repeat failures.
          for (const item of prepared) recordError(item.recipient.email, batchMessage);
          for (let remaining = offset + BATCH_SIZE; remaining < recipients.length; remaining += BATCH_SIZE) {
            for (const item of recipients.slice(remaining, remaining + BATCH_SIZE)) recordError(item.email, batchMessage);
          }
          break;
        }
        // Retry individually when a batch-level validation error may have been
        // caused by one recipient; this lets valid recipients still be sent.
        for (const item of prepared) {
          try {
            await transporter.sendMail(item.message);
            sent += 1;
          } catch (err) {
            recordError(item.recipient.email, err);
          }
          // Stay under common per-second API rate limits during fallback.
          await new Promise(resolve => setTimeout(resolve, 550));
        }
      }
    } else {
      // A small concurrency limit keeps a 159-recipient broadcast from spending
      // more than a minute waiting on sequential SMTP connections.
      const CONCURRENCY = 3;
      for (let i = 0; i < prepared.length; i += CONCURRENCY) {
        const group = prepared.slice(i, i + CONCURRENCY);
        await Promise.all(group.map(async (item) => {
          try {
            await transporter.sendMail(item.message);
            sent += 1;
          } catch (err) {
            recordError(item.recipient.email, err);
          }
        }));
      }
    }
  }

  try { transporter.close(); } catch (_) {}

  return res.status(200).json({
    success: sent > 0 || recipients.length === 0,
    complete: failed === 0,
    configured: true,
    total: recipients.length,
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
