// pages/forgot-password.js — request a password-reset email.
import { useState } from 'react';
import Link from 'next/link';
import { isEmail } from '../lib/validate';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isEmail(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'requestPasswordReset', email: email.trim().toLowerCase() }),
      });
      // Always show success — we never reveal whether the account exists.
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-grid-bg" />
      <div className="auth-card">
        <Link href="/" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          <div className="auth-logo">BUSINESS HUB</div>
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
              Check your inbox (and spam folder). Didn&apos;t get it? Wait a minute, then try again.
            </div>
            <Link href="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
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
