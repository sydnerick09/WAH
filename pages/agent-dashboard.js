import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, getToken, logout } from '../lib/auth';

// Accepts 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX, +2547XXXXXXXX
function normalizeMpesaPhone(input) {
  const cleaned = String(input || '').replace(/[\s-]/g, '');
  const m = cleaned.match(/^(?:\+?254|0)([17]\d{8})$/);
  return m ? `254${m[1]}` : null;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState('mpesa'); // 'mpesa' | 'bank'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadDashboard = async () => {
    const r = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'getAgentDashboard', authToken: getToken() }),
    });
    return r.json();
  };

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
      const d = await loadDashboard();
      if (!d.success) {
        setErr(d.error || 'Could not load agent dashboard');
        return;
      }
      setData(d);
      setAccountNumber('');
      setFullName(d.fullName || '');
    })();
  }, [router]);

  if (!data) {
    return (
      <main style={wrap}>
        <h1>Gweno Hub Agent Dashboard</h1>
        <p>{err || 'Loading agent information…'}</p>
      </main>
    );
  }

  const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://gweno.business'}/register?agent=${data.agent.code}`;
  const qualifyingClients = Number(data.qualifiedCount || 0);
  const available = Number(data.balances.available || 0);

  const submitWithdrawal = async () => {
    setWithdrawMsg('');

    if (!fullName.trim()) {
      setWithdrawMsg('Enter the account holder name.');
      return;
    }

    let payload;
    if (method === 'mpesa') {
      const normalized = normalizeMpesaPhone(phone);
      if (!normalized) {
        setWithdrawMsg('Enter a valid M-Pesa number, e.g. 0712345678 or 254712345678.');
        return;
      }
      payload = {
        method: 'mpesa',
        accountName: fullName.trim(),
        phone: normalized,
        // kept for backends that still read accountNumber
        accountNumber: normalized,
      };
    } else {
      if (!bankName.trim()) {
        setWithdrawMsg('Enter your bank name.');
        return;
      }
      if (!/^\d{6,20}$/.test(accountNumber.replace(/\s/g, ''))) {
        setWithdrawMsg('Enter a valid bank account number.');
        return;
      }
      payload = {
        method: 'bank',
        accountName: fullName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.replace(/\s/g, ''),
      };
    }

    setWithdrawing(true);
    try {
      const r = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'requestAgentCommissionWithdrawal',
          authToken: getToken(),
          ...payload,
        }),
      });
      const d = await r.json();
      setWithdrawMsg(
        d.success
          ? `Withdrawal request submitted for KES ${Number(d.amount).toLocaleString()} via ${method === 'mpesa' ? 'M-Pesa' : 'bank transfer'}.`
          : d.error || 'Request failed.'
      );
      if (d.success) {
        setPhone('');
        setAccountNumber('');
        setBankName('');
        const dd = await loadDashboard();
        if (dd.success) setData(dd);
      }
    } catch (e) {
      setWithdrawMsg('Could not submit request.');
    } finally {
      setWithdrawing(false);
    }
  };

  const methodLabel = (w) => {
    const m = String(w.method || 'bank').toLowerCase();
    return m === 'mpesa' ? 'M-Pesa' : 'Bank';
  };

  return (
    <main style={{ ...wrap, maxWidth: 1000 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Agent Dashboard</h1>
          <p>Agent since {new Date(data.startDate).toLocaleDateString()}</p>
        </div>
        <button
          style={btn}
          onClick={() => {
            logout();
            router.push('/login');
          }}
        >
          Sign out
        </button>
      </header>

      <section style={grid}>
        {[
          ['Qualified clients', data.qualifiedCount],
          ['This week', `${data.weekQualified} / 10`],
          ['Pending commission', `KES ${data.balances.pending.toLocaleString()}`],
          ['Available commission', `KES ${data.balances.available.toLocaleString()}`],
          ['Total commission earned', `KES ${data.balances.total.toLocaleString()}`],
          ['Paid commission', `KES ${data.balances.paid.toLocaleString()}`],
        ].map(([l, v]) => (
          <div key={l} style={card}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{l}</div>
            <strong style={{ fontSize: 24 }}>{v}</strong>
          </div>
        ))}
      </section>

      <section style={card}>
        <h2>Your agent referral link</h2>
        <p>
          Share this link. Commission is KSh 434 once per distinct client in your referral network after their
          withdrawal is approved.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input readOnly value={link} style={{ ...field, flex: 1, minWidth: 240 }} />
          <button
            style={btn}
            onClick={() =>
              navigator.clipboard.writeText(link).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
            }
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <p>
          {qualifyingClients < 10
            ? `You need at least 10 qualifying clients to initiate a withdrawal. Your current progress is ${qualifyingClients} out of 10 clients.`
            : 'You have met the 10-client requirement. Withdrawal is available subject to your available commission balance.'}
        </p>

        <h3 style={{ marginBottom: 8 }}>Withdraw commission</h3>
        <p style={{ marginTop: 0 }}>
          Withdrawal amount: <strong>KES {available.toLocaleString()}</strong> (your full available balance).{' '}
          <strong>No fee is charged.</strong>
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }} role="radiogroup" aria-label="Payment method">
          {[
            ['mpesa', 'M-Pesa'],
            ['bank', 'Bank account'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={method === key}
              onClick={() => {
                setMethod(key);
                setWithdrawMsg('');
              }}
              style={method === key ? btn : btnOutline}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, marginTop: 12 }}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Account holder name"
            style={field}
          />

          {method === 'mpesa' ? (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="M-Pesa number (07XX XXX XXX)"
              inputMode="tel"
              autoComplete="tel"
              style={field}
            />
          ) : (
            <>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank name"
                style={field}
              />
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                inputMode="numeric"
                style={field}
              />
            </>
          )}

          <button
            disabled={withdrawing || qualifyingClients < 10 || available < 100}
            style={{ ...btn, opacity: withdrawing || qualifyingClients < 10 || available < 100 ? 0.5 : 1 }}
            onClick={submitWithdrawal}
          >
            {withdrawing
              ? 'Submitting…'
              : `Withdraw KES ${available.toLocaleString()} via ${method === 'mpesa' ? 'M-Pesa' : 'bank'}`}
          </button>
        </div>

        {available < 100 && qualifyingClients >= 10 && (
          <p style={{ color: '#64748b', fontSize: 13 }}>The minimum withdrawal is KES 100.</p>
        )}
        {withdrawMsg && <p role="status">{withdrawMsg}</p>}

        <p>
          Weekly target: 10 distinct qualified clients, measured Monday–Sunday (East Africa time). Missing the target
          does not automatically suspend your account; performance is recorded for review.
        </p>
      </section>

      <section style={card}>
        <h2>Weekly performance history</h2>
        <p>Each week is measured Monday to Sunday in East Africa Time. Previous weeks remain in your history.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Week starting', 'Qualified clients', 'Target', 'Shortfall'].map((x) => (
                  <th key={x} style={th}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.weeklyHistory || []).map((w) => (
                <tr key={w.weekStart}>
                  {[w.weekStart, w.qualified, w.target, w.shortfall].map((v, i) => (
                    <td key={i} style={th}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
              {!(data.weeklyHistory || []).length && (
                <tr>
                  <td style={th} colSpan="4">
                    No completed qualification history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={card}>
        <h2>Commission withdrawal history</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Reference', 'Amount', 'Method', 'Status', 'Requested'].map((x) => (
                  <th key={x} style={th}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.agent.withdrawalHistory || [])
                .slice()
                .reverse()
                .map((w) => (
                  <tr key={w.id}>
                    {[
                      w.id,
                      `KES ${Number(w.amount || 0).toLocaleString()}`,
                      methodLabel(w),
                      w.status,
                      w.requestedAt ? new Date(w.requestedAt).toLocaleDateString() : '—',
                    ].map((v, i) => (
                      <td key={i} style={th}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              {!(data.agent.withdrawalHistory || []).length && (
                <tr>
                  <td style={th} colSpan="5">
                    No commission withdrawals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={card}>
        <h2>Clients in your referral network</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Client', 'Email', 'Country', 'Joined', 'Qualification'].map((x) => (
                  <th key={x} style={th}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.clients.map((c) => (
                <tr key={c.id}>
                  {[
                    c.fullName || 'Client',
                    c.email,
                    c.country || '—',
                    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
                    c.qualified ? 'Withdrawal approved' : 'Not yet qualified',
                  ].map((v, i) => (
                    <td key={i} style={th}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
              {!data.clients.length && (
                <tr>
                  <td style={th} colSpan="5">
                    No recruited clients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const wrap = { fontFamily: 'Arial,sans-serif', maxWidth: 800, margin: '30px auto', padding: 22, color: '#111827', lineHeight: 1.5 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, margin: '20px 0' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 16, boxShadow: '0 3px 12px #00000008' };
const btn = { background: '#111827', color: '#fff', border: '1px solid #111827', borderRadius: 7, padding: '10px 16px', cursor: 'pointer' };
const btnOutline = { background: '#fff', color: '#111827', border: '1px solid #cbd5e1', borderRadius: 7, padding: '10px 16px', cursor: 'pointer' };
const field = { padding: 10, border: '1px solid #cbd5e1', borderRadius: 7 };
const th = { textAlign: 'left', padding: 10, borderBottom: '1px solid #e2e8f0', fontSize: 13 };
