// components/StatsPanel.js — reusable community-statistics panel.
// Shows the four live metrics (People Joined, Earning Members, Tasks Available,
// Tasks Completed) that grow 20% every 24 hours. Part of the shared design
// system; safe to drop onto any page.
import { useCommunityStats } from '../lib/stats';
import Icon from './Icon';

const ITEMS = [
  { key: 'peopleJoined',   icon: 'users', label: 'People Joined' },
  { key: 'earningMembers', icon: 'cash',  label: 'Earning Members' },
  { key: 'tasksAvailable', icon: 'tasks', label: 'Tasks Available' },
  { key: 'tasksCompleted', icon: 'check', label: 'Tasks Completed' },
];

export default function StatsPanel({ heading = 'Our Growing Community', subtitle = 'Real momentum — updated every day.' }) {
  const stats = useCommunityStats();

  return (
    <section className="stats-band" aria-label="Community statistics">
      <div className="container">
        {heading && <h2 className="stats-band-title">{heading}</h2>}
        {subtitle && <p className="stats-band-sub">{subtitle}</p>}
        <div className="stats-grid">
          {ITEMS.map(it => (
            <div
              key={it.key}
              className="stat-card"
              role="group"
              aria-label={`${it.label}: ${stats[it.key].toLocaleString()}`}
            >
              <div className="stat-card-icon" aria-hidden="true"><Icon name={it.icon} size={30} /></div>
              <div className="stat-card-num">{stats[it.key].toLocaleString()}</div>
              <div className="stat-card-label">{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
