import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { activateUser, getCurrentUser } from '../lib/auth';

const ACTIVATION_AMOUNT_KOBO = 5000; // KSh 50

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    async function verifyPayment() {
      const reference = router.query.reference;
      if (!reference) return;

      try {
        const res  = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();

        const verified = data.status && data.data.status === 'success';

        if (!verified) {
          alert('Payment verification failed');
          router.replace('/dashboard');
          return;
        }

        const amountPaid = data.data.amount; // in kobo

        if (amountPaid === ACTIVATION_AMOUNT_KOBO) {
          // ── KSh 50 verified: activate the account ──
          const user = getCurrentUser();
          if (user) {
            activateUser(user.id, amountPaid / 100);
          }
          alert('Payment successful. Account activated.');
        } else {
          // Other verified payments (premium, training, withdrawal fee, etc.)
          // are handled by their respective flows — don't touch activation status.
          alert('Payment successful.');
        }

        router.replace('/dashboard');
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
