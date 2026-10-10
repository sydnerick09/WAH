// Server-only subscription confirmation email sender through Gmail SMTP.
import { createEmailTransport, emailConfigured } from './emailTransport';

const SITE_URL = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://onlinejob-pi.vercel.app').replace(/\/$/, '');

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendSubscriptionEmail({ email, name, type = 'activation', wasPremium = false }) {
  if (!emailConfigured()) {
    return { success: false, configured: false, message: 'Configure SMTP_USER and SMTP_PASS in Vercel.' };
  }
  const clientEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return { success: false, message: 'A valid recipient email is required.' };
  }

  const isPremium = type === 'premium';
  const renewal = isPremium && Boolean(wasPremium);
  const title = isPremium ? (renewal ? 'Renewed Premium' : 'Premium Subscription') : 'Account Activation';
  const amount = isPremium ? 480 : 50;
  const subject = isPremium
    ? (renewal ? 'Your Gweno Hub Premium Has Been Renewed' : 'Your Gweno Hub Premium Is Active')
    : 'Your Gweno Hub Account Has Been Activated';
  const clientName = String(name || 'Client').trim() || 'Client';
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const text = `Hi ${clientName},\n\nYour ${title.toLowerCase()} payment status is Successful.\nAmount: KES ${amount.toLocaleString('en-KE')}\nSubscription type: ${title}\nPayment status: Successful\n\nOpen your dashboard: ${dashboardUrl}\n\n— The Gweno Hub Team`;
  const transporter = createEmailTransport('subscription');

  try {
    await transporter.sendMail({
      to: clientEmail,
      subject,
      text,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;"><p>Hi ${esc(clientName)},</p><h2 style="margin:12px 0;color:#111827;">${esc(title)} confirmed</h2><table cellpadding="8" style="border-collapse:collapse;border:1px solid #e5e7eb;width:100%;"><tr><td><strong>Client name</strong></td><td>${esc(clientName)}</td></tr><tr><td><strong>Amount</strong></td><td>KES ${amount.toLocaleString('en-KE')}</td></tr><tr><td><strong>Subscription type</strong></td><td>${esc(title)}</td></tr><tr><td><strong>Payment status</strong></td><td style="color:#166534;font-weight:700;">Successful</td></tr></table><p>Your account is ready. You can now open your dashboard, select available tasks, and start working on them.</p><p><a href="${esc(dashboardUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-weight:700;padding:11px 16px;border-radius:7px;">Open Your Dashboard</a></p><p style="margin-top:18px;color:#1f2937;font-weight:600;">— The Gweno Hub Team</p></div>`,
    });
    return { success: true };
  } catch (error) {
    console.error('[subscription-email] send error:', error?.message || error);
    return { success: false, message: error?.message || 'Email delivery failed.' };
  } finally {
    try { transporter.close(); } catch (_) {}
  }
}
