// lib/validate.js — shared input validators + sanitizers used on BOTH the
// client (immediate form feedback) and the server (authoritative checks, so we
// never rely on client-side validation alone).

export const isEmail = (s) =>
  typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

// Accepts +country codes, spaces, dashes and parentheses; 7–15 digits.
export const isPhone = (s) =>
  typeof s === 'string' && /^\+?\d{7,15}$/.test(String(s).replace(/[\s\-()]/g, ''));

export const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

export const isPositiveNumber = (n) => {
  const x = Number(n);
  return Number.isFinite(x) && x > 0;
};

// Trim and hard-cap a string's length (defends against oversized payloads).
export const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);
