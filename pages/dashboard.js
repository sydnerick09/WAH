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
      <div className="pay-modal-card" onClick={e => e.stopPropagation()}>
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
                Activate your account for <strong>KES 50</strong> to start bidding on tasks and earning money.
              </div>

              <div className="pay-amount">
                <div className="pay-amount-label">One-time activation fee</div>
                <div className="pay-amount-value">KES 50</div>
              </div>

              <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>

              <input
                className="pay-phone-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />

              <button className="pay-btn" onClick={handlePay} disabled={loading}>
                {loading ? 'Processing...' : '🔒 Pay via Paystack'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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

    const u = getCurrentUser();

    if (!u) {
      router.replace('/login');
    } else {
      setUser({
        ...u,
        balance: 1000, // UPDATED ACCOUNT BALANCE
      });
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [router]);

  const handleViewTask = useCallback(task => {
    setSelectedTask(task);
  }, []);

  const handleBidClick = useCallback(task => {
    setSelectedTask(null);
    setPayTask(task);
  }, []);

  const handlePaySuccess = useCallback(() => {
    const updated = activateUser(user.id);

    if (updated) {
      setUser({
        ...updated,
        balance: 1000, // UPDATED ACCOUNT BALANCE
      });
    }
  }, [user]);

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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--white-off)',
        }}
      >
        Loading...
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

      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <Link href="/" className="dash-logo">
            BUSINESS HUB
          </Link>

          <div className="dash-user">
            <div className="dash-user-info">
              <div className="dash-user-name">{user.fullName}</div>
              <div className="dash-user-email">{user.email}</div>
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
            <h2>Welcome back, {user.fullName.split(' ')[0]}! 👋</h2>

            <p>
              {user.email} • {user.country}
            </p>
          </div>

          <div className="dash-balance-box">
            <div className="dash-balance-label">Account Balance</div>

            {/* UPDATED BALANCE */}
            <div className="dash-balance-amount">KES 1,000</div>

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
              <div className="dash-stat-num">{TASKS.length}</div>
              <div className="dash-stat-label">Available Tasks</div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💰</div>

            <div>
              {/* UPDATED BALANCE */}
              <div className="dash-stat-num">KES 1,000</div>
              <div className="dash-stat-label">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div id="tasks-section">
          <div className="dash-section-title">Available Tasks</div>

          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: 8,
              }}
            />
          </div>

          <div className="tasks-grid">
            {filteredTasks.map(task => (
              <div key={task.id} className="task-card">

                <div className="task-card-header">
                  <div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-category">{task.category}</div>
                  </div>

                  <div className="task-payment">
                    KES {task.payment.toLocaleString()}
                  </div>
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
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}