// Server-only transactional confirmation for a verified M-Pesa STK payment.
import { createEmailTransport } from './emailTransport';

const SITE_URL = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gweno.business').replace(/\/$/, '');

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function purposeLabel(purpose) {
  const labels = {
    activation: 'Account activation', activation_topup: 'Account activation',
    premium: 'Premium subscription', premium_topup: 'Premium subscription',
    profile_change: 'Profile change', training: 'Training payment',
    withdrawal_fee: 'Withdrawal fee', mpesa_withdrawal_fee: 'Withdrawal fee',
    airtel_withdrawal_fee: 'Withdrawal fee', credit: 'Account payment',
  };
  if (String(purpose || '').endsWith('_withdrawal_fee')) return 'Withdrawal fee';
  return labels[purpose] || 'GWENO Hub payment';
}

export async function sendPaymentConfirmationEmail({ email, name, amount, purpose, receipt, checkoutRequestId }) {
  const to = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { success: false, message: 'A valid recipient email is required.' };
  const clientName = String(name || 'Client').trim() || 'Client';
  const label = purposeLabel(purpose);
  const formattedAmount = `KES ${Math.max(0, Number(amount) || 0).toLocaleString('en-KE')}`;
  const reference = String(receipt || checkoutRequestId || 'Not provided');
  const subject = `Payment confirmed: ${label}`;
  const text = `Hello ${clientName},\n\nYour M-Pesa payment has been verified successfully.\n\nPayment type: ${label}\nAmount: ${formattedAmount}\nPayment status: Verified and successful\nReference: ${reference}\n\nThis payment has been processed for the requested GWENO Hub service. It is not added to your balance unless the platform specifically states that the payment is a balance credit.\n\nDashboard: ${SITE_URL}/dashboard\n\nGWENO Hub Team`;
  const html = `<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:600px"><p>Hello ${esc(clientName)},</p><h2>Payment confirmed</h2><p>Your M-Pesa payment has been verified successfully.</p><table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb"><tr><td><strong>Payment type</strong></td><td>${esc(label)}</td></tr><tr><td><strong>Amount</strong></td><td>${esc(formattedAmount)}</td></tr><tr><td><strong>Status</strong></td><td style="color:#166534;font-weight:bold">Verified and successful</td></tr><tr><td><strong>Reference</strong></td><td>${esc(reference)}</td></tr></table><p>This payment has been processed for the requested GWENO Hub service. It is not added to your balance unless the platform specifically states that the payment is a balance credit.</p><p><a href="${esc(`${SITE_URL}/dashboard`)}">Open your dashboard</a></p><p>GWENO Hub Team</p></div>`;
  let transport;
  try {
    transport = createEmailTransport('transactional');
    const result = await transport.sendMail({ to, subject, text, html });
    return { success: true, id: result?.id || result?.messageId || null };
  } catch (error) {
    console.error('[payment-confirmation-email]', error?.message || error);
    return { success: false, message: error?.message || 'Email delivery failed.' };
  } finally {
    try { transport?.close(); } catch (_) {}
  }
}
