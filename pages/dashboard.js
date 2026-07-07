// pages/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// Business Hub Dashboard
// M-Pesa Withdrawal flow:
//   1. User clicks "Withdraw with M-Pesa" → pays KES 5 (simulated locally)
//   2. Fee confirmed → Withdrawal Details Form (phone + ID number only)
//   3. Submit form → "Payment will be initiated in 2 minutes" screen
//   4. 1:32 countdown expires → "Wrong credentials" failure
//   5. User dismisses → cycle resets (fee required again to retry)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser, logout, awardQuizBonus } from '../lib/auth';
import { TASKS } from '../lib/tasks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Limited-time "offer" tasks (id starts with offer_): no premium needed,
// one submission each, 9-hour window.
const isOffer = t => String(t?.id || '').startsWith('offer_');
const THREE_HOURS = 3 * 60 * 60 * 1000;
const NINE_HOURS  = 9 * 60 * 60 * 1000;

function getOrGenerateWithdrawals() {
  const LS_KEY = 'bh_live_withdrawals_v6';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const kenyaSrc   = { flag: '🇰🇪', country: 'Kenya',   prefixes: ['+25471','+25472','+25473','+25474','+25475','+25476','+25477','+25478','+25479','+25470'] };
  const jamaicaSrc = { flag: '🇯🇲', country: 'Jamaica', prefixes: ['+1876','+1658'] };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const mask = p => `${p}*****${String(rand(10, 99))}`;

  // 70 payouts today: 63 Kenyan (KES 2,100–9,300) + 7 Jamaican (KES 2,100–7,200)
  const records = [
    ...Array.from({ length: 63 }, () => {
      const prefix = kenyaSrc.prefixes[rand(0, kenyaSrc.prefixes.length - 1)];
      return { flag: kenyaSrc.flag, country: kenyaSrc.country, phone: mask(prefix), amount: rand(2100, 9300) };
    }),
    ...Array.from({ length: 7 }, () => {
      const prefix = jamaicaSrc.prefixes[rand(0, jamaicaSrc.prefixes.length - 1)];
      return { flag: jamaicaSrc.flag, country: jamaicaSrc.country, phone: mask(prefix), amount: rand(2100, 7200) };
    }),
  ];

  // Shuffle so Kenyan/other are mixed
  for (let i = records.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [records[i], records[j]] = [records[j], records[i]];
  }

  // Featured payout — a real member's successful withdrawal today. Phone masked
  // in the same +254 style as the others; seeded frequently so it recurs in the
  // ticker and the rotating list for strong social proof.
  const featured = {
    flag: '🇰🇪', country: 'Kenya', name: 'Erick Omondi Ouma',
    phone: '+25411*****12', amount: 6708, featured: true,
  };
  const withFeatured = [];
  records.forEach((r, i) => {
    if (i % 4 === 0) withFeatured.push({ ...featured });   // ~1 in every 5 entries
    withFeatured.push(r);
  });

  try { localStorage.setItem(LS_KEY, JSON.stringify(withFeatured)); } catch (_) {}
  return withFeatured;
}

// Pending payouts — currently being processed (shown in the Pending tab)
function getOrGeneratePending() {
  const LS_KEY = 'bh_pending_withdrawals_v1';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const people = [
    { flag: '🇰🇪', country: 'Kenya',    name: 'Brian K.'   }, { flag: '🇰🇪', country: 'Kenya',    name: 'Mercy A.'  },
    { flag: '🇰🇪', country: 'Kenya',    name: 'Dennis O.'  }, { flag: '🇰🇪', country: 'Kenya',    name: 'Faith W.'  },
    { flag: '🇰🇪', country: 'Kenya',    name: 'Kevin M.'   }, { flag: '🇳🇬', country: 'Nigeria',  name: 'Chidi E.'  },
    { flag: '🇯🇲', country: 'Jamaica',  name: 'Andre C.'   }, { flag: '🇬🇭', country: 'Ghana',    name: 'Kwame A.'  },
    { flag: '🇺🇬', country: 'Uganda',   name: 'Sarah N.'   }, { flag: '🇰🇪', country: 'Kenya',    name: 'Purity W.' },
  ];

  const records = people.map(p => ({
    ...p,
    amount:    rand(2100, 8600),
    etaMin:    rand(1, 9),
    progress:  rand(20, 85),
  }));

  try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch (_) {}
  return records;
}

