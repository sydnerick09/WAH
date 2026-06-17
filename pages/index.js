// pages/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '../lib/auth';

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
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-glow-2" />

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
                title: 'Social Media Content Writing',
                pay: 'KES 2,500',
                category: 'Writing',
              },
              {
                title: 'Product Research Report',
                pay: 'KES 3,000',
                category: 'Research',
              },
              {
                title: 'Data Entry – Customer Records',
                pay: 'KES 1,800',
                category: 'Data Entry',
              },
              {
                title: 'SEO Keyword Research',
                pay: 'KES 2,200',
                category: 'Marketing',
              },
              {
                title: 'Excel Data Cleaning',
                pay: 'KES 1,500',
                category: 'Data Entry',
              },
              {
                title: 'Blog Article Writing',
                pay: 'KES 3,500',
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
            📧 businesshub.coke@gmail.com
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
                <a href="#">Terms of Service</a>
              </li>

              <li>
                <a href="#">Privacy Policy</a>
              </li>

              <li>
                <a href="mailto:businesshub.coke@gmail.com">
                  businesshub.coke@gmail.com
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