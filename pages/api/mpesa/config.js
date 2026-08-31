// pages/api/mpesa/config.js — lets the client know whether M-Pesa is live yet,
// so flows can switch to STK Push (and fall back to the old gateway until then).
// Exposes only booleans, never any credential.
import { isConfigured, isB2CConfigured } from '../../../lib/daraja';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ stk: isConfigured(), b2c: isB2CConfigured() });
}


