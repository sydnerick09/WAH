// Server-only shared Gmail SMTP transport for all GWENO Hub email categories.
// All outgoing mail is sent from the configured Gmail account using its Google App Password.
import nodemailer from 'nodemailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = value => String(value ?? '').trim();

function getConfig() {
  const user = clean(process.env.SMTP_USER || 'businesshub.comke@gmail.com');
  const pass = clean(process.env.SMTP_PASS).replace(/\s+/g, '');
  const host = clean(process.env.SMTP_HOST || 'smtp.gmail.com');
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
  if (!EMAIL_RE.test(user)) throw new Error('Gmail SMTP is not configured. Set SMTP_USER to businesshub.comke@gmail.com in Vercel.');
  if (user.toLowerCase() !== 'businesshub.comke@gmail.com') throw new Error('GWENO outgoing email must use businesshub.comke@gmail.com as the sender.');
  if (!pass) throw new Error('Gmail SMTP is not configured. Set SMTP_PASS to your Google App Password in Vercel.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid port number.');
  return {
    user, pass, host, port, secure,
    fromName: clean(process.env.EMAIL_FROM_NAME || 'GWENO Hub'),
    replyTo: clean(process.env.SMTP_REPLY_TO_EMAIL || 'businesshub.comke@gmail.com'),
  };
}

export function getResendFromAddress() { return getConfig().user; }

function isTemporary(error) {
  const code = String(error?.code || '').toUpperCase();
  const responseCode = Number(error?.responseCode || error?.statusCode || 0);
  return (responseCode >= 400 && responseCode < 500)
    || ['ETIMEDOUT', 'ECONNECTION', 'ECONNRESET', 'EPIPE', 'EAI_AGAIN', 'ESOCKET'].includes(code);
}

export function createEmailTransport(category = 'transactional') {
  const config = getConfig();
  const broadcast = String(category).toLowerCase() === 'broadcast';
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    ...(broadcast ? { pool: true, maxConnections: 2, maxMessages: 100, rateDelta: 1000, rateLimit: 2 } : {}),
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 60000,
    tls: { minVersion: 'TLSv1.2' },
    logger: false,
    debug: false,
  });

  return {
    async sendMail(message = {}) {
      let lastError;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          // Force the one approved sender, even if a caller supplies a different From.
          return await transporter.sendMail({
            ...message,
            from: { name: config.fromName, address: config.user },
            replyTo: message.replyTo || config.replyTo,
          });
        } catch (error) {
          lastError = error;
          if (attempt >= 2 || !isTemporary(error)) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
        }
      }
      throw lastError;
    },
    close() { transporter.close(); },
  };
}

export function emailConfigured() {
  return EMAIL_RE.test(clean(process.env.SMTP_USER || 'businesshub.comke@gmail.com'))
    && Boolean(clean(process.env.SMTP_PASS));
}