// Member reviews — includes the two client-supplied testimonials verbatim.
const REVIEWS = [
  { name: 'James Otieno',      country: 'Nairobi, Kenya',    flag: '🇰🇪', rating: 4,
    text: 'I tried withdrawing once, but it failed, but I tried twice, then it went through.' },
  { name: 'Wanjiku Maina',     country: 'Nakuru, Kenya',     flag: '🇰🇪', rating: 5,
    text: 'Guys, you need to have correct details before you withdraw so that you avoid the inconveniences of paying the withdrawal fee twice or thrice.' },
  { name: 'Grace Achieng',     country: 'Kisumu, Kenya',     flag: '🇰🇪', rating: 5,
    text: 'The M-Pesa payout hit my phone in under two minutes. Double-checking my number first made it smooth. Business Hub is legit.' },
  { name: 'Chinedu Okafor',    country: 'Lagos, Nigeria',    flag: '🇳🇬', rating: 5,
    text: 'I was skeptical at first, but after my very first successful withdrawal I upgraded to premium. Worth every naira.' },
  { name: 'Ama Mensah',        country: 'Accra, Ghana',      flag: '🇬🇭', rating: 4,
    text: 'Accuracy is everything here — confirm your account details and the payment goes through the first time, no repeat fees.' },
  { name: 'Andre Campbell',    country: 'Kingston, Jamaica', flag: '🇯🇲', rating: 5,
    text: 'From Kingston with love. Once my bank details were correct, the transfer came through clean. Professional platform.' },
  { name: 'Sarah Nakato',      country: 'Kampala, Uganda',   flag: '🇺🇬', rating: 5,
    text: 'Consistent tasks and honest payouts. I now earn a steady side income every single week.' },
  { name: 'Brian Kiptoo',      country: 'Eldoret, Kenya',    flag: '🇰🇪', rating: 4,
    text: 'Support helped me fix a failed withdrawal within minutes. Enter the right details and you will have zero problems.' },
];


// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskModal({ task, user, onClose, onBidClick, onUpgradeClick, onSubmit }) {
  if (!task) return null;
  const isActivated = user?.activated;
  const isPremium   = user?.premium;
  const offer       = isOffer(task);

  function handleSubmit() {
    if (!offer && !isPremium) { onClose(); onUpgradeClick(); return; }
    onClose();
    onSubmit(task);   // → file-upload submission page
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
            {[
              ['Posted By',   `👤 ${task.poster}`],
              ['Location',    `📍 ${task.location}`],
              ['Date Posted', `📅 ${task.datePosted}`],
              ['Category',    `🏷️ ${task.category}`],
            ].map(([label, value]) => (
              <div key={label} className="modal-meta-item">
                <div className="modal-meta-label">{label}</div>
                <div className="modal-meta-value">{value}</div>
              </div>
            ))}
          </div>
          <div className="modal-payment">
            <div>
              <div className="modal-payment-label">Task Payment</div>
              <div style={{ fontSize: 13, color: 'var(--green)', opacity: 0.7, marginTop: 2 }}>Paid on approval</div>
            </div>
            <div className="modal-payment-amount">KES {task.payment.toLocaleString()}</div>
          </div>
          <p className="modal-desc">{task.description}</p>
          {task.questions?.length > 0 && (
            <div className="modal-questions">
              <h4>Questions from Poster</h4>
              {task.questions.map((q, i) => (
                <div key={i} className="modal-question-item">{q}</div>
              ))}
            </div>
          )}
          {!isActivated && (
            <button className="bid-btn" onClick={() => onBidClick(task)}>💼 Bid on This Task</button>
          )}
          {isActivated && !isPremium && !offer && (
            <button className="submit-btn" onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }}>⭐ Upgrade to Premium to Submit</button>
          )}
          {isActivated && (isPremium || offer) && (
            <button className="submit-btn" onClick={handleSubmit}>📤 Submit This Task{offer ? ' (Offer — No Premium)' : ''}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Joining-Gift Quiz ────────────────────────────────────────────────────────
// Five general-knowledge questions. KES 10 per correct answer (max KES 50).
// The user is never told whether an answer was right — they just move on, and
// the total earned is revealed on the final screen.
const QUIZ_QUESTIONS = [
  { q: 'Rearrange these words into a correct sentence: “client / the / satisfied / was / very”',
    options: ['Very the client was satisfied', 'The client was very satisfied', 'Satisfied the client was very', 'Was the client very satisfied'],
    answer: 'The client was very satisfied' },
  { q: 'A freelancer earns KES 1,500 per task and finishes 4 tasks. After a 10% platform fee, how much do they keep?',
    options: ['KES 6,000', 'KES 5,850', 'KES 5,400', 'KES 5,000'],
    answer: 'KES 5,400' },
  { q: 'What number comes next in the pattern:  3, 6, 11, 18, 27, __ ?',
    options: ['35', '36', '38', '40'],
    answer: '38' },
  { q: 'Which sentence is written correctly?',
    options: ["She don't have no experience.", 'She doesn’t have any experience.', 'She not have experience.', 'She haven’t any experience.'],
    answer: 'She doesn’t have any experience.' },
  { q: 'If every designer can use a computer, and John is a designer, then John…',
    options: ['cannot use a computer', 'can use a computer', 'is not a designer', 'only uses a phone'],
    answer: 'can use a computer' },
];

function QuizModal({ user, onComplete }) {
  const [step,     setStep]     = useState(0);       // 0..4 questions, then 'result'
  const [answers,  setAnswers]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [result,   setResult]   = useState(null);    // { correct, earned }
  const [doneUser, setDoneUser] = useState(null);

  const total   = QUIZ_QUESTIONS.length;
  const current = QUIZ_QUESTIONS[step];
  const isLast  = step === total - 1;

  async function handleNext() {
    if (selected == null) return;                    // must pick something
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);

    if (!isLast) { setStep(step + 1); return; }

    // Grade — we generated the questions, so we know the answers
    let correct = 0;
    QUIZ_QUESTIONS.forEach((qq, i) => { if (next[i] === qq.answer) correct += 1; });
    const earned = correct * 10;

    setSaving(true);
    const updated = await awardQuizBonus(user.id, correct);
    setSaving(false);
    setDoneUser(updated || user);
    setResult({ correct, earned });
    setStep('result');
  }

  const isResult = step === 'result';

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }}>
          <div>
            <div className="pay-modal-title">🎁 Your KES 50 Joining Gift</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {isResult ? 'Quiz complete' : `Answer 5 quick questions • Question ${step + 1} of ${total}`}
            </div>
          </div>
        </div>

        <div className="pay-modal-body">
          {!isResult && (
            <>
              <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4', marginBottom: 18 }}>
                Answer these <strong>5 quick questions</strong> (maths, reasoning &amp; writing). Each correct answer earns you <strong style={{ color: '#059669' }}>KES 10</strong> — get all 5 and your <strong>KES 50</strong> activation is covered!
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 4, background: '#E5E7EB', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: '#059669', transition: 'width 0.3s' }} />
              </div>

              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 14 }}>
                {current.q}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {current.options.map(opt => {
                  const active = selected === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelected(opt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        padding: '13px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 15,
                        border: `2px solid ${active ? '#059669' : '#E5E7EB'}`,
                        background: active ? '#F0FFF4' : '#fff',
                        color: '#111827', fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${active ? '#059669' : '#CBD5E1'}`,
                        background: active ? '#059669' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12,
                      }}>{active ? '✓' : ''}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <button
                className="pay-btn"
                style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)', marginTop: 22, opacity: selected == null ? 0.5 : 1 }}
                onClick={handleNext}
                disabled={selected == null || saving}
              >
                {saving ? <><span className="spinner" /> Saving…</> : isLast ? '🎉 Finish & Claim Reward' : 'Next Question →'}
              </button>
            </>
          )}

          {isResult && result && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{result.earned === 50 ? '🎉' : result.earned > 0 ? '🎊' : '📝'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#059669', marginBottom: 4 }}>
                KES {result.earned}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6 }}>
                You answered <strong>{result.correct} of {total}</strong> correctly.
              </div>
              <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4', textAlign: 'left', marginTop: 16 }}>
                {result.earned === 50
                  ? 'Perfect score! Your full KES 50 joining gift has been added to your balance — it fully covers your account activation. 🎁'
                  : result.earned > 0
                  ? `KES ${result.earned} has been added to your balance. When you activate, you can top up the remaining KES ${50 - result.earned} to reach the KES 50 activation fee.`
                  : 'No reward earned this time. You will need to pay the KES 50 activation fee when you choose to start bidding on tasks.'}
              </div>
              <button
                className="pay-btn"
                style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)', marginTop: 20 }}
                onClick={() => onComplete(doneUser)}
              >
                Continue to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Training Payment Modal ───────────────────────────────────────────────────
function TrainingModal({ user, onClose }) {
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleTrainingPay() {
    if (!phone.trim()) { alert('Enter phone number'); return; }
    setLoading(true);
    const res  = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: 132, phone, plan: 'training' }),
    });
    const data = await res.json();
    if (data.status) {
      window.location.href = data.data.authorization_url;
    } else {
      alert('Payment initiation failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }}>
          <div>
            <div className="pay-modal-title">🎓 TRAINING</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Apply for professional training</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="premium-features">
            {[
              ['📚', 'Access to all training materials'],
              ['🎯', 'Hands-on practical assignments'],
              ['🏆', 'Certificate of completion'],
              ['👨‍🏫', 'Expert instructor support'],
              ['💼', 'Job placement assistance'],
              ['♾️', 'Lifetime access to course content'],
            ].map(([icon, text]) => (
              <div key={text} className="premium-feature-item">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
          <div className="pay-amount" style={{ marginTop: 20 }}>
            <div className="pay-amount-label">Training Registration Fee</div>
            <div className="pay-amount-value">KES 132</div>
            <div className="pay-amount-sub">One-time payment • Instant access</div>
          </div>
          <div className="pay-phone-label">M-Pesa / Mobile Money Number</div>
          <input className="pay-phone-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }} onClick={handleTrainingPay} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing...</> : '🎓 Pay & Apply Now'}
          </button>
          <div className="pay-secure">🔐 Secured by Paystack • M-Pesa supported</div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Modal ───────────────────────────────────────────────────────────
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
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)' }}>
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
              <input
                className="pay-phone-input"
                value={referralLink}
                readOnly
                style={{ fontSize: 13, flex: 1, marginBottom: 0 }}
              />
              <button
                onClick={copyLink}
                style={{ padding: '0 20px', background: copied ? '#059669' : 'var(--green)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="referral-stats">
            <div className="referral-stat">
              <div className="referral-stat-num">{user?.referralCount || 0}</div>
              <div className="referral-stat-label">Referrals</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-num">KES {((user?.referralCount || 0) * 132).toLocaleString()}</div>
              <div className="referral-stat-label">Earned</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-num">KES 132</div>
              <div className="referral-stat-label">Per Referral</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[
              { label: '📱 WhatsApp', color: '#25D366', url: `https://wa.me/?text=Join%20Business%20Hub%20and%20earn%20online!%20${encodeURIComponent(referralLink)}` },
              { label: '✉️ Email',    color: '#EA4335', url: `mailto:?subject=Join%20Business%20Hub&body=Hey!%20Join%20me%20on%20Business%20Hub.%20Use%20my%20link:%20${encodeURIComponent(referralLink)}` },
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

// ─── Activity Feed — compact tabbed widget (Live / Pending / Reviews) ────────
function Stars({ n }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 12, letterSpacing: 1 }}>
      {'★'.repeat(n)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function ActivityFeed({ withdrawals, pending }) {
  const [tab,       setTab]       = useState('live');
  const [liveIdx,   setLiveIdx]   = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);

  // Rotate the 3 visible live payouts
  useEffect(() => {
    if (tab !== 'live' || !withdrawals.length) return;
    const t = setInterval(() => setLiveIdx(i => (i + 1) % withdrawals.length), 2200);
    return () => clearInterval(t);
  }, [tab, withdrawals]);

  // Rotate reviews
  useEffect(() => {
    if (tab !== 'reviews') return;
    const t = setInterval(() => setReviewIdx(i => (i + 1) % REVIEWS.length), 4500);
    return () => clearInterval(t);
  }, [tab]);

  const liveShown = withdrawals.length
    ? Array.from({ length: 3 }, (_, k) => withdrawals[(liveIdx + k) % withdrawals.length])
    : [];
  const review = REVIEWS[reviewIdx % REVIEWS.length];

  const TABS = [
    { id: 'live',    label: 'Live',    icon: '💸' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
  ];

  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #F1F5F9' };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 14, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#111827' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
          Withdrawals & Reviews
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 3, borderRadius: 10 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: 'none', cursor: 'pointer',
                borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#111827' : '#6B7280',
                boxShadow: tab === t.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live marquee (only on Live tab) */}
      {tab === 'live' && withdrawals.length > 0 && (
        <div className="ticker-strip" style={{ marginBottom: 10 }}>
          <div className="ticker-track">
            {[...withdrawals.slice(0, 20), ...withdrawals.slice(0, 20)].map((item, i) => (
              <div key={i} className="ticker-pill">
                <span className="ticker-flag">{item.flag}</span>
                <span className="ticker-phone">{item.name || item.phone}</span>
                <span className="ticker-amount">KES {item.amount.toLocaleString()}</span>
                <span className="ticker-success">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content — fixed compact height */}
      <div style={{ minHeight: 132 }}>
        {tab === 'live' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {liveShown.map((item, i) => (
              <div key={`${item.phone}-${i}`} style={item.featured ? { ...row, background: '#F0FFF4', border: '1px solid #A7F3D0' } : row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{item.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{item.name || item.phone}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.name ? `${item.phone} · ${item.country}` : item.country}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>KES {item.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>✓ Successful</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflowY: 'auto' }}>
            {pending.map((p, i) => (
              <div key={i} style={{ ...row, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 18 }}>{p.flag}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.country}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>KES {p.amount.toLocaleString()}</div>
                    <div style={{ fontSize: 10.5, color: '#D97706', fontWeight: 700 }}>⏳ Processing • ~{p.etaMin} min</div>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#FDE68A', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.progress}%`, background: 'linear-gradient(90deg,#F59E0B,#F97316)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && review && (
          <div style={{ background: '#F9FAFB', border: '1px solid #F1F5F9', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#125C37', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{review.name} <span style={{ fontWeight: 400 }}>{review.flag}</span></div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{review.country}</div>
                </div>
              </div>
              <Stars n={review.rating} />
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>“{review.text}”</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
              {REVIEWS.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === reviewIdx % REVIEWS.length ? '#125C37' : '#D1D5DB' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 11.5, color: '#9CA3AF' }}>
        <span>🔒 All payouts verified & secured</span>
        <span>
          {tab === 'pending'
            ? `${pending.length} processing now`
            : tab === 'reviews'
            ? `${REVIEWS.length} member reviews`
            : `${withdrawals.length} payouts today`}
        </span>
      </div>
    </div>
  );
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerMenu({ user, onClose, onUpgrade, onMpesaWithdraw, onOtherWithdraw, onReferral, onTraining, onLogout }) {
  const items = [
    { icon: '🏠', label: 'Dashboard',            action: () => { onClose(); } },
    { icon: '⭐', label: 'Upgrade to Premium',   action: () => { onClose(); onUpgrade(); } },
    { icon: '✅', label: 'Awarded Tasks',         action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: '📲', label: 'Withdraw with M-Pesa', action: () => { onClose(); onMpesaWithdraw(); } },
    { icon: '🌍', label: 'Withdraw from Other Countries', action: () => { onClose(); onOtherWithdraw(); } },
    { icon: '🎓', label: 'Apply for Training',    action: () => { onClose(); onTraining(); } },
    { icon: '🔗', label: 'My Referral Link',      action: () => { onClose(); onReferral(); } },
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
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>{user?.fullName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{user?.email}</div>
              <span className={`status-badge ${user?.activated ? 'status-active' : 'status-inactive'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                {user?.activated ? '✅ Active' : '⚠️ Inactive'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--white)', flexShrink: 0 }}>×</button>
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--green)', marginBottom: 14 }}>
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
  const [user,    setUser]    = useState(null);
  const [mounted, setMounted] = useState(false);

  const [selectedTask,        setSelectedTask]        = useState(null);
  const [showReferral,        setShowReferral]        = useState(false);
  const [showMenu,            setShowMenu]            = useState(false);
  const [showTraining,        setShowTraining]        = useState(false);
  const [showQuiz,            setShowQuiz]            = useState(false);

  const [liveWithdrawals, setLiveWithdrawals] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dbTasks, setDbTasks] = useState([]);   // admin-created tasks from the database
  const [userSubs, setUserSubs] = useState({}); // taskId → { status, createdAt } for this user

  const categories = [
    'All','🔥 Offers','Writing','Research','Data Entry','Design','Marketing',
    'Transcription','Translation','Survey','Testing','Audio','Education','Admin',
  ];

  async function loadUserSubs(uid) {
    if (!uid) return;
    try {
      const r = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'listUserSubmissions', userId: uid }),
      });
      const { data } = await r.json();
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(s => {
          const k = String(s.taskId);
          if (!map[k] || new Date(s.createdAt) > new Date(map[k].createdAt)) map[k] = s;
        });
        setUserSubs(map);
      }
    } catch (_) {}
  }

  useEffect(() => {
    async function init() {
      setMounted(true);
      const u = await getCurrentUser();
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      setLiveWithdrawals(getOrGenerateWithdrawals());
      setPendingWithdrawals(getOrGeneratePending());
      // Joining-gift quiz appears once, right after the first successful sign-up / sign-in
      if (!u.quizDone) setShowQuiz(true);
      loadUserSubs(u.id);
      // Load any admin-created tasks (best-effort; falls back to built-in tasks)
      try {
        const r = await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'listTasks' }),
        });
        const { data } = await r.json();
        if (Array.isArray(data)) setDbTasks(data);
      } catch (_) {}
    }
    init();
  }, [router]);

  // Re-fetch user whenever the tab becomes visible (picks up Supabase admin edits)
  useEffect(() => {
    if (!user) return;
    const refresh = async () => {
      if (document.visibilityState === 'visible') {
        const u = await getCurrentUser().catch(() => null);
        if (u) { setUser(u); loadUserSubs(u.id); }
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [user]);

  const handleLogout       = useCallback(() => { logout(); router.push('/'); }, [router]);
  const handleViewTask     = useCallback(task => {
    if (!user?.activated) { router.push('/activate'); } else { setSelectedTask(task); }
  }, [user, router]);
  const handleBidClick     = useCallback(() => { setSelectedTask(null); router.push('/activate'); }, [router]);

  function handleSubmitTask(task) {
    if (!user?.activated) { router.push('/activate'); return; }        // active account required first
    if (!isOffer(task) && !user.premium) { router.push('/premium'); return; }  // offers skip premium
    router.push(`/submit?task=${task.id}`);   // attach & upload your completed work
  }

  // Use the database tasks as the source of truth once any exist (built-ins are
  // migrated in), falling back to the built-in list if the DB is empty/unreachable.
  const source = dbTasks.length ? dbTasks : (TASKS || []);
  const now = Date.now();
  const allTasks = source.filter(t => {
    const sub = userSubs[String(t.id)];
    if (sub) {
      // The user submitted this task — keep it visible ("already submitted /
      // done") until 3 hours pass, then clear it from their dashboard.
      return !(sub.createdAt && now - new Date(sub.createdAt).getTime() > THREE_HOURS);
    }
    // Not submitted by this user: hide if the limit is reached (e.g. an offer
    // someone else already took) or if an offer's 9-hour window has ended.
    if (Number(t.slots) > 0 && Number(t.claimed) >= Number(t.slots)) return false;
    if (isOffer(t) && t.createdAt && now - new Date(t.createdAt).getTime() > NINE_HOURS) return false;
    return true;
  });

  const filteredTasks = allTasks.filter(t => {
    const matchCat    = filter === 'All' ? true : filter === '🔥 Offers' ? isOffer(t) : t.category === filter;
    const matchSearch = !search
      || t.title.toLowerCase().includes(search.toLowerCase())
      || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!mounted || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
      </div>
    );
  }

  const initials     = user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`;

  if (user.suspended) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '48px 36px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#991B1B', marginBottom: 8 }}>
            Account Suspended
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 20 }}>
            Your account has been suspended and you cannot access Business Hub at this time.
          </p>
          {user.suspendReason && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 13, color: '#7F1D1D' }}>{user.suspendReason}</div>
            </div>
          )}
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>
            If you believe this is a mistake, please contact support at{' '}
            <a href="mailto:businesshub.comke@gmail.com" style={{ color: '#DC2626' }}>businesshub.comke@gmail.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
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
                {user.activated ? '✅ Active — Access valid 1 month' : '⚠️ Inactive — Pay KES 50 to Bid'}
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
              <div className="referral-banner-title">Refer Friends &amp; Earn KES 70 Each</div>
              <div className="referral-banner-sub">Share your link • Track referrals • Get paid instantly</div>
            </div>
          </div>
          <div className="referral-banner-link">
            <span className="referral-link-preview">{referralLink.replace('https://', '')}</span>
            <button
              className="referral-copy-btn"
              onClick={e => {
                e.stopPropagation();
                navigator.clipboard.writeText(referralLink);
                alert('Referral link copied!');
              }}
            >
              Copy Link →
            </button>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => router.push('/premium')}>
            <span className="quick-action-icon">⭐</span>
            <span className="quick-action-label">{user?.premium ? 'Renew Premium' : 'Upgrade Premium'}</span>
          </button>
          <button className="quick-action-card" onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="quick-action-icon">✅</span>
            <span className="quick-action-label">Awarded Tasks</span>
          </button>
          <button className="quick-action-card quick-action-mpesa" onClick={() => router.push('/withdraw?method=mpesa')}>
            <span className="quick-action-icon">📲</span>
            <span className="quick-action-label">Withdraw with M-Pesa</span>
          </button>
          <button className="quick-action-card" onClick={() => setShowTraining(true)}>
            <span className="quick-action-icon">🎓</span>
            <span className="quick-action-label">Apply for Training</span>
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            { icon: '📋', num: (TASKS || []).length,                    label: 'Available Tasks' },
            { icon: '💼', num: user.activeBids || 0,                     label: 'Active Bids' },
            { icon: '✅', num: user.completedTasks || 0,                 label: 'Completed Tasks' },
            { icon: '💰', num: `KES ${(user.balance || 0).toLocaleString()}`, label: 'Total Earned' },
          ].map(({ icon, num, label }) => (
            <div key={label} className="dash-stat-card">
              <div className="dash-stat-icon">{icon}</div>
              <div>
                <div className="dash-stat-num">{num}</div>
                <div className="dash-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Withdrawals Ticker */}
        <ActivityFeed withdrawals={liveWithdrawals} pending={pendingWithdrawals} />

        {/* Tasks Section */}
        <div id="tasks-section">
          <div className="dash-section-title">Available Tasks</div>
          <div className="dash-section-sub">Browse and bid on tasks that match your skills</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '10px 16px', border: '1.5px solid var(--gray-light)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--black)', background: 'var(--white)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{ padding: '6px 16px', borderRadius: 100, border: '1.5px solid', borderColor: filter === cat ? 'var(--green)' : 'var(--gray-light)', background: filter === cat ? 'var(--green)' : 'var(--white)', color: filter === cat ? 'var(--white)' : 'var(--gray)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
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
            {filteredTasks.map(task => {
              const sub   = userSubs[String(task.id)];
              const offer = isOffer(task);
              return (
                <div key={task.id} className="task-card" style={offer ? { border: '1.5px solid #F59E0B' } : undefined}>
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
                  {offer && (
                    <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 999, marginBottom: 6 }}>
                      🔥 OFFER · No premium needed · 9-hour deal
                    </div>
                  )}
                  <div className="task-category">{task.category}</div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-desc">{task.description}</div>
                  <div className="task-actions">
                    {sub ? (
                      <div style={{ flex: 1, textAlign: 'center', padding: '10px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                        background: sub.status === 'approved' ? '#D1FAE5' : '#DBEAFE',
                        color:      sub.status === 'approved' ? '#065F46' : '#1E40AF' }}>
                        {sub.status === 'approved' ? '✅ Already done' : '✅ Already submitted'}
                      </div>
                    ) : (
                      <>
                        <button className="task-view-btn" onClick={() => handleViewTask(task)}>👁️ View / Bid</button>
                        <button className="task-submit-btn" onClick={() => handleSubmitTask(task)} title="Attach your work & submit">📤 Submit</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      {showQuiz && user && !user.quizDone && (
        <QuizModal
          user={user}
          onComplete={(u) => { if (u) setUser(u); setShowQuiz(false); }}
        />
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onBidClick={handleBidClick} onUpgradeClick={() => router.push('/premium')} onSubmit={handleSubmitTask} />
      )}
      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showTraining && <TrainingModal user={user} onClose={() => setShowTraining(false)} />}

      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onUpgrade={() => router.push('/premium')}
          onMpesaWithdraw={() => router.push('/withdraw?method=mpesa')}
          onOtherWithdraw={() => router.push('/withdraw?method=international')}
          onReferral={() => setShowReferral(true)}
          onTraining={() => setShowTraining(true)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
