import { hasSupabase } from './supabase';

async function proxy(op, params = {}) {
  const r = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...params }),
  });
  if (!r.ok) throw new Error(`DB error ${r.status}`);
  return r.json();
}

const PREMIUM_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function norm(row) {
  if (!row) return null;
  const paidAt    = row.premium_paid_at ?? row.premiumPaidAt ?? null;
  const expiresAt = paidAt ? paidAt + PREMIUM_WEEK_MS : null;
  const active    = (row.premium ?? false) && (!expiresAt || Date.now() <= expiresAt);
  return {
    id:              row.id,
    fullName:        row.full_name       ?? row.fullName       ?? '',
    email:           row.email           ?? '',
    phone:           row.phone           ?? '',
    country:         row.country         ?? '',
    password:        row.password        ?? '',
    activated:       row.activated       ?? false,
    premium:         active,
    premiumPaidAt:   paidAt,
    premiumExpiresAt: expiresAt,
    balance:         Number(row.balance  ?? 0),
    referralCount:   Number(row.referral_count  ?? row.referralCount  ?? 0),
    referredBy:      row.referred_by     ?? row.referredBy     ?? null,
    completedTasks:  Number(row.completed_tasks ?? row.completedTasks ?? 0),
    activeBids:      Number(row.active_bids     ?? row.activeBids     ?? 0),
    taskSubmissions: row.task_submissions ?? row.taskSubmissions ?? {},
    createdAt:       row.created_at      ?? row.createdAt,
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

export async function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const id = getSessionId();
  if (!id) return null;

  if (hasSupabase) {
    const { data } = await proxy('getUser', { id });
    return data;
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
}

export async function registerUser({
  fullName, email, phone, country, password,
  activated = false, premium = false, premiumPaidAt = null,
  balance = 0, referralCount = 0, referredBy = null,
}) {
  if (hasSupabase) {
    return proxy('registerUser', {
      fullName, email, phone, country, password,
      activated, premium, premiumPaidAt, balance, referralCount, referredBy,
    });
  }

  const users = lsGetUsers();
  if (users.find(u => u.email === email)) {
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
      // Run migration silently in the background — don't block login
      migrateLocalStorageUser(result.user.id);
      setCurrentUser(result.user);
      return result;
    }

    // Supabase has no record — user may have registered before Supabase was connected
    const raw = lsGetUsers().find(u => u.email === email && u.password === password);
    if (!raw) return result; // return the original "invalid credentials" failure

    // Migrate then log in
    try {
      const { data } = await proxy('migrateUser', { user: raw });
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
      u.activated = true;
      u.balance   = (u.balance || 0) + Number(amountPaid);
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
    kraPin:      row.kra_pin      ?? row.kraPin,
    amount:      Number(row.amount || 0),
    status:      row.status       ?? 'pending',
    deadline:    row.deadline,
    requestedAt: row.requested_at ?? row.requestedAt,
  };
}

export async function createWithdrawalRequest(userId, { fullName, phone, idNumber, kraPin, amount }) {
  if (hasSupabase) {
    const { data } = await proxy('createWithdrawal', { userId, fullName, phone, idNumber, kraPin, amount });
    return data;
  }

  const req = {
    id: Date.now().toString(),
    userId, fullName, phone, idNumber, kraPin,
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
