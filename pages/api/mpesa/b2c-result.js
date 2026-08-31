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
      for (const it of (r.ResultParameters?.ResultParameter || [])) {
        if (it.Key === 'TransactionReceipt') receipt = it.Value;
      }

      // Locate the payout transaction by either conversation id.
      let q = db.from('mpesa_transactions').select('*').eq('direction', 'b2c');
      const { data: rows } = await q;
      const tx = (rows || []).find(t => t.conversation_id === convId || t.originator_conversation_id === origId);

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


