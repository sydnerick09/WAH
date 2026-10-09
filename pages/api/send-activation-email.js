// pages/api/send-activation-email.js
// Sends an activation confirmation email to the client.

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const SITE_URL = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://onlinejob-pi.vercel.app').replace(/\/$/, '');
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port,
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === 'true'
        : port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { email, name, type = 'activation', wasPremium = false } = req.body || {};
  const subscriptionType = type === 'premium' ? 'premium' : 'activation';

  const clientEmail = String(email || '').trim().toLowerCase();
  const clientName = String(name || '').trim() || 'Client';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return res.status(400).json({
      success: false,
      message: 'A valid client email is required.',
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      success: false,
      message: 'Database is not configured.',
    });
  }

  const db = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // Confirm that this is a real activated client account.
  const { data: rows, error } = await db
    .from('users')
    .select('id, email, full_name, premium, premium_paid_at, activated, task_submissions, unsubscribed')
    .ilike('email', clientEmail)
    .limit(1);

  if (error) {
    console.error('[activation-email] Supabase error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  const client = rows?.[0];

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client account was not found.',
    });
  }

  const taskSubs = client.task_submissions || {};
  const activatedAt = Number(taskSubs._act || 0);
  const isActivated = !!activatedAt && Date.now() <= activatedAt + ONE_MONTH_MS;
  const premiumPaidAt = Number(client.premium_paid_at || 0);
  const isPremium = !!client.premium && !!premiumPaidAt && Date.now() <= premiumPaidAt + ONE_MONTH_MS;
  if (subscriptionType === 'activation' && !isActivated) {
    return res.status(403).json({ success: false, message: 'Account is not activated.' });
  }
  if (subscriptionType === 'premium' && !isPremium) {
    return res.status(403).json({ success: false, message: 'Premium is not active, so a successful subscription email cannot be sent.' });
  }
  if (client.unsubscribed) {
    return res.status(403).json({ success: false, message: 'This client has unsubscribed from email.' });
  }

  const transporter = getTransporter();

  if (!transporter) {
    return res.status(500).json({
      success: false,
      message: 'Email (SMTP) is not configured.',
    });
  }

  const actualName =
    String(client.full_name || clientName || 'Client').trim();

  const isRenewal = subscriptionType === 'premium' && Boolean(wasPremium);
  const title = subscriptionType === 'activation' ? 'Account Activation' : (isRenewal ? 'Renewed Premium' : 'Premium Subscription');
  const amount = subscriptionType === 'activation' ? 50 : 480;
  const subject = subscriptionType === 'activation' ? 'Your Gweno Hub Account Has Been Activated' : (isRenewal ? 'Your Gweno Hub Premium Has Been Renewed' : 'Your Gweno Hub Premium Is Active');
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const message = `Hi ${actualName},\n\nYour ${title.toLowerCase()} payment status is Successful.\nAmount: KES ${amount.toLocaleString('en-KE')}\nSubscription: ${title}\n\nYou can now continue using your GWENO Hub account from your dashboard: ${dashboardUrl}\n\n— The Gweno Hub Team`;

  try {
    await transporter.sendMail({
      from: `"Gweno Hub" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject,
      text: message,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
          <p>Hi ${esc(actualName)},</p>
          <h2 style="margin:12px 0;color:#111827;">${esc(title)} confirmed</h2>
          <table cellpadding="8" style="border-collapse:collapse;border:1px solid #e5e7eb;width:100%;">
            <tr><td><strong>Client name</strong></td><td>${esc(actualName)}</td></tr>
            <tr><td><strong>Amount</strong></td><td>KES ${amount.toLocaleString('en-KE')}</td></tr>
            <tr><td><strong>Subscription type</strong></td><td>${esc(title)}</td></tr>
            <tr><td><strong>Payment status</strong></td><td style="color:#166534;font-weight:700;">Successful</td></tr>
          </table>
          <p>Your account is ready. Click below to continue to your dashboard.</p>
          <p><a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-weight:700;padding:11px 16px;border-radius:7px;">Open Your Dashboard</a></p>
          <p style="margin-top:18px;color:#1f2937;font-weight:600;">— The Gweno Hub Team</p>
        </div>
      `,
    });

    try {
      transporter.close();
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Subscription confirmation email sent successfully.',
    });
  } catch (err) {
    try {
      transporter.close();
    } catch (_) {}

    console.error(
      '[subscription-email] Send error:',
      err
    );

    return res.status(500).json({
      success: false,
      message: 'The subscription is active, but the confirmation email could not be sent.',
    });
  }
}