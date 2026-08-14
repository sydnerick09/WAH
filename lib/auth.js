import { hasSupabase } from './supabase';

// Signed session token (issued by the server at login/register). Attached to
// every request so the server can authorize user-scoped ops from the token
// rather than a user id in the body.
const TOKEN_KEY = 'bh_token';
export function getToken() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t) {
  if (typeof window === 'undefined' || !t) return;
  try { localStorage.setItem(TOKEN_KEY, t); } catch (_) {}
}
function clearToken() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
}

async function proxy(op, params = {}) {
  const r = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, authToken: getToken(), ...params }),
  });
  if (!r.ok) throw new Error(`DB error ${r.status}`);
  return r.json();
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function norm(row) {
  if (!row) return null;
  const subs = row.task_submissions ?? row.taskSubmissions ?? {};

  // Activation: timestamp stored in task_submissions._act, no DB schema change needed
  const actAt      = subs._act ?? null;
  const actExpires = actAt ? actAt + ONE_MONTH_MS : null;
  const activated  = actAt !== null && (!actExpires || Date.now() <= actExpires);

  // Joining-gift quiz: stored in task_submissions._quiz (one-time)
  const quiz = subs._quiz ?? null;

  // Premium math test: separate balance (_pbal) usable only toward premium (_ptest = one-time flag)
  const ptest = subs._ptest ?? null;

  // Premium: same 1-month window from premium_paid_at
  const paidAt    = row.premium_paid_at ?? row.premiumPaidAt ?? null;
  const premExpires = paidAt ? paidAt + ONE_MONTH_MS : null;
  const premium   = (row.premium ?? false) && paidAt !== null && (!premExpires || Date.now() <= premExpires);

  // Extended profile fields live in task_submissions._profile.
  const profile = subs._profile ?? {};

  return {
    id:               row.id,
    fullName:         row.full_name       ?? row.fullName       ?? '',
    email:            row.email           ?? '',
    phone:            row.phone           ?? '',
    country:          row.country         ?? '',
    password:         row.password        ?? '',
    username:         profile.username    ?? '',
    avatar:           profile.avatar      ?? '',
    address:          profile.address     ?? '',
    postalCode:       profile.postalCode  ?? '',
    state:            profile.state       ?? '',
    activated,
    activatedAt:      actAt,
    activatedExpiresAt: actExpires,
    premium,
    premiumPaidAt:    paidAt,
    premiumExpiresAt: premExpires,
    balance:          Number(row.balance  ?? 0),
    referralCount:    Number(row.referral_count  ?? row.referralCount  ?? 0),
    referredBy:       row.referred_by     ?? row.referredBy     ?? null,
    completedTasks:   Number(row.completed_tasks ?? row.completedTasks ?? 0),
    activeBids:       Number(row.active_bids     ?? row.activeBids     ?? 0),
    taskSubmissions:  subs,
    createdAt:        row.created_at      ?? row.createdAt,
    quizDone:         quiz !== null,
    quizScore:        Number(quiz?.score  ?? 0),
    quizEarned:       Number(quiz?.earned ?? 0),
    premiumBalance:   Number(subs._pbal   ?? 0),
    premiumTestDone:  ptest !== null,
    premiumTestScore: Number(ptest?.score ?? 0),
    streak:           Math.max(0, Number(subs._streak?.count ?? 0)),
    lastLoginDay:     subs._streak?.lastDay ?? null,
    notifications:    Array.isArray(subs._notifs) ? subs._notifs : [],
  };
}

function getSessionId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bh_session_uid') || (() => {
    try {
      const cu = JSON.parse(localStorage.getItem('bh_current_user') || 'null');
      return cu?.id || null;
    } catch { return null; }
  })();
}

function setSessionId(id) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bh_session_uid', id);
}

function lsGetUsers() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('bh_users') || '[]'); } catch { return []; }
}

function lsSave(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bh_users', JSON.stringify(users));
}

