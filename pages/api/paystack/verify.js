// pages/api/paystack/verify.js
// Server-side Paystack verification. NEVER trust the client's success callback —
// this calls Paystack's verify endpoint with the secret key, checks the status,
// and records the result in the payment ledger (idempotent by provider+reference).
// The withdrawal itself is additionally gated in createWithdrawal against this
// verified, single-use ledger row.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).json({ status: false, message: 'Paystack is not configured.' });

  const reference = req.query.reference || req.body?.reference;
  if (!reference) return res.status(400).json({ status: false, message: 'Missing transaction reference.' });

  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await r.json();
    const tx   = data?.data;
    const ok   = !!(data.status && tx && tx.status === 'success');

    // Persist to the unified ledger (best-effort; idempotent by provider+reference).
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const db   = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
        const meta = tx?.metadata || {};
        const purpose = String(meta.plan || meta.purpose || '');
        const type = /premium/i.test(purpose) ? 'premium'
          : /activation|registration|topup/i.test(purpose) ? 'registration'
          : /withdraw/i.test(purpose) ? 'withdrawal_fee' : 'other';
        const row = {
          user_id:  meta.userId || null,
          type,
          amount:   Number(tx?.amount || 0) / 100,
          currency: tx?.currency || 'KES',
          provider: 'paystack',
          reference: String(reference),
          phone:    meta.phone || '',
          email:    tx?.customer?.email || '',
          status:   ok ? 'successful' : (tx?.status === 'failed' ? 'failed' : 'pending'),
          verify_status: ok ? 'verified' : 'unverified',
        };
        const { data: ex } = await db.from('payment_events')
          .select('id, withdrawal_id').eq('provider', 'paystack').eq('reference', String(reference)).maybeSingle();
        if (ex) {
          // Don't overwrite an already-consumed fee's linkage; just refresh status.
          await db.from('payment_events').update({ ...row, updated_at: new Date().toISOString() }).eq('id', ex.id);
        } else {
          await db.from('payment_events').insert(row);
        }
        // Log a failed/suspicious attempt for admin review.
        if (!ok) {
          await db.from('admin_actions').insert({
            action: 'paystack_verify_failed', entity: 'payment', entity_id: String(reference),
            detail: `status:${tx?.status || 'unknown'} amount:${row.amount} user:${row.user_id || '—'}`,
          }).then(() => {}, () => {});
        }
      } catch (_) { /* ledger is best-effort */ }
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ status: false, message: 'Could not reach Paystack. Please try again.' });
  }
}
