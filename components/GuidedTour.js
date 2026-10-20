import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../lib/auth';

const STEPS = [
  { id: 'dashboard', title: 'Your dashboard', text: 'This is your main account area. You can review your balance, account status, and important activities here.', target: '[data-tour="dashboard"]', route: '/dashboard' },
  { id: 'tasks', title: 'Find available tasks', text: 'Browse the available tasks and open a task to read its requirements before applying. The page will scroll to the task list for you.', target: '[data-tour="tasks"]', route: '/dashboard' },
  { id: 'training', title: 'Training is optional', text: 'You may apply for training if you need it. If you already have the skills required for a task, you can skip training and continue directly to available tasks.', target: '[data-tour="training"]', route: '/dashboard' },
  { id: 'profile', title: 'Update your profile', text: 'Open your profile to review your information, update the fields available to you, and save your changes. Some protected details may have additional requirements.', target: '[data-tour="profile"]', route: '/profile' },
  { id: 'balance', title: 'Understand your balance', text: 'Your dashboard balance shows the funds recorded in your account. Review the balance and applicable account rules before making financial decisions.', target: '[data-tour="balance"]', route: '/dashboard' },
  { id: 'activation', title: 'Account activation', text: 'Activation costs KES 50. If your balance is KES 50 or more, the fee is deducted from that balance. If it is below KES 50, you can top up the difference using the available payment option.', target: '[data-tour="activation"]', route: '/dashboard' },
  { id: 'withdrawal', title: 'Withdrawals', text: 'Withdrawal access requires at least one task submission approved and credited to your account. If you have not earned from an approved task, start by applying for an available task.', target: '[data-tour="withdrawal"]', route: '/dashboard' },
  { id: 'support', title: 'Contact support', text: 'Use the WhatsApp support button or the support options to contact the team. The Help menu also lets you jump directly to instructions for individual features.', target: '[data-tour="support"]', route: '/dashboard' },
];

