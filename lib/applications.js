// lib/applications.js, client helpers for the task-application (proposal) flow.
// Mirrors lib/auth.js: uses the /api/db proxy in production (Supabase) and a
// localStorage fallback for local development where Supabase isn't configured.
import { hasSupabase } from './supabase';
import { getToken } from './auth';

async function proxy(op, params = {}) {
  const r = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, authToken: getToken(), ...params }),
  });
  if (!r.ok) throw new Error(`DB error ${r.status}`);
  return r.json();
}

const LS_KEY = 'bh_applications';

function lsAll() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsSave(list) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (_) {}
}

// Submit a proposal for a task. Returns { success, application?, message?, alreadyApplied? }.
export async function applyForTask({ user, task, message, extra }) {
  if (!message || !String(message).trim()) {
    return { success: false, message: 'Please write a short proposal message first.' };
  }

  if (hasSupabase) {
    return proxy('createApplication', {
      userId:    user.id,
      userEmail: user.email || '',
      userName:  user.fullName || '',
      taskId:    task.id,
      taskTitle: task.title || '',
      message,
      extra:     extra || '',
    });
  }

  // localStorage fallback (local dev)
  const all = lsAll();
  const prior = all.find(a => a.userId === user.id && String(a.taskId) === String(task.id)
    && (a.status === 'pending' || a.status === 'approved'));
  if (prior) {
    return {
      success: false, alreadyApplied: true, status: prior.status,
      message: prior.status === 'approved'
        ? 'Your application for this task is already approved.'
        : 'You already have an application awaiting review for this task.',
    };
  }
  const application = {
    id:        Date.now(),
    userId:    user.id,
    email:     user.email || '',
    name:      user.fullName || '',
    taskId:    String(task.id),
    taskTitle: task.title || '',
    message:   String(message).trim(),
    extra:     extra ? String(extra).trim() : '',
    status:    'pending',
    reason:    '',
    createdAt: new Date().toISOString(),
  };
  all.unshift(application);
  lsSave(all);
  return { success: true, application };
}

// A user's applications. Returns an array of { taskId, status, reason, id, ... }.
export async function listMyApplications({ userId, email }) {
  if (hasSupabase) {
    try {
      const { data } = await proxy('listUserApplications', { userId, email });
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }
  return lsAll().filter(a => a.userId === userId);
}

// Reduce a list of applications to a map keyed by taskId, keeping the most
// recent application per task (the list is already newest-first).
export function applicationsByTask(apps) {
  const map = {};
  for (const a of apps || []) {
    const key = String(a.taskId);
    if (!map[key]) map[key] = a;   // first seen = most recent
  }
  return map;
}
