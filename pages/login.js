// pages/login.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loginUser } from '../lib/auth';

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

    // Multiple accounts are allowed on the same device/browser — no device binding.
    setLoading(true);
    const result = await loginUser({ email, password: form.password });
    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="auth-page auth-page--top">
      <header className="auth-header">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="auth-brand">GWENO HUB</div>
        </Link>
      </header>

      <div className="auth-card">
        <div className="auth-lead">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to access your tasks and earnings.</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="Enter your email address"
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--gray)', textDecoration: 'underline' }}>
              Forgot password?
            </Link>
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
      </div>
    </div>
  );
}