export default function GuidedTour() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  useEffect(() => { let alive = true; getCurrentUser().then(u => { if (alive) setUser(u); }).catch(() => {}); return () => { alive = false; }; }, [router.pathname]);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMode, setHelpMode] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [helpButtonVisible, setHelpButtonVisible] = useState(true);
  const autoStarted = useRef(false);
  const key = useMemo(() => `gweno_tour_completed_${user?.id || 'guest'}`, [user?.id]);

  const locate = useCallback((stepIndex) => {
    const step = STEPS[stepIndex];
    if (!step) return;
    const element = document.querySelector(step.target);
    if (!element) { setTargetRect(null); return; }
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }, 350);
  }, []);

  const goTo = useCallback(async (nextIndex) => {
    const bounded = Math.max(0, Math.min(STEPS.length - 1, nextIndex));
    setIndex(bounded);
    const step = STEPS[bounded];
    if (router.pathname !== step.route) {
      await router.push(step.route);
      window.setTimeout(() => locate(bounded), 450);
    } else {
      window.setTimeout(() => locate(bounded), 60);
    }
  }, [router, locate]);

  const start = useCallback((fromHelp = false, startIndex = 0) => {
    autoStarted.current = true;
    setHelpOpen(false); setHelpMode(fromHelp); setActive(true); setIndex(startIndex);
    window.setTimeout(() => goTo(startIndex), 80);
  }, [goTo]);

  useEffect(() => {
    if (!user?.id || router.pathname !== '/dashboard' || autoStarted.current) return;
    let timer;
    try {
      if (!localStorage.getItem(key)) {
        const retryAt = Number(localStorage.getItem(`gweno_tour_retry_${user.id}`) || 0);
        const delay = retryAt > Date.now() ? retryAt - Date.now() : 700;
        timer = window.setTimeout(() => { autoStarted.current = true; start(false, 0); }, delay);
      }
    } catch (_) { timer = window.setTimeout(() => { autoStarted.current = true; start(false, 0); }, 700); }
    return () => window.clearTimeout(timer);
  }, [user?.id, router.pathname, key, start]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const element = document.querySelector(STEPS[index]?.target);
      if (element) { const r = element.getBoundingClientRect(); setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height }); }
    };
    const timer = window.setTimeout(update, 450);
    window.addEventListener('resize', update); window.addEventListener('scroll', update, true);
    return () => { clearTimeout(timer); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [active, index, router.pathname]);

  useEffect(() => {
    if (active || helpOpen) { setHelpButtonVisible(false); return; }
    let timer;
    const showAndSchedule = () => {
      setHelpButtonVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHelpButtonVisible(false), 2000);
    };
    const show = () => { setHelpButtonVisible(true); window.clearTimeout(timer); timer = window.setTimeout(() => setHelpButtonVisible(false), 2000); };
    const hide = () => { window.clearTimeout(timer); setHelpButtonVisible(false); };
    showAndSchedule();
    window.addEventListener('scroll', show, { passive: true });
    window.addEventListener('touchstart', show, { passive: true });
    window.addEventListener('pointerdown', show, { passive: true });
    window.addEventListener('mousemove', show, { passive: true });
    return () => { window.clearTimeout(timer); window.removeEventListener('scroll', show); window.removeEventListener('touchstart', show); window.removeEventListener('pointerdown', show); window.removeEventListener('mousemove', show); };
  }, [active, helpOpen]);

  function skip() {
    setActive(false); setTargetRect(null);
    if (helpMode) return;
    window.alert('You skipped the guided tour. It will appear again in 3 minutes while you remain on your dashboard.');
    const timerKey = `gweno_tour_retry_${user?.id}`;
    try { localStorage.setItem(timerKey, String(Date.now() + 3 * 60 * 1000)); } catch (_) {}
    window.setTimeout(() => {
      if (window.location.pathname === '/dashboard') start(false, 0);
    }, 3 * 60 * 1000);
  }

  function finish() {
    setActive(false); setTargetRect(null);
    if (!helpMode) { try { localStorage.setItem(key, '1'); localStorage.removeItem(`gweno_tour_retry_${user?.id}`); } catch (_) {} }
    setHelpMode(false);
  }

  // Contextual Help remains available on the dashboard and profile page.
  if (!active) return (
    <>
      {helpButtonVisible && <button type="button" onClick={() => setHelpOpen(v => !v)} aria-label="Help me navigate GWENO" style={{ position: 'fixed', right: 20, bottom: 90, zIndex: 1000, border: 0, borderRadius: 999, padding: '12px 16px', background: '#111827', color: '#fff', boxShadow: '0 8px 24px #0002', fontWeight: 700, cursor: 'pointer' }}>Help / Guided Tour</button>}
      {helpOpen && <div role="dialog" aria-label="GWENO help menu" style={{ position: 'fixed', right: 18, bottom: 145, zIndex: 1001, width: 'min(330px, calc(100vw - 36px))', maxHeight: '65vh', overflowY: 'auto', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 12px 36px #0003' }}>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>What would you like help with?</div>
        <button onClick={() => start(false, 0)} style={helpBtn}>Show me the full guided tour</button>
        {STEPS.slice(1).map((s, i) => <button key={s.id} onClick={() => start(true, i + 1)} style={helpBtn}>Show me {s.id === 'tasks' ? 'how to apply for tasks' : s.id === 'training' ? 'training options' : s.id === 'profile' ? 'how to update my profile' : s.id === 'balance' ? 'how to understand my balance' : s.id === 'activation' ? 'how account activation works' : s.id === 'withdrawal' ? 'how withdrawals work' : 'how to contact support'}</button>)}
        <button onClick={() => setHelpOpen(false)} style={{ ...helpBtn, background: '#f3f4f6' }}>Close</button>
      </div>}
    </>
  );

  const step = STEPS[index];
  const estimatedCardHeight = helpMode ? 230 : 260;
  const top = Math.max(12, Math.min(window.innerHeight - estimatedCardHeight - 12, targetRect ? targetRect.top + targetRect.height + 12 : (window.innerHeight - estimatedCardHeight) / 2));
  return <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
    <div style={{ position: 'absolute', inset: 0, background: '#11182799' }} />
    {targetRect && <div aria-hidden="true" style={{ position: 'absolute', top: targetRect.top - 5, left: targetRect.left - 5, width: targetRect.width + 10, height: targetRect.height + 10, border: '3px solid #fbbf24', borderRadius: 12, boxShadow: '0 0 0 9999px #11182788', pointerEvents: 'none' }} />}
    <section role="dialog" aria-modal="true" aria-label={step.title} style={{ position: 'absolute', top, left: '50%', transform: 'translateX(-50%)', width: 'min(420px, calc(100vw - 28px))', maxHeight: 'calc(100vh - 24px)', overflowY: 'auto', background: '#fff', color: '#111827', borderRadius: 16, padding: 20, boxShadow: '0 18px 50px #0005' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#6b7280', marginBottom: 8 }}>GWENO GUIDED TOUR · {index + 1} OF {STEPS.length}</div>
      <h2 style={{ fontSize: 21, margin: '0 0 9px' }}>{step.title}</h2><p style={{ lineHeight: 1.55, margin: '0 0 18px' }}>{step.text}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {helpMode ? <button onClick={finish} style={{ ...tourBtn, background: '#111827', color: '#fff' }}>Exit</button> : <>
          <button onClick={() => index === 0 ? finish() : goTo(index - 1)} style={tourBtn}>{index === 0 ? 'Close' : 'Back'}</button>
          <button onClick={() => index === STEPS.length - 1 ? finish() : goTo(index + 1)} style={{ ...tourBtn, background: '#111827', color: '#fff' }}>{index === STEPS.length - 1 ? 'Finish' : 'Next'}</button>
          <button onClick={skip} style={tourBtn}>Skip Tour</button>
        </>}
      </div>
    </section>
  </div>;
}

const tourBtn = { border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', background: '#fff', color: '#111827', fontWeight: 700, cursor: 'pointer' };
const helpBtn = { display: 'block', width: '100%', textAlign: 'left', marginTop: 7, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#111827', fontSize: 13, cursor: 'pointer' };