// task_submissions has historically been stored under both `taskSubmissions`
// (camelCase, from registerUser) and `task_submissions` (snake_case, from
// activateUser). Merge both when reading and mirror to both when writing so no
// flag (_act / _quiz) is ever shadowed.
function mergeSubs(u) {
  return { ...(u.taskSubmissions || {}), ...(u.task_submissions || {}) };
}
function writeSubs(u, subs) {
  u.task_submissions = subs;
  u.taskSubmissions  = subs;
}

export async function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const id = getSessionId();
  if (!id) return null;

  if (hasSupabase) {
    // A missing/expired token makes getUser 401 → return null so the caller
    // sends the user to log in again (which re-issues a token).
    try {
      const { data } = await proxy('getUser', { id });
      return data;
    } catch { return null; }
  }

  try {
    const users = lsGetUsers();
    const found = users.find(u => u.id === id);
    return norm(found) || null;
  } catch { return null; }
}

export function setCurrentUser(user) {
  if (typeof window === 'undefined' || !user) return;
  setSessionId(user.id);
  if (!hasSupabase) {
    localStorage.setItem('bh_current_user', JSON.stringify(user));
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bh_session_uid');
  localStorage.removeItem('bh_current_user');
  clearToken();
}

// Multiple accounts are allowed on the same device/browser: there is no
// device/browser binding. Accounts remain fully separated (each is its own
// user record + session); switching is just log out then log in.

export async function registerUser({
  fullName, email, phone, country, password,
  activated = false, premium = false, premiumPaidAt = null,
  balance = 0, referralCount = 0, referredBy = null,
}) {
  if (hasSupabase) {
    const result = await proxy('registerUser', {
      fullName, email, phone, country, password,
      activated, premium, premiumPaidAt, balance, referralCount, referredBy,
    });
    if (result?.success && result.authToken) setToken(result.authToken);
    return result;
  }

  const users = lsGetUsers();
  if (users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase())) {
    return { success: false, message: 'Email already registered.' };
  }

  const id = Date.now().toString();
  const newUser = {
    id, fullName, email, phone, country, password,
    activated, premium, premiumPaidAt, balance, referralCount, referredBy,
    completedTasks: 0, activeBids: 0, taskSubmissions: {},
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  if (referredBy && referredBy !== id) {
    const ri = users.findIndex(u => u.id === referredBy);
    if (ri !== -1) users[ri].balance = (users[ri].balance || 0) + 70;
  }

  lsSave(users);
  return { success: true, user: norm(newUser) };
}

async function migrateLocalStorageUser(userId) {
  if (!hasSupabase || typeof window === 'undefined') return;
  const flagKey = `bh_migration_done_${userId}`;
  if (localStorage.getItem(flagKey) === 'true') return;

  const localUser = lsGetUsers().find(u => u.id === userId);
  if (localUser) {
    try { await proxy('migrateUser', { user: localUser }); } catch (_) {}
  }
  localStorage.setItem(flagKey, 'true');
}

export async function loginUser({ email, password }) {
  if (hasSupabase) {
    const result = await proxy('loginUser', { email, password });

    if (result.success && result.user) {
      if (result.authToken) setToken(result.authToken);
      // Run migration silently in the background, don't block login
      migrateLocalStorageUser(result.user.id);
      setCurrentUser(result.user);
      return result;
    }

    // Supabase has no record, user may have registered before Supabase was connected
    const raw = lsGetUsers().find(u => u.email === email && u.password === password);
    if (!raw) return result; // return the original "invalid credentials" failure

    // Migrate then log in
    try {
      const { data, authToken } = await proxy('migrateUser', { user: raw });
      if (authToken) setToken(authToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`bh_migration_done_${raw.id}`, 'true');
      }
      const user = (data && norm(data)) || norm(raw);
      setCurrentUser(user);
      return { success: true, user };
    } catch (_) {
      // Migration failed but still let them in via local data
      const user = norm(raw);
      setCurrentUser(user);
      return { success: true, user };
    }
  }

  const users = lsGetUsers();
  const raw = users.find(u => u.email === email && u.password === password);
  if (!raw) return { success: false, message: 'Invalid email or password.' };
  const user = norm(raw);
  setCurrentUser(user);
  return { success: true, user };
}

