// lib/notify.js — client helper for the automated-email endpoint.
export async function sendNotify(payload) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return !!(data && data.success);
  } catch {
    return false;
  }
}
