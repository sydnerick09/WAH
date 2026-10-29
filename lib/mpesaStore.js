// lib/mpesaStore.js — SERVER-ONLY. Persists M-Pesa transactions (for tracking,
// verification and idempotency) and applies the paid effect exactly once.
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail } from './subscriptionEmail';
import { createWithdrawalFromFee, sendWithdrawalEmails } from './withdrawalAuto';

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
  const row = {
    checkout_request_id: checkoutRequestId,
    merchant_request_id: merchantRequestId || null,
    user_id: userId || null,
    purpose: purpose || 'payment',
    amount: Math.round(Number(amount) || 0),
    phone: phone || null,
    direction: 'stk',
    status: 'pending',
  };
  // Retry transient database errors once. If persistence still fails, the API
  // reports that the prompt may be pending so the client is not charged twice.
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await d.from('mpesa_transactions').insert(row);
    if (!error) return { ok: true };
    lastError = error;
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 250));
  }
  return { ok: false, error: lastError?.message || 'Could not save transaction.' };
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

  const { data: tx, error: lookupError } = await d.from('mpesa_transactions')
    .select('*').eq('checkout_request_id', checkoutRequestId).maybeSingle();
  if (lookupError) return { applied: false, error: lookupError.message };
  if (!tx) return { applied: false, error: 'Unknown transaction' };

  // Persist the official Safaricom receipt as soon as it arrives. A status query
  // can mark the payment successful before the callback; receipt storage must not
  // depend on whether account-side effects still need to run successfully.
  if (Number(resultCode) === 0 && receipt && String(receipt).trim()) {
    const officialReceipt = String(receipt).trim();
    if (officialReceipt !== String(tx.mpesa_receipt || '').trim()) {
      const { error: receiptSaveError } = await d.from('mpesa_transactions').update({
        mpesa_receipt: officialReceipt,
        result_code: '0',
        result_desc: resultDesc || tx.result_desc || 'The service request is processed successfully',
        updated_at: new Date().toISOString(),
      }).eq('checkout_request_id', checkoutRequestId);
      if (receiptSaveError) {
        console.error('[mpesaStore] could not save Safaricom receipt:', receiptSaveError.message);
        return { applied: false, pending: tx.status !== 'success', alreadyDone: tx.status === 'success', error: receiptSaveError.message };
      }
      tx.mpesa_receipt = officialReceipt;
      tx.result_code = '0';
      tx.result_desc = resultDesc || tx.result_desc || 'The service request is processed successfully';
    }
  }

  // A status poll can mark success before Safaricom's callback arrives. The
  // poll normally has no receipt, so persist the receipt from the later callback
  // even though the account/payment effect has already been applied.
  if (tx.status === 'success') {
    if (Number(resultCode) === 0 && receipt && receipt !== tx.mpesa_receipt) {
      const { error: receiptError } = await d.from('mpesa_transactions').update({
        mpesa_receipt: String(receipt), result_code: '0',
        result_desc: resultDesc || tx.result_desc || 'The service request is processed successfully',
        updated_at: new Date().toISOString(),
      }).eq('checkout_request_id', checkoutRequestId);
      if (receiptError) return { applied: false, alreadyDone: true, error: receiptError.message };
      return { applied: false, alreadyDone: true, receiptUpdated: true };
    }
    return { applied: false, alreadyDone: true };
  }

  // A Daraja status query can report a non-final result while the STK request
  // is still processing. Keep it pending so a later success callback can finish it.
  const description = String(resultDesc || '').trim();
  const pendingResult = /still under processing|being processed|processing|in progress|pending|request timed out|timeout|timed out/i.test(description);
  if (pendingResult) {
    const { error } = await d.from('mpesa_transactions').update({
      status: 'pending', result_code: String(resultCode ?? ''),
      result_desc: description || 'Safaricom is still processing this payment.',
      updated_at: new Date().toISOString(),
    }).eq('checkout_request_id', checkoutRequestId).neq('status', 'success');
    if (error) return { applied: false, error: error.message };
    return { applied: false, pending: true };
  }

  const success = Number(resultCode) === 0;
  if (!success) {
    const { error } = await d.from('mpesa_transactions').update({
      status: 'failed', result_code: String(resultCode ?? ''), result_desc: description || 'Safaricom reported that the payment failed.', updated_at: new Date().toISOString(),
    }).eq('checkout_request_id', checkoutRequestId).neq('status', 'success');
    if (error) return { applied: false, error: error.message };
    return { applied: false, failed: true };
  }

  // Do not mark a payment successful until its required account update succeeds.
  // This is important because the client polls this status to decide whether to
  // activate an account or continue to the next step.
  let subscriptionNotice = null;
  let withdrawalNotice = null;
  try {
    if (tx.user_id) {
      const purpose = String(tx.purpose || '');
      if (purpose === 'activation' || purpose === 'activation_topup' || purpose === 'premium' || purpose === 'premium_topup') {
        const { data: before, error: userLookupError } = await d.from('users')
          .select('email,full_name,premium,premium_paid_at,unsubscribed')
          .eq('id', tx.user_id).maybeSingle();
        if (userLookupError) throw userLookupError;
        if (!before) throw new Error('The account associated with this payment could not be found.');
        if (!before.unsubscribed) {
          subscriptionNotice = {
            email: before.email,
            name: before.full_name,
            type: purpose === 'premium' || purpose === 'premium_topup' ? 'premium' : 'activation',
            wasPremium: Boolean(before.premium_paid_at),
          };
        }
      }
      await applyEffect(d, tx);

      // A confirmed withdrawal fee automatically creates the withdrawal request
      // (no browser and no admin "Verify" click needed). If this cannot be done,
      // the payment is still successful and the client-side flow remains as backup.
      if (purpose === 'withdrawal_fee') {
        try {
          const auto = await createWithdrawalFromFee(d, tx);
          if (auto?.created) withdrawalNotice = auto.notice;
          else if (auto?.skipped && auto.skipped !== 'no-details') console.warn('[mpesaStore] auto-withdrawal skipped:', auto.skipped);
        } catch (autoError) {
          console.error('[mpesaStore] auto-withdrawal error:', autoError?.message || autoError);
        }
      }
    }
  } catch (error) {
    console.error('[mpesaStore] paid effect error:', error?.message || error);
    // Leave the transaction pending so a later status poll/callback can retry.
    // Crucially, do not tell the browser that a charged payment failed.
    await d.from('mpesa_transactions').update({
      result_code: '0', result_desc: `Payment verified; account update pending: ${String(error?.message || 'update error').slice(0, 300)}`,
      updated_at: new Date().toISOString(),
    }).eq('checkout_request_id', checkoutRequestId).neq('status', 'success');
    return { applied: false, pending: true, error: error?.message || 'Account update failed' };
  }

  // Do not include verify_status here: it is not present in the project's
  // existing mpesa_transactions schema and caused Supabase to reject this update.
  // IMPORTANT: only write the receipt when we actually have one. A status poll
  // (no receipt) running at the same moment as Safaricom's callback (with the
  // receipt) used to overwrite the freshly-saved receipt with null.
  const successUpdate = {
    status: 'success', result_code: '0', result_desc: resultDesc || 'Success', updated_at: new Date().toISOString(),
  };
  const finalReceipt = String(receipt || '').trim();
  if (finalReceipt) successUpdate.mpesa_receipt = finalReceipt;
  const { error: saveError } = await d.from('mpesa_transactions').update(successUpdate)
    .eq('checkout_request_id', checkoutRequestId);
  if (saveError) {
    console.error('[mpesaStore] could not save verified payment status:', saveError.message);
    return { applied: false, pending: true, error: saveError.message };
  }

  if (withdrawalNotice) {
    try {
      // Re-read so the email carries the M-Pesa receipt if the callback saved it meanwhile.
      const latest = await getTransaction(checkoutRequestId);
      if (latest?.mpesa_receipt) withdrawalNotice.receipt = latest.mpesa_receipt;
      await Promise.race([
        sendWithdrawalEmails(d, withdrawalNotice),
        new Promise(resolve => setTimeout(resolve, 15000)),
      ]);
    } catch (error) { console.error('[mpesaStore] withdrawal email error:', error?.message || error); }
  }

  if (subscriptionNotice) {
    try {
      const result = await sendSubscriptionEmail(subscriptionNotice);
      if (!result?.success) console.error('[mpesaStore] subscription email not sent:', result?.message || 'unknown email error');
    } catch (error) { console.error('[mpesaStore] subscription email error:', error?.message || error); }
  }
  return { applied: true };
}

