// pages/reset-password.js — set a new password from an emailed reset link.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const token = typeof router.query.token === 'string' ? router.query.token : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!token) { setError('This reset link is invalid or has expired. Please request a new one.'); return; }

    setLoading(true);
    try {
      const r = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'resetPassword', token, newPassword: password }),
      });
      const data = await r.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => router.push('/login'), 2500);
      } else {
        setError(data.error || 'Could not reset your password. Please try again.');
      }
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
          <div className="auth-logo">GWENO HUB</div>
        </Link>
        <p className="auth-tagline">Work. Earn. Grow.</p>
        <h1 className="auth-title">Set a new password</h1>

        {done ? (
          <>
            <p className="auth-subtitle">Your password has been updated. Redirecting you to login…</p>
            <Link href="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}>
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Choose a new password for your account.</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirm New Password</label>
                <input
                  id="confirm"
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span className="spinner" /> Updating...
                  </span>
                ) : (
                  'Update password'
                )}
              </button>
            </form>
            <div className="auth-link" style={{ marginTop: 20 }}>
              <Link href="/forgot-password">Request a new link →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
