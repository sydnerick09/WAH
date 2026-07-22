// lib/token.js — SERVER-ONLY signed session tokens (HMAC-SHA256, no deps).
// Format: "<base64url(payload)>.<base64url(sig)>" where payload = {uid, exp}.
// Stateless: the server can verify a token without any store. The signing key
// is an existing server-only secret, so tokens can't be forged by the client.
import crypto from 'crypto';

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret() {
  return process.env.SESSION_SECRET
      || process.env.ADMIN_SECRET
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || 'insecure-dev-secret';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  return Buffer.from(String(str).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function sign(payload) {
  return b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
}

export function issueToken(uid) {
  const payload = b64url(JSON.stringify({ uid: String(uid), exp: Date.now() + TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

// Returns the uid string when the token is valid and unexpired, else null.
export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(b64urlDecode(payload));
    if (!obj.uid || !obj.exp || Date.now() > obj.exp) return null;
    return String(obj.uid);
  } catch {
    return null;
  }
}
