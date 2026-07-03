// pages/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// Business Hub Dashboard
// M-Pesa Withdrawal flow:
//   1. User clicks "Withdraw with M-Pesa" → pays KES 5 (simulated locally)
//   2. Fee confirmed → Withdrawal Details Form (phone + ID number only)
//   3. Submit form → "Payment will be initiated in 2 minutes" screen
//   4. 1:32 countdown expires → "Wrong credentials" failure
//   5. User dismisses → cycle resets (fee required again to retry)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, awardQuizBonus } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrGenerateWithdrawals() {
  const LS_KEY = 'bh_live_withdrawals_v5';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const kenyaSrc   = { flag: '🇰🇪', country: 'Kenya',   prefixes: ['+25471','+25472','+25473','+25474','+25475','+25476','+25477','+25478','+25479','+25470'] };
  const jamaicaSrc = { flag: '🇯🇲', country: 'Jamaica', prefixes: ['+1876','+1658'] };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const mask = p => `${p}*****${String(rand(10, 99))}`;

  // 70 payouts today: 63 Kenyan (KES 2,100–9,300) + 7 Jamaican (KES 2,100–7,200)
  const records = [
    ...Array.from({ length: 63 }, () => {
      const prefix = kenyaSrc.prefixes[rand(0, kenyaSrc.prefixes.length - 1)];
      return { flag: kenyaSrc.flag, country: kenyaSrc.country, phone: mask(prefix), amount: rand(2100, 9300) };
    }),
    ...Array.from({ length: 7 }, () => {
      const prefix = jamaicaSrc.prefixes[rand(0, jamaicaSrc.prefixes.length - 1)];
      return { flag: jamaicaSrc.flag, country: jamaicaSrc.country, phone: mask(prefix), amount: rand(2100, 7200) };
    }),
  ];

  // Shuffle so Kenyan/other are mixed
  for (let i = records.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [records[i], records[j]] = [records[j], records[i]];
  }

  try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch (_) {}
  return records;
}

// Pending payouts — currently being processed (shown in the Pending tab)
function getOrGeneratePending() {
  const LS_KEY = 'bh_pending_withdrawals_v1';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const people = [
    { flag: '🇰🇪', country: 'Kenya',    name: 'Brian K.'   }, { flag: '🇰🇪', country: 'Kenya',    name: 'Mercy A.'  },
    { flag: '🇰🇪', country: 'Kenya',    name: 'Dennis O.'  }, { flag: '🇰🇪', country: 'Kenya',    name: 'Faith W.'  },
    { flag: '🇰🇪', country: 'Kenya',    name: 'Kevin M.'   }, { flag: '🇳🇬', country: 'Nigeria',  name: 'Chidi E.'  },
    { flag: '🇯🇲', country: 'Jamaica',  name: 'Andre C.'   }, { flag: '🇬🇭', country: 'Ghana',    name: 'Kwame A.'  },
    { flag: '🇺🇬', country: 'Uganda',   name: 'Sarah N.'   }, { flag: '🇰🇪', country: 'Kenya',    name: 'Purity W.' },
  ];

  const records = people.map(p => ({
    ...p,
    amount:    rand(2100, 8600),
    etaMin:    rand(1, 9),
    progress:  rand(20, 85),
  }));

  try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch (_) {}
  return records;
}

// Member reviews — includes the two client-supplied testimonials verbatim.
const REVIEWS = [
  { name: 'James Otieno',      country: 'Nairobi, Kenya',    flag: '🇰🇪', rating: 4,
    text: 'I tried withdrawing once, but it failed, but I tried twice, then it went through.' },
  { name: 'Wanjiku Maina',     country: 'Nakuru, Kenya',     flag: '🇰🇪', rating: 5,
    text: 'Guys, you need to have correct details before you withdraw so that you avoid the inconveniences of paying the withdrawal fee twice or thrice.' },
  { name: 'Grace Achieng',     country: 'Kisumu, Kenya',     flag: '🇰🇪', rating: 5,
    text: 'The M-Pesa payout hit my phone in under two minutes. Double-checking my number first made it smooth. Business Hub is legit.' },
  { name: 'Chinedu Okafor',    country: 'Lagos, Nigeria',    flag: '🇳🇬', rating: 5,
    text: 'I was skeptical at first, but after my very first successful withdrawal I upgraded to premium. Worth every naira.' },
  { name: 'Ama Mensah',        country: 'Accra, Ghana',      flag: '🇬🇭', rating: 4,
    text: 'Accuracy is everything here — confirm your account details and the payment goes through the first time, no repeat fees.' },
  { name: 'Andre Campbell',    country: 'Kingston, Jamaica', flag: '🇯🇲', rating: 5,
    text: 'From Kingston with love. Once my bank details were correct, the transfer came through clean. Professional platform.' },
  { name: 'Sarah Nakato',      country: 'Kampala, Uganda',   flag: '🇺🇬', rating: 5,
    text: 'Consistent tasks and honest payouts. I now earn a steady side income every single week.' },
  { name: 'Brian Kiptoo',      country: 'Eldoret, Kenya',    flag: '🇰🇪', rating: 4,
    text: 'Support helped me fix a failed withdrawal within minutes. Enter the right details and you will have zero problems.' },
];

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function formatMmSs(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── M-Pesa Withdrawal: Step 1 — Pay $5 USD via Paystack ─────────────────────
function MpesaFeeModal({ user, onClose }) {
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    if (!phone.trim()) { alert('Enter your M-Pesa number'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    user.email,
          amount:   650,
          phone,
          plan:     'mpesa_withdrawal_fee',
        }),
      });
      const data = await res.json();
      if (data.status) {
        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment could not be initiated. Please try again.');
        setLoading(false);
      }
    } catch (_) {
      alert('Network error. Please check your connection.');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)' }}>
          <div>
            <div className="pay-modal-title">📲 Withdraw with M-Pesa</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Small processing fee required</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {!loading ? (
            <>
              <div className="pay-message" style={{ borderColor: '#007A3D', background: '#F0FFF4' }}>
                A one-time <strong>processing fee of $5 USD</strong> is required to access the M-Pesa withdrawal form. The amount will be converted to KES automatically.
              </div>
              <div className="pay-amount">
                <div className="pay-amount-label">M-Pesa Processing Fee</div>
                <div className="pay-amount-value" style={{ color: '#007A3D' }}>$5 USD</div>
                <div className="pay-amount-sub">Converted to KES automatically • Unlocks withdrawal form</div>
              </div>
              <div className="pay-phone-label">M-Pesa Number</div>
              <input
                className="pay-phone-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />
              <button
                className="pay-btn"
                style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)' }}
                onClick={handlePay}
                disabled={loading}
              >
                🔒 Pay $5 USD via Paystack
              </button>
              <div className="pay-secure">🔐 Secured by Paystack • USD → KES conversion included</div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderTopColor: '#007A3D', borderColor: 'var(--gray-light)', borderWidth: 3, margin: '0 auto 20px' }} />
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Redirecting to Paystack...</p>
              <p style={{ fontSize: 13, color: 'var(--gray)' }}>Complete the $5 USD payment to unlock your withdrawal form.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── M-Pesa Withdrawal: Step 2 — Credentials Form ────────────────────────────
