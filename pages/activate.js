// pages/activate.js, full-page account activation (replaces the pop-up)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { activateWithBalance, getCurrentUser, setCurrentUser } from '../lib/auth';
import FlowShell from '../components/FlowShell';
import Icon from '../components/Icon';
import MpesaPay from '../components/MpesaPay';
import TillPay from '../components/TillPay';
import { FlowSkeleton } from '../components/Skeleton';
import { fetchTill } from '../lib/settings';
import { useMpesaEnabled } from '../lib/useMpesaEnabled';

const FEE = 50;

export default function ActivatePage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [step,     setStep]     = useState(null);   // set once user loads
  const [phone,    setPhone]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [doneUser, setDoneUser] = useState(null);
  const [till,     setTill]     = useState('1545320');
  const mpesa = useMpesaEnabled();

  useEffect(() => { fetchTill().then(setTill); }, []);

  const balance = Number(user?.balance || 0);
  const enough  = balance >= FEE;
  const topup   = Math.max(0, FEE - balance);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.activated) { router.replace('/dashboard'); return; }
    setPhone(user.phone || '');
    setStep(enough ? 'confirm' : 'topup');
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Called after a successful STK payment: refresh the user (the server already
  // activated the account in the callback) and show the success screen.
  async function onMpesaPaid() {
    const u = await getCurrentUser().catch(() => null);
    if (u) { setCurrentUser(u); setDoneUser(u); }
    setStep('success');
  }

  async function activateDirectly() {
    setError('');
    setLoading(true);
    try {
      const updated = await activateWithBalance(user.id);
      if (updated) {
        setDoneUser(updated);
        setStep('success');
      } else {
        setError('Activation failed. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !user || !step) {
    return <FlowSkeleton rows={2} />;
  }

  return (
    <FlowShell title="Activate Your Account" subtitle="KES 50 one-time activation • unlocks bidding" icon="unlock">
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
          {error && <div style={{ color: '#4b5563', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pay-btn" style={{ flex: 1, background: '#E5E7EB', color: '#374151' }} onClick={() => router.push('/dashboard')} disabled={loading}>Cancel</button>
            <button className="pay-btn" style={{ flex: 2 }} onClick={activateDirectly} disabled={loading}>
              {loading ? <><span className="spinner" /> Activating…</> : <><Icon name="check" size={16} /> Yes, activate</>}
            </button>
          </div>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <Icon name="lock" size={13} /> KES 50 will be deducted from your balance
          </div>
        </>
      )}

      {step === 'topup' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', marginBottom: 18 }}>
            Your balance is <strong>KES {balance}</strong>, but activation costs <strong>KES 50</strong>. Pay <strong style={{ color: '#1f2937' }}>KES {topup}</strong> to activate your account.
          </div>

          {mpesa ? (
            <MpesaPay
              purpose="activation_topup"
              amount={topup}
              defaultPhone={phone}
              payLabel={`Pay KES ${topup} via M-Pesa`}
              onSuccess={onMpesaPaid}
            />
          ) : (
            <TillPay
              user={user}
              amount={topup}
              purpose="Account Activation"
              till={till}
              onPaid={() => setStep('submitted')}
              onCancel={() => router.push('/dashboard')}
            />
          )}
        </>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="check" size={52} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#374151', marginBottom: 6 }}>
            Account Activated!
          </div>
          <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb', textAlign: 'left', marginTop: 12 }}>
            Your account is now active. KES 50 has been applied as your activation fee, you can now bid on tasks. Your remaining balance is <strong>KES {Number(doneUser?.balance || 0).toLocaleString()}</strong>.
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginTop: 20 }} onClick={() => router.push('/dashboard')}>
            Start Bidding
          </button>
        </div>
      )}

      {step === 'submitted' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="check" size={52} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#374151', marginBottom: 6 }}>
            Payment Notified
          </div>
          <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb', textAlign: 'left', marginTop: 12 }}>
            We&apos;ve received your notification. Once we confirm your <strong>KES {topup}</strong> payment to till <strong>{till}</strong>, your account will be activated, usually within a short while.
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginTop: 20 }} onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      )}
    </FlowShell>
  );
}
