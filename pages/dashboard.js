// pages/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// Business Hub Dashboard — Enhanced Version
// Changes:
//   • Withdrawal requires KSh 480 Paystack payment before form is shown
//   • Withdrawal form saved to localStorage; pending state blocks re-submission
//   • Live withdrawals: 50 generated records (KSh 1,000–3,700), animated ticker
//   • Improved modals, animations, responsive CSS
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate 50 pseudo-random withdrawal records and persist in localStorage */
function getOrGenerateWithdrawals() {
  const LS_KEY = 'bh_live_withdrawals';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const sources = [
    { flag: '🇰🇪', country: 'Kenya',        prefixes: ['+25471', '+25472', '+25473', '+25474', '+25475', '+25476', '+25477', '+25478', '+25479', '+25470'] },
    { flag: '🇺🇬', country: 'Uganda',        prefixes: ['+25670', '+25678', '+25679'] },
    { flag: '🇹🇿', country: 'Tanzania',      prefixes: ['+25575', '+25568'] },
    { flag: '🇳🇬', country: 'Nigeria',       prefixes: ['+23481', '+23490'] },
    { flag: '🇬🇭', country: 'Ghana',         prefixes: ['+23354', '+23324'] },
    { flag: '🇷🇼', country: 'Rwanda',        prefixes: ['+25078', '+25072'] },
    { flag: '🇿🇦', country: 'South Africa',  prefixes: ['+27821', '+27831'] },
    { flag: '🇪🇹', country: 'Ethiopia',      prefixes: ['+25191', '+25193'] },
    { flag: '🇨🇲', country: 'Cameroon',      prefixes: ['+23767', '+23769'] },
    { flag: '🇲🇼', country: 'Malawi',        prefixes: ['+26599', '+26588'] },
    { flag: '🇿🇲', country: 'Zambia',        prefixes: ['+26097'] },
    { flag: '🇧🇮', country: 'Burundi',       prefixes: ['+25779'] },
    { flag: '🇸🇸', country: 'South Sudan',   prefixes: ['+21192'] },
    { flag: '🇸🇳', country: 'Senegal',       prefixes: ['+22177'] },
    { flag: '🇨🇮', country: "Ivory Coast",   prefixes: ['+22505'] },
    { flag: '🇲🇿', country: 'Mozambique',    prefixes: ['+25884'] },
  ];

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const mask = p => `${p}*****${String(rand(10, 99))}`;

  const records = Array.from({ length: 50 }, () => {
    const src    = sources[rand(0, sources.length - 1)];
    const prefix = src.prefixes[rand(0, src.prefixes.length - 1)];
    return {
      flag:    src.flag,
      country: src.country,
      phone:   mask(prefix),
      amount:  rand(1000, 3700),
    };
  });

  try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch (_) {}
  return records;
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;
  const isActivated = user?.activated;

  function handleSubmit() {
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
          {isActivated && (
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
      body: JSON.stringify({ email: user.email, amount: 50, phone }),
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
                Activate your account for <strong>KES 50</strong> to start bidding on tasks and earning money.
                Once activated, all tasks are <strong style={{ color: 'var(--green)' }}>free to access</strong>.
              </div>
              <div className="pay-amount">
                <div className="pay-amount-label">One-time activation fee</div>
                <div className="pay-amount-value">KES 50</div>
                <div className="pay-amount-sub">Lifetime access • No hidden fees</div>
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
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Unlock full platform access</div>
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
            <div className="pay-amount-label">Monthly Premium Plan</div>
            <div className="pay-amount-value">KES 480</div>
            <div className="pay-amount-sub">per month • Cancel anytime</div>
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

// ─── Withdraw: Step 1 — Pay KSh 480 Processing Fee ───────────────────────────
function WithdrawFeeModal({ user, onClose }) {
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('prompt');  // 'prompt' | 'processing'

  async function handlePay() {
    if (!phone.trim()) { alert('Enter your M-Pesa number'); return; }
    setLoading(true);
    setStep('processing');

    try {
      const res  = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:  user.email,
          amount: 480,
          phone,
          plan:   'withdrawal_fee',
          // Paystack callback should redirect back and set withdrawalFeePaid flag
        }),
      });
      const data = await res.json();
      if (data.status) {
        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment could not be initiated. Please try again.');
        setStep('prompt');
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
      setStep('prompt');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card withdraw-fee-card" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #1A7A4A, #C9933A)' }}>
          <div>
            <div className="pay-modal-title">💸 Withdraw Funds</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Processing fee required
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              {/* Info banner */}
              <div className="withdraw-fee-info">
                <div className="withdraw-fee-icon">ℹ️</div>
                <p>
                  A one-time <strong>withdrawal processing fee of KES 480</strong> is required to unlock the withdrawal form.
                  This fee covers transaction processing and verification costs.
                </p>
              </div>

              {/* What you get */}
              <div className="premium-features" style={{ marginBottom: 20 }}>
                {[
                  ['✅', 'Instant withdrawal form access'],
                  ['🔒', 'Secure fund transfer'],
                  ['⚡', 'Processed within 24–48 hours'],
                  ['📲', 'M-Pesa direct payment'],
                ].map(([icon, text]) => (
                  <div key={text} className="premium-feature-item">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="pay-amount">
                <div className="pay-amount-label">Withdrawal Processing Fee</div>
                <div className="pay-amount-value">KES 480</div>
                <div className="pay-amount-sub">One-time fee • Unlocks withdrawal form</div>
              </div>

              <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
              <input
                className="pay-phone-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />

              <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #1A7A4A, #C9933A)' }} onClick={handlePay} disabled={loading}>
                {loading ? <><span className="spinner" /> Processing...</> : '🔒 Pay KES 480 via Paystack'}
              </button>
              <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
            </>
          )}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3, margin: '0 auto 20px' }} />
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Redirecting to Paystack...</p>
              <p style={{ fontSize: 13, color: 'var(--gray)' }}>Complete payment to unlock your withdrawal form.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw: Step 2 — Withdrawal Form (shown after fee paid) ────────────────
function WithdrawFormModal({ user, onClose, storageKey, onSubmitted }) {
  const [fullName,   setFullName]   = useState(user?.fullName || '');
  const [accountNum, setAccountNum] = useState(user?.phone || '');
  const [amount,     setAmount]     = useState('');
  const [kraPin,     setKraPin]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});

  function validate() {
    const e = {};
    if (!fullName.trim())  e.fullName   = 'Full name is required';
    if (!accountNum.trim()) e.accountNum = 'Account number or phone is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
                            e.amount     = 'Enter a valid withdrawal amount';
    if (!kraPin.trim())    e.kraPin     = 'KRA PIN is required for taxation';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);

    const request = {
      status:      'pending',
      fullName:    fullName.trim(),
      accountNum:  accountNum.trim(),
      amount:      Number(amount),
      kraPin:      kraPin.trim(),
      requestedAt: new Date().toISOString(),
    };

    try { localStorage.setItem(storageKey, JSON.stringify(request)); } catch (_) {}

    setSubmitting(false);
    onSubmitted(request);
    onClose();
  }

  const field = (label, value, setter, placeholder, key, type = 'text') => (
    <div style={{ marginBottom: 18 }}>
      <div className="pay-phone-label">{label}</div>
      <input
        className="pay-phone-input"
        type={type}
        value={value}
        onChange={e => { setter(e.target.value); setErrors(prev => ({ ...prev, [key]: undefined })); }}
        placeholder={placeholder}
        style={{ marginBottom: 0, borderColor: errors[key] ? '#ef4444' : undefined }}
      />
      {errors[key] && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors[key]}</div>}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #1A7A4A, #059669)' }}>
          <div>
            <div className="pay-modal-title">💸 Withdrawal Details</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Balance: KES {(user?.balance || 0).toLocaleString()}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: 'var(--green)', background: 'var(--green-pale)', marginBottom: 20 }}>
            Please fill in your withdrawal details accurately. Funds will be sent to the account provided.
          </div>
          {field('Full Name', fullName, setFullName, 'Enter your full name', 'fullName')}
          {field('Account Number or Phone Number', accountNum, setAccountNum, '+254 7XX XXX XXX or account number', 'accountNum')}
          {field('Amount to Withdraw (KES)', amount, setAmount, 'e.g. 500', 'amount', 'number')}
          {field('KRA PIN (for taxation purposes)', kraPin, setKraPin, 'e.g. A012345678B', 'kraPin')}
          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg, #1A7A4A, #059669)', marginTop: 4 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <><span className="spinner" /> Submitting...</> : '💸 Submit Withdrawal Request'}
          </button>
          <div className="pay-secure">🔐 Secured & encrypted • Processed within 24–48 hours</div>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw: Pending Notification ──────────────────────────────────────────
