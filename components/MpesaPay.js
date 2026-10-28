// components/MpesaPay.js — reusable Lipa na M-PESA (STK Push) payment widget.
// Collects the phone number, triggers the STK prompt, then polls for the result.
// The amount for fixed-price purposes is enforced server-side.
import { useState, useRef, useEffect } from 'react';
import { getToken } from '../lib/auth';
import Icon from './Icon';

const PHONE_RE = /^(?:\+?254|0)?(7|1)\d{8}$/;
const POLL_MS = 3000;
const MAX_POLLS = 24; // ~72s

export default function MpesaPay({ purpose, amount, withdrawalMethod, withdrawalAmount, defaultPhone = '', payLabel, onSuccess, onError }) {
  const [phone, setPhone] = useState(defaultPhone);
  const [state, setState] = useState('idle'); // idle | pushing | waiting | pending | success | failed
  const [msg, setMsg] = useState('');
  const pollRef = useRef(null);
  const doneRef = useRef(false);
  const activeCheckoutIdRef = useRef('');
  const recoveryCheckedRef = useRef(false);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // If Safaricom already confirmed a previously charged withdrawal fee, reuse it
  // automatically. The admin verification icon is not required for normal payments.
  useEffect(() => {
    if (purpose !== 'withdrawal_fee' || recoveryCheckedRef.current) return;
    recoveryCheckedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const authToken = getToken();
        if (!authToken) return;
        const response = await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'getAvailableVerifiedWithdrawalFee', authToken }),
        });
        const result = await response.json().catch(() => ({}));
        const fee = result?.fee;
        if (cancelled || !result?.success || !fee?.checkoutRequestId) return;
        // Only reuse a fee matching this flow's required fee; do not consume a
        // fee paid for a different withdrawal option or amount.
        if (!fee.manuallyVerified && Number(fee.amount) !== Math.round(Number(amount) || 0)) return;
        doneRef.current = true;
        setState('success');
        setMsg('Your previous withdrawal-fee payment is confirmed. No further payment is required.');
        onSuccess?.({ success: true, status: 'success', checkoutRequestId: fee.checkoutRequestId, recovered: true });
      } catch (_) { /* Normal payment remains available if recovery lookup fails. */ }
    })();
    return () => { cancelled = true; };
  }, [purpose, amount, onSuccess]);

  function stop() {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }

  async function readJson(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (_) {
      return { success: false, message: 'The payment service returned an invalid response.' };
    }
  }

  async function pay() {
    if (state === 'pushing' || state === 'waiting') return;
    // If the confirmation timed out after a possible charge, check the same
    // transaction again instead of starting a second STK payment.
    if (state === 'pending' && activeCheckoutIdRef.current) {
      poll(activeCheckoutIdRef.current);
      return;
    }

    const p = phone.trim();
    if (!PHONE_RE.test(p.replace(/[\s\-()]/g, ''))) {
      setMsg('Enter a valid Safaricom number (07XX… or 2547XX…).');
      return;
    }

    setMsg('');
    setState('pushing');
    doneRef.current = false;

    try {
      const authToken = getToken();
      const r = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, purpose, amount, withdrawalMethod, withdrawalAmount, phone: p }),
      });
      const d = await readJson(r);

      if ((!r.ok || !d.success) && d.paymentMayBePending && d.checkoutRequestId) {
        activeCheckoutIdRef.current = d.checkoutRequestId;
        setState('pending');
        setMsg(d.message || 'The M-Pesa prompt may have been sent. Do not pay again while we check the status.');
        return;
      }

      if (!r.ok || !d.success) {
        setState('failed');
        setMsg(d.message || 'Could not start the M-Pesa prompt.');
        onError?.(d.message || 'Could not start the M-Pesa prompt.');
        return;
      }

      if (!d.checkoutRequestId) {
        setState('failed');
        setMsg('The M-Pesa prompt could not be started because no payment reference was returned.');
        onError?.('Missing checkout request ID.');
        return;
      }

      activeCheckoutIdRef.current = d.checkoutRequestId;
      setState('waiting');
      setMsg('An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.');
      poll(d.checkoutRequestId);
    } catch (_) {
      setState('failed');
      setMsg('Network error. Please try again.');
      onError?.('Network error. Please try again.');
    }
  }

  function poll(id) {
    let tries = 0;
    stop();

    pollRef.current = setInterval(async () => {
      tries += 1;

      try {
        const authToken = getToken();
        const r = await fetch('/api/mpesa/stk-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken, checkoutRequestId: id }),
        });
        const d = await readJson(r);

        if (d.status === 'success' || d.success === true) {
          doneRef.current = true;
          stop();
          setState('success');
          setMsg('Payment received. Thank you!');
          onSuccess?.({ ...d, checkoutRequestId: id });
          return;
        }

        if (d.status === 'failed' || d.status === 'cancelled') {
          doneRef.current = true;
          stop();
          setState('failed');
          setMsg('The payment was cancelled or failed. Please try again.');
          onError?.(d.message || 'failed');
          return;
        }
      } catch (_) {
        // Keep polling while the M-Pesa confirmation is pending.
      }

      if (tries >= MAX_POLLS && !doneRef.current) {
        stop();
        // A timeout is not proof of payment failure. Keep the checkout ID and
        // let the client check again; never encourage a duplicate payment here.
        setState('pending');
        setMsg('M-Pesa has not confirmed this payment yet. If you entered your PIN or were charged, do not pay again. Check the same payment status below in a moment.');
      }
    }, POLL_MS);
  }

  const busy = state === 'pushing' || state === 'waiting';

  if (state === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#111827', marginBottom: 8 }}>
          <Icon name="check" size={44} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>Payment received</div>
        <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 4 }}>{msg}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="pay-phone-label">M-Pesa Phone Number</div>
      <input
        className="pay-phone-input"
        value={phone}
        onChange={e => {
          setPhone(e.target.value);
          if (state === 'failed') {
            setState('idle');
            setMsg('');
          }
        }}
        placeholder="07XX XXX XXX"
        inputMode="tel"
        disabled={busy || state === 'pending'}
      />
      {msg && (
        <div style={{ fontSize: 13, marginTop: 8, color: state === 'failed' ? '#4b5563' : '#374151', lineHeight: 1.5 }}>
          {msg}
        </div>
      )}
      <button className="pay-btn" style={{ marginTop: 16, opacity: busy ? 0.75 : 1 }} onClick={pay} disabled={busy}>
        {busy
          ? <><span className="spinner" /> {state === 'pushing' ? 'Sending prompt…' : 'Waiting for M-Pesa…'}</>
          : state === 'pending'
            ? <>Check payment status again</>
            : <><Icon name="lock" size={16} /> {payLabel || `Pay KES ${Number(amount || 0).toLocaleString()} via M-Pesa`}</>}
      </button>
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        <Icon name="lock" size={13} /> Secured by Safaricom M-Pesa (Lipa na M-Pesa)
      </div>
    </div>
  );
}