function MpesaFormModal({ onClose, onSubmit }) {
  const [phone,    setPhone]    = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [errors,   setErrors]   = useState({});

  function handleSubmit() {
    const errs = {};
    if (!phone.trim())    errs.phone    = 'Phone number is required';
    if (!idNumber.trim()) errs.idNumber = 'National ID number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)' }}>
          <div>
            <div className="pay-modal-title">📲 Withdrawal Details</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Enter your M-Pesa number and National ID</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#007A3D', background: '#F0FFF4', marginBottom: 20 }}>
            Enter your details accurately. Your National ID must match your M-Pesa registration.
          </div>
          <div className="pay-phone-label">M-Pesa Phone Number</div>
          <input
            className="pay-phone-input"
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
            placeholder="+254 7XX XXX XXX"
            style={{ borderColor: errors.phone ? '#ef4444' : undefined }}
          />
          {errors.phone && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>National ID Number</div>
          <input
            className="pay-phone-input"
            type="text"
            value={idNumber}
            onChange={e => { setIdNumber(e.target.value); setErrors(prev => ({ ...prev, idNumber: undefined })); }}
            placeholder="e.g. 12345678"
            style={{ borderColor: errors.idNumber ? '#ef4444' : undefined }}
          />
          {errors.idNumber && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.idNumber}</div>}
          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginTop: 20 }}
            onClick={handleSubmit}
          >
            💸 Submit Withdrawal Request
          </button>
          <div className="pay-secure">🔐 Your details are encrypted and secure</div>
        </div>
      </div>
    </div>
  );
}

