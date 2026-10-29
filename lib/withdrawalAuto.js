// lib/withdrawalAuto.js — SERVER-ONLY.
//
// 1. Auto-creates the withdrawal request the moment a withdrawal-fee payment is
//    confirmed by Safaricom (no browser, no admin "Verify" click needed). The
//    admin only has to approve it under Withdrawals.
// 2. Enforces "one active withdrawal at a time": a client cannot start another
//    withdrawal until the admin has approved the current one.
// 3. Sends the admin + client emails for every new withdrawal request.
import { getWithdrawalFee, isSupportedWithdrawalMethod } from './withdrawalFees';
import { createEmailTransport } from './emailTransport';

export const ACTIVE_WITHDRAWAL_MESSAGE =
  'You already have a withdrawal request awaiting approval. You cannot start another withdrawal until the admin approves your current request.';

const CLAIM = 'creating';           // temporary marker that stops duplicate creation
const AGENT_MARKER = '__AGENT_COMMISSION__';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Returns the client's withdrawal that is still waiting for admin approval, or null.
// Agent-commission payouts are a separate process and are ignored here.
export async function findActiveWithdrawal(d, userId) {
  if (!d || !userId) return null;
  const { data, error } = await d.from('withdrawal_requests')
    .select('id,status,id_number')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing']);
  if (error) return null;
  return (data || []).find(r => !String(r.id_number || '').startsWith(AGENT_MARKER)) || null;
}

async function logAudit(d, action, entityId, detail) {
  try {
    await d.from('admin_actions').insert({ action, entity: 'withdrawal', entity_id: String(entityId || ''), detail: String(detail || '').slice(0, 500) });
  } catch (_) { /* audit log is best-effort */ }
}

// ── Emails ───────────────────────────────────────────────────────────────────
function adminRecipients() {
  const list = [process.env.NOTIFY_EMAIL, process.env.ADMIN_EMAIL, process.env.SMTP_REPLY_TO_EMAIL, 'businesshub.comke@gmail.com']
    .map(v => String(v || '').trim()).filter(Boolean);
  return [...new Set(list.map(v => v.toLowerCase()))];
}

// Sends the admin notification and the client confirmation. Never throws; every
// failure is written to the admin Audit log so a missing email can be traced.
export async function sendWithdrawalEmails(d, n) {
  const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://gweno.business').replace(/\/$/, '');
  let transporter;
  try { transporter = createEmailTransport('withdrawal'); }
  catch (e) {
    console.error('[withdrawal-email] transport error:', e?.message || e);
    await logAudit(d, 'withdrawal_email_failed', n.withdrawalId, `transport: ${e?.message || e}`);
    return { admin: false, client: false };
  }
  const amountText = Number(n.amount || 0).toLocaleString('en-KE');
  const details =
    `Withdrawal ID: ${n.withdrawalId}\nName: ${n.fullName}\nAccount email: ${n.email || 'Not available'}\n` +
    `Amount: KES ${amountText}\nMethod: ${n.method}\nPhone: ${n.phone || 'Not provided'}\n` +
    `Fee paid: KES ${Number(n.feeAmount || 0).toLocaleString('en-KE')}\n` +
    `M-Pesa receipt: ${n.receipt || 'Not yet received (check the Transactions tab)'}\n` +
    `Fee reference: ${n.checkoutRequestId || '—'}\nStatus: Pending — awaiting your approval in the admin panel`;

  const result = { admin: false, client: false };
  for (const to of adminRecipients()) {
    try {
      await transporter.sendMail({
        to,
        subject: `[Gweno Hub] New withdrawal request — ${n.fullName} — KES ${amountText}`,
        text: details,
        html: `<h2>New withdrawal request</h2><pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${esc(details)}</pre><p>Open the admin panel → Withdrawals to approve it.</p>`,
      });
      result.admin = true;
    } catch (e) {
      console.error('[withdrawal-email] admin notice failed:', to, e?.message || e);
      await logAudit(d, 'withdrawal_email_failed', n.withdrawalId, `admin ${to}: ${e?.message || e}`);
    }
  }
  if (n.email) {
    try {
      await transporter.sendMail({
        to: n.email,
        subject: 'We received your withdrawal request',
        text: `Hello ${n.accountName || n.fullName},\n\nWe received your withdrawal request for KES ${amountText}. Its current status is pending admin approval.\nWithdrawal reference: ${n.withdrawalId}\n\nPlease note: you cannot start another withdrawal until this request has been approved by our admin team.\n\nPlease ensure the account holder name and payment details match the details on your GWENO Hub account. Read the withdrawal Terms & Conditions: ${baseUrl}/terms\n\nGweno Hub Team`,
        html: `<p>Hello ${esc(n.accountName || n.fullName)},</p><p>We received your withdrawal request for <strong>KES ${amountText}</strong>. Its current status is <strong>pending admin approval</strong>.</p><p>Reference: ${esc(n.withdrawalId)}</p><p><strong>Please note:</strong> you cannot start another withdrawal until this request has been approved by our admin team.</p><p>Please ensure your account holder name and payment details match the details on your GWENO Hub account. Read the <a href="${baseUrl}/terms">Withdrawal Terms &amp; Conditions</a>.</p><p>Gweno Hub Team</p>`,
      });
      result.client = true;
    } catch (e) {
      console.error('[withdrawal-email] client confirmation failed:', e?.message || e);
      await logAudit(d, 'withdrawal_email_failed', n.withdrawalId, `client ${n.email}: ${e?.message || e}`);
    }
  }
  return result;
}

