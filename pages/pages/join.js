// pages/join.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Join() {
  const router = useRouter();

  useEffect(() => {
    const { ref } = router.query;

    if (ref) {
      localStorage.setItem('referrerId', ref);
    }

    router.replace('/register');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      Redirecting...
    </div>
  );
}