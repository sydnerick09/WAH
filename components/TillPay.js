// components/TillPay.js
// M-Pesa "Buy Goods and Services" (Till) payment instructions used for Premium
// upgrades and withdrawal fees. Shows the till number + amount + steps, and an
// "I have paid — notify support" action that emails support (prefilled) AND
// fires a server notification, then calls onPaid() to advance the flow.
import { useState } from 'react';
import Icon from './Icon';
import { sendNotify } from '../lib/notify';
import { logTillPayment } from '../lib/auth';

const SUPPORT_EMAIL = 'businesshub.comke@gmail.com';

// Map a human "purpose" to a ledger payment type.
function purposeType(p) {
  const s = String(p || '').toLowerCase();
  if (s.includes('premium'))                       return 'premium';
  if (s.includes('activation') || s.includes('registration')) return 'registration';
  if (s.includes('withdraw'))                      return 'withdrawal_fee';
  if (s.includes('training'))                      return 'training';
  return 'other';
}

export default function TillPay({ user, amount, purpose = 'Payment', till = '1545320', onPaid, onCancel, paidLabel = 'I Have Paid — Notify Support' }) {
  const [copied, setCopied]   = useState(false);
  const [sending, setSending] = useState(false);

  const amt = Number(amount || 0);

  function copyTill() {
    try {
      navigator.clipboard.writeText(String(till));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  async function handlePaid() {
    if (sending) return;
    setSending(true);
    const subject = `${purpose} payment — ${user?.fullName || ''}`;
    const details =
      `I have paid ${purpose} (KES ${amt.toLocaleString()}) via M-Pesa Buy Goods.\n` +
      `Till Number: ${till}\n\n` +
      `Account Name: ${user?.fullName || ''}\n` +
      `Email: ${user?.email || ''}\n` +
      `Phone: ${user?.phone || ''}\n\n` +
      `Please verify the payment and activate.`;

    // Fire a server-side notification to support (best-effort, don't block).
    sendNotify({ type: `${purpose} Payment`, name: user?.fullName || '', email: user?.email || '', phone: user?.phone || '', subject, details }).catch(() => {});

    // Record a pending, auditable transaction in the payment ledger (best-effort).
    logTillPayment({ type: purposeType(purpose), amount: amt, phone: user?.phone || '' }).catch(() => {});

    // Open the client's email app (Gmail / default) prefilled to support.
    const body = `Hello Gweno Hub,\n\n${details}\n\nThank you.`;
    try {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (_) {}

    setSending(false);
    if (onPaid) onPaid();
  }

  return (
    <>
      <div className="pay-amount" style={{ marginBottom: 16 }}>
        <div className="pay-amount-label">{purpose}</div>
        <div className="pay-amount-value" style={{ color: 'var(--mpesa-green)' }}>KES {amt.toLocaleString()}</div>
        <div className="pay-amount-sub">Pay via M-Pesa Buy Goods (Lipa na M-Pesa)</div>
      </div>

      {/* Till number card */}
      <div style={{ border: '2px solid var(--mpesa-green)', borderRadius: 14, padding: '16px 18px', marginBottom: 16, textAlign: 'center', background: '#f9fafb' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Buy Goods Till Number</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, letterSpacing: 3, color: '#111827', lineHeight: 1.1 }}>{till}</div>
        <button
          onClick={copyTill}
          style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: copied ? '#111827' : 'var(--mpesa-green)', color: '#fff', border: 'none', borderRadius: 50, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Icon name={copied ? 'check' : 'clipboard'} size={14} /> {copied ? 'Copied!' : 'Copy Till'}
        </button>
      </div>

      {/* Steps */}
      <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb' }}>
        <strong>How to pay:</strong>
        <ol style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Open <strong>M-Pesa</strong> → <strong>Lipa na M-Pesa</strong></li>
          <li>Select <strong>Buy Goods and Services</strong></li>
          <li>Till Number: <strong>{till}</strong></li>
          <li>Amount: <strong>KES {amt.toLocaleString()}</strong></li>
          <li>Enter your M-Pesa PIN and confirm</li>
        </ol>
      </div>

      <button className="pay-btn" style={{ background: 'var(--mpesa-green)' }} onClick={handlePaid} disabled={sending}>
        {sending ? <><span className="spinner" /> Opening email…</> : <><Icon name="mail" size={16} /> {paidLabel}</>}
      </button>
      {onCancel && (
        <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={onCancel}>Cancel</button>
      )}
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        <Icon name="lock" size={13} /> After you pay, tap the button to notify support for verification
      </div>
    </>
  );
}


