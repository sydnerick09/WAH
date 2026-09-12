// pages/api/send-activation-email.js
// Sends an activation confirmation email to the client.

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const ACTIVATION_MESSAGE = (name) =>
  `Thank you ${name} for activating your account with Gweno Hub. We appreciate you joining our team and look forward to having you on board.You can now apply for tasks, wait for approval, complete and submit the approved tasks, and receive your payment once the submission is approved. Once the funds are credited to your account, you can withdraw them instantly.`;

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
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
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

  const { email, name } = req.body || {};

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
    .select('email, full_name, activated')
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

  if (!client.activated) {
    return res.status(403).json({
      success: false,
      message: 'Account is not activated.',
    });
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

  const message = ACTIVATION_MESSAGE(actualName);

  try {
    await transporter.sendMail({
      from: `"Gweno Hub" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: 'Your Gweno Hub Account Has Been Activated',
      text: message,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
          <p style="margin:0 0 14px;">
            Thank you ${esc(actualName)} for activating your account with Gweno Hub. We appreciate you joining our team and look forward to having you on board.You can now apply for tasks, wait for approval, complete and submit the approved tasks, and receive your payment once the submission is approved. Once the funds are credited to your account, you can withdraw them instantly.
          </p>

          <p style="margin-top:18px;color:#1f2937;font-weight:600;">
            — The Gweno Hub Team
          </p>
        </div>
      `,
    });

    try {
      transporter.close();
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Activation email sent successfully.',
    });
  } catch (err) {
    try {
      transporter.close();
    } catch (_) {}

    console.error(
      '[activation-email] Send error:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        'The account was activated, but the confirmation email could not be sent.',
    });
  }
}