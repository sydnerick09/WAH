// lib/password.js — SERVER-ONLY password hashing (Node crypto scrypt, no deps).
// Format: "scrypt$<salt-hex>$<hash-hex>". Legacy plaintext passwords are still
// accepted at verify time and transparently upgraded on the next login.
import crypto from 'crypto';

const PREFIX  = 'scrypt$';
const KEYLEN  = 64;

export function hashPassword(plain) {
  const salt    = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(plain), salt, KEYLEN).toString('hex');
  return `${PREFIX}${salt}$${derived}`;
}

export function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

// Returns { ok, legacy }. `legacy` is true when the stored value was plaintext
// (so the caller can re-hash it after a successful login).
export function verifyPassword(plain, stored) {
  if (!isHashed(stored)) {
    return { ok: String(plain) === String(stored ?? ''), legacy: true };
  }
  const [, salt, hash] = stored.split('$');   // ['scrypt', salt, hash]
  if (!salt || !hash) return { ok: false, legacy: false };
  const derived = crypto.scryptSync(String(plain), salt, KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  const ok = derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  return { ok, legacy: false };
}
