// Custom 404 page — friendly, on-brand, leaks no system details.
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={code}>404</div>
        <h1 style={title}>Page not found</h1>
        <p style={msg}>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" style={btn}>Back to Home</Link>
      </div>
    </div>
  );
}

const wrap  = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off, #F8FAFC)', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' };
const card  = { textAlign: 'center', maxWidth: 420 };
const code  = { fontFamily: 'Poppins, sans-serif', fontSize: 72, fontWeight: 800, color: '#111827', lineHeight: 1 };
const title = { fontSize: 22, fontWeight: 700, color: '#111827', margin: '8px 0 6px' };
const msg   = { fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 20 };
const btn   = { display: 'inline-block', background: '#111827', color: '#fff', padding: '11px 22px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' };


