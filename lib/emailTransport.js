// lib/emailTransport.js — server-only Gmail SMTP transport.
// Uses Node built-ins; no extra npm package is required.
import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanHeader(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}
function encodeHeader(value) {
  const text = cleanHeader(value);
  return /^[\x20-\x7E]*$/.test(text) ? text : `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}
function addressList(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map(item => {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item.address === 'string') return item.address.trim();
    throw new Error('Invalid email address.');
  }).filter(Boolean);
}
function encodeBody(value) {
  return Buffer.from(String(value ?? ''), 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n').trim();
}
function makeMessage(message, config) {
  const to = addressList(message.to);
  if (!to.length || [...to, ...(message.cc ? addressList(message.cc) : []), ...(message.bcc ? addressList(message.bcc) : [])].some(a => !EMAIL_RE.test(a))) {
    throw new Error('A valid recipient email address is required.');
  }
  const cc = message.cc ? addressList(message.cc) : [];
  const bcc = message.bcc ? addressList(message.bcc) : [];
  const headers = [
    `From: ${encodeHeader(config.fromName)} <${config.user}>`,
    `To: ${to.join(', ')}`,
    ...(cc.length ? [`Cc: ${cc.join(', ')}`] : []),
    ...(message.replyTo || config.replyTo ? [`Reply-To: ${cleanHeader(message.replyTo || config.replyTo)}`] : []),
    `Subject: ${encodeHeader(message.subject || '')}`,
    'MIME-Version: 1.0',
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@gmail.com>`,
  ];
  for (const [key, value] of Object.entries(message.headers || {})) {
    if (/^[A-Za-z0-9-]+$/.test(key)) headers.push(`${key}: ${cleanHeader(value)}`);
  }
  const text = message.text !== undefined ? String(message.text) : '';
  const html = message.html !== undefined ? String(message.html) : '';
  let content;
  if (text && html) {
    const boundary = `gweno_${crypto.randomBytes(12).toString('hex')}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    content = [
      `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', encodeBody(text),
      `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', encodeBody(html),
      `--${boundary}--`, '',
    ].join('\r\n');
  } else {
    headers.push(`Content-Type: ${html ? 'text/html' : 'text/plain'}; charset=UTF-8`);
    headers.push('Content-Transfer-Encoding: base64');
    content = `${encodeBody(html || text)}\r\n`;
  }
  return { envelopeRecipients: [...to, ...cc, ...bcc], data: `${headers.join('\r\n')}\r\n\r\n${content}` };
}

function readResponse(socket, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };
    const onError = error => { cleanup(); reject(error); };
    const onClose = () => { cleanup(); reject(new Error('SMTP connection closed unexpectedly.')); };
    const onData = chunk => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const last = lines[lines.length - 1];
      if (/^\d{3} /.test(last)) {
        cleanup();
        const code = Number(last.slice(0, 3));
        if (code < 200 || code >= 400) reject(new Error(`Gmail SMTP error ${code}: ${lines.join(' ').slice(0, 800)}`));
        else resolve({ code, text: lines.join(' ') });
      }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Timed out waiting for Gmail SMTP response.')); }, timeoutMs);
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
  });
}
async function command(socket, line, expectedCodes) {
  const responsePromise = readResponse(socket);
  socket.write(`${line}\r\n`);
  const response = await responsePromise;
  if (expectedCodes && !expectedCodes.includes(response.code)) throw new Error(`Unexpected Gmail SMTP response: ${response.text}`);
  return response;
}
function connectSocket(host, port, secure) {
  return new Promise((resolve, reject) => {
    const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    const readyEvent = secure ? 'secureConnect' : 'connect';
    const onError = error => { socket.off(readyEvent, onReady); reject(error); };
    const onReady = () => { socket.off('error', onError); resolve(socket); };
    socket.once('error', onError);
    socket.once(readyEvent, onReady);
    socket.setTimeout(30000, () => socket.destroy(new Error('Gmail SMTP connection timed out.')));
  });
}
function upgradeToTls(socket, host) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host });
    const onError = error => { secureSocket.off('secureConnect', onReady); reject(error); };
    const onReady = () => { secureSocket.off('error', onError); resolve(secureSocket); };
    secureSocket.once('error', onError);
    secureSocket.once('secureConnect', onReady);
  });
}
async function sendViaGmail(message, config) {
  const built = makeMessage(message, config);
  let socket;
  try {
    socket = await connectSocket(config.host, config.port, config.secure);
    await readResponse(socket); // SMTP greeting
    await command(socket, `EHLO ${config.helo}`, [250]);
    if (!config.secure) {
      await command(socket, 'STARTTLS', [220]);
      socket = await upgradeToTls(socket, config.host);
      await command(socket, `EHLO ${config.helo}`, [250]);
    }
    await command(socket, 'AUTH LOGIN', [334]);
    await command(socket, Buffer.from(config.user, 'utf8').toString('base64'), [334]);
    await command(socket, Buffer.from(config.pass, 'utf8').toString('base64'), [235]);
    await command(socket, `MAIL FROM:<${config.user}>`, [250]);
    for (const recipient of built.envelopeRecipients) await command(socket, `RCPT TO:<${recipient}>`, [250, 251]);
    await command(socket, 'DATA', [354]);
    const dotStuffed = built.data.replace(/(^|\r\n)\./g, '$1..');
    const responsePromise = readResponse(socket);
    socket.write(`${dotStuffed}\r\n.\r\n`);
    const response = await responsePromise;
    if (response.code !== 250) throw new Error(`Gmail did not accept the message: ${response.text}`);
    try { await command(socket, 'QUIT', [221]); } catch (_) {}
    socket.end();
    return { accepted: built.envelopeRecipients, response: response.text, provider: 'gmail-smtp' };
  } catch (error) {
    if (socket && !socket.destroyed) socket.destroy();
    throw error;
  }
}
function getConfig() {
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
  if (!user || !EMAIL_RE.test(user)) throw new Error('Gmail SMTP is not configured. Set SMTP_USER to your Gmail address in Vercel.');
  if (!pass) throw new Error('Gmail SMTP is not configured. Set SMTP_PASS to a Google App Password in Vercel.');
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid port number.');
  return {
    user, pass, host: String(process.env.SMTP_HOST || 'smtp.gmail.com').trim(), port, secure,
    helo: String(process.env.SMTP_HELO || 'localhost').replace(/[^A-Za-z0-9.-]/g, '') || 'localhost',
    fromName: String(process.env.EMAIL_FROM_NAME || 'Gweno Hub').trim(),
    replyTo: String(process.env.SMTP_REPLY_TO_EMAIL || process.env.RESEND_REPLY_TO_EMAIL || '').trim(),
  };
}
export function getResendFromAddress() { return getConfig().user; }
export function createEmailTransport(_category = 'transactional') {
  const config = getConfig();
  let closed = false;
  return {
    async sendMail(message = {}) {
      if (closed) throw new Error('Email transport is closed.');
      return sendViaGmail(message, config);
    },
    close() { closed = true; },
  };
}
export function emailConfigured() {
  return Boolean(String(process.env.SMTP_USER || '').trim() && String(process.env.SMTP_PASS || '').trim());
}
