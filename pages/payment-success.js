// pages/payment-success.js
// Paystack callback landing. Verifies the transaction SERVER-SIDE, then routes
// the withdrawal-fee flows back to their form with the verified reference. The
// withdrawal itself is still gated server-side (createWithdrawal) against the
// verified, single-use ledger row — this page never marks anything paid on its own.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentSuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState('Verifying your payment…');

  useEffect(() => {
    if (!router.isReady) return;
    (async () => {
      const reference = router.query.reference || router.query.trxref;
      const plan   = String(router.query.plan || '');
      const method = String(router.query.method || 'mpesa');

      if (!reference) { router.replace('/withdraw'); return; }

      let verified = false;
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        verified = !!(data.status && data.data?.status === 'success');
      } catch { verified = false; }

      if (!verified) {
        setMsg('Payment could not be verified. Redirecting…');
        setTimeout(() => router.replace(`/withdraw?method=${encodeURIComponent(method)}&payfail=1`), 1500);
        return;
      }

      // Verified withdrawal-fee payment → unlock the matching withdrawal form.
      if (/withdraw/i.test(plan)) {
        router.replace(`/withdraw?method=${encodeURIComponent(method)}&step=form&psref=${encodeURIComponent(reference)}`);
      } else {
        setMsg('Payment verified. Redirecting…');
        setTimeout(() => router.replace('/dashboard'), 1200);
      }
    })();
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--white-off, #F8FAFC)', fontFamily: 'sans-serif' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#111827', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 15 }}>{msg}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


