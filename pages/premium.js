// pages/premium.js, full-page premium upgrade (KES 480 / month via Paystack)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import FlowShell from '../components/FlowShell';
import Icon from '../components/Icon';
import { FlowSkeleton } from '../components/Skeleton';

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
    return <FlowSkeleton rows={2} />;
  }

  return (
    <FlowShell title="Premium" subtitle="KES 480 / month • required to submit tasks" icon="star">
      <div className="pay-amount" style={{ marginBottom: 16 }}>
        <div className="pay-amount-label">Premium Membership</div>
        <div className="pay-amount-value" style={{ color: '#374151' }}>KES {PREMIUM_FEE}</div>
        <div className="pay-amount-sub">One month • unlock task submissions</div>
      </div>

      <div className="premium-features">
        {[
          ['upload',    'Unlimited task bidding'],
          ['cash',      'Priority payouts & withdrawals'],
          ['chart',     'Advanced earnings dashboard'],
          ['star',      'Exclusive high-paying tasks'],
          ['shield',    'Premium badge on your profile'],
          ['phone',     'Dedicated support line'],
        ].map(([icon, text]) => (
          <div key={text} className="premium-feature-item"><span style={{ display: 'flex' }}><Icon name={icon} size={18} /></span><span>{text}</span></div>
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
      <button className="pay-btn" style={{ marginTop: 18, background: '#000000' }} onClick={pay} disabled={loading}>
        {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="lock" size={16} /> Pay KES {PREMIUM_FEE} via Paystack</>}
      </button>
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Secured by Paystack • M-Pesa supported</div>
    </FlowShell>
  );
}
