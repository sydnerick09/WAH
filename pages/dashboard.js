// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

const WITHDRAWALS = [
  {
    country: 'Kenya',
    flag: '🇰🇪',
    number: '+254 7*** ***321',
    amount: 'KES 12,400'
  },
  {
    country: 'Uganda',
    flag: '🇺🇬',
    number: '+256 7*** ***118',
    amount: 'UGX 480,000'
  },
  {
    country: 'Tanzania',
    flag: '🇹🇿',
    number: '+255 6*** ***947',
    amount: 'TZS 210,000'
  },
  {
    country: 'Rwanda',
    flag: '🇷🇼',
    number: '+250 7*** ***604',
    amount: 'RWF 95,000'
  },
  {
    country: 'Burundi',
    flag: '🇧🇮',
    number: '+257 6*** ***882',
    amount: 'BIF 320,000'
  },
];

function WithdrawalPopup() {
  const [current, setCurrent] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);

      setTimeout(() => {
        setCurrent(prev =>
          prev === WITHDRAWALS.length - 1 ? 0 : prev + 1
        );

        setShow(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const item = WITHDRAWALS[current];

  return (
    <div
      className={`withdraw-popup ${
        show ? 'withdraw-show' : 'withdraw-hide'
      }`}
    >
      <div className="withdraw-icon">💸</div>

      <div>
        <div className="withdraw-title">
          Successful Withdrawal
        </div>

        <div className="withdraw-text">
          {item.flag} {item.number}
        </div>

        <div className="withdraw-amount">
          {item.amount}
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
                Date Posted
              </div>

              <div className="modal-meta-value">
                📅 {task.datePosted}
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
                  marginTop: 2
                }}
              >
                Paid on approval
              </div>
            </div>

            <div className="modal-payment-amount">
              KES {task.payment.toLocaleString()}
            </div>

          </div>

          <p className="modal-desc">
            {task.description}
          </p>

          {task.questions &&
            task.questions.length > 0 && (
              <div className="modal-questions">
                <h4>
                  Questions from Poster
                </h4>

                {task.questions.map((q, i) => (
                  <div
                    key={i}
                    className="modal-question-item"
                  >
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

function PaymentModal({
  task,
  user,
  onClose,
  onSuccess
}) {
  const [phone, setPhone] = useState(
    user?.phone || ''
  );

  const [loading, setLoading] =
    useState(false);

  const [step, setStep] =
    useState('prompt');

  async function handlePay() {
    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const res = await fetch(
        '/api/paystack/initialize',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            amount: 50,
            phone,
          }),
        }
      );

      const data = await res.json();

      if (data.status) {
        setStep('success');

        setTimeout(() => {
          window.location.href =
            data.data.authorization_url;
        }, 1500);
      } else {
        alert('Payment failed');
        setStep('prompt');
      }
    } catch (err) {
      alert('Something went wrong');
      setStep('prompt');
    }

    setLoading(false);
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="pay-modal-card"
        onClick={e =>
          e.stopPropagation()
        }
      >
        <div className="pay-modal-header">
          <div className="pay-modal-title">
            BUSINESS HUB
          </div>
        </div>

        <div className="pay-modal-body">

          {step === 'prompt' && (
            <>
              <div className="pay-icon">
                💳
              </div>

              <h3>
                Activate Account
              </h3>

              <p>
                Pay KES 50 to activate
                bidding
              </p>

              <input
                value={phone}
                onChange={e =>
                  setPhone(e.target.value)
                }
                placeholder="Enter M-Pesa Number"
              />

              <button
                onClick={handlePay}
                disabled={loading}
                className="pay-btn"
              >
                {loading
                  ? 'Processing...'
                  : 'Pay via Paystack'}
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="payment-processing">
              <div className="spinner"></div>

              <h3>
                Processing Payment
              </h3>

              <p>
                Please wait...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="payment-success">
              <div className="success-check">
                ✓
              </div>

              <h3>
                Payment Initialized
              </h3>

              <p>
                Redirecting securely...
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

  const [mounted, setMounted] =
    useState(false);

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
    'Admin'
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
    (task) => {
      setSelectedTask(null);
      setPayTask(task);
    },
    []
  );

  const handlePaySuccess =
    useCallback(() => {
      const updated = activateUser(
        user.id
      );

      if (updated) {
        setUser(updated);
      }
    }, [user]);

  const filteredTasks = TASKS.filter(
    t => {
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
    }
  );

  if (!mounted || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'var(--white-off)'
        }}
      >
        <div
          className="spinner"
          style={{
            width: 40,
            height: 40,
            borderTopColor:
              'var(--blue)',
            borderColor:
              'var(--gray-light)',
            borderWidth: 3
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

      {/* WITHDRAW POPUP */}
      <WithdrawalPopup />

      {/* NAVBAR */}
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

      {/* MAIN CONTENT */}
      <main className="dash-main">

        {/* YOUR EXISTING CONTENT HERE */}

      </main>

      {/* MODALS */}
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