// pages/api/notify.js
// Automated email: notifies the admin of a client message and sends the client an automatic confirmation reply.\n// Delivery uses the shared Resend API configuration.\nimport { createEmailTransport } from '../../lib/emailTransport';

function getTransporter() {
  return createEmailTransport('support');
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const {
    type    = 'Message',
    name    = '',
    email   = '',
    phone   = '',
    subject = '',
    details = '',
  } = req.body || {};

  const transporter = getTransporter();
  if (!transporter) {
    // No credentials configured yet, tell the client so it can fall back gracefully.
    return res.status(200).json({ success: false, configured: false, message: 'Email is not configured yet.' });
  }

  const admin = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.RESEND_REPLY_TO_EMAIL || 'businesshub.comke@gmail.com';
  const adminTransporter = createEmailTransport('admin');

  const detailRows = `
    <table cellpadding="8" style="border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;">
      <tr><td><strong>Type</strong></td><td>${esc(type)}</td></tr>
      <tr><td><strong>Name</strong></td><td>${esc(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${esc(email)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${esc(phone)}</td></tr>
      <tr><td valign="top"><strong>Details</strong></td><td><pre style="margin:0;font-family:inherit;white-space:pre-wrap;">${esc(details)}</pre></td></tr>
      <tr><td><strong>Received</strong></td><td>${new Date().toLocaleString('en-KE')}</td></tr>
    </table>`;

  let adminSent = false;
  let clientSent = false;

  // 1) Notify admin
  try {
    await adminTransporter.sendMail({
      to: admin,
      replyTo: email || undefined,
      subject: subject || `[${type}] from ${name || email || 'a client'}`,
      html: `<h2 style="font-family:Inter,Arial,sans-serif;">New ${esc(type)}</h2>${detailRows}`,
    });
    adminSent = true;
  } catch (err) {
    console.error('[notify] admin email error:', err.message);
  }

  // 2) Auto-reply to the client
  if (email) {
    try {
      await transporter.sendMail({
        to: email,
        subject: 'We’ve received your request, Gweno Hub',
        html: `
          <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;">
            <p>Hi ${esc(name) || 'there'},</p>
            <p>Thank you for reaching out to <strong>Gweno Hub</strong>. We’ve received your <strong>${esc(type).toLowerCase()}</strong> and our team will get back to you shortly.</p>
            <p style="background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:12px 14px;">
              <strong>Summary</strong><br/>${esc(details).replace(/\n/g, '<br/>')}
            </p>
            <p>Warm regards,<br/>The Gweno Hub Team</p>
          </div>`,
      });
      clientSent = true;
    } catch (err) {
      console.error('[notify] client auto-reply error:', err.message);
    }
  }

  try { adminTransporter.close(); } catch (_) {}
  try { transporter.close(); } catch (_) {}
  return res.status(200).json({ success: adminSent || clientSent, configured: true, adminSent, clientSent });
}