export async function activateUser(userId, amountPaid = 50) {
  if (typeof window === 'undefined') return null;

  if (hasSupabase) {
    const { data } = await proxy('activateUser', { userId, amountPaid });
    if (data) setCurrentUser(data);
    return data;
  }

  const users = lsGetUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      u.activated         = true;
      u.task_submissions  = { ...(u.task_submissions || {}), _act: Date.now() };
      u.balance           = (u.balance || 0) + Number(amountPaid);
      if (u.referredBy) {
        const ref = users.find(r => r.id === u.referredBy);
        if (ref) {
          ref.balance       = (ref.balance || 0) + 132;
          ref.referralCount = (ref.referralCount || 0) + 1;
        }
      }
    }
    return u;
  });
  lsSave(updatedUsers);
  const cu  = updatedUsers.find(u => u.id === userId);
  const out = norm(cu);
  if (out) setCurrentUser(out);
  return out;
}

// Joining-gift quiz: award KES 10 per correct answer (max KES 50), once only.
export async function awardQuizBonus(userId, correctCount) {
  if (typeof window === 'undefined') return null;
  const count  = Math.max(0, Math.min(5, Number(correctCount) || 0));
  const earned = count * 10;

  if (hasSupabase) {
    const { data } = await proxy('awardQuiz', { userId, correctCount: count });
    if (data) setCurrentUser(data);
    return data;
  }

  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  const u    = users[idx];
  const subs = mergeSubs(u);
  if (subs._quiz) {                      // already claimed, never award twice
    const already = norm(u);
    setCurrentUser(already);
    return already;
  }
  subs._quiz = { score: count, earned, at: Date.now() };
  writeSubs(u, subs);
  u.balance  = (u.balance || 0) + earned;
  users[idx] = u;
  lsSave(users);
  const out = norm(u);
  setCurrentUser(out);
  return out;
}

// Activate using the account balance. Consumes up to KES 50 of balance as the
// activation fee (works for both the "balance ≥ 50" path and the post-top-up
// path where the Paystack payment covered the shortfall).
export async function activateWithBalance(userId) {
  if (typeof window === 'undefined') return null;

  if (hasSupabase) {
    const { data } = await proxy('activateWithBalance', { userId });
    if (data) setCurrentUser(data);
    return data;
  }

  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  const u        = users[idx];
  const balance  = Number(u.balance || 0);
  const consumed = Math.min(balance, 50);
  const subs     = mergeSubs(u);
  subs._act = Date.now();
  writeSubs(u, subs);
  u.balance = balance - consumed;

  if (u.referredBy) {
    const ref = users.find(r => r.id === u.referredBy);
    if (ref) {
      ref.balance       = (ref.balance || 0) + 132;
      ref.referralCount = (ref.referralCount || 0) + 1;
    }
  }
  users[idx] = u;
  lsSave(users);
  const out = norm(u);
  setCurrentUser(out);
  return out;
}

// Premium skills test: KES 42 per correct answer added to the SEPARATE premium
// balance (_pbal). One-time. Never touches the main dashboard balance.
export async function awardPremiumTest(userId, correctCount) {
  if (typeof window === 'undefined') return null;
  const count  = Math.max(0, Math.min(5, Number(correctCount) || 0));
  const earned = count * 42;

  if (hasSupabase) {
    const { data } = await proxy('awardPremiumTest', { userId, correctCount: count });
    if (data) setCurrentUser(data);
    return data;
  }

  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  const u    = users[idx];
  const subs = mergeSubs(u);
  if (subs._ptest) {                     // already taken, never award twice
    const already = norm(u);
    setCurrentUser(already);
    return already;
  }
  subs._ptest = { score: count, earned, at: Date.now() };
  subs._pbal  = Number(subs._pbal || 0) + earned;
  writeSubs(u, subs);
  users[idx] = u;
  lsSave(users);
  const out = norm(u);
  setCurrentUser(out);
  return out;
}

