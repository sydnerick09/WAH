// pages/payment-success.js
// Receives Paystack callback, verifies payment, then redirects based on plan.

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { activateUser, activateWithBalance, upgradeToPremium, getCurrentUser } from '../lib/auth';

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    async function verify() {
      const { reference, plan } = router.query;

      if (!reference) {
        router.replace('/dashboard');
        return;
      }

      let verifyData;
      try {
        const res  = await fetch(`/api/paystack/verify?reference=${reference}`);
        verifyData = await res.json();
      } catch {
        alert('Verification error. Please contact support.');
        router.replace('/dashboard');
        return;
      }

      const verified =
        verifyData.status && verifyData.data?.status === 'success';

      if (!verified) {
        alert('Payment verification failed. Please try again or contact support.');
        router.replace('/dashboard');
        return;
      }

      const user = await getCurrentUser();

      if (plan === 'premium') {
        if (user) await upgradeToPremium(user.id);
        alert('Premium upgrade successful! You can now submit tasks via email.');
        router.replace('/dashboard');

      } else if (plan === 'training') {
        alert('Training registration successful! We will contact you with course details.');
        router.replace('/dashboard');

      } else if (plan === 'activation_topup') {
        // User topped up the shortfall; consume remaining balance + activate
        if (user) await activateWithBalance(user.id);
        alert('Payment successful! Your account is now activated.');
        router.replace('/dashboard');

      } else if (plan === 'premium_topup') {
        // Legacy plan — treat as a normal premium upgrade
        if (user) await upgradeToPremium(user.id);
        alert('Payment successful! Premium is now active. You can submit tasks.');
        router.replace('/dashboard');

      } else if (plan === 'withdrawal_fee') {
        router.replace(`/dashboard?plan=withdrawal_fee&reference=${encodeURIComponent(reference)}`);

      } else if (plan === 'mpesa_withdrawal_fee') {
        // Fee paid — open the M-Pesa withdrawal form on the withdraw page
        router.replace('/withdraw?method=mpesa&step=form');

      } else {
        // Default: account activation (KES 50)
        const amountKES = Math.round(verifyData.data.amount / 100);
        if (user) await activateUser(user.id, amountKES);
        alert('Payment successful! Your account is now activated.');
        router.replace('/dashboard');
      }
    }

    verify();
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '4px solid #E2E8F0', borderTopColor: '#059669',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748B', fontSize: 15 }}>Verifying your payment…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
