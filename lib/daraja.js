// lib/daraja.js — SERVER-ONLY Safaricom Daraja (M-Pesa) API client.
// Supports Lipa na M-PESA Online (STK Push) for incoming payments and B2C for
// outgoing payouts. All credentials come from environment variables; nothing
// here is ever exposed to the browser.
//
// Required env (see .env.example):
//   DARAJA_ENV                 production | sandbox        (default: sandbox)
//   DARAJA_CONSUMER_KEY
//   DARAJA_CONSUMER_SECRET
//   DARAJA_PASSKEY             (STK — Lipa na M-Pesa Online passkey)
//   DARAJA_SHORTCODE          (STK BusinessShortCode / PayBill or BuyGoods HO)
//   DARAJA_TILL               (STK PartyB when using BuyGoods; defaults to shortcode)
//   DARAJA_STK_TRANSACTION_TYPE  CustomerPayBillOnline | CustomerBuyGoodsOnline
//   DARAJA_B2C_SHORTCODE      (B2C PartyA; defaults to shortcode)
//   DARAJA_INITIATOR_NAME     (B2C)
//   DARAJA_SECURITY_CREDENTIAL(B2C — encrypted initiator password from portal)
//   DARAJA_B2C_COMMAND_ID     BusinessPayment | SalaryPayment | PromotionPayment
//   DARAJA_CALLBACK_BASE_URL  (defaults to NEXT_PUBLIC_BASE_URL)
//   DARAJA_CALLBACK_SECRET    (shared secret appended to callback URLs)

const PROD_BASE    = 'https://api.safaricom.co.ke';
const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke';

export function darajaConfig() {
  const env = (process.env.DARAJA_ENV || 'sandbox').toLowerCase();
  return {
    env,
    base: env === 'production' ? PROD_BASE : SANDBOX_BASE,
    consumerKey:        process.env.DARAJA_CONSUMER_KEY || '',
    consumerSecret:     process.env.DARAJA_CONSUMER_SECRET || '',
    passkey:            process.env.DARAJA_PASSKEY || '',
    shortcode:          process.env.DARAJA_SHORTCODE || '',
    till:               process.env.DARAJA_TILL || process.env.DARAJA_SHORTCODE || '',
    stkType:            process.env.DARAJA_STK_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    b2cShortcode:       process.env.DARAJA_B2C_SHORTCODE || process.env.DARAJA_SHORTCODE || '',
    initiatorName:      process.env.DARAJA_INITIATOR_NAME || '',
    securityCredential: process.env.DARAJA_SECURITY_CREDENTIAL || '',
    b2cCommandId:       process.env.DARAJA_B2C_COMMAND_ID || 'BusinessPayment',
    callbackBase:       (process.env.DARAJA_CALLBACK_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://onlinejob-pi.vercel.app').replace(/\/$/, ''),
    callbackSecret:     process.env.DARAJA_CALLBACK_SECRET || '',
  };
}

// True when STK Push (incoming) can run.
export function isConfigured() {
  const c = darajaConfig();
  return Boolean(c.consumerKey && c.consumerSecret && c.passkey && c.shortcode);
}
// True when B2C (outgoing payouts) can run.
export function isB2CConfigured() {
  const c = darajaConfig();
  return Boolean(c.consumerKey && c.consumerSecret && c.b2cShortcode && c.initiatorName && c.securityCredential);
}

// ── Phone helpers ─────────────────────────────────────────────────────────────
export function normalizePhone(p) {
  let s = String(p || '').replace(/[\s\-()+]/g, '');
  if (s.startsWith('0')) s = '254' + s.slice(1);
  else if (/^(7|1)\d{8}$/.test(s)) s = '254' + s;
  return s;
}
export function isValidMsisdn(p) {
  return /^254(7|1)\d{8}$/.test(normalizePhone(p));
}

function timestamp() {
  const d = new Date();
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
}

// Callback URL with the shared secret as a query param (verified on receipt).
export function callbackUrl(path) {
  const c = darajaConfig();
  const q = c.callbackSecret ? `?k=${encodeURIComponent(c.callbackSecret)}` : '';
  return `${c.callbackBase}/api/mpesa/${path}${q}`;
}
export function verifyCallbackSecret(req) {
  const c = darajaConfig();
  if (!c.callbackSecret) return true; // not enforced if unset (set it in production!)
  return String(req.query?.k || '') === c.callbackSecret;
}

// ── OAuth (cached per warm serverless instance) ───────────────────────────────
let _token = null;
let _tokenExp = 0;
export async function getAccessToken() {
  const c = darajaConfig();
  if (!c.consumerKey || !c.consumerSecret) throw new Error('Daraja credentials are not configured.');
  if (_token && Date.now() < _tokenExp - 30000) return _token;
  const auth = Buffer.from(`${c.consumerKey}:${c.consumerSecret}`).toString('base64');
  const r = await fetch(`${c.base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(`Daraja auth failed (${r.status}): ${d.errorMessage || 'no token'}`);
  _token = d.access_token;
  _tokenExp = Date.now() + Number(d.expires_in || 3599) * 1000;
  return _token;
}

// ── STK Push (Lipa na M-PESA Online) ──────────────────────────────────────────
export async function stkPush({ phone, amount, accountRef, description }) {
  const c = darajaConfig();
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString('base64');
  const msisdn = normalizePhone(phone);
  const body = {
    BusinessShortCode: c.shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: c.stkType,
    Amount: Math.round(Number(amount)),
    PartyA: msisdn,
    PartyB: c.stkType === 'CustomerBuyGoodsOnline' ? c.till : c.shortcode,
    PhoneNumber: msisdn,
    CallBackURL: callbackUrl('stk-callback'),
    AccountReference: String(accountRef || 'GwenoHub').slice(0, 12),
    TransactionDesc: String(description || 'Payment').slice(0, 20),
  };
  const r = await fetch(`${c.base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok && d.ResponseCode === '0', data: d };
}

// Query the status of an STK push (used as a verification fallback).
export async function stkQuery(checkoutRequestId) {
  const c = darajaConfig();
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString('base64');
  const r = await fetch(`${c.base}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ BusinessShortCode: c.shortcode, Password: password, Timestamp: ts, CheckoutRequestID: checkoutRequestId }),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d };
}

// ── B2C (outgoing payout to a customer) ───────────────────────────────────────
export async function b2cPayment({ phone, amount, remarks, occasion }) {
  const c = darajaConfig();
  if (!isB2CConfigured()) throw new Error('Daraja B2C is not configured.');
  const token = await getAccessToken();
  const body = {
    InitiatorName: c.initiatorName,
    SecurityCredential: c.securityCredential,
    CommandID: c.b2cCommandId,
    Amount: Math.round(Number(amount)),
    PartyA: c.b2cShortcode,
    PartyB: normalizePhone(phone),
    Remarks: String(remarks || 'Withdrawal').slice(0, 100),
    QueueTimeOutURL: callbackUrl('b2c-timeout'),
    ResultURL: callbackUrl('b2c-result'),
    Occasion: String(occasion || '').slice(0, 100),
  };
  const r = await fetch(`${c.base}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok && d.ResponseCode === '0', data: d };
}