// Pay for premium (KES 480) using the premium balance. Consumes up to 480 of the
// premium balance (works both for "premiumBalance ≥ 480" and the post-top-up path).
export async function upgradePremiumWithBalance(userId) {
  if (typeof window === 'undefined') return null;

  if (hasSupabase) {
    const { data } = await proxy('upgradePremiumWithBalance', { userId });
    if (data) setCurrentUser(data);
    return data;
  }

  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  const u        = users[idx];
  const subs     = mergeSubs(u);
  const pbal     = Number(subs._pbal || 0);
  const consumed = Math.min(pbal, 480);
  subs._pbal     = pbal - consumed;
  writeSubs(u, subs);
  u.premium       = true;
  u.premiumPaidAt = Date.now();
  users[idx] = u;
  lsSave(users);
  const out = norm(u);
  setCurrentUser(out);
  return out;
}

export async function upgradeToPremium(userId) {
  if (hasSupabase) {
    const { data } = await proxy('upgradeToPremium', { userId });
    if (data) setCurrentUser(data);
    return data || false;
  }

  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].premium       = true;
  users[idx].premiumPaidAt = Date.now();
  lsSave(users);
  const out = norm(users[idx]);
  setCurrentUser(out);
  return out;
}

export async function submitTaskWithFile(userId, taskId, rewardAmount = 0) {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Not available server-side.' };
  }

  if (hasSupabase) {
    const result = await proxy('submitTask', { userId, taskId, rewardAmount });
    if (result.success && result.user) setCurrentUser(result.user);
    return result;
  }

  const key   = String(taskId);
  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, message: 'User not found.' };

  const u = users[idx];
  if (!u.taskSubmissions) u.taskSubmissions = {};
  if (u.taskSubmissions[key]) {
    return {
      success: false,
      alreadySubmitted: true,
      message: `Already submitted on ${new Date(u.taskSubmissions[key].submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}.`,
    };
  }

  u.taskSubmissions[key] = { submittedAt: new Date().toISOString(), reward: rewardAmount };
  u.completedTasks = (u.completedTasks || 0) + 1;
  u.balance        = (u.balance || 0) + rewardAmount;
  users[idx] = u;
  lsSave(users);
  const out = norm(u);
  setCurrentUser(out);
  return { success: true, user: out };
}

function normalizeWithdrawal(row) {
  if (!row) return null;
  return {
    id:          row.id,
    userId:      row.user_id      ?? row.userId,
    fullName:    row.full_name    ?? row.fullName,
    phone:       row.phone,
    idNumber:    row.id_number    ?? row.idNumber,
    amount:      Number(row.amount || 0),
    status:      row.status       ?? 'pending',
    deadline:    row.deadline,
    requestedAt: row.requested_at ?? row.requestedAt,
  };
}

export async function createWithdrawalRequest(userId, { fullName, phone, idNumber, amount, feeRef, method }) {
  if (hasSupabase) {
    const { data, error } = await proxy('createWithdrawal', { userId, fullName, phone, idNumber, amount, feeRef, method });
    if (error) return { error };
    return data;
  }

  const req = {
    id: Date.now().toString(),
    userId, fullName, phone, idNumber,
    amount:      Number(amount),
    status:      'pending',
    deadline:    Date.now() + 2 * 60 * 60 * 1000,
    requestedAt: new Date().toISOString(),
  };
  try { localStorage.setItem(`withdrawal_pending_${userId}`, JSON.stringify(req)); } catch (_) {}
  return req;
}

export async function getWithdrawalRequest(userId) {
  if (hasSupabase) {
    const { data } = await proxy('getWithdrawal', { userId });
    return data;
  }

  try {
    const raw = localStorage.getItem(`withdrawal_pending_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function updateWithdrawalStatus(requestId, userId, status) {
  if (hasSupabase) {
    const { data } = await proxy('updateWithdrawal', { requestId, status });
    return data;
  }

  try {
    const key = `withdrawal_pending_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const req = { ...JSON.parse(raw), status };
    localStorage.setItem(key, JSON.stringify(req));
    return req;
  } catch { return null; }
}

export async function createBid(userId) {
  if (hasSupabase) {
    const { data } = await proxy('createBid', { userId });
    if (data) setCurrentUser(data);
    return data || false;
  }

  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].activeBids = (users[idx].activeBids || 0) + 1;
  lsSave(users);
  setCurrentUser(users[idx]);
  return norm(users[idx]);
}

