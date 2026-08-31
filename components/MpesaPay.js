// components/MpesaPay.js — reusable Lipa na M-PESA (STK Push) payment widget.
// Collects the phone number, triggers the STK prompt, then polls for the result.
// The amount for fixed-price purposes is enforced server-side.
import { useState, useRef, useEffect } from 'react';
import { getToken } from '../lib/auth';
import Icon from './Icon';

const PHONE_RE = /^(?:\+?254|0)?(7|1)\d{8}$/;
const POLL_MS = 3000;
const MAX_POLLS = 24; // ~72s

export default function MpesaPay({ purpose, amount, defaultPhone = '', payLabel, onSuccess, onError }) {
  const [phone, setPhone] = useState(defaultPhone);
  const [state, setState] = useState('idle');   // idle | pushing | waiting | success | failed
  const [msg, setMsg]     = useState('');
  const pollRef  = useRef(null);
  const doneRef  = useRef(false);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function stop() { clearInterval(pollRef.current); pollRef.current = null; }

  async function pay() {
    if (state === 'pushing' || state === 'waiting') return;
    const p = phone.trim();
    if (!PHONE_RE.test(p.replace(/[\s\-()]/g, ''))) { setMsg('Enter a valid Safaricom number (07XX… or 2547XX…).'); return; }
    setMsg(''); setState('pushing'); doneRef.current = false;
    try {
      const r = await fetch('/api/mpesa/stk-push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: getToken(), purpose, amount, phone: p }),
      });
      const d = await r.json();
      if (!d.success) { setState('failed'); setMsg(d.message || 'Could not start the M-Pesa prompt.'); onError?.(d.message); return; }
      setState('waiting');
      setMsg('An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.');
      poll(d.checkoutRequestId);
    } catch {
      setState('failed'); setMsg('Network error. Please try again.');
    }
  }

  function poll(id) {
    let tries = 0;
    stop();
    pollRef.current = setInterval(async () => {
      tries += 1;
      try {
        const r = await fetch('/api/mpesa/stk-status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken: getToken(), checkoutRequestId: id }),
        });
        const d = await r.json();
        if (d.status === 'success') { doneRef.current = true; stop(); setState('success'); setMsg('Payment received. Thank you!'); onSuccess?.({ ...d, checkoutRequestId: id }); return; }
        if (d.status === 'failed')  { doneRef.current = true; stop(); setState('failed'); setMsg('The payment was cancelled or failed. Please try again.'); onError?.('failed'); return; }
      } catch { /* keep polling */ }
      if (tries >= MAX_POLLS && !doneRef.current) {
        stop(); setState('failed');
        setMsg('We didn’t receive a confirmation in time. If you were charged, it will reflect shortly, please refresh.');
      }
    }, POLL_MS);
  }

  const busy = state === 'pushing' || state === 'waiting';

  if (state === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#111827', marginBottom: 8 }}><Icon name="check" size={44} /></div>
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
        onChange={e => { setPhone(e.target.value); if (state === 'failed') { setState('idle'); setMsg(''); } }}
        placeholder="07XX XXX XXX"
        inputMode="tel"
        disabled={busy}
      />
      {msg && (
        <div style={{ fontSize: 13, marginTop: 8, color: state === 'failed' ? '#4b5563' : '#374151', lineHeight: 1.5 }}>{msg}</div>
      )}
      <button className="pay-btn" style={{ marginTop: 16, opacity: busy ? 0.75 : 1 }} onClick={pay} disabled={busy}>
        {busy
          ? <><span className="spinner" /> {state === 'pushing' ? 'Sending prompt…' : 'Waiting for M-Pesa…'}</>
          : <><Icon name="lock" size={16} /> {payLabel || `Pay KES ${Number(amount || 0).toLocaleString()} via M-Pesa`}</>}
      </button>
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        <Icon name="lock" size={13} /> Secured by Safaricom M-Pesa (Lipa na M-Pesa)
      </div>
    </div>
  );
}


