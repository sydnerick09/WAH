// lib/unsubToken.js — server-side helpers for the per-user unsubscribe link.
// The token is an HMAC of the user id keyed by ADMIN_SECRET, so the unsubscribe
// URL can be verified without a login and cannot be forged for other users.
import crypto from 'crypto';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://onlinejob-pi.vercel.app';

function secret() {
  return process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'business-hub';
}

export function makeUnsubToken(uid) {
  return crypto.createHmac('sha256', secret()).update(String(uid)).digest('hex').slice(0, 24);
}

export function verifyUnsubToken(uid, token) {
  if (!uid || !token) return false;
  const expected = makeUnsubToken(uid);
  const a = Buffer.from(String(token));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function unsubscribeUrl(uid) {
  return `${PUBLIC_BASE_URL}/unsubscribe?uid=${encodeURIComponent(uid)}&token=${makeUnsubToken(uid)}`;
}
