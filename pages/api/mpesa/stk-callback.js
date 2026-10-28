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
      const items = cb.CallbackMetadata?.Item || [];
      for (const it of items) {
        if (String(it?.Name || '').trim().toLowerCase() === 'mpesareceiptnumber' && it.Value != null) {
          receipt = String(it.Value).trim();
          break;
        }
      }
      if (Number(cb.ResultCode) === 0 && !receipt) {
        console.error('[stk-callback] Safaricom reported success but no MpesaReceiptNumber was present in CallbackMetadata.', {
          checkoutRequestId: cb.CheckoutRequestID,
          metadataNames: items.map(it => it?.Name).filter(Boolean),
        });
      }
      const result = await completeStk({
        checkoutRequestId: cb.CheckoutRequestID,
        resultCode: cb.ResultCode,
        resultDesc: cb.ResultDesc,
        receipt,
      });
      if (result?.error || result?.pending) {
        console.error('[stk-callback] payment confirmation still needs processing:', result.error || 'account update pending');
      }
      if (receipt && result?.receiptUpdated) {
        console.info('[stk-callback] saved Safaricom receipt for checkout request:', cb.CheckoutRequestID);
      }
    }
  } catch (e) {
    console.error('[stk-callback]', e.message);
  }
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
