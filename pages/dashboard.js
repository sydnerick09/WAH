// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
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
        </div>

        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              <p>Activate account for KES 50</p>

              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="M-Pesa number"
              />

              <button onClick={handlePay} disabled={loading}>
                {loading
                  ? 'Processing...'
                  : 'Pay via Paystack (M-Pesa supported)'}
              </button>
            </>
          )}

          {step === 'processing' && (
            <p>Redirecting to payment...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [payTask, setPayTask] = useState(null);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Fake animated withdrawals
  // Fake animated withdrawals
const withdrawals = [
  {
    flag: '🇰🇪',
    country: 'Kenya',
    phone: '+25471*****78',
    amount: 450,
  },
  {
    flag: '🇺🇬',
    country: 'Uganda',
    phone: '+25670*****44',
    amount: 1200,
  },
  {
    flag: '🇹🇿',
    country: 'Tanzania',
    phone: '+25575*****33',
    amount: 800,
  },
  {
    flag: '🇳🇬',
    country: 'Nigeria',
    phone: '+23481*****55',
    amount: 1500,
  },
  {
    flag: '🇬🇭',
    country: 'Ghana',
    phone: '+23354*****23',
    amount: 650,
  },
  {
    flag: '🇷🇼',
    country: 'Rwanda',
    phone: '+25078*****56',
    amount: 300,
  },
  {
    flag: '🇿🇦',
    country: 'South Africa',
    phone: '+27821*****67',
    amount: 1100,
  },
  {
    flag: '🇪🇹',
    country: 'Ethiopia',
    phone: '+25191*****44',
    amount: 950,
  },
  {
    flag: '🇨🇲',
    country: 'Cameroon',
    phone: '+23767*****67',
    amount: 500,
  },
  {
    flag: '🇲🇼',
    country: 'Malawi',
    phone: '+26599*****44',
    amount: 250,
  },
];

  const [currentWithdrawal, setCurrentWithdrawal] = useState(
    withdrawals[0]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const random =
        withdrawals[
          Math.floor(Math.random() * withdrawals.length)
        ];

      setCurrentWithdrawal(random);
    }, 20000);

    return () => clearInterval(interval);
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

  useEffect(() => {
    setMounted(true);

    const u = getCurrentUser();

    if (!u) {
      router.replace('/login');
    } else {
      setUser(u);
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [router]);

  const handleBidClick = useCallback(task => {
    setSelectedTask(null);
    setPayTask(task);
  }, []);

  const handlePaySuccess = useCallback(() => {
    const updated = activateUser(user.id);

    if (updated) setUser(updated);
  }, [user]);

  const filteredTasks = TASKS.filter(t => {
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
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className="dashboard">

      {/* Fake Withdrawal Animation */}
      <div
        style={{
          position: 'fixed',
          top: 90,
          right: 20,
          zIndex: 999,
          animation: 'slideIn 0.5s ease',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--gray-light)',
            borderRadius: 14,
            padding: '14px 18px',
            minWidth: 280,
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: 'var(--gray)',
              marginBottom: 6,
            }}
          >
            Recent Withdrawal
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 30 }}>
              {currentWithdrawal.flag}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'var(--black)',
                }}
              >
                {currentWithdrawal.phone}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--gray)',
                }}
              >
                {currentWithdrawal.country}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              fontWeight: 700,
              color: 'green',
              fontSize: 16,
            }}
          >
            Withdrawn KES{' '}
            {currentWithdrawal.amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Nav */}
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
              ⏏ Logout
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

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">📋</div>

            <div>
              <div className="dash-stat-num">
                {TASKS.length}
              </div>

              <div className="dash-stat-label">
                Available Tasks
              </div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💼</div>

            <div>
              <div className="dash-stat-num">0</div>

              <div className="dash-stat-label">
                Active Bids
              </div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">✅</div>

            <div>
              <div className="dash-stat-num">0</div>

              <div className="dash-stat-label">
                Completed Tasks
              </div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💰</div>

            <div>
              <div className="dash-stat-num">
                KES {(user.balance || 0).toLocaleString()}
              </div>

              <div className="dash-stat-label">
                Total Earned
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div className="dash-section-title">
            Available Tasks
          </div>

          <div className="dash-section-sub">
            Browse and bid on tasks that match your skills
          </div>

          {/* Search */}
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
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '10px 16px',
                border: '1.5px solid var(--gray-light)',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: 'var(--black)',
                background: 'var(--white)',
              }}
            />
          </div>

          {/* Category Filter */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {categories.map(cat => (
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
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: 'var(--gray)',
            }}
          >
            Showing <strong>{filteredTasks.length}</strong>{' '}
            tasks
          </div>

          <div className="tasks-grid">
            {filteredTasks.map(task => {
              const avatarLetter = task.poster
                .charAt(0)
                .toUpperCase();

              return (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    <div className="task-poster">
                      <div className="task-poster-avatar">
                        {avatarLetter}
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
                    onClick={() =>
                      setSelectedTask(task)
                    }
                  >
                    👁️ View / Bid
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          user={user}
          onClose={() => setSelectedTask(null)}
          onBidClick={handleBidClick}
        />
      )}

      {/* Payment Modal */}
      {payTask && (
        <PaymentModal
          task={payTask}
          user={user}
          onClose={() => setPayTask(null)}
          onSuccess={handlePaySuccess}
        />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(40px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
} 