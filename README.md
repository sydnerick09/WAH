# Business Hub — Online Earning Platform

A full-stack Next.js web app for task management and earning, targeting East African users. Supports real payments via Paystack, Supabase persistence, and a full withdrawal flow.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (React) |
| Styling | Custom CSS with CSS Variables |
| Database | Supabase (PostgreSQL) |
| Payments | Paystack (KES, M-Pesa support) |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel |

## Features

- **Registration & Login** — Full auth with Supabase persistence; legacy localStorage users auto-migrated on login
- **Account Activation** — One-time KES 50 Paystack payment to unlock task bidding
- **Dashboard** — Live user stats (balance, completed tasks, active bids), task feed with search & category filter
- **80+ Tasks** — Real tasks priced KES 1,200–4,600 across Writing, Research, Data Entry, Design, Marketing, and more
- **Task Submission** — File upload (PDF, Word, Excel, audio, video) sent to admin via email attachment
- **Withdrawal Flow** — KES 480 Paystack processing fee → withdrawal details form → 2-hour countdown → auto-fail on expiry
- **Live Withdrawals Ticker** — Animated real-time payout feed
- **Referral System** — Unique referral links, KES 70 earned per activated referral
- **Premium Upgrade** — KES 480/month premium plan via Paystack
- **Training Registration** — KES 132 one-time training fee via Paystack
- **Space Background** — Full-bleed asteroid/particle backdrop on the dashboard

## Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
PAYSTACK_SECRET_KEY=sk_live_xxxx

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
NOTIFY_EMAIL=businesshub.comke@gmail.com
```

## Supabase Schema

### `users` table
| Column | Type | Notes |
|--------|------|-------|
| id | text | primary key |
| full_name | text | |
| email | text | unique |
| phone | text | |
| country | text | |
| password | text | |
| activated | boolean | default false |
| premium | boolean | default false |
| premium_paid_at | bigint | |
| balance | numeric | default 0 |
| referral_count | int | default 0 |
| referred_by | text | |
| completed_tasks | int | default 0 |
| active_bids | int | default 0 |
| task_submissions | jsonb | default {} |
| created_at | timestamptz | default now() |

### `withdrawal_requests` table
| Column | Type | Notes |
|--------|------|-------|
| id | text | primary key |
| user_id | text | references users.id |
| full_name | text | |
| phone | text | |
| id_number | text | |
| kra_pin | text | |
| amount | numeric | |
| status | text | pending / failed / cancelled |
| deadline | bigint | epoch ms |
| requested_at | timestamptz | default now() |
| updated_at | timestamptz | |

## Project Structure

```
├── pages/
│   ├── _app.js              # App wrapper
│   ├── _document.js         # HTML document
│   ├── index.js             # Landing page
│   ├── register.js          # Registration
│   ├── login.js             # Login
│   ├── dashboard.js         # Main dashboard
│   ├── payment-success.js   # Paystack callback handler
│   └── api/
│       ├── db.js            # Supabase operations proxy
│       ├── submit-task.js   # File upload + email API
│       └── paystack/
│           ├── initialize.js
│           └── verify.js
├── lib/
│   ├── auth.js              # Auth + user helpers
│   ├── supabase.js          # Supabase client
│   └── tasks.js             # Task definitions
├── public/
│   └── dashboard-bg.jpg     # Dashboard space background image
├── styles/
│   └── globals.css          # All styles
├── next.config.js
├── vercel.json
└── package.json
```

## Local Development

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
# Open http://localhost:3000
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy — live in ~2 minutes

## Dashboard Background

Place the space background image at `public/dashboard-bg.jpg`. The dashboard CSS will automatically use it with a dark overlay to keep all text readable.
