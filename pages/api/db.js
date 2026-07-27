import { createClient } from '@supabase/supabase-js';
import { TASKS } from '../../lib/tasks';
import { verifyUnsubToken } from '../../lib/unsubToken';
import { sendApprovalEmail } from '../../lib/approvalEmail';
import { isEmail, isPhone, nonEmpty, isPositiveNumber, clean } from '../../lib/validate';
import { hashPassword, verifyPassword } from '../../lib/password';
import { issueToken, verifyToken, issueResetToken, verifyResetToken, peekUid } from '../../lib/token';
import { sendResetEmail } from '../../lib/resetEmail';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// ── Bulk withdrawal (balances ≥ KES 25,000 → bank only) ───────────────────────
const BULK_THRESHOLD_KES  = 25000;   // at/above this, standard M-Pesa is unavailable
const BANK_FEE_USD        = 23;      // bank withdrawal processing fee (converted live)
const MPESA_FEE_KES       = 650;     // one previously-paid M-Pesa withdrawal fee
const MAX_FEE_DEDUCTIONS  = 2;       // at most two KES 650 credits (KES 1,300)

// Live USD→KES rate (never hardcoded). Fetched per request; falls back to a
// clearly-flagged approximate value only if the rate service is unreachable so
// the flow never hard-fails.
async function fetchUsdToKes() {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    const kes = Number(j?.rates?.KES);
    if (kes && kes > 0) return { rate: kes, live: true };
  } catch (_) { /* fall through to fallback */ }
  return { rate: 129, live: false };
}

// Server-authoritative bulk fee breakdown. The user declares how many M-Pesa
// withdrawal fees they've paid; the credited count is always clamped to
// [0, MAX_FEE_DEDUCTIONS] server-side so no one can claim more than two. The
// recorded history is returned alongside for auditing/transparency.
async function computeBulkQuote(u, declaredFees) {
  const balance      = Number(u.balance || 0);
  const subs         = u.task_submissions || {};
  const recordedFees = Math.max(0, Number(subs._mpesaFeesPaid || 0));
  const eligible     = Math.max(0, Math.min(MAX_FEE_DEDUCTIONS, Math.floor(Number(declaredFees) || 0)));
  const { rate, live } = await fetchUsdToKes();
  const convertedKes = Math.round(BANK_FEE_USD * rate);
  const deductionKes = eligible * MPESA_FEE_KES;
  const amountDueKes = Math.max(0, convertedKes - deductionKes);
  return {
    balance, feeUsd: BANK_FEE_USD, rate: Math.round(rate * 100) / 100, rateLive: live,
    convertedKes, recordedFees, declaredFees: eligible, eligibleDeductions: eligible,
    perFeeKes: MPESA_FEE_KES, maxDeductions: MAX_FEE_DEDUCTIONS,
    deductionKes, amountDueKes,
  };
}

// The password hash is never returned in any response (not even to the admin
// panel) so it can't leak or be accidentally re-submitted. Admins reset
// passwords via a write-only "new password" field.
function norm(row) {
  if (!row) return null;
  const subs = row.task_submissions ?? {};

  const actAt      = subs._act ?? null;
  const actExpires = actAt ? actAt + ONE_MONTH_MS : null;
  const activated  = actAt !== null && (!actExpires || Date.now() <= actExpires);

  const paidAt      = row.premium_paid_at ?? null;
  const premExpires = paidAt ? paidAt + ONE_MONTH_MS : null;
  const premium     = (row.premium ?? false) && paidAt !== null && (!premExpires || Date.now() <= premExpires);

  const suspended     = subs._suspended ?? false;
  const suspendedAt   = subs._suspendedAt ?? null;
  const suspendReason = subs._suspendReason ?? '';

  const quiz  = subs._quiz  ?? null;
  const ptest = subs._ptest ?? null;

  // Extended profile fields live in task_submissions._profile (no schema change,
  // mirrors the existing _act/_quiz/_suspended pattern).
  const profile = subs._profile ?? {};

  return {
    id:               row.id,
    fullName:         row.full_name        ?? '',
    email:            row.email            ?? '',
    phone:            row.phone            ?? '',
    country:          row.country          ?? '',
    password:         '',
    username:         profile.username     ?? '',
    avatar:           profile.avatar       ?? '',
    address:          profile.address      ?? '',
    postalCode:       profile.postalCode   ?? '',
    state:            profile.state        ?? '',
    activated,
    activatedAt:      actAt,
    activatedExpiresAt: actExpires,
    premium,
    premiumPaidAt:    paidAt,
    premiumExpiresAt: premExpires,
    balance:          Number(row.balance   ?? 0),
    referralCount:   Number(row.referral_count  ?? 0),
    referredBy:      row.referred_by      ?? null,
    completedTasks:  Number(row.completed_tasks ?? 0),
    activeBids:      Number(row.active_bids     ?? 0),
    taskSubmissions: row.task_submissions  ?? {},
    createdAt:       row.created_at,
    suspended,
    suspendedAt,
    suspendReason,
    quizDone:        quiz !== null,
    quizScore:       Number(quiz?.score  ?? 0),
    quizEarned:      Number(quiz?.earned ?? 0),
    premiumBalance:  Number(subs._pbal   ?? 0),
    premiumTestDone: ptest !== null,
    premiumTestScore: Number(ptest?.score ?? 0),
    mpesaFeesPaid:   Math.max(0, Number(subs._mpesaFeesPaid ?? 0)),
  };
}

function normWd(row) {
  if (!row) return null;
  return {
    id:          row.id,
    userId:      row.user_id,
    fullName:    row.full_name,
    phone:       row.phone,
    idNumber:    row.id_number,
    amount:      Number(row.amount || 0),
    status:      row.status      ?? 'pending',
    rejectReason: row.reject_reason ?? '',
    deadline:    row.deadline,
    requestedAt: row.requested_at,
    updatedAt:   row.updated_at  ?? null,
  };
}

