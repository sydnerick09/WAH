// pages/cookie-policy.js — plain, readable cookie policy (B/W, responsive).
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from '../components/Icon';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--black)', margin: '0 0 8px' }}>{title}</h2>
      <div style={{ fontSize: 14.5, lineHeight: 1.75, color: '#374151' }}>{children}</div>
    </section>
  );
}

export default function CookiePolicy() {
  const router = useRouter();
  const openPrefs = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('gweno:open-cookies'));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      <header style={{ background: '#000', color: '#fff', padding: '16px 20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.back()} aria-label="Back"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="arrowLeft" size={16} /> Back
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="shield" size={18} /> Cookie Policy
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 64px' }}>
        <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 24 }}>Last updated: 2026</p>

        <Section title="What are cookies?">
          Cookies (and similar technologies such as your browser&apos;s local storage) are small pieces of data
          stored on your device when you use Gweno Hub. They let the app keep you signed in, remember your
          choices, and work reliably.
        </Section>

        <Section title="Why we use them">
          We use cookies to operate the platform securely, keep you logged in between visits, remember
          preferences (like your referral link and last screen), and — only with your consent — to understand
          how the app is used so we can improve it.
        </Section>

        <Section title="Essential vs optional cookies">
          <p style={{ margin: '0 0 10px' }}><strong>Essential cookies</strong> are required for the app to
          function — sign-in sessions, security, and saving your account state. These cannot be switched off.</p>
          <p style={{ margin: 0 }}><strong>Optional cookies</strong> are only set if you allow them:</p>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li><strong>Analytics</strong> — measure usage so we can improve the product.</li>
            <li><strong>Preferences</strong> — remember non-essential choices for convenience.</li>
          </ul>
        </Section>

        <Section title="How to change your preferences">
          You can change your choices at any time. Use the button below, or go to
          <strong> Profile → Privacy &amp; Cookies</strong>. You can also clear cookies in your browser settings,
          which will make the consent banner appear again on your next visit.
          <div style={{ marginTop: 16 }}>
            <button onClick={openPrefs}
              style={{ background: '#000', color: '#fff', border: '1.5px solid #000', borderRadius: 50, padding: '11px 22px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Icon name="settings" size={16} /> Manage cookie preferences
            </button>
          </div>
        </Section>

        <Section title="Contact">
          Questions about this policy? Email <a href="mailto:businesshub.comke@gmail.com" style={{ color: '#000', textDecoration: 'underline' }}>businesshub.comke@gmail.com</a>.
        </Section>

        <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: 20, marginTop: 8 }}>
          <Link href="/dashboard" style={{ color: 'var(--gray)', fontSize: 14, textDecoration: 'underline' }}>Return to dashboard</Link>
        </div>
      </main>
    </div>
  );
}
