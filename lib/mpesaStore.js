// lib/mpesaStore.js — SERVER-ONLY. Persists M-Pesa transactions (for tracking,
// verification and idempotency) and applies the paid effect exactly once.
import { createClient } from '@supabase/supabase-js';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Record a freshly-initiated STK push (status = pending).
export async function createTransaction({ checkoutRequestId, merchantRequestId, userId, purpose, amount, phone }) {
  const d = db();
  if (!d) return { ok: false, error: 'DB not configured' };
  const { error } = await d.from('mpesa_transactions').insert({
    checkout_request_id: checkoutRequestId,
    merchant_request_id: merchantRequestId || null,
    user_id: userId || null,
    purpose: purpose || 'payment',
    amount: Math.round(Number(amount) || 0),
    phone: phone || null,
    direction: 'stk',
    status: 'pending',
  });
  return { ok: !error, error: error?.message };
}

export async function getTransaction(checkoutRequestId) {
  const d = db();
  if (!d) return null;
  const { data } = await d.from('mpesa_transactions')
    .select('*').eq('checkout_request_id', checkoutRequestId).maybeSingle();
  return data || null;
}

// Idempotent: applies the effect and marks success only on the first success
// callback for a given transaction. Returns { applied, alreadyDone }.
export async function completeStk({ checkoutRequestId, resultCode, resultDesc, receipt }) {
  const d = db();
  if (!d) return { applied: false, error: 'DB not configured' };

  const { data: tx } = await d.from('mpesa_transactions')
    .select('*').eq('checkout_request_id', checkoutRequestId).maybeSingle();
  if (!tx) return { applied: false, error: 'Unknown transaction' };
  if (tx.status === 'success') return { applied: false, alreadyDone: true };

  const success = Number(resultCode) === 0;
  if (!success) {
    await d.from('mpesa_transactions').update({
      status: 'failed', result_code: String(resultCode ?? ''), result_desc: resultDesc || '', updated_at: new Date().toISOString(),
    }).eq('checkout_request_id', checkoutRequestId);
    return { applied: false, failed: true };
  }

  // Apply the paid effect to the user (mirrors the existing activation/premium
  // semantics), only for the recognised purposes. Fees simply unlock a form.
  try {
    if (tx.user_id) await applyEffect(d, tx);
  } catch (_) { /* effect errors must not lose the payment record */ }

  await d.from('mpesa_transactions').update({
    status: 'success', result_code: '0', result_desc: resultDesc || 'Success',
    mpesa_receipt: receipt || null, updated_at: new Date().toISOString(),
  }).eq('checkout_request_id', checkoutRequestId);
  return { applied: true };
}

async function applyEffect(d, tx) {
  const purpose = String(tx.purpose || '');
  const amount = Math.round(Number(tx.amount) || 0);
  const { data: u } = await d.from('users').select('*').eq('id', tx.user_id).maybeSingle();
  if (!u) return;

  if (purpose === 'activation' || purpose === 'activation_topup') {
    const subs = { ...(u.task_submissions || {}), _act: Date.now() };
    await d.from('users').update({
      activated: true, task_submissions: subs, balance: Number(u.balance || 0) + amount,
    }).eq('id', u.id);
    // Referral bonus on first activation (mirrors activateUser).
    if (u.referred_by && u.referred_by !== u.id) {
      const { data: ref } = await d.from('users').select('balance,referral_count').eq('id', u.referred_by).maybeSingle();
      if (ref) {
        await d.from('users').update({
          balance: Number(ref.balance || 0) + 132, referral_count: Number(ref.referral_count || 0) + 1,
        }).eq('id', u.referred_by);
      }
    }
  } else if (purpose === 'premium' || purpose === 'premium_topup') {
    await d.from('users').update({ premium: true, premium_paid_at: Date.now() }).eq('id', u.id);
  } else if (purpose === 'credit') {
    await d.from('users').update({ balance: Number(u.balance || 0) + amount }).eq('id', u.id);
  }
  // fee_* purposes: no user mutation — the successful transaction record is the
  // proof the fee was paid; the client proceeds to the withdrawal form.
}

export { ONE_MONTH_MS };
