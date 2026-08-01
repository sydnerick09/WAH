// components/Gamification.js
// Dashboard gamification card (level, animated XP bar, streak, coins, reputation,
// badges, verification, leaderboard) + a lightweight reward toast. All figures
// come from lib/gamification (derived from server-owned stats), so nothing here
// can be gamed — this is presentation only.
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { gamify } from '../lib/gamification';
import { fetchLeaderboard } from '../lib/auth';

export function GamificationCard({ user, boardOpen = false }) {
  const g = gamify(user);
  const [board,     setBoard]     = useState([]);
  const [showBoard, setShowBoard] = useState(!!boardOpen);
  const [barW,      setBarW]      = useState(0);

  // Animate the XP bar fill after mount.
  useEffect(() => {
    const t = setTimeout(() => setBarW(Math.round(g.level.progress * 100)), 120);
    return () => clearTimeout(t);
  }, [g.level.progress]);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard(8).then(d => { if (alive) setBoard(d); });
    return () => { alive = false; };
  }, []);

  const meRank = board.findIndex(b => String(b.id) === String(user.id));

  return (
    <div className="gami-card">
      <div className="gami-head">
        <div className="gami-level">
          <span className="gami-level-badge"><Icon name="zap" size={20} /></span>
          <div>
            <div className="gami-level-name">{g.level.name}</div>
            <div className="gami-level-sub">{g.xp.toLocaleString()} XP{meRank >= 0 ? ` · Rank #${meRank + 1}` : ''}</div>
          </div>
        </div>
        {g.verification.tier && (
          <span className={`gami-verify tier-${g.verification.rank}`} title={`${g.verification.tier} verified`}>
            <Icon name="check" size={13} /> {g.verification.tier}
          </span>
        )}
      </div>

      <div className="gami-progress-wrap">
        <div className="gami-progress"><div className="gami-progress-fill" style={{ width: `${barW}%` }} /></div>
        <div className="gami-progress-label">
          {g.level.isMax ? 'Max level reached' : `${g.level.xpToNext.toLocaleString()} XP to ${g.level.nextName}`}
        </div>
      </div>

      <div className="gami-stats">
        {[
          ['flame',  g.streak,                          'Day streak'],
          ['cash',   g.coins.toLocaleString(),          'Coins'],
          ['award',  g.reputation,                      'Reputation'],
          ['trophy', `${g.badgesEarned}/${g.badges.length}`, 'Badges'],
        ].map(([ico, num, lbl]) => (
          <div key={lbl} className="gami-stat">
            <span className="gami-stat-ico"><Icon name={ico} size={16} /></span>
            <div><div className="gami-stat-num">{num}</div><div className="gami-stat-lbl">{lbl}</div></div>
          </div>
        ))}
      </div>

      <div className="gami-badges">
        {g.badges.map(b => (
          <div key={b.id} className={`gami-badge ${b.earned ? 'earned' : 'locked'}`}
            title={b.earned ? b.name : `${b.name} — ${b.hint}`}>
            <Icon name={b.earned ? b.icon : 'lock'} size={15} />
            <span>{b.name}</span>
          </div>
        ))}
      </div>

      {board.length > 0 && (
        <div className="gami-board">
          <button className="gami-board-toggle" onClick={() => setShowBoard(s => !s)}>
            <span><Icon name="trophy" size={14} /> Leaderboard</span>
            <Icon name={showBoard ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
          {showBoard && (
            <div className="gami-board-list">
              {board.map(e => (
                <div key={e.id} className={`gami-board-row ${String(e.id) === String(user.id) ? 'me' : ''}`}>
                  <span className="gami-board-rank">#{e.rank}</span>
                  <span className="gami-board-name">{String(e.id) === String(user.id) ? 'You' : e.name}</span>
                  <span className="gami-board-lvl">{e.level}</span>
                  <span className="gami-board-xp">{e.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// In-session reward notification (level-up, streak, badge). Auto-dismisses.
export function RewardToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className="gami-toast" role="status">
      <span className="gami-toast-ico"><Icon name={toast.icon || 'zap'} size={22} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="gami-toast-title">{toast.title}</div>
        {toast.sub && <div className="gami-toast-sub">{toast.sub}</div>}
      </div>
      <button className="gami-toast-x" onClick={onClose} aria-label="Dismiss"><Icon name="x" size={16} /></button>
    </div>
  );
}
