// lib/useMpesaEnabled.js — client hook: true once Daraja STK is configured.
// Lets each payment flow pick STK Push when M-Pesa is live, and fall back to the
// manual till (TillPay) until the keys are set. Defaults to false (safe: manual).
import { useState, useEffect } from 'react';

export function useMpesaEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/mpesa/config')
      .then(r => r.json())
      .then(d => { if (alive) setEnabled(!!d.stk); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return enabled;
}


