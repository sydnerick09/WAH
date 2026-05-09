// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Task Detail Modal ───────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;

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
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--blue)',
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                Paid on approval
              </div>
            </div>

            <div className="modal-payment-amount">
              KES {task.payment.toLocaleString()}
            </div>
          </div>

          <p className="modal-desc">{task.description}</p>

          {task.questions && task.questions.length > 0 && (
            <div className="modal-questions">
              <h4>Questions from Poster</h4>

              {task.questions.map((q, i) => (
                <div key={i} className="modal-question-item">
                  {q}
                </div>
              ))}
            </div>
          )}

          <button
            className="bid-btn"
            onClick={() => onBidClick(task)}
          >
            💼 Bid on This Task
          </button>
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
    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    setLoading(true);
    setStep('processing');

    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: 50,
        phone,
      }),
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
      <div
        className="pay-modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="pay-modal-header">
          <div className="pay-modal-title">BUSINESS HUB</div>

          <button
            className="modal-close"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            ×
          </button>
        </div>

        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              <div className="pay-message">
                Activate your account for <strong>KES 50</strong> to start
                bidding on tasks and earning money.
              </div>

              <div className="pay-amount">
                <div className="pay-amount-label">
                  One-time activation fee
                </div>

                <div className="pay-amount-value">KES 50</div>

                <div className="pay-amount-sub">
                  Lifetime access • No hidden fees
                </div>
              </div>

              <div className="pay-phone-label">
                M-Pesa / Mobile Money Number
              </div>

              <input
                className="pay-phone-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />

              <button
                className="pay-btn"
                onClick={handlePay}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Processing...
                  </>
                ) : (
                  '🔒 Pay via Paystack'
                )}
              </button>

              <div className="pay-secure">
                🔐 Secured by Paystack · M-Pesa supported
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div
                className="spinner"
                style={{
                  width: 40,
                  height: 40,
                  borderTopColor: 'var(--blue)',
                  borderColor: 'var(--gray-light)',
                  borderWidth: 3,
                  margin: '0 auto 16px',
                }}
              />

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
    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: 130,
        phone,
        plan: 'premium',
      }),
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
      <div
        className="pay-modal-card"
        style={{ maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="pay-modal-header"
          style={{
            background: 'linear-gradient(135deg, #0047FF, #7C3AED)',
          }}
        >
          <div>
            <div className="pay-modal-title">⭐ PREMIUM</div>

            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 2,
              }}
            >
              Unlock full platform access
            </div>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            ×
          </button>
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
            <div className="pay-amount-label">
              Weekly Premium Plan
            </div>

            <div
              className="pay-amount-value"
              style={{
                background:
                  'linear-gradient(135deg,#0047FF,#7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              KES 130
            </div>

            <div className="pay-amount-sub">
              per week · Cancel anytime
            </div>
          </div>

          <div className="pay-phone-label">
            M-Pesa / Mobile Money Number
          </div>

          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
          />

          <button
            className="pay-btn"
            style={{
              background:
                'linear-gradient(135deg,#0047FF,#7C3AED)',
            }}
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Processing...
              </>
            ) : (
              '⭐ Upgrade to Premium'
            )}
          </button>

          <div className="pay-secure">
            🔐 Secured by Paystack · M-Pesa supported
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Modal ───────────────────────────────────────────────────────────
function ReferralModal({ user, onClose }) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${
    user?.id || 'USER123'
  }`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);

      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pay-modal-card"
        style={{ maxWidth: 460 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="pay-modal-header"
          style={{
            background:
              'linear-gradient(135deg, #059669, #0047FF)',
          }}
        >
          <div>
            <div className="pay-modal-title">
              🔗 Your Referral Link
            </div>

            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 2,
              }}
            >
              Earn KES 100 per referral
            </div>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            ×
          </button>
        </div>

        <div className="pay-modal-body">
          <div
            className="pay-message"
            style={{
              borderColor: '#059669',
              background: '#F0FFF4',
            }}
          >
            Share your referral link and earn{' '}
            <strong style={{ color: '#059669' }}>
              KES 100
            </strong>{' '}
            for every friend who signs up and activates their
            account.
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="pay-phone-label">
              Your unique referral link
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="pay-phone-input"
                value={referralLink}
                readOnly
                style={{
                  fontSize: 13,
                  flex: 1,
                  marginBottom: 0,
                  letterSpacing: 0,
                }}
              />

              <button
                onClick={copyLink}
                style={{
                  padding: '0 20px',
                  background: copied
                    ? '#059669'
                    : 'var(--blue)',
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
        </div>
      </div>
    </div>
  );
}