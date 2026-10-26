// Server-only shared email transport. All GWENO Hub email is sent through Resend.
// Configure RESEND_API_KEY and a verified RESEND_FROM_EMAIL in Vercel.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) { return String(value ?? '').trim(); }

function getConfig() {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const fromAddress = clean(process.env.RESEND_FROM_EMAIL);
  const fromName = clean(process.env.EMAIL_FROM_NAME || 'Gweno Hub') || 'Gweno Hub';
  const replyTo = clean(process.env.RESEND_REPLY_TO_EMAIL || '');
  if (!apiKey) throw new Error('Email is not configured. Add RESEND_API_KEY in Vercel.');
  if (!fromAddress || !(EMAIL_RE.test(fromAddress) || /<[^<>\s]+@[^<>\s]+>/.test(fromAddress))) {
    throw new Error('Email is not configured. Set RESEND_FROM_EMAIL to a valid, verified Resend sender address.');
  }
  return { apiKey, fromAddress, fromName, replyTo };
}

export function getResendFromAddress() { return getConfig().fromAddress; }

function toAddress(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value.address === 'string') return value.name ? `${value.name} <${value.address}>` : value.address;
  return '';
}

function addresses(value) {
  return (Array.isArray(value) ? value : [value]).map(toAddress).filter(Boolean);
}

function isTemporary(error) {
  const status = Number(error?.statusCode || 0);
  return status === 429 || status >= 500 || ['ETIMEDOUT', 'ECONNECTION', 'ECONNRESET', 'EAI_AGAIN'].includes(String(error?.code || '').toUpperCase());
}

async function sendResend(message, config) {
  const to = addresses(message.to);
  if (!to.length || to.some(address => !EMAIL_RE.test(address))) throw new Error('A valid recipient email address is required.');
  const configuredFrom = config.fromAddress;
  const from = message.from ? toAddress(message.from) : (EMAIL_RE.test(configuredFrom) ? `${config.fromName} <${configuredFrom}>` : configuredFrom);
  const payload = {
    from,
    to,
    subject: String(message.subject || ''),
    ...(message.text !== undefined ? { text: String(message.text) } : {}),
    ...(message.html !== undefined ? { html: String(message.html) } : {}),
  };
  if (message.cc) payload.cc = addresses(message.cc);
  if (message.bcc) payload.bcc = addresses(message.bcc);
  const replyTo = message.replyTo || config.replyTo;
  if (replyTo) payload.reply_to = addresses(replyTo);
  if (message.headers && typeof message.headers === 'object') payload.headers = message.headers;
  if (message.attachments) payload.attachments = message.attachments.map(a => ({
    filename: String(a.filename || 'attachment'),
    ...(a.content !== undefined ? { content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : String(a.content) } : {}),
    ...(a.path ? { path: a.path } : {}),
    ...(a.contentType ? { content_type: a.contentType } : {}),
  }));

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.message || result?.name || `Resend API request failed with HTTP ${response.status}.`);
    error.statusCode = response.status;
    error.response = JSON.stringify(result).slice(0, 1000);
    throw error;
  }
  return { accepted: to, messageId: result.id, id: result.id, response: 'Accepted by Resend API', provider: 'resend', data: { id: result.id } };
}

export function createEmailTransport() {
  const config = getConfig();
  return {
    async sendMail(message = {}) {
      let lastError;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try { return await sendResend(message, config); }
        catch (error) {
          lastError = error;
          if (attempt >= 2 || !isTemporary(error)) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
        }
      }
      throw lastError;
    },
    close() {},
  };
}

export function emailConfigured() {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const from = clean(process.env.RESEND_FROM_EMAIL);
  return Boolean(apiKey && from && (EMAIL_RE.test(from) || /<[^<>\s]+@[^<>\s]+>/.test(from)));
}
