// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

/* ─────────────────────────────────────────────────────────────
   TASK MODAL
───────────────────────────────────────────────────────────── */
function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;

  const isActivated = user?.activated;

  function handleSubmit() {
    const subject = encodeURIComponent('Task Submission: ' + task.title);

    const body = encodeURIComponent(
      `Hello Business Hub,

I am submitting my completed task.

Task: ${task.title}
Category: ${task.category}
Payment: KES ${task.payment.toLocaleString()}

Please review my work.

Submitted by:
${user?.fullName || ''}`
    );

    window.location.href =
      `mailto:businesshub.comke@gmail.com?subject=${subject}&body=${body}`;
  }

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

          <div className="modal-payment">
            <div>
              <div className="modal-payment-label">
                Task Payment
              </div>
            </div>

            <div className="modal-payment-amount">
              KES {task.payment.toLocaleString()}
            </div>
          </div>

          <p className="modal-desc">{task.description}</p>

          {!isActivated ? (
            <button
              className="bid-btn"
              onClick={() => onBidClick(task)}
            >
              💼 Bid on This Task
            </button>
          ) : (
            <button
              className="submit-btn"
              onClick={handleSubmit}
            >
              📤 Submit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAYMENT MODAL
───────────────────────────────────────────────────────────── */
function PaymentModal({ task, user, onClose, onSuccess }) {

  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handlePay() {

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
          amount: 50,
          phone,
          metadata: {
            userId: user.id,
            type: 'activation',
          },
        }),
      });

      const data = await res.json();

      if (data.status) {

        // save pending activation
        localStorage.setItem('pendingActivation', user.id);

        window.location.href =
          data.data.authorization_url;

      } else {

        alert('Payment initialization failed');

      }

    } catch (err) {

      alert('Something went wrong');

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
          <div className="pay-modal-title">
            BUSINESS HUB
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="pay-modal-body">

          <div className="pay-message">

            Activate your account for
            <strong> KES 50 </strong>
            to start bidding on tasks.

          </div>

          <div className="pay-amount">

            <div className="pay-amount-label">
              One-time Activation Fee
            </div>

            <div className="pay-amount-value">
              KES 50
            </div>

          </div>

          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+2547XXXXXXXX"
          />

          <button
            className="pay-btn"
            onClick={handlePay}
            disabled={loading}
          >

            {loading
              ? 'Processing...'
              : '🔒 Pay via Paystack'}

          </button>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PREMIUM MODAL
───────────────────────────────────────────────────────────── */
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

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({

        email: user.email,

        amount: 500,

        phone,

        plan: 'premium',

      }),

    });

    const data = await res.json();

    if (data.status) {

      window.location.href =
        data.data.authorization_url;

    } else {

      alert('Payment failed');

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

          <div className="pay-modal-title">
            ⭐ PREMIUM
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="pay-modal-body">

          <div className="pay-amount">

            <div className="pay-amount-label">
              Premium Membership
            </div>

            <div className="pay-amount-value">
              KES 500
            </div>

            <div className="pay-amount-sub">
              Monthly Subscription
            </div>

          </div>

          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+2547XXXXXXXX"
          />

          <button
            className="pay-btn"
            onClick={handleUpgrade}
            disabled={loading}
          >

            {loading
              ? 'Processing...'
              : '⭐ Upgrade to Premium'}

          </button>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────── */
export default function Dashboard() {

  const router = useRouter();

  const [user, setUser] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);

  const [payTask, setPayTask] = useState(null);

  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {

    const u = getCurrentUser();

    if (!u) {

      router.replace('/login');

      return;
    }

    // ACTIVATION AFTER PAYMENT
    const pendingActivation =
      localStorage.getItem('pendingActivation');

    if (pendingActivation === u.id) {

      const updatedUser = activateUser(u.id);

      if (updatedUser) {

        setUser(updatedUser);

        localStorage.removeItem('pendingActivation');

      } else {

        setUser(u);

      }

    } else {

      setUser(u);

    }

  }, [router]);

  const handleLogout = useCallback(() => {

    logout();

    router.push('/');

  }, [router]);

  if (!user) return null;

  return (
    <div className="dashboard">

      {/* NAVBAR */}

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

          </div>

        </div>

      </nav>

      {/* WELCOME */}

      <main className="dash-main">

        <div className="dash-welcome">

          <div className="dash-welcome-text">

            <h2>
              Welcome back, {user.fullName} 👋
            </h2>

            <div style={{ marginTop: 10 }}>

              <span
                className={`status-badge ${
                  user.activated
                    ? 'status-active'
                    : 'status-inactive'
                }`}
              >

                {user.activated
                  ? '✅ Account Active — Bid on Tasks'
                  : '⚠️ Account Inactive — Activate to Bid'}

              </span>

            </div>

          </div>

          <button
            className="pay-btn"
            onClick={() => setShowUpgrade(true)}
          >
            ⭐ Premium
          </button>

        </div>

        {/* TASKS */}

        <div className="tasks-grid">

          {TASKS.map(task => (

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
                👁️ View Task
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
          onBidClick={task => {
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