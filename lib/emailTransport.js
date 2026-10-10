// lib/emailTransport.js — server-only Resend API transport.
// All application email categories use one configured sender; message content is unchanged.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_REPLY_TO = 'businesshub.comke@gmail.com';
const RESEND_API = 'https://api.resend.com';

function getConfig() {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Resend is not configured. Add RESEND_API_KEY in Vercel Environment Variables.');
  }

  // Resend requires a verified sender domain for production. The onboarding sender
  // is only suitable for limited tests to the account owner's email address.
  const fromAddress = String(process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
  const replyTo = String(process.env.RESEND_REPLY_TO_EMAIL || DEFAULT_REPLY_TO).trim();
  if (!EMAIL_RE.test(fromAddress)) throw new Error('RESEND_FROM_EMAIL must be a valid email address.');
  if (!EMAIL_RE.test(replyTo)) throw new Error('RESEND_REPLY_TO_EMAIL must be a valid email address.');

  const fromName = String(process.env.EMAIL_FROM_NAME || 'Gweno Hub').trim();
  return {
    apiKey,
    fromAddress,
    from: `${fromName} <${fromAddress}>`,
    replyTo,
  };
}

function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments)) return undefined;
  return attachments.map((attachment) => {
    const result = { filename: attachment.filename || 'attachment' };
    if (attachment.content !== undefined && attachment.content !== null) {
      result.content = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : (typeof attachment.content === 'string'
          ? Buffer.from(attachment.content).toString('base64')
          : Buffer.from(attachment.content).toString('base64'));
    } else if (attachment.path) {
      throw new Error('Resend API attachments must be supplied as content, not a filesystem path.');
    } else {
      throw new Error('An email attachment is missing its content.');
    }
    if (attachment.contentType) result.content_type = attachment.contentType;
    return result;
  });
}

function toResendPayload(message = {}, config) {
  const to = message.to;
  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new Error('A recipient email address is required.');
  }
  const payload = {
    from: config.from,
    to: Array.isArray(to) ? to : [to],
    subject: String(message.subject || ''),
    reply_to: message.replyTo || config.replyTo,
  };
  if (message.text !== undefined) payload.text = message.text;
  if (message.html !== undefined) payload.html = message.html;
  if (message.cc) payload.cc = Array.isArray(message.cc) ? message.cc : [message.cc];
  if (message.bcc) payload.bcc = Array.isArray(message.bcc) ? message.bcc : [message.bcc];
  if (message.headers) payload.headers = message.headers;
  const attachments = normalizeAttachments(message.attachments);
  if (attachments) payload.attachments = attachments;
  return payload;
}

async function requestResend(path, apiKey, body) {
  const response = await fetch(`${RESEND_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result.message || result.error || `Resend request failed (${response.status}).`;
    throw new Error(detail);
  }
  return result;
}

export function getResendFromAddress() {
  return getConfig().fromAddress;
}

export function createEmailTransport(_category = 'transactional') {
  const config = getConfig();
  let closed = false;

  return {
    async sendMail(message = {}) {
      if (closed) throw new Error('Email transport is closed.');
      const payload = toResendPayload(message, config);
      const result = await requestResend('/emails', config.apiKey, payload);
      return { ...result, provider: 'resend' };
    },
    // Resend's batch endpoint accepts up to 100 distinct messages per request.
    // Callers should split larger broadcasts into chunks of at most 100.
    async sendBatch(messages = []) {
      if (closed) throw new Error('Email transport is closed.');
      if (!Array.isArray(messages) || messages.length === 0) return { data: [], provider: 'resend' };
      if (messages.length > 100) throw new Error('Resend batches may contain at most 100 emails.');
      const emails = messages.map(message => toResendPayload(message, config));
      const result = await requestResend('/emails/batch', config.apiKey, { emails });
      return { ...result, provider: 'resend' };
    },
    close() { closed = true; },
  };
}

export function emailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim());
}
