// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

const withdrawals = [
  { flag: '🇰🇪', country: 'Kenya', phone: '+254 7*** ***421', amount: 1200 },
  { flag: '🇺🇬', country: 'Uganda', phone: '+256 7*** ***908', amount: 950 },
  { flag: '🇹🇿', country: 'Tanzania', phone: '+255 6*** ***112', amount: 1800 },
  { flag: '🇷🇼', country: 'Rwanda', phone: '+250 7*** ***665', amount: 700 },
  { flag: '🇧🇮', country: 'Burundi', phone: '+257 6*** ***245', amount: 1450 },
  { flag: '🇸🇸', country: 'South Sudan', phone: '+211 9*** ***873', amount: 2000 },
];

function WithdrawalPopup() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setCurrent(prev => (prev + 1) % withdrawals.length);
        setVisible(true);
      }, 500);

    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const item = withdrawals[current];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        transition: 'all 0.4s ease',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0)'
          : 'translateY(20px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '14px 18px',
          width: 310,
          boxShadow: '0 10px 35px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#0f172a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          💸
        </div>

        <div>
          <div
            style={{
              fontWeight: 700,
              color: '#111827',
              fontSize: 14,
            }}
          >
            Successful Withdrawal
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#4b5563',
              marginTop: 3,
            }}
          >
            {item.flag} {item.phone}
          </div>

          <div
            style={{
              marginTop: 4,
              color: '#2563eb',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            KES {item.amount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            {task.title}
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">

          <div className="modal-meta">

            <div className="modal-meta-item">
              <div className="modal-meta-label">
                Posted By
              </div>

              <div className="modal-meta-value">
                👤 {task.poster}
              </div>
            </div>

            <div className="modal-meta-item">
              <div className="modal-meta-label">
                Location
              </div>

              <div className="modal-meta-value">
                📍 {task.location}
              </div>
            </div>

            <div className="modal-meta-item">
              <div className="modal-meta-label">
                Category
              </div>

              <div className="modal-meta-value">
                🏷️ {task.category}
              </div>
            </div>

          </div>

          <div className="modal-payment">
            <div>
              <div className="modal-payment-label">
                Task Payment
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--blue)',
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                Paid after approval
              </div>
            </div>

            <div className="modal-payment-amount">
              KES {task.payment.toLocaleString()}
            </div>
          </div>

          <p className="modal-desc">
            {task.description}
          </p>

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

function PaymentModal({
  task,
  user,
  onClose,
  onSuccess
}) {

  const [phone, setPhone] = useState(
    user?.phone || ''
  );

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

      const res = await fetch(
        '/api/paystack/initialize',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email: user.email,
            amount: 50,
            phone,
            taskId: task.id,
          }),
        }
      );

      const data = await res.json();

      if (data.status) {

        setTimeout(() => {
          window.location.href =
            data.data.authorization_url;
        }, 1200);

      } else {

        alert(
          data.message ||
          'Payment initialization failed'
        );

        setStep('prompt');
      }

    } catch (err) {

      alert('Something went wrong');

      setStep('prompt');

    } finally {

      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="pay-modal-card"
        onClick={e => e.stopPropagation()}
      >

        <div className="pay-modal-header">
          <div className="pay-modal-title">
            BUSINESS HUB
          </div>
        </div>

        <div className="pay-modal-body">

          {step === 'prompt' && (
            <>

              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 44,
                    marginBottom: 10,
                  }}
                >
                  📲
                </div>

                <h3
                  style={{
                    marginBottom: 6,
                  }}
                >
                  Activate Account
                </h3>

                <p
                  style={{
                    color: '#6b7280',
                    fontSize: 14,
                  }}
                >
                  One-time activation fee
                </p>
              </div>

              <input
                value={phone}
                onChange={e =>
                  setPhone(e.target.value)
                }
                placeholder="Enter M-Pesa Number"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border:
                    '1.5px solid #d1d5db',
                  marginBottom: 16,
                  fontSize: 15,
                }}
              />

              <button
                onClick={handlePay}
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#2563eb',
                  color: '#fff',
                  padding: '14px',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.3s',
                  fontSize: 15,
                }}
              >
                {loading
                  ? 'Processing...'
                  : 'Pay KES 50'}
              </button>

            </>
          )}

          {step === 'processing' && (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
              }}
            >

              <div
                className="spinner"
                style={{
                  margin: '0 auto 18px',
                  width: 45,
                  height: 45,
                  borderWidth: 4,
                }}
              />

              <h3>Redirecting...</h3>

              <p
                style={{
                  color: '#6b7280',
                  marginTop: 8,
                }}
              >
                Secure Paystack checkout
              </p>

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

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [payTask, setPayTask] =
    useState(null);

  const [filter, setFilter] =
    useState('All');

  const [search, setSearch] =
    useState('');

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

  const handleBidClick = useCallback(
    task => {

      setSelectedTask(null);
      setPayTask(task);

    },
    []
  );

  const handlePaySuccess =
    useCallback(() => {

      const updated =
        activateUser(user.id);

      if (updated) {
        setUser(updated);
      }

    }, [user]);

  const filteredTasks = TASKS.filter(t => {

    const matchCat =
      filter === 'All' ||
      t.category === filter;

    const matchSearch =
      !search ||
      t.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      t.description
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchCat && matchSearch;

  });

  if (!mounted || !user) {
    return null;
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

      <WithdrawalPopup />

      <nav className="dash-navbar">

        <div className="dash-navbar-inner">

          <Link
            href="/"
            className="dash-logo"
          >
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

            <div className="dash-avatar">
              {initials}
            </div>

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

        <div className="dash-welcome">

          <div className="dash-welcome-text">

            <h2>
              Welcome back,
              {' '}
              {user.fullName.split(' ')[0]} 👋
            </h2>

            <p>
              {user.email} · {user.country}
            </p>

          </div>

          <div className="dash-balance-box">

            <div className="dash-balance-label">
              Account Balance
            </div>

            <div className="dash-balance-amount">
              KES 2,356
            </div>

            <div className="dash-balance-sub">
              Available for withdrawal
            </div>

          </div>

        </div>

        <div className="tasks-grid">

          {filteredTasks.map(task => (

            <div
              key={task.id}
              className="task-card"
            >

              <div className="task-payment">
                KES {task.payment.toLocaleString()}
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
          ))}

        </div>

      </main>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          user={user}
          onClose={() =>
            setSelectedTask(null)
          }
          onBidClick={handleBidClick}
        />
      )}

      {payTask && (
        <PaymentModal
          task={payTask}
          user={user}
          onClose={() =>
            setPayTask(null)
          }
          onSuccess={handlePaySuccess}
        />
      )}

    </div>
  );
}