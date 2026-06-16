// pages/register.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { registerUser, setCurrentUser } from '../lib/auth';

const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria', 'Ghana',
  'South Africa', 'Zambia', 'Zimbabwe', 'Egypt', 'Morocco', 'Senegal',
  'Ivory Coast', 'Cameroon', 'Mozambique', 'Angola', 'Madagascar',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'UAE', 'India', 'China', 'Japan',
];

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Kenya',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrerId, setReferrerId] = useState(null);

  // Load referral ID
  useEffect(() => {
    // from localStorage
    const savedReferrer = localStorage.getItem('referrerId');

    // from URL
    const urlReferrer = router.query.ref;

    if (urlReferrer) {
      localStorage.setItem('referrerId', urlReferrer);
      setReferrerId(urlReferrer);
    } else if (savedReferrer) {
      setReferrerId(savedReferrer);
    }
  }, [router.query]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function validate() {
    if (!form.fullName.trim()) {
      return 'Full name is required.';
    }

    if (
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      return 'Valid email is required.';
    }

    if (
      !form.phone.trim() ||
      !/^(07|01|\+2547|\+2541)\d{8}$/.test(
        form.phone.replace(/\s/g, '')
      )
    ) {
      return 'Enter a valid Kenyan phone number.';
    }

    if (!form.country) {
      return 'Please select a country.';
    }

    if (form.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match.';
    }

    if (!form.agreedToTerms) {
      return 'You must agree to the Terms and Conditions.';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    const result = await registerUser({
      fullName:     form.fullName.trim(),
      email:        form.email.trim().toLowerCase(),
      phone:        form.phone.trim(),
      country:      form.country,
      password:     form.password,
      activated:    false,
      premium:      false,
      balance:      0,
      referralCount: 0,
      referredBy:   referrerId || null,
    });

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    localStorage.removeItem('referrerId');
    setCurrentUser(result.user);
    router.push('/dashboard');
  }

  return (
    <div className="auth-page">
      <div className="auth-grid-bg" />

      <div className="auth-card">

        <Link
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          <div className="auth-logo">
            BUSINESS HUB
          </div>
        </Link>

        <p className="auth-tagline">
          Work. Earn. Grow.
        </p>

        <h1 className="auth-title">
          Create Your Account
        </h1>

        <p className="auth-subtitle">
          Join thousands of earners on Business Hub
        </p>

        {/* Referral Notice */}
        {referrerId && (
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1D4ED8',
              padding: '12px 16px',
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            You were invited by a Business Hub member.
          </div>
        )}

        {error && (
          <div className="error-msg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">

          <div className="form-group">
            <label className="form-label">
              Full Name
            </label>

            <input
              name="fullName"
              type="text"
              className="form-input"
              placeholder="e.g. James Mwangi"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>

            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="you@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">

            <div className="form-group">
              <label className="form-label">
                Phone Number
              </label>

              <input
                name="phone"
                type="tel"
                className="form-input"
                placeholder="0712 345 678"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Country
              </label>

              <select
                name="country"
                className="form-select"
                value={form.country}
                onChange={handleChange}
              >
                {COUNTRIES.map(country => (
                  <option
                    key={country}
                    value={country}
                  >
                    {country}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>

            <input
              name="password"
              type="password"
              className="form-input"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Confirm Password
            </label>

            <input
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Terms */}
          <div className="terms-box">
            <strong>Terms and Conditions</strong>

            <br /><br />

            By creating an account on Business Hub,
            you agree to the platform terms and policies.
          </div>

          <div className="form-group">
            <label className="terms-check">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={form.agreedToTerms}
                onChange={handleChange}
              />

              I agree to the Terms and Conditions
            </label>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <span className="spinner" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

        </form>

        <div className="auth-link">
          Already have an account?{' '}
          <Link href="/login">
            Login here →
          </Link>
        </div>

      </div>
    </div>
  );
}