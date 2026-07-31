# M-PESA (Daraja) — Go-Live Checklist

Everything below is safe to keep in the repo: **placeholders only, no real secrets.**
The real keys are typed into the Vercel dashboard, never into any file or chat.

---

## Step 1 — Vercel environment variables
Vercel → `businesshub` project → **Settings → Environment Variables → Add New**.
For each row: Name (left), your value (right), Environment = **Production**, Save.

| Variable | Value |
|---|---|
| `DARAJA_ENV` | `production` |
| `DARAJA_STK_TRANSACTION_TYPE` | `CustomerBuyGoodsOnline` |
| `DARAJA_CONSUMER_KEY` | *(from Daraja portal — your app)* |
| `DARAJA_CONSUMER_SECRET` | *(from Daraja portal — your app)* |
| `DARAJA_PASSKEY` | *(Lipa na M-Pesa Online passkey)* |
| `DARAJA_SHORTCODE` | *(your STORE / Head-Office number)* |
| `DARAJA_TILL` | `1545320` |
| `DARAJA_INITIATOR_NAME` | *(B2C initiator name)* |
| `DARAJA_SECURITY_CREDENTIAL` | *(encrypted initiator password from the portal)* |
| `DARAJA_B2C_SHORTCODE` | *(often the same store number)* |
| `DARAJA_CALLBACK_BASE_URL` | `https://onlinejob-pi.vercel.app` |
| `DARAJA_CALLBACK_SECRET` | *(any random string you invent — keep it private)* |

Then: **Deployments → ⋯ → Redeploy**.

> ⚠️ Buy Goods gotcha: `DARAJA_SHORTCODE` = the **Store / Head-Office number** (this signs the STK password), and `DARAJA_TILL` = the **till customers pay to** (1545320). Don't swap them.

---

## Step 2 — Supabase table
Supabase → **SQL Editor → New query** → paste the contents of `db/mpesa-tables.sql` → **Run**.
(Creates the `mpesa_transactions` table. Safe to re-run.)

---

## Step 3 — Register callback URLs on the Daraja portal
Use the **same** value you set for `DARAJA_CALLBACK_SECRET` in place of `YOUR_SECRET`:

- STK callback:  `https://onlinejob-pi.vercel.app/api/mpesa/stk-callback?k=YOUR_SECRET`
- B2C Result:    `https://onlinejob-pi.vercel.app/api/mpesa/b2c-result?k=YOUR_SECRET`
- B2C Timeout:   `https://onlinejob-pi.vercel.app/api/mpesa/b2c-timeout?k=YOUR_SECRET`

---

## Step 4 — Verify
Open `https://onlinejob-pi.vercel.app/api/mpesa/config` in a browser.
- `{"stk":true,"b2c":true}`  → keys wired correctly ✅
- `{"stk":false,...}`         → keys not set / not deployed yet ❌ (payments will fail)

Then do one live test: **Premium** payment (STK prompt → PIN → premium activates) and one admin **Pay via M-Pesa** (B2C) on a withdrawal.

---

## Security reminders
- Never commit real keys. Only `DARAJA_CALLBACK_BASE_URL`, `DARAJA_TILL` and the two
  transaction-type/env values are non-secret; everything else is a secret and lives
  only in Vercel.
- If a secret is ever exposed, rotate it on the Daraja portal and update Vercel.
