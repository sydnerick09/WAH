import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Icon from '../components/Icon';

// These are fictional sample/template records. They are not real customer transactions.
const DEMO_REVIEW_PEOPLE = [
  { name: 'Brian Otieno', country: 'Kenya', prefix: '+25471' },
  { name: 'Mary Wanjiku', country: 'Kenya', prefix: '+25472' },
  { name: 'Kevin Mwangi', country: 'Kenya', prefix: '+25479' },
  { name: 'Grace Akinyi', country: 'Kenya', prefix: '+25470' },
  { name: 'Daniel Kiptoo', country: 'Kenya', prefix: '+25474' },
  { name: 'Faith Njeri', country: 'Kenya', prefix: '+25475' },
  { name: 'Peter Kamau', country: 'Kenya', prefix: '+25476' },
  { name: 'Mercy Wambui', country: 'Kenya', prefix: '+25477' },
  { name: 'Samuel Odhiambo', country: 'Kenya', prefix: '+25478' },
  { name: 'Joyce Atieno', country: 'Kenya', prefix: '+25471' },
  { name: 'David Kibet', country: 'Kenya', prefix: '+25472' },
  { name: 'Lucy Muthoni', country: 'Kenya', prefix: '+25479' },
  { name: 'Michael Ochieng', country: 'Kenya', prefix: '+25470' },
  { name: 'Sarah Wairimu', country: 'Kenya', prefix: '+25474' },
  { name: 'John Kamau', country: 'Kenya', prefix: '+25475' },
  { name: 'Esther Nyambura', country: 'Kenya', prefix: '+25476' },
  { name: 'James Kariuki', country: 'Kenya', prefix: '+25477' },
  { name: 'Diana Chebet', country: 'Kenya', prefix: '+25478' },
  { name: 'Paul Maina', country: 'Kenya', prefix: '+25471' },
  { name: 'Ann Wambui', country: 'Kenya', prefix: '+25472' },
  { name: 'Samuel Kipchoge', country: 'Kenya', prefix: '+25479' },
  { name: 'Mercy Auma', country: 'Kenya', prefix: '+25470' },
  { name: 'Brian Kamau', country: 'Kenya', prefix: '+25474' },
  { name: 'Faith Chepkirui', country: 'Kenya', prefix: '+25475' },
  { name: 'Kevin Ouma', country: 'Kenya', prefix: '+25476' },
  { name: 'Grace Wanjiru', country: 'Kenya', prefix: '+25477' },
  { name: 'Peter Njoroge', country: 'Kenya', prefix: '+25478' },
  { name: 'Mary Akinyi', country: 'Kenya', prefix: '+25471' },
  { name: 'Daniel Mutua', country: 'Kenya', prefix: '+25472' },
  { name: 'Lucy Nyokabi', country: 'Kenya', prefix: '+25479' },
  { name: 'David Onyango', country: 'Kenya', prefix: '+25470' },
  { name: 'Sarah Chebet', country: 'Kenya', prefix: '+25474' },
  { name: 'John Mwangi', country: 'Kenya', prefix: '+25475' },
  { name: 'Esther Achieng', country: 'Kenya', prefix: '+25476' },
  { name: 'James Kiplagat', country: 'Kenya', prefix: '+25477' },
  { name: 'Diana Wanjiku', country: 'Kenya', prefix: '+25478' },
  { name: 'Paul Otieno', country: 'Kenya', prefix: '+25471' },
  { name: 'Ann Njeri', country: 'Kenya', prefix: '+25472' },
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
  { name: 'Ahmed Hassan', country: 'Kenya', prefix: '+25473' },
]

