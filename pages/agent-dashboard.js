import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, getToken, logout } from '../lib/auth';

// Accepts 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX, +2547XXXXXXXX
function normalizeMpesaPhone(input) {
  const cleaned = String(input || '').replace(/[\s-]/g, '');
  const m = cleaned.match(/^(?:\+?254|0)([17]\d{8})$/);
  return m ? `254${m[1]}` : null;
}

const COOLDOWN_KEY = 'agentWithdrawalSentAt';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function recentlySent() {
  try {
    const t = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    return t && Date.now() - t < COOLDOWN_MS;
  } catch (e) {
    return false;
  }
}

export default function AgentDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        router.replace('/login');
        return;
      }
      if (u.agent?.status !== 'active') {
        router.replace('/dashboard');
        return;
      }
      const r = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'getAgentDashboard', authToken: getToken() }),
      });
      const d = await r.json();
      if (!d.success) {
        setErr(d.error || 'Could not load agent dashboard');