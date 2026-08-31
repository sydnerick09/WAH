// components/PaystackFee.js
// "Pay via Paystack" button for withdrawal fees. Initializes a transaction on the
// server (secret key stays server-side), then redirects to Paystack's hosted
// checkout. On return, /payment-success verifies server-side before the flow
// continues — the frontend never marks a fee as paid on its own.
import { useState } from 'react';
import Icon from './Icon';
import { getToken } from '../lib/auth';

export default function PaystackFee({ user, amount, plan, method = '', label, note }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const amt = Math.round(Number(amount) || 0);

  async function pay() {
    setErr('');
    if (!user?.email) { setErr('Your account has no email address for the receipt.'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: getToken(), email: user.email, amount: amt, plan, method, phone: user.phone || '' }),
      });
      const data = await r.json();
      if (data.status && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;   // hosted Paystack checkout
        return;
      }
      setErr(data.message || 'Could not start the payment. Please try again.');
    } catch {
      setErr('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <>
      <button className="pay-btn" style={{ background: '#000000' }} onClick={pay} disabled={loading}>
        {loading ? <><span className="spinner" /> Redirecting to Paystack…</> : <><Icon name="lock" size={16} /> {label || `Pay KES ${amt.toLocaleString()} via Paystack`}</>}
      </button>
      {err && <div style={{ color: '#4b5563', fontSize: 12.5, marginTop: 8 }}>{err}</div>}
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        <Icon name="lock" size={13} /> {note || 'Secured by Paystack • verified on our server before your request proceeds'}
      </div>
    </>
  );
}


