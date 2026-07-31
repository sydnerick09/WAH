// pages/api/mpesa/b2c-timeout.js — Daraja posts here if a B2C request times out
// in its queue. We just record it and ACK 200 so it isn't retried forever.
import { createClient } from '@supabase/supabase-js';
import { verifyCallbackSecret } from '../../../lib/daraja';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ResultCode: 0, ResultDesc: 'Ignored' });
  if (!verifyCallbackSecret(req)) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Rejected' });
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const r = req.body?.Result;
    if (url && key && r) {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const origId = r.OriginatorConversationID || null;
      const convId = r.ConversationID || null;
      const { data: rows } = await db.from('mpesa_transactions').select('*').eq('direction', 'b2c').eq('status', 'pending');
      const tx = (rows || []).find(t => t.conversation_id === convId || t.originator_conversation_id === origId);
      if (tx) {
        await db.from('mpesa_transactions').update({ status: 'timeout', result_desc: 'Queue timeout', updated_at: new Date().toISOString() }).eq('id', tx.id);
      }
    }
  } catch (e) {
    console.error('[b2c-timeout]', e.message);
  }
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
