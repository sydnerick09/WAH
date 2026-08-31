// pages/premium.js — full-page premium upgrade (KES 480 / month via M-Pesa Buy Goods till)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { getCurrentUser, setCurrentUser } from '../lib/auth';
import FlowShell from '../components/FlowShell';
import Icon from '../components/Icon';
import MpesaPay from '../components/MpesaPay';
import TillPay from '../components/TillPay';
import { FlowSkeleton } from '../components/Skeleton';
import { fetchTill } from '../lib/settings';
import { useMpesaEnabled } from '../lib/useMpesaEnabled';

const PREMIUM_FEE = 480;

export default function PremiumPage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [done, setDone] = useState(false);
  const [till, setTill] = useState('1545320');
  const mpesa = useMpesaEnabled();

  useEffect(() => { fetchTill().then(setTill); }, []);

  // STK success: the callback already set premium server-side; refresh + confirm.
  async function onMpesaPaid() {
    const u = await getCurrentUser().catch(() => null);
    if (u) setCurrentUser(u);
    setDone(true);
  }

  if (!ready || !user) {
    return <FlowSkeleton rows={2} />;
  }

  if (done) {
    return (
      <FlowShell title="Premium" subtitle="Payment submitted" icon="star">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: 'var(--mpesa-green)' }}><Icon name="check" size={52} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Thank You!</div>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', textAlign: 'left', marginTop: 12 }}>
            {mpesa
              ? <>Your <strong>KES {PREMIUM_FEE}</strong> payment was received and your <strong>Premium</strong> is now active. You can start submitting tasks right away.</>
              : <>We&apos;ve received your notification. Once we confirm your <strong>KES {PREMIUM_FEE}</strong> payment to till <strong>{till}</strong>, your <strong>Premium</strong> will be activated, usually within a short while.</>}
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginTop: 18 }} onClick={() => router.push('/dashboard')}>
            <Icon name="arrowLeft" size={16} /> Back to Dashboard
          </button>
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Premium" subtitle="KES 480 / month • required to submit tasks" icon="star">
      <div className="premium-features" style={{ marginBottom: 20 }}>
        {[
          ['upload', 'Unlimited task bidding'],
          ['cash',   'Priority payouts & withdrawals'],
          ['chart',  'Advanced earnings dashboard'],
          ['star',   'Exclusive high-paying tasks'],
          ['shield', 'Premium badge on your profile'],
          ['phone',  'Dedicated support line'],
        ].map(([icon, text]) => (
          <div key={text} className="premium-feature-item"><span style={{ display: 'flex' }}><Icon name={icon} size={18} /></span><span>{text}</span></div>
        ))}
      </div>

      {mpesa ? (
        <MpesaPay
          purpose="premium"
          amount={PREMIUM_FEE}
          defaultPhone={user.phone || ''}
          payLabel={`Pay KES ${PREMIUM_FEE} via M-Pesa`}
          onSuccess={onMpesaPaid}
        />
      ) : (
        <TillPay
          user={user}
          amount={PREMIUM_FEE}
          purpose="Premium Membership"
          till={till}
          onPaid={() => setDone(true)}
          onCancel={() => router.push('/dashboard')}
        />
      )}
    </FlowShell>
  );
}


