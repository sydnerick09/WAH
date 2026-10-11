// Server-only shared email transport for all GWENO Hub email types.
// Supports the existing Namecheap/SMTP configuration and the Resend API
// configuration used by earlier deployments. SMTP uses Nodemailer.
import nodemailer from 'nodemailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) {
  return String(value ?? '').trim();
}

function getConfig() {
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS);
  const host = clean(process.env.SMTP_HOST || 'mail.privateemail.com');
  const resendApiKey = clean(process.env.RESEND_API_KEY);
  const resendFrom = clean(process.env.RESEND_FROM_EMAIL);
  const fromName = clean(process.env.EMAIL_FROM_NAME || 'Gweno Hub') || 'Gweno Hub';
  const replyTo = clean(process.env.SMTP_REPLY_TO_EMAIL || process.env.RESEND_REPLY_TO_EMAIL || '');

  // Prefer a complete SMTP configuration; otherwise retain compatibility with
  // the Resend configuration used by the previous email implementation.
  if (user && EMAIL_RE.test(user) && pass && host) {
    const defaultPort = host.toLowerCase() === 'smtp.gmail.com' ? 587 : 465;
    const port = Number(process.env.SMTP_PORT || defaultPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT must be a valid port number.');
    }
    const secure = process.env.SMTP_SECURE == null
      ? port === 465
      : String(process.env.SMTP_SECURE).toLowerCase() === 'true';
    const fromAddress = clean(process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || user);
    if (!EMAIL_RE.test(fromAddress)) throw new Error('SMTP_FROM_EMAIL must be a valid email address.');
    return { mode: 'smtp', user, pass, host, port, secure, fromAddress, fromName, replyTo };
  }

  if (resendApiKey && resendFrom && (EMAIL_RE.test(resendFrom) || /<[^<>\s]+@[^<>\s]+>/.test(resendFrom))) {
    return { mode: 'resend', resendApiKey, fromAddress: resendFrom, fromName, replyTo };
  }

  throw new Error(
    'Email is not configured. Set SMTP_USER and SMTP_PASS for SMTP, or RESEND_API_KEY and RESEND_FROM_EMAIL for Resend in Vercel.'
  );
}

export function getResendFromAddress() {
  return getConfig().fromAddress;
}

function isTemporary(error) {
  const code = String(error?.code || '').toUpperCase();
  const responseCode = Number(error?.responseCode || error?.statusCode || 0);
  const response = String(error?.response || error?.message || '');
  return (responseCode >= 400 && responseCode < 500)
    || ['ETIMEDOUT', 'ECONNECTION', 'ECONNRESET', 'EPIPE', 'EAI_AGAIN', 'ESOCKET'].includes(code)
    || /\b(421|450|451|452|454)-?4\./i.test(response);
}

function toResendAddress(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value.address === 'string') {
    return value.name ? `${value.name} <${value.address}>` : value.address;
  }
  return '';
}

async function sendResend(message, config) {
  const to = (Array.isArray(message.to) ? message.to : [message.to]).map(toResendAddress).filter(Boolean);
  if (!to.length || to.some(address => !EMAIL_RE.test(address))) {
    throw new Error('A valid recipient email address is required.');
  }
  const from = message.from ? toResendAddress(message.from) : (EMAIL_RE.test(config.fromAddress)
    ? `${config.fromName} <${config.fromAddress}>`
    : config.fromAddress);
  const payload = {
    from,
    to,
    subject: String(message.subject || ''),
    ...(message.text !== undefined ? { text: String(message.text) } : {}),
    ...(message.html !== undefined ? { html: String(message.html) } : {}),
  };
  if (message.cc) payload.cc = (Array.isArray(message.cc) ? message.cc : [message.cc]).map(toResendAddress);
  if (message.bcc) payload.bcc = (Array.isArray(message.bcc) ? message.bcc : [message.bcc]).map(toResendAddress);
  const replyTo = message.replyTo || config.replyTo;
  if (replyTo) payload.reply_to = toResendAddress(replyTo);
  if (message.headers && typeof message.headers === 'object') payload.headers = message.headers;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.message || result?.name || `Resend API request failed with HTTP ${response.status}.`);
    error.statusCode = response.status;
    error.response = JSON.stringify(result).slice(0, 1000);
    throw error;
  }
  return { accepted: to, messageId: result.id, response: 'Accepted by Resend API', provider: 'resend' };
}

export function createEmailTransport(category = 'transactional') {
  const config = getConfig();
  const isBroadcast = String(category).toLowerCase() === 'broadcast';
  const transporter = config.mode === 'smtp'
    ? nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        pool: isBroadcast,
        ...(isBroadcast ? { maxConnections: 2, maxMessages: 100, rateDelta: 1000, rateLimit: 2 } : {}),
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 60000,
        name: String(process.env.SMTP_HELO || 'gweno.business').replace(/[^A-Za-z0-9.-]/g, '') || 'gweno.business',
        tls: { minVersion: 'TLSv1.2' },
        logger: false,
        debug: false,
      })
    : null;

  return {
    async sendMail(message = {}) {
      let lastError;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (config.mode === 'resend') return await sendResend(message, config);
          return await transporter.sendMail({
            ...message,
            from: message.from || { name: config.fromName, address: config.fromAddress },
            ...(message.replyTo || !config.replyTo ? {} : { replyTo: config.replyTo }),
          });
        } catch (error) {
          lastError = error;
          if (attempt >= 2 || !isTemporary(error)) throw error;
          // Retry transient SMTP/network/API errors (including SMTP 454 and HTTP 429)
          // with exponential backoff; permanent authentication errors fail fast.
          await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
        }
      }
      throw lastError;
    },
    close() { if (transporter) transporter.close(); },
  };
}

export function emailConfigured() {
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS);
  const host = clean(process.env.SMTP_HOST || 'mail.privateemail.com');
  const smtpReady = Boolean(user && EMAIL_RE.test(user) && pass && host);
  const resendFrom = clean(process.env.RESEND_FROM_EMAIL);
  const resendReady = Boolean(clean(process.env.RESEND_API_KEY) && resendFrom
    && (EMAIL_RE.test(resendFrom) || /<[^<>\s]+@[^<>\s]+>/.test(resendFrom)));
  return smtpReady || resendReady;
}