// ── Auto-create the withdrawal once the fee is confirmed ─────────────────────
// `tx` is the mpesa_transactions row of the paid withdrawal fee. The client's
// withdrawal details were stored server-side when the STK prompt was started
// (users.task_submissions._pendingWd[checkoutRequestId]).
// Returns { created, withdrawal, notice } or { skipped: reason }. Never marks
// the payment as failed: if anything is off, the client-side flow still works.
export async function createWithdrawalFromFee(d, tx) {
  if (!d || !tx?.id || !tx.user_id) return { skipped: 'missing-data' };
  if (tx.withdrawal_id) return { skipped: 'already-linked' };

  const { data: u, error: userError } = await d.from('users')
    .select('id,email,full_name,balance,completed_tasks,task_submissions').eq('id', tx.user_id).maybeSingle();
  if (userError || !u) return { skipped: 'user-not-found' };
  const pending = (u.task_submissions || {})._pendingWd?.[tx.checkout_request_id];
  if (!pending) return { skipped: 'no-details' };

  // Atomic claim: if the callback and the status poll run together, only one wins.
  const { data: claimed, error: claimError } = await d.from('mpesa_transactions')
    .update({ withdrawal_id: CLAIM }).eq('id', tx.id).is('withdrawal_id', null).select('id');
  if (claimError || !claimed?.length) return { skipped: 'claimed-elsewhere' };
  const release = () => d.from('mpesa_transactions').update({ withdrawal_id: null }).eq('id', tx.id).eq('withdrawal_id', CLAIM);

  let withdrawal = null;
  try {
    const method = String(pending.method || '').toLowerCase();
    const amount = Number(pending.amount);
    let reason = '';
    if (Number(u.completed_tasks || 0) < 1) reason = 'no-approved-task';
    else if (!isSupportedWithdrawalMethod(method)) reason = 'unsupported-method';
    else if (!Number.isInteger(amount) || amount < 100 || amount > 40000 || amount > Number(u.balance || 0)) reason = 'invalid-amount';
    else if (getWithdrawalFee(amount, method) !== Math.round(Number(tx.amount))) reason = 'fee-mismatch';
    else if (await findActiveWithdrawal(d, u.id)) reason = 'active-withdrawal-exists';
    if (reason) {
      await release();
      await logAudit(d, 'auto_withdrawal_skipped', u.id, `fee_tx:${tx.checkout_request_id} reason:${reason}`);
      return { skipped: reason };
    }

    const { data, error } = await d.from('withdrawal_requests').insert({
      user_id: u.id,
      full_name: pending.fullName,
      phone: pending.phone,
      id_number: pending.idNumber,
      amount,
      status: 'pending',
      withdrawal_method: method,
      deadline: Date.now() + 2 * 60 * 60 * 1000,
      requested_at: new Date().toISOString(),
    }).select().single();
    if (error || !data) {
      await release();
      await logAudit(d, 'auto_withdrawal_failed', u.id, `fee_tx:${tx.checkout_request_id} ${error?.message || 'insert failed'}`);
      return { skipped: 'insert-failed' };
    }
    withdrawal = data;
  } catch (e) {
    await release();
    await logAudit(d, 'auto_withdrawal_failed', u.id, `fee_tx:${tx.checkout_request_id} ${e?.message || e}`);
    return { skipped: 'error' };
  }

  // The withdrawal now exists — from here on nothing may undo the link.
  try { await d.from('mpesa_transactions').update({ withdrawal_id: String(withdrawal.id) }).eq('id', tx.id); } catch (_) {}
  try {
    const { data: fresh } = await d.from('users').select('task_submissions').eq('id', u.id).maybeSingle();
    const subs = { ...(fresh?.task_submissions || {}) };
    const map = { ...(subs._pendingWd || {}) };
    delete map[tx.checkout_request_id];
    if (Object.keys(map).length) subs._pendingWd = map; else delete subs._pendingWd;
    await d.from('users').update({ task_submissions: subs }).eq('id', u.id);
  } catch (_) {}
  await logAudit(d, 'withdrawal_auto_created', withdrawal.id,
    `user:${u.id} fee_tx:${tx.checkout_request_id} receipt:${tx.mpesa_receipt || '—'} amount:KES ${withdrawal.amount}`);

  return {
    created: true,
    withdrawal,
    notice: {
      withdrawalId: withdrawal.id, fullName: pending.fullName, accountName: u.full_name, email: u.email,
      amount: withdrawal.amount, method: withdrawal.withdrawal_method, phone: pending.phone,
      feeAmount: tx.amount, receipt: tx.mpesa_receipt || '', checkoutRequestId: tx.checkout_request_id,
    },
  };
}
