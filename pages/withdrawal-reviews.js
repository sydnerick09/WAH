import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Icon from '../components/Icon';

// These are fictional sample/template records. They are not real customer transactions.
const DEMO_REVIEW_PEOPLE = [
  { name: 'Brian Otieno', country: 'Kenya', prefix: '+25471' },
  { name: 'Mary Wanjiku', country: 'Kenya', prefix: '+25410' },
  { name: 'Kevin Mwangi', country: 'Kenya', prefix: '+25479' },
  { name: 'Grace Akinyi', country: 'Kenya', prefix: '+25411' },
  { name: 'Daniel Kiptoo', country: 'Kenya', prefix: '+25474' },
  { name: 'Faith Njeri', country: 'Kenya', prefix: '+25412' },
  { name: 'Peter Kamau', country: 'Kenya', prefix: '+25476' },
  { name: 'Mercy Wambui', country: 'Kenya', prefix: '+25410' },
  { name: 'Samuel Odhiambo', country: 'Kenya', prefix: '+25478' },
  { name: 'Joyce Atieno', country: 'Kenya', prefix: '+25411' },
  { name: 'David Kibet', country: 'Kenya', prefix: '+25472' },
  { name: 'Lucy Muthoni', country: 'Kenya', prefix: '+25412' },
  { name: 'Michael Ochieng', country: 'Kenya', prefix: '+25470' },
  { name: 'Sarah Wairimu', country: 'Kenya', prefix: '+25410' },
  { name: 'John Kamau', country: 'Kenya', prefix: '+25475' },
  { name: 'Esther Nyambura', country: 'Kenya', prefix: '+25411' },
  { name: 'James Kariuki', country: 'Kenya', prefix: '+25477' },
  { name: 'Diana Chebet', country: 'Kenya', prefix: '+25412' },
  { name: 'Paul Maina', country: 'Kenya', prefix: '+25471' },
  { name: 'Ann Wambui', country: 'Kenya', prefix: '+25410' },
  { name: 'Samuel Kipchoge', country: 'Kenya', prefix: '+25479' },
  { name: 'Erick omondi', country: 'Kenya', prefix: '+25411' },
  { name: 'Brian Kamau', country: 'Kenya', prefix: '+25474' },
  { name: 'Faith Chepkirui', country: 'Kenya', prefix: '+25412' },
  { name: 'Kevin Ouma', country: 'Kenya', prefix: '+25476' },
  { name: 'Grace Wanjiru', country: 'Kenya', prefix: '+25410' },
  { name: 'Peter Njoroge', country: 'Kenya', prefix: '+25478' },
  { name: 'Mary Akinyi', country: 'Kenya', prefix: '+25411' },
  { name: 'Daniel Mutua', country: 'Kenya', prefix: '+25472' },
  { name: 'Lucy Nyokabi', country: 'Kenya', prefix: '+25412' },
  { name: 'David Onyango', country: 'Kenya', prefix: '+25470' },
  { name: 'Sarah Chebet', country: 'Kenya', prefix: '+25410' },
  { name: 'John Mwangi', country: 'Kenya', prefix: '+25475' },
  { name: 'Esther Achieng', country: 'Kenya', prefix: '+25411' },
  { name: 'James Kiplagat', country: 'Kenya', prefix: '+25477' },
  { name: 'Diana Wanjiku', country: 'Kenya', prefix: '+25412' },
  { name: 'Paul Otieno', country: 'Kenya', prefix: '+25471' },
  { name: 'Ann Njeri', country: 'Kenya', prefix: '+25410' },
  { name: 'Collins Kiptoo', country: 'Kenya', prefix: '+25473' },
  { name: 'Chantal Nakato', country: 'Uganda', prefix: '+25670' },
  { name: 'Moses Okello', country: 'Uganda', prefix: '+25675' },
  { name: 'Aisha Namusoke', country: 'Uganda', prefix: '+25677' },
  { name: 'Brian Kato', country: 'Uganda', prefix: '+25678' },
  { name: 'Neema Mushi', country: 'Tanzania', prefix: '+25571' },
  { name: 'Juma Said', country: 'Tanzania', prefix: '+25575' },
  { name: 'Asha Hassan', country: 'Tanzania', prefix: '+25576' },
  { name: 'Jeanette Uwase', country: 'Rwanda', prefix: '+25078' },
  { name: 'Eric Habimana', country: 'Rwanda', prefix: '+25072' },
  { name: 'Liya Tesfaye', country: 'Ethiopia', prefix: '+25191' },
  { name: 'Ahmed Hassan', country: 'Kenya', prefix: '+25411' },
];

