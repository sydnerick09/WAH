// pages/register.js
import { useState } from 'react';
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

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function validate() {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Valid email is required.';
    if (!form.phone.trim() || !/^(07|01|\+2547|\+2541)\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      return 'Enter a valid Kenyan phone number (e.g. 0712345678).';
    }
    if (!form.country) return 'Please select a country.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.agreedToTerms) return 'You must agree to the Terms and Conditions.';
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setTimeout(() => {
      const result = registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: form.country,
        password: form.password,
      });
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }
      setCurrentUser(result.user);
      router.push('/dashboard');
    }, 800);
  }

  return (
    <div className="auth-page">
      <div className="auth-grid-bg" />
      <div className="auth-card">
        <Link href="/" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          <div className="auth-logo">BUSINESS HUB</div>
        </Link>
        <p className="auth-tagline">Work. Earn. Grow.</p>
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-subtitle">Join thousands of earners on Business Hub</p>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Kenyan Phone Number</label>
              <input
                id="phone"
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
              <label className="form-label" htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                className="form-select"
                value={form.country}
                onChange={handleChange}
                required
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Terms */}
          <div className="terms-box">
            <strong>Terms and Conditions</strong>
            <br /><br />
            By creating an account on Online Business Hub, you agree to the following:
            <br /><br />
            1. <strong>Eligibility:</strong> You must be 18 years or older to use this platform.
            <br />
            2. <strong>Account Activation:</strong> A one-time activation fee of KES 50 is required to access and bid on tasks.
            <br />
            3. <strong>Task Completion:</strong> You agree to complete any task you bid on and win in good faith.
            <br />
            4. <strong>Payments:</strong> All payments are processed via M-Pesa through Paystack. Business Hub is not responsible for M-Pesa network failures.
            <br />
            5. <strong>Prohibited Activities:</strong> Spamming, fraud, plagiarism, and misrepresentation are grounds for immediate account termination.
            <br />
            6. <strong>Privacy:</strong> Your personal data will never be sold to third parties.
            <br />
            7. <strong>Disputes:</strong> Any disputes shall be resolved through Business Hub&apos;s internal arbitration process.
            <br /><br />
            By checking the box below, you confirm that you have read, understood, and agreed to these terms.
          </div>

          <div className="form-group">
            <label className="terms-check">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={form.agreedToTerms}
                onChange={handleChange}
              />
              I agree to the Terms and Conditions and Privacy Policy
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span className="spinner" /> Creating account...
              </span>
            ) : (
              '🚀 Create Account'
            )}
          </button>
        </form>

        <div className="auth-link">
          Already have an account?{' '}
          <Link href="/login">Login here →</Link>
        </div>
      </div>
    </div>
  );
}
