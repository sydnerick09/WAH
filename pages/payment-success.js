import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaymentSuccess() {

  const router = useRouter();

  useEffect(() => {

    setTimeout(() => {

      router.push('/dashboard');

    }, 3000);

  }, [router]);

  return (

    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >

      <h1>✅ Payment Successful</h1>

      <p>
        Your account has been activated.
      </p>

    </div>

  );
}