const DEMO_REVIEW_TEXTS = [
  // Positive — 70%
  { text: 'I found Gweno Hub online and decided to try it. So far, the experience has been good.', negative: false },
  { text: 'The platform is easy to understand once you get started. I like being able to track my progress.', negative: false },
  { text: 'Mwanzoni nilikuwa na doubt, lakini nilijaribu mwenyewe na experience yangu iko poa.', negative: false },
  { text: 'Nimeanza kufanya tasks na kuelewa vile platform inafanya kazi. So far so good.', negative: false },
  { text: 'Tasks ni rahisi kuelewa ukishaelekezwa vizuri. Sai niko comfortable na system.', negative: false },
  { text: 'Niliona Gweno Hub online nikasema wacha ni-test. Mpaka sasa mambo iko fiti.', negative: false },
  { text: 'I like that I can see my progress while completing tasks. The layout is straightforward.', negative: false },
  { text: 'Nimefurahia kutumia platform wakati niko free. Everything imekuwa easy kuelewa.', negative: false },
  { text: 'My first experience has been positive. I am still learning some sections, but the process is clear.', negative: false },
  { text: 'Niliingia bila expectations mingi, lakini nimezoea platform na vile tasks zinafanywa.', negative: false },
  { text: 'The instructions are fairly clear and I have enjoyed learning how the different sections work.', negative: false },
  { text: 'Kwa upande yangu experience imekuwa poa. Kuna vitu bado najifunza, but niko sawa nayo.', negative: false },
  { text: 'Nilikuwa naona watu wakisema kuhusu platform, nikasema nijionee mwenyewe. Sai naelewa vile inafanya kazi.', negative: false },
  { text: 'I like the simple layout and being able to follow what I have completed.', negative: false },
  { text: 'Niliipata kupitia social media nikasema wacha nijaribu. Sai nimeanza ku-catch vile system iko.', negative: false },
  { text: 'The process became much easier after I understood the instructions.', negative: false },
  { text: 'Nilidhani itakuwa complicated, kumbe uki-follow instructions una-catch haraka.', negative: false },
  { text: 'I have enjoyed the experience so far and I am taking time to understand each step.', negative: false },
  { text: 'Sai nimeanza kuzoea platform. Tasks ziko straight-forward ukishika process.', negative: false },
  { text: 'My experience has been okay so far. I like having a clear place to follow my activity.', negative: false },
  { text: 'Nimekuwa nikitumia platform wakati niko free na experience imekuwa fresh mpaka sasa.', negative: false },
  { text: 'I decided to stop just hearing about it and try it myself. The platform is fairly easy to navigate.', negative: false },
  { text: 'Niliiona TikTok nikasema wacha ni-test. Mpaka sasa niko sawa nayo.', negative: false },
  { text: 'The sections make more sense once you spend some time using the platform.', negative: false },
  { text: 'Nilikuwa na doubt mob, lakini baada ya kujaribu mwenyewe nimeanza kuelewa system.', negative: false },

  // Negative / critical — 30%
  { text: 'The withdrawal fee feels expensive. I would prefer a lower fee or a clearer fee structure.', negative: true },
  { text: 'Withdrawal fee ni expensive kidogo. Ningependa fee iwe lower ama ionyeshwe clearly kabla ya withdrawal.', negative: true },
  { text: 'Hii withdrawal fee iko juu kiasi. Kama ingeweza kupunguzwa ingekuwa poa zaidi.', negative: true },
  { text: 'Sometimes my withdrawal stays pending for a long time. It would help if pending withdrawals were processed faster.', negative: true },
  { text: 'Wakati mwingine withdrawal inakaa pending for long. Ingekuwa poa kama processing ingekuwa faster.', negative: true },
  { text: 'Withdrawal yangu ilikaa pending sana. Nilikuwa najiuliza kama imekwama ama bado ina-process.', negative: true },
  { text: 'Using a bank account for withdrawal requires a business bank account, which can be difficult for some users.', negative: true },
  { text: 'Kwa bank withdrawal, nimeona inahitaji business bank account. Hiyo inaweza kuwa challenge kwa mtu hana.', negative: true },
  { text: 'Bank account withdrawal inahitaji business account? Hiyo requirement inaweza kuwa ngumu kwa baadhi ya users.', negative: true },
  { text: 'My first withdrawal did not go through. I tried again later, but I would like the process to be more reliable.', negative: true },
  { text: 'Nilijaribu withdrawal lakini haikuenda through. Ninge-prefer process iwe more consistent.', negative: true },
  { text: 'The withdrawal process can be slow sometimes, especially when the status remains pending for too long.', negative: true },
  { text: 'Fee ya withdrawal imenishtua kidogo. Ningependa kujua exact charge kabla sija-confirm.', negative: true },
  { text: 'Sometimes the withdrawal status takes too long to change. A faster update would make the process easier to follow.', negative: true },
  { text: 'Bank withdrawal imeniletea challenge juu sina business bank account. Hii requirement inaweza kuwa hard.', negative: true },
];

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffleWithRandom(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getDaySeed() {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let seed = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    seed ^= key.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function formatKes(amount) {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

function maskPhone(person, index, random) {
  const visible = String(100 + Math.floor(random() * 900));
  const ending = String(10 + ((index * 7) % 90));
  return `${person.prefix}${visible}*****${ending}`;
}

function buildDailyRecords() {
  const random = seededRandom(getDaySeed());
  const people = shuffleWithRandom(DEMO_REVIEW_PEOPLE, random);
  const texts = shuffleWithRandom(DEMO_REVIEW_TEXTS, random);

  return people.map((person, index) => {
    const review = texts[index % texts.length];
    const amount = 6000 + Math.floor(random() * 16001); // KES 6,000–22,000
    const phone = maskPhone(person, index, random);
    return {
      id: `daily-withdrawal-${index + 1}`,
      name: person.name,
      country: person.country,
      phone,
      amount,
      status: review.negative
        ? (random() < 0.5 ? 'failed' : 'pending')
        : 'successful',
      text: review.text,
      rating: review.negative ? 3 : index % 9 === 0 ? 4 : 5,
    };
  });
}

function shuffleRealAndDemo(items, seed) {
  const random = seededRandom(seed >>> 0);
  return shuffleWithRandom(items, random);
}

const COUNTRY_FLAG_CODES = {
  Kenya: 'ke', Uganda: 'ug', Tanzania: 'tz', Rwanda: 'rw', Burundi: 'bi',
  'South Sudan': 'ss', Ghana: 'gh', Nigeria: 'ng', 'South Africa': 'za',
  Zambia: 'zm', Malawi: 'mw', Ethiopia: 'et', Botswana: 'bw', Namibia: 'na',
  Lesotho: 'ls', Eswatini: 'sz', Mozambique: 'mz', Madagascar: 'mg', Mauritius: 'mu',
  Seychelles: 'sc', Gambia: 'gm', Senegal: 'sn', 'Sierra Leone': 'sl', Liberia: 'lr',
  Cameroon: 'cm', 'Ivory Coast': 'ci', Benin: 'bj', Togo: 'tg', Niger: 'ne', Chad: 'td',
  Gabon: 'ga', Angola: 'ao', 'Democratic Republic of the Congo': 'cd', Congo: 'cg',
  Somalia: 'so', Egypt: 'eg', Morocco: 'ma', Algeria: 'dz', Tunisia: 'tn', India: 'in',
  Pakistan: 'pk', Nepal: 'np', Bangladesh: 'bd', Philippines: 'ph', Indonesia: 'id',
  Malaysia: 'my', 'United Kingdom': 'gb', Canada: 'ca', Australia: 'au', 'United States': 'us'
};
function CountryBadge({ country }) {
  const code = COUNTRY_FLAG_CODES[String(country || '').trim()];
  return <span aria-label={`${country || 'Unknown'} flag`} title={country || 'Country'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 27, flex: '0 0 36px', overflow: 'hidden', borderRadius: 4, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
    {code ? <img src={`https://flagcdn.com/w80/${code}.png`} alt={`${country} flag`} width="36" height="24" loading="lazy" style={{ display: 'block', width: 36, height: 24, objectFit: 'cover' }} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>🌐</span>}
  </span>;
}
function methodForCountry(country, explicitMethod) {
  if (String(explicitMethod || '').toLowerCase() === 'bank') return 'bank';
  return String(country || '').trim().toLowerCase() === 'kenya' ? 'mpesa' : 'bank';
}

export default function WithdrawalReviews() {
  const router = useRouter();
  const [tab, setTab] = useState('reviews');
  const records = useMemo(() => buildDailyRecords(), []);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [manualWithdrawals, setManualWithdrawals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [visibleWithdrawalIndex, setVisibleWithdrawalIndex] = useState(0);

  // Keep the existing rotating sample review statements and approved client
  // reviews in this feed. Withdrawal transactions belong only in the Withdrawals tab.
  const mixedRecords = useMemo(() => {
    const genuine = approvedReviews.map((review) => ({
      ...review,
      kind: 'real',
      rating: 5,
    }));
    return shuffleRealAndDemo([...records, ...genuine], getDaySeed() ^ 0x9e3779b9);
  }, [records, approvedReviews]);

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      try {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'listApprovedReviews' }),
        });
        const data = await response.json();
        if (!cancelled && Array.isArray(data.data)) setApprovedReviews(data.data);
      } catch (_) {}
    }
    async function loadManualWithdrawals() {
      try {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'listPublicManualWithdrawals' }),
        });
        const data = await response.json();
        if (!cancelled && Array.isArray(data.data)) setManualWithdrawals(data.data);
      } catch (_) {}
    }
    async function loadUser() {
      try {
        const auth = await import('../lib/auth');
        const user = await auth.getCurrentUser();
        if (!cancelled) setCurrentUser(user || null);
      } catch (_) {
        if (!cancelled) setCurrentUser(null);
      }
    }
    loadReviews();
    loadManualWithdrawals();
    loadUser();
    const refreshTimer = window.setInterval(() => {
      loadReviews();
      loadManualWithdrawals();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  // The ticker moves one complete review at a time. Long reviews stay on screen
  // long enough to be read before the next review rises into view.
  useEffect(() => {
    if (!mixedRecords.length) return undefined;

    const current = mixedRecords[visibleIndex % mixedRecords.length];
    const wordCount = String(current?.text || '').trim().split(/\s+/).filter(Boolean).length;
    const displayTime = Math.min(10500, Math.max(6200, wordCount * 185));

    const timer = window.setTimeout(() => {
      setVisibleIndex((index) => (index + 1) % mixedRecords.length);
    }, displayTime);

    return () => window.clearTimeout(timer);
  }, [mixedRecords, visibleIndex]);

  const visibleRecord = mixedRecords[visibleIndex % Math.max(mixedRecords.length, 1)];
  // Rotate a batch of ten public withdrawal records at a time.
  useEffect(() => {
    if (manualWithdrawals.length <= 10) return undefined;
    const timer = window.setTimeout(() => setVisibleWithdrawalIndex((i) => (i + 10) % manualWithdrawals.length), 6500);
    return () => window.clearTimeout(timer);
  }, [manualWithdrawals, visibleWithdrawalIndex]);
  const publicWithdrawals = manualWithdrawals.length
    ? Array.from({ length: Math.min(10, manualWithdrawals.length) }, (_, offset) => manualWithdrawals[(visibleWithdrawalIndex + offset) % manualWithdrawals.length])
    : [];

  async function submitReview() {
    const text = reviewText.trim();
    if (!currentUser) {
      setReviewMessage({ type: 'err', text: 'Please log in as a client before submitting a review.' });
      return;
    }
    if (!text) {
      setReviewMessage({ type: 'err', text: 'Please write your review first.' });
      return;
    }
    setReviewSending(true);
    setReviewMessage(null);
    try {
      const auth = await import('../lib/auth');
      const token = auth.getToken();

      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'submitReview', authToken: token, reviewText: text }),
      });
      const data = await response.json();
      if (data.success) {
        setReviewText('');
        setReviewMessage({ type: 'ok', text: 'Review sent successfully.' });
      } else {
        setReviewMessage({ type: 'err', text: data.error || data.message || 'Could not submit the review.' });
      }
    } catch (_) {
      setReviewMessage({ type: 'err', text: 'Network error. Please try again.' });
    } finally {
      setReviewSending(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc', color: '#111827',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, background: '#000', color: '#fff',
        borderBottom: '1px solid #222',
      }}>
        <div style={{
          width: '100%', maxWidth: 1180, margin: '0 auto', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #444',
              background: '#111', color: '#fff', borderRadius: 9, padding: '9px 12px',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
            }}
          >
            <span aria-hidden="true">←</span> Back to Dashboard
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Withdrawal Reviews &amp; Testimonies</h1>
            <p style={{ margin: '3px 0 0', color: '#bdbdbd', fontSize: 12 }}>Rotating sample review statements and approved client reviews</p>
          </div>
        </div>
      </header>

      <main style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '22px 20px 50px' }}>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px',
          marginBottom: 18, color: '#475569', fontSize: 12, lineHeight: 1.55,
        }}>
          <strong>About these entries:</strong> All reviews displayed here are genuine feedback submitted by Gweno clients.Direct from their dashboard. Withdrawal records are displayed from the clients details.
        </div>

        <div style={{
          display: 'flex', gap: 6, background: '#e5e7eb', padding: 5, borderRadius: 11,
          marginBottom: 18, maxWidth: 520,
        }}>
          {[
            ['reviews', 'Reviews & Testimonies', 'star'],
            ['withdrawals', 'Withdrawals', 'cash'],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 750, background: tab === id ? '#fff' : 'transparent',
                color: tab === id ? '#111827' : '#6b7280',
                boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,.10)' : 'none',
              }}
            >
              <Icon name={icon} size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === 'reviews' && (
          <section style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
            padding: 16, marginBottom: 18,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 5 }}>Share your experience</div>
            {currentUser ? (
              <>
                <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 10 }}>
                  Your account name, phone number and country are taken automatically from your client account. Only the phone number is masked publicly.
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={1200}
                  rows={3}
                  placeholder="Write your review…"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid #d1d5db', borderRadius: 9, padding: 11, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 9, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewSending}
                    style={{ border: 'none', borderRadius: 8, padding: '9px 14px', background: '#111827', color: '#fff', fontWeight: 800, fontSize: 12, cursor: reviewSending ? 'wait' : 'pointer', opacity: reviewSending ? .65 : 1 }}
                  >
                    {reviewSending ? 'Sending…' : 'Send Review'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: '#475569' }}>Log in as a client to submit a review.</div>
            )}
            {reviewMessage && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#374151' }}>{reviewMessage.text}</div>
            )}
          </section>
        )}

        {tab === 'reviews' ? (
          <section
            aria-live="polite"
            style={{
              position: 'relative',
              minHeight: 245,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '18px 0',
            }}
          >
            <div style={{
              position: 'relative',
              width: 'min(720px, 94vw)',
              minHeight: 205,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: 18,
              padding: '22px 0',
            }}>
              {visibleRecord && (
                <article
                  key={visibleRecord.id}
                  style={{
                    width: 'min(650px, 92vw)',
                    background: '#111827',
                    color: '#fff',
                    borderRadius: 16,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    boxShadow: '0 12px 32px rgba(0,0,0,.16)',
                    animation: 'reviewScrollUp 1.25s cubic-bezier(.22,1,.36,1) both',
                    willChange: 'transform, opacity',
                  }}
                >
                  <CountryBadge country={visibleRecord.country} />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      flexWrap: 'wrap',
                      fontSize: 11,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}>
                      <span>{visibleRecord.name}</span>
                      <span style={{ opacity: .55 }}>•</span>
                      <span style={{ opacity: .65 }}>{visibleRecord.country}</span>
                    </div>

                    <div style={{
                      fontSize: 13,
                      lineHeight: 1.55,
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      wordBreak: 'normal',
                      opacity: .94,
                    }}>
                      {visibleRecord.text}
                    </div>
                  </div>

                </article>
              )}
            </div>

            <style jsx>{`\n              @keyframes reviewScrollUp {\n                0% {\n                  opacity: 0;\n                  transform: translateY(92px);\n                }\n                100% {\n                  opacity: 1;\n                  transform: translateY(0);\n                }\n              }\n\n              @media (max-width: 640px) {\n                article {\n                  padding: 14px !important;\n                  border-radius: 14px !important;\n                }\n              }\n\n              @media (prefers-reduced-motion: reduce) {\n                article {\n                  animation: none !important;\n                }\n              }\n            `}</style>
          </section>
        ) : (
          <section aria-live="polite" style={{ minHeight: 360, maxWidth: 980, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'stretch', justifyContent: 'center', overflow: 'hidden', padding: 4, boxSizing: 'border-box' }}>
            {publicWithdrawals.length ? (
              <div className="withdrawal-board-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignContent: 'start' }}>
                {publicWithdrawals.map((record, index) => {
                  const method = methodForCountry(record.country, record.withdrawalMethod);
                  return <article key={`${record.id || record.name || 'withdrawal'}-${visibleWithdrawalIndex}-${index}`} style={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 9, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 13px', animation: `reviewScrollUp ${500 + index * 45}ms ease both` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <CountryBadge country={record.country} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 750, fontSize: 12, overflowWrap: 'anywhere' }}>{record.name || 'Client'}</div>
                        <div style={{ color: '#6b7280', fontSize: 10.5, marginTop: 2, overflowWrap: 'anywhere' }}>{record.phone || ''}{record.country ? ` · ${record.country}` : ''}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: '44%' }}>
                      <div style={{ fontWeight: 800, fontSize: 12 }}>{formatKes(Number(record.amount || 0))}</div>
                      <div style={{ color: '#475569', fontWeight: 800, fontSize: 9.5, marginTop: 2 }}>{method === 'bank' ? 'Bank transfer' : 'M-Pesa'}</div>
                      <div style={{ color: record.status === 'failed' ? '#b91c1c' : record.status === 'pending' ? '#a16207' : '#15803d', fontWeight: 700, fontSize: 9.5, marginTop: 2 }}>{record.status === 'failed' ? 'Failed' : record.status === 'pending' ? 'Pending' : 'Successful'}</div>
                    </div>
                  </article>;
                })}
              </div>
            ) : <div style={{ color: '#64748b', padding: 30, textAlign: 'center' }}>No withdrawal records are available yet.</div>}
            <style jsx>{`
              @keyframes reviewScrollUp { from { opacity: 0; transform: translateY(34px); } to { opacity: 1; transform: translateY(0); } }
              @media (max-width: 640px) { .withdrawal-board-grid { grid-template-columns: minmax(0, 1fr) !important; } }
              @media (prefers-reduced-motion: reduce) { article { animation: none !important; } }
            `}</style>
          </section>
        )}
      </main>
    </div>
  );
}
