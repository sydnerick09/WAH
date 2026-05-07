# Online Business Hub

A full-stack web application for task management and earnings platform targeting Kenyan users.

## Tech Stack

- **Framework**: Next.js 14 (React)
- **Styling**: Custom CSS with CSS Variables
- **Storage**: localStorage (no database required)
- **Payment**: Paystack M-Pesa (simulated flow)
- **Deployment**: Vercel

## Features

- 🏠 **Homepage** — Modern landing page with hero, features, and CTA sections
- 👤 **User Registration** — Full registration with validation (name, email, Kenyan phone, country, password)
- 🔐 **Login** — Email/password authentication stored in localStorage
- 📊 **Dashboard** — User stats, balance, task feed with 50 tasks
- 🗂️ **Task Cards** — 50 unique tasks with categories, payment amounts (KES 1,000–3,500)
- 🔍 **Search & Filter** — Filter by category or search by keyword
- 👁️ **Task Detail Modal** — Full task details, poster info, location, payment
- 💼 **Bid Flow** — Triggers account activation with KES 50 M-Pesa payment
- ✅ **Activation** — Updates account status on successful payment

## Deployment on Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
cd online-business-hub
npm install
vercel
```

### Option 2: GitHub + Vercel Dashboard
1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel auto-detects Next.js — click Deploy
4. Done! Your site is live in ~2 minutes

### Option 3: Local Development
```bash
cd online-business-hub
npm install
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
online-business-hub/
├── pages/
│   ├── _app.js          # App wrapper
│   ├── _document.js     # HTML document with fonts
│   ├── index.js         # Homepage
│   ├── register.js      # Registration page
│   ├── login.js         # Login page
│   └── dashboard.js     # Dashboard with tasks
├── lib/
│   ├── auth.js          # Auth helpers (localStorage)
│   └── tasks.js         # 50 task definitions
├── styles/
│   └── globals.css      # All styles
├── next.config.js
├── package.json
└── vercel.json
```

## Color Palette

| Color | Hex |
|-------|-----|
| Blue (Primary) | `#0047FF` |
| Blue Dark | `#0033CC` |
| Blue Light | `#3B6FFF` |
| Black | `#0A0A0A` |
| White | `#FFFFFF` |

## Notes

- No database required — all data stored in browser localStorage
- M-Pesa payment is simulated (3-second delay then success)
- To integrate real Paystack payments, add your Paystack public key and implement the Paystack JS SDK
- All 50 tasks are pre-generated with randomized posters, locations, and payment amounts
