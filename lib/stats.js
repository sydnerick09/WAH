// lib/stats.js, community statistics with 2% daily COMPOUND growth.
//
// The four metrics start from a fixed baseline on launch day (Day 1) and grow
// 2% every 24 hours, compounding on the launch-day value, rounded to whole
// numbers. Because the value is a pure function of the current date, the
// numbers update automatically each day with no server/cron, every visit
// recomputes today's figure.
import { useEffect, useState } from 'react';

// Day 1 (baseline shown). Uses UTC midnight so the daily tick is consistent
// for every visitor regardless of timezone.
const LAUNCH_MS = Date.UTC(2026, 6, 22);   // 2026-07-22
const DAY_MS    = 24 * 60 * 60 * 1000;
const RATE      = 1.02;                      // +2% per day

// Baseline (Day 1) values, the single source of truth.
const BASELINE = { peopleJoined: 100, earningMembers: 73, tasksAvailable: 100, tasksCompleted: 77 };

// The Day-1 snapshot, used as the deterministic first render (SSR + first paint)
// so there's never a hydration mismatch; the live value fills in on mount.
export const BASELINE_STATS = { ...BASELINE, day: 1 };

// Whole days elapsed since launch (0 on/ before launch day).
export function daysSinceLaunch(now = Date.now()) {
  return Math.max(0, Math.floor((now - LAUNCH_MS) / DAY_MS));
}

// Today's statistics. Relationships are preserved: earning members never exceed
// people joined, and tasks completed never exceed tasks available.
export function computeStats(now = Date.now()) {
  const day    = daysSinceLaunch(now);
  const factor = Math.pow(RATE, day);       // compounds on the launch-day value

  const peopleJoined   = Math.round(BASELINE.peopleJoined   * factor);
  const tasksAvailable = Math.round(BASELINE.tasksAvailable * factor);
  const earningMembers = Math.min(Math.round(BASELINE.earningMembers * factor), peopleJoined);
  const tasksCompleted = Math.min(Math.round(BASELINE.tasksCompleted * factor), tasksAvailable);

  return { peopleJoined, earningMembers, tasksAvailable, tasksCompleted, day: day + 1 };
}

// Milliseconds until the next 24-hour tick (to schedule a live refresh).
export function msUntilNextTick(now = Date.now()) {
  const nextTick = LAUNCH_MS + (daysSinceLaunch(now) + 1) * DAY_MS;
  return Math.max(1000, nextTick - now);
}

// React hook: renders the baseline first (deterministic), then the live value on
// mount, and re-computes automatically at each 24-hour boundary.
export function useCommunityStats() {
  const [stats, setStats] = useState(BASELINE_STATS);

  useEffect(() => {
    let timer;
    const tick = () => {
      setStats(computeStats());
      timer = setTimeout(tick, msUntilNextTick());
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return stats;
}


