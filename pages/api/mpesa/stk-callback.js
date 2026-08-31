// pages/api/mpesa/stk-callback.js — Daraja calls this when an STK push resolves.
// Always ACK with HTTP 200 + ResultCode 0 (otherwise Safaricom retries). The
// shared secret in the query string authenticates the caller.
import { verifyCallbackSecret } from '../../../lib/daraja';
import { completeStk } from '../../../lib/mpesaStore';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ResultCode: 0, ResultDesc: 'Ignored' });
  if (!verifyCallbackSecret(req)) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Rejected' });

  try {
    const cb = req.body?.Body?.stkCallback;
    if (cb && cb.CheckoutRequestID) {
      let receipt = null;
      for (const it of (cb.CallbackMetadata?.Item || [])) {
        if (it.Name === 'MpesaReceiptNumber') receipt = it.Value;
      }
      await completeStk({
        checkoutRequestId: cb.CheckoutRequestID,
        resultCode: cb.ResultCode,
        resultDesc: cb.ResultDesc,
        receipt,
      });
    }
  } catch (e) {
    console.error('[stk-callback]', e.message);
  }
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}


