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
              <div className="modal-meta-value">
                👤 {task.poster}
              </div>
            </div>

            <div className="modal-meta-item">
              <div className="modal-meta-label">Location</div>
              <div className="modal-meta-value">
                📍 {task.location}
              </div>
            </div>

            <div className="modal-meta-item">
              <div className="modal-meta-label">Date Posted</div>
              <div className="modal-meta-value">
                📅 {task.datePosted}
              </div>
            </div>

            <div className="modal-meta-item">
              <div className="modal-meta-label">Category</div>
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

          {task.questions && task.questions.length > 0 && (
            <div className="modal-questions">

              <h4>Questions from Poster</h4>

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
  onSuccess,
}) {
  const [phone, setPhone] = useState(
    user?.phone || ''
  );

  const [loading, setLoading] = useState(false);

  async function handlePay() {

    if (!phone.trim()) {
      alert('Enter phone number');
      return;
    }

    setLoading(true);

    try {

      // DIRECT PAYSTACK POPUP PAYMENT
      const response = await fetch(
        '/api/paystack/initialize',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: user.email,
            amount: 50,
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!data.status) {
        alert('Payment initialization failed');
        setLoading(false);
        return;
      }

      // LOAD PAYSTACK INLINE
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,

        email: user.email,

        amount: 5000, // KES 50 in cents

        currency: 'KES',

        ref: data.data.reference,

        metadata: {
          custom_fields: [
            {
              display_name: 'Phone Number',
              variable_name: 'phone_number',
              value: phone,
            },
          ],
        },

        callback: async function (response) {

          const verifyRes = await fetch(
            '/api/paystack/verify',
            {
              method: 'POST',

              headers: {
                'Content-Type': 'application/json',
              },

              body: JSON.stringify({
                reference: response.reference,
              }),
            }
          );

          const verifyData =
            await verifyRes.json();

          if (verifyData.status) {

            onSuccess();

            alert(
              '✅ Payment successful. Account activated.'
            );

            onClose();

          } else {

            alert('Payment verification failed');
          }
        },

        onClose: function () {
          console.log('Payment popup closed');
        },
      });

      handler.openIframe();

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
        onClick={e => e.stopPropagation()}
      >

        <div className="pay-modal-header">
          <div className="pay-modal-title">
            BUSINESS HUB
          </div>
        </div>

        <div className="pay-modal-body">

          <p>
            Activate account for KES 50
          </p>

          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="M-Pesa number"
          />

          <button
            onClick={handlePay}
            disabled={loading}
          >
            {loading
              ? 'Processing...'
              : 'Pay Instantly'}
          </button>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: 'var(--gray)',
              textAlign: 'center',
            }}
          >
            Secure Paystack popup payment
          </div>

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

  // Fake withdrawals
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
  ];

  const [currentWithdrawal, setCurrentWithdrawal] =
    useState(withdrawals[0]);

  useEffect(() => {

    const interval = setInterval(() => {

      const random =
        withdrawals[
          Math.floor(
            Math.random() *
              withdrawals.length
          )
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

  useEffect(() => {

    // LOAD PAYSTACK SCRIPT
    const script =
      document.createElement('script');

    script.src =
      'https://js.paystack.co/v1/inline.js';

    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };

  }, []);

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

      if (updated) setUser(updated);

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
            borderColor:
              'var(--gray-light)',
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

      {/* YOUR EXISTING DASHBOARD CONTENT REMAINS SAME */}

      {/* Task Modal */}
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