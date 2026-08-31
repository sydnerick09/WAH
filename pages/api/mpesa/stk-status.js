// pages/api/mpesa/stk-status.js — the client polls this to learn whether an STK
// payment succeeded. Primary source is the recorded callback result; if still
// pending we fall back to an STK query so a missed callback can't strand a user.
import { verifyToken } from '../../../lib/token';
import { getTransaction, completeStk } from '../../../lib/mpesaStore';
import { stkQuery } from '../../../lib/daraja';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error' });
  const uid = verifyToken(req.body?.authToken);
  if (!uid) return res.status(401).json({ status: 'error' });

  const id = String(req.body?.checkoutRequestId || '');
  if (!id) return res.json({ status: 'unknown' });

  let tx = await getTransaction(id);
  if (!tx) return res.json({ status: 'unknown' });
  if (tx.user_id && tx.user_id !== uid) return res.status(403).json({ status: 'error' });

  // Verification fallback: if the callback hasn't landed yet, ask Daraja directly.
  if (tx.status === 'pending') {
    try {
      const { data } = await stkQuery(id);
      if (data && data.ResultCode !== undefined && String(data.ResultCode) !== '') {
        await completeStk({ checkoutRequestId: id, resultCode: data.ResultCode, resultDesc: data.ResultDesc });
        tx = await getTransaction(id);
      }
    } catch (_) { /* keep pending; the client keeps polling */ }
  }

  return res.json({ status: tx.status, purpose: tx.purpose, amount: tx.amount, receipt: tx.mpesa_receipt || null });
}


