// lib/approvalEmail.js, server-side: builds and sends the
// "Task Approved & Earnings Credited" email. Shared by the auto-send on
// approval (pages/api/db.js → adminUpdateSubmission) and the manual resend.
import nodemailer from 'nodemailer';

const DASHBOARD_URL = process.env.PUBLIC_BASE_URL || 'https://onlinejob-pi.vercel.app';
const SUBJECT = 'Task Approved & Earnings Credited';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function money(n) {
  return `KES ${Number(n || 0).toLocaleString('en-KE')}`;
}

// Returns { subject, text, html } with the dynamic placeholders filled in:
// {USER_NAME}, {TASK_NAME}, {TASK_AMOUNT}, {UPDATED_BALANCE}.
export function buildApprovalEmail({ userName, taskName, amount, updatedBalance }) {
  const v = {
    USER_NAME:       userName || 'there',
    TASK_NAME:       taskName || 'your task',
    TASK_AMOUNT:     money(amount),
    UPDATED_BALANCE: money(updatedBalance),
  };

  const text = `Hello ${v.USER_NAME},

We are pleased to inform you that your submission for ${v.TASK_NAME} has been reviewed and approved.

Your submission has been received successfully, and the task earnings have been credited to your account balance.

Amount Credited: ${v.TASK_AMOUNT}
Updated Balance: ${v.UPDATED_BALANCE}

You can now log in to your dashboard to view your updated balance and continue working on additional tasks.

Dashboard: ${DASHBOARD_URL}

Withdrawal Reminder
When requesting a withdrawal, please ensure that you enter the correct payment details and account credentials. Incorrect or incomplete withdrawal information may result in delayed or unsuccessful transactions.

Before submitting a withdrawal request, please verify:
- Account holder name
- Phone number or payment account
- Selected payment method
- Any other required withdrawal details

We are unable to guarantee successful withdrawals if incorrect information is provided.

Thank you for being part of Gweno Hub.

Gweno Hub Team`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;max-width:600px;">
      <p>Hello <strong>${esc(v.USER_NAME)}</strong>,</p>
      <p>We are pleased to inform you that your submission for <strong>${esc(v.TASK_NAME)}</strong> has been reviewed and <strong>approved</strong>.</p>
      <p>Your submission has been received successfully, and the task earnings have been credited to your account balance.</p>
      <table cellpadding="0" cellspacing="0" style="margin:14px 0;border-collapse:collapse;">
        <tr>
          <td style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:10px 0 0 10px;padding:12px 18px;">
            <div style="font-size:12px;color:#047857;font-weight:700;text-transform:uppercase;">Amount Credited</div>
            <div style="font-size:20px;font-weight:800;color:#065F46;">${esc(v.TASK_AMOUNT)}</div>
          </td>
          <td style="background:#F0FDF4;border:1px solid #6EE7B7;border-left:none;border-radius:0 10px 10px 0;padding:12px 18px;">
            <div style="font-size:12px;color:#047857;font-weight:700;text-transform:uppercase;">Updated Balance</div>
            <div style="font-size:20px;font-weight:800;color:#065F46;">${esc(v.UPDATED_BALANCE)}</div>
          </td>
        </tr>
      </table>
      <p>You can now log in to your dashboard to view your updated balance and continue working on additional tasks.</p>
      <p><a href="${DASHBOARD_URL}" style="display:inline-block;background:#0F766E;color:#fff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;">Go to Dashboard</a></p>
      <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:12px 14px;margin:16px 0;">
        <div style="font-weight:700;color:#92400E;margin-bottom:6px;">Withdrawal Reminder</div>
        <div style="color:#78350F;font-size:14px;">
          When requesting a withdrawal, please ensure that you enter the correct payment details and account credentials.
          Incorrect or incomplete withdrawal information may result in delayed or unsuccessful transactions. Before submitting, please verify:
          <ul style="margin:8px 0 0;padding-left:18px;">
            <li>Account holder name</li>
            <li>Phone number or payment account</li>
            <li>Selected payment method</li>
            <li>Any other required withdrawal details</li>
          </ul>
          <div style="margin-top:8px;">We are unable to guarantee successful withdrawals if incorrect information is provided.</div>
        </div>
      </div>
      <p>Thank you for being part of Gweno Hub.</p>
      <p style="color:#125C37;font-weight:700;margin-top:12px;">Gweno Hub Team</p>
    </div>`;

  return { subject: SUBJECT, text, html };
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
  });
}

// Sends the approval email. Never throws, returns { success, message?, configured? }
// so the caller can log the delivery status without risking the approval flow.
export async function sendApprovalEmail({ userEmail, userName, taskName, amount, updatedBalance }) {
  try {
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(userEmail))) {
      return { success: false, message: 'Invalid recipient email.' };
    }
    const transporter = getTransporter();
    if (!transporter) return { success: false, configured: false, message: 'SMTP not configured.' };

    const { subject, text, html } = buildApprovalEmail({ userName, taskName, amount, updatedBalance });
    await transporter.sendMail({
      from: `"Gweno Hub" <${process.env.SMTP_USER}>`,
      to: String(userEmail),
      subject, text, html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, message: err?.message || 'Send failed.' };
  }
}