const DEMO_REVIEW_TEXTS = [
  'I found Gweno Hub on TikTok and decided to give it a try. So far, my experience has been good.',
  'The platform is easy to understand once you get started. I have already completed some tasks and withdrawn.',
  'I was not sure about it at first, but I decided to try it and see how it works for myself.',
  'My first experience with Gweno Hub has been quite good. The process was straightforward.',
  'I came across Gweno Hub online and decided to give it a chance. I am happy that I tried it.',
  'The tasks are simple to understand, and I like being able to track my earnings.',
  'I have been using Gweno Hub for some time now and I like how the platform is organized.',
  'I honestly did not expect much when I first joined, but my experience has been better than I expected.',
  'I found this platform through TikTok and decided to test it. So far, so good.',
  'The withdrawal process was clear to me, and I received my money after completing the required process.',
  'I like the fact that I can work on tasks and see my balance building up.',
  'Gweno Hub has given me something productive to do in my free time.',
  'At first I was skeptical, but after trying the platform myself, I understood how everything works.',
  'The platform is fairly simple once you understand the different sections.',
  'I have enjoyed completing the tasks and seeing my earnings increase.',
  'I joined recently and I am still learning, but so far the experience has been positive.',
  'I discovered Gweno Hub on social media and decided to try it instead of just watching other people talk about it.',
  'I like that the platform gives me tasks to work on instead of just sitting idle.',
  'My experience has been good so far. I will continue using the platform and see how it goes.',
  'I gave Gweno Hub a try and I am glad I did. The experience has been interesting so far.',
  'Niliipata Gweno Hub kupitia TikTok, lakini sasa nimeanza kujaribu na experience yangu iko poa.',
  'Mwanzoni sikuamini sana, lakini nilisema ngoja nijaribu mwenyewe. Mpaka sasa mambo iko sawa.',
  'Nimeanza kufanya tasks na kuona earnings zangu zikiongezeka. So far so good.',
  'Asante Gweno Hub. Niliiona online na nikasema ngoja nijaribu, sasa nimeanza kuelewa vile platform inafanya kazi.',
  'Nilikuwa na doubts mwanzoni, lakini baada ya kujaribu mwenyewe nimeona si complicated kama nilivyofikiria.',
  'Tasks ni rahisi kuelewa ukishaelekezwa vizuri. Mimi nimeanza polepole na experience imekuwa poa.',
  'Nilipata Gweno Hub TikTok siku moja, nikasema wacha nijaribu. Sasa nimeanza ku-an na kuona results.',
  'Kwa sasa experience yangu na Gweno Hub iko vizuri. Nimekuwa nikifanya tasks wakati niko free.',
  'Nilikuwa naona watu wakisema kuhusu Gweno Hub, lakini sikujua kama ni yangu mpaka nilipojaribu mwenyewe.',
  'Nimefurahia kuona balance yangu ikiongezeka baada ya kufanya tasks. Inanipa motivation ya kuendelea.',
  'Gweno Hub imenisaidia kutumia free time yangu kufanya kitu productive. Mpaka sasa niko sawa nayo.',
  'Niliingia bila expectations mingi, lakini sasa nimeanza kuzoea platform na vile tasks zinafanywa.',
  'Niliona review fulani kuhusu Gweno Hub online, nikasema ngoja ni-test. So far nimeipenda.',
  'Mwanzoni nilichanganyikiwa kidogo, lakini baada ya kuelewa process everything became easier.',
  'Nimeanza na tasks chache, lakini nimefurahia experience yangu mpaka sasa.',
  'Nilidhani itakuwa complicated, kumbe ukifuata instructions ni rahisi kuelewa.',
  'Nimekuwa nikitumia platform wakati niko free na nimefurahia kuona earnings zikiendelea kuongezeka.',
  'Nilipata Gweno Hub kupitia social media, lakini sasa nimeanza kuendelea nayo mwenyewe.',
  'Experience yangu imekuwa poa mpaka sasa. Kuna vitu bado najifunza, lakini naendelea.',
  'Niliamua kuacha kuskia tu watu wakisema na nijaribu mwenyewe. Sasa naelewa vile Gweno Hub inafanya kazi.',
  'Niliiona Gweno Hub TikTok nikasema wacha ni-test. Sai nimeanza ku-an nayo na iko fiti.',
  'Nilikua na doubt mob, lakini nikasema wacha nijaribu mwenyewe. Sai niko sawa nayo.',
  'Hii platform nilipata online, nikasema wacha niingie nijionee. So far mambo iko fresh.',
  'Tasks ziko straight-forward ukishika vile inafanywa. Sai nimeanza kuzoea system.',
  'Niliingia nikidhani itakuwa complicated, kumbe ukipewa instructions una-catch haraka.',
  'My first withdrawal did not go through, so I was disappointed at first. I tried a second withdrawal later and that one went through successfully.',
  'The withdrawal fee feels quite expensive. I think it would be more convenient if the fee could be deducted directly from the money someone has earned.',
  'Why is there a withdrawal fee? I understand that there may be costs involved, but I would prefer a lower fee or a different way of handling it.',
  'Sometimes the tasks I complete take a while before the client reviews them. It can be frustrating when you are waiting for a task to be checked.',
  'Nilipata challenge kidogo na withdrawal yangu ya kwanza haikuenda through. Nilijaribu tena mara ya pili na ika-work, lakini ningependa process iwe smoother.',
]

const NEGATIVE_START = 45;

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
  const texts = shuffleWithRandom(
    DEMO_REVIEW_TEXTS.map((text, index) => ({ text, negative: index >= NEGATIVE_START })),
    random
  );

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
      status: review.negative ? 'failed' : 'successful',
      text: review.text,
      rating: review.negative ? 3 : index % 9 === 0 ? 4 : 5,
    };
  });
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
            <p style={{ margin: '3px 0 0', color: '#bdbdbd', fontSize: 12 }}>Daily sample withdrawal activity and review templates</p>
          </div>
        </div>
      </header>

      <main style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '22px 20px 50px' }}>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px',
          marginBottom: 18, color: '#475569', fontSize: 12, lineHeight: 1.55,
        }}>
          <strong>Demo data:</strong> the names, masked phone numbers, amounts and testimonies on this page are fictional sample/template records, not real customer transactions. The displayed set changes automatically each calendar day.
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

        {tab === 'reviews' ? (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>
            {records.map((record) => (
              <article key={record.id} style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16,
                boxShadow: '0 1px 2px rgba(0,0,0,.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <CountryBadge country={record.country} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{record.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{record.phone} · {record.country}</div>
                    </div>
                  </div>
                  <Stars n={record.rating} />
                </div>
                <p style={{ margin: '0 0 14px', color: '#374151', lineHeight: 1.6, fontSize: 13.5, fontStyle: 'italic' }}>“{record.text}”</p>
                <div style={{ borderTop: '1px solid #eef2f7', paddingTop: 11 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: '#374151' }}>
                    <Icon name={record.status === 'failed' ? 'x' : 'check'} size={13} />{' '}
                    {record.status === 'failed' ? 'Failed withdrawal' : `Withdrawn: ${formatKes(record.amount)}`}
                  </span>
                </div>
              </article>
            ))}
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
                    {record.status === 'failed' ? 'Failed withdrawal' : 'Successful withdrawal'}
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
