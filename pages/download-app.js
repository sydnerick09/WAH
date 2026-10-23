import { useEffect, useState } from 'react';
import Link from 'next/link';
import InstallGwenoButton from '../components/InstallGwenoButton';

export default function DownloadAppPage() {
  const [apkReady, setApkReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/downloads/GWENO.apk', { method: 'HEAD', cache: 'no-store' })
      .then((response) => {
        if (active) setApkReady(response.ok);
      })
      .catch(() => {
        if (active) setApkReady(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, []);

  const card = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
    padding: 24, boxShadow: '0 8px 30px rgba(17,24,39,.06)', textAlign: 'left'
  };

  return (
    <main style={{ minHeight: '100vh', background: '#f3f4f6', color: '#111827', padding: '40px 18px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/" style={{ color: '#374151', textDecoration: 'none', fontWeight: 700 }}>← GWENO HUB</Link>
        <header style={{ textAlign: 'center', padding: '42px 0 32px' }}>
          <img src="/icons/gweno-192.png" alt="GWENO HUB app icon" width="88" height="88" style={{ borderRadius: 20 }} />
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', margin: '18px 0 10px' }}>Get the GWENO App</h1>
          <p style={{ maxWidth: 620, margin: '0 auto', color: '#4b5563', lineHeight: 1.7 }}>
            Choose the installation method that works best for your device. Use the same GWENO account you already have.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <section style={card}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4b5563', letterSpacing: 1 }}>OPTION 1</div>
            <h2 style={{ margin: '10px 0' }}>Install the web app</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
              Add GWENO to your phone’s home screen. This option uses the website and receives website updates when you are online.
            </p>
            <InstallGwenoButton
              className="btn-primary"
              style={{ width: '100%', border: 0, borderRadius: 8, padding: '14px 16px', fontWeight: 700, cursor: 'pointer' }}
            />
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 0 }}>
              If no install prompt appears, open this page in Chrome on Android or Safari on iPhone and use the browser’s “Add to Home Screen” option.
            </p>
          </section>

          <section style={card}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4b5563', letterSpacing: 1 }}>OPTION 2</div>
            <h2 style={{ margin: '10px 0' }}>Android APK</h2>
            {apkReady ? (
              <>
                <p style={{ color: '#4b5563', lineHeight: 1.7 }}>Download the Android installation file from the official GWENO website.</p>
                <a href="/downloads/GWENO.apk" download="GWENO.apk" style={{ display: 'block', textAlign: 'center', background: '#111827', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '14px 16px', fontWeight: 700 }}>
                  Download GWENO for Android
                </a>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Only install APK files downloaded from a source you trust. Android may ask you to confirm installation.</p>
              </>
            ) : (
              <>
                <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                  The Android app download will appear here once the APK has been built, signed, tested, and uploaded by the site owner.
                </p>
                <button type="button" disabled style={{ width: '100%', border: 0, borderRadius: 8, padding: '14px 16px', background: '#d1d5db', color: '#4b5563', fontWeight: 700, cursor: 'not-allowed' }}>
                  {checking ? 'Checking APK availability…' : 'Android APK not available yet'}
                </button>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Use “Install GWENO App” above in the meantime. This page will show the APK button automatically once <code>public/downloads/GWENO.apk</code> is deployed.</p>
              </>
            )}
          </section>
        </div>

        <div style={{ marginTop: 26, padding: 18, background: '#e5e7eb', borderRadius: 12, color: '#374151', lineHeight: 1.7, fontSize: 14 }}>
          Security note: GWENO never needs your password outside the official website. Keep your account details private and make sure the address bar shows gweno.business when signing in.
        </div>
      </div>
    </main>
  );
}
