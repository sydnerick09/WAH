// pages/leaderboard.js — dedicated Leaderboard + your progress (moved off the
// dashboard to reduce clutter; reachable from the hamburger menu).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../lib/auth';
import { GamificationCard } from '../components/Gamification';
import { FlowSkeleton } from '../components/Skeleton';
import Icon from '../components/Icon';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      if (!u) { router.replace('/login'); return; }
      setUser(u); setReady(true);
    })();
  }, [router]);

  if (!ready || !user) return <FlowSkeleton rows={2} />;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F5' }}>
      <header style={{ background: '#000', color: '#fff', padding: '16px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="arrowLeft" size={16} /> Back
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="trophy" size={18} /> Leaderboard
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 56px' }}>
        <p style={{ fontSize: 14, color: 'var(--gray)', margin: '0 0 18px' }}>
          Your level, XP and rank, plus the top players across Gweno Hub. Complete tasks, keep your daily
          streak and refer members to climb the ranks.
        </p>
        <GamificationCard user={user} boardOpen />
      </main>
    </div>
  );
}
