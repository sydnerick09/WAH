// pages/skills-test.js — full-page Premium Skills Test (replaces the pop-up)
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { awardPremiumTest } from '../lib/auth';
import FlowShell from '../components/FlowShell';

const PREMIUM_FEE = 480;
const PREMIUM_QUESTIONS = [
  { q: 'A client asks for a product description of exactly 50 words. You have written 80. What is the professional thing to do?',
    options: ['Submit it anyway — longer is better', 'Trim it to 50 words as requested before submitting', 'Ask the client to accept 80 words', 'Split it into two submissions'],
    answer: 'Trim it to 50 words as requested before submitting' },
  { q: 'A client politely points out a mistake in your delivered work. The most professional reply is:',
    options: ['“That’s not my fault, your brief was unclear.”', '“Thank you for catching that — I’ll correct it right away.”', '“I don’t have time to redo it.”', '“It looks fine to me.”'],
    answer: '“Thank you for catching that — I’ll correct it right away.”' },
  { q: 'Which sentence is written correctly?',
    options: ['Their going to they’re office over there.', 'They’re going to their office over there.', 'There going to their office over they’re.', 'They’re going to there office over their.'],
    answer: 'They’re going to their office over there.' },
  { q: 'You charge $8 per hour and work 6.5 hours on a task. How much do you bill the client?',
    options: ['$48', '$52', '$54', '$56'],
    answer: '$52' },
  { q: 'A client wants the deadline written in DD/MM/YYYY format. The date is 7 March 2026. Which is correct?',
    options: ['03/07/2026', '07/03/2026', '2026/03/07', 'March 7, 2026'],
    answer: '07/03/2026' },
];

export default function SkillsTestPage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [answers, setAnswers] = useState(Array(PREMIUM_QUESTIONS.length).fill(null));
  const [saving,  setSaving]  = useState(false);
  const [result,  setResult]  = useState(null);

  function pick(i, opt) {
    setAnswers(prev => { const n = [...prev]; n[i] = opt; return n; });
  }

  async function handleSubmit() {
    let correct = 0;
    PREMIUM_QUESTIONS.forEach((qq, i) => { if (answers[i] === qq.answer) correct += 1; });
    const earned = correct * 42;
    setSaving(true);
    const updated = await awardPremiumTest(user.id, correct);
    setSaving(false);
    setResult({ correct, earned, updated: updated || user });
  }

  const allAnswered = answers.every(a => a != null);

  if (!ready || !user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
    </div>;
  }

  const already = user.premiumTestDone;

  return (
    <FlowShell title="Premium Skills Test" subtitle="KES 42 per correct answer → premium balance" icon="🧠" accent="linear-gradient(135deg, #4C1D95, #6D28D9)">
      {already && !result && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 6 }}>You’ve already taken this test</div>
          <div className="pay-amount" style={{ marginTop: 8 }}>
            <div className="pay-amount-label">Your Premium Balance</div>
            <div className="pay-amount-value" style={{ color: '#6D28D9' }}>KES {Number(user.premiumBalance || 0).toLocaleString()}</div>
            <div className="pay-amount-sub">Use it toward your KES 480 premium subscription</div>
          </div>
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #4C1D95, #6D28D9)', marginTop: 18 }} onClick={() => router.push('/premium')}>⭐ Go to Premium</button>
        </div>
      )}

      {!already && !result && (
        <>
          <div className="pay-message" style={{ borderColor: '#6D28D9', background: '#F5F3FF', marginBottom: 16 }}>
            Answer these <strong>5 skills questions</strong> — the practical abilities every strong freelancer needs. Each correct answer adds <strong style={{ color: '#6D28D9' }}>KES 42</strong> to your <strong>premium balance</strong>, which you can put toward the <strong>KES 480</strong> premium fee.
          </div>

          {PREMIUM_QUESTIONS.map((qq, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 8 }}>{i + 1}. {qq.q}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {qq.options.map(opt => {
                  const active = answers[i] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => pick(i, opt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        padding: '11px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
                        border: `2px solid ${active ? '#6D28D9' : '#E5E7EB'}`,
                        background: active ? '#F5F3FF' : '#fff',
                        color: '#111827', fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${active ? '#6D28D9' : '#CBD5E1'}`,
                        background: active ? '#6D28D9' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11,
                      }}>{active ? '✓' : ''}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            className="pay-btn"
            style={{ background: 'linear-gradient(135deg, #4C1D95, #6D28D9)', marginTop: 8, opacity: allAnswered ? 1 : 0.55 }}
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
          >
            {saving ? <><span className="spinner" /> Marking…</> : '📝 Submit Answers'}
          </button>
          <div className="pay-secure">🔐 Answered honestly? Your premium balance is credited instantly</div>
        </>
      )}

      {result && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>{result.earned >= PREMIUM_FEE ? '🏆' : result.earned > 0 ? '🎯' : '📚'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color: '#6D28D9', marginBottom: 4 }}>+KES {result.earned}</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6 }}>
            You answered <strong>{result.correct} of {PREMIUM_QUESTIONS.length}</strong> correctly.
          </div>
          <div className="pay-amount" style={{ marginTop: 8 }}>
            <div className="pay-amount-label">Premium Balance</div>
            <div className="pay-amount-value" style={{ color: '#6D28D9' }}>KES {Number(result.updated?.premiumBalance || 0).toLocaleString()}</div>
            <div className="pay-amount-sub">
              {Number(result.updated?.premiumBalance || 0) >= PREMIUM_FEE
                ? 'Enough to unlock premium!'
                : `Add KES ${(PREMIUM_FEE - Number(result.updated?.premiumBalance || 0)).toLocaleString()} more to reach the KES 480 premium fee.`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="pay-btn" style={{ flex: 1, background: '#E5E7EB', color: '#374151' }} onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="pay-btn" style={{ flex: 2, background: 'linear-gradient(135deg, #4C1D95, #6D28D9)' }} onClick={() => router.push('/premium')}>⭐ Go to Premium</button>
          </div>
        </div>
      )}
    </FlowShell>
  );
}
