// pages/api/mpesa/b2c-result.js — Daraja posts the final B2C payout result here.
// Marks the payout transaction and the linked withdrawal as paid/failed. Always
// ACK 200 so Safaricom doesn't retry.
import { createClient } from '@supabase/supabase-js';
import { verifyCallbackSecret } from '../../../lib/daraja';

export const config = { api: { bodyParser: true } };

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ResultCode: 0, ResultDesc: 'Ignored' });
  if (!verifyCallbackSecret(req)) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Rejected' });

  try {
    const r = req.body?.Result;
    const db = adminDb();
    if (r && db) {
      const success = Number(r.ResultCode) === 0;
      const convId  = r.ConversationID || null;
      const origId  = r.OriginatorConversationID || null;

      // Pull the M-Pesa receipt from the result parameters, if present.
      let receipt = null;
      const resultParameters = r.ResultParameters?.ResultParameter;
      const params = Array.isArray(resultParameters) ? resultParameters : (resultParameters ? [resultParameters] : []);
      for (const it of params) {
        if (it?.Key === 'TransactionReceipt') receipt = it.Value || null;
      }

      // Match only identifiers actually supplied by Daraja. Comparing null === null
      // can accidentally attach a callback to an unrelated payout whose IDs are null.
      let tx = null;
      if (convId || origId) {
        const { data: rows, error: lookupError } = await db.from('mpesa_transactions')
          .select('*').eq('direction', 'b2c').limit(500);
        if (lookupError) throw lookupError;
        tx = (rows || []).find(t =>
          (convId && t.conversation_id && String(t.conversation_id) === String(convId)) ||
          (origId && t.originator_conversation_id && String(t.originator_conversation_id) === String(origId))
        ) || null;
      }
      if (!tx) {
        console.error('[b2c-result] No matching payout transaction for callback', { convId, origId, resultCode: r.ResultCode });
      }

      if (tx && tx.status !== 'success') {
        await db.from('mpesa_transactions').update({
          status: success ? 'success' : 'failed',
          result_code: String(r.ResultCode ?? ''), result_desc: r.ResultDesc || '',
          mpesa_receipt: receipt, updated_at: new Date().toISOString(),
        }).eq('id', tx.id);

        if (tx.withdrawal_id) {
          await db.from('withdrawal_requests').update({
            status: success ? 'paid' : 'failed',
            updated_at: new Date().toISOString(),
          }).eq('id', tx.withdrawal_id);
        }
      }
    }
  } catch (e) {
    console.error('[b2c-result]', e.message);
  }
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
