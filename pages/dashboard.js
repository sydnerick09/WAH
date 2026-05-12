// pages/dashboard.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, activateUser } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Live Chat Button ─────────────────────────────────────────────────────────
function LiveChat({ user }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!message.trim()) return;
    const subject = encodeURIComponent('Support Request from ' + (user?.fullName || ''));
    const body = encodeURIComponent(
      `From: ${user?.fullName}\nEmail: ${user?.email}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:businesshub.comke@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setMessage(''); }, 2500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open support chat"
        style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 400,
          width: 54, height: 54,
          background: 'var(--green)', color: '#fff',
          borderRadius: '50%', fontSize: open ? 22 : 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(26,122,74,0.45)',
          border: 'none', cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 20, zIndex: 399,
          background: '#fff', borderRadius: 18,
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
          width: 'min(300px, calc(100vw - 40px))',
          overflow: 'hidden',
          border: '1px solid var(--gray-light)',
          animation: 'slideUp 0.2s ease',
        }}>
          <div style={{ background: 'var(--green)', padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>💬 Support Chat</div>
            <div style={{ fontFamily: 'var(--font-sub)', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>We reply within 2 hours</div>
          </div>
          <div style={{ padding: 14 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>Message sent!</div>
                <div style={{ fontFamily: 'var(--font-sub)', fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>We'll get back to you soon.</div>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontFamily: 'var(--font-sub)', fontSize: 12, color: 'var(--gray)', lineHeight: 1.6 }}>
                  Hello {user?.fullName?.split(' ')[0]}! How can we help you today?
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message…"
                  rows={3}
                  style={{ width: '100%', border: '1.5px solid var(--gray-light)', borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: 13, resize: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleSend}
                  style={{ width: '100%', background: 'var(--green)', color: '#fff', padding: 11, borderRadius: 50, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}
                >
                  Send Message →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Task Detail Modal (improved) ─────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick }) {
  if (!task) return null;
  const isActivated = user?.activated;

  function handleSubmit() {
    const subject = encodeURIComponent('Task Submission: ' + task.title);
    const body = encodeURIComponent(
      'Hello Business Hub,\n\nI am submitting my completed task for review.\n\nTask: ' + task.title +
      '\nCategory: ' + task.category +
      '\nPayment: KES ' + task.payment.toLocaleString() +
      '\n\nPlease find my submission below:\n\n[Add your work here]\n\nThank you,\n' + (user?.fullName || '')
    );
    window.location.href = 'mailto:businesshub.comke@gmail.com?subject=' + subject + '&body=' + body;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalSlideUp 0.28s cubic-bezier(0.22,1,0.36,1)', borderRadius: 20, overflow: 'hidden', padding: 0 }}
      >
        {/* Green header band */}
        <div style={{
          background: 'linear-gradient(135deg, var(--green-dark) 0%, var(--green) 100%)',
          padding: '22px 22px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-utility)', fontSize: 10, fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
                letterSpacing: '1.2px', marginBottom: 6,
              }}>
                {task.category}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                color: '#fff', lineHeight: 1.25,
              }}>
                {task.title}
              </div>
            </div>
            <button
              className="modal-close"
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', flexShrink: 0 }}
            >
              ×
            </button>
          </div>

          {/* Payment pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.18)', borderRadius: 50,
            padding: '7px 16px', marginTop: 14,
          }}>
            <span style={{ fontSize: 16 }}>💰</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              KES {task.payment.toLocaleString()}
            </span>
            <span style={{ fontFamily: 'var(--font-sub)', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
              paid on approval
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 160px)' }}>
          {/* Meta chips — wraps instead of grid so it works on any screen width */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { icon: '👤', label: task.poster },
              { icon: '📍', label: task.location },
              { icon: '📅', label: task.datePosted },
            ].map(chip => (
              <div key={chip.label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--cream)', borderRadius: 50, padding: '5px 12px',
              }}>
                <span style={{ fontSize: 13 }}>{chip.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--black)' }}>
                  {chip.label}
                </span>
              </div>
            ))}
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

          {!isActivated ? (
            <>
              <button className="bid-btn" onClick={() => onBidClick(task)}>
                💼 Bid on This Task
              </button>
              <p style={{ fontFamily: 'var(--font-sub)', fontSize: 12, color: 'var(--gray)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                Activate your account (KES 50, once) to start bidding and earning.
              </p>
            </>
          ) : (
            <button className="submit-btn" onClick={handleSubmit}>
              📤 Submit This Task
            </button>
          )}
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
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 50, phone }),
    });
    const data = await res.json();
    if (data.status) { window.location.href = data.data.authorization_url; }
    else { alert('Payment failed'); setStep('prompt'); }
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
                Activate your account for <strong>KES 50</strong> to start bidding on tasks and earning money. Once activated, all tasks are <strong style={{ color: 'var(--green)' }}>free to access</strong>.
              </div>
              <div className="pay-amount">
                <div className="pay-amount-label">One-time activation fee</div>
                <div className="pay-amount-value">KES 50</div>
                <div className="pay-amount-sub">Lifetime access • No hidden fees</div>
              </div>
              <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
              <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
              <button className="pay-btn" onClick={handlePay} disabled={loading}>
                {loading ? <><span className="spinner" /> Processing…</> : '🔒 Pay via Paystack'}
              </button>
              <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
            </>
          )}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3, margin: '0 auto 16px' }} />
              <p style={{ fontFamily: 'var(--font-sub)', color: 'var(--gray)' }}>Redirecting to payment gateway…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upgrade Modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ user, onClose }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 480, phone, plan: 'premium' }),
    });
    const data = await res.json();
    if (data.status) { window.location.href = data.data.authorization_url; }
    else { alert('Payment initiation failed. Please try again.'); }
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
              <div key={text} className="premium-feature-item"><span>{icon}</span><span>{text}</span></div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Monthly Premium Plan</div>
            <div className="pay-amount-value" style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KES 480</div>
            <div className="pay-amount-sub">per month • Cancel anytime</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)' }} onClick={handleUpgrade} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : '⭐ Upgrade to Premium'}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw Modal ────────────────────────────────────────────────────────────
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
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>Premium Required</h3>
          <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 24, fontFamily: 'var(--font-sub)' }}>
            Withdrawals are available to <strong>Premium members</strong> only. Upgrade your account to unlock instant M-Pesa withdrawals.
          </p>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg,#0047FF,#7C3AED)', marginBottom: 12 }} onClick={onUpgrade}>
            ⭐ Upgrade to Premium
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sub)' }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Modal ────────────────────────────────────────────────────────────
function ReferralModal({ user, onClose }) {
  const [copied, setCopied] = useState(false);
  const referralLink = user?.activated
    ? `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`
    : 'Activate your account to unlock referral link';

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #0047FF)' }}>
          <div>
            <div className="pay-modal-title">🔗 Your Referral Link</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Earn KES 132 per referral</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4' }}>
            Share your referral link and earn <strong style={{ color: '#059669' }}>KES 132</strong> for every friend who signs up and activates their account.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="pay-phone-label">Your unique referral link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="pay-phone-input" value={referralLink} readOnly style={{ fontSize: 12, flex: 1, marginBottom: 0 }} />
              <button onClick={copyLink} style={{ padding: '0 18px', background: copied ? '#059669' : 'var(--green)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="referral-stats">
            <div className="referral-stat"><div className="referral-stat-num">{user?.referralCount || 0}</div><div className="referral-stat-label">Referrals</div></div>
            <div className="referral-stat"><div className="referral-stat-num">KES {((user?.referralCount || 0) * 132).toLocaleString()}</div><div className="referral-stat-label">Earned</div></div>
            <div className="referral-stat"><div className="referral-stat-num">KES 132</div><div className="referral-stat-label">Per Referral</div></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[
              { label: '📱 WhatsApp', color: '#25D366', url: `https://wa.me/?text=Join%20Business%20Hub%20and%20earn%20online!%20${encodeURIComponent(referralLink)}` },
              { label: '✉️ Email', color: '#EA4335', url: `mailto:?subject=Join%20Business%20Hub&body=Hey!%20Join%20me%20on%20Business%20Hub%20and%20start%20earning%20online.%20Use%20my%20link:%20${encodeURIComponent(referralLink)}` },
            ].map(btn => (
              <a key={btn.label} href={user?.activated ? btn.url : '#'} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: 12, background: btn.color, color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textAlign: 'center', display: 'block', opacity: user?.activated ? 1 : 0.5, pointerEvents: user?.activated ? 'auto' : 'none' }}>
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hamburger Menu ────────────────────────────────────────────────────────────
function HamburgerMenu({ user, onClose, onUpgrade, onWithdraw, onReferral, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard', action: onClose },
    { icon: '⭐', label: 'Upgrade to Premium', action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks', action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '💸', label: 'Withdraw Money', action: () => { onClose(); onWithdraw(); } },
    {
      icon: '🎓', label: 'Apply for Training',
      action: () => {
        onClose();
        window.location.href = `mailto:businesshub.comke@gmail.com?subject=Training Application&body=Hello, I would like to apply for training. My name is ${user?.fullName || ''} and my email is ${user?.email || ''}.`;
      },
    },
    { icon: '🔗', label: 'My Referral Link', action: () => { onClose(); onReferral(); } },
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--green)', marginBottom: 16 }}>
            KES {(user?.balance || 0).toLocaleString()}
          </div>
          <button className="logout-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>⏏ Sign Out</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [payTask, setPayTask] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const withdrawals = [
    { flag: '🇰🇪', country: 'Kenya',       phone: '+25471*****78', amount: 450  },
    { flag: '🇺🇬', country: 'Uganda',       phone: '+25670*****44', amount: 1200 },
    { flag: '🇹🇿', country: 'Tanzania',     phone: '+25575*****33', amount: 800  },
    { flag: '🇳🇬', country: 'Nigeria',      phone: '+23481*****55', amount: 1500 },
    { flag: '🇬🇭', country: 'Ghana',        phone: '+23354*****23', amount: 650  },
    { flag: '🇷🇼', country: 'Rwanda',       phone: '+25078*****56', amount: 300  },
    { flag: '🇿🇦', country: 'South Africa', phone: '+27821*****67', amount: 1100 },
    { flag: '🇪🇹', country: 'Ethiopia',     phone: '+25191*****44', amount: 950  },
    { flag: '🇨🇲', country: 'Cameroon',     phone: '+23767*****67', amount: 500  },
    { flag: '🇲🇼', country: 'Malawi',       phone: '+26599*****44', amount: 250  },
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
    if (!u) { router.replace('/login'); } else { setUser(u); }
  }, [router]);

  const handleLogout = useCallback(() => { logout(); router.push('/'); }, [router]);
  const handleViewTask = useCallback(task => setSelectedTask(task), []);
  const handleBidClick = useCallback(task => { setSelectedTask(null); setPayTask(task); }, []);
  const handlePaySuccess = useCallback(() => {
    const updated = activateUser(user.id);
    if (updated) setUser(updated);
  }, [user]);

  function handleSubmitTask(task) {
    const subject = encodeURIComponent('Task Submission: ' + task.title);
    const body = encodeURIComponent(
      'Hello Business Hub,\n\nPlease submit your tasks on email for review.\n\nTask: ' + task.title +
      '\nCategory: ' + task.category +
      '\nPayment: KES ' + task.payment.toLocaleString() +
      '\n\nYour submission:\n\n[Add your work here]\n\nSubmitted by: ' + (user?.fullName || '') +
      '\nEmail: ' + (user?.email || '')
    );
    window.location.href = 'mailto:businesshub.comke@gmail.com?subject=' + subject + '&body=' + body;
  }

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
      </div>
    );
  }

  const initials = user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`;

  return (
    <div className="dashboard">

      {/* Withdrawal toast */}
      <div className="withdrawal-toast" style={{ animation: 'slideIn 0.5s ease' }}>
        <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>Recent Withdrawal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 28 }}>{currentWithdrawal.flag}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--black)' }}>{currentWithdrawal.phone}</div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>{currentWithdrawal.country}</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontWeight: 700, color: 'green', fontSize: 15 }}>
          Withdrawn KES {currentWithdrawal.amount.toLocaleString()}
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
            <p>{user.email} • {user.country}</p>
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

        {/* Referral Banner */}
        <div className="referral-banner" onClick={() => setShowReferral(true)}>
          <div className="referral-banner-left">
            <span className="referral-banner-icon">🔗</span>
            <div>
              <div className="referral-banner-title">Refer Friends & Earn KES 70 Each</div>
              <div className="referral-banner-sub">Share your link • Track referrals • Get paid instantly</div>
            </div>
          </div>
          <div className="referral-banner-link">
            <span className="referral-link-preview">{referralLink.replace('https://', '')}</span>
            <button
              className="referral-copy-btn"
              onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(referralLink); alert('Referral link copied!'); }}
            >
              Copy Link →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
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
            href={`mailto:businesshub.comke@gmail.com?subject=Training Application&body=Hello, I would like to apply for training. My name is ${user.fullName || ''} and my email is ${user.email || ''}.`}
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
            <div><div className="dash-stat-num">{TASKS.length}</div><div className="dash-stat-label">Available Tasks</div></div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">💼</div>
            <div><div className="dash-stat-num">0</div><div className="dash-stat-label">Active Bids</div></div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">✅</div>
            <div><div className="dash-stat-num">0</div><div className="dash-stat-label">Completed Tasks</div></div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">💰</div>
            <div><div className="dash-stat-num">KES {(user.balance || 0).toLocaleString()}</div><div className="dash-stat-label">Total Earned</div></div>
          </div>
        </div>

        {/* Tasks Section */}
        <div id="tasks-section">
          <div className="dash-section-title">Available Tasks</div>
          <div className="dash-section-sub">Browse and bid on tasks that match your skills</div>

          <input
            type="text"
            placeholder="🔍 Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '11px 16px', marginBottom: 16,
              border: '1.5px solid var(--gray-light)', borderRadius: 10,
              fontSize: 14, fontFamily: 'var(--font-body)',
              color: 'var(--black)', background: 'var(--white)', boxSizing: 'border-box',
            }}
          />

          {/* Category filter — horizontally scrollable pill row on mobile */}
          <div className="category-scroll">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={'cat-btn' + (filter === cat ? ' cat-btn--active' : '')}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--gray)' }}>
            Showing <strong>{filteredTasks.length}</strong> tasks
            {user.activated && (
              <span style={{ marginLeft: 10, color: '#059669', fontWeight: 600 }}>✅ All tasks unlocked</span>
            )}
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
                <div className="task-actions">
                  <button className="task-view-btn" onClick={() => handleViewTask(task)}>👁️ View / Bid</button>
                  <button className="task-submit-btn" onClick={() => handleSubmitTask(task)}>📤 Submit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Live Chat */}
      <LiveChat user={user} />

      {/* Modals */}
      {selectedTask && (
        <TaskModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onBidClick={handleBidClick} />
      )}
      {payTask && (
        <PaymentModal task={payTask} user={user} onClose={() => setPayTask(null)} onSuccess={handlePaySuccess} />
      )}
      {showUpgrade && <UpgradeModal user={user} onClose={() => setShowUpgrade(false)} />}
      {showWithdraw && (
        <WithdrawLockedModal onClose={() => setShowWithdraw(false)} onUpgrade={() => { setShowWithdraw(false); setShowUpgrade(true); }} />
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
        @keyframes slideIn    { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
        @keyframes slideUp    { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes modalSlideUp { from { opacity:0; transform:translateY(28px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
