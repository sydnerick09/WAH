// pages/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '../lib/auth';
import StatsPanel from '../components/StatsPanel';

const HOW_ITEMS = [
  {
    num: '01',
    title: 'Complete Tasks & Get Paid',
    desc: 'Access hundreds of daily digital tasks. Click, apply, submit, earn.',
  },
  {
    num: '02',
    title: 'Post Tasks for Other Users',
    desc: 'Need something done? Upload your assignment and choose a worker who matches your budget.',
  },
  {
    num: '03',
    title: 'Bid on Tasks',
    desc: 'Workers can propose their own price, and task owners pick the best offer.',
  },
  {
    num: '04',
    title: 'Track Everything from Your Dashboard',
    desc: 'View your bids, completed tasks, payments, and notifications all in one place.',
  },
  {
    num: '05',
    title: 'Get Fast Payments',
    desc: 'Once your task is approved, funds reflect instantly in your account.',
  },
];

const WHY_ITEMS = [
  {
    icon: '🌍',
    title: 'Work From Anywhere',
    desc: 'On your phone, laptop, or tablet — earn from wherever you are.',
  },
  {
    icon: '🔒',
    title: 'Secure & Transparent',
    desc: 'No scams, no hidden fees, and your payments are protected.',
  },
  {
    icon: '👥',
    title: 'A Community of Earners',
    desc: 'Thousands of real users working daily and making money.',
  },
  {
    icon: '✅',
    title: 'Perfect for Everyone',
    desc: 'Students, freelancers, job seekers, stay-at-home parents, or professionals.',
  },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav
        className="navbar"
        style={{
          boxShadow: scrolled
            ? '0 4px 20px rgba(0,0,0,0.08)'
            : 'none',
        }}
      >
        <div className="navbar-inner">
          <div className="navbar-logo">
            BUSINESS<span>HUB</span>
          </div>

          <div className="navbar-actions">
            {user ? (
              <Link
                href="/dashboard"
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: 14 }}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-outline"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        {/* ── Gold ribbon SVG background ── */}
        <svg
          className="hero-ribbon-svg"
          viewBox="0 0 1440 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Fine gold mesh fill for the ribbon body */}
            <pattern
              id="goldMesh"
              x="0" y="0"
              width="13" height="13"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(33 720 400)"
            >
              <line x1="0" y1="0" x2="0" y2="13" stroke="#C9933A" strokeWidth="0.5" strokeOpacity="0.38"/>
              <line x1="0" y1="0" x2="13" y2="0" stroke="#C9933A" strokeWidth="0.5" strokeOpacity="0.38"/>
            </pattern>
            {/* Soft glow filter for main edge lines */}
            <filter id="lineGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ── Dark diagonal depth bands (like the image) ── */}
          <polygon points="0,0 370,0 0,800"          fill="rgba(0,0,0,0.45)"/>
          <polygon points="1085,0 1440,0 1440,800 1395,800" fill="rgba(0,0,0,0.38)"/>
          <polygon points="110,0 500,0 310,800 -70,800"   fill="rgba(0,0,0,0.18)"/>
          <polygon points="875,0 1265,0 1440,660 1440,800 1200,800" fill="rgba(0,0,0,0.15)"/>

          {/* ── Ribbon mesh body ── */}
          <path
            d="M-80,692 L418,82 L648,382 L970,77 L1540,447
               L1540,500 L970,130 L648,435 L418,135 L-80,745 Z"
            fill="url(#goldMesh)"
            opacity="0.55"
          />

          {/* ── Top edge — main glowing gold line (animates in) ── */}
          <path
            className="ribbon-draw"
            d="M-80,692 L418,82 L648,382 L970,77 L1540,447"
            fill="none"
            stroke="#C9933A"
            strokeWidth="2.2"
            style={{ filter: 'url(#lineGlow)' }}
            opacity="0.95"
          />
          {/* Bright highlight stripe on top edge */}
          <path
            d="M-80,690 L418,80 L648,380 L970,75 L1540,445"
            fill="none"
            stroke="#FFE09A"
            strokeWidth="0.75"
            opacity="0.72"
          />
          {/* Bottom edge */}
          <path
            d="M-80,745 L418,135 L648,435 L970,130 L1540,500"
            fill="none"
            stroke="#C9933A"
            strokeWidth="1.2"
            opacity="0.40"
          />

          {/* ── Sparkle 1 — first peak ── */}
          <g className="sp-a" transform="translate(418,80)">
            <line className="sp-v" x1="0" y1="-22" x2="0" y2="22" stroke="#FFE09A" strokeWidth="1.1"/>
            <line className="sp-h" x1="-22" y1="0" x2="22" y2="0" stroke="#FFE09A" strokeWidth="1.1"/>
            <circle className="sp-dot" cx="0" cy="0" r="2.6" fill="#FFFFFF"/>
          </g>

          {/* ── Sparkle 2 — descending slope after peak 1 ── */}
          <g className="sp-b" transform="translate(510,218)">
            <line className="sp-v" x1="0" y1="-17" x2="0" y2="17" stroke="#E8C46A" strokeWidth="0.9"/>
            <line className="sp-h" x1="-17" y1="0" x2="17" y2="0" stroke="#E8C46A" strokeWidth="0.9"/>
            <circle className="sp-dot" cx="0" cy="0" r="1.9" fill="#FFFFFF"/>
          </g>

          {/* ── Sparkle 3 — second peak ── */}
          <g className="sp-c" transform="translate(970,77)">
            <line className="sp-v" x1="0" y1="-22" x2="0" y2="22" stroke="#FFE09A" strokeWidth="1.1"/>
            <line className="sp-h" x1="-22" y1="0" x2="22" y2="0" stroke="#FFE09A" strokeWidth="1.1"/>
            <circle className="sp-dot" cx="0" cy="0" r="2.6" fill="#FFFFFF"/>
          </g>

          {/* ── Sparkle 4 — ascending slope between peaks ── */}
          <g className="sp-d" transform="translate(812,230)">
            <line className="sp-v" x1="0" y1="-15" x2="0" y2="15" stroke="#E8C46A" strokeWidth="0.85"/>
            <line className="sp-h" x1="-15" y1="0" x2="15" y2="0" stroke="#E8C46A" strokeWidth="0.85"/>
            <circle className="sp-dot" cx="0" cy="0" r="1.6" fill="#FFFFFF"/>
          </g>

          {/* ── Sparkle 5 — right exit area ── */}
          <g className="sp-e" transform="translate(1185,395)">
            <line className="sp-v" x1="0" y1="-18" x2="0" y2="18" stroke="#E8C46A" strokeWidth="0.9"/>
            <line className="sp-h" x1="-18" y1="0" x2="18" y2="0" stroke="#E8C46A" strokeWidth="0.9"/>
            <circle className="sp-dot" cx="0" cy="0" r="1.9" fill="#FFFFFF"/>
          </g>
        </svg>

        <div className="hero-content">
          <div className="hero-tag">
            All-in-one Digital Platform for Tasks &amp; Assignments
          </div>

          <h1 className="hero-title">
            BUSINESS
            <br />
            <span className="blue">HUB</span>
          </h1>

          <p className="hero-subtitle">
            Empowers everyone to work and earn.
            <br />
            Work using a laptop or a smartphone.
          </p>

          <p className="hero-desc">
            Turn your skills and free time into earnings. Whether you want
            to complete tasks for money or post tasks for others,
            BUSINESS HUB makes work easy, fast, and secure.
          </p>

          <div className="hero-actions">
            <Link
              href="/register"
              className="btn-primary"
              style={{ fontSize: 16, padding: '16px 40px' }}
            >
              Join Now — It&apos;s Free
            </Link>

            <Link
              href="/login"
              className="btn-outline"
              style={{
                fontSize: 16,
                padding: '16px 40px',
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
              }}
            >
              Login
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">80+</div>
              <div className="hero-stat-label">Daily Tasks</div>
            </div>

            <div className="hero-stat">
              <div className="hero-stat-num">KES</div>
              <div className="hero-stat-label">Fast Payouts</div>
            </div>

            <div className="hero-stat">
              <div className="hero-stat-num">24/7</div>
              <div className="hero-stat-label">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Community statistics — auto-growing 2% every 24h */}
      <StatsPanel />

      {/* Quick Nav Buttons */}
      <section style={{ background: 'var(--blue)', padding: '0' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {[
            'Available Tasks',
            'Post Tasks',
            'How it Works',
            'Why Choose Us',
          ].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                flex: 1,
                minWidth: 150,
                padding: '18px 24px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
                fontSize: 14,
                borderRight: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
                textDecoration: 'none',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255,255,255,0.8)';
              }}
            >
              {item}
            </a>
          ))}
        </div>
      </section>

      {/* What You Can Do */}
      <section id="how-it-works" className="how-section">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-header">
            <div
              className="section-tag"
              style={{
                background: 'rgba(0,71,255,0.15)',
                color: '#7FA8FF',
              }}
            >
              Platform Features
            </div>

            <h2
              className="section-title"
              style={{ color: 'var(--white)' }}
            >
              What You Can Do on
              <br />
              <span className="blue">BUSINESS HUB</span>
            </h2>
          </div>

          <div className="how-grid">
            {HOW_ITEMS.map((item) => (
              <div key={item.num} className="how-card">
                <div className="how-num">{item.num}</div>
                <div className="how-title">{item.title}</div>
                <div className="how-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Tasks Preview */}
      <section
        id="available-tasks"
        style={{
          padding: '100px 24px',
          background: 'var(--white)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">Available Tasks</div>

            <h2 className="section-title">
              Browse <span className="blue">Active Tasks</span>
            </h2>

            <p className="section-desc">
              Log in to view and bid on hundreds of real tasks posted
              daily by clients worldwide.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {[
              {
                title: 'Write 5 WhatsApp Business Status Captions',
                pay: 'KES 1,200',
                category: 'Writing',
              },
              {
                title: '30-Day Social Media Content Calendar',
                pay: 'KES 4,000',
                category: 'Marketing',
              },
              {
                title: 'Translate Customer Service Policy to Swahili',
                pay: 'KES 3,300',
                category: 'Translation',
              },
              {
                title: 'Write a 500-Word Blog Post for SMEs',
                pay: 'KES 3,900',
                category: 'Writing',
              },
              {
                title: 'Research Top 5 Co-Working Spaces in Nairobi',
                pay: 'KES 3,000',
                category: 'Research',
              },
              {
                title: 'Write 10 Product Reviews for Electronics Store',
                pay: 'KES 4,300',
                category: 'Writing',
              },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: 10,
                  padding: 24,
                  borderTop: '3px solid var(--blue)',
                  opacity: user ? 1 : 0.7,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--blue-pale)',
                    color: 'var(--blue)',
                    padding: '2px 10px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  {t.category}
                </span>

                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--black)',
                    marginBottom: 16,
                  }}
                >
                  {t.title}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      color: 'var(--blue)',
                    }}
                  >
                    {t.pay}
                  </span>

                  <Link
                    href={user ? '/dashboard' : '/login'}
                    style={{
                      background: 'var(--blue)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {user ? 'View →' : 'Login to View'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link
              href={user ? '/dashboard' : '/register'}
              className="btn-primary"
              style={{ fontSize: 16, padding: '16px 48px' }}
            >
              {user
                ? 'View All Tasks on Dashboard'
                : 'Join Now to Access All Tasks'}
            </Link>
          </div>
        </div>
      </section>

      {/* Task Categories */}
      <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">What You Can Earn From</div>
            <h2 className="section-title">
              Task <span className="blue">Categories</span>
            </h2>
            <p className="section-desc">
              Pick tasks that match your skills. New categories launching soon.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '✅', label: 'Social Media Tasks',    desc: 'Likes, follows, reviews & more',        live: true  },
              { icon: '✍️', label: 'Writing & Articles',    desc: 'Blog posts, captions, copy',            live: false },
              { icon: '📋', label: 'Data Entry',            desc: 'Forms, spreadsheets, databases',        live: false },
              { icon: '🔍', label: 'Online Research',       desc: 'Market research & fact-finding',        live: false },
              { icon: '🎓', label: 'Academic Assignments',  desc: 'Essays, homework & study tasks',        live: false },
              { icon: '📺', label: 'Video Watching',        desc: 'Watch & review video content',          live: false },
              { icon: '📊', label: 'Survey & Feedback',     desc: 'Fill surveys, share opinions',          live: false },
              { icon: '🏢', label: 'Business Support',      desc: 'Virtual assistance & admin tasks',      live: false },
            ].map(cat => (
              <div key={cat.label} style={{
                background: '#fff',
                border: '1.5px solid',
                borderColor: cat.live ? 'var(--blue)' : '#E2E8F0',
                borderRadius: 14,
                padding: '22px 20px',
                position: 'relative',
                opacity: cat.live ? 1 : 0.85,
                transition: 'box-shadow 0.2s',
              }}>
                {!cat.live && (
                  <span style={{
                    position: 'absolute', top: 12, right: 12,
                    background: '#FEF3C7', color: '#92400E',
                    fontSize: 10, fontWeight: 700, padding: '3px 8px',
                    borderRadius: 20, letterSpacing: 0.5,
                  }}>
                    COMING SOON
                  </span>
                )}
                {cat.live && (
                  <span style={{
                    position: 'absolute', top: 12, right: 12,
                    background: '#D1FAE5', color: '#065F46',
                    fontSize: 10, fontWeight: 700, padding: '3px 8px',
                    borderRadius: 20, letterSpacing: 0.5,
                  }}>
                    LIVE
                  </span>
                )}
                <div style={{ fontSize: 30, marginBottom: 10 }}>{cat.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--black)', marginBottom: 6 }}>{cat.label}</div>
                <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Platforms */}
      <section style={{ padding: '80px 24px', background: '#0B0F19' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              Partner Platforms
            </div>
            <h2 className="section-title" style={{ color: '#fff' }}>
              More Ways to <span className="blue">Earn Online</span>
            </h2>
            <p className="section-desc" style={{ color: 'rgba(255,255,255,0.6)' }}>
              These top platforms are coming to Business Hub. Click any card to visit them directly.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              {
                name: 'Upwork',
                icon: '🟢',
                desc: 'Global freelance jobs for professionals',
                url: 'https://www.upwork.com',
                color: '#14A800',
              },
              {
                name: 'EasyPro',
                icon: '⚡',
                desc: 'Earn easily with quick digital tasks',
                url: 'https://easypro.app',
                color: '#F59E0B',
              },
              {
                name: 'Studypool',
                icon: '📚',
                desc: 'Get paid to help students with homework',
                url: 'https://www.studypool.com',
                color: '#3B82F6',
              },
              {
                name: 'Outlier',
                icon: '🤖',
                desc: 'Train AI models and earn per task',
                url: 'https://outlier.ai',
                color: '#8B5CF6',
              },
              {
                name: 'Fiverr',
                icon: '🎯',
                desc: 'Sell your skills as freelance services',
                url: 'https://www.fiverr.com',
                color: '#1DBF73',
              },
            ].map(p => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '24px 20px',
                  textDecoration: 'none',
                  transition: 'background 0.2s, transform 0.2s',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(254,243,199,0.15)', color: '#FCD34D',
                  fontSize: 10, fontWeight: 700, padding: '3px 8px',
                  borderRadius: 20, letterSpacing: 0.5,
                }}>
                  COMING SOON
                </span>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{p.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 17, color: p.color, marginBottom: 6,
                }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Visit platform →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-choose-us" className="why-section">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">Why Choose Us</div>

            <h2 className="section-title">
              Why <span className="blue">BUSINESS HUB</span> is the Best
              Choice
            </h2>
          </div>

          <div className="why-grid">
            {WHY_ITEMS.map((item) => (
              <div key={item.title} className="why-card">
                <div className="why-icon">{item.icon}</div>
                <h3 className="why-title">{item.title}</h3>
                <p className="why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact-us"
        style={{
          padding: '80px 24px',
          background: '#0B0F19',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="section-tag">
            Contact Us
          </div>

          <h2
            className="section-title"
            style={{ color: 'white', marginBottom: 20 }}
          >
            Need Help?
          </h2>

          <p
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 30,
            }}
          >
            Reach out to our support team anytime for account help,
            payments, task issues, or general inquiries.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '18px 28px',
              borderRadius: 10,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            📧 businesshub.comke@gmail.com
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <h2>Ready to Start Earning?</h2>

        <p>
          Join thousands of Kenyans already earning on Business Hub
          today.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/register" className="btn-white">
            Create Free Account
          </Link>

          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: 'white',
              padding: '14px 32px',
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 15,
              border: '2px solid rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
            }}
          >
            Login to Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">BUSINESS HUB</div>

            <p className="footer-desc">
              The all-in-one digital platform for tasks and assignments.
              Work from anywhere, earn real money, and grow your skills
              with Kenya&apos;s fastest-growing freelance community.
            </p>
          </div>

          <div>
            <div className="footer-heading">Platform</div>

            <ul className="footer-links">
              <li>
                <Link href="/register">Create Account</Link>
              </li>

              <li>
                <Link href="/login">Login</Link>
              </li>

              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">Support</div>

            <ul className="footer-links">
              <li>
  <a href="https://swastaskhub.github.io/manual/" target="_blank" rel="noopener noreferrer">Help Center</a>
</li>

                <li>
  <a href="https://swastaskhub.github.io/terms-/" target="_blank" rel="noopener noreferrer">Terms of Service</a>
</li>

                 <li>
  <a href=" https://swastaskhub.github.io/conduct/" target="_blank" rel="noopener noreferrer">conducts and policies</a>
</li>

                 <li>
  <a href="  https://swastaskhub.github.io/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
</li>




                
             


              <li>
                <a href="mailto:businesshub.comke@gmail.com">
                  businesshub.comke@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © 2026 Online Business Hub. All rights reserved.
          </p>

          <p
            className="footer-copy"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            Powered by Safaricom · M-Pesa Integrated
          </p>
        </div>
      </footer>
    </>
  );
}
