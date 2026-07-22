// pages/login.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loginUser, getBoundEmail, bindBrowser } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    const email = form.email.trim().toLowerCase();

    // One account per browser, this browser is bound to a single account
    const bound = getBoundEmail();
    if (bound && bound !== email) {
      setError('This browser is already linked to a different account. Only one account can be used per browser.');
      return;
    }

    setLoading(true);
    const result = await loginUser({ email, password: form.password });
    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }
    bindBrowser(email);   // bind this browser to the account on first sign-in
    router.push('/dashboard');
  }

  return (
    <div className="auth-page">
      <div className="auth-grid-bg" />
      <div className="auth-card">
        <Link href="/" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          <div className="auth-logo">BUSINESS HUB</div>
        </Link>
        <p className="auth-tagline">Work. Earn. Grow.</p>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to access your tasks and earnings</p>

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
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span className="spinner" /> Logging in...
              </span>
            ) : (
              'Login to Dashboard'
            )}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop: 20 }}>
          Don&apos;t have an account?{' '}
          <Link href="/register">Create one for free →</Link>
        </div>

        <div style={{ marginTop: 32, padding: '16px', background: 'var(--blue-pale)', borderRadius: 8, fontSize: 13, color: 'var(--gray)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--blue)' }}>New to Business Hub?</strong>
          <br />
          Join now for free. A one-time activation fee of KES 50 gives you full access to all tasks and bidding features.
        </div>
      </div>
    </div>
  );
}