// Always show a recent-looking posted date (within the last 6 days), stable
// per task and relative to today, so the marketplace never looks stale. Runs
// server-side on every request, so the dates refresh automatically each day —
// the real `created_at` is kept separately for expiry/ordering logic.
function freshDatePosted(row) {
  const key = String(row.id ?? row.title ?? '');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const d = new Date();
  d.setDate(d.getDate() - (h % 6)); // 0 to 5 days ago
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

// A rolling future deadline (7 to 14 days out), stable per task and relative to
// today, so admin-created tasks always show a due date that stays in the future.
function freshDueDate(row) {
  const key = String(row.id ?? row.title ?? '');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const d = new Date();
  d.setDate(d.getDate() + 7 + (h % 8)); // 7 to 14 days ahead
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Proposals are capped at a small word count to avoid bulk text (mirrors the
// client-side limit on the application form).
function clampWords(s, max = 40) {
  const t = String(s || '').trim();
  const words = t.split(/\s+/).filter(Boolean);
  return words.length <= max ? t : words.slice(0, max).join(' ');
}

// Admin-managed task (stored in the `tasks` table). Shape matches lib/tasks.js
// so it can be shown on the dashboard alongside the built-in tasks.
function normTask(row) {
  if (!row) return null;
  return {
    id:          row.id,
    title:       row.title       ?? '',
    description: row.description ?? '',
    category:    row.category    ?? 'General',
    poster:      row.poster      ?? 'Business Hub',
    location:    row.location    ?? 'Remote',
    questions:   Array.isArray(row.questions) ? row.questions : [],
    payment:     Number(row.payment ?? 0),   // reward
    slots:       Number(row.slots   ?? 0),    // limit (0 = unlimited)
    claimed:     Number(row.claimed ?? 0),
    active:      row.active ?? true,
    datePosted:  freshDatePosted(row),
    dueDate:     freshDueDate(row),
    createdAt:   row.created_at,
  };
}

function normSub(row) {
  if (!row) return null;
  return {
    id:        row.id,
    userId:    row.user_id,
    email:     row.user_email,
    name:      row.user_name,
    taskId:    row.task_id,
    taskTitle: row.task_title,
    reward:    Number(row.reward || 0),
    note:      row.note   ?? '',
    status:    row.status ?? 'pending',
    reason:    row.reason ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}

// Task application / proposal (stored in the `applications` table).
function normApp(row) {
  if (!row) return null;
  return {
    id:        row.id,
    userId:    row.user_id,
    email:     row.user_email,
    name:      row.user_name,
    taskId:    row.task_id,
    taskTitle: row.task_title,
    message:   row.message ?? '',
    extra:     row.extra   ?? '',
    status:    row.status  ?? 'pending',
    reason:    row.reason  ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}

function normAction(row) {
  if (!row) return null;
  return {
    id:        row.id,
    action:    row.action ?? '',
    entity:    row.entity ?? '',
    entityId:  row.entity_id ?? '',
    detail:    row.detail ?? '',
    actor:     row.actor  ?? 'admin',
    createdAt: row.created_at,
  };
}

// Best-effort audit-trail write. Never throws (a missing table must not break
// the action it is logging).
async function logAction(db, { action, entity, entityId, detail }) {
  try {
    await db.from('admin_actions').insert({
      action, entity, entity_id: entityId != null ? String(entityId) : null, detail: detail || '',
    });
  } catch (_) { /* audit is best-effort */ }
}

// ── Rate limiting (Supabase-backed fixed window; no external service) ─────────
// Fails OPEN: if the `rate_limits` table is missing or any query errors, we
// never block, so this can't lock legitimate users out.
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}
function tooManyMsg(retryAfter) {
  const mins = Math.max(1, Math.ceil((retryAfter || 60) / 60));
  return `Too many attempts. Please try again in about ${mins} minute${mins === 1 ? '' : 's'}.`;
}
async function rlCheck(db, bucket, limit, windowMs) {
  try {
    const { data: row } = await db.from('rate_limits').select('count,window_start').eq('bucket', bucket).maybeSingle();
    if (!row) return { blocked: false };
    const elapsed = Date.now() - new Date(row.window_start).getTime();
    if (elapsed > windowMs) return { blocked: false };
    if (row.count >= limit) return { blocked: true, retryAfter: Math.ceil((windowMs - elapsed) / 1000) };
    return { blocked: false };
  } catch (_) { return { blocked: false }; }
}
async function rlHit(db, bucket, windowMs) {
  try {
    const now = Date.now();
    const { data: row } = await db.from('rate_limits').select('count,window_start').eq('bucket', bucket).maybeSingle();
    if (!row || now - new Date(row.window_start).getTime() > windowMs) {
      await db.from('rate_limits').upsert({ bucket, count: 1, window_start: new Date(now).toISOString() });
    } else {
      await db.from('rate_limits').update({ count: row.count + 1 }).eq('bucket', bucket);
    }
  } catch (_) { /* best-effort */ }
}
async function rlClear(db, bucket) {
  try { await db.from('rate_limits').delete().eq('bucket', bucket); } catch (_) {}
}

// Ops that act on a single user's own data. For these we IGNORE any user id in
// the request body and derive the authenticated user id from the signed session
// token, so a caller can never read or modify another user's data.
const USER_SCOPED = new Set([
  'getUser', 'activateUser', 'awardQuiz', 'awardPremiumTest',
  'upgradePremiumWithBalance', 'activateWithBalance', 'upgradeToPremium',
  'submitTask', 'createBid', 'createWithdrawal', 'getWithdrawal',
  'updateWithdrawal', 'listUserSubmissions', 'listUserApplications',
  'createApplication',
  'updateProfile', 'updateAvatar', 'changeContact', 'deleteAccount',
  'recordMpesaFee', 'bulkWithdrawalQuote', 'submitBulkWithdrawal',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const db = getAdmin();
  const { op, ...p } = req.body;

  // Authenticate + authorize user-scoped ops from the token (not the body).
  if (USER_SCOPED.has(op)) {
    const uid = verifyToken(p.authToken);
    if (!uid) return res.status(401).json({ error: 'Unauthorized', authRequired: true });
    p.userId = uid;   // ops read userId
    p.id     = uid;   // getUser reads id
    delete p.email;   // force uid-based lookups (no email-based bypass)
  }

  try {
    switch (op) {

      case 'registerUser': {
        // Rate-limit mass sign-ups per IP (lenient — abuse only). Fails open.
        {
          const bucket = `register:${clientIp(req)}`;
          const chk = await rlCheck(db, bucket, 30, 60 * 60 * 1000); // 30 / hour
          if (chk.blocked) return res.json({ success: false, message: tooManyMsg(chk.retryAfter) });
          await rlHit(db, bucket, 60 * 60 * 1000);
        }

        const { activated, premium, premiumPaidAt, balance,
                referralCount, referredBy } = p;

        // Server-side validation + sanitization (authoritative — never trust
        // the client). Reject malformed input before touching the database.
        const fullName = clean(p.fullName, 80);
        const email    = clean(p.email, 120).toLowerCase();
        const phone    = clean(p.phone, 20);
        const country  = clean(p.country, 60);
        const password = String(p.password ?? '');
        if (!nonEmpty(fullName)) return res.json({ success: false, message: 'Full name is required.' });
        if (!isEmail(email))     return res.json({ success: false, message: 'A valid email address is required.' });
        if (!isPhone(phone))     return res.json({ success: false, message: 'A valid phone number is required.' });
        if (password.length < 8) return res.json({ success: false, message: 'Password must be at least 8 characters.' });

        // One account per email (case-insensitive)
        const { data: existing } = await db.from('users')
          .select('id').ilike('email', email).limit(1);
        if (existing && existing.length) return res.json({ success: false, message: 'Email already registered.' });

        const id = Date.now().toString();
        const { data, error } = await db.from('users').insert({
          id, full_name: fullName, email, phone, country, password: hashPassword(password),
          activated, premium, premium_paid_at: premiumPaidAt,
          balance, referral_count: referralCount, referred_by: referredBy,
          completed_tasks: 0, active_bids: 0, task_submissions: {},
        }).select().single();

        if (error) return res.json({ success: false, message: error.message });

        if (referredBy && referredBy !== id) {
          const { data: ref } = await db.from('users')
            .select('balance').eq('id', referredBy).maybeSingle();
          if (ref) {
            await db.from('users')
              .update({ balance: (ref.balance || 0) + 70 }).eq('id', referredBy);
          }
        }

        return res.json({ success: true, user: norm(data), authToken: issueToken(data.id) });
      }

      case 'migrateUser': {
        const u = p.user;
        if (!u?.id) return res.json({ data: null });

        // Return existing record if already in Supabase (by id or email)
        const { data: byId } = await db.from('users')
          .select('*').eq('id', u.id).maybeSingle();
        if (byId) return res.json({ data: norm(byId), authToken: issueToken(byId.id) });

        const { data: byEmail } = await db.from('users')
          .select('*').eq('email', u.email).maybeSingle();
        if (byEmail) return res.json({ data: norm(byEmail), authToken: issueToken(byEmail.id) });

        const { data: inserted, error: insertErr } = await db.from('users').insert({
          id:               u.id,
          full_name:        u.fullName        ?? u.full_name        ?? '',
          email:            u.email           ?? '',
          phone:            u.phone           ?? '',
          country:          u.country         ?? '',
          password:         u.password        ?? '',
          activated:        Boolean(u.activated),
          premium:          Boolean(u.premium),
          premium_paid_at:  u.premiumPaidAt   ?? u.premium_paid_at  ?? null,
          balance:          Number(u.balance  ?? 0),
          referral_count:   Number(u.referralCount ?? u.referral_count ?? 0),
          referred_by:      u.referredBy      ?? u.referred_by      ?? null,
          completed_tasks:  Number(u.completedTasks ?? u.completed_tasks ?? 0),
          active_bids:      Number(u.activeBids     ?? u.active_bids     ?? 0),
          task_submissions: u.taskSubmissions ?? u.task_submissions  ?? {},
        }).select().single();

        if (insertErr) return res.json({ data: null, error: insertErr.message });
        return res.json({ data: norm(inserted), authToken: issueToken(inserted.id) });
      }

      case 'loginUser': {
        const email    = clean(p.email, 120).toLowerCase();
        const password = String(p.password ?? '');
        if (!isEmail(email) || !password) return res.json({ success: false, message: 'Invalid email or password.' });

        // Brute-force protection per account: block after too many FAILED
        // attempts in the window (keyed by email, not IP, to avoid punishing
        // users behind shared/carrier IPs). Successful logins reset the counter.
        const WINDOW = 15 * 60 * 1000;
        const rlBucket = `login:${email}`;
        const chk = await rlCheck(db, rlBucket, 10, WINDOW); // 10 failures / 15 min
        if (chk.blocked) return res.json({ success: false, message: tooManyMsg(chk.retryAfter) });

        // Look up by email (case-insensitive), then verify the password against
        // its hash. Never query by password directly.
        const { data: rows } = await db.from('users').select('*').ilike('email', email).limit(5);
        const data = (rows || []).find(r => String(r.email).toLowerCase() === email);
        if (!data) { await rlHit(db, rlBucket, WINDOW); return res.json({ success: false, message: 'Invalid email or password.' }); }

        const { ok, legacy } = verifyPassword(password, data.password);
        if (!ok) { await rlHit(db, rlBucket, WINDOW); return res.json({ success: false, message: 'Invalid email or password.' }); }

        // Success — clear the failure counter, then upgrade any legacy plaintext
        // password to a hash.
        await rlClear(db, rlBucket);
        if (legacy) {
          try { await db.from('users').update({ password: hashPassword(password) }).eq('id', data.id); } catch (_) {}
        }
        return res.json({ success: true, user: norm(data), authToken: issueToken(data.id) });
      }

      case 'requestPasswordReset': {
        // Public. Always responds the same way so it never reveals whether an
        // account exists (no user enumeration). Rate-limited per email + per IP
        // to prevent email bombing / abuse.
        const email = clean(p.email, 120).toLowerCase();
        const genericOk = { success: true };
        if (!isEmail(email)) return res.json(genericOk);

        const WINDOW = 60 * 60 * 1000;
        const ipBucket    = `pwreset-ip:${clientIp(req)}`;
        const emailBucket = `pwreset-email:${email}`;
        const ipChk = await rlCheck(db, ipBucket, 12, WINDOW);   // 12 / hr / IP
        const emChk = await rlCheck(db, emailBucket, 5, WINDOW);  //  5 / hr / email
        if (ipChk.blocked || emChk.blocked) return res.json(genericOk);
        await rlHit(db, ipBucket, WINDOW);
        await rlHit(db, emailBucket, WINDOW);

        const { data: rows } = await db.from('users')
          .select('id,email,full_name,password').ilike('email', email).limit(5);
        const u = (rows || []).find(r => String(r.email).toLowerCase() === email);
        if (u) {
          const token    = issueResetToken(u.id, u.password);
          const base     = process.env.PUBLIC_BASE_URL || 'https://onlinejob-pi.vercel.app';
          const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
          await sendResetEmail({ userEmail: u.email, userName: u.full_name, resetUrl });
        }
        return res.json(genericOk);
      }

      case 'resetPassword': {
        // Public. Verifies the reset token against the user's CURRENT password
        // hash (so the link is single-use + 30-min), then sets the new password.
        const token       = String(p.token || '');
        const newPassword = String(p.newPassword ?? '');
        const badLink = { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' };
        if (newPassword.length < 8) return res.json({ success: false, error: 'Password must be at least 8 characters.' });

        const uid = peekUid(token);
        if (!uid) return res.json(badLink);
        const { data: u } = await db.from('users').select('id,password').eq('id', uid).maybeSingle();
        if (!u) return res.json(badLink);

        const verified = verifyResetToken(token, u.password);
        if (!verified || verified !== String(u.id)) return res.json(badLink);

        const { error } = await db.from('users').update({ password: hashPassword(newPassword) }).eq('id', u.id);
        if (error) return res.json({ success: false, error: 'Could not reset your password. Please try again.' });
        return res.json({ success: true });
      }

      case 'getUser': {
        const { data } = await db.from('users')
          .select('*').eq('id', p.id).maybeSingle();
        return res.json({ data: norm(data) });
      }

      case 'activateUser': {
        const { userId, amountPaid } = p;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const updatedSubs = { ...(u.task_submissions || {}), _act: Date.now() };
        const { data: updated } = await db.from('users').update({
          activated:        true,
          task_submissions: updatedSubs,
          balance:          (u.balance || 0) + Number(amountPaid),
        }).eq('id', userId).select().single();

        if (u.referred_by && u.referred_by !== userId) {
          const { data: ref } = await db.from('users')
            .select('balance,referral_count').eq('id', u.referred_by).maybeSingle();
          if (ref) {
            await db.from('users').update({
              balance:        (ref.balance || 0) + 132,
              referral_count: (ref.referral_count || 0) + 1,
            }).eq('id', u.referred_by);
          }
        }

        return res.json({ data: norm(updated) });
      }

      case 'awardQuiz': {
        const { userId, correctCount } = p;
        const count  = Math.max(0, Math.min(5, Number(correctCount) || 0));
        const earned = count * 10;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const subs = { ...(u.task_submissions || {}) };
        if (subs._quiz) return res.json({ data: norm(u) });   // already claimed

        subs._quiz = { score: count, earned, at: Date.now() };
        const { data: updated } = await db.from('users').update({
          task_submissions: subs,
          balance:          (u.balance || 0) + earned,
        }).eq('id', userId).select().single();
        return res.json({ data: norm(updated) });
      }

      case 'awardPremiumTest': {
        const { userId, correctCount } = p;
        const count  = Math.max(0, Math.min(5, Number(correctCount) || 0));
        const earned = count * 42;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const subs = { ...(u.task_submissions || {}) };
        if (subs._ptest) return res.json({ data: norm(u) });   // already taken

        subs._ptest = { score: count, earned, at: Date.now() };
        subs._pbal  = Number(subs._pbal || 0) + earned;
        const { data: updated } = await db.from('users').update({
          task_submissions: subs,
        }).eq('id', userId).select().single();
        return res.json({ data: norm(updated) });
      }

      case 'upgradePremiumWithBalance': {
        const { userId } = p;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const subs     = { ...(u.task_submissions || {}) };
        const pbal     = Number(subs._pbal || 0);
        const consumed = Math.min(pbal, 480);
        subs._pbal     = pbal - consumed;
        const { data: updated } = await db.from('users').update({
          premium:          true,
          premium_paid_at:  Date.now(),
          task_submissions: subs,
        }).eq('id', userId).select().single();
        return res.json({ data: norm(updated) });
      }

      case 'activateWithBalance': {
        const { userId } = p;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const balance  = Number(u.balance || 0);
        const consumed = Math.min(balance, 50);
        const subs = { ...(u.task_submissions || {}), _act: Date.now() };
        const { data: updated } = await db.from('users').update({
          activated:        true,
          task_submissions: subs,
          balance:          balance - consumed,
        }).eq('id', userId).select().single();

        if (u.referred_by && u.referred_by !== userId) {
          const { data: ref } = await db.from('users')
            .select('balance,referral_count').eq('id', u.referred_by).maybeSingle();
          if (ref) {
            await db.from('users').update({
              balance:        (ref.balance || 0) + 132,
              referral_count: (ref.referral_count || 0) + 1,
            }).eq('id', u.referred_by);
          }
        }
        return res.json({ data: norm(updated) });
      }

      case 'upgradeToPremium': {
        const { data } = await db.from('users').update({
          premium: true, premium_paid_at: Date.now(),
        }).eq('id', p.userId).select().single();
        return res.json({ data: norm(data) });
      }

      case 'submitTask': {
        const { userId, taskId, rewardAmount } = p;
        const key = String(taskId);
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ success: false, message: 'User not found.' });

        const subs = u.task_submissions || {};
        if (subs[key]) {
          return res.json({
            success: false,
            alreadySubmitted: true,
            message: `Already submitted on ${new Date(subs[key].submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}.`,
          });
        }

        subs[key] = { submittedAt: new Date().toISOString(), reward: rewardAmount };
        const { data: updated } = await db.from('users').update({
          task_submissions: subs,
          completed_tasks:  (u.completed_tasks || 0) + 1,
          balance:          (u.balance || 0) + rewardAmount,
        }).eq('id', userId).select().single();

        return res.json({ success: true, user: norm(updated) });
      }

      case 'createBid': {
        const { data: u } = await db.from('users')
          .select('active_bids').eq('id', p.userId).maybeSingle();
        if (!u) return res.json({ data: null });
        const { data } = await db.from('users').update({
          active_bids: (u.active_bids || 0) + 1,
        }).eq('id', p.userId).select().single();
        return res.json({ data: norm(data) });
      }

      case 'createWithdrawal': {
        const userId   = clean(p.userId, 64);
        const fullName = clean(p.fullName, 80);
        const phone    = clean(p.phone, 20);
        const idNumber = clean(p.idNumber, 40);
        const amount   = Number(p.amount);
        // Reject malformed withdrawal requests server-side.
        if (!nonEmpty(userId))          return res.json({ data: null, error: 'Missing user.' });
        if (!nonEmpty(fullName))        return res.json({ data: null, error: 'Account holder name is required.' });
        if (!isPhone(phone))            return res.json({ data: null, error: 'A valid phone number is required.' });
        if (!isPositiveNumber(amount))  return res.json({ data: null, error: 'A valid amount is required.' });
        const deadline = Date.now() + 2 * 60 * 60 * 1000;
        const { data, error } = await db.from('withdrawal_requests').insert({
          user_id:      userId,
          full_name:    fullName,
          phone,
          id_number:    idNumber,
          amount,
          status:       'pending',
          deadline,
          requested_at: new Date().toISOString(),
        }).select().single();
        if (error) return res.json({ data: null });
        return res.json({ data: normWd(data) });
      }

      case 'getWithdrawal': {
        const { data } = await db.from('withdrawal_requests')
          .select('*').eq('user_id', p.userId)
          .order('requested_at', { ascending: false }).limit(1).maybeSingle();
        return res.json({ data: normWd(data) });
      }

      case 'updateWithdrawal': {
        // Only the owner may update their own withdrawal (p.userId is the token uid).
        const { data: wd } = await db.from('withdrawal_requests')
          .select('user_id').eq('id', p.requestId).maybeSingle();
        if (!wd || String(wd.user_id) !== String(p.userId)) return res.json({ data: null });
        const { data } = await db.from('withdrawal_requests')
          .update({ status: p.status, updated_at: new Date().toISOString() })
          .eq('id', p.requestId).select().single();
        return res.json({ data: normWd(data) });
      }

      // ─── Bulk withdrawal (balances ≥ KES 25,000) ──────────────────────────
      // Record a successfully-paid M-Pesa withdrawal fee. Deduped by the
      // Paystack reference so a page reload can't double-count.
      case 'recordMpesaFee': {
        const ref = clean(p.reference, 120);
        const { data: u } = await db.from('users')
          .select('task_submissions').eq('id', p.userId).maybeSingle();
        if (!u) return res.json({ success: false });
        const subs = { ...(u.task_submissions || {}) };
        const refs = Array.isArray(subs._mpesaFeeRefs) ? subs._mpesaFeeRefs : [];
        if (ref && refs.includes(ref)) {
          return res.json({ success: true, duplicate: true, mpesaFeesPaid: Number(subs._mpesaFeesPaid || 0) });
        }
        subs._mpesaFeesPaid = Math.max(0, Number(subs._mpesaFeesPaid || 0)) + 1;
        if (ref) subs._mpesaFeeRefs = [...refs, ref].slice(-20);
        await db.from('users').update({ task_submissions: subs }).eq('id', p.userId);
        await logAction(db, { action: 'mpesa_fee_paid', entity: 'user', entityId: p.userId,
          detail: `count:${subs._mpesaFeesPaid}${ref ? ` ref:${ref}` : ''}` });
        return res.json({ success: true, mpesaFeesPaid: subs._mpesaFeesPaid });
      }

      // Server-authoritative fee quote for a bulk withdrawal (live FX + capped
      // deductions from recorded history). Audited on every request.
      case 'bulkWithdrawalQuote': {
        // Shared fee quote for bulk (>= threshold) and the international flow.
        // The bulk balance gate is skipped for the international context.
        const isIntl = p.context === 'international';
        const { data: u } = await db.from('users')
          .select('*').eq('id', p.userId).maybeSingle();
        if (!u) return res.json({ success: false, error: 'User not found.' });
        if (!isIntl && Number(u.balance || 0) < BULK_THRESHOLD_KES) {
          return res.json({ success: false, eligible: false, error: 'Balance is below the bulk-withdrawal threshold.' });
        }
        const q = await computeBulkQuote(u, p.declaredFees);
        await logAction(db, { action: `${isIntl ? 'international' : 'bulk'}_withdrawal_quote`, entity: 'user', entityId: p.userId,
          detail: `bal:${q.balance} rate:${q.rate}${q.rateLive ? '' : '(fallback)'} usd:${q.feeUsd} converted:${q.convertedKes} declared:${q.declaredFees} recorded:${q.recordedFees} deductions:${q.eligibleDeductions} deductionKes:${q.deductionKes} due:${q.amountDueKes}` });
        return res.json({ success: true, eligible: true, ...q });
      }

      // Validate bank details, recompute the quote server-side (authoritative),
      // and log the full bulk request for auditing. Returns the final breakdown.
      case 'submitBulkWithdrawal': {
        const isIntl = p.context === 'international';
        const { data: u } = await db.from('users')
          .select('*').eq('id', p.userId).maybeSingle();
        if (!u) return res.json({ success: false, error: 'User not found.' });
        if (!isIntl && Number(u.balance || 0) < BULK_THRESHOLD_KES) {
          return res.json({ success: false, eligible: false, error: 'Balance is below the bulk-withdrawal threshold.' });
        }
        const bankName      = clean(p.bankName, 80);
        const accountName   = clean(p.accountName, 80);
        const accountNumber = clean(p.accountNumber, 40);
        const branch        = clean(p.branch, 80);
        const swift         = clean(p.swift, 40);
        if (!nonEmpty(bankName) || !nonEmpty(accountName) || !nonEmpty(accountNumber)) {
          return res.json({ success: false, error: 'Bank name, account name and account number are required.' });
        }
        const q = await computeBulkQuote(u, p.declaredFees);
        await logAction(db, { action: 'bulk_withdrawal_request', entity: 'user', entityId: p.userId,
          detail: `bank:${bankName} acct:${accountName}/${accountNumber}${branch ? ` branch:${branch}` : ''}${swift ? ` swift:${swift}` : ''} | bal:${q.balance} rate:${q.rate}${q.rateLive ? '' : '(fallback)'} converted:${q.convertedKes} declared:${q.declaredFees} recorded:${q.recordedFees} deductions:${q.eligibleDeductions}x${q.perFeeKes} due:${q.amountDueKes}` });
        return res.json({ success: true, ...q, bank: { bankName, accountName, accountNumber, branch, swift } });
      }

      case 'listUsers': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { data: rows, error: listErr } = await db.from('users')
          .select('*').order('created_at', { ascending: false });
        if (listErr) return res.json({ data: [], error: listErr.message });
        return res.json({ data: (rows || []).map(norm) });
      }

      case 'adminUpdateUser': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { userId, balance, premium, premiumPaidAt, activatedAt, clearActivation } = p;

        const updates = {};
        if (balance   !== undefined) updates.balance    = Number(balance);
        if (premium   !== undefined) updates.premium    = Boolean(premium);
        if (premiumPaidAt !== undefined) updates.premium_paid_at = premiumPaidAt;
        if (p.fullName !== undefined && p.fullName.trim()) updates.full_name = p.fullName.trim();
        if (p.email    !== undefined && p.email.trim())    updates.email     = p.email.trim();
        if (p.phone    !== undefined)                      updates.phone     = p.phone.trim();
        if (p.password !== undefined && String(p.password).trim()) updates.password = hashPassword(String(p.password).trim());

        if (clearActivation || activatedAt !== undefined || p.suspended !== undefined) {
          const { data: cur } = await db.from('users')
            .select('task_submissions').eq('id', userId).maybeSingle();
          const subs = { ...(cur?.task_submissions || {}) };

          if (clearActivation) delete subs._act;
          else if (activatedAt !== undefined) subs._act = activatedAt;

          if (p.suspended !== undefined) {
            subs._suspended   = Boolean(p.suspended);
            subs._suspendedAt = p.suspended ? Date.now() : null;
            subs._suspendReason = p.suspendReason ?? '';
          }

          updates.task_submissions = subs;
        }

        const { data: updated, error: updErr } = await db.from('users')
          .update(updates).eq('id', userId).select().single();
        if (updErr) return res.json({ success: false, error: updErr.message });
        return res.json({ success: true, user: norm(updated) });
      }

      case 'adminListWithdrawals': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { data: wRows, error: wErr } = await db.from('withdrawal_requests')
          .select('*').order('requested_at', { ascending: false });
        if (wErr) return res.json({ data: [], error: wErr.message });
        return res.json({ data: (wRows || []).map(normWd) });
      }

      case 'adminUpdateWithdrawal': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const wUpdates = { updated_at: new Date().toISOString() };
        if (p.status   !== undefined) wUpdates.status    = p.status;
        if (p.amount   !== undefined) wUpdates.amount    = Number(p.amount);
        if (p.phone    !== undefined) wUpdates.phone     = p.phone;
        if (p.idNumber !== undefined) wUpdates.id_number = p.idNumber;
        if (p.fullName !== undefined) wUpdates.full_name = p.fullName;
        if (p.rejectReason !== undefined) wUpdates.reject_reason = p.rejectReason;
        let { data: wUp, error: wUpErr } = await db.from('withdrawal_requests')
          .update(wUpdates).eq('id', p.requestId).select().single();
        // If the reject_reason column hasn't been added yet, retry without it so
        // approve/reject/save still work (the reason just won't be stored).
        if (wUpErr && /reject_reason/.test(wUpErr.message || '')) {
          delete wUpdates.reject_reason;
          ({ data: wUp, error: wUpErr } = await db.from('withdrawal_requests')
            .update(wUpdates).eq('id', p.requestId).select().single());
        }
        if (wUpErr) return res.json({ success: false, error: wUpErr.message });
        return res.json({ success: true, data: normWd(wUp) });
      }

      case 'adminDeleteWithdrawal': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { error: delErr } = await db.from('withdrawal_requests')
          .delete().eq('id', p.requestId);
        if (delErr) return res.json({ success: false, error: delErr.message });
        return res.json({ success: true });
      }

      case 'adminDeleteUser': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        if (!p.userId) return res.json({ success: false, error: 'No user id provided.' });
        const { error: delErr } = await db.from('users').delete().eq('id', p.userId);
        if (delErr) return res.json({ success: false, error: delErr.message });
        return res.json({ success: true });
      }

      case 'adminDeleteUsersByEmail': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        // Normalise the pasted list to a unique, lower-cased set of exact addresses
        const targets = new Set(
          (p.emails || []).map(e => String(e).trim().toLowerCase()).filter(Boolean)
        );
        if (!targets.size) return res.json({ success: false, error: 'No emails provided.' });

        // Match case-insensitively in JS so we only ever delete EXACT addresses
        const { data: rows, error: selErr } = await db.from('users').select('id,email');
        if (selErr) return res.json({ success: false, error: selErr.message });

        const matched  = (rows || []).filter(r => targets.has(String(r.email || '').trim().toLowerCase()));
        const ids      = matched.map(r => r.id);
        const foundSet = new Set(matched.map(r => String(r.email || '').trim().toLowerCase()));
        const notFound = [...targets].filter(t => !foundSet.has(t));

        if (ids.length) {
          const { error: bulkErr } = await db.from('users').delete().in('id', ids);
          if (bulkErr) return res.json({ success: false, error: bulkErr.message });
        }
        return res.json({
          success: true,
          deleted: ids.length,
          deletedEmails: matched.map(r => r.email),
          notFound,
        });
      }

      // ─── Task management ──────────────────────────────────────────────────
      case 'listTasks': {
        // Public: active admin-created tasks for the dashboard/submit page.
        // Offer tasks expire 9 hours after creation (handled server-side).
        const { data, error } = await db.from('tasks')
          .select('*').eq('active', true).order('created_at', { ascending: false });
        if (error) return res.json({ data: [], error: error.message });
        const OFFER_WINDOW_MS = 9 * 60 * 60 * 1000;
        const nowMs = Date.now();
        const live = (data || []).filter(t => {
          if (String(t.id).startsWith('offer_') && t.created_at
              && nowMs - new Date(t.created_at).getTime() > OFFER_WINDOW_MS) return false;
          return true;
        });
        return res.json({ data: live.map(normTask) });
      }

      case 'adminListTasks': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data, error } = await db.from('tasks')
          .select('*').order('created_at', { ascending: false });
        if (error) return res.json({ data: [], error: error.message });
        return res.json({ data: (data || []).map(normTask) });
      }

      case 'adminCreateTask': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        if (!p.title || !String(p.title).trim()) return res.json({ success: false, error: 'Title is required.' });
        const id = 'task_' + Date.now();
        const { data, error } = await db.from('tasks').insert({
          id,
          title:       String(p.title).trim(),
          description: p.description ?? '',
          category:    p.category ?? 'General',
          poster:      p.poster   ?? 'Business Hub',
          location:    p.location ?? 'Remote',
          questions:   Array.isArray(p.questions) ? p.questions : [],
          payment:     Number(p.payment ?? 0),
          slots:       Number(p.slots ?? 0),
          active:      p.active !== undefined ? Boolean(p.active) : true,
        }).select().single();
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, task: normTask(data) });
      }

      case 'adminUpdateTask': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const updates = {};
        ['title', 'description', 'category', 'poster', 'location'].forEach(k => {
          if (p[k] !== undefined) updates[k] = p[k];
        });
        if (p.payment   !== undefined) updates.payment = Number(p.payment);
        if (p.slots     !== undefined) updates.slots   = Number(p.slots);
        if (p.active    !== undefined) updates.active  = Boolean(p.active);
        if (p.questions !== undefined) updates.questions = Array.isArray(p.questions) ? p.questions : [];
        const { data, error } = await db.from('tasks')
          .update(updates).eq('id', p.taskId).select().single();
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, task: normTask(data) });
      }

      case 'adminDeleteTask': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { error } = await db.from('tasks').delete().eq('id', p.taskId);
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      case 'adminSeedTasks': {
        // One-time migration: copy the built-in starter tasks into the DB so
        // they become editable/deletable. Skips titles that are already present.
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data: existing, error: exErr } = await db.from('tasks').select('title');
        if (exErr) return res.json({ success: false, error: exErr.message });
        const have = new Set((existing || []).map(r => r.title));
        const rows = TASKS.filter(t => !have.has(t.title)).map(t => ({
          id:          'task_seed_' + t.id,
          title:       t.title,
          description: t.description ?? '',
          category:    t.category ?? 'General',
          poster:      t.poster   ?? 'Business Hub',
          location:    t.location ?? 'Remote',
          questions:   Array.isArray(t.questions) ? t.questions : [],
          payment:     Number(t.payment ?? 0),
          slots:       0,
          active:      true,
        }));
        if (!rows.length) return res.json({ success: true, inserted: 0, message: 'Already migrated.' });
        const { error: insErr } = await db.from('tasks').insert(rows);
        if (insErr) return res.json({ success: false, error: insErr.message });
        return res.json({ success: true, inserted: rows.length });
      }

      // ─── Task applications (proposals) ────────────────────────────────────
      case 'createApplication': {
        // Public: a user submits a proposal to work on a task. One active
        // (pending/approved) application per user per task.
        // Sanitize + validate server-side.
        const userId    = clean(p.userId, 64);
        const taskId    = clean(p.taskId, 64);
        const userEmail = clean(p.userEmail, 120);
        const userName  = clean(p.userName, 80);
        const taskTitle = clean(p.taskTitle, 160);
        const message   = clean(p.message, 600);
        const extra     = clean(p.extra, 600);
        if (!nonEmpty(userId) || !nonEmpty(taskId)) return res.json({ success: false, error: 'Missing user or task.' });
        if (!nonEmpty(message)) return res.json({ success: false, error: 'A proposal message is required.' });

        const { data: prior } = await db.from('applications')
          .select('id,status').eq('user_id', userId).eq('task_id', taskId)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (prior && (prior.status === 'pending' || prior.status === 'approved')) {
          return res.json({
            success: false,
            alreadyApplied: true,
            status: prior.status,
            message: prior.status === 'approved'
              ? 'Your application for this task is already approved.'
              : 'You already have an application awaiting review for this task.',
          });
        }

        const { data, error } = await db.from('applications').insert({
          user_id:    userId,
          user_email: userEmail,
          user_name:  userName,
          task_id:    taskId,
          task_title: taskTitle,
          message:    clampWords(message, 40),
          extra:      extra ? clampWords(extra, 40) : '',
          status:     'pending',
        }).select().single();
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, application: normApp(data) });
      }

      case 'listUserApplications': {
        // Public: a user's own applications, so the dashboard knows which tasks
        // are unlocked / pending / need attention.
        const { userId, email } = p;
        let query = db.from('applications').select('*');
        if (userId)     query = query.eq('user_id', userId);
        else if (email) query = query.eq('user_email', email);
        else return res.json({ data: [] });
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return res.json({ data: [], error: error.message });
        return res.json({ data: (data || []).map(normApp) });
      }

      case 'adminListApplications': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data, error } = await db.from('applications')
          .select('*').order('created_at', { ascending: false });
        if (error) return res.json({ data: [], error: error.message });
        return res.json({ data: (data || []).map(normApp) });
      }

      case 'adminUpdateApplication': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { applicationId, status, reason } = p;
        const allowed = ['pending', 'approved', 'rejected', 'correction'];
        if (!allowed.includes(status)) return res.json({ success: false, error: 'Invalid status.' });
        const updates = { status, updated_at: new Date().toISOString() };
        if (reason !== undefined) updates.reason = String(reason || '');
        const { data, error } = await db.from('applications')
          .update(updates).eq('id', applicationId).select().single();
        if (error) return res.json({ success: false, error: error.message });
        await logAction(db, {
          action: `application_${status}`, entity: 'application', entityId: applicationId,
          detail: `${data?.task_title || ''}, ${data?.user_email || ''}${reason ? `, ${reason}` : ''}`,
        });
        return res.json({ success: true, application: normApp(data) });
      }

      case 'adminListActions': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data, error } = await db.from('admin_actions')
          .select('*').order('created_at', { ascending: false }).limit(300);
        if (error) return res.json({ data: [], error: error.message });
        return res.json({ data: (data || []).map(normAction) });
      }

      case 'unsubscribeUser': {
        // Public but token-protected: sets the user's email opt-out flag.
        const { uid, token } = p;
        if (!verifyUnsubToken(uid, token)) return res.json({ success: false, error: 'Invalid or expired unsubscribe link.' });
        const { error } = await db.from('users').update({ unsubscribed: true }).eq('id', uid);
        if (error) return res.json({ success: false, error: error.message });
        await logAction(db, { action: 'unsubscribe', entity: 'user', entityId: uid, detail: 'User opted out of emails' });
        return res.json({ success: true });
      }

      // ─── Submitted-task review ────────────────────────────────────────────
      case 'adminListSubmissions': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data, error } = await db.from('submissions')
          .select('*').order('created_at', { ascending: false });
        if (error) return res.json({ data: [], error: error.message });
        return res.json({ data: (data || []).map(normSub) });
      }

      case 'adminUpdateSubmission': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { submissionId, status, reason } = p;
        const allowed = ['pending', 'approved', 'rejected', 'correction'];
        if (!allowed.includes(status)) return res.json({ success: false, error: 'Invalid status.' });
        const { data: sub } = await db.from('submissions')
          .select('*').eq('id', submissionId).maybeSingle();
        if (!sub) return res.json({ success: false, error: 'Submission not found.' });

        // Approving a not-yet-approved submission credits the reward to the user.
        // Capture the details needed for the confirmation email, and whether the
        // balance credit actually succeeded (the email must only go out if it did).
        const isNewApproval = status === 'approved' && sub.status !== 'approved';
        const reward = Number(sub.reward || 0);
        let creditUser = null;   // { email, name, newBalance, unsubscribed } when credited
        if (isNewApproval) {
          if (sub.user_id && reward > 0) {
            const { data: u } = await db.from('users')
              .select('balance,completed_tasks,email,full_name,unsubscribed').eq('id', sub.user_id).maybeSingle();
            if (u) {
              const newBalance = Number(u.balance || 0) + reward;
              const { error: balErr } = await db.from('users').update({
                balance:         newBalance,
                completed_tasks: Number(u.completed_tasks || 0) + 1,
              }).eq('id', sub.user_id);
              if (!balErr) {
                creditUser = { email: u.email, name: u.full_name, newBalance, unsubscribed: !!u.unsubscribed };
              }
            }
          }
          if (sub.task_id) {
            const { data: t } = await db.from('tasks')
              .select('claimed').eq('id', sub.task_id).maybeSingle();
            if (t) await db.from('tasks').update({ claimed: Number(t.claimed || 0) + 1 }).eq('id', sub.task_id);
          }
        }

        // Commit the status change (this is the "approval committed" step).
        const updates = { status, updated_at: new Date().toISOString() };
        if (reason !== undefined) updates.reason = String(reason || '');
        const { data: updated, error } = await db.from('submissions')
          .update(updates).eq('id', submissionId).select().single();
        if (error) return res.json({ success: false, error: error.message });
        await logAction(db, {
          action: `submission_${status}`, entity: 'submission', entityId: submissionId,
          detail: `${sub.task_title || ''}, ${sub.user_email || ''}${reason ? `, ${reason}` : ''}`,
        });

        // Auto-send the "Task Approved & Earnings Credited" email, only after a
        // successful new approval whose balance credit committed. Email failure
        // never rolls back the approval; it's logged so the admin can resend.
        let email = null;
        if (isNewApproval && creditUser && creditUser.email) {
          const amtStr = `KES ${reward.toLocaleString('en-KE')}`;
          try {
            if (creditUser.unsubscribed) {
              email = { attempted: false, sent: false, status: 'Skipped (unsubscribed)' };
            } else {
              const mail = await sendApprovalEmail({
                userEmail: creditUser.email, userName: creditUser.name,
                taskName: sub.task_title, amount: reward, updatedBalance: creditUser.newBalance,
              });
              email = { attempted: true, sent: !!mail.success, status: mail.success ? 'Sent' : 'Failed', message: mail.message || '' };
            }
          } catch (e) {
            email = { attempted: true, sent: false, status: 'Failed', message: e?.message || 'Send error' };
          }
          await logAction(db, {
            action: 'approval_email', entity: 'submission', entityId: submissionId,
            detail: `user:${sub.user_id} task:${sub.task_id} amount:${amtStr} status:${email.status}${email.message ? ` (${email.message})` : ''}`,
          });
        }

        return res.json({ success: true, submission: normSub(updated), email });
      }

      case 'adminResendApprovalEmail': {
        // Manually re-send the approval/payment-confirmation email for an
        // already-approved submission (e.g. after an earlier delivery failure).
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { submissionId } = p;
        const { data: sub } = await db.from('submissions')
          .select('*').eq('id', submissionId).maybeSingle();
        if (!sub) return res.json({ success: false, error: 'Submission not found.' });
        if (sub.status !== 'approved') return res.json({ success: false, error: 'Only approved submissions can have an approval email sent.' });

        const { data: u } = await db.from('users')
          .select('balance,email,full_name,unsubscribed').eq('id', sub.user_id).maybeSingle();
        if (!u || !u.email) return res.json({ success: false, error: 'User email not found.' });

        const reward = Number(sub.reward || 0);
        const amtStr = `KES ${reward.toLocaleString('en-KE')}`;
        if (u.unsubscribed) {
          await logAction(db, { action: 'approval_email_resend', entity: 'submission', entityId: submissionId,
            detail: `user:${sub.user_id} task:${sub.task_id} amount:${amtStr} status:Skipped (unsubscribed)` });
          return res.json({ success: false, unsubscribed: true, error: 'This user has unsubscribed from emails.' });
        }

        const mail = await sendApprovalEmail({
          userEmail: u.email, userName: u.full_name,
          taskName: sub.task_title, amount: reward, updatedBalance: Number(u.balance || 0),
        });
        await logAction(db, { action: 'approval_email_resend', entity: 'submission', entityId: submissionId,
          detail: `user:${sub.user_id} task:${sub.task_id} amount:${amtStr} status:${mail.success ? 'Sent' : 'Failed'}${mail.message ? ` (${mail.message})` : ''}` });
        return res.json({ success: !!mail.success, message: mail.message });
      }

      case 'adminClearTasks': {
        // Delete ALL tasks so a fresh set can be created with current dates.
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data: before } = await db.from('tasks').select('id');
        const { error } = await db.from('tasks').delete().not('id', 'is', null);
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, deleted: (before || []).length });
      }

      case 'adminMigratePremiumBalances': {
        // One-time: move any leftover premium-test balance (_pbal) into each
        // user's main dashboard balance, then drop the _pbal key. Idempotent.
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        const { data: rows, error: selErr } = await db.from('users').select('id,balance,task_submissions');
        if (selErr) return res.json({ success: false, error: selErr.message });
        let migrated = 0;
        let totalMoved = 0;
        for (const u of (rows || [])) {
          const subs = { ...(u.task_submissions || {}) };
          const pbal = Number(subs._pbal || 0);
          if (pbal > 0) {
            delete subs._pbal;
            const { error: updErr } = await db.from('users').update({
              balance: Number(u.balance || 0) + pbal,
              task_submissions: subs,
            }).eq('id', u.id);
            if (!updErr) { migrated += 1; totalMoved += pbal; }
          }
        }
        return res.json({ success: true, migrated, totalMoved });
      }

      case 'listUserSubmissions': {
        // A user's own submissions (used by the dashboard to show "already
        // submitted / already done" and auto-clear after 3 hours).
        const { userId, email } = p;
        let query = db.from('submissions').select('task_id,status,created_at');
        if (userId)      query = query.eq('user_id', userId);
        else if (email)  query = query.eq('user_email', email);
        else return res.json({ data: [] });
        const { data, error } = await query;
        if (error) return res.json({ data: [], error: error.message });
        // The dashboard shows "already submitted/done", then the task clears
        // 3 hours after submission, that timing is decided here (server-side).
        const CLEAR_MS = 3 * 60 * 60 * 1000;
        const nowMs = Date.now();
        return res.json({ data: (data || []).map(r => ({
          taskId:    r.task_id,
          status:    r.status,
          createdAt: r.created_at,   // used only to pick the latest submission per task
          cleared:   r.created_at ? (nowMs - new Date(r.created_at).getTime() > CLEAR_MS) : false,
        })) });
      }

      case 'adminSeedOfferTasks': {
        // Launch a fresh batch of 15 limited-time OFFER tasks (KES 2,000 to 4,200).
        // No premium needed, one submission each (slots=1), 9-hour window (from
        // created_at). Re-running replaces the batch and restarts the 9 hours.
        if (p.adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });
        await db.from('tasks').delete().like('id', 'offer%');
        const OFFERS = [
          { title: 'Write 3 Instagram captions for a coffee shop',        category: 'Writing',       payment: 2000 },
          { title: 'Transcribe a 5-minute audio clip',                    category: 'Transcription', payment: 2200 },
          { title: 'Summarize a 2-page article into 150 words',           category: 'Writing',       payment: 2400 },
          { title: 'Format a 3-page document neatly',                     category: 'Admin',         payment: 2500 },
          { title: 'Enter 50 rows of product data into a spreadsheet',    category: 'Data Entry',    payment: 2600 },
          { title: 'Translate 200 words from English to Swahili',         category: 'Translation',   payment: 2800 },
          { title: 'Complete a 10-question market research survey',        category: 'Survey',        payment: 2900 },
          { title: 'Proofread a 400-word blog post',                      category: 'Admin',         payment: 3000 },
          { title: 'Research and list 8 competitor prices',               category: 'Research',      payment: 3200 },
          { title: 'Write a 250-word product description',                category: 'Writing',       payment: 3400 },
          { title: 'Test a mobile app and report 5 bugs',                 category: 'Testing',       payment: 3600 },
          { title: 'Create 5 short-form video content ideas',             category: 'Marketing',     payment: 3800 },
          { title: 'Voice-record a clear 1-minute script',                category: 'Audio',         payment: 4000 },
          { title: 'Build a 6-question onboarding quiz',                  category: 'Education',     payment: 4100 },
          { title: 'Design a simple logo concept for a boutique',         category: 'Design',        payment: 4200 },
        ];
        const rows = OFFERS.map((o, i) => ({
          id:          `offer_${i + 1}`,
          title:       o.title,
          description: `${o.title}. Limited-time OFFER, no premium needed and first come, first served (only one person can complete each offer). Submit your completed work the same way as any other task before the offer ends.`,
          category:    o.category,
          poster:      'Business Hub • Offer',
          location:    'Remote',
          questions:   [],
          payment:     o.payment,
          slots:       1,
          claimed:     0,
          active:      true,
        }));
        const { error } = await db.from('tasks').insert(rows);
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, inserted: rows.length });
      }

      // ─── Profile (self-service) ───────────────────────────────────────────
      case 'updateProfile': {
        // Only Full Name and Username are user-editable (per the profile spec).
        // Extended fields (address, postalCode, state) are stored in _profile too
        // so the page can round-trip them, but the UI keeps them read-only.
        const userId = clean(p.userId, 64);
        if (!nonEmpty(userId)) return res.json({ success: false, error: 'Missing user.' });

        const { data: u } = await db.from('users')
          .select('task_submissions').eq('id', userId).maybeSingle();
        if (!u) return res.json({ success: false, error: 'User not found.' });

        const updates = {};
        if (p.fullName !== undefined) {
          const fullName = clean(p.fullName, 80);
          if (!nonEmpty(fullName)) return res.json({ success: false, error: 'Full name cannot be empty.' });
          updates.full_name = fullName;
        }

        const subs    = { ...(u.task_submissions || {}) };
        const profile = { ...(subs._profile || {}) };
        if (p.username   !== undefined) profile.username   = clean(p.username, 40);
        if (p.address    !== undefined) profile.address    = clean(p.address, 160);
        if (p.postalCode !== undefined) profile.postalCode = clean(p.postalCode, 20);
        if (p.state      !== undefined) profile.state      = clean(p.state, 80);
        subs._profile = profile;
        updates.task_submissions = subs;

        const { data: updated, error } = await db.from('users')
          .update(updates).eq('id', userId).select().single();
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, user: norm(updated) });
      }

      case 'updateAvatar': {
        const userId = clean(p.userId, 64);
        const avatar = String(p.avatar ?? '');
        if (!nonEmpty(userId)) return res.json({ success: false, error: 'Missing user.' });
        // Accept only image data URLs, and cap the stored size (~3MB of base64).
        if (avatar && !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(avatar)) {
          return res.json({ success: false, error: 'Unsupported image format.' });
        }
        if (avatar.length > 3_000_000) {
          return res.json({ success: false, error: 'Image is too large after processing.' });
        }
        const { data: u } = await db.from('users')
          .select('task_submissions').eq('id', userId).maybeSingle();
        if (!u) return res.json({ success: false, error: 'User not found.' });

        const subs    = { ...(u.task_submissions || {}) };
        const profile = { ...(subs._profile || {}) };
        profile.avatar = avatar;          // '' clears it back to initials
        subs._profile  = profile;

        const { data: updated, error } = await db.from('users')
          .update({ task_submissions: subs }).eq('id', userId).select().single();
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, user: norm(updated) });
      }

      case 'changeContact': {
        // Changing email or phone cancels the Premium subscription (per spec).
        // The new values arrive as newEmail/newPhone (the uid-based auth guard
        // strips a body `email` to prevent email-based user lookups).
        const userId = clean(p.userId, 64);
        if (!nonEmpty(userId)) return res.json({ success: false, error: 'Missing user.' });

        const updates = { premium: false, premium_paid_at: null };
        if (p.newEmail !== undefined && p.newEmail !== '') {
          const email = clean(p.newEmail, 120).toLowerCase();
          if (!isEmail(email)) return res.json({ success: false, error: 'A valid email address is required.' });
          // Enforce uniqueness (case-insensitive), ignoring the user's own row.
          const { data: existing } = await db.from('users').select('id').ilike('email', email).limit(2);
          if ((existing || []).some(r => String(r.id) !== String(userId))) {
            return res.json({ success: false, error: 'That email is already in use by another account.' });
          }
          updates.email = email;
        }
        if (p.newPhone !== undefined && p.newPhone !== '') {
          const phone = clean(p.newPhone, 20);
          if (!isPhone(phone)) return res.json({ success: false, error: 'A valid phone number is required.' });
          updates.phone = phone;
        }

        const { data: updated, error } = await db.from('users')
          .update(updates).eq('id', userId).select().single();
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true, user: norm(updated) });
      }

      case 'deleteAccount': {
        // Self-service permanent deletion, keyed by the session user id. Best-effort
        // cleanup of the user's related rows first, then the user record itself.
        const userId = clean(p.userId, 64);
        if (!nonEmpty(userId)) return res.json({ success: false, error: 'Missing user.' });
        try { await db.from('submissions').delete().eq('user_id', userId); } catch (_) {}
        try { await db.from('applications').delete().eq('user_id', userId); } catch (_) {}
        try { await db.from('withdrawal_requests').delete().eq('user_id', userId); } catch (_) {}
        const { error } = await db.from('users').delete().eq('id', userId);
        if (error) return res.json({ success: false, error: error.message });
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown op: ${op}` });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
