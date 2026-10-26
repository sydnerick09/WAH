// lib/mpesaStore.js — SERVER-ONLY. Persists M-Pesa transactions (for tracking,
// verification and idempotency) and applies the paid effect exactly once.
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail } from './subscriptionEmail';
import { sendPaymentConfirmationEmail } from './paymentEmail';

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

  const { data: tx, error: txError } = await d.from('mpesa_transactions')
    .select('*').eq('checkout_request_id', checkoutRequestId).maybeSingle();
  if (txError) return { applied: false, error: txError.message };
  if (!tx) return { applied: false, error: 'Unknown transaction' };
  if (tx.status === 'success') return { applied: false, alreadyDone: true };

  const success = Number(resultCode) === 0;
  if (!success) {
    const { error } = await d.from('mpesa_transactions').update({
      status: 'failed', verify_status: 'unverified', result_code: String(resultCode ?? ''),
      result_desc: resultDesc || 'M-Pesa payment failed', updated_at: new Date().toISOString(),
    }).eq('checkout_request_id', checkoutRequestId);
    if (error) return { applied: false, error: error.message };
    return { applied: false, failed: true };
  }

  // A successful Safaricom result is not marked complete until its database
  // effect succeeds. If Supabase temporarily fails, leave it pending so the
  // status poll/admin retry can safely try the effect again.
  let client = null;
  let activationNotice = null;
  let paymentNotice = null;
  try {
    if (tx.user_id) {
      const { data: before, error: userError } = await d.from('users')
        .select('id,email,full_name,premium,premium_paid_at,unsubscribed,balance,activated,task_submissions')
        .eq('id', tx.user_id).maybeSingle();
      if (userError) throw userError;
      if (!before) throw new Error('The paying user account was not found.');
      client = before;
      const effect = await applyEffect(d, tx, before);
      if (!effect?.ok) throw new Error(effect?.error || 'The verified payment could not be applied to the account.');

      paymentNotice = {
        email: before.email, name: before.full_name, amount: tx.amount,
        purpose: tx.purpose, receipt, checkoutRequestId,
      };
      const purpose = String(tx.purpose || '');
      if (purpose === 'activation' || purpose === 'activation_topup' || purpose === 'premium' || purpose === 'premium_topup') {
        activationNotice = {
          email: before.email,
          name: before.full_name,
          type: purpose === 'premium' || purpose === 'premium_topup' ? 'premium' : 'activation',
          wasPremium: Boolean(before.premium_paid_at),
        };
      }
    } else {
      // Keep legacy transactions without a linked user from being credited to an
      // arbitrary account, but record the verified provider result.
      paymentNotice = null;
    }
  } catch (error) {
    console.error('[mpesaStore] verified payment effect pending:', error?.message || error);
    return { applied: false, error: error?.message || 'Payment effect failed; transaction remains pending for retry.' };
  }

  const { error: markError } = await d.from('mpesa_transactions').update({
    status: 'success', verify_status: 'verified', result_code: '0', result_desc: resultDesc || 'Success',
    mpesa_receipt: receipt || null, updated_at: new Date().toISOString(),
  }).eq('checkout_request_id', checkoutRequestId);
  if (markError) {
    console.error('[mpesaStore] payment effect applied but transaction status update failed:', markError.message);
    return { applied: false, error: 'Payment effect was applied, but the transaction status could not be saved. Please retry verification.' };
  }

  // Send a separate receipt and, when appropriate, a separate activation or
  // Premium confirmation. Email errors never reverse a verified payment.
  if (paymentNotice?.email) {
    const mail = await sendPaymentConfirmationEmail(paymentNotice);
    if (!mail.success) console.error('[mpesaStore] payment confirmation email failed:', mail.message || 'Unknown error');
  }
  if (activationNotice?.email) {
    try {
      const mail = await sendSubscriptionEmail(activationNotice);
      if (!mail.success) console.error('[mpesaStore] subscription email failed:', mail.message || 'Unknown error');
    } catch (error) { console.error('[mpesaStore] subscription email error:', error?.message || error); }
  }
  return { applied: true };
}

async function applyEffect(d, tx, existingUser = null) {
  const purpose = String(tx.purpose || '');
  const amount = Math.round(Number(tx.amount) || 0);
  const u = existingUser || (await d.from('users').select('*').eq('id', tx.user_id).maybeSingle()).data;
  if (!u) return { ok: false, error: 'The paying user account was not found.' };

  if (purpose === 'activation' || purpose === 'activation_topup') {
    const priorActAt = Number(u.task_submissions?._act || 0);
    const alreadyActive = priorActAt && Date.now() <= priorActAt + ONE_MONTH_MS;
    // If this is a retry after the activation update committed but the ledger
    // status write failed, treat the already-active state as an idempotent
    // success instead of charging/deducting the activation fee twice.
    if (alreadyActive) return { ok: true, alreadyApplied: true };
    const beforeBalance = Number(u.balance || 0);
    const activationFee = 50;
    // The STK amount is the exact shortfall, so this consumes the activation
    // fee and leaves no remainder from that top-up in the client balance.
    const totalAvailable = beforeBalance + amount;
    if (totalAvailable < activationFee) return { ok: false, error: 'The verified top-up does not cover the activation fee.' };
    const subs = { ...(u.task_submissions || {}), _act: Date.now() };
    const update = await d.from('users').update({
      activated: true, task_submissions: subs, balance: Math.max(0, totalAvailable - activationFee),
    }).eq('id', u.id);
    if (update.error) return { ok: false, error: update.error.message };

    // Referral activation bonus is applied only after successful account activation.
    if (u.referred_by && u.referred_by !== u.id) {
      const { data: ref, error: refError } = await d.from('users').select('balance,referral_count,task_submissions').eq('id', u.referred_by).maybeSingle();
      if (refError) console.error('[mpesaStore] referral lookup failed:', refError.message);
      else if (ref && ref.task_submissions?._agent?.status !== 'active') {
        const refUpdate = await d.from('users').update({
          balance: Number(ref.balance || 0) + 132, referral_count: Number(ref.referral_count || 0) + 1,
        }).eq('id', u.referred_by);
        if (refUpdate.error) console.error('[mpesaStore] referral bonus update failed:', refUpdate.error.message);
      }
    }
  } else if (purpose === 'premium' || purpose === 'premium_topup') {
    // Eligibility is checked before the STK prompt is sent. Once Safaricom
    // confirms the payment, do not block the paid subscription on a later
    // withdrawal-status change.
    const update = await d.from('users').update({ premium: true, premium_paid_at: Date.now() }).eq('id', u.id);
    if (update.error) return { ok: false, error: update.error.message };
  } else if (purpose === 'credit') {
    const update = await d.from('users').update({ balance: Number(u.balance || 0) + amount }).eq('id', u.id);
    if (update.error) return { ok: false, error: update.error.message };
  }
  // Fee purposes (profile change, withdrawal fee, etc.) consume the exact
  // requested payment and intentionally do not credit the client's balance.
  return { ok: true };
}

export { ONE_MONTH_MS };