async function applyEffect(d, tx) {
  const purpose = String(tx.purpose || '');
  const amount = Math.round(Number(tx.amount) || 0);
  const { data: u, error: userError } = await d.from('users').select('*').eq('id', tx.user_id).maybeSingle();
  if (userError) throw userError;
  if (!u) throw new Error('The account associated with this payment could not be found.');

  if (purpose === 'activation' || purpose === 'activation_topup') {
    const beforeBalance = Number(u.balance || 0);
    const activationFee = 50;
    const priorActAt = Number(u.task_submissions?._act || 0);
    const alreadyActive = Boolean(priorActAt && Date.now() <= priorActAt + ONE_MONTH_MS);

    if (!alreadyActive) {
      const subs = { ...(u.task_submissions || {}), _act: Date.now() };
      // The STK amount is the activation shortfall, so adding it and deducting
      // the fee leaves the intended balance (normally zero) without over-crediting.
      const { error: activationError } = await d.from('users').update({
        activated: true,
        task_submissions: subs,
        balance: Math.max(0, beforeBalance + amount - activationFee),
      }).eq('id', u.id);
      if (activationError) throw activationError;

      // Award the referral bonus only on the first successful activation.
      if (u.referred_by && u.referred_by !== u.id) {
        const { data: ref, error: refLookupError } = await d.from('users')
          .select('balance,referral_count').eq('id', u.referred_by).maybeSingle();
        if (refLookupError) throw refLookupError;
        if (ref) {
          const { error: refUpdateError } = await d.from('users').update({
            balance: Number(ref.balance || 0) + 132,
            referral_count: Number(ref.referral_count || 0) + 1,
          }).eq('id', u.referred_by);
          if (refUpdateError) throw refUpdateError;
        }
      }
    }
  } else if (purpose === 'premium' || purpose === 'premium_topup') {
    const { count: approvedWithdrawalCount, error: approvalError } = await d.from('withdrawal_requests')
      .select('id', { count: 'exact', head: true }).eq('user_id', u.id)
      .in('status', ['approved', 'paid', 'successful', 'success']);
    if (approvalError || Number(approvedWithdrawalCount || 0) < 1) {
      throw new Error(approvalError?.message || 'Premium activation requires an admin-approved withdrawal.');
    }
    const { error: premiumError } = await d.from('users').update({ premium: true, premium_paid_at: Date.now() }).eq('id', u.id);
    if (premiumError) throw premiumError;
  } else if (purpose === 'credit') {
    const { error: creditError } = await d.from('users').update({ balance: Number(u.balance || 0) + amount }).eq('id', u.id);
    if (creditError) throw creditError;
  }
  // Withdrawal-fee purposes are recorded as verified payments; they do not
  // directly change the user's balance.
}

export { ONE_MONTH_MS };
