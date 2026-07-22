// pages/premium.js — full-page premium upgrade (KES 480 / month via Paystack)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import FlowShell from '../components/FlowShell';

const PREMIUM_FEE = 480;

export default function PremiumPage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [phone,   setPhone]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (ready && user) setPhone(user.phone || ''); }, [ready, user]);

  async function pay() {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: PREMIUM_FEE, phone, plan: 'premium' }),
      });
      const data = await res.json();
      if (data.status) { window.location.href = data.data.authorization_url; return; }
      setError('Payment could not be started. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  if (!ready || !user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
    </div>;
  }

  return (
    <FlowShell title="Premium" subtitle="KES 480 / month • required to submit tasks" icon="⭐">
      <div className="pay-amount" style={{ marginBottom: 16 }}>
        <div className="pay-amount-label">Premium Membership</div>
        <div className="pay-amount-value" style={{ color: '#374151' }}>KES {PREMIUM_FEE}</div>
        <div className="pay-amount-sub">One month • unlock task submissions</div>
      </div>

      <div className="premium-features">
        {[
          ['🚀', 'Unlimited task bidding'],
          ['💰', 'Priority payouts & withdrawals'],
          ['📊', 'Advanced earnings dashboard'],
          ['🎯', 'Exclusive high-paying tasks'],
          ['🏆', 'Premium badge on your profile'],
          ['📞', 'Dedicated support line'],
        ].map(([icon, text]) => (
          <div key={text} className="premium-feature-item"><span>{icon}</span><span>{text}</span></div>
        ))}
      </div>

      <div className="pay-phone-label" style={{ marginTop: 16 }}>M-Pesa / Mobile Money Number</div>
      <input
        className="pay-phone-input"
        value={phone}
        onChange={e => { setPhone(e.target.value); setError(''); }}
        placeholder="+254 7XX XXX XXX"
        style={{ borderColor: error ? '#4b5563' : undefined }}
      />
      {error && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{error}</div>}
      <button className="pay-btn" style={{ marginTop: 18, background: 'linear-gradient(135deg, #1f2937, #374151)' }} onClick={pay} disabled={loading}>
        {loading ? <><span className="spinner" /> Processing…</> : `🔒 Pay KES ${PREMIUM_FEE} via Paystack`}
      </button>
      <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
    </FlowShell>
  );
}
