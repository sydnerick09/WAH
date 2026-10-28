// Dedicated Premium M-Pesa endpoint. Premium is available only after at least
// one withdrawal request has been approved by an administrator.
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../lib/token';
import { isConfigured, stkPush, isValidMsisdn, normalizePhone } from '../../../lib/daraja';
import { createTransaction } from '../../../lib/mpesaStore';

const PREMIUM_FEE = 599;

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  if (!isConfigured()) {
    return res.status(503).json({ success: false, configured: false, message: 'M-Pesa is not configured yet.' });
  }

  const uid = verifyToken(req.body?.authToken);
  if (!uid) {
    return res.status(401).json({ success: false, message: 'Please log in again.' });
  }

  const phone = String(req.body?.phone || '');
  if (!isValidMsisdn(phone)) {
    return res.status(400).json({ success: false, message: 'Enter a valid Safaricom number (07XX… or 2547XX…).' });
  }

  const db = adminDb();
  if (!db) {
    return res.status(503).json({ success: false, message: 'Service unavailable.' });
  }

  try {
    const { data: user, error: userError } = await db
      .from('users')
      .select('id')
      .eq('id', uid)
      .maybeSingle();
    if (userError || !user) {
      return res.status(401).json({ success: false, message: 'Please log in again.' });
    }

    const { count, error: withdrawalError } = await db
      .from('withdrawal_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .in('status', ['approved', 'paid', 'successful', 'success']);

    if (withdrawalError || Number(count || 0) < 1) {
      return res.status(403).json({
        success: false,
        message: 'You can subscribe to Premium only after the admin approves your withdrawal.',
      });
    }

    const { ok, data } = await stkPush({
      phone,
      amount: PREMIUM_FEE,
      accountRef: 'GwenoHub',
      description: 'Premium Membership',
    });

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: data?.errorMessage || data?.ResponseDescription || 'Could not start the M-Pesa prompt. Please try again.',
      });
    }

    const stored = await createTransaction({
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      userId: uid,
      purpose: 'premium',
      amount: PREMIUM_FEE,
      phone: normalizePhone(phone),
    });
    if (!stored?.ok) {
      console.error('[premium-mpesa] prompt started but transaction tracking failed:', stored?.error || 'unknown database error');
      return res.status(503).json({
        success: false,
        paymentMayBePending: true,
        checkoutRequestId: data.CheckoutRequestID,
        message: 'The M-Pesa prompt was sent, but payment tracking is delayed. Do not pay again; wait for confirmation or contact support.',
      });
    }

    return res.status(200).json({
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      amount: PREMIUM_FEE,
      customerMessage: data.CustomerMessage,
    });
  } catch (error) {
    console.error('[premium-mpesa]', error?.message || error);
    return res.status(500).json({ success: false, message: 'M-Pesa error. Please try again.' });
  }
}
