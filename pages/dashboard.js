// pages/dashboard.js

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Task Detail Modal ───────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;

  const isActivated = user?.activated;

  function handleSubmit() {
    const subject = encodeURIComponent('Task Submission: ' + task.title);
    const body = encodeURIComponent(
      'Hello Business Hub,\n\nI am submitting my completed task for review.\n\nTask: ' +
        task.title +
        '\nCategory: ' +
        task.category +
        '\nPayment: KES ' +
        task.payment.toLocaleString() +
        '\n\nPlease find my submission below:\n\n[Add your work here]\n\nThank you,\n' +
        (user?.fullName || '')
    );
    window.location.href =
      'mailto:businesshub.comke@gmail.com?subject=' + subject + '&body=' + body;
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
            <div className="modal-meta-item">
              <div className="modal-meta-label">Posted By</div>
              <div className="modal-meta-value">👤 {task.poster}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Location</div>
              <div className="modal-meta-value">📍 {task.location}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Date Posted</div>
              <div className="modal-meta-value">📅 {task.datePosted}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Category</div>
              <div className="modal-meta-value">🏷️ {task.category}</div>
            </div>
          </div>
          <div className="modal-payment">
            <div>
              <div className="modal-payment-label">Task Payment</div>
              <div style={{ fontSize: 13, color: 'var(--blue)', opacity: 0.7, marginTop: 2 }}>
                Paid on approval
              </div>
            </div>
            <div className="modal-payment-amount">KES {task.payment.toLocaleString()}</div>
          </div>
          <p className="modal-desc">{task.description}</p>
          {task.questions && task.questions.length > 0 && (
            <div className="modal-questions">
              <h4>Questions from Poster</h4>
              {task.questions.map((q, i) => (
                <div key={i} className="modal-question-item">{q}</div>
              ))}
            </div>
          )}

          {!isActivated && (
            <button className="bid-btn" onClick={() => onBidClick(task)}>
              💼 Bid on This Task
            </button>
          )}

          {isActivated && (
            <button className="submit-btn" onClick={handleSubmit}>
              📤 Submit This Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Payment / Activation Modal ──────────────────────────────────────────────
function PaymentModal({ task, user, onClose, onSuccess }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('prompt');

  async function handlePay() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    setStep('processing');
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 50, phone }),
    });
    const data = await res.json();
    if (data.status) {
      window.location.href = data.data.authorization_url;
    } else {
      alert('Payment failed');
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
                Activate your account for <strong>KES 50</strong> to start bidding on tasks and earning money. Once activated, all tasks are <strong style={{ color: 'var(--blue)' }}>free to access</strong>.
              </div>
              <div className="pay-amount">
                <div className="pay-amount-label">One-time activation fee</div>
                <div className="pay-amount-value">KES 50</div>
                <div className="pay-amount-sub">Lifetime access • No hidden fees</div>
              </div>
              <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
              <input
                className="pay-phone-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />
              <button className="pay-btn" onClick={handlePay} disabled={loading}>
                {loading ? <><span className="spinner" /> Processing...</> : '🔒 Pay via Paystack'}
              </button>
              <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
            </>
          )}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--blue)', borderColor: 'var(--gray-light)', borderWidth: 3, margin: '0 auto 16px' }} />
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
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    const res = await fetch('/api/paystack/initialize', {
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
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #0047FF, #7C3AED)' }}>
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
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Monthly Premium Plan</div>
            <div className="pay-amount-value" style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KES 480</div>
            <div className="pay-amount-sub">per month • Cancel anytime</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
          />
          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)' }}
            onClick={handleUpgrade}
            disabled={loading}
          >
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
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleTrainingPay() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    const res = await fetch('/api/paystack/initialize', {
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
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #0047FF)' }}>
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
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Training Registration Fee</div>
            <div
              className="pay-amount-value"
              style={{
                background: 'linear-gradient(135deg, #059669, #0047FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              KES 132
            </div>
            <div className="pay-amount-sub">One-time payment • Instant access</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
          />
          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg, #059669, #0047FF)' }}
            onClick={handleTrainingPay}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Processing...</> : '🎓 Pay & Apply Now'}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw: Not Activated (locked) ────────────────────────────────────────
function WithdrawLockedModal({ onClose, onUpgrade }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'var(--black)' }}>
          <div className="pay-modal-title">Withdrawal</div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body" style={{ textAlign: 'center', padding: '36px 28px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--black)' }}>
            Activation Required
          </h3>
          <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 24 }}>
            Please <strong>activate your account</strong> to access withdrawals.
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 13, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw: Form Modal (activated users, no pending request) ───────────────
function WithdrawFormModal({ user, onClose, storageKey, onSubmitted }) {
  const [fullName, setFullName]       = useState(user?.fullName || '');
  const [accountNum, setAccountNum]   = useState(user?.phone || '');
  const [amount, setAmount]           = useState('');
  const [kraPin, setKraPin]           = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});

  function validate() {
    const e = {};
    if (!fullName.trim())    e.fullName   = 'Full name is required';
    if (!accountNum.trim())  e.accountNum = 'Account number or phone is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
                             e.amount     = 'Enter a valid withdrawal amount';
    if (!kraPin.trim())      e.kraPin     = 'KRA PIN is required for taxation';
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

    try {
      localStorage.setItem(storageKey, JSON.stringify(request));
    } catch (_) {
      // localStorage not available — state still passes via onSubmitted
    }

    setSubmitting(false);
    onSubmitted(request);   // lift state up so parent re-renders
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
      {errors[key] && (
        <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors[key]}</div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #0047FF, #059669)' }}>
          <div>
            <div className="pay-modal-title">💸 Withdraw Funds</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Balance: KES {(user?.balance || 0).toLocaleString()}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>

        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#0047FF', background: '#EEF4FF', marginBottom: 20 }}>
            Please fill in your withdrawal details accurately. Funds will be sent to the account number provided.
          </div>

          {field('Full Name', fullName, setFullName, 'Enter your full name', 'fullName')}
          {field('Account Number or Phone Number', accountNum, setAccountNum, '+254 7XX XXX XXX or account number', 'accountNum')}
          {field('Amount to Withdraw (KES)', amount, setAmount, 'e.g. 500', 'amount', 'number')}
          {field('KRA PIN (for taxation purposes)', kraPin, setKraPin, 'e.g. A012345678B', 'kraPin')}

          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg, #0047FF, #059669)', marginTop: 4 }}
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

// ─── Withdraw: Pending Notification Modal ────────────────────────────────────
function WithdrawPendingModal({ data, onClose }) {
  const requestedAt = data?.requestedAt
    ? new Date(data.requestedAt).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
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
          {/* Main message */}
          <div style={{
            background: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 22,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🕐</span>
            <p style={{ margin: 0, fontSize: 14, color: '#92400E', lineHeight: 1.65 }}>
              Your withdrawal request is currently being processed. Please be patient while the withdrawal is being initiated.
            </p>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {/* Amount */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderRadius: 10,
              background: '#F8FAFC', border: '1px solid #E2E8F0',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested Amount</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0047FF', marginTop: 2 }}>
                  KES {(data?.amount || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: 28 }}>💰</div>
            </div>

            {/* Status */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderRadius: 10,
              background: '#FFFBEB', border: '1px solid #FCD34D',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#D97706', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
                    display: 'inline-block', animation: 'pulse 1.4s infinite',
                  }} />
                  Pending
                </div>
              </div>
              <div style={{ fontSize: 24 }}>⏳</div>
            </div>

            {/* Date / Time */}
            {requestedAt && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', borderRadius: 10,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time of Request</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{requestedAt}</div>
                </div>
                <div style={{ fontSize: 24 }}>📅</div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '13px', background: '#F1F5F9',
              border: 'none', borderRadius: 10, color: '#475569',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 12 }}>
            Processing typically takes 24–48 hours. Contact support if delayed.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Smart Withdraw Modal (controller) ───────────────────────────────────────
// Decides which withdraw experience to show based on activation + pending state.
function WithdrawModal({ user, onClose, onUpgrade, pendingWithdrawal, onWithdrawalSubmitted }) {
  if (!user?.activated) {
    return <WithdrawLockedModal onClose={onClose} onUpgrade={onUpgrade} />;
  }

  if (pendingWithdrawal?.status === 'pending') {
    return <WithdrawPendingModal data={pendingWithdrawal} onClose={onClose} />;
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
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #0047FF)' }}>
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
                style={{ fontSize: 13, flex: 1, marginBottom: 0, letterSpacing: 0 }}
              />
              <button
                onClick={copyLink}
                style={{
                  padding: '0 20px',
                  background: copied ? '#059669' : 'var(--blue)',
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
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
              {
                label: '📱 WhatsApp',
                color: '#25D366',
                url: `https://wa.me/?text=Join%20Business%20Hub%20and%20earn%20online!%20${encodeURIComponent(referralLink)}`,
              },
              {
                label: '✉️ Email',
                color: '#EA4335',
                url: `mailto:?subject=Join%20Business%20Hub&body=Hey!%20Join%20me%20on%20Business%20Hub%20and%20start%20earning%20online.%20Use%20my%20link:%20${encodeURIComponent(referralLink)}`,
              },
            ].map(btn => (
              <a
                key={btn.label}
                href={user?.activated ? btn.url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '12px',
                  background: btn.color,
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: 'center',
                  display: 'block',
                  opacity: user?.activated ? 1 : 0.5,
                  pointerEvents: user?.activated ? 'auto' : 'none',
                }}
              >
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerMenu({ user, onClose, onUpgrade, onWithdraw, onReferral, onTraining, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard', action: () => { onClose(); } },
    { icon: '⭐', label: 'Upgrade to Premium', action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks', action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '💸', label: 'Withdraw Money', action: () => { onClose(); onWithdraw(); } },
    { icon: '🎓', label: 'Apply for Training', action: () => { onClose(); onTraining(); } },
    { icon: '🔗', label: 'My Referral Link', action: () => { onClose(); onReferral(); } },
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
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--black)' }}>{user?.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>{user?.email}</div>
              <span className={`status-badge ${user?.activated ? 'status-active' : 'status-inactive'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                {user?.activated ? '✅ Active' : '⚠️ Inactive'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'var(--gray-light)', color: 'var(--black)', flexShrink: 0 }}>×</button>
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--blue)', marginBottom: 16 }}>
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
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask, setSelectedTask]   = useState(null);
  const [payTask, setPayTask]             = useState(null);
  const [showUpgrade, setShowUpgrade]     = useState(false);
  const [showWithdraw, setShowWithdraw]   = useState(false);
  const [showReferral, setShowReferral]   = useState(false);
  const [showMenu, setShowMenu]           = useState(false);
  const [showTraining, setShowTraining]   = useState(false);

  // ── Withdrawal pending state ──
  // Loaded from localStorage on mount; updated when user submits a request.
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const withdrawals = [
    { flag: '🇰🇪', country: 'Kenya', phone: '+25471*****78', amount: 450 },
    { flag: '🇺🇬', country: 'Uganda', phone: '+25670*****44', amount: 1200 },
    { flag: '🇹🇿', country: 'Tanzania', phone: '+25575*****33', amount: 800 },
    { flag: '🇳🇬', country: 'Nigeria', phone: '+23481*****55', amount: 1500 },
    { flag: '🇬🇭', country: 'Ghana', phone: '+23354*****23', amount: 650 },
    { flag: '🇷🇼', country: 'Rwanda', phone: '+25078*****56', amount: 300 },
    { flag: '🇿🇦', country: 'South Africa', phone: '+27821*****67', amount: 1100 },
    { flag: '🇪🇹', country: 'Ethiopia', phone: '+25191*****44', amount: 950 },
    { flag: '🇨🇲', country: 'Cameroon', phone: '+23767*****67', amount: 500 },
    { flag: '🇲🇼', country: 'Malawi', phone: '+26599*****44', amount: 250 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25479*****12', amount: 700 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25472*****45', amount: 980 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25474*****67', amount: 350 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25476*****89', amount: 1250 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25470*****23', amount: 430 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25473*****90', amount: 890 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25475*****11', amount: 670 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25478*****55', amount: 1500 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25471*****34', amount: 760 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25477*****66', amount: 540 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25479*****88', amount: 1340 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25472*****19', amount: 600 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25474*****44', amount: 990 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25470*****75', amount: 410 },
    { flag: '🇰🇪', country: 'Kenya', phone: '+25473*****28', amount: 870 },
    { flag: '🇺🇬', country: 'Uganda', phone: '+25678*****21', amount: 450 },
    { flag: '🇹🇿', country: 'Tanzania', phone: '+25568*****32', amount: 720 },
    { flag: '🇳🇬', country: 'Nigeria', phone: '+23490*****45', amount: 2100 },
    { flag: '🇬🇭', country: 'Ghana', phone: '+23324*****67', amount: 530 },
    { flag: '🇷🇼', country: 'Rwanda', phone: '+25072*****89', amount: 280 },
    { flag: '🇿🇦', country: 'South Africa', phone: '+27831*****11', amount: 1600 },
    { flag: '🇪🇹', country: 'Ethiopia', phone: '+25193*****22', amount: 770 },
    { flag: '🇨🇲', country: 'Cameroon', phone: '+23769*****33', amount: 620 },
    { flag: '🇲🇼', country: 'Malawi', phone: '+26588*****44', amount: 310 },
    { flag: '🇿🇲', country: 'Zambia', phone: '+26097*****55', amount: 850 },
    { flag: '🇧🇮', country: 'Burundi', phone: '+25779*****66', amount: 240 },
    { flag: '🇸🇸', country: 'South Sudan', phone: '+21192*****77', amount: 940 },
    { flag: '🇸🇳', country: 'Senegal', phone: '+22177*****88', amount: 1300 },
    { flag: '🇨🇮', country: 'Ivory Coast', phone: '+22505*****99', amount: 580 },
    { flag: '🇲🇿', country: 'Mozambique', phone: '+25884*****10', amount: 470 },
  ];

  const [currentWithdrawal, setCurrentWithdrawal] = useState(withdrawals[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWithdrawal(withdrawals[Math.floor(Math.random() * withdrawals.length)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    'All', 'Writing', 'Research', 'Data Entry', 'Design',
    'Marketing', 'Transcription', 'Translation', 'Survey',
    'Testing', 'Audio', 'Education', 'Admin',
  ];

  useEffect(() => {
    setMounted(true);
    const u = getCurrentUser();
    if (!u) {
      router.replace('/login');
    } else {
      setUser(u);
      // Load any existing pending withdrawal for this user
      try {
        const stored = localStorage.getItem(`withdrawal_pending_${u.id}`);
        if (stored) setPendingWithdrawal(JSON.parse(stored));
      } catch (_) {}
    }
  }, [router]);

  const handleLogout = useCallback(() => { logout(); router.push('/'); }, [router]);

  const handleViewTask = useCallback(task => { setSelectedTask(task); }, []);

  const handleBidClick = useCallback(task => {
    setSelectedTask(null);
    setPayTask(task);
  }, []);

  const handlePaySuccess = useCallback(() => {
    const updated = activateUser(user.id);
    if (updated) setUser(updated);
  }, [user]);

  // Called when user submits the withdrawal form
  const handleWithdrawalSubmitted = useCallback((request) => {
    setPendingWithdrawal(request);
    setShowWithdraw(false);
    // Brief delay then re-open to show pending notification
    // (optional: you can just close and let user re-open manually)
  }, []);

  function handleSubmitTask(task) {
    const subject = encodeURIComponent('Task Submission: ' + task.title);
    const body = encodeURIComponent(
      'Hello Business Hub,\n\nPlease submit your tasks on email for review.\n\nTask: ' +
        task.title +
        '\nCategory: ' +
        task.category +
        '\nPayment: KES ' +
        task.payment.toLocaleString() +
        '\n\nYour submission:\n\n[Add your work here]\n\nSubmitted by: ' +
        (user?.fullName || '') +
        '\nEmail: ' +
        (user?.email || '')
    );
    window.location.href =
      'mailto:businesshub.comke@gmail.com?subject=' + subject + '&body=' + body;
  }

  const filteredTasks = TASKS.filter(t => {
    const matchCat = filter === 'All' || t.category === filter;
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!mounted || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--blue)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
      </div>
    );
  }

  const initials = user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
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
              <div className="referral-banner-title">Refer Friends & Earn KES 70 Each</div>
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
            {/* Show pending indicator on tile if there's a pending withdrawal */}
            <span className="quick-action-label">
              Withdraw Money
              {pendingWithdrawal?.status === 'pending' && (
                <span style={{
                  display: 'inline-block', marginLeft: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#F59E0B', verticalAlign: 'middle',
                }} />
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
          <div className="dash-stat-card">
            <div className="dash-stat-icon">📋</div>
            <div>
              <div className="dash-stat-num">{TASKS.length}</div>
              <div className="dash-stat-label">Available Tasks</div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">💼</div>
            <div>
              <div className="dash-stat-num">0</div>
              <div className="dash-stat-label">Active Bids</div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">✅</div>
            <div>
              <div className="dash-stat-num">0</div>
              <div className="dash-stat-label">Completed Tasks</div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">💰</div>
            <div>
              <div className="dash-stat-num">KES {(user.balance || 0).toLocaleString()}</div>
              <div className="dash-stat-label">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Live Withdrawals Feed */}
        <div className="withdrawals-feed">
          <div className="withdrawals-header">
            <div className="withdrawals-title">
              <span className="live-dot"></span>
              Live Withdrawals
            </div>
            <div className="withdrawals-badge">Instant M-Pesa Payouts</div>
          </div>
          <div className="withdrawals-list">
            {withdrawals.slice(0, 6).map((item, index) => (
              <div className="withdrawal-item" key={index}>
                <div className="withdrawal-user">
                  <div className="withdrawal-avatar">{item.flag}</div>
                  <div className="withdrawal-info">
                    <h4>{item.phone}</h4>
                    <p>{item.country}</p>
                  </div>
                </div>
                <div className="withdrawal-amount">
                  <h3>KES {item.amount.toLocaleString()}</h3>
                  <span>Successful</span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
              style={{
                flex: 1, minWidth: 200, padding: '10px 16px',
                border: '1.5px solid var(--gray-light)', borderRadius: 8,
                fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--black)', background: 'var(--white)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 16px', borderRadius: 100, border: '1.5px solid',
                  borderColor: filter === cat ? 'var(--blue)' : 'var(--gray-light)',
                  background: filter === cat ? 'var(--blue)' : 'var(--white)',
                  color: filter === cat ? 'var(--white)' : 'var(--gray)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--gray)' }}>
            Showing <strong>{filteredTasks.length}</strong> tasks
            {user.activated && (
              <span style={{ marginLeft: 10, color: '#059669', fontWeight: 600 }}>
                ✅ All tasks unlocked
              </span>
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
                  <button className="task-view-btn" onClick={() => handleViewTask(task)}>
                    👁️ View / Bid
                  </button>
                  <button
                    className="task-submit-btn"
                    onClick={() => handleSubmitTask(task)}
                    title="Submit this task via email"
                  >
                    📤 Submit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          user={user}
          onClose={() => setSelectedTask(null)}
          onBidClick={handleBidClick}
        />
      )}
      {payTask && (
        <PaymentModal
          task={payTask}
          user={user}
          onClose={() => setPayTask(null)}
          onSuccess={handlePaySuccess}
        />
      )}
      {showUpgrade && <UpgradeModal user={user} onClose={() => setShowUpgrade(false)} />}

      {/* Smart withdraw modal — handles all three states */}
      {showWithdraw && (
        <WithdrawModal
          user={user}
          onClose={() => setShowWithdraw(false)}
          onUpgrade={() => { setShowWithdraw(false); setShowUpgrade(true); }}
          pendingWithdrawal={pendingWithdrawal}
          onWithdrawalSubmitted={handleWithdrawalSubmitted}
        />
      )}

      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showTraining && <TrainingModal user={user} onClose={() => setShowTraining(false)} />}
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

      <style jsx>{`
        @keyframes slideIn {
          .withdrawals-feed {
            margin: 28px 0;
            background: #fff;
            border-radius: 22px;
            padding: 24px;
            border: 1px solid var(--gray-light);
            box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          }
          .withdrawals-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
            flex-wrap: wrap;
            gap: 12px;
          }
          .withdrawals-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
            font-weight: 800;
            color: var(--black);
          }
          .live-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00C853;
            animation: pulse 1.4s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: .5; }
            100% { transform: scale(1); opacity: 1; }
          }
          .withdrawals-badge {
            background: #EEF4FF;
            color: var(--blue);
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
          }
          .withdrawals-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .withdrawal-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-radius: 16px;
            border: 1px solid var(--gray-light);
            transition: all .25s ease;
            background: #fff;
          }
          .withdrawal-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
          }
          .withdrawal-user {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .withdrawal-avatar {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            background: #F8FAFC;
          }
          .withdrawal-info h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: var(--black);
          }
          .withdrawal-info p {
            margin: 4px 0 0;
            font-size: 13px;
            color: var(--gray);
          }
          .withdrawal-amount {
            text-align: right;
          }
          .withdrawal-amount h3 {
            margin: 0;
            color: #00A63E;
            font-size: 18px;
            font-weight: 800;
          }
          .withdrawal-amount span {
            font-size: 12px;
            color: var(--gray);
          }
          @media(max-width: 768px) {
            .withdrawal-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 14px;
            }
            .withdrawal-amount {
              text-align: left;
            }
          }
        }
      `}</style>
    </div>
  );
}