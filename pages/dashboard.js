// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
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
      'mailto:businesshub.comke@gmail.com?subject=' +
      subject +
      '&body=' +
      body;
  }

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

          {!isActivated && (
            <button
              className="bid-btn"
              onClick={() => onBidClick(task)}
            >
              💼 Bid on This Task
            </button>
          )}

          {isActivated && (
            <button
              className="submit-btn"
              onClick={handleSubmit}
            >
              📤 Submit This Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ───────────────────────────────────────────────────────────
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
    } catch (error) {
      console.error(error);
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
          <div className="pay-modal-title">BUSINESS HUB</div>

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
                🔐 Secured by Paystack • M-Pesa supported
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [payTask, setPayTask] = useState(null);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);

    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    // ─── UPDATED BALANCE HERE ─────────────────────────────
    const updatedUser = {
      ...currentUser,
      balance: 1000,
    };

    setUser(updatedUser);
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [router]);

  const handleViewTask = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  const handleBidClick = useCallback((task) => {
    setSelectedTask(null);
    setPayTask(task);
  }, []);

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

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <Link href="/" className="dash-logo">
            BUSINESS HUB
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
        {/* Welcome Banner */}
        <div className="dash-welcome">
          <div className="dash-welcome-text">
            <h2>
              Welcome back,{' '}
              {user.fullName.split(' ')[0]}! 👋
            </h2>

            <p>
              {user.email} • {user.country}
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
                  : '⚠️ Account Inactive'}
              </span>
            </div>
          </div>

          {/* ─── UPDATED ACCOUNT BALANCE ───────────────── */}
          <div className="dash-balance-box">
            <div className="dash-balance-label">
              Account Balance
            </div>

            <div className="dash-balance-amount">
              KES 1,000
            </div>

            <div className="dash-balance-sub">
              Available for withdrawal
            </div>
          </div>
        </div>

        {/* Tasks */}
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
                      {task.poster
                        .charAt(0)
                        .toUpperCase()}
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

                <div className="task-actions">
                  <button
                    className="task-view-btn"
                    onClick={() => handleViewTask(task)}
                  >
                    👁️ View / Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
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

      <style jsx>{`
        .dash-balance-amount {
          font-size: 34px;
          font-weight: 800;
          color: var(--blue);
        }
      `}</style>
    </div>
  );
}