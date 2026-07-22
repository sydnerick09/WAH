// components/FlowShell.js
// Full-page wrapper used by the flow pages (activate, skills-test, premium,
// withdraw). Gives a consistent professional header with a Back button and a
// centered content column, replacing the old pop-up modals.
import { useRouter } from 'next/router';

export default function FlowShell({ title, subtitle, icon, accent = 'linear-gradient(135deg, #1f2937, #374151)', maxWidth = 560, children }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white-off)' }}>
      <header style={{ background: accent, color: '#fff', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
        <div style={{ maxWidth, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Back to dashboard"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Back
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
              {icon ? `${icon} ` : ''}{title}
            </div>
            {subtitle && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
      </header>

      <main style={{ maxWidth, margin: '0 auto', padding: '24px 20px 48px' }}>
        {children}
      </main>
    </div>
  );
}
