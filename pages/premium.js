// pages/premium.js — full-page premium upgrade (replaces the pop-up)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { upgradePremiumWithBalance } from '../lib/auth';
import FlowShell from '../components/FlowShell';

const PREMIUM_FEE = 480;

export default function PremiumPage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [step,     setStep]     = useState('info');   // info → (password | topup) → success
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [doneUser, setDoneUser] = useState(null);

  const pbal   = Number(user?.premiumBalance || 0);
  const enough = pbal >= PREMIUM_FEE;
  const topup  = Math.max(0, PREMIUM_FEE - pbal);

  useEffect(() => { if (ready && user) setPhone(user.phone || ''); }, [ready, user]);

  async function payWithBalance() {
    if (!password) { setError('Please enter your password.'); return; }
    if (password !== user.password) { setError('Incorrect password. Please try again.'); return; }
    setError('');
    setLoading(true);
    const updated = await upgradePremiumWithBalance(user.id);
    setLoading(false);
    if (updated) { setDoneUser(updated); setStep('success'); }
    else setError('Upgrade failed. Please try again.');
  }

  async function payTopup() {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: topup, phone, plan: 'premium_topup' }),
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
        <div className="pay-amount-label">Your Premium Balance (from the Skills Test)</div>
        <div className="pay-amount-value" style={{ color: enough ? '#059669' : '#6D28D9' }}>KES {pbal.toLocaleString()}</div>
        <div className="pay-amount-sub">Premium fee: KES 480{enough ? ' • fully covered!' : ` • short by KES ${topup}`}</div>
      </div>

      {step === 'info' && (
        <>
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
          {enough ? (
            <button className="pay-btn" style={{ marginTop: 18, background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }} onClick={() => { setError(''); setStep('password'); }}>
              ⭐ Use my premium balance (KES 480)
            </button>
          ) : (
            <button className="pay-btn" style={{ marginTop: 18 }} onClick={() => { setError(''); setStep('topup'); }}>
              💳 Add KES {topup} & Upgrade
            </button>
          )}
          <button className="pay-btn" style={{ marginTop: 10, background: '#F5F3FF', color: '#6D28D9' }} onClick={() => router.push('/skills-test')}>
            🧠 Earn more in the Skills Test first
          </button>
        </>
      )}

      {step === 'password' && (
        <>
          <div className="pay-message" style={{ marginBottom: 16 }}>
            Enter your account password to confirm upgrading to premium using your <strong>premium balance</strong> (KES 480 will be deducted).
          </div>
          <div className="pay-phone-label">Password</div>
          <input
            className="pay-phone-input"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password"
            onKeyDown={e => { if (e.key === 'Enter') payWithBalance(); }}
            style={{ borderColor: error ? '#ef4444' : undefined }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <button className="pay-btn" style={{ marginTop: 18, background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }} onClick={payWithBalance} disabled={loading}>
            {loading ? <><span className="spinner" /> Upgrading…</> : '🔒 Confirm & Upgrade'}
          </button>
          <div className="pay-secure">🔐 KES 480 will be deducted from your premium balance</div>
        </>
      )}

      {step === 'topup' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF', marginBottom: 16 }}>
            Your premium balance is <strong>KES {pbal}</strong>, but premium costs <strong>KES 480</strong>. Add <strong style={{ color: '#1D4ED8' }}>KES {topup}</strong> via Paystack to unlock premium.
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }}
            placeholder="+254 7XX XXX XXX"
            style={{ borderColor: error ? '#ef4444' : undefined }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <button className="pay-btn" style={{ marginTop: 18 }} onClick={payTopup} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : `🔒 Add KES ${topup} via Paystack`}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
        </>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>⭐</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#125C37', marginBottom: 6 }}>Premium Activated!</div>
          <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4', textAlign: 'left', marginTop: 12 }}>
            You’re now a premium member and can submit tasks. Remaining premium balance: <strong>KES {Number(doneUser?.premiumBalance || 0).toLocaleString()}</strong>.
          </div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #125C37, #1A7A4A)', marginTop: 18 }} onClick={() => router.push('/dashboard')}>🚀 Continue</button>
        </div>
      )}
    </FlowShell>
  );
}
