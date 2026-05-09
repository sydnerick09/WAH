// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const SITE_URL = 'https://onlinejob-pi.vercel.app';
const ACTIVATION_AMOUNT = 50;
const PREMIUM_AMOUNT = 130;

// ─────────────────────────────────────────────────────────────
// TASK MODAL
// ─────────────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{task.title}</div>

          <button className="modal-close" onClick={onClose}>
            ×
          </button>
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

// ─────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────────────────────
function PaymentModal({ task, user, onClose }) {
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

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: ACTIVATION_AMOUNT,
          phone,
          plan: 'activation',
        }),
      });

      const data = await res.json();

      if (data.status) {
        localStorage.setItem(
          'pendingActivation',
          JSON.stringify({
            userId: user.id,
            type: 'activation',
          })
        );

        window.location.href = data.data.authorization_url;
      } else {
        alert(data.message || 'Payment failed');
        setStep('prompt');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
      setStep('prompt');
    }

    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pay-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pay-modal-header">
          <div className="pay-modal-title">ONLINE JOB</div>

          <button
            className="modal-close"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
            }}
          >
            ×
          </button>
        </div>

        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              <div className="pay-message">
                Activate your account for{' '}
                <strong>KES {ACTIVATION_AMOUNT}</strong>{' '}
                to start bidding on tasks and earning money.
              </div>

              <div className="pay-amount">
                <div className="pay-amount-label">
                  One-time activation fee
                </div>

                <div className="pay-amount-value">
                  KES {ACTIVATION_AMOUNT}
                </div>

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
                onChange={(e) => setPhone(e.target.value)}
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
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
              }}
            >
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

// ─────────────────────────────────────────────────────────────
// UPGRADE MODAL
// ─────────────────────────────────────────────────────────────
function UpgradeModal({ user, onClose }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: PREMIUM_AMOUNT,
          phone,
          plan: 'premium',
        }),
      });

      const data = await res.json();

      if (data.status) {
        localStorage.setItem(
          'pendingActivation',
          JSON.stringify({
            userId: user.id,
            type: 'premium',
          })
        );

        window.location.href = data.data.authorization_url;
      } else {
        alert(data.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pay-modal-card"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pay-modal-header"
          style={{
            background:
              'linear-gradient(135deg, #0047FF, #7C3AED)',
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
            style={{
              background: 'rgba(255,255,255,0.15)',
            }}
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
              <div
                key={text}
                className="premium-feature-item"
              >
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
              KES {PREMIUM_AMOUNT}
            </div>

            <div className="pay-amount-sub">
              per week • Cancel anytime
            </div>
          </div>

          <div className="pay-phone-label">
            M-Pesa / Mobile Money Number
          </div>

          <input
            className="pay-phone-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
              `⭐ Upgrade to Premium — KES ${PREMIUM_AMOUNT}/week`
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

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [payTask, setPayTask] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    setMounted(true);

    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    setUser(currentUser);
  }, [router]);

  // ───────────────────────────────────────────────────────────
  // VERIFY PAYSTACK PAYMENT
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !user) return;

    const reference =
      router.query.reference || router.query.trxref;

    if (!reference) return;

    async function verifyPayment() {
      try {
        const pending = JSON.parse(
          localStorage.getItem('pendingActivation') || 'null'
        );

        if (!pending || pending.userId !== user.id) return;

        const res = await fetch(
          `/api/paystack/verify?reference=${reference}`
        );

        const data = await res.json();

        // PAYMENT SUCCESSFUL
        if (
          data.status &&
          data.data &&
          data.data.status === 'success'
        ) {
          // ACTIVATE ACCOUNT
          const updatedUser = activateUser(user.id);

          if (updatedUser) {
            const newUser = {
              ...updatedUser,
              activated: true,
              premium:
                pending.type === 'premium'
                  ? true
                  : updatedUser.premium,
            };

            setUser(newUser);

            // SAVE UPDATED USER
            localStorage.setItem(
              'currentUser',
              JSON.stringify(newUser)
            );
          }

          alert(
            pending.type === 'premium'
              ? 'Premium upgrade successful!'
              : 'Account activated successfully!'
          );

          localStorage.removeItem('pendingActivation');

          // CLEAN URL
          router.replace('/dashboard', undefined, {
            shallow: true,
          });
        } else {
          alert('Payment verification failed.');
        }
      } catch (err) {
        console.error(err);
      }
    }

    verifyPayment();
  }, [mounted, user, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [router]);

  if (!mounted || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading...
      </div>
    );
  }

  const referralLink = `${SITE_URL}/join?ref=${
    user?.id || 'USER123'
  }`;

  return (
    <div className="dashboard">
      {/* NAVBAR */}
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <Link href="/" className="dash-logo">
            ONLINE JOB
          </Link>

          <div className="dash-user">
            <div className="dash-user-info">
              <div className="dash-user-name">
                {user.fullName}
              </div>

              <div className="dash-user-email">
                {user.email}
              </div>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="dash-main">
        {/* WELCOME */}
        <div className="dash-welcome">
          <div className="dash-welcome-text">
            <h2>
              Welcome back,{' '}
              {user.fullName?.split(' ')[0]} 👋
            </h2>

            <p>
              {user.email} · {user.country}
            </p>

            <div style={{ marginTop: 12 }}>
              <span
                className={`status-badge ${
                  user.activated
                    ? 'status-active'
                    : 'status-inactive'
                }`}
              >
                {user.activated
                  ? '✅ Account Active'
                  : '⚠️ Account Inactive — Activate to Bid'}
              </span>
            </div>
          </div>

          <div className="dash-balance-box">
            <div className="dash-balance-label">
              Account Balance
            </div>

            <div className="dash-balance-amount">
              KES {(user.balance || 0).toLocaleString()}
            </div>

            <div className="dash-balance-sub">
              Available for withdrawal
            </div>
          </div>
        </div>

        {/* REFERRAL */}
        <div className="referral-banner">
          <div className="referral-banner-title">
            🔗 Referral Link
          </div>

          <div className="referral-link-preview">
            {referralLink}
          </div>
        </div>

        {/* PREMIUM */}
        <div className="quick-actions">
          <button
            className="quick-action-card"
            onClick={() => setShowUpgrade(true)}
          >
            ⭐ Upgrade Premium — KES {PREMIUM_AMOUNT}/week
          </button>
        </div>

        {/* TASKS */}
        <div className="tasks-grid">
          {TASKS.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-title">
                {task.title}
              </div>

              <div className="task-desc">
                {task.description}
              </div>

              <div className="task-payment">
                KES {task.payment.toLocaleString()}
              </div>

              <button
                className="task-view-btn"
                onClick={() => setSelectedTask(task)}
              >
                👁️ View / Bid
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODALS */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          user={user}
          onClose={() => setSelectedTask(null)}
          onBidClick={(task) => {
            setSelectedTask(null);
            setPayTask(task);
          }}
        />
      )}

      {payTask && (
        <PaymentModal
          task={payTask}
          user={user}
          onClose={() => setPayTask(null)}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          user={user}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}