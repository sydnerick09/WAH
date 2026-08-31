// pages/api/paystack/initialize.js
// Initialize a Paystack transaction (server-side; secret key never leaves the
// server). Used for the KES 650 withdrawal fee (and other bank withdrawal fees).
// The paying user is derived from the signed session token, and stored in the
// Paystack metadata so the verify step can attribute the payment securely.
import { verifyToken } from '../../../lib/token';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method not allowed' });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).json({ status: false, message: 'Paystack is not configured.' });

  const { email, amount, plan, phone, method, authToken } = req.body || {};
  const uid = verifyToken(authToken);
  if (!uid) return res.status(401).json({ status: false, message: 'Unauthorized' });

  const amt = Math.round(Number(amount) || 0);
  if (!email || amt <= 0) return res.status(400).json({ status: false, message: 'A valid email and amount are required.' });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
  const callback_url = `${origin}/payment-success?plan=${encodeURIComponent(plan || '')}&method=${encodeURIComponent(method || '')}`;

  try {
    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: amt * 100,            // Paystack expects the smallest unit (KES × 100)
        currency: 'KES',
        callback_url,
        metadata: { userId: uid, plan: plan || '', purpose: plan || '', phone: phone || '' },
      }),
    });
    const data = await r.json();
    if (!data.status) return res.status(400).json(data);
    return res.status(200).json(data);   // { status, data: { authorization_url, access_code, reference } }
  } catch (e) {
    return res.status(502).json({ status: false, message: 'Could not reach Paystack. Please try again.' });
  }
}


