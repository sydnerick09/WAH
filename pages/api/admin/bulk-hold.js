import { createClient } from '@supabase/supabase-js';
import { createEmailTransport } from '../../../lib/emailTransport';

const TERMS_URL = 'https://gweno.business/terms#unclaimed-funds-policy';
const MAX_DAYS = 3650;
function esc(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}
function matchingCredits(user, cutoff) {
  const subs = user.task_submissions || {};
  const credits = subs._unwithdrawnCredits;
  if (Array.isArray(credits)) return credits.filter(c => Number(c.creditedAt) <= cutoff && !c.withdrawnAt);
  return [];
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  const { adminSecret, action, days, userIds, reason } = req.body || {};
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ success: false, error: 'Unauthorized.' });
  const db = adminDb();
  if (!db) return res.status(503).json({ success: false, error: 'Database is not configured.' });
  const spanDays = Math.max(1, Math.min(MAX_DAYS, Math.floor(Number(days) || 30)));
  const cutoff = Date.now() - spanDays * 86400000;
  const { data: users, error } = await db.from('users').select('id,email,full_name,balance,task_submissions,created_at').gt('balance', 0).order('created_at', { ascending: true }).limit(10000);
  if (error) return res.status(500).json({ success: false, error: error.message });
  // Legacy accounts predate the credit ledger. For those accounts only, use old
  // approved submissions as a one-time age signal; new credits are ledger-tracked.
  const { data: oldSubmissions, error: subErr } = await db.from('submissions').select('user_id,updated_at,created_at').eq('status', 'approved').limit(20000);
  if (subErr) return res.status(500).json({ success: false, error: subErr.message });
  const legacyOldest = new Map();
  for (const row of oldSubmissions || []) {
    const ts = Date.parse(row.updated_at || row.created_at || '');
    if (!row.user_id || !Number.isFinite(ts) || ts > cutoff) continue;
    const key = String(row.user_id);
    legacyOldest.set(key, Math.min(legacyOldest.get(key) || Infinity, ts));
  }
  function userOldest(user) {
    const subs = user.task_submissions || {};
    if (Array.isArray(subs._unwithdrawnCredits)) {
      const old = matchingCredits(user, cutoff).map(c => Number(c.creditedAt)).filter(Number.isFinite);
      return old.length ? Math.min(...old) : null;
    }
    return legacyOldest.get(String(user.id)) ?? null;
  }
  const eligible = (users || []).filter(user => {
    const subs = user.task_submissions || {};
    return !subs._suspended && userOldest(user) !== null;
  });
  if (action === 'preview') {
    return res.json({ success: true, days: spanDays, users: eligible.map(u => ({ id: u.id, email: u.email, fullName: u.full_name || '', balance: Number(u.balance || 0), oldestCreditAt: userOldest(u) })) });
  }
  if (action !== 'hold') return res.status(400).json({ success: false, error: 'Invalid action.' });
  const ids = [...new Set((Array.isArray(userIds) ? userIds : []).map(v => String(v || '').trim()).filter(Boolean))];
  const holdReason = String(reason || '').trim().slice(0, 1000);
  if (!ids.length) return res.status(400).json({ success: false, error: 'Select at least one eligible client.' });
  if (!holdReason) return res.status(400).json({ success: false, error: 'Enter a reason for the hold.' });
  const eligibleIds = new Set(eligible.map(u => String(u.id)));
  const chosen = eligible.filter(u => ids.includes(String(u.id)) && eligibleIds.has(String(u.id))); 
  if (!chosen.length) return res.status(400).json({ success: false, error: 'None of the selected accounts currently match the chosen balance-age threshold.' });
  let held = 0, emailSent = 0, emailFailed = 0;
  let transport;
  try { transport = createEmailTransport('transactional'); } catch (_) { transport = null; }
  for (const user of chosen) {
    const subs = { ...(user.task_submissions || {}), _suspended: true, _suspendedAt: Date.now(), _suspendReason: holdReason };
    const { error: updateError } = await db.from('users').update({ task_submissions: subs }).eq('id', user.id);
    if (updateError) continue;
    held++;
    if (!user.email || !transport) { emailFailed++; continue; }
    try {
      const subject = 'GWENO Hub account placed on hold';
      const text = `Dear ${user.full_name || 'Client'},\n\nYour GWENO Hub account has been placed on hold for the following reason:\n\n${holdReason}\n\nYou can still sign in, review your balance, and request a withdrawal. Earning activities remain unavailable until the hold is released.\n\nPlease review the relevant Terms & Conditions: ${TERMS_URL}\n\nGWENO Hub Team`;
      const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><p>Dear ${esc(user.full_name || 'Client')},</p><p>Your GWENO Hub account has been placed on hold for the following reason:</p><p>${esc(holdReason).replace(/\n/g, '<br>')}</p><p>You can still sign in, review your balance, and request a withdrawal. Earning activities remain unavailable until the hold is released.</p><p>Please review the relevant <a href="${TERMS_URL}">Terms &amp; Conditions</a>.</p><p>GWENO Hub Team</p></div>`;
      await transport.sendMail({ to: user.email, subject, text, html });
      emailSent++;
    } catch (_) { emailFailed++; }
  }
  return res.json({ success: true, matched: chosen.length, held, emailSent, emailFailed, message: `Held ${held} account(s); ${emailSent} hold email(s) sent and ${emailFailed} email(s) failed.` });
}