// ── Profile (self-service) ────────────────────────────────────────────────────
// Local-mode helper: patch the current user's _profile bucket in localStorage.
function lsPatchProfile(userId, patch) {
  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, message: 'User not found.' };
  const u    = users[idx];
  const subs = mergeSubs(u);
  subs._profile = { ...(subs._profile || {}), ...patch };
  writeSubs(u, subs);
  users[idx] = u;
  lsSave(users);
  const out = norm(u);
  setCurrentUser(out);
  return { success: true, user: out };
}

// Update editable profile fields (Full Name + Username; address/postal/state accepted).
export async function updateProfile(userId, fields) {
  if (hasSupabase) {
    const r = await proxy('updateProfile', { userId, ...fields });
    if (r.success && r.user) setCurrentUser(r.user);
    return r;
  }
  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, message: 'User not found.' };
  if (fields.fullName !== undefined) users[idx].fullName = fields.fullName;
  lsSave(users);
  const { username, address, postalCode, state } = fields;
  return lsPatchProfile(userId, { username, address, postalCode, state });
}

// Save (or clear) the profile picture. `avatar` is an image data URL, or '' to remove.
export async function updateAvatar(userId, avatar) {
  if (hasSupabase) {
    const r = await proxy('updateAvatar', { userId, avatar });
    if (r.success && r.user) setCurrentUser(r.user);
    return r;
  }
  return lsPatchProfile(userId, { avatar });
}

// Change email and/or phone. Cancels Premium (server enforces this too).
// Uses newEmail/newPhone param names so the server's uid-based auth guard
// (which strips `email` from user-scoped requests) can't clobber the new value.
export async function changeContact(userId, { fullName, email, phone, feeRef }) {
  if (hasSupabase) {
    const r = await proxy('changeContact', { newFullName: fullName, newEmail: email, newPhone: phone, feeRef });
    if (r.success && r.user) setCurrentUser(r.user);
    return r;
  }
  const users = lsGetUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, message: 'User not found.' };
  if (fullName !== undefined) users[idx].fullName = String(fullName);
  if (email !== undefined) users[idx].email = String(email).toLowerCase();
  if (phone !== undefined) users[idx].phone = String(phone);
  lsSave(users);
  const out = norm(users[idx]);
  setCurrentUser(out);
  return { success: true, user: out };
}

// Permanently delete the signed-in account, then clear the local session.
export async function deleteAccount(userId) {
  if (hasSupabase) {
    const r = await proxy('deleteAccount', { userId });
    if (r.success) logout();
    return r;
  }
  const users = lsGetUsers().filter(u => u.id !== userId);
  lsSave(users);
  logout();
  return { success: true };
}

// ── Bulk withdrawal (balances ≥ KES 25,000) ──────────────────────────────────
// Record a successfully-paid M-Pesa withdrawal fee (deduped server-side by ref).
export async function recordMpesaFee(reference) {
  if (hasSupabase) return proxy('recordMpesaFee', { reference });
  return { success: true };   // local dev: no persistent fee history
}

// Server-authoritative fee quote (live USD→KES + user-declared, capped deductions).
// `declaredFees` = how many previous M-Pesa fees the user says they paid (0–2).
export async function bulkWithdrawalQuote(declaredFees, context) {
  const n = Math.max(0, Math.min(2, Math.floor(Number(declaredFees) || 0)));
  if (hasSupabase) return proxy('bulkWithdrawalQuote', { declaredFees: n, context });
  // Local dev fallback (no live FX): full USD 23 at an approximate rate, minus the declared credits.
  const rate = 129, convertedKes = Math.round(23 * rate), deductionKes = n * 650;
  return { success: true, eligible: true, balance: 0, feeUsd: 23, rate, rateLive: false,
    convertedKes, recordedFees: 0, declaredFees: n, eligibleDeductions: n, perFeeKes: 650, maxDeductions: 2,
    deductionKes, amountDueKes: Math.max(0, convertedKes - deductionKes) };
}

