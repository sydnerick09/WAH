import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Icon from '../components/Icon';
import { getCurrentUser, getToken } from '../lib/auth';

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
  { name: 'Mercy Auma', country: 'Kenya', prefix: '+25411' },
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
]

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
]

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
    const review = texts[index];
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

function Stars({ n }) {
  return (
    <span aria-label={`${n} out of 5 stars`} style={{ color: '#6b7280', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(n)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function CountryBadge({ country }) {
  const code = String(country || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'EA';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: '50%', background: '#111827',
      color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0,
    }}>{code}</span>
  );
}

export default function WithdrawalReviews() {
  const router = useRouter();
  const [tab, setTab] = useState('reviews');
  const records = useMemo(() => buildDailyRecords(), []);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const mixedRecords = useMemo(() => {
    const genuine = approvedReviews.map((review) => ({
      ...review,
      kind: 'real',
      status: 'approved',
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
    async function loadUser() {
      try {
        const user = await getCurrentUser();
        if (!cancelled) setCurrentUser(user || null);
      } catch (_) {
        if (!cancelled) setCurrentUser(null);
      }
    }
    loadReviews();
    loadUser();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mixedRecords.length) return undefined;
    const timer = window.setInterval(() => {
      setVisibleIndex((current) => (current + 1) % mixedRecords.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [mixedRecords.length]);

  const visibleRecord = mixedRecords[visibleIndex % Math.max(mixedRecords.length, 1)];

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
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'submitReview', authToken: getToken(), reviewText: text }),
      });
      const data = await response.json();
      if (data.success) {
        setReviewText('');
        setReviewMessage({ type: 'ok', text: 'Review sent. It is now pending admin approval.' });
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
            <p style={{ margin: '3px 0 0', color: '#bdbdbd', fontSize: 12 }}>Rotating withdrawal notifications and approved client reviews</p>
          </div>
        </div>
      </header>

      <main style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '22px 20px 50px' }}>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px',
          marginBottom: 18, color: '#475569', fontSize: 12, lineHeight: 1.55,
        }}>
          <strong>Sample data:</strong> the rotating withdrawal records are fictional sample/template records. Genuine client reviews appear only after the client submits them and an admin approves them.
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Reviews are published only after admin approval.</span>
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
              minHeight: 170,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {visibleRecord && (
              <article
                key={visibleRecord.id}
                style={{
                  position: 'relative',
                  width: 'min(440px, 92vw)',
                  background: '#111827',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '11px 15px 11px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 12px 32px rgba(0,0,0,.18)',
                  animation: 'reviewPop 3.6s cubic-bezier(.22,1,.36,1) both',
                  overflow: 'hidden',
                }}
              >
                <CountryBadge country={visibleRecord.country} />

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 11,
                    fontWeight: 800,
                    marginBottom: 2,
                  }}>
                    <span>{visibleRecord.name}</span>
                    <span style={{ opacity: .55 }}>•</span>
                    <span style={{ opacity: .65 }}>{visibleRecord.country}</span>
                  </div>

                  <div style={{
                    fontSize: 11.5,
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    opacity: .88,
                  }}>
                    {visibleRecord.text}
                  </div>
                </div>

                <div style={{
                  flexShrink: 0,
                  fontSize: 9,
                  fontWeight: 800,
                  opacity: .55,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}>
                  {visibleRecord.status === 'failed'
                    ? 'Failed'
                    : visibleRecord.status === 'pending'
                      ? 'Pending'
                      : 'New'}
                </div>
              </article>
            )}

            <style jsx>{`
              @keyframes reviewPop {
                0% {
                  opacity: 0;
                  transform: translateY(28px) scale(.82);
                  filter: blur(5px);
                }
                8% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                  filter: blur(0);
                }
                68% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                  filter: blur(0);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-28px) scale(.88);
                  filter: blur(4px);
                }
              }

              @media (prefers-reduced-motion: reduce) {
                article {
                  animation: none !important;
                }
              }
            `}</style>
          </section>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 9 }}>
            {records.map((record) => (
              <div key={record.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 11, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <CountryBadge country={record.country} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 750, fontSize: 13 }}>{record.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{record.phone} · {record.country}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{formatKes(record.amount)}</div>
                  <div style={{ color: '#6b7280', fontWeight: 700, fontSize: 10.5, marginTop: 2 }}>
                    {record.status === 'failed'
                      ? 'Failed withdrawal'
                      : record.status === 'pending'
                        ? 'Pending withdrawal'
                        : 'Successful withdrawal'}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

