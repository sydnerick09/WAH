

// pages/api/mpesa/stk-push.js — initiate a Lipa na M-PESA (STK) payment.
// The amount is decided SERVER-SIDE for fixed prices (activation/premium); the
// client can never set its own price. Requires a valid session token.
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../lib/token';
import { isConfigured, stkPush, isValidMsisdn, normalizePhone } from '../../../lib/daraja';
import { createTransaction } from '../../../lib/mpesaStore';
import { getWithdrawalFee, isSupportedWithdrawalMethod } from '../../../lib/withdrawalFees';

const ACTIVATION_FEE = 50;
const PREMIUM_FEE    = 599;
const TRAINING_FEE   = 132;
const PROFILE_FEE    = 480;   // kes 480 fee to change personal name / email / phone

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  if (!isConfigured()) return res.status(503).json({ success: false, configured: false, message: 'M-Pesa is not configured yet.' });

  const uid = verifyToken(req.body?.authToken);
  if (!uid) return res.status(401).json({ success: false, message: 'Please log in again.' });

  const purpose = String(req.body?.purpose || '').trim();
  const phone   = String(req.body?.phone || '');
  if (!isValidMsisdn(phone)) return res.json({ success: false, message: 'Enter a valid Safaricom number (07XX… or 2547XX…).' });

  const db = adminDb();
  if (!db) return res.status(503).json({ success: false, message: 'Service unavailable.' });
  const { data: u } = await db.from('users').select('balance').eq('id', uid).maybeSingle();
  if (!u) return res.status(401).json({ success: false, message: 'Please log in again.' });

  // Canonical, server-side amount per purpose.
  let amount = 0;
  if (purpose === 'activation' || purpose === 'activation_topup') {
    amount = Math.max(0, ACTIVATION_FEE - Number(u.balance || 0));
    if (amount <= 0) return res.json({ success: false, message: 'Your balance already covers activation.' });
  } else if (purpose === 'premium' || purpose === 'premium_topup') {
    const { count: approvedWithdrawalCount, error: withdrawalCheckError } = await db.from('withdrawal_requests')
      .select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'approved');
    if (withdrawalCheckError || Number(approvedWithdrawalCount || 0) < 1) {
      return res.status(403).json({ success: false, message: 'You can subscribe to Premium only after the admin approves your withdrawal.' });
    }
    amount = PREMIUM_FEE;
  } else if (purpose === 'training') {
    amount = TRAINING_FEE;
  } else if (purpose === 'profile_change') {
    amount = PROFILE_FEE;
  } else if (purpose === 'withdrawal_fee' || purpose.endsWith('_withdrawal_fee')) {
    const withdrawalMethod = String(req.body?.withdrawalMethod || '').toLowerCase();
    const requestedFee = Math.round(Number(req.body?.amount) || 0);

    // Mobile withdrawal fees are calculated server-side from the selected
    // withdrawal amount, never from a fee amount supplied by the browser.
    if (isSupportedWithdrawalMethod(withdrawalMethod)) {
      const requestedWithdrawalAmount = Number(req.body?.withdrawalAmount);
      const availableBalance = Number(u.balance || 0);
      if (!Number.isInteger(requestedWithdrawalAmount) || requestedWithdrawalAmount < 100 || requestedWithdrawalAmount > availableBalance || requestedWithdrawalAmount > 40000) {
        return res.json({ success: false, message: 'Choose a withdrawal amount from KES 100 up to your available balance (maximum KES 40,000 for mobile withdrawals).' });
      }
      const expectedFee = getWithdrawalFee(requestedWithdrawalAmount, withdrawalMethod);
      if (expectedFee === null) {
        return res.json({ success: false, message: 'This withdrawal method is unavailable for the selected amount.' });
      }
      if (requestedFee !== expectedFee) {
        return res.json({ success: false, message: `Invalid fee amount. The required ${withdrawalMethod === 'airtel' ? 'Airtel' : 'M-Pesa'} withdrawal fee for this amount is KES ${expectedFee.toLocaleString()}.` });
      }
      amount = expectedFee;
    } else {
      // Existing bank/international flows may use a bank-specific fee. Keep
      // their existing validation unchanged.
      if (!(requestedFee >= 500 && requestedFee <= 100000)) return res.json({ success: false, message: 'Invalid fee amount.' });
      amount = requestedFee;
    }
  } else {
    return res.json({ success: false, message: 'Unknown payment purpose.' });
  }

  try {
    const { ok, data } = await stkPush({ phone, amount, accountRef: 'GwenoHub', description: purpose.slice(0, 18) });
    if (!ok) {
      return res.json({ success: false, message: data?.errorMessage || data?.ResponseDescription || 'Could not start the M-Pesa prompt. Please try again.' });
    }
    await createTransaction({
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      userId: uid, purpose, amount, phone: normalizePhone(phone),
    });
    return res.json({ success: true, checkoutRequestId: data.CheckoutRequestID, amount, customerMessage: data.CustomerMessage });
  } catch (e) {
    console.error('[stk-push]', e.message);
    return res.status(500).json({ success: false, message: 'M-Pesa error. Please try again.' });
  }
}
