// pages/dashboard.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const UNLOCK_KEY = 'bh_tasks_unlocked';

function isTasksUnlocked() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(UNLOCK_KEY) === 'true';
}

function setTasksUnlocked() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(UNLOCK_KEY, 'true');
  }
}

function getGmailSubmitLink(taskTitle) {
  const to = 'businesshub.comke@gmail.com';
  const subject = encodeURIComponent(`Task Submission: ${taskTitle}`);
  const body = encodeURIComponent(
    `Hello Business Hub Team,\n\nI would like to submit my work for the following task:\n\nTask: ${taskTitle}\n\nSubmit your tasks on email for review.\n\n[Please attach your work below or describe what you have completed]\n\nThank you.`
  );
  return `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`;
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick, tasksUnlocked }) {
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

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {/* Bid Button */}
            <button
              className="bid-btn"
              style={{ flex: 1 }}
              onClick={() => onBidClick(task)}
            >
              💼 Bid on This Task
            </button>

            {/* Submit Button — always visible, opens Gmail */}
            <a
              href={getGmailSubmitLink(task.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="bid-btn"
              style={{
                flex: 1,
                background: '#059669',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              📤 Submit Task
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment / Activation Modal ───────────────────────────────────────────────
function PaymentModal({ task, user, onClose, onSuccess }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('prompt');

  async function handlePay() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    setStep('processing');
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: 50, phone }),
      });
      const data = await res.json();
      if (data.status) {
        // Mark tasks as unlocked before redirecting
        setTasksUnlocked();
        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment failed. Please try again.');
        setStep('prompt');
      }
    } catch {
      alert('Network error. Please try again.');
      setStep('prompt');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div className="pay-modal-title">BUSINESS HUB</div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {step === 'prompt' && (
            <>
              <div className="pay-message">
                Unlock <strong>all tasks for free — forever</strong> with a one-time payment of{' '}
                <strong>KES 50</strong>. No recurring charges.
              </div>
              <div className="pay-amount">
                <div className="pay-amount-label">One-time unlock fee</div>
                <div className="pay-amount-value">KES 50</div>
                <div className="pay-amount-sub">All tasks free forever · No hidden fees</div>
              </div>
              <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
              <input
                className="pay-phone-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />
              <button className="pay-btn" onClick={handlePay} disabled={loading}>
                {loading
                  ? <><span className="spinner" /> Processing...</>
                  : '🔒 Pay KES 50 via Paystack'}
              </button>
              <div className="pay-secure">🔐 Secured by Paystack · M-Pesa supported</div>
            </>
          )}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--blue)', borderColor: 'var(--gray-light)', borderWidth: 3, margin: '0 auto 16px' }} />
              <p>Redirecting to payment gateway...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upgrade to Premium Modal ─────────────────────────────────────────────────
function UpgradeModal({ user, onClose }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: 180, phone, plan: 'premium' }),
      });
      const data = await res.json();
      if (data.status) {
        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment initiation failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #0047FF, #7C3AED)' }}>
          <div>
            <div className="pay-modal-title">⭐ PREMIUM</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Unlock full platform access</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
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
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Monthly Premium Plan</div>
            <div className="pay-amount-value" style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              KES 180
            </div>
            <div className="pay-amount-sub">per month · Cancel anytime</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input
            className="pay-phone-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
          />
          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)' }}
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Processing...</> : '⭐ Upgrade to Premium'}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack · M-Pesa supported</div>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw Modal (requires premium) ────────────────────────────────────────
function WithdrawLockedModal({ onClose, onUpgrade }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'var(--black)' }}>
          <div className="pay-modal-title">Withdrawal</div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body" style={{ textAlign: 'center', padding: '36px 28px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--black)' }}>
            Premium Required
          </h3>
          <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 24 }}>
            Withdrawals are available to <strong>Premium members</strong> only. Upgrade to unlock instant M-Pesa withdrawals.
          </p>
          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)', marginBottom: 12 }}
            onClick={onUpgrade}
          >
            ⭐ Upgrade to Premium
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 13, cursor: 'pointer' }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Modal ───────────────────────────────────────────────────────────
function ReferralModal({ user, onClose }) {
  const [copied, setCopied] = useState(false);

  // Clean referral link — no extra spaces
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user?.id || 'USER123'}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const referralCount = user?.referrals?.length || 0;
  const referralEarnings = referralCount * 70;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #0047FF)' }}>
          <div>
            <div className="pay-modal-title">🔗 Your Referral Link</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Earn KES 70 per referral</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4' }}>
            Share your link and earn <strong style={{ color: '#059669' }}>KES 70</strong> for every friend who signs up and activates their account. Your balance is updated automatically when they join.
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="pay-phone-label">Your unique referral link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="pay-phone-input"
                value={referralLink}
                readOnly
                style={{ fontSize: 13, flex: 1, marginBottom: 0, letterSpacing: 0 }}
              />
              <button
                onClick={copyLink}
                style={{
                  padding: '0 20px',
                  background: copied ? '#059669' : 'var(--blue)',
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="referral-stats">
            <div className="referral-stat">
              <div className="referral-stat-num">{referralCount}</div>
              <div className="referral-stat-label">Referrals</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-num">KES {referralEarnings}</div>
              <div className="referral-stat-label">Earned</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-num">KES 70</div>
              <div className="referral-stat-label">Per Referral</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[
              {
                label: '📱 WhatsApp',
                color: '#25D366',
                url: `https://wa.me/?text=${encodeURIComponent(`Join Business Hub and earn online! Use my link: ${referralLink}`)}`,
              },
              {
                label: '✉️ Email',
                color: '#EA4335',
                url: `mailto:?subject=${encodeURIComponent('Join Business Hub')}&body=${encodeURIComponent(`Hey! Join me on Business Hub and start earning online. Use my referral link: ${referralLink}`)}`,
              },
            ].map(btn => (
              <a
                key={btn.label}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '12px',
                  background: btn.color,
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: 'center',
                  display: 'block',
                  textDecoration: 'none',
                }}
              >
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Unlock Banner ───────────────────────────────────────────────────────
function UnlockBanner({ onUnlock }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
      border: '1.5px solid #fbbf24',
      borderRadius: 12,
      padding: '20px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 32 }}>🔐</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
            Unlock All Tasks — One-Time KES 50
          </div>
          <div style={{ fontSize: 13, color: '#b45309' }}>
            Pay once and access every task for free, forever — even after refresh
          </div>
        </div>
      </div>
      <button
        onClick={onUnlock}
        style={{
          background: '#f59e0b',
          color: '#fff',
          border: 'none',
          padding: '10px 24px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.target.style.background = '#d97706'}
        onMouseLeave={e => e.target.style.background = '#f59e0b'}
      >
        🔓 Unlock Now
      </button>
    </div>
  );
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerMenu({ user, onClose, onUpgrade, onWithdraw, onReferral, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard', action: () => { onClose(); } },
    { icon: '⭐', label: 'Upgrade to Premium', action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks', action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '💸', label: 'Withdraw Money', action: () => { onClose(); onWithdraw(); } },
    {
      icon: '🎓', label: 'Apply for Training', action: () => {
        onClose();
        window.location.href = `mailto:businesshub.comke@gmail.com?subject=${encodeURIComponent('Training Application')}&body=${encodeURIComponent(`Hello,\n\nI would like to apply for training.\n\nMy name is ${user?.fullName || ''} and my email is ${user?.email || ''}.\n\nThank you.`)}`;
      },
    },
    { icon: '🔗', label: 'My Referral Link', action: () => { onClose(); onReferral(); } },
    {
      icon: '📤', label: 'Submit a Task', action: () => {
        onClose();
        window.open(`https://mail.google.com/mail/?view=cm&to=businesshub.comke@gmail.com&su=${encodeURIComponent('Task Submission')}&body=${encodeURIComponent('Submit your tasks on email for review.\n\nTask Name:\n\nDescription of work completed:\n\n[Attach your work here]')}`, '_blank');
      },
    },
  ];

  return (
    <>
      <div className="hamburger-overlay" onClick={onClose} />
      <div className="hamburger-menu">
        <div className="hamburger-header">
          <div className="hamburger-user">
            <div className="dash-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
              {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--black)' }}>{user?.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>{user?.email}</div>
              <span className={`status-badge ${user?.activated ? 'status-active' : 'status-inactive'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                {user?.activated ? '✅ Active' : '⚠️ Inactive'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'var(--gray-light)', color: 'var(--black)', flexShrink: 0 }}>×</button>
        </div>

        <nav className="hamburger-nav">
          {items.map(item => (
            <button key={item.label} className="hamburger-item" onClick={item.action}>
              <span className="hamburger-item-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--gray-light)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </nav>

        <div className="hamburger-footer">
          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>Account Balance</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--blue)', marginBottom: 16 }}>
            KES {(user?.balance || 0).toLocaleString()}
          </div>
          <button className="logout-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>
            ⏏ Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [tasksUnlocked, setTasksUnlockedState] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [payTask, setPayTask] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const withdrawals = [
    { flag: '🇰🇪', country: 'Kenya', phone: '+25471*****78', amount: 450 },
    { flag: '🇺🇬', country: 'Uganda', phone: '+25670*****44', amount: 1200 },
    { flag: '🇹🇿', country: 'Tanzania', phone: '+25575*****33', amount: 800 },
    { flag: '🇳🇬', country: 'Nigeria', phone: '+23481*****55', amount: 1500 },
    { flag: '🇬🇭', country: 'Ghana', phone: '+23354*****23', amount: 650 },
    { flag: '🇷🇼', country: 'Rwanda', phone: '+25078*****56', amount: 300 },
    { flag: '🇿🇦', country: 'South Africa', phone: '+27821*****67', amount: 1100 },
    { flag: '🇪🇹', country: 'Ethiopia', phone: '+25191*****44', amount: 950 },
    { flag: '🇨🇲', country: 'Cameroon', phone: '+23767*****67', amount: 500 },
    { flag: '🇲🇼', country: 'Malawi', phone: '+26599*****44', amount: 250 },
  ];
  const [currentWithdrawal, setCurrentWithdrawal] = useState(withdrawals[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWithdrawal(withdrawals[Math.floor(Math.random() * withdrawals.length)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    'All', 'Writing', 'Research', 'Data Entry', 'Design',
    'Marketing', 'Transcription', 'Translation', 'Survey',
    'Testing', 'Audio', 'Education', 'Admin',
  ];

  useEffect(() => {
    setMounted(true);
    const u = getCurrentUser();
    if (!u) {
      router.replace('/login');
    } else {
      setUser(u);
      // Check unlock status from localStorage on mount
      setTasksUnlockedState(isTasksUnlocked());
    }
  }, [router]);

  // Also re-check unlock when returning from payment redirect
  useEffect(() => {
    if (!mounted) return;
    const unlocked = isTasksUnlocked();
    setTasksUnlockedState(unlocked);
  }, [mounted]);

  const handleLogout = useCallback(() => { logout(); router.push('/'); }, [router]);

  const handleBidClick = useCallback((task) => {
    setSelectedTask(null);
    if (!tasksUnlocked) {
      setPayTask(task);
    } else {
      // Already unlocked — open Gmail submit link directly
      window.open(getGmailSubmitLink(task.title), '_blank');
    }
  }, [tasksUnlocked]);

  const handlePaySuccess = useCallback(() => {
    const updated = activateUser(user.id);
    if (updated) setUser(updated);
    setTasksUnlocked();
    setTasksUnlockedState(true);
  }, [user]);

  const handleUnlockClick = useCallback(() => {
    setPayTask({ title: 'All Tasks' });
  }, []);

  const filteredTasks = TASKS.filter(t => {
    const matchCat = filter === 'All' || t.category === filter;
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
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

  // Clean referral link — no spaces
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`;

  return (
    <div className="dashboard">

      {/* Fake Withdrawal Notification */}
      <div style={{ position: 'fixed', top: 90, right: 20, zIndex: 999, animation: 'slideIn 0.5s ease' }}>
        <div style={{
          background: '#fff',
          border: '1px solid var(--gray-light)',
          borderRadius: 14,
          padding: '14px 18px',
          minWidth: 280,
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 6 }}>Recent Withdrawal</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 30 }}>{currentWithdrawal.flag}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--black)' }}>{currentWithdrawal.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>{currentWithdrawal.country}</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontWeight: 700, color: 'green', fontSize: 16 }}>
            Withdrawn KES {currentWithdrawal.amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <Link href="/" className="dash-logo">BUSINESS HUB</Link>
          <div className="dash-user">
            <div className="dash-user-info">
              <div className="dash-user-name">{user.fullName}</div>
              <div className="dash-user-email">{user.email}</div>
            </div>
            <div className="dash-avatar">{initials}</div>
            <button className="hamburger-btn" onClick={() => setShowMenu(true)} aria-label="Open menu">
              <span /><span /><span />
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
              {tasksUnlocked && (
                <span className="status-badge status-active" style={{ marginLeft: 8 }}>
                  🔓 Tasks Unlocked
                </span>
              )}
            </div>
          </div>
          <div className="dash-balance-box">
            <div className="dash-balance-label">Account Balance</div>
            <div className="dash-balance-amount">KES {(user.balance || 0).toLocaleString()}</div>
            <div className="dash-balance-sub">Available for withdrawal</div>
          </div>
        </div>

        {/* Referral Banner */}
        <div className="referral-banner" onClick={() => setShowReferral(true)}>
          <div className="referral-banner-left">
            <span className="referral-banner-icon">🔗</span>
            <div>
              <div className="referral-banner-title">Refer Friends & Earn KES 70 Each</div>
              <div className="referral-banner-sub">Share your link · Your balance updates when they join</div>
            </div>
          </div>
          <div className="referral-banner-link">
            <span className="referral-link-preview">{referralLink.replace('https://', '')}</span>
            <button className="referral-copy-btn" onClick={e => {
              e.stopPropagation();
              navigator.clipboard.writeText(referralLink).catch(() => {});
            }}>Copy Link →</button>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => setShowUpgrade(true)}>
            <span className="quick-action-icon">⭐</span>
            <span className="quick-action-label">Upgrade Premium</span>
          </button>
          <button className="quick-action-card" onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="quick-action-icon">✅</span>
            <span className="quick-action-label">Awarded Tasks</span>
          </button>
          <button className="quick-action-card" onClick={() => setShowWithdraw(true)}>
            <span className="quick-action-icon">💸</span>
            <span className="quick-action-label">Withdraw Money</span>
          </button>
          <a
            href={`mailto:businesshub.comke@gmail.com?subject=${encodeURIComponent('Training Application')}&body=${encodeURIComponent(`Hello,\n\nI would like to apply for training.\n\nMy name is ${user.fullName} and my email is ${user.email}.\n\nThank you.`)}`}
            className="quick-action-card"
            style={{ textDecoration: 'none' }}
          >
            <span className="quick-action-icon">🎓</span>
            <span className="quick-action-label">Apply for Training</span>
          </a>
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
        <div id="tasks-section">
          <div className="dash-section-title">Available Tasks</div>
          <div className="dash-section-sub">Browse and bid on tasks that match your skills</div>

          {/* Unlock Banner — show only if not yet unlocked */}
          {!tasksUnlocked && <UnlockBanner onUnlock={handleUnlockClick} />}

          {/* Unlocked confirmation */}
          {tasksUnlocked && (
            <div style={{
              background: '#F0FFF4',
              border: '1px solid #BBF7D0',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: 6,
              fontSize: 14,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              🔓 <strong>All tasks unlocked!</strong> You have full access — submit any task via email for review.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: '10px 16px',
                border: '1.5px solid var(--gray-light)', borderRadius: 8,
                fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--black)', background: 'var(--white)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 16px', borderRadius: 100, border: '1.5px solid',
                  borderColor: filter === cat ? 'var(--blue)' : 'var(--gray-light)',
                  background: filter === cat ? 'var(--blue)' : 'var(--white)',
                  color: filter === cat ? 'var(--white)' : 'var(--gray)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)',
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
            {filteredTasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-poster">
                    <div className="task-poster-avatar">{task.poster.charAt(0).toUpperCase()}</div>
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

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* View / Bid */}
                  <button
                    className="task-view-btn"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (tasksUnlocked) {
                        setSelectedTask(task);
                      } else {
                        setPayTask(task);
                      }
                    }}
                  >
                    {tasksUnlocked ? '👁️ View Task' : '🔒 Unlock to View'}
                  </button>

                  {/* Submit Icon — always visible, redirects to Gmail */}
                  <a
                    href={getGmailSubmitLink(task.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Submit this task via email"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      minWidth: 44,
                      background: '#059669',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 18,
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                    onMouseLeave={e => e.currentTarget.style.background = '#059669'}
                  >
                    📤
                  </a>
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
          tasksUnlocked={tasksUnlocked}
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
      {showUpgrade && <UpgradeModal user={user} onClose={() => setShowUpgrade(false)} />}
      {showWithdraw && (
        <WithdrawLockedModal
          onClose={() => setShowWithdraw(false)}
          onUpgrade={() => { setShowWithdraw(false); setShowUpgrade(true); }}
        />
      )}
      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onUpgrade={() => setShowUpgrade(true)}
          onWithdraw={() => setShowWithdraw(true)}
          onReferral={() => setShowReferral(true)}
          onLogout={handleLogout}
        />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
