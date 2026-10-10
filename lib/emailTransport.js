// lib/emailTransport.js — server-only shared email transport.
// Uses Resend when configured, then falls back to Namecheap Private Email SMTP.
// Never expose SMTP_PASS or RESEND_API_KEY to client-side code.
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
  support: 'SUPPORT_EMAIL',
  help: 'HELP_EMAIL',
  admin: 'ADMIN_EMAIL',
  transactional: 'NOREPLY_EMAIL',
};

function smtpConfig(category = 'transactional') {
  const key = String(category || 'transactional').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const user = String(process.env[`SMTP_USER_${key}`] || process.env.SMTP_USER || '').trim();
  const pass = process.env[`SMTP_PASS_${key}`] || process.env.SMTP_PASS;
  if (!user || !pass) return null;
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

function senderFor(category, requestedFrom) {
  const envName = SENDER_ENV[String(category || 'transactional').toLowerCase()];
  const address = envName ? process.env[envName] : process.env.SMTP_USER || '';
  const email = String(address).trim();
  if (!EMAIL_RE.test(email)) {
    throw new Error(`Email sender is missing or invalid. Configure ${envName || 'SMTP_USER'} with a real mailbox address.`);
  }
  const displayName = String(process.env.EMAIL_FROM_NAME || 'Gweno Hub').trim();
  return { address: email, formatted: `"${displayName.replace(/["\\r\\n]/g, '')}" <${email}>` };
}

async function sendWithResend(message, sender) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured.');
  const payload = {
    from: sender.formatted,
    to: Array.isArray(message.to) ? message.to : [message.to],
    subject: message.subject,
  };
  if (message.text) payload.text = message.text;
  if (message.html) payload.html = message.html;
  if (message.replyTo || message.reply_to) payload.reply_to = message.replyTo || message.reply_to;
  if (message.cc) payload.cc = message.cc;
  if (message.bcc) payload.bcc = message.bcc;
  if (message.attachments?.length) {
    payload.attachments = await Promise.all(message.attachments.map(async (a) => {
      let content = a.content;
      if (Buffer.isBuffer(content)) content = content.toString('base64');
      else if (content && typeof content !== 'string') content = Buffer.from(content).toString('base64');
      if (!content && a.path) {
        const fs = await import('node:fs/promises');
        content = (await fs.readFile(a.path)).toString('base64');
      }
      return { filename: a.filename || 'attachment', content, content_type: a.contentType || a.content_type || 'application/octet-stream' };
    }));
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(result.message || result.error || `Resend request failed (${response.status}).`);
    err.code = `RESEND_${response.status}`;
    throw err;
  }
  return { accepted: payload.to, messageId: result.id, provider: 'resend', response: 'Resend accepted the message' };
}

export function createEmailTransport(category = 'transactional') {
  return {
    async sendMail(message) {
      const sender = senderFor(category, message.from);
      const resendKey = process.env.RESEND_API_KEY;
      let resendError;
      if (resendKey) {
        try {
          return await sendWithResend(message, sender);
        } catch (err) {
          resendError = err;
          console.error(`[email:${category}] Resend failed; trying SMTP fallback:`, err?.message || err);
        }
      }

      const config = smtpConfig(category);
      if (!config) {
        const detail = resendError ? ` Resend error: ${resendError.message}` : '';
        throw new Error(`Email provider is not configured: set RESEND_API_KEY or SMTP_USER and SMTP_PASS.${detail}`);
      }

      // Keep the visible From address category-specific. SMTP_USER is the login only.
      const smtp = nodemailer.createTransport(config);
      try {
        const result = await smtp.sendMail({
          ...message,
          from: sender.formatted,
        });
        return { ...result, provider: 'smtp' };
      } catch (smtpError) {
        const resendDetail = resendError ? ` Resend also failed: ${resendError.message}.` : '';
        smtpError.message = `${smtpError.message}.${resendDetail}`;
        throw smtpError;
      } finally {
        try { smtp.close(); } catch (_) {}
      }
    },
    close() {},
  };
}

export function emailConfigured() {
  const categoryCredentials = Object.keys(process.env).some((key) => /^SMTP_USER_[A-Z0-9_]+$/.test(key) && process.env[key] && process.env[key.replace('SMTP_USER_', 'SMTP_PASS_')]);
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS) || categoryCredentials);
}
