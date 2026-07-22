// pages/register.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { registerUser, setCurrentUser, getBoundEmail, bindBrowser } from '../lib/auth';
import { isEmail, isPhone } from '../lib/validate';
import Icon from '../components/Icon';

const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria', 'Ghana',
  'South Africa', 'Zambia', 'Zimbabwe', 'Egypt', 'Morocco', 'Senegal',
  'Ivory Coast', 'Cameroon', 'Mozambique', 'Angola', 'Madagascar', 'Jamaica',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'UAE', 'India', 'China', 'Japan',
];

const CV_MAX_MB  = 5;
const CV_ACCEPT  = '.pdf,.doc,.docx,.rtf,.txt';

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrerId, setReferrerId] = useState(null);
  const [cv, setCv] = useState(null);
  const [deviceUsed, setDeviceUsed] = useState(false);

  // One account per browser
  useEffect(() => {
    if (getBoundEmail()) setDeviceUsed(true);
  }, []);

  function onPickCv(e) {
    const f = e.target.files?.[0];
    setError('');
    if (!f) { setCv(null); return; }
    if (f.size > CV_MAX_MB * 1024 * 1024) { setError(`CV is too large. Maximum ${CV_MAX_MB} MB.`); setCv(null); e.target.value = ''; return; }
    setCv(f);
  }

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
    if (!form.fullName.trim())              return 'Full name is required.';
    if (!isEmail(form.email))               return 'Valid email is required.';
    if (!isPhone(form.phone))               return 'Enter a valid phone number.';
    if (!form.country)                      return 'Please select a country.';
    if (form.password.length < 8)           return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.agreedToTerms)                return 'You must agree to the Terms and Conditions.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // One account per browser
    if (getBoundEmail()) {
      setError('This browser already has an account. Only one account is allowed per browser.');
      setDeviceUsed(true);
      return;
    }

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    const email = form.email.trim().toLowerCase();
    const result = await registerUser({
      fullName:     form.fullName.trim(),
      email,
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

    // Optional: email the applicant's CV to the admin (never blocks sign-up)
    if (cv) {
      try {
        const fd = new FormData();
        fd.append('cv', cv);
        fd.append('fullName', form.fullName.trim());
        fd.append('email', email);
        fd.append('phone', form.phone.trim());
        fd.append('country', form.country);
        await fetch('/api/apply-cv', { method: 'POST', body: fd });
      } catch (_) { /* ignore, CV is optional */ }
    }

    bindBrowser(email);
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
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              color: '#1f2937',
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

        {deviceUsed && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
            This browser already has a Business Hub account. Only one account is allowed per browser.{' '}
            <Link href="/login" style={{ color: '#4b5563', textDecoration: 'underline' }}>Log in instead →</Link>
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
              placeholder="Write your username"
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
                placeholder="+254 712 345 678"
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
                required
              >
                <option value="" disabled>
                  Select your country
                </option>
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
              CV / Résumé <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
            </label>
            <label
              htmlFor="cv-file"
              style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                border: `1.5px dashed ${cv ? '#374151' : '#CBD5E1'}`, borderRadius: 10,
                padding: '12px 14px', background: cv ? '#f9fafb' : '#F9FAFB',
              }}
            >
              <span style={{ color: '#111827', display: 'flex' }}><Icon name={cv ? 'file' : 'upload'} size={20} /></span>
              <span style={{ fontSize: 13, color: cv ? '#1f2937' : '#6B7280', wordBreak: 'break-all' }}>
                {cv ? `${cv.name} • tap to change` : `Attach your CV (PDF or Word, max ${CV_MAX_MB} MB)`}
              </span>
            </label>
            <input id="cv-file" type="file" accept={CV_ACCEPT} onChange={onPickCv} style={{ display: 'none' }} />
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
            disabled={loading || deviceUsed}
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