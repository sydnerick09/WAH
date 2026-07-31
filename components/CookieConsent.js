// components/CookieConsent.js
// GDPR-style cookie consent banner, mounted globally in _app.js. Shows once on
// first visit; the choice is stored in localStorage so it won't reappear unless
// the user clears their data or reopens it from Settings (Profile → Privacy &
// Cookies dispatches the `gweno:open-cookies` event, which reopens this).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

const KEY = 'gweno_cookie_consent_v1';

// Read the saved consent (or null if the user hasn't chosen yet).
export function getConsent() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export default function CookieConsent() {
  const [open, setOpen]         = useState(false);
  const [custom, setCustom]     = useState(false);
  const [analytics, setAnalytics]     = useState(true);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) setOpen(true);
    else { setAnalytics(!!existing.analytics); setPreferences(!!existing.preferences); }

    // Settings → "Manage cookie preferences" reopens the banner in customize mode.
    const reopen = () => {
      const cur = getConsent();
      if (cur) { setAnalytics(!!cur.analytics); setPreferences(!!cur.preferences); }
      setCustom(true); setOpen(true);
    };
    window.addEventListener('gweno:open-cookies', reopen);
    return () => window.removeEventListener('gweno:open-cookies', reopen);
  }, []);

  function save(pref) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...pref, essential: true, ts: Date.now() })); } catch (_) {}
    setOpen(false); setCustom(false);
  }
  const acceptAll = () => save({ analytics: true,  preferences: true });
  const rejectAll = () => save({ analytics: false, preferences: false });
  const saveCustom = () => save({ analytics, preferences });

  if (!open) return null;

  return (
    <div className="cookie-wrap" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-card">
        <div className="cookie-head">
          <span className="cookie-ico"><Icon name="shield" size={20} /></span>
          <div>
            <div className="cookie-title">We value your privacy</div>
            <p className="cookie-text">
              We use essential cookies to make Gweno Hub work, and optional cookies to remember your
              preferences and understand usage. You can accept all, reject non-essential, or choose which
              to allow. Read our <Link href="/cookie-policy" className="cookie-link">Cookie Policy</Link>.
            </p>
          </div>
        </div>

        {custom && (
          <div className="cookie-options">
            <label className="cookie-opt cookie-opt--locked">
              <span><strong>Essential</strong><span className="cookie-opt-sub">Required for sign-in, security and core features. Always on.</span></span>
              <input type="checkbox" checked readOnly disabled />
            </label>
            <label className="cookie-opt">
              <span><strong>Analytics</strong><span className="cookie-opt-sub">Helps us understand how the app is used so we can improve it.</span></span>
              <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} />
            </label>
            <label className="cookie-opt">
              <span><strong>Preferences</strong><span className="cookie-opt-sub">Remembers choices like your last screen and referral link.</span></span>
              <input type="checkbox" checked={preferences} onChange={e => setPreferences(e.target.checked)} />
            </label>
          </div>
        )}

        <div className="cookie-actions">
          {custom ? (
            <>
              <button className="cookie-btn cookie-btn--solid" onClick={saveCustom}>Save Preferences</button>
              <button className="cookie-btn" onClick={acceptAll}>Accept All</button>
            </>
          ) : (
            <>
              <button className="cookie-btn cookie-btn--solid" onClick={acceptAll}>Accept All Cookies</button>
              <button className="cookie-btn" onClick={rejectAll}>Reject Non-Essential</button>
              <button className="cookie-btn cookie-btn--ghost" onClick={() => setCustom(true)}>Customize</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