function WithdrawPendingModal({ data, onClose }) {
  const requestedAt = data?.requestedAt
    ? new Date(data.requestedAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          <div>
            <div className="pay-modal-title">⏳ Pending Withdrawal</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Your request is being processed</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body" style={{ padding: '28px 28px 24px' }}>
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🕐</span>
            <p style={{ margin: 0, fontSize: 14, color: '#92400E', lineHeight: 1.65 }}>
              Your withdrawal request is currently being processed. Please be patient while the withdrawal is being initiated.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {/* Amount */}
            <div className="withdraw-detail-card">
              <div>
                <div className="withdraw-detail-label">Requested Amount</div>
                <div className="withdraw-detail-value amount">KES {(data?.amount || 0).toLocaleString()}</div>
              </div>
              <div className="withdraw-detail-icon">💰</div>
            </div>
            {/* Status */}
            <div className="withdraw-detail-card" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
              <div>
                <div className="withdraw-detail-label">Status</div>
                <div className="withdraw-detail-value pending">
                  <span className="withdraw-pending-dot" />
                  Pending
                </div>
              </div>
              <div className="withdraw-detail-icon">⏳</div>
            </div>
            {/* Date */}
            {requestedAt && (
              <div className="withdraw-detail-card">
                <div>
                  <div className="withdraw-detail-label">Date & Time of Request</div>
                  <div className="withdraw-detail-value date">{requestedAt}</div>
                </div>
                <div className="withdraw-detail-icon">📅</div>
              </div>
            )}
          </div>
          <button className="withdraw-close-btn" onClick={onClose}>Close</button>
          <div className="withdraw-footer-note">Processing typically takes 24–48 hours. Contact support if delayed.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Smart Withdraw Controller ────────────────────────────────────────────────
/**
 * State machine:
 *   not activated            → WithdrawLockedModal (activate account first)
 *   activated, fee not paid  → WithdrawFeeModal    (pay KSh 480)
 *   fee paid, no pending     → WithdrawFormModal   (fill withdrawal form)
 *   pending exists           → WithdrawPendingModal
 */
function WithdrawModal({ user, onClose, pendingWithdrawal, onWithdrawalSubmitted, withdrawalFeePaid }) {
  if (!user?.activated) {
    // Not activated — tell them to activate first
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="pay-modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="pay-modal-header" style={{ background: 'var(--black)' }}>
            <div className="pay-modal-title">Withdrawal</div>
            <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
          </div>
          <div className="pay-modal-body" style={{ textAlign: 'center', padding: '36px 28px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--black)' }}>Activation Required</h3>
            <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 24 }}>
              Please <strong>activate your account</strong> first before requesting a withdrawal.
            </p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (pendingWithdrawal?.status === 'pending') {
    return <WithdrawPendingModal data={pendingWithdrawal} onClose={onClose} />;
  }

  if (!withdrawalFeePaid) {
    return <WithdrawFeeModal user={user} onClose={onClose} />;
  }

  const storageKey = `withdrawal_pending_${user?.id}`;
  return (
    <WithdrawFormModal
      user={user}
      onClose={onClose}
      storageKey={storageKey}
      onSubmitted={onWithdrawalSubmitted}
    />
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

  // Seed the initial visible 5 items
  useEffect(() => {
    if (!withdrawals.length) return;
    setVisibleItems(withdrawals.slice(0, 5));
    indexRef.current = 5;
  }, [withdrawals]);

  // Every 2.5 s, rotate one item out and slide a new one in
  useEffect(() => {
    if (!withdrawals.length) return;
    const interval = setInterval(() => {
      const nextIdx = indexRef.current % withdrawals.length;
      const nextItem = withdrawals[nextIdx];
      setAnimatingIn(nextItem);
      indexRef.current = nextIdx + 1;

      // After animation starts (300 ms) swap the list
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

      {/* Horizontal scrolling ticker strip */}
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

      {/* Animated card list */}
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
function HamburgerMenu({ user, onClose, onUpgrade, onWithdraw, onReferral, onTraining, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard',          action: () => { onClose(); } },
    { icon: '⭐', label: 'Upgrade to Premium', action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks',       action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '💸', label: 'Withdraw Money',      action: () => { onClose(); onWithdraw(); } },
    { icon: '🎓', label: 'Apply for Training',  action: () => { onClose(); onTraining(); } },
    { icon: '🔗', label: 'My Referral Link',    action: () => { onClose(); onReferral(); } },
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

  const [selectedTask,  setSelectedTask]  = useState(null);
  const [payTask,       setPayTask]       = useState(null);
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [showWithdraw,  setShowWithdraw]  = useState(false);
  const [showReferral,  setShowReferral]  = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [showTraining,  setShowTraining]  = useState(false);

  // Withdrawal state
  const [pendingWithdrawal,  setPendingWithdrawal]  = useState(null);
  const [withdrawalFeePaid,  setWithdrawalFeePaid]  = useState(false);

  // Live withdrawals (50 records, stored in localStorage)
  const [liveWithdrawals, setLiveWithdrawals] = useState([]);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All','Writing','Research','Data Entry','Design','Marketing',
    'Transcription','Translation','Survey','Testing','Audio','Education','Admin',
  ];

  // ── On mount ──
  useEffect(() => {
    setMounted(true);
    const u = getCurrentUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);

    // Load pending withdrawal
    try {
      const stored = localStorage.getItem(`withdrawal_pending_${u.id}`);
      if (stored) setPendingWithdrawal(JSON.parse(stored));
    } catch (_) {}

    // Load withdrawal fee paid state
    try {
      const feePaid = localStorage.getItem(`withdrawal_fee_paid_${u.id}`);
      if (feePaid === 'true') setWithdrawalFeePaid(true);
    } catch (_) {}

    // Generate / load 50 live withdrawal records
    setLiveWithdrawals(getOrGenerateWithdrawals());
  }, [router]);

  // ── Check Paystack return params for withdrawal_fee confirmation ──
  useEffect(() => {
    if (!user) return;
    const params   = new URLSearchParams(window.location.search);
    const plan     = params.get('plan');
    const trxref   = params.get('trxref');
    const reference = params.get('reference');

    // If Paystack redirected back with plan=withdrawal_fee, mark fee as paid
    if (plan === 'withdrawal_fee' && (trxref || reference)) {
      try { localStorage.setItem(`withdrawal_fee_paid_${user.id}`, 'true'); } catch (_) {}
      setWithdrawalFeePaid(true);
      // Clean URL
      router.replace('/dashboard', undefined, { shallow: true });
      // Auto-open withdrawal form
      setShowWithdraw(true);
    }
  }, [user, router]);

  const handleLogout       = useCallback(() => { logout(); router.push('/'); }, [router]);
  const handleViewTask     = useCallback(task => setSelectedTask(task), []);
  const handleBidClick     = useCallback(task => { setSelectedTask(null); setPayTask(task); }, []);
  const handlePaySuccess   = useCallback(() => {
    const updated = activateUser(user.id);
    if (updated) setUser(updated);
  }, [user]);
  const handleWithdrawalSubmitted = useCallback(request => {
    setPendingWithdrawal(request);
    setShowWithdraw(false);
  }, []);

  function handleSubmitTask(task) {
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

  const initials      = user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const referralLink  = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`;

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
                {user.activated ? '✅ Account Active' : '⚠️ Account Inactive — Activate to Bid'}
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
            <span className="quick-action-label">Upgrade Premium</span>
          </button>
          <button className="quick-action-card" onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="quick-action-icon">✅</span>
            <span className="quick-action-label">Awarded Tasks</span>
          </button>
          <button className="quick-action-card" onClick={() => setShowWithdraw(true)}>
            <span className="quick-action-icon">💸</span>
            <span className="quick-action-label">
              Withdraw Money
              {pendingWithdrawal?.status === 'pending' && (
                <span style={{ display: 'inline-block', marginLeft: 6, width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', verticalAlign: 'middle' }} />
              )}
            </span>
          </button>
          <button className="quick-action-card" onClick={() => setShowTraining(true)}>
            <span className="quick-action-icon">🎓</span>
            <span className="quick-action-label">Apply for Training</span>
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            { icon: '📋', num: (TASKS || []).length, label: 'Available Tasks' },
            { icon: '💼', num: 0,                   label: 'Active Bids' },
            { icon: '✅', num: 0,                   label: 'Completed Tasks' },
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

        {/* ── Live Withdrawals Animated Ticker ── */}
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
        <TaskModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onBidClick={handleBidClick} />
      )}
      {payTask && (
        <PaymentModal task={payTask} user={user} onClose={() => setPayTask(null)} onSuccess={handlePaySuccess} />
      )}
      {showUpgrade  && <UpgradeModal  user={user} onClose={() => setShowUpgrade(false)} />}
      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showTraining && <TrainingModal user={user} onClose={() => setShowTraining(false)} />}

      {showWithdraw && (
        <WithdrawModal
          user={user}
          onClose={() => setShowWithdraw(false)}
          pendingWithdrawal={pendingWithdrawal}
          onWithdrawalSubmitted={handleWithdrawalSubmitted}
          withdrawalFeePaid={withdrawalFeePaid}
        />
      )}

      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onUpgrade={() => setShowUpgrade(true)}
          onWithdraw={() => setShowWithdraw(true)}
          onReferral={() => setShowReferral(true)}
          onTraining={() => setShowTraining(true)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}