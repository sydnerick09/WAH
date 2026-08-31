// lib/gamification.js
// Shared, framework-free gamification engine used by BOTH the client (dashboard
// card) and the server (leaderboard, validation). Everything is DERIVED from a
// user's already-recorded, server-owned stats (completed tasks, referrals,
// balance, premium, activation, quiz score, daily-login streak), so XP/levels/
// badges can't be forged on the client and there's no duplicate-reward vector.

export const LEVELS = [
  { name: 'Beginner',     min: 0 },
  { name: 'Explorer',     min: 500 },
  { name: 'Professional', min: 1500 },
  { name: 'Elite',        min: 4000 },
  { name: 'Legend',       min: 10000 },
];

// XP is a pure function of recorded stats. Weights are intentionally simple.
export function computeXp(u = {}) {
  const tasks  = Math.max(0, Number(u.completedTasks || 0));
  const refs   = Math.max(0, Number(u.referralCount  || 0));
  const streak = Math.max(0, Number(u.streak         || 0));
  const quiz   = Math.max(0, Number(u.quizScore      || 0));
  const bal    = Math.max(0, Number(u.balance        || 0));

  let xp = 0;
  xp += tasks * 50;                     // every completed task
  xp += refs * 100;                     // every activated referral
  xp += quiz * 10;                      // joining-quiz answers
  if (u.activated) xp += 200;
  if (u.premium)   xp += 300;
  xp += Math.min(streak, 60) * 20;      // login streak (capped)
  xp += Math.floor(bal / 1000) * 5;     // balance milestones
  return Math.max(0, Math.round(xp));
}

// Level + progress toward the next level for a given XP total.
export function levelInfo(xp = 0) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next    = LEVELS[idx + 1] || null;
  const floor   = current.min;
  const ceil    = next ? next.min : current.min;
  const into    = Math.max(0, xp - floor);
  const span    = next ? (ceil - floor) : 1;
  return {
    index: idx,
    name: current.name,
    nextName: next ? next.name : null,
    xpIntoLevel: into,
    xpForLevel: next ? span : 0,
    xpToNext: next ? Math.max(0, ceil - xp) : 0,
    progress: next ? Math.max(0, Math.min(1, into / span)) : 1,
    isMax: !next,
  };
}

// Redeemable reward points (phase-2 redemption). Derived so it can't be gamed.
export function coins(u = {}, xp) {
  const x = xp == null ? computeXp(u) : xp;
  return Math.floor(x / 10) + Math.max(0, Number(u.streak || 0)) * 5;
}

// Reputation score 0–100 from activity + consistency.
export function reputation(u = {}) {
  const tasks  = Math.max(0, Number(u.completedTasks || 0));
  const streak = Math.max(0, Number(u.streak || 0));
  let r = 40;
  r += Math.min(40, tasks * 2);
  r += Math.min(10, streak);
  if (u.premium)   r += 5;
  if (u.activated) r += 5;
  return Math.max(0, Math.min(100, Math.round(r)));
}

// Achievement badges. `icon` values map to <Icon name=…>. `earned` is derived.
export function badges(u = {}) {
  const tasks  = Math.max(0, Number(u.completedTasks || 0));
  const refs   = Math.max(0, Number(u.referralCount  || 0));
  const streak = Math.max(0, Number(u.streak || 0));
  const bal    = Math.max(0, Number(u.balance || 0));
  return [
    { id: 'first_task',      name: 'First Task',      icon: 'check',     earned: tasks >= 1,   hint: 'Complete your first task' },
    { id: 'ten_tasks',       name: '10 Tasks',        icon: 'briefcase', earned: tasks >= 10,  hint: 'Complete 10 tasks' },
    { id: 'hundred_tasks',   name: '100 Tasks',       icon: 'trophy',    earned: tasks >= 100, hint: 'Complete 100 tasks' },
    { id: 'top_earner',      name: 'Top Earner',      icon: 'cash',      earned: bal  >= 50000, hint: 'Reach a KES 50,000 balance' },
    { id: 'investor',        name: 'Investor',        icon: 'chart',     earned: !!u.premium,  hint: 'Upgrade to Premium' },
    { id: 'referral_master', name: 'Referral Master', icon: 'users',     earned: refs >= 10,   hint: 'Refer 10 members' },
    { id: 'streak_7',        name: '7-Day Streak',    icon: 'flame',     earned: streak >= 7,  hint: 'Log in 7 days in a row' },
    { id: 'streak_30',       name: '30-Day Streak',   icon: 'award',     earned: streak >= 30, hint: 'Log in 30 days in a row' },
  ];
}

// Verification tier (rendered monochrome to fit the B/W theme; the tier NAME is
// the distinguishing label). Blue → Gold → Diamond.
export function verification(u = {}, xp) {
  const x   = xp == null ? computeXp(u) : xp;
  const idx = levelInfo(x).index;
  const tasks = Math.max(0, Number(u.completedTasks || 0));
  if (idx >= 3 && u.premium)          return { tier: 'Diamond', rank: 3 };
  if (idx >= 2 || u.premium)          return { tier: 'Gold',    rank: 2 };
  if (u.activated && tasks >= 1)      return { tier: 'Blue',    rank: 1 };
  return { tier: null, rank: 0 };
}

// One call that assembles the full profile the UI needs.
export function gamify(u = {}) {
  const xp  = computeXp(u);
  const lvl = levelInfo(xp);
  const bs  = badges(u);
  return {
    xp,
    level: lvl,
    coins: coins(u, xp),
    reputation: reputation(u),
    badges: bs,
    badgesEarned: bs.filter(b => b.earned).length,
    verification: verification(u, xp),
    streak: Math.max(0, Number(u.streak || 0)),
  };
}


