import Link from 'next/link';

export default function DownloadAppPage() {
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f3f4f6', padding: 20, fontFamily: 'Arial,sans-serif', color: '#111827' }}>
    <section style={{ width: '100%', maxWidth: 420, textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, boxShadow: '0 8px 30px rgba(17,24,39,.06)' }}>
      <img src="/icons/gweno-192.png" alt="GWENO Hub" width="76" height="76" style={{ borderRadius: 18 }} />
      <h1 style={{ margin: '16px 0 22px', fontSize: 28 }}>GWENO App</h1>
      <a href="/downloads/GWENO.apk" download="GWENO.apk" style={{ display: 'block', padding: '15px 18px', background: '#111827', color: '#fff', textDecoration: 'none', borderRadius: 9, fontWeight: 700 }}>Download App</a>
      <p style={{ fontSize: 13, color: '#64748b', marginTop: 14 }}>Android installation file</p>
      <Link href="/" style={{ display: 'inline-block', marginTop: 10, color: '#374151', textDecoration: 'none', fontSize: 13 }}>Back to GWENO Hub</Link>
    </section>
  </main>;
}
