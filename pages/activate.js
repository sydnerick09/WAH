// pages/activate.js, full-page account activation (replaces the pop-up)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { activateWithBalance } from '../lib/auth';
import FlowShell from '../components/FlowShell';

const FEE = 50;

export default function ActivatePage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [step,     setStep]     = useState(null);   // set once user loads
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [doneUser, setDoneUser] = useState(null);

  const balance = Number(user?.balance || 0);
  const enough  = balance >= FEE;
  const topup   = Math.max(0, FEE - balance);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.activated) { router.replace('/dashboard'); return; }
    setPhone(user.phone || '');
    setStep(enough ? 'confirm' : 'topup');
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitPassword() {
    if (!password) { setError('Please enter your password.'); return; }
    if (password !== user.password) { setError('Incorrect password. Please try again.'); return; }
    setError('');
    setLoading(true);
    const updated = await activateWithBalance(user.id);
    setLoading(false);
    if (updated) { setDoneUser(updated); setStep('success'); }
    else setError('Activation failed. Please try again.');
  }

  async function payTopup() {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: topup, phone, plan: 'activation_topup' }),
      });
      const data = await res.json();
      if (data.status) { window.location.href = data.data.authorization_url; return; }
      setError('Payment could not be started. Please try again.');
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  if (!ready || !user || !step) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
    </div>;
  }

  return (
    <FlowShell title="Activate Your Account" subtitle="KES 50 one-time activation • unlocks bidding" icon="🔓">
      <div className="pay-amount" style={{ marginBottom: 18 }}>
        <div className="pay-amount-label">Your Balance</div>
        <div className="pay-amount-value" style={{ color: enough ? '#374151' : '#111827' }}>KES {balance.toLocaleString()}</div>
        <div className="pay-amount-sub">Activation fee: KES 50{enough ? ' • fully covered by your balance' : ` • short by KES ${topup}`}</div>
      </div>

      {step === 'confirm' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 18 }}>
            Are you sure you want to use your balance to activate your account? <strong>KES 50</strong> will be deducted from your balance as the activation fee.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pay-btn" style={{ flex: 1, background: '#E5E7EB', color: '#374151' }} onClick={() => router.push('/dashboard')}>Cancel</button>
            <button className="pay-btn" style={{ flex: 2 }} onClick={() => { setError(''); setStep('password'); }}>✅ Yes, activate</button>
          </div>
        </>
      )}

      {step === 'password' && (
        <>
          <div className="pay-message" style={{ marginBottom: 16 }}>
            For your security, enter your account password to confirm activation using your balance.
          </div>
          <div className="pay-phone-label">Password</div>
          <input
            className="pay-phone-input"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password"
            onKeyDown={e => { if (e.key === 'Enter') submitPassword(); }}
            style={{ borderColor: error ? '#4b5563' : undefined }}
          />
          {error && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <button className="pay-btn" style={{ marginTop: 18 }} onClick={submitPassword} disabled={loading}>
            {loading ? <><span className="spinner" /> Activating…</> : '🔒 Confirm & Activate'}
          </button>
          <div className="pay-secure">🔐 KES 50 will be deducted from your balance</div>
        </>
      )}

      {step === 'topup' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', marginBottom: 18 }}>
            Your balance is <strong>KES {balance}</strong>, but activation costs <strong>KES 50</strong>. Add <strong style={{ color: '#1f2937' }}>KES {topup}</strong> via Paystack to activate your account.
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }}
            placeholder="+254 7XX XXX XXX"
            style={{ borderColor: error ? '#4b5563' : undefined }}
          />
          {error && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <button className="pay-btn" style={{ marginTop: 18 }} onClick={payTopup} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : `🔒 Add KES ${topup} via Paystack`}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
        </>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#374151', marginBottom: 6 }}>
            Account Activated!
          </div>
          <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb', textAlign: 'left', marginTop: 12 }}>
            Your account is now active. KES 50 has been applied as your activation fee, you can now bid on tasks. Your remaining balance is <strong>KES {Number(doneUser?.balance || 0).toLocaleString()}</strong>.
          </div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #374151, #374151)', marginTop: 20 }} onClick={() => router.push('/dashboard')}>
            🚀 Start Bidding
          </button>
        </div>
      )}
    </FlowShell>
  );
}
