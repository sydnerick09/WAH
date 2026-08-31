// lib/settings.js — client helper for global app settings.
// Currently just the M-Pesa Buy Goods till used for Premium + withdrawal fees.
export const DEFAULT_TILL = '1545320';

export async function fetchTill() {
  try {
    const r = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'getSettings' }),
    });
    const d = await r.json();
    return (d && d.till) ? String(d.till) : DEFAULT_TILL;
  } catch {
    return DEFAULT_TILL;
  }
}