// Validate bank details + recompute the quote server-side, logging the request.
export async function submitBulkWithdrawal(details) {
  if (hasSupabase) return proxy('submitBulkWithdrawal', details);
  return bulkWithdrawalQuote(details?.declaredFees);
}

// ── Gamification ──────────────────────────────────────────────────────────────
// Record a daily login (server-dated once per UTC day) and return the current
// streak + any XP bonus. Safe to call on every dashboard load.
export async function recordDailyLogin(userId) {
  if (!userId) return { success: false };
  if (hasSupabase) {
    try { return await proxy('recordDailyLogin', { userId }); } catch { return { success: false }; }
  }
  try {
    const users = lsGetUsers();
    const idx   = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false };
    const u    = users[idx];
    const subs = mergeSubs(u);
    const s    = (subs._streak && typeof subs._streak === 'object') ? subs._streak : { count: 0, lastDay: null };
    const today = new Date().toISOString().slice(0, 10);
    const yday  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let isNewDay = false, bonusXp = 0;
    if (s.lastDay !== today) {
      isNewDay  = true;
      s.count   = (s.lastDay === yday) ? Number(s.count || 0) + 1 : 1;
      s.lastDay = today;
      bonusXp   = 20 + Math.min(Number(s.count), 7) * 5;
      subs._streak = s;
      writeSubs(u, subs);
      users[idx] = u;
      lsSave(users);
      setCurrentUser(norm(u));
    }
    return { success: true, streak: Number(s.count || 0), isNewDay, bonusXp, lastDay: s.lastDay };
  } catch { return { success: false }; }
}

// Top players by server-derived XP (masked names). Returns [] on any failure.
export async function fetchLeaderboard(limit = 10) {
  if (hasSupabase) {
    try { const { data } = await proxy('gamificationLeaderboard', { limit }); return Array.isArray(data) ? data : []; }
    catch { return []; }
  }
  return [];
}

// ── Marketplace (Phase A): user-posted tasks ─────────────────────────────────
// Identity is the signed session token; the server encodes the creator in the
// task id so only the owner can list/remove their own tasks.
export async function postUserTask(fields) {
  if (hasSupabase) {
    try { return await proxy('createUserTask', { authToken: getToken(), ...fields }); }
    catch { return { success: false, error: 'Network error. Please try again.' }; }
  }
  return { success: false, error: 'Posting tasks requires the live database.' };
}

export async function listMyPostedTasks() {
  if (hasSupabase) {
    try { const { data } = await proxy('listMyTasks', { authToken: getToken() }); return Array.isArray(data) ? data : []; }
    catch { return []; }
  }
  return [];
}

export async function deleteMyTask(taskId) {
  if (hasSupabase) {
    try { return await proxy('deleteMyTask', { authToken: getToken(), taskId }); }
    catch { return { success: false }; }
  }
  return { success: false };
}

// ── Marketplace (Phase B): creator review + notifications ─────────────────────
export async function listMyReviewSubmissions() {
  if (hasSupabase) {
    try { const { data } = await proxy('listMyReviewSubmissions', { authToken: getToken() }); return Array.isArray(data) ? data : []; }
    catch { return []; }
  }
  return [];
}

export async function reviewSubmission(submissionId, status, reason) {
  if (hasSupabase) {
    try { return await proxy('reviewSubmission', { authToken: getToken(), submissionId, status, reason }); }
    catch { return { success: false, error: 'Network error. Please try again.' }; }
  }
  return { success: false, error: 'Review requires the live database.' };
}

export async function markNotificationsRead() {
  if (hasSupabase) {
    try { return await proxy('markNotificationsRead', { authToken: getToken() }); } catch { return { success: false }; }
  }
  return { success: false };
}

// ── Payment ledger ────────────────────────────────────────────────────────────
// Record a manual M-Pesa Till payment as a pending, auditable transaction
// (best-effort; supplements the support email in TillPay).
export async function logTillPayment({ type, amount, phone, reference }) {
  if (!hasSupabase) return { success: false };
  try { return await proxy('logPayment', { authToken: getToken(), provider: 'mpesa_till', type, amount, phone, reference }); }
  catch { return { success: false }; }
}
