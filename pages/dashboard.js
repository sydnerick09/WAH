// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─────────────────────────────────────────────────────────────────────────────
// TASK MODAL
// ─────────────────────────────────────────────────────────────────────────────

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

          <button className="bid-btn" onClick={() => onBidClick(task)}>
            💼 Bid on This Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function PaymentModal({ task, user, onClose, onSuccess }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('prompt');

  async function handlePay() {
    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    try {
      setLoading(true);
      setStep('processing');

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: 50,
          phone,
          type: 'activation',
          callback_url:
            'https://onlinejob-pi.vercel.app/dashboard?payment=success',
        }),
      });

      const data = await res.json();

      if (data.status && data.data.authorization_url) {
        localStorage.setItem(
          'pendingActivation',
          JSON.stringify({
            userId: user.id,
          })
        );

        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment failed');
        setStep('prompt');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
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
                Activate your account for <strong>KES 50</strong> to
                start bidding on tasks and earning money.
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
                    <span className="spinner" />
                    Processing...
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

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM MODAL
// ─────────────────────────────────────────────────────────────────────────────

function UpgradeModal({ user, onClose }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: 130,
          phone,
          plan: 'premium',
          callback_url:
            'https://onlinejob-pi.vercel.app/dashboard?premium=success',
        }),
      });

      const data = await res.json();

      if (data.status && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment initiation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
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
              weekly subscription
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
                <span className="spinner" />
                Processing...
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [payTask, setPayTask] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All',
    'Writing',
    'Research',
    'Data Entry',
    'Design',
    'Marketing',
    'Transcription',
    'Translation',
    'Survey',
    'Testing',
    'Audio',
    'Education',
    'Admin',
  ];

  useEffect(() => {
    setMounted(true);

    const u = getCurrentUser();

    if (!u) {
      router.replace('/login');
      return;
    }

    // PAYMENT SUCCESS CHECK
    const params = new URLSearchParams(window.location.search);

    const paymentSuccess = params.get('payment');
    const premiumSuccess = params.get('premium');

    let updatedUser = u;

    // ACTIVATE USER AFTER SUCCESSFUL PAYMENT
    if (paymentSuccess === 'success' && !u.activated) {
      const activated = activateUser(u.id);

      if (activated) {
        updatedUser = {
          ...activated,
          activated: true,
        };

        localStorage.setItem(
          'currentUser',
          JSON.stringify(updatedUser)
        );

        alert('✅ Account activated successfully!');
      }
    }

    // PREMIUM SUCCESS
    if (premiumSuccess === 'success') {
      updatedUser = {
        ...updatedUser,
        premium: true,
      };

      localStorage.setItem(
        'currentUser',
        JSON.stringify(updatedUser)
      );

      alert('⭐ Premium upgraded successfully!');
    }

    setUser(updatedUser);
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [router]);

  const handleBidClick = useCallback((task) => {
    setSelectedTask(null);
    setPayTask(task);
  }, []);

  const filteredTasks = TASKS.filter((t) => {
    const matchCat =
      filter === 'All' || t.category === filter;

    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchCat && matchSearch;
  });

  if (!mounted || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--white-off)',
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
          }}
        />
      </div>
    );
  }

  const initials =
    user.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  // UPDATED REFERRAL LINK
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${
    user.id || 'USER123'
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

            <div className="dash-avatar">{initials}</div>
          </div>
        </div>
      </nav>

      <main className="dash-main">
        {/* WELCOME */}

        <div className="dash-welcome">
          <div className="dash-welcome-text">
            <h2>
              Welcome back, {user.fullName.split(' ')[0]}! 👋
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

        {/* REFERRAL BANNER */}

        <div
          className="referral-banner"
          onClick={() => {
            navigator.clipboard.writeText(referralLink);

            alert('Referral link copied!');
          }}
        >
          <div className="referral-banner-left">
            <span className="referral-banner-icon">🔗</span>

            <div>
              <div className="referral-banner-title">
                Refer Friends & Earn KES 70 Each
              </div>

              <div className="referral-banner-sub">
                Share your link · Track referrals · Get paid
              </div>
            </div>
          </div>

          <div className="referral-banner-link">
            <span className="referral-link-preview">
              {referralLink.replace('https://', '')}
            </span>

            <button className="referral-copy-btn">
              Copy Link →
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}

        <div className="quick-actions">
          <button
            className="quick-action-card"
            onClick={() => setShowUpgrade(true)}
          >
            <span className="quick-action-icon">⭐</span>

            <span className="quick-action-label">
              Upgrade Premium
            </span>
          </button>
        </div>

        {/* TASKS */}

        <div id="tasks-section">
          <div className="dash-section-title">
            Available Tasks
          </div>

          <div className="dash-section-sub">
            Browse and bid on tasks that match your skills
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '10px 16px',
                border: '1.5px solid var(--gray-light)',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 100,
                  border: '1.5px solid',
                  borderColor:
                    filter === cat
                      ? 'var(--blue)'
                      : 'var(--gray-light)',
                  background:
                    filter === cat
                      ? 'var(--blue)'
                      : 'var(--white)',
                  color:
                    filter === cat
                      ? 'var(--white)'
                      : 'var(--gray)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="tasks-grid">
            {filteredTasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-poster">
                    <div className="task-poster-avatar">
                      {task.poster.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="task-poster-name">
                        {task.poster}
                      </div>

                      <div className="task-poster-date">
                        {task.datePosted}
                      </div>
                    </div>
                  </div>

                  <div className="task-payment">
                    KES {task.payment.toLocaleString()}
                  </div>
                </div>

                <div className="task-category">
                  {task.category}
                </div>

                <div className="task-title">
                  {task.title}
                </div>

                <div className="task-desc">
                  {task.description}
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
        </div>
      </main>

      {/* MODALS */}

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