import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { activateUser, getCurrentUser } from '../lib/auth';

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    async function verifyPayment() {
      const reference = router.query.reference;

      if (!reference) return;

      try {
        const res = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();

        if (data.status && data.data.status === 'success') {
          const user = getCurrentUser();

          if (user) {
            activateUser(
              user.id,
              data.data.amount / 100
            );
          }

          alert('Payment successful. Account activated.');

          router.replace('/dashboard');
        } else {
          alert('Payment verification failed');
        }
      } catch (err) {
        console.error(err);
        alert('Something went wrong');
      }
    }

    verifyPayment();
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      Verifying payment...
    </div>
  );
}