// ─── M-Pesa Withdrawal: Step 3 — 1:32 Countdown ──────────────────────────────
function MpesaPendingModal({ onClose, onExpired }) {
  const DURATION_MS = 92 * 1000; // 1 minute 32 seconds
  const deadlineRef = useRef(Date.now() + DURATION_MS);
  const [remaining, setRemaining] = useState(DURATION_MS);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        setTimeout(() => onExpired(), 800);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onExpired]);

  const pct = Math.min(100, Math.max(0, (remaining / DURATION_MS) * 100));
  const isLow = remaining < 30 * 1000;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)' }}>
          <div>
            <div className="pay-modal-title">⏳ Initiating Payment</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Your request is being processed</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>

        <div className="pay-modal-body" style={{ padding: '28px 28px 24px' }}>
          <div style={{ background: '#F0FFF4', border: '1.5px solid #6EE7B7', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📲</span>
            <p style={{ margin: 0, fontSize: 14, color: '#065F46', lineHeight: 1.65 }}>
              Your M-Pesa payment will be <strong>initiated in 2 minutes</strong>. Please keep this screen open and ensure your phone is on.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8 }}>
              Time Remaining
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: 4,
              color: isLow ? '#ef4444' : '#007A3D',
              background: '#F0FFF4',
              borderRadius: 14,
              padding: '14px 24px',
              display: 'inline-block',
              border: `2px solid ${isLow ? '#FECACA' : '#6EE7B7'}`,
              minWidth: 160,
              transition: 'color 0.3s, border-color 0.3s',
            }}>
              {formatMmSs(remaining)}
            </div>
            <div style={{ marginTop: 14, height: 7, background: '#D1FAE5', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: isLow ? 'linear-gradient(90deg, #ef4444, #DC2626)' : 'linear-gradient(90deg, #007A3D, #00A651)',
                borderRadius: 99,
                transition: 'width 1s linear, background 0.3s',
              }} />
            </div>
          </div>

          <div className="withdraw-detail-card" style={{ background: '#F0FFF4', borderColor: '#6EE7B7', marginBottom: 20 }}>
            <div>
              <div className="withdraw-detail-label">Status</div>
              <div className="withdraw-detail-value pending" style={{ color: '#007A3D' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00A651', display: 'inline-block', marginRight: 6, animation: 'pulse 1.5s infinite' }} />
                Payment Pending
              </div>
            </div>
            <div className="withdraw-detail-icon">📲</div>
          </div>

          <button className="withdraw-close-btn" onClick={onClose}>Close</button>
          <div className="withdraw-footer-note">
            Do not close the app. Keep your M-Pesa line active and await the STK push.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── M-Pesa Withdrawal: Step 4 — Wrong Credentials ───────────────────────────
function MpesaFailedModal({ onClose, onReset }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}>
          <div>
            <div className="pay-modal-title">❌ Payment Declined</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Verification unsuccessful</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>

        <div className="pay-modal-body" style={{ padding: '28px 28px 24px' }}>
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 22,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#991B1B' }}>
                Wrong Credentials
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#7F1D1D', lineHeight: 1.65 }}>
                The phone number or ID number you provided could not be verified. Please ensure your details are correct and try again.
              </p>
            </div>
          </div>

          <div className="withdraw-detail-card" style={{ background: '#FEF2F2', borderColor: '#FECACA', marginBottom: 20 }}>
            <div>
              <div className="withdraw-detail-label">Status</div>
              <div className="withdraw-detail-value" style={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', display: 'inline-block', flexShrink: 0 }} />
                Declined
              </div>
            </div>
            <div className="withdraw-detail-icon">❌</div>
          </div>

          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg, #007A3D, #00A651)', marginBottom: 12 }}
            onClick={onReset}
          >
            🔄 Try Again
          </button>
          <button className="withdraw-close-btn" onClick={onClose}>Dismiss</button>
          <div className="withdraw-footer-note" style={{ color: '#DC2626' }}>
            Please ensure your phone number and National ID match your M-Pesa registration.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── M-Pesa Withdrawal Controller ────────────────────────────────────────────
function MpesaWithdrawModal({ user, onClose, initialStep = 'fee' }) {
  const [step, setStep] = useState(initialStep);

  const handleReset = useCallback(() => setStep('fee'), []);

  if (step === 'fee') {
    return <MpesaFeeModal user={user} onClose={onClose} />;
  }
  if (step === 'form') {
    return <MpesaFormModal onClose={onClose} onSubmit={() => setStep('pending')} />;
  }
  if (step === 'pending') {
    return <MpesaPendingModal onClose={onClose} onExpired={() => setStep('failed')} />;
  }
  return <MpesaFailedModal onClose={onClose} onReset={handleReset} />;
}

// ─── International Withdrawal (Other Countries) — Worldwide Bank Directory ─────
// Each country defines the icon (flag), a sample account-number placeholder, and
// a validator. The account-number field shows the selected bank's placeholder,
// and the Submit button only appears when the typed number matches that format.
const COUNTRY_META = {
  // IBAN countries — account numbers start with the 2-letter country code
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
  // Numeric-account countries
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
  KE: ['Equity Bank', 'KCB Bank', 'Co-operative Bank', 'Absa Bank Kenya'],
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

// ─── International Withdrawal (Other Countries) — Account Number Form ─────────
function OtherCountryFormModal({ onClose }) {
  const [accountName,   setAccountName]   = useState('');
  const [selectedBank,  setSelectedBank]  = useState(null);
  const [bankOpen,      setBankOpen]      = useState(false);
  const [bankQuery,     setBankQuery]     = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errors,        setErrors]        = useState({});

  const SUPPORT_EMAIL = 'businesshub.comke@gmail.com';

  const q = bankQuery.trim().toLowerCase();
  const filteredBanks = q
    ? WORLD_BANKS.filter(b => b.name.toLowerCase().includes(q) || b.country.toLowerCase().includes(q))
    : WORLD_BANKS;

  const cleanedAcct = accountNumber.replace(/[\s-]/g, '');
  const acctValid   = !!selectedBank && selectedBank.re.test(cleanedAcct);
  const formValid   = accountName.trim().length > 0 && !!selectedBank && acctValid;

  function selectBank(b) {
    setSelectedBank(b);
    setBankOpen(false);
    setBankQuery('');
    setAccountNumber('');
    setErrors(prev => ({ ...prev, bank: undefined, accountNumber: undefined }));
  }

  function handleSubmit() {
    if (!formValid) return;
    const subject = 'Withdrawal Request — Other Countries';
    const body =
      `Hello Business Hub,\n\nI would like to request a withdrawal to my bank account.\n\n` +
      `Account Holder Name: ${accountName.trim()}\n` +
      `Bank: ${selectedBank.name} (${selectedBank.country})\n` +
      `Account Number: ${accountNumber.trim()}\n\n` +
      `Thank you.`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}>
          <div>
            <div className="pay-modal-title">🌍 Withdraw from Other Countries</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Enter your bank account details</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#1D4ED8', background: '#EFF6FF', marginBottom: 20 }}>
            For withdrawals outside Kenya, enter your name, choose your bank, and type your account number in the format shown. When you submit, your email app will open with these details ready to send to our payments team at businesshub.comke@gmail.com.
          </div>

          {/* 1 — Account holder name */}
          <div className="pay-phone-label">Account Holder Name</div>
          <input
            className="pay-phone-input"
            type="text"
            value={accountName}
            onChange={e => { setAccountName(e.target.value); setErrors(prev => ({ ...prev, accountName: undefined })); }}
            placeholder="e.g. John Brown"
            style={{ borderColor: errors.accountName ? '#ef4444' : undefined }}
          />
          {errors.accountName && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.accountName}</div>}

          {/* 2 — Searchable bank selector with icons */}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>Bank</div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="pay-phone-input"
              onClick={() => setBankOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer', background: '#fff',
                borderColor: errors.bank ? '#ef4444' : undefined,
              }}
            >
              {selectedBank ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{selectedBank.flag}</span>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedBank.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>· {selectedBank.country}</span>
                </span>
              ) : (
                <span style={{ color: '#9ca3af' }}>Select your bank</span>
              )}
              <span style={{ color: '#9ca3af', fontSize: 12 }}>{bankOpen ? '▲' : '▼'}</span>
            </button>

            {bankOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <input
                    autoFocus
                    value={bankQuery}
                    onChange={e => setBankQuery(e.target.value)}
                    placeholder="Search banks worldwide…"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {filteredBanks.length === 0 && (
                    <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No banks found</div>
                  )}
                  {filteredBanks.map(b => {
                    const active = selectedBank && selectedBank.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => selectBank(b)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                          padding: '10px 12px', border: 'none', cursor: 'pointer',
                          background: active ? '#EFF6FF' : '#fff',
                        }}
                      >
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

          {/* 3 — Account number with bank-specific placeholder */}
          <div className="pay-phone-label" style={{ marginTop: 16 }}>Account Number</div>
          <input
            className="pay-phone-input"
            type="text"
            value={accountNumber}
            onChange={e => { setAccountNumber(e.target.value); setErrors(prev => ({ ...prev, accountNumber: undefined })); }}
            placeholder={selectedBank ? selectedBank.ph : 'Select a bank first'}
            disabled={!selectedBank}
            style={{
              borderColor: accountNumber && !acctValid ? '#ef4444' : undefined,
              background: selectedBank ? '#fff' : '#f3f4f6',
              cursor: selectedBank ? 'text' : 'not-allowed',
            }}
          />
          {selectedBank && (
            <div style={{ fontSize: 12, marginTop: 4, color: accountNumber && !acctValid ? '#ef4444' : '#9ca3af' }}>
              {accountNumber && !acctValid
                ? `Doesn't match ${selectedBank.name}. It should look like: ${selectedBank.ph}`
                : `Format for ${selectedBank.name}: ${selectedBank.ph}`}
            </div>
          )}

          {/* Submit only appears once everything matches */}
          {formValid ? (
            <button
              className="pay-btn"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', marginTop: 20 }}
              onClick={handleSubmit}
            >
              💸 Submit Withdrawal Request
            </button>
          ) : (
            <div style={{
              marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af',
              padding: '12px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #e5e7eb',
            }}>
              {!accountName.trim()
                ? 'Enter your name to continue'
                : !selectedBank
                ? 'Select your bank to continue'
                : 'Enter a valid account number to reveal Submit'}
            </div>
          )}
          <div className="pay-secure">🔐 Your account details are encrypted and secure</div>
        </div>
      </div>
    </div>
  );
}

// ─── International Withdrawal Controller ──────────────────────────────────────
function OtherCountryWithdrawModal({ onClose }) {
  return <OtherCountryFormModal onClose={onClose} />;
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────
// Send a task submission via the automated email endpoint. Falls back to opening
// the user's email app if server-side email isn't configured yet — so it always
// works, and upgrades to fully-automated (with client auto-reply) once SMTP is set.
async function sendTaskSubmission(user, task) {
  const details =
    `Task: ${task.title}\n` +
    `Category: ${task.category}\n` +
    `Payment: KES ${task.payment.toLocaleString()}\n` +
    `Submitted by: ${user?.fullName || ''} (${user?.email || ''})`;
  try {
    const res  = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Task Submission', name: user?.fullName || '', email: user?.email || '',
        phone: user?.phone || '', subject: `Task Submission: ${task.title}`, details,
      }),
    });
    const data = await res.json();
    if (data && data.success) return true;   // emailed automatically
  } catch (_) {}
  const subject = encodeURIComponent('Task Submission: ' + task.title);
  const body    = encodeURIComponent(
    `Hello Business Hub,\n\nI am submitting my completed task for review.\n\n${details}\n\n[Add your work here]\n\nThank you,\n${user?.fullName || ''}`
  );
  window.location.href = `mailto:businesshub.comke@gmail.com?subject=${subject}&body=${body}`;
  return false;                              // opened email app instead
}

function TaskModal({ task, user, onClose, onBidClick, onUpgradeClick }) {
  if (!task) return null;
  const isActivated = user?.activated;
  const isPremium   = user?.premium;

  async function handleSubmit() {
    if (!isPremium) { onClose(); onUpgradeClick(); return; }
    const emailed = await sendTaskSubmission(user, task);
    if (emailed) alert('✅ Submitted! A confirmation email has been sent to you, and our team has been notified.');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{task.title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-meta">
            {[
              ['Posted By',   `👤 ${task.poster}`],
              ['Location',    `📍 ${task.location}`],
              ['Date Posted', `📅 ${task.datePosted}`],
              ['Category',    `🏷️ ${task.category}`],
            ].map(([label, value]) => (
              <div key={label} className="modal-meta-item">
                <div className="modal-meta-label">{label}</div>
                <div className="modal-meta-value">{value}</div>
              </div>
            ))}
          </div>
          <div className="modal-payment">
            <div>
              <div className="modal-payment-label">Task Payment</div>
              <div style={{ fontSize: 13, color: 'var(--green)', opacity: 0.7, marginTop: 2 }}>Paid on approval</div>
            </div>
            <div className="modal-payment-amount">KES {task.payment.toLocaleString()}</div>
          </div>
          <p className="modal-desc">{task.description}</p>
          {task.questions?.length > 0 && (
            <div className="modal-questions">
              <h4>Questions from Poster</h4>
              {task.questions.map((q, i) => (
                <div key={i} className="modal-question-item">{q}</div>
              ))}
            </div>
          )}
          {!isActivated && (
            <button className="bid-btn" onClick={() => onBidClick(task)}>💼 Bid on This Task</button>
          )}
          {isActivated && !isPremium && (
            <button className="submit-btn" onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }}>⭐ Upgrade to Premium to Submit</button>
          )}
          {isActivated && isPremium && (
            <button className="submit-btn" onClick={handleSubmit}>📤 Submit This Task</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Joining-Gift Quiz ────────────────────────────────────────────────────────
// Five general-knowledge questions. KES 10 per correct answer (max KES 50).
// The user is never told whether an answer was right — they just move on, and
// the total earned is revealed on the final screen.
const QUIZ_QUESTIONS = [
  { q: 'Rearrange these words into a correct sentence: “client / the / satisfied / was / very”',
    options: ['Very the client was satisfied', 'The client was very satisfied', 'Satisfied the client was very', 'Was the client very satisfied'],
    answer: 'The client was very satisfied' },
  { q: 'A freelancer earns KES 1,500 per task and finishes 4 tasks. After a 10% platform fee, how much do they keep?',
    options: ['KES 6,000', 'KES 5,850', 'KES 5,400', 'KES 5,000'],
    answer: 'KES 5,400' },
  { q: 'What number comes next in the pattern:  3, 6, 11, 18, 27, __ ?',
    options: ['35', '36', '38', '40'],
    answer: '38' },
  { q: 'Which sentence is written correctly?',
    options: ["She don't have no experience.", 'She doesn’t have any experience.', 'She not have experience.', 'She haven’t any experience.'],
    answer: 'She doesn’t have any experience.' },
  { q: 'If every designer can use a computer, and John is a designer, then John…',
    options: ['cannot use a computer', 'can use a computer', 'is not a designer', 'only uses a phone'],
    answer: 'can use a computer' },
];

function QuizModal({ user, onComplete }) {
  const [step,     setStep]     = useState(0);       // 0..4 questions, then 'result'
  const [answers,  setAnswers]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [result,   setResult]   = useState(null);    // { correct, earned }
  const [doneUser, setDoneUser] = useState(null);

  const total   = QUIZ_QUESTIONS.length;
  const current = QUIZ_QUESTIONS[step];
  const isLast  = step === total - 1;

  async function handleNext() {
    if (selected == null) return;                    // must pick something
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);

    if (!isLast) { setStep(step + 1); return; }

    // Grade — we generated the questions, so we know the answers
    let correct = 0;
    QUIZ_QUESTIONS.forEach((qq, i) => { if (next[i] === qq.answer) correct += 1; });
    const earned = correct * 10;

    setSaving(true);
    const updated = await awardQuizBonus(user.id, correct);
    setSaving(false);
    setDoneUser(updated || user);
    setResult({ correct, earned });
    setStep('result');
  }

  const isResult = step === 'result';

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }}>
          <div>
            <div className="pay-modal-title">🎁 Your KES 50 Joining Gift</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {isResult ? 'Quiz complete' : `Answer 5 quick questions • Question ${step + 1} of ${total}`}
            </div>
          </div>
        </div>

        <div className="pay-modal-body">
          {!isResult && (
            <>
              <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4', marginBottom: 18 }}>
                Answer these <strong>5 quick questions</strong> (maths, reasoning &amp; writing). Each correct answer earns you <strong style={{ color: '#059669' }}>KES 10</strong> — get all 5 and your <strong>KES 50</strong> activation is covered!
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 4, background: '#E5E7EB', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: '#059669', transition: 'width 0.3s' }} />
              </div>

              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 14 }}>
                {current.q}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {current.options.map(opt => {
                  const active = selected === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelected(opt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        padding: '13px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 15,
                        border: `2px solid ${active ? '#059669' : '#E5E7EB'}`,
                        background: active ? '#F0FFF4' : '#fff',
                        color: '#111827', fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${active ? '#059669' : '#CBD5E1'}`,
                        background: active ? '#059669' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12,
                      }}>{active ? '✓' : ''}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <button
                className="pay-btn"
                style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)', marginTop: 22, opacity: selected == null ? 0.5 : 1 }}
                onClick={handleNext}
                disabled={selected == null || saving}
              >
                {saving ? <><span className="spinner" /> Saving…</> : isLast ? '🎉 Finish & Claim Reward' : 'Next Question →'}
              </button>
            </>
          )}

          {isResult && result && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{result.earned === 50 ? '🎉' : result.earned > 0 ? '🎊' : '📝'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#059669', marginBottom: 4 }}>
                KES {result.earned}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6 }}>
                You answered <strong>{result.correct} of {total}</strong> correctly.
              </div>
              <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4', textAlign: 'left', marginTop: 16 }}>
                {result.earned === 50
                  ? 'Perfect score! Your full KES 50 joining gift has been added to your balance — it fully covers your account activation. 🎁'
                  : result.earned > 0
                  ? `KES ${result.earned} has been added to your balance. When you activate, you can top up the remaining KES ${50 - result.earned} to reach the KES 50 activation fee.`
                  : 'No reward earned this time. You will need to pay the KES 50 activation fee when you choose to start bidding on tasks.'}
              </div>
              <button
                className="pay-btn"
                style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)', marginTop: 20 }}
                onClick={() => onComplete(doneUser)}
              >
                Continue to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Training Payment Modal ───────────────────────────────────────────────────
function TrainingModal({ user, onClose }) {
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleTrainingPay() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    const res  = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 132, phone, plan: 'training' }),
    });
    const data = await res.json();
    if (data.status) {
      window.location.href = data.data.authorization_url;
    } else {
      alert('Payment initiation failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }}>
          <div>
            <div className="pay-modal-title">🎓 TRAINING</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Apply for professional training</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="premium-features">
            {[
              ['📚', 'Access to all training materials'],
              ['🎯', 'Hands-on practical assignments'],
              ['🏆', 'Certificate of completion'],
              ['👨‍🏫', 'Expert instructor support'],
              ['💼', 'Job placement assistance'],
              ['♾️', 'Lifetime access to course content'],
            ].map(([icon, text]) => (
              <div key={text} className="premium-feature-item">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Training Registration Fee</div>
            <div className="pay-amount-value">KES 132</div>
            <div className="pay-amount-sub">One-time payment • Instant access</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }} onClick={handleTrainingPay} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing...</> : '🎓 Pay & Apply Now'}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Modal ───────────────────────────────────────────────────────────
function ReferralModal({ user, onClose }) {
  const [copied, setCopied] = useState(false);

  const referralLink = user?.activated
    ? `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`
    : 'Activate your account to unlock referral link';

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }}>
          <div>
            <div className="pay-modal-title">🔗 Your Referral Link</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Earn KES 132 per referral</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4' }}>
            Share your referral link and earn <strong style={{ color: '#059669' }}>KES 132</strong> for every friend who signs up and activates their account.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="pay-phone-label">Your unique referral link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="pay-phone-input"
                value={referralLink}
                readOnly
                style={{ fontSize: 13, flex: 1, marginBottom: 0 }}
              />
              <button
                onClick={copyLink}
                style={{ padding: '0 20px', background: copied ? '#059669' : 'var(--green)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="referral-stats">
            <div className="referral-stat">
              <div className="referral-stat-num">{user?.referralCount || 0}</div>
              <div className="referral-stat-label">Referrals</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-num">KES {((user?.referralCount || 0) * 132).toLocaleString()}</div>
              <div className="referral-stat-label">Earned</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-num">KES 132</div>
              <div className="referral-stat-label">Per Referral</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[
              { label: '📱 WhatsApp', color: '#25D366', url: `https://wa.me/?text=Join%20Business%20Hub%20and%20earn%20online!%20${encodeURIComponent(referralLink)}` },
              { label: '✉️ Email',    color: '#EA4335', url: `mailto:?subject=Join%20Business%20Hub&body=Hey!%20Join%20me%20on%20Business%20Hub.%20Use%20my%20link:%20${encodeURIComponent(referralLink)}` },
            ].map(btn => (
              <a key={btn.label} href={user?.activated ? btn.url : '#'} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: 12, background: btn.color, color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textAlign: 'center', display: 'block', opacity: user?.activated ? 1 : 0.5, pointerEvents: user?.activated ? 'auto' : 'none' }}>
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Feed — compact tabbed widget (Live / Pending / Reviews) ────────
function Stars({ n }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 12, letterSpacing: 1 }}>
      {'★'.repeat(n)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function ActivityFeed({ withdrawals, pending }) {
  const [tab,       setTab]       = useState('live');
  const [liveIdx,   setLiveIdx]   = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);

  // Rotate the 3 visible live payouts
  useEffect(() => {
    if (tab !== 'live' || !withdrawals.length) return;
    const t = setInterval(() => setLiveIdx(i => (i + 1) % withdrawals.length), 2200);
    return () => clearInterval(t);
  }, [tab, withdrawals]);

  // Rotate reviews
  useEffect(() => {
    if (tab !== 'reviews') return;
    const t = setInterval(() => setReviewIdx(i => (i + 1) % REVIEWS.length), 4500);
    return () => clearInterval(t);
  }, [tab]);

  const liveShown = withdrawals.length
    ? Array.from({ length: 3 }, (_, k) => withdrawals[(liveIdx + k) % withdrawals.length])
    : [];
  const review = REVIEWS[reviewIdx % REVIEWS.length];

  const TABS = [
    { id: 'live',    label: 'Live',    icon: '💸' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
  ];

  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #F1F5F9' };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 14, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#111827' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
          Withdrawals & Reviews
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 3, borderRadius: 10 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: 'none', cursor: 'pointer',
                borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#111827' : '#6B7280',
                boxShadow: tab === t.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live marquee (only on Live tab) */}
      {tab === 'live' && withdrawals.length > 0 && (
        <div className="ticker-strip" style={{ marginBottom: 10 }}>
          <div className="ticker-track">
            {[...withdrawals.slice(0, 20), ...withdrawals.slice(0, 20)].map((item, i) => (
              <div key={i} className="ticker-pill">
                <span className="ticker-flag">{item.flag}</span>
                <span className="ticker-phone">{item.phone}</span>
                <span className="ticker-amount">KES {item.amount.toLocaleString()}</span>
                <span className="ticker-success">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content — fixed compact height */}
      <div style={{ minHeight: 132 }}>
        {tab === 'live' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {liveShown.map((item, i) => (
              <div key={`${item.phone}-${i}`} style={row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{item.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{item.phone}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.country}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>KES {item.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>✓ Successful</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflowY: 'auto' }}>
            {pending.map((p, i) => (
              <div key={i} style={{ ...row, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 18 }}>{p.flag}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.country}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>KES {p.amount.toLocaleString()}</div>
                    <div style={{ fontSize: 10.5, color: '#D97706', fontWeight: 700 }}>⏳ Processing • ~{p.etaMin} min</div>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#FDE68A', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.progress}%`, background: 'linear-gradient(90deg,#F59E0B,#F97316)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && review && (
          <div style={{ background: '#F9FAFB', border: '1px solid #F1F5F9', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#125C37', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{review.name} <span style={{ fontWeight: 400 }}>{review.flag}</span></div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{review.country}</div>
                </div>
              </div>
              <Stars n={review.rating} />
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>“{review.text}”</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
              {REVIEWS.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === reviewIdx % REVIEWS.length ? '#125C37' : '#D1D5DB' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 11.5, color: '#9CA3AF' }}>
        <span>🔒 All payouts verified & secured</span>
        <span>
          {tab === 'pending'
            ? `${pending.length} processing now`
            : tab === 'reviews'
            ? `${REVIEWS.length} member reviews`
            : `${withdrawals.length} payouts today`}
        </span>
      </div>
    </div>
  );
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerMenu({ user, onClose, onUpgrade, onMpesaWithdraw, onOtherWithdraw, onReferral, onTraining, onPremiumTest, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard',            action: () => { onClose(); } },
    { icon: '🧠', label: 'Premium Skills Test', action: () => { onClose(); onPremiumTest(); } },
    { icon: '⭐', label: 'Upgrade to Premium',   action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks',         action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '📲', label: 'Withdraw with M-Pesa', action: () => { onClose(); onMpesaWithdraw(); } },
    { icon: '🌍', label: 'Withdraw from Other Countries', action: () => { onClose(); onOtherWithdraw(); } },
    { icon: '🎓', label: 'Apply for Training',    action: () => { onClose(); onTraining(); } },
    { icon: '🔗', label: 'My Referral Link',      action: () => { onClose(); onReferral(); } },
  ];

  return (
    <>
      <div className="hamburger-overlay" onClick={onClose} />
      <div className="hamburger-menu">
        <div className="hamburger-header">
          <div className="hamburger-user">
            <div className="dash-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
              {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>{user?.fullName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{user?.email}</div>
              <span className={`status-badge ${user?.activated ? 'status-active' : 'status-inactive'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                {user?.activated ? '✅ Active' : '⚠️ Inactive'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--white)', flexShrink: 0 }}>×</button>
        </div>
        <nav className="hamburger-nav">
          {items.map(item => (
            <button key={item.label} className="hamburger-item" onClick={item.action}>
              <span className="hamburger-item-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--gray-light)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </nav>
        <div className="hamburger-footer">
          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>Account Balance</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--green)', marginBottom: 12 }}>
            KES {(user?.balance || 0).toLocaleString()}
          </div>
          <button
            onClick={() => { onClose(); onPremiumTest(); }}
            style={{ width: '100%', textAlign: 'left', border: '1px solid #DDD6FE', background: '#F5F3FF', borderRadius: 12, padding: '10px 12px', marginBottom: 14, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#6D28D9', fontWeight: 700 }}>🧠 Premium Balance</span>
              <span style={{ fontSize: 11, color: '#6D28D9' }}>Skills Test ›</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#6D28D9', marginTop: 2 }}>
              KES {(user?.premiumBalance || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10.5, color: '#8B5CF6' }}>Use toward your KES 480 premium fee</div>
          </button>
          <button className="logout-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>
            ⏏ Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask,        setSelectedTask]        = useState(null);
  const [showMpesaWithdraw,   setShowMpesaWithdraw]   = useState(false);
  const [showOtherWithdraw,   setShowOtherWithdraw]   = useState(false);
  const [mpesaInitialStep,    setMpesaInitialStep]    = useState('fee');
  const [showReferral,        setShowReferral]        = useState(false);
  const [showMenu,            setShowMenu]            = useState(false);
  const [showTraining,        setShowTraining]        = useState(false);
  const [showQuiz,            setShowQuiz]            = useState(false);

  const [liveWithdrawals, setLiveWithdrawals] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All','Writing','Research','Data Entry','Design','Marketing',
    'Transcription','Translation','Survey','Testing','Audio','Education','Admin',
  ];

  useEffect(() => {
    async function init() {
      setMounted(true);
      const u = await getCurrentUser();
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      setLiveWithdrawals(getOrGenerateWithdrawals());
      setPendingWithdrawals(getOrGeneratePending());
      // Joining-gift quiz appears once, right after the first successful sign-up / sign-in
      if (!u.quizDone) setShowQuiz(true);
    }
    init();
  }, [router]);

  // Detect return from Paystack after paying the $5 USD M-Pesa fee
  useEffect(() => {
    if (!user) return;
    const params    = new URLSearchParams(window.location.search);
    const plan      = params.get('plan');
    const trxref    = params.get('trxref');
    const reference = params.get('reference');
    if (plan === 'mpesa_withdrawal_fee' && (trxref || reference)) {
      router.replace('/dashboard', undefined, { shallow: true });
      setMpesaInitialStep('form');
      setShowMpesaWithdraw(true);
    }
  }, [user, router]);

  // Re-fetch user whenever the tab becomes visible (picks up Supabase admin edits)
  useEffect(() => {
    if (!user) return;
    const refresh = async () => {
      if (document.visibilityState === 'visible') {
        const u = await getCurrentUser().catch(() => null);
        if (u) setUser(u);
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [user]);

  const handleLogout       = useCallback(() => { logout(); router.push('/'); }, [router]);
  const handleViewTask     = useCallback(task => {
    if (!user?.activated) { router.push('/activate'); } else { setSelectedTask(task); }
  }, [user, router]);
  const handleBidClick     = useCallback(() => { setSelectedTask(null); router.push('/activate'); }, [router]);

  async function handleSubmitTask(task) {
    if (!user.premium) { router.push('/premium'); return; }
    const emailed = await sendTaskSubmission(user, task);
    if (emailed) alert('✅ Submitted! A confirmation email has been sent to you, and our team has been notified.');
  }

  const filteredTasks = (TASKS || []).filter(t => {
    const matchCat    = filter === 'All' || t.category === filter;
    const matchSearch = !search
      || t.title.toLowerCase().includes(search.toLowerCase())
      || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!mounted || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
      </div>
    );
  }

  const initials     = user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`;

  if (user.suspended) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '48px 36px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#991B1B', marginBottom: 8 }}>
            Account Suspended
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 20 }}>
            Your account has been suspended and you cannot access Business Hub at this time.
          </p>
          {user.suspendReason && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 13, color: '#7F1D1D' }}>{user.suspendReason}</div>
            </div>
          )}
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>
            If you believe this is a mistake, please contact support at{' '}
            <a href="mailto:businesshub.comke@gmail.com" style={{ color: '#DC2626' }}>businesshub.comke@gmail.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <Link href="/" className="dash-logo">BUSINESS HUB</Link>
          <div className="dash-user">
            <div className="dash-user-info">
              <div className="dash-user-name">{user.fullName}</div>
              <div className="dash-user-email">{user.email}</div>
            </div>
            <div className="dash-avatar">{initials}</div>
            <button className="hamburger-btn" onClick={() => setShowMenu(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <main className="dash-main">
        {/* Welcome Banner */}
        <div className="dash-welcome">
          <div className="dash-welcome-text">
            <h2>Welcome back, {user.fullName.split(' ')[0]}! 👋</h2>
            <p>{user.email} • {user.country}</p>
            <div style={{ marginTop: 12 }}>
              <span className={`status-badge ${user.activated ? 'status-active' : 'status-inactive'}`}>
                {user.activated ? '✅ Active — Access valid 1 month' : '⚠️ Inactive — Pay KES 50 to Bid'}
              </span>
            </div>
          </div>
          <div className="dash-balance-box">
            <div className="dash-balance-label">Account Balance</div>
            <div className="dash-balance-amount">KES {(user.balance || 0).toLocaleString()}</div>
            <div className="dash-balance-sub">Available for withdrawal</div>
          </div>
        </div>

        {/* Referral Banner */}
        <div className="referral-banner" onClick={() => setShowReferral(true)}>
          <div className="referral-banner-left">
            <span className="referral-banner-icon">🔗</span>
            <div>
              <div className="referral-banner-title">Refer Friends &amp; Earn KES 70 Each</div>
              <div className="referral-banner-sub">Share your link • Track referrals • Get paid instantly</div>
            </div>
          </div>
          <div className="referral-banner-link">
            <span className="referral-link-preview">{referralLink.replace('https://', '')}</span>
            <button
              className="referral-copy-btn"
              onClick={e => {
                e.stopPropagation();
                navigator.clipboard.writeText(referralLink);
                alert('Referral link copied!');
              }}
            >
              Copy Link →
            </button>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => router.push('/premium')}>
            <span className="quick-action-icon">⭐</span>
            <span className="quick-action-label">{user?.premium ? 'Renew Premium' : 'Upgrade Premium'}</span>
          </button>
          <button className="quick-action-card" onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="quick-action-icon">✅</span>
            <span className="quick-action-label">Awarded Tasks</span>
          </button>
          <button className="quick-action-card quick-action-mpesa" onClick={() => setShowMpesaWithdraw(true)}>
            <span className="quick-action-icon">📲</span>
            <span className="quick-action-label">Withdraw with M-Pesa</span>
          </button>
          <button className="quick-action-card" onClick={() => setShowTraining(true)}>
            <span className="quick-action-icon">🎓</span>
            <span className="quick-action-label">Apply for Training</span>
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            { icon: '📋', num: (TASKS || []).length,                    label: 'Available Tasks' },
            { icon: '💼', num: user.activeBids || 0,                     label: 'Active Bids' },
            { icon: '✅', num: user.completedTasks || 0,                 label: 'Completed Tasks' },
            { icon: '💰', num: `KES ${(user.balance || 0).toLocaleString()}`, label: 'Total Earned' },
          ].map(({ icon, num, label }) => (
            <div key={label} className="dash-stat-card">
              <div className="dash-stat-icon">{icon}</div>
              <div>
                <div className="dash-stat-num">{num}</div>
                <div className="dash-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Withdrawals Ticker */}
        <ActivityFeed withdrawals={liveWithdrawals} pending={pendingWithdrawals} />

        {/* Tasks Section */}
        <div id="tasks-section">
          <div className="dash-section-title">Available Tasks</div>
          <div className="dash-section-sub">Browse and bid on tasks that match your skills</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '10px 16px', border: '1.5px solid var(--gray-light)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--black)', background: 'var(--white)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{ padding: '6px 16px', borderRadius: 100, border: '1.5px solid', borderColor: filter === cat ? 'var(--green)' : 'var(--gray-light)', background: filter === cat ? 'var(--green)' : 'var(--white)', color: filter === cat ? 'var(--white)' : 'var(--gray)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--gray)' }}>
            Showing <strong>{filteredTasks.length}</strong> tasks
            {user.activated && (
              <span style={{ marginLeft: 10, color: '#059669', fontWeight: 600 }}>✅ All tasks unlocked</span>
            )}
          </div>

          <div className="tasks-grid">
            {filteredTasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-poster">
                    <div className="task-poster-avatar">{task.poster.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="task-poster-name">{task.poster}</div>
                      <div className="task-poster-date">{task.datePosted}</div>
                    </div>
                  </div>
                  <div className="task-payment">KES {task.payment.toLocaleString()}</div>
                </div>
                <div className="task-category">{task.category}</div>
                <div className="task-title">{task.title}</div>
                <div className="task-desc">{task.description}</div>
                <div className="task-actions">
                  <button className="task-view-btn" onClick={() => handleViewTask(task)}>👁️ View / Bid</button>
                  <button className="task-submit-btn" onClick={() => handleSubmitTask(task)} title="Submit this task via email">📤 Submit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      {showQuiz && user && !user.quizDone && (
        <QuizModal
          user={user}
          onComplete={(u) => { if (u) setUser(u); setShowQuiz(false); }}
        />
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onBidClick={handleBidClick} onUpgradeClick={() => router.push('/premium')} />
      )}
      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showTraining && <TrainingModal user={user} onClose={() => setShowTraining(false)} />}

      {showMpesaWithdraw && (
        <MpesaWithdrawModal
          user={user}
          initialStep={mpesaInitialStep}
          onClose={() => { setShowMpesaWithdraw(false); setMpesaInitialStep('fee'); }}
        />
      )}

      {showOtherWithdraw && (
        <OtherCountryWithdrawModal onClose={() => setShowOtherWithdraw(false)} />
      )}

      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onUpgrade={() => router.push('/premium')}
          onMpesaWithdraw={() => setShowMpesaWithdraw(true)}
          onOtherWithdraw={() => setShowOtherWithdraw(true)}
          onReferral={() => setShowReferral(true)}
          onTraining={() => setShowTraining(true)}
          onPremiumTest={() => router.push('/skills-test')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
