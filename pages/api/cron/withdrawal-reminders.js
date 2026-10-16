 import { createClient } from '@supabase/supabase-js';
import { createEmailTransport } from '../../../lib/emailTransport';

const TERMS_URL = 'https://gweno.business/terms#unclaimed-funds-policy';
function esc(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  const secret = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || String(req.query.secret || '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return res.status(401).json({ success: false, error: 'Unauthorized.' });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ success: false, error: 'Database is not configured.' });
  let transport;
  try { transport = createEmailTransport('transactional'); } catch (e) { return res.status(503).json({ success: false, error: e.message || 'Email is not configured.' }); }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: users, error } = await db.from('users').select('id,email,full_name,balance,task_submissions,unsubscribed').gt('balance', 0).limit(10000);
  if (error) return res.status(500).json({ success: false, error: error.message });
  const dueAt = Date.now() - 5 * 86400000;
  let sent = 0, failed = 0, skipped = 0;
  for (const user of users || []) {
    const subs = { ...(user.task_submissions || {}) };
    const credits = Array.isArray(subs._unwithdrawnCredits) ? subs._unwithdrawnCredits : [];
    const due = credits.filter(c => Number(c.creditedAt) <= dueAt && !c.reminderSentAt && !c.withdrawnAt);
    if (!due.length) { skipped++; continue; }
    if (!user.email) { skipped++; continue; }
    const subject = 'Reminder: Please withdraw your available GWENO Hub balance';
    const text = `Dear ${user.full_name || 'Client'},\n\nOur records indicate that your GWENO Hub account has an available balance from approved task earnings that has not yet been withdrawn. Please arrange to withdraw your available earnings promptly.\n\nGWENO Hub connects clients with task opportunities and is not a bank or a deposit-taking institution. Your account balance is not a savings deposit and does not earn interest or dividends through GWENO Hub.\n\nUnder our Terms & Conditions, funds that remain unwithdrawn for more than one month may be handled under our unclaimed-funds policy, subject to applicable law and the terms of that policy.\n\nReview the relevant section: ${TERMS_URL}\n\nYou can visit your dashboard to review your balance and submit a withdrawal request.\n\nGWENO Hub Team`;
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><p>Dear ${esc(user.full_name || 'Client')},</p><p>Our records indicate that your GWENO Hub account has an available balance from approved task earnings that has not yet been withdrawn. Please arrange to withdraw your available earnings promptly.</p><p>GWENO Hub connects clients with task opportunities and is not a bank or a deposit-taking institution. Your account balance is not a savings deposit and does not earn interest or dividends through GWENO Hub.</p><p>Under our Terms &amp; Conditions, funds that remain unwithdrawn for more than one month may be handled under our unclaimed-funds policy, subject to applicable law and the terms of that policy.</p><p><a href="${TERMS_URL}">Review the relevant Terms &amp; Conditions section</a></p><p>You can visit your dashboard to review your balance and submit a withdrawal request.</p><p>GWENO Hub Team</p></div>`;
    try {
      await transport.sendMail({ to: user.email, subject, text, html });
      const sentAt = Date.now();
      const dueIds = new Set(due.map(c => String(c.id)));
      subs._unwithdrawnCredits = credits.map(c => dueIds.has(String(c.id)) ? { ...c, reminderSentAt: sentAt } : c);
      const { error: saveError } = await db.from('users').update({ task_submissions: subs }).eq('id', user.id);
      if (saveError) failed++; else sent++;
    } catch (_) { failed++; }
  }
  return res.status(200).json({ success: true, sent, failed, skipped });
}
