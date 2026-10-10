// pages/api/admin/send-email.js
// Admin-only: send an email to one registered client through Resend.
import { createEmailTransport } from '../../../lib/emailTransport';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bodyToHtml(body, name) {
  const greetingDone = /dear\s/i.test(body.slice(0, 40));
  const intro = greetingDone ? '' : `<p>Hi ${esc(name) || 'there'},</p>`;
  const paragraphs = String(body)
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
      ${intro}${paragraphs}
      <p style="margin-top:18px;color:#1f2937;font-weight:600;">— The Gweno Hub Team</p>
    </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { adminSecret, to, name, subject, body } = req.body || {};
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const email = String(to || '').trim().toLowerCase();
  const subj = String(subject || '').trim();
  const rawBody = String(body || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid recipient email is required.' });
  }
  if (!subj || !rawBody) {
    return res.status(400).json({ success: false, message: 'Subject and message cannot be empty.' });
  }

  let transporter;
  try {
    transporter = createEmailTransport('admin');
    const result = await transporter.sendMail({
      to: email,
      subject: subj,
      text: rawBody,
      html: bodyToHtml(rawBody, name),
    });
    return res.status(200).json({
      success: true,
      provider: 'resend',
      message: `Resend accepted the email request for ${email}. This does not guarantee inbox delivery; check Resend email logs for the final status.`,
      id: result?.id || result?.data?.id || null,
    });
  } catch (err) {
    console.error('[admin/send-email] Resend send error:', err?.message || err);
    return res.status(502).json({
      success: false,
      configured: Boolean(process.env.RESEND_API_KEY),
      message: err?.message || 'Resend failed to send the email.',
    });
  } finally {
    try { transporter?.close(); } catch (_) {}
  }
}
