// pages/unsubscribe.js, token-protected email opt-out landing page.
// Reached from the {UNSUBSCRIBE_LINK} in account emails.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Icon from '../components/Icon';

export default function Unsubscribe() {
  const router = useRouter();
  const [state, setState] = useState('idle');   // idle | confirming | done | error
  const [message, setMessage] = useState('');

  const { uid, token } = router.query;

  useEffect(() => { if (router.isReady) setState('confirming'); }, [router.isReady]);

  async function confirm() {
    setState('working');
    try {
      const r = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'unsubscribeUser', uid, token }),
      });
      const data = await r.json();
      if (data.success) { setState('done'); }
      else { setState('error'); setMessage(data.error || 'This unsubscribe link is invalid or has expired.'); }
    } catch {
      setState('error'); setMessage('Network error. Please try again.');
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={logo}>GWENO</div>
        {state === 'done' ? (
          <>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="check" size={44} /></div>
            <h1 style={title}>You’ve been unsubscribed</h1>
            <p style={text}>
              You will no longer receive account-related emails, including OTPs and important account notifications.
            </p>
            <p style={{ ...text, color: '#4b5563' }}>
              Note: this permanently stops all OTP and account-related email communications. If this was a mistake,
              please contact support to re-enable your emails.
            </p>
          </>
        ) : state === 'error' ? (
          <>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="warning" size={44} /></div>
            <h1 style={title}>Unable to unsubscribe</h1>
            <p style={text}>{message}</p>
          </>
        ) : (
          <>
            <h1 style={title}>Unsubscribe from emails?</h1>
            <p style={text}>
              You’re about to stop <strong>all account-related emails</strong>, including OTPs and important account
              notifications. This action is permanent.
            </p>
            <button style={btn} disabled={state === 'working' || !uid || !token} onClick={confirm}>
              {state === 'working' ? 'Processing…' : 'Yes, unsubscribe me'}
            </button>
            <button style={btnGhost} onClick={() => router.push('/')}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

const wrap  = { minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, Arial, sans-serif', padding: 20 };
const card  = { background: '#fff', borderRadius: 16, padding: '36px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: 440, textAlign: 'center' };
const logo  = { fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#111827', letterSpacing: 1, marginBottom: 18 };
const title = { fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 10px' };
const text  = { fontSize: 14.5, color: '#475569', lineHeight: 1.6, margin: '0 0 14px' };
const btn   = { display: 'block', width: '100%', padding: '12px', background: '#374151', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 10 };
const btnGhost = { display: 'block', width: '100%', padding: '11px', background: 'transparent', color: '#475569', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1.5px solid #E2E8F0', cursor: 'pointer' };
