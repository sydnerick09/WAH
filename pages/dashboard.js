// pages/dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
// Gweno Hub Dashboard
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
import { getCurrentUser, logout, awardQuizBonus, getToken, recordDailyLogin } from '../lib/auth';
import { applyForTask, listMyApplications, applicationsByTask } from '../lib/applications';
import { TASKS } from '../lib/tasks';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import { DashboardSkeleton } from '../components/Skeleton';
import { GamificationCard, RewardToast } from '../components/Gamification';
import { computeXp, levelInfo, LEVELS } from '../lib/gamification';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Limited-time "offer" tasks (id starts with offer_): no premium needed, one
// submission each. Timing (offer window + the post-submission clear) is handled
// server-side; the client only reacts to the flags the API returns.
const isOffer = t => String(t?.id || '').startsWith('offer_');

// Fisher-Yates shuffle, scatters offer tasks randomly among the others.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getOrGenerateWithdrawals() {
  const LS_KEY = 'bh_live_withdrawals_v7';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const kenyaSrc   = { country: 'Kenya',   prefixes: ['+25471','+25472','+25473','+25474','+25475','+25476','+25477','+25478','+25479','+25470'] };
  const jamaicaSrc = { country: 'Jamaica', prefixes: ['+1876','+1658'] };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const mask = p => `${p}*****${String(rand(10, 99))}`;

  // 70 payouts today: 63 Kenyan (KES 2,100 to 9,300) + 7 Jamaican (KES 2,100 to 7,200)
  const records = [
    ...Array.from({ length: 63 }, () => {
      const prefix = kenyaSrc.prefixes[rand(0, kenyaSrc.prefixes.length - 1)];
      return { country: kenyaSrc.country, phone: mask(prefix), amount: rand(2100, 9300) };
    }),
    ...Array.from({ length: 7 }, () => {
      const prefix = jamaicaSrc.prefixes[rand(0, jamaicaSrc.prefixes.length - 1)];
      return { country: jamaicaSrc.country, phone: mask(prefix), amount: rand(2100, 7200) };
    }),
  ];

  // Shuffle so Kenyan/other are mixed
  for (let i = records.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [records[i], records[j]] = [records[j], records[i]];
  }

  // Featured payout, a real member's successful withdrawal today. Phone masked
  // in the same +254 style as the others; seeded frequently so it recurs in the
  // ticker and the rotating list for strong social proof.
  const featured = {
    country: 'Kenya',
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

// Pending payouts, currently being processed (shown in the Pending tab)
function getOrGeneratePending() {
  const LS_KEY = 'bh_pending_withdrawals_v1';
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const people = [
    { country: 'Kenya',    name: 'Brian K.'   }, { country: 'Kenya',    name: 'Mercy A.'  },
    { country: 'Kenya',    name: 'Dennis O.'  }, { country: 'Kenya',    name: 'Faith W.'  },
    { country: 'Kenya',    name: 'Kevin M.'   }, { country: 'Nigeria',  name: 'Chidi E.'  },
    { country: 'Jamaica',  name: 'Andre C.'   }, { country: 'Ghana',    name: 'Kwame A.'  },
    { country: 'Uganda',   name: 'Sarah N.'   }, { country: 'Kenya',    name: 'Purity W.' },
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

// Member reviews, includes the two client-supplied testimonials verbatim.
const REVIEWS = [
  { name: 'James Otieno',      country: 'Nairobi, Kenya',    rating: 4,
    text: 'I tried withdrawing once, but it failed, but I tried twice, then it went through.' },
  { name: 'Wanjiku Maina',     country: 'Nakuru, Kenya',     rating: 5,
    text: 'Guys, you need to have correct details before you withdraw so that you avoid the inconveniences of paying the withdrawal fee twice or thrice.' },
  { name: 'Grace Achieng',     country: 'Kisumu, Kenya',     rating: 5,
    text: 'The M-Pesa payout hit my phone in under two minutes. Double-checking my number first made it smooth. Gweno Hub is legit.' },
  { name: 'Chinedu Okafor',    country: 'Lagos, Nigeria',    rating: 5,
    text: 'I was skeptical at first, but after my very first successful withdrawal I upgraded to premium. Worth every naira.' },
  { name: 'Ama Mensah',        country: 'Accra, Ghana',      rating: 4,
    text: 'Accuracy is everything here, confirm your account details and the payment goes through the first time, no repeat fees.' },
  { name: 'Andre Campbell',    country: 'Kingston, Jamaica', rating: 5,
    text: 'From Kingston with love. Once my bank details were correct, the transfer came through clean. Professional platform.' },
  { name: 'Sarah Nakato',      country: 'Kampala, Uganda',   rating: 5,
    text: 'Consistent tasks and honest payouts. I now earn a steady side income every single week.' },
  { name: 'Brian Kiptoo',      country: 'Eldoret, Kenya',    rating: 4,
    text: 'Support helped me fix a failed withdrawal within minutes. Enter the right details and you will have zero problems.' },
];


// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskModal({ task, user, application, onClose, onBidClick, onApply, onUpgradeClick, onSubmit }) {
  if (!task) return null;
  const isActivated = user?.activated;
  const isPremium   = user?.premium;
  const offer       = isOffer(task);
  const appStatus   = application?.status || null;   // null | pending | approved | rejected | correction
  const approved    = appStatus === 'approved';

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
              ['Posted By',   'user',     task.poster],
              ['Location',    'mapPin',   task.location],
              ['Date Posted', 'calendar', task.datePosted],
              ['Category',    'folder',   task.category],
              ...(task.dueDate ? [['Due Date', 'clock', task.dueDate]] : []),
            ].map(([label, icon, value]) => (
              <div key={label} className="modal-meta-item">
                <div className="modal-meta-label">{label}</div>
                <div className="modal-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name={icon} size={14} /> {value}</div>
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
          {/* Not signed-in / not activated yet */}
          {!isActivated && (
            <button className="bid-btn" onClick={() => onBidClick(task)}><Icon name="briefcase" size={16} /> Bid on This Task</button>
          )}

          {/* Offers skip the proposal step entirely */}
          {isActivated && offer && (
            <button className="submit-btn" onClick={handleSubmit}><Icon name="upload" size={16} /> Submit This Task (Offer, No Premium)</button>
          )}

          {/* Regular tasks: proposal required before work can be submitted */}
          {isActivated && !offer && (
            <>
              {(appStatus === 'rejected' || appStatus === 'correction') && (
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', margin: '4px 0 12px', fontSize: 13, color: '#1f2937' }}>
                  <strong>{appStatus === 'rejected' ? 'Application rejected.' : 'Corrections requested.'}</strong>
                  {application?.reason ? <div style={{ marginTop: 4, color: '#111827' }}>{application.reason}</div> : null}
                </div>
              )}

              {(!appStatus || appStatus === 'rejected' || appStatus === 'correction') && (
                <button className="submit-btn" onClick={() => onApply(task)}
                  style={{ background: '#000000' }}>
                  <Icon name={appStatus ? 'refresh' : 'edit'} size={16} /> {appStatus ? 'Update & Resubmit Proposal' : 'Apply, Submit a Proposal'}
                </button>
              )}

              {appStatus === 'pending' && (
                <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="clock" size={15} /> Your proposal is under review. You&apos;ll be able to start this task once it&apos;s approved.
                </div>
              )}

              {approved && !isPremium && (
                <>
                  <div style={{ background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#1f2937', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="check" size={15} /> Proposal approved, this task is unlocked for you.
                  </div>
                  <button className="submit-btn" onClick={handleSubmit} style={{ background: '#000000' }}><Icon name="star" size={16} /> Upgrade to Premium to Submit</button>
                </>
              )}

              {approved && isPremium && (
                <>
                  <div style={{ background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#1f2937', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="check" size={15} /> Proposal approved, this task is unlocked for you.
                  </div>
                  <button className="submit-btn" onClick={handleSubmit}><Icon name="upload" size={16} /> Submit This Task</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Proposal (Bid) Form ──────────────────────────────────────────────────────
// A user must submit a proposal and have it approved before working on a task.
// Proposals are kept short, max 40 words per field, to avoid bulk text.
const MAX_PROPOSAL_WORDS = 40;
const wordCount  = s => { const t = String(s || '').trim(); return t ? t.split(/\s+/).length : 0; };
const clampWords = (s, max) => {
  const words = String(s || '').trim().split(/\s+/).filter(Boolean);
  return words.length <= max ? s : words.slice(0, max).join(' ');
};

function ProposalModal({ task, existing, onClose, onSubmit }) {
  const [message, setMessage] = useState(existing?.message || '');
  const [extra,   setExtra]   = useState(existing?.extra || '');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  const msgWords   = wordCount(message);
  const extraWords = wordCount(extra);

  async function submit() {
    if (!message.trim()) { setError('Please write a short message describing why you are suitable.'); return; }
    if (msgWords > MAX_PROPOSAL_WORDS || extraWords > MAX_PROPOSAL_WORDS) {
      setError(`Please keep each field to ${MAX_PROPOSAL_WORDS} words or fewer.`); return;
    }
    setError(''); setBusy(true);
    const res = await onSubmit(message.trim(), extra.trim());
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.message || 'Could not submit your proposal.');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{done ? 'Proposal Submitted' : 'Apply for This Task'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ marginBottom: 8, color: '#000', display: 'flex', justifyContent: 'center' }}><Icon name="mail" size={48} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#374151', marginBottom: 6 }}>Proposal sent for review</div>
              <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.6 }}>
                Your proposal for <strong>{task.title}</strong> has been submitted. Our team will review it, and once it&apos;s
                <strong> approved</strong> the task will unlock on your dashboard so you can start working.
              </p>
              <button className="submit-btn" style={{ marginTop: 16 }} onClick={onClose}>Got it</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 4 }}>
                You&apos;re applying for <strong>{task.title}</strong>. Tell us why you&apos;re a good fit, this proposal
                is reviewed before you can begin the task.
              </p>
              <div className="pay-phone-label" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>Your proposal / cover letter <span style={{ color: '#374151' }}>*</span></span>
                <span style={{ fontSize: 11, fontWeight: 700, color: msgWords >= MAX_PROPOSAL_WORDS ? '#374151' : 'var(--gray)' }}>{msgWords}/{MAX_PROPOSAL_WORDS} words</span>
              </div>
              <textarea
                className="pay-phone-input"
                value={message}
                onChange={e => setMessage(clampWords(e.target.value, MAX_PROPOSAL_WORDS))}
                placeholder="Briefly say why you're suitable, keep it short (max 40 words)…"
                rows={4}
                style={{ resize: 'vertical', minHeight: 92, fontFamily: 'inherit' }}
              />
              <div className="pay-phone-label" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>Additional information (optional)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: extraWords >= MAX_PROPOSAL_WORDS ? '#374151' : 'var(--gray)' }}>{extraWords}/{MAX_PROPOSAL_WORDS} words</span>
              </div>
              <textarea
                className="pay-phone-input"
                value={extra}
                onChange={e => setExtra(clampWords(e.target.value, MAX_PROPOSAL_WORDS))}
                placeholder="Portfolio link, availability… (optional, max 40 words)"
                rows={3}
                style={{ resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
              />
              {error && <div style={{ color: '#4b5563', fontSize: 12.5, marginTop: 10 }}>{error}</div>}
              <button className="submit-btn" style={{ marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
                {busy ? <><span className="spinner" /> Submitting…</> : <><Icon name="upload" size={16} /> Submit Proposal</>}
              </button>
              <div className="pay-secure" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Reviewed by our team before the task unlocks</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Application status notices (approved / pending / needs attention) ─────────
function ApplicationNotices({ apps, subs, onStart }) {
  const list = Object.values(apps || {});
  if (!list.length) return null;

  // Approved and not yet submitted → actionable "start" notice.
  const approved = list.filter(a => a.status === 'approved' && !subs[String(a.taskId)]);
  const pending  = list.filter(a => a.status === 'pending');
  const attention = list.filter(a => a.status === 'rejected' || a.status === 'correction');

  if (!approved.length && !pending.length && !attention.length) return null;

  return (
    <div style={{ margin: '0 0 18px' }}>
      {approved.map(a => (
        <div key={`ap-${a.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
          <div style={{ fontSize: 13.5, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={15} /> <span><strong>Approved!</strong> Your proposal for <strong>{a.taskTitle}</strong> was accepted, you can start it now.</span>
          </div>
          <button className="task-view-btn" style={{ padding: '8px 14px', whiteSpace: 'nowrap' }} onClick={() => onStart(a.taskId)}>Start task</button>
        </div>
      ))}
      {attention.map(a => (
        <div key={`at-${a.id}`} style={{ background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 12, padding: '12px 16px', marginBottom: 8, fontSize: 13.5, color: '#374151' }}>
          <Icon name={a.status === 'rejected' ? 'x' : 'edit'} size={14} /> Your proposal for <strong>{a.taskTitle}</strong> {a.status === 'rejected' ? 'was not approved' : 'needs corrections'}.
          {a.reason ? <span>, {a.reason}</span> : null} <button onClick={() => onStart(a.taskId)} style={{ background: 'none', border: 'none', color: '#374151', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13.5 }}>Open</button>
        </div>
      ))}
      {pending.length > 0 && (
        <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={14} /> {pending.length} proposal{pending.length === 1 ? '' : 's'} awaiting review.
        </div>
      )}
    </div>
  );
}

// ─── Joining-Gift Quiz ────────────────────────────────────────────────────────
// Five general-knowledge questions. KES 10 per correct answer (max KES 50).
// The user is never told whether an answer was right, they just move on, and
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

    // Grade, we generated the questions, so we know the answers
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
        <div className="pay-modal-header" style={{ background: '#000000' }}>
          <div>
            <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="star" size={20} /> Your KES 50 Joining Gift</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {isResult ? 'Quiz complete' : `Answer 5 quick questions • Question ${step + 1} of ${total}`}
            </div>
          </div>
        </div>

        <div className="pay-modal-body">
          {!isResult && (
            <>
              <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb', marginBottom: 18 }}>
                Answer these <strong>5 quick questions</strong> (maths, reasoning &amp; writing). Each correct answer earns you <strong style={{ color: '#374151' }}>KES 10</strong>, get all 5 and your <strong>KES 50</strong> activation is covered!
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 4, background: '#E5E7EB', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: '#374151', transition: 'width 0.3s' }} />
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
                        border: `2px solid ${active ? '#374151' : '#E5E7EB'}`,
                        background: active ? '#f9fafb' : '#fff',
                        color: '#111827', fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${active ? '#374151' : '#CBD5E1'}`,
                        background: active ? '#374151' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12,
                      }}>{active ? <Icon name="check" size={12} /> : ''}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <button
                className="pay-btn"
                style={{ background: '#000000', marginTop: 22, opacity: selected == null ? 0.5 : 1 }}
                onClick={handleNext}
                disabled={selected == null || saving}
              >
                {saving ? <><span className="spinner" /> Saving…</> : isLast ? 'Finish & Claim Reward' : 'Next Question'}
              </button>
            </>
          )}

          {isResult && result && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#000' }}><Icon name={result.earned > 0 ? 'star' : 'edit'} size={52} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#374151', marginBottom: 4 }}>
                KES {result.earned}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6 }}>
                You answered <strong>{result.correct} of {total}</strong> correctly.
              </div>
              <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb', textAlign: 'left', marginTop: 16 }}>
                {result.earned === 50
                  ? 'Perfect score! Your full KES 50 joining gift has been added to your balance, it fully covers your account activation.'
                  : result.earned > 0
                  ? `KES ${result.earned} has been added to your balance. When you activate, you can top up the remaining KES ${50 - result.earned} to reach the KES 50 activation fee.`
                  : 'No reward earned this time. You will need to pay the KES 50 activation fee when you choose to start bidding on tasks.'}
              </div>
              <button
                className="pay-btn"
                style={{ background: '#000000', marginTop: 20 }}
                onClick={() => onComplete(doneUser)}
              >
                Continue to Dashboard
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
        <div className="pay-modal-header" style={{ background: '#000000' }}>
          <div>
            <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="graduation" size={20} /> TRAINING</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Apply for professional training</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="premium-features">
            {[
              ['folder',     'Access to all training materials'],
              ['check',      'Hands-on practical assignments'],
              ['star',       'Certificate of completion'],
              ['user',       'Expert instructor support'],
              ['briefcase',  'Job placement assistance'],
              ['refresh',    'Lifetime access to course content'],
            ].map(([icon, text]) => (
              <div key={text} className="premium-feature-item">
                <span style={{ display: 'flex' }}><Icon name={icon} size={18} /></span><span>{text}</span>
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
          <button className="pay-btn" style={{ background: '#000000' }} onClick={handleTrainingPay} disabled={loading}>
            {loading ? <><span className="spinner" /> Processing...</> : <><Icon name="graduation" size={16} /> Pay & Apply Now</>}
          </button>
          <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Secured by Paystack • M-Pesa supported</div>
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
        <div className="pay-modal-header" style={{ background: '#000000' }}>
          <div>
            <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="link" size={20} /> Your Referral Link</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Earn KES 132 per referral</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb' }}>
            Share your referral link and earn <strong style={{ color: '#374151' }}>KES 132</strong> for every friend who signs up and activates their account.
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
                style={{ padding: '0 20px', background: copied ? '#374151' : 'var(--green)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
              >
                {copied ? 'Copied!' : 'Copy'}
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
              { label: 'WhatsApp', icon: 'share', url: `https://wa.me/?text=Join%20Gweno%20Hub%20and%20earn%20online!%20${encodeURIComponent(referralLink)}` },
              { label: 'Email',    icon: 'mail',  url: `mailto:?subject=Join%20Gweno%20Hub&body=Hey!%20Join%20me%20on%20Gweno%20Hub.%20Use%20my%20link:%20${encodeURIComponent(referralLink)}` },
            ].map(btn => (
              <a key={btn.label} href={user?.activated ? btn.url : '#'} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: 12, background: '#000000', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: user?.activated ? 1 : 0.5, pointerEvents: user?.activated ? 'auto' : 'none' }}>
                <Icon name={btn.icon} size={16} /> {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Feed, compact tabbed widget (Live / Pending / Reviews) ────────
function Stars({ n }) {
  return (
    <span style={{ color: '#9ca3af', fontSize: 12, letterSpacing: 1 }}>
      {'★'.repeat(n)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

// Monochrome country badge (replaces flag emojis in the social-proof feed).
function CountryBadge({ country, size = 20 }) {
  const code = String(country || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '··';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: '#111827', color: '#fff',
      fontSize: Math.round(size * 0.42), fontWeight: 700, letterSpacing: 0.3, flexShrink: 0,
    }}>{code}</span>
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
    { id: 'live',    label: 'Live',    icon: 'cash' },
    { id: 'pending', label: 'Pending', icon: 'clock' },
    { id: 'reviews', label: 'Reviews', icon: 'star' },
  ];

  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #F1F5F9' };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 14, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#111827' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4b5563', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
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
              <Icon name={t.icon} size={13} />{t.label}
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
                <CountryBadge country={item.country} size={16} />
                <span className="ticker-phone">{item.name || item.phone}</span>
                <span className="ticker-amount">KES {item.amount.toLocaleString()}</span>
                <span className="ticker-success" style={{ display: 'inline-flex' }}><Icon name="check" size={11} /></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content, fixed compact height */}
      <div style={{ minHeight: 132 }}>
        {tab === 'live' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {liveShown.map((item, i) => (
              <div key={`${item.phone}-${i}`} style={item.featured ? { ...row, background: '#f9fafb', border: '1px solid #e5e7eb' } : row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <CountryBadge country={item.country} size={28} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{item.name || item.phone}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.name ? `${item.phone} · ${item.country}` : item.country}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#374151' }}>KES {item.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: '#374151', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}><Icon name="check" size={11} /> Successful</div>
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
                    <CountryBadge country={p.country} size={28} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.country}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>KES {p.amount.toLocaleString()}</div>
                    <div style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}><Icon name="clock" size={11} /> Processing • ~{p.etaMin} min</div>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.progress}%`, background: '#111827' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && review && (
          <div style={{ background: '#F9FAFB', border: '1px solid #F1F5F9', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#1f2937', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>{review.name} <CountryBadge country={review.country} size={15} /></div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{review.country}</div>
                </div>
              </div>
              <Stars n={review.rating} />
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>“{review.text}”</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
              {REVIEWS.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === reviewIdx % REVIEWS.length ? '#1f2937' : '#D1D5DB' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 11.5, color: '#9CA3AF' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="lock" size={12} /> All payouts verified & secured</span>
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
function HamburgerMenu({ user, onClose, onProfile, onUpgrade, onMpesaWithdraw, onOtherWithdraw, onReferral, onTraining, onLogout }) {
  const items = [
    { icon: 'home',       label: 'Dashboard',                    action: () => { onClose(); } },
    { icon: 'user',       label: 'My Profile',                   action: () => { onClose(); onProfile(); } },
    { icon: 'star',       label: 'Upgrade to Premium',           action: () => { onClose(); onUpgrade(); } },
    { icon: 'check',      label: 'Awarded Tasks',                action: () => { onClose(); document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); } },
    { icon: 'smartphone', label: 'Withdraw with M-Pesa', mpesa: true, action: () => { onClose(); onMpesaWithdraw(); } },
    { icon: 'globe',      label: 'Withdraw from Other Countries', action: () => { onClose(); onOtherWithdraw(); } },
    { icon: 'graduation', label: 'Apply for Training',           action: () => { onClose(); onTraining(); } },
    { icon: 'link',       label: 'My Referral Link',             action: () => { onClose(); onReferral(); } },
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
                <Icon name={user?.activated ? 'check' : 'warning'} size={12} /> {user?.activated ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--white)', flexShrink: 0 }}>×</button>
        </div>
        <nav className="hamburger-nav">
          {items.map(item => (
            <button key={item.label} className="hamburger-item" onClick={item.action}>
              <span className="hamburger-item-icon" style={item.mpesa ? { color: 'var(--mpesa-green)' } : undefined}>
                <Icon name={item.icon} size={18} />
              </span>
              <span>{item.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--gray-light)', display: 'flex' }}><Icon name="chevronRight" size={16} /></span>
            </button>
          ))}
        </nav>
        <div className="hamburger-footer">
          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>Account Balance</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--green)', marginBottom: 14 }}>
            KES {(user?.balance || 0).toLocaleString()}
          </div>
          <button className="logout-btn" style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={onLogout}>
            <Icon name="power" size={16} /> Sign Out
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
  const [rewardToast,         setRewardToast]         = useState(null);

  const [liveWithdrawals, setLiveWithdrawals] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dbTasks, setDbTasks] = useState([]);   // admin-created tasks from the database
  const [tasksReady, setTasksReady] = useState(false);   // true once the DB task list has loaded
  const [userSubs, setUserSubs] = useState({}); // taskId → { status, createdAt } for this user
  const [userApps, setUserApps] = useState({}); // taskId → application (proposal) for this user
  const [applyTask, setApplyTask] = useState(null); // task the proposal form is open for

  const categories = [
    'All','Offers','Writing','Research','Data Entry','Design','Marketing',
    'Transcription','Translation','Survey','Testing','Audio','Education','Admin',
  ];

  async function loadUserSubs(uid) {
    if (!uid) return;
    try {
      const r = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'listUserSubmissions', userId: uid, authToken: getToken() }),
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

  async function loadUserApps(u) {
    if (!u?.id) return;
    try {
      const apps = await listMyApplications({ userId: u.id, email: u.email });
      setUserApps(applicationsByTask(apps));
    } catch (_) {}
  }

  // Gamification: record the daily login (server-dated) and surface a streak /
  // level-up reward toast. Streak XP is applied server-side; we reflect it here.
  async function bootstrapGamification(u) {
    if (!u?.id) return;
    let cur = u;
    try {
      const gl = await recordDailyLogin(u.id);
      if (gl?.success && gl.isNewDay) {
        cur = { ...u, streak: gl.streak };
        setUser(cur);
        setRewardToast({ icon: 'flame', title: `Day ${gl.streak} streak!`, sub: `+${gl.bonusXp} XP daily bonus` });
      }
    } catch (_) {}
    try {
      const idx  = levelInfo(computeXp(cur)).index;
      const key  = `bh_last_level_${u.id}`;
      const prev = Number(localStorage.getItem(key) ?? idx);
      if (idx > prev) setRewardToast({ icon: 'zap', title: `Level up — ${LEVELS[idx].name}!`, sub: 'New rewards unlocked' });
      localStorage.setItem(key, String(idx));
    } catch (_) {}
  }

  useEffect(() => {
    async function init() {
      setMounted(true);
      const u = await getCurrentUser();
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      bootstrapGamification(u);
      setLiveWithdrawals(getOrGenerateWithdrawals());
      setPendingWithdrawals(getOrGeneratePending());
      // Joining-gift quiz appears once, right after the first successful sign-up / sign-in
      if (!u.quizDone) setShowQuiz(true);
      loadUserSubs(u.id);
      loadUserApps(u);
      // Load any admin-created tasks (best-effort; falls back to built-in tasks)
      try {
        const r = await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'listTasks' }),
        });
        const { data } = await r.json();
        if (Array.isArray(data)) { setDbTasks(shuffle(data)); setTasksReady(true); }   // DB is now the source of truth
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
        if (u) { setUser(u); loadUserSubs(u.id); loadUserApps(u); }
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [user]);

  const handleLogout       = useCallback(() => {
    // Confirm before signing out; cancel keeps the user where they are.
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to sign out?')) return;
    logout();                 // clears the session + any stored auth data
    router.push('/login');    // back to the Login screen
  }, [router]);
  const handleViewTask     = useCallback(task => {
    if (!user?.activated) { router.push('/activate'); } else { setSelectedTask(task); }
  }, [user, router]);
  const handleBidClick     = useCallback(() => { setSelectedTask(null); router.push('/activate'); }, [router]);

  // Open the proposal form for a task (must be activated first).
  const handleApplyClick = useCallback(task => {
    if (!user?.activated) { setSelectedTask(null); router.push('/activate'); return; }
    setSelectedTask(null);
    setApplyTask(task);
  }, [user, router]);

  // Submit a proposal; returns { ok, message } so the modal can show feedback.
  // Network/server failures are caught so the form never hangs.
  async function submitProposal(message, extra) {
    if (!applyTask || !user) return { ok: false, message: 'Something went wrong.' };
    try {
      const res = await applyForTask({ user, task: applyTask, message, extra });
      if (res.success) {
        await loadUserApps(user);
        return { ok: true };
      }
      return { ok: false, message: res.message || 'Could not submit your proposal.' };
    } catch {
      return { ok: false, message: 'Network error. Please check your connection and try again.' };
    }
  }

  // Jump straight to a task's modal from the notices banner.
  function openTaskById(taskId) {
    const t = (tasksReady && dbTasks.length ? dbTasks : (TASKS || [])).find(x => String(x.id) === String(taskId));
    if (t) setSelectedTask(t);
  }

  function handleSubmitTask(task) {
    if (!user?.activated) { router.push('/activate'); return; }        // active account required first
    // Regular tasks require an approved proposal before work can be submitted.
    if (!isOffer(task)) {
      const app = userApps[String(task.id)];
      if (!app || app.status !== 'approved') { setApplyTask(task); return; }
    }
    if (!isOffer(task) && !user.premium) { router.push('/premium'); return; }  // offers skip premium
    router.push(`/submit?task=${task.id}`);   // attach & upload your completed work
  }

  // Use the database tasks as the source of truth whenever the DB has any,
  // otherwise fall back to the built-in list so the dashboard is never empty
  // (e.g. before load, offline, or after all DB tasks were cleared).
  const source = (tasksReady && dbTasks.length) ? dbTasks : (TASKS || []);
  const allTasks = source.filter(t => {
    const sub = userSubs[String(t.id)];
    if (sub) {
      // The user submitted this task, keep it visible ("already submitted /
      // done") until the server marks it cleared, then remove it.
      return !sub.cleared;
    }
    // Not submitted by this user: hide if the limit is reached (e.g. an offer
    // someone else already took). Expired offers are already excluded by the API.
    if (Number(t.slots) > 0 && Number(t.claimed) >= Number(t.slots)) return false;
    return true;
  });

  const filteredTasks = allTasks.filter(t => {
    const matchCat    = filter === 'All' ? true : filter === 'Offers' ? isOffer(t) : t.category === filter;
    const matchSearch = !search
      || t.title.toLowerCase().includes(search.toLowerCase())
      || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!mounted || !user) {
    return <DashboardSkeleton />;
  }

  const initials     = user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER123'}`;

  if (user.suspended) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '48px 36px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="lock" size={52} /></div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#1f2937', marginBottom: 8 }}>
            Account On Hold
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 20 }}>
            Your account has been placed on hold and you cannot access Gweno Hub at this time.
          </p>
          {user.suspendReason && (
            <div style={{ background: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 13, color: '#111827' }}>{user.suspendReason}</div>
            </div>
          )}
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>
            If you believe this is a mistake, please contact support at{' '}
            <a href="mailto:businesshub.comke@gmail.com" style={{ color: '#374151' }}>businesshub.comke@gmail.com</a>
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
          <Link href="/" className="dash-logo">GWENO HUB</Link>
          <div className="dash-user">
            <Link href="/profile" className="dash-user-info" style={{ textDecoration: 'none' }}>
              <div className="dash-user-name">{user.fullName}</div>
              <div className="dash-user-email">{user.email}</div>
            </Link>
            <Link href="/profile" className="dash-avatar" aria-label="Open profile" title="Profile">
              {user.avatar
                ? <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </Link>
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
            <h2>Welcome back, {user.fullName.split(' ')[0]}</h2>
            <p>{user.email} • {user.country}</p>
            <div style={{ marginTop: 12 }}>
              <span className={`status-badge ${user.activated ? 'status-active' : 'status-inactive'}`}>
                <Icon name={user.activated ? 'check' : 'warning'} size={13} />
                {user.activated ? 'Active, Access valid 1 month' : 'Inactive, Pay KES 50 to Bid'}
              </span>
            </div>
          </div>
          <div className="dash-balance-box">
            <div className="dash-balance-label">Account Balance</div>
            <div className="dash-balance-amount">KES {(user.balance || 0).toLocaleString()}</div>
            <div className="dash-balance-sub">Available for withdrawal</div>
          </div>
        </div>

        {/* Gamification */}
        <GamificationCard user={user} />

        {/* Referral Banner */}
        <div className="referral-banner" onClick={() => setShowReferral(true)}>
          <div className="referral-banner-left">
            <span className="referral-banner-icon" style={{ color: '#fff', display: 'flex' }}><Icon name="link" size={26} /></span>
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
              Copy Link
            </button>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => router.push('/premium')}>
            <span className="quick-action-icon"><Icon name="star" size={26} /></span>
            <span className="quick-action-label">{user?.premium ? 'Renew Premium' : 'Upgrade Premium'}</span>
          </button>
          <button className="quick-action-card" onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="quick-action-icon"><Icon name="check" size={26} /></span>
            <span className="quick-action-label">Awarded Tasks</span>
          </button>
          <button className="quick-action-card quick-action-mpesa" onClick={() => router.push('/withdraw?method=mpesa')}>
            <span className="quick-action-icon"><Icon name="smartphone" size={26} /></span>
            <span className="quick-action-label">Withdraw with M-Pesa</span>
          </button>
          <button className="quick-action-card" onClick={() => setShowTraining(true)}>
            <span className="quick-action-icon"><Icon name="graduation" size={26} /></span>
            <span className="quick-action-label">Apply for Training</span>
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            { icon: 'clipboard', num: (TASKS || []).length,                    label: 'Available Tasks' },
            { icon: 'briefcase', num: user.activeBids || 0,                     label: 'Active Bids' },
            { icon: 'check',     num: user.completedTasks || 0,                 label: 'Completed Tasks' },
            { icon: 'cash',      num: `KES ${(user.balance || 0).toLocaleString()}`, label: 'Total Earned' },
          ].map(({ icon, num, label }) => (
            <div key={label} className="dash-stat-card">
              <div className="dash-stat-icon"><Icon name={icon} size={26} /></div>
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
              placeholder="Search tasks..."
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

          <ApplicationNotices apps={userApps} subs={userSubs} onStart={openTaskById} />

          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--gray)' }}>
            Showing <strong>{filteredTasks.length}</strong> tasks
            {user.activated && (
              <span style={{ marginLeft: 10, color: '#111827', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="edit" size={14} /> Apply with a proposal to unlock a task
              </span>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon="search"
              title="No tasks found"
              message={(search || filter !== 'All')
                ? 'No tasks match your search or filter. Try clearing them to see everything.'
                : 'There are no tasks to show right now. Please check back soon.'}
            />
          ) : (
          <div className="tasks-grid">
            {filteredTasks.map(task => {
              const sub   = userSubs[String(task.id)];
              const offer = isOffer(task);
              const app   = offer ? null : userApps[String(task.id)];
              const appStatus = app?.status || null;
              return (
                <div key={task.id} className="task-card" style={offer ? { border: '1.5px solid #9ca3af' } : undefined}>
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f3f4f6', color: '#111827', fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 999, marginBottom: 6 }}>
                      <Icon name="star" size={12} /> OFFER · No premium needed
                    </div>
                  )}
                  <div className="task-category">{task.category}</div>
                  <div className="task-title">{task.title}</div>
                  {task.dueDate && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', margin: '2px 0 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="clock" size={13} /> Due {task.dueDate}
                    </div>
                  )}
                  {appStatus && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, marginBottom: 6,
                      background: appStatus === 'approved' ? '#e5e7eb' : appStatus === 'pending' ? '#f3f4f6' : '#e5e7eb',
                      color:      appStatus === 'approved' ? '#1f2937' : appStatus === 'pending' ? '#374151' : '#1f2937' }}>
                      <Icon name={appStatus === 'approved' ? 'check' : appStatus === 'pending' ? 'clock' : appStatus === 'correction' ? 'edit' : 'x'} size={12} />
                      {appStatus === 'approved' ? 'Proposal approved' : appStatus === 'pending' ? 'Proposal under review' : appStatus === 'correction' ? 'Corrections requested' : 'Proposal rejected'}
                    </div>
                  )}
                  <div className="task-desc">{task.description}</div>
                  <div className="task-actions">
                    {sub ? (
                      <div style={{ flex: 1, textAlign: 'center', padding: '10px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#e5e7eb',
                        color:      sub.status === 'approved' ? '#1f2937' : '#111827' }}>
                        <Icon name="check" size={15} /> {sub.status === 'approved' ? 'Already done' : 'Already submitted'}
                      </div>
                    ) : (
                      <>
                        <button className="task-view-btn" onClick={() => handleViewTask(task)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="eye" size={15} /> View / Bid</button>
                        {offer || appStatus === 'approved' ? (
                          <button className="task-submit-btn" onClick={() => handleSubmitTask(task)} title="Attach your work & submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="upload" size={15} /> Submit</button>
                        ) : appStatus === 'pending' ? (
                          <button className="task-submit-btn" onClick={() => handleViewTask(task)} style={{ opacity: 0.7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} title="Awaiting review"><Icon name="clock" size={15} /> Pending</button>
                        ) : (
                          <button className="task-submit-btn" onClick={() => handleApplyClick(task)} title="Submit a proposal to unlock" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="edit" size={15} /> Apply</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
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
        <TaskModal task={selectedTask} user={user} application={userApps[String(selectedTask.id)]} onClose={() => setSelectedTask(null)} onBidClick={handleBidClick} onApply={handleApplyClick} onUpgradeClick={() => router.push('/premium')} onSubmit={handleSubmitTask} />
      )}
      {applyTask && (
        <ProposalModal task={applyTask} existing={userApps[String(applyTask.id)]} onClose={() => setApplyTask(null)} onSubmit={submitProposal} />
      )}
      {showReferral && <ReferralModal user={user} onClose={() => setShowReferral(false)} />}
      {showTraining && <TrainingModal user={user} onClose={() => setShowTraining(false)} />}
      <RewardToast toast={rewardToast} onClose={() => setRewardToast(null)} />

      {showMenu && (
        <HamburgerMenu
          user={user}
          onClose={() => setShowMenu(false)}
          onProfile={() => router.push('/profile')}
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
