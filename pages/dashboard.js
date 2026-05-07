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
              <div style={{ fontSize: 13, color: 'var(--blue)', opacity: 0.7, marginTop: 2 }}>Paid on approval</div>
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
  const [step, setStep] = useState('prompt'); // 'prompt' | 'processing' | 'success'

  function handlePay() {
    if (!phone.trim() || !/^(07|01|\+2547|\+2541)\d{8}$/.test(phone.replace(/\s/g, ''))) {
      alert('Please enter a valid Kenyan M-Pesa number.');
      return;
    }
    setLoading(true);
    setStep('processing');
    // Simulate Paystack/M-Pesa flow
    setTimeout(() => {
      setStep('success');
      setLoading(false);
      onSuccess();
    }, 3000);
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const username = '@' + (user?.fullName?.toLowerCase().replace(/\s+/g, '') || 'user');

  return (
    <div className="modal-overlay" onClick={step === 'success' ? onClose : undefined}>
      <div className="pay-modal-card" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div className="pay-modal-title">BUSINESS HUB</div>
          {step !== 'processing' && (
            <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>×</button>
          )}
        </div>
        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              <div className="pay-message">
                Hello <strong>{username}</strong>, to access tasks and have your bids accepted,
                you must activate your account with a <strong>one-time fee of KES 50</strong>.
                This unlocks unlimited task access and bidding.
              </div>

              <div className="pay-amount">
                <div className="pay-amount-label">Activation Fee</div>
                <div className="pay-amount-value">KES 50</div>
                <div className="pay-amount-sub">One-time payment · Never charged again</div>
              </div>

              <div className="pay-phone-label">M-Pesa Phone Number</div>
              <input
                type="tel"
                className="pay-phone-input"
                placeholder="0712 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />

              <button className="pay-btn" onClick={handlePay}>
                📱 Pay KES 50 via M-Pesa
              </button>
              <div className="pay-secure">
                🔒 Secured by Paystack · M-Pesa Integrated
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>📱</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Check Your Phone</h3>
              <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 24 }}>
                An M-Pesa prompt has been sent to <strong>{phone}</strong>.<br />
                Enter your M-Pesa PIN to complete the payment of <strong>KES 50</strong>.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div className="spinner" style={{ borderTopColor: 'var(--blue)', borderColor: 'var(--gray-light)' }} />
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>Awaiting payment confirmation...</span>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="pay-success">
              <div className="pay-success-icon">🎉</div>
              <h3>Account Activated!</h3>
              <p style={{ marginBottom: 16 }}>
                Congratulations <strong>{firstName}</strong>! Your account is now fully activated.
                You can now bid on any task and start earning on Business Hub.
              </p>
              <div style={{
                background: 'var(--blue-pale)',
                border: '1px solid rgba(0,71,255,0.2)',
                borderRadius: 8,
                padding: '16px',
                marginBottom: 24,
                fontSize: 14,
                color: 'var(--blue)',
                fontWeight: 600,
              }}>
                ✅ Account Status: ACTIVE<br />
                <span style={{ fontWeight: 400, color: 'var(--gray)', fontSize: 13 }}>
                  Payment of KES 50 confirmed via M-Pesa
                </span>
              </div>
              <button className="bid-btn" onClick={onClose}>
                Go to Dashboard →
              </button>
            </div>
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

  const categories = ['All', 'Writing', 'Research', 'Data Entry', 'Design', 'Marketing', 'Transcription', 'Translation', 'Survey', 'Testing', 'Audio', 'Education', 'Admin'];

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

  const handleBidClick = useCallback((task) => {
    setSelectedTask(null);
    setPayTask(task);
  }, []);

  const handlePaySuccess = useCallback(() => {
    const updated = activateUser(user.id);
    if (updated) setUser(updated);
  }, [user]);

  const filteredTasks = TASKS.filter(t => {
    const matchCat = filter === 'All' || t.category === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
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

  return (
    <div className="dashboard">
      {/* Nav */}
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <Link href="/" className="dash-logo">BUSINESS HUB</Link>
          <div className="dash-user">
            <div className="dash-user-info">
              <div className="dash-user-name">{user.fullName}</div>
              <div className="dash-user-email">{user.email}</div>
            </div>
            <div className="dash-avatar">{initials}</div>
            <button className="logout-btn" onClick={handleLogout}>
              ⏏ Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="dash-main">
        {/* Welcome Banner */}
        <div className="dash-welcome">
          <div className="dash-welcome-text">
            <h2>Welcome back, {user.fullName.split(' ')[0]}! 👋</h2>
            <p>{user.email} · {user.country}</p>
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

        {/* Tasks Section */}
        <div>
          <div className="dash-section-title">Available Tasks</div>
          <div className="dash-section-sub">Browse and bid on tasks that match your skills</div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 100,
                  border: '1.5px solid',
                  borderColor: filter === cat ? 'var(--blue)' : 'var(--gray-light)',
                  background: filter === cat ? 'var(--blue)' : 'var(--white)',
                  color: filter === cat ? 'var(--white)' : 'var(--gray)',
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

          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--gray)' }}>
            Showing <strong>{filteredTasks.length}</strong> tasks
          </div>

          <div className="tasks-grid">
            {filteredTasks.map(task => {
              const avatarLetter = task.poster.charAt(0).toUpperCase();
              return (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    <div className="task-poster">
                      <div className="task-poster-avatar">{avatarLetter}</div>
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
                  <button
                    className="task-view-btn"
                    onClick={() => setSelectedTask(task)}
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
    </div>
  );
}
