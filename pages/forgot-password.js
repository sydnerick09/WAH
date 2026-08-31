// pages/forgot-password.js — request a password-reset email.
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isEmail } from '../lib/validate';

const RESEND_SECONDS = 60;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);   // seconds until "Resend" re-enables

  // Tick the resend countdown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendReset() {
    setError('');
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'requestPasswordReset', email: email.trim().toLowerCase() }),
      });
      // Always show success — we never reveal whether the account exists.
      setSent(true);
      setCooldown(RESEND_SECONDS);
      return true;
    } catch {
      setError('Network error. Please try again.');
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isEmail(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    await sendReset();
    setLoading(false);
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setLoading(true);
    await sendReset();
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-grid-bg" />
      <div className="auth-card">
        <Link href="/" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          <div className="auth-logo">GWENO HUB</div>
        </Link>
        <p className="auth-tagline">Work. Earn. Grow.</p>
        <h1 className="auth-title">Reset your password</h1>

        {sent ? (
          <>
            <p className="auth-subtitle">
              If an account exists for <strong>{email.trim().toLowerCase()}</strong>, we&apos;ve sent a password-reset
              link to that email. It expires in 30 minutes.
            </p>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '12px 16px', borderRadius: 10, margin: '18px 0', fontSize: 13.5, lineHeight: 1.6 }}>
              Check your inbox (and spam folder). Didn&apos;t get it? You can resend once the timer ends.
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button
              type="button"
              className="auth-btn"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              style={cooldown > 0 ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
            >
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="spinner" /> Sending...</span>
                : cooldown > 0
                  ? `Resend Email in 0:${String(cooldown).padStart(2, '0')}`
                  : 'Resend Email'}
            </button>
            <Link href="/login" className="auth-link" style={{ display: 'block', textAlign: 'center', marginTop: 18 }}>
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Enter your account email and we&apos;ll send you a link to set a new password.</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span className="spinner" /> Sending...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
            <div className="auth-link" style={{ marginTop: 20 }}>
              Remembered it? <Link href="/login">Back to Login →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
