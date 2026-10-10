// lib/emailTransport.js — server-only Namecheap Private Email transport.
// SMTP authentication always uses the real mailbox (management@gweno.business).
// Category-specific aliases are only used as the visible From address.
import nodemailer from 'nodemailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENDER_ENV = {
  promotional: 'PROMOTIONAL_EMAIL',
  broadcast: 'PROMOTIONAL_EMAIL',
  subscription: 'SUBSCRIPTIONS_EMAIL',
  subscriptions: 'SUBSCRIPTIONS_EMAIL',
  reset: 'NOREPLY_EMAIL',
  noreply: 'NOREPLY_EMAIL',
  withdrawal: 'WITHDRAWALS_EMAIL',
  withdrawals: 'WITHDRAWALS_EMAIL',
  support: 'SUPPORT_EMAIL',
  help: 'HELP_EMAIL',
  admin: 'ADMIN_EMAIL',
  transactional: 'NOREPLY_EMAIL',
};

function smtpConfig() {
  const user = String(process.env.SMTP_USER || 'management@gweno.business').trim();
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('Namecheap SMTP is not configured. Set SMTP_USER to management@gweno.business and SMTP_PASS to that mailbox password in Vercel.');
  }
  const port = Number(process.env.SMTP_PORT || 465);
  if (![465, 587, 25, 2525].includes(port)) throw new Error('SMTP_PORT must be 465, 587, 25, or 2525.');
  return {
    host: process.env.SMTP_HOST || 'mail.privateemail.com',
    port,
    secure: process.env.SMTP_SECURE !== undefined
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };
}

function senderFor(category) {
  const key = String(category || 'transactional').toLowerCase();
  const envName = SENDER_ENV[key];
  const address = String((envName && process.env[envName]) || process.env.SMTP_USER || 'management@gweno.business').trim();
  if (!EMAIL_RE.test(address)) throw new Error(`Email sender is missing or invalid. Configure ${envName || 'SMTP_USER'} in Vercel.`);
  return { address, formatted: `\"Gweno Hub\" <${address}>` };
}

export function createEmailTransport(category = 'transactional') {
  const config = smtpConfig();
  const sender = senderFor(category);
  let closed = false;
  return {
    async sendMail(message) {
      if (closed) throw new Error('Email transport is closed.');
      const smtp = nodemailer.createTransport(config);
      try {
        const result = await smtp.sendMail({ ...message, from: sender.formatted });
        return { ...result, provider: 'smtp' };
      } finally {
        try { smtp.close(); } catch (_) {}
      }
    },
    close() { closed = true; },
  };
}

export function emailConfigured() {
  return Boolean(process.env.SMTP_PASS && (process.env.SMTP_USER || 'management@gweno.business'));
}
