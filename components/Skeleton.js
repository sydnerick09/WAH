// components/Skeleton.js
// YouTube-style skeleton placeholders: neutral gray blocks with a monochrome
// shimmer sweep, shown while a page's real content loads. Kept grayscale so it
// fits the black & white theme (the sweep is a neutral highlight, not an accent).

// Primitive shimmer block. w/h accept numbers (px) or strings (%, etc.).
export function Skeleton({ w = '100%', h = 16, r = 8, style, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

// A two-line label/value block used inside list rows.
function LabelValue() {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Skeleton w="34%" h={10} style={{ marginBottom: 8 }} />
      <Skeleton w="62%" h={15} />
    </div>
  );
}

// Mirrors .task-card so the grid keeps its shape while tasks load.
export function TaskCardSkeleton() {
  return (
    <div className="task-card skeleton-card">
      <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton-row">
          <Skeleton w={36} h={36} r="50%" />
          <div>
            <Skeleton w={96} h={11} style={{ marginBottom: 6 }} />
            <Skeleton w={64} h={9} />
          </div>
        </div>
        <Skeleton w={56} h={18} r={6} />
      </div>
      <Skeleton w={74} h={16} r={100} style={{ marginBottom: 10 }} />
      <Skeleton w="85%" h={15} style={{ marginBottom: 12 }} />
      <Skeleton w="100%" h={11} style={{ marginBottom: 6 }} />
      <Skeleton w="100%" h={11} style={{ marginBottom: 6 }} />
      <Skeleton w="55%" h={11} style={{ marginBottom: 18 }} />
      <div className="skeleton-row" style={{ gap: 8, marginTop: 'auto' }}>
        <Skeleton w="100%" h={38} r={100} />
        <Skeleton w={92} h={38} r={100} />
      </div>
    </div>
  );
}

// Full dashboard skeleton (navbar + banner + tiles + stats + task grid).
export function DashboardSkeleton() {
  return (
    <div className="dashboard">
      <nav className="dash-navbar">
        <div className="dash-navbar-inner">
          <div className="dash-logo">GWENO</div>
          <div className="dash-user">
            <Skeleton w={40} h={40} r="50%" />
            <Skeleton w={32} h={26} r={8} />
          </div>
        </div>
      </nav>

      <main className="dash-main">
        <Skeleton w="100%" h={132} r={20} style={{ marginBottom: 24 }} />
        <Skeleton w="100%" h={68}  r={16} style={{ marginBottom: 24 }} />

        <div className="quick-actions">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="quick-action-card">
              <Skeleton w={34} h={34} r={9} />
              <Skeleton w="72%" h={12} />
            </div>
          ))}
        </div>

        <div className="dash-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dash-stat-card">
              <Skeleton w={34} h={34} r={9} />
              <LabelValue />
            </div>
          ))}
        </div>

        <Skeleton w={210} h={24} style={{ margin: '8px 0 8px' }} />
        <Skeleton w={290} h={13} style={{ marginBottom: 24 }} />

        <div className="tasks-grid">
          {Array.from({ length: 6 }).map((_, i) => <TaskCardSkeleton key={i} />)}
        </div>
      </main>
    </div>
  );
}

// Flow-page skeleton (mirrors FlowShell: dark header bar + a form column).
// `rows` = number of input-field placeholders. Used by premium/activate/submit/withdraw.
export function FlowSkeleton({ rows = 3, maxWidth = 560 }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--white-off)' }}>
      <header style={{ background: '#000', padding: '16px 20px' }}>
        <div style={{ maxWidth, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Skeleton className="on-dark" w={62} h={34} r={10} />
          <div style={{ flex: 1 }}>
            <Skeleton className="on-dark" w={150} h={16} r={6} style={{ marginBottom: 6 }} />
            <Skeleton className="on-dark" w={210} h={11} r={5} />
          </div>
        </div>
      </header>
      <main style={{ maxWidth, margin: '0 auto', padding: '24px 20px 48px' }}>
        <Skeleton w="100%" h={90} r={12} style={{ marginBottom: 22 }} />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <Skeleton w={120} h={11} r={4} style={{ marginBottom: 8 }} />
            <Skeleton w="100%" h={46} r={10} />
          </div>
        ))}
        <Skeleton w="100%" h={50} r={50} style={{ marginTop: 8 }} />
      </main>
    </div>
  );
}

// Profile page skeleton (header + centered avatar + info cards).
export function ProfileSkeleton() {
  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-left"><Skeleton w={40} h={40} r={10} /></div>
        <Skeleton w={80} h={18} r={6} />
        <div className="profile-header-right">
          <Skeleton w={40} h={40} r={10} />
          <Skeleton w={40} h={40} r={10} />
          <Skeleton w={40} h={40} r={10} />
        </div>
      </header>

      <div className="profile-body">
        <div className="profile-avatar-wrap">
          <Skeleton w={148} h={148} r="50%" />
          <Skeleton w={170} h={22} r={8} style={{ marginTop: 18 }} />
          <Skeleton w={210} h={14} r={6} style={{ marginTop: 10 }} />
        </div>

        {[4, 4].map((rows, s) => (
          <div key={s}>
            <Skeleton w={150} h={12} r={4} style={{ margin: '30px 4px 12px', display: 'block' }} />
            <div className="profile-card">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="profile-row">
                  <Skeleton w={20} h={20} r={5} />
                  <LabelValue />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
