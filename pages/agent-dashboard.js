
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, getToken, logout } from '../lib/auth';

export default function AgentDashboard() {
  const router = useRouter();

  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [accountNumber, setAccountNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');

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

      try {
        const r = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'getAgentDashboard',
            authToken: getToken()
          })
        });

        const d = await r.json();

        if (!d.success) {
          setErr(d.error || 'Could not load agent dashboard');
          return;
        }

        setData(d);
        setFullName(d.fullName || '');
      } catch {
        setErr('Could not load agent dashboard.');
      }
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

  const link = `${
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://gweno.business'
  }/register?agent=${data.agent.code}`;

  const qualifyingClients = Number(data.qualifiedCount || 0);
  const eligible = qualifyingClients >= 10 &&
    Number(data.balances.available || 0) >= 100;

  const refreshDashboard = async () => {
    const r = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'getAgentDashboard',
        authToken: getToken()
      })
    });

    const d = await r.json();

    if (d.success) setData(d);
  };

  const requestWithdrawal = async () => {
    if (!fullName.trim()) {
      setWithdrawMsg('Enter the account holder name.');
      return;
    }

    if (paymentMethod === 'mpesa' && !/^254[17]\d{8}$/.test(phoneNumber)) {
      setWithdrawMsg('Enter a valid M-Pesa number in 254XXXXXXXXX format.');
      return;
    }

    if (paymentMethod === 'bank' && !accountNumber.trim()) {
      setWithdrawMsg('Enter your bank account number.');
      return;
    }

    if (!eligible) {
      setWithdrawMsg(
        'You need 10 qualified clients and at least KES 100 available commission.'
      );
      return;
    }

    setWithdrawing(true);
    setWithdrawMsg('');

    try {
      const payload = {
        op: 'requestAgentCommissionWithdrawal',
        authToken: getToken(),
        accountName: fullName.trim(),
        paymentMethod,
        accountNumber:
          paymentMethod === 'bank' ? accountNumber.trim() : '',
        phoneNumber:
          paymentMethod === 'mpesa' ? phoneNumber.trim() : '',
        withdrawalFee: 0
      };

      const r = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const d = await r.json();

      if (!d.success) {
        setWithdrawMsg(d.error || 'Withdrawal request failed.');
        return;
      }

      setWithdrawMsg(
        `Your ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'bank'} withdrawal request has been submitted successfully. Amount: KES ${Number(d.amount).toLocaleString()}. No withdrawal fee. Await admin processing.`
      );

      setPhoneNumber('');
      setAccountNumber('');

      await refreshDashboard();

    } catch {
      setWithdrawMsg('Could not submit withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <main style={{ ...wrap, maxWidth: 1000 }}>

      <header style={header}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Agent Dashboard</h1>
          <p>
            Agent since {new Date(data.startDate).toLocaleDateString()}
          </p>
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
          ['Paid commission', `KES ${data.balances.paid.toLocaleString()}`]
        ].map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
            <strong style={{ fontSize: 24 }}>{value}</strong>
          </div>
        ))}
      </section>

      <section style={card}>
        <h2>Your agent referral link</h2>

        <p>
          Share this link. Commission is KSh 434 once per distinct client
          in your referral network after their withdrawal is approved.
        </p>

        <div style={flex}>
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
            ? `You need ${10 - qualifyingClients} more qualified clients to unlock withdrawals.`
            : 'You have met the 10-client requirement. You can request a withdrawal subject to your available balance.'}
        </p>

        <div style={{ marginTop: 20 }}>
          <h2>Withdraw your commission</h2>

          <p>
            Choose your preferred payment method. All requests are
            manually reviewed and processed by an administrator.
            No withdrawal fees are charged.
          </p>

          <label style={label}>Payment method</label>

          <div style={flex}>
            <button
              style={paymentMethod === 'mpesa' ? activeBtn : secondaryBtn}
              onClick={() => {
                setPaymentMethod('mpesa');
                setWithdrawMsg('');
              }}
            >
              M-Pesa
            </button>

            <button
              style={paymentMethod === 'bank' ? activeBtn : secondaryBtn}
              onClick={() => {
                setPaymentMethod('bank');
                setWithdrawMsg('');
              }}
            >
              Bank account
            </button>
          </div>

          <div style={formGrid}>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Account holder full name"
              style={field}
            />

            {paymentMethod === 'mpesa' ? (
              <input
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="M-Pesa number (2547XXXXXXXX)"
                style={field}
                inputMode="numeric"
              />
            ) : (
              <input
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                style={field}
              />
            )}

            <button
              disabled={withdrawing || !eligible}
              style={{
                ...btn,
                opacity: eligible ? 1 : 0.5,
                cursor: eligible ? 'pointer' : 'not-allowed'
              }}
              onClick={requestWithdrawal}
            >
              {withdrawing ? 'Submitting…' : 'Request commission withdrawal'}
            </button>
          </div>

          <p style={{ color: '#15803d', fontWeight: 600 }}>
            Withdrawal fee: KES 0
          </p>

          {withdrawMsg && (
            <p role="status" style={{ color: '#334155' }}>
              {withdrawMsg}
            </p>
          )}
        </div>

        <p>
          Weekly target: 10 distinct qualified clients, measured Monday
          to Sunday (East Africa time). Missing the target does not
          automatically suspend your account.
        </p>
      </section>

      <section style={card}>
        <h2>Weekly performance history</h2>
        <p>
          Each week is measured Monday to Sunday in East Africa Time.
          Previous weeks remain in your history.
        </p>

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {['Week starting', 'Qualified clients', 'Target', 'Shortfall'].map(x => (
                  <th key={x} style={th}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.weeklyHistory || []).map(w => (
                <tr key={w.weekStart}>
                  {[w.weekStart, w.qualified, w.target, w.shortfall].map((v, i) => (
                    <td key={i} style={th}>{v}</td>
                  ))}
                </tr>
              ))}

              {!data.weeklyHistory?.length && (
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

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {['Reference', 'Payment method', 'Amount', 'Status', 'Requested'].map(x => (
                  <th key={x} style={th}>{x}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(data.agent.withdrawalHistory || []).slice().reverse().map(w => (
                <tr key={w.id}>
                  <td style={th}>{w.id}</td>
                  <td style={th}>
                    {w.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank'}
                  </td>
                  <td style={th}>
                    KES {Number(w.amount || 0).toLocaleString()}
                  </td>
                  <td style={th}>{w.status}</td>
                  <td style={th}>
                    {w.requestedAt
                      ? new Date(w.requestedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}

              {!data.agent.withdrawalHistory?.length && (
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

        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {['Client', 'Email', 'Country', 'Joined', 'Qualification'].map(x => (
                  <th key={x} style={th}>{x}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(data.clients || []).map(c => (
                <tr key={c.id}>
                  {[
                    c.fullName || 'Client',
                    c.email,
                    c.country || '—',
                    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
                    c.qualified ? 'Withdrawal approved' : 'Not yet qualified'
                  ].map((v, i) => (
                    <td key={i} style={th}>{v}</td>
                  ))}
                </tr>
              ))}

              {!data.clients?.length && (
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

const wrap = {
  fontFamily: 'Arial,sans-serif',
  maxWidth: 800,
  margin: '30px auto',
  padding: 22,
  color: '#111827',
  lineHeight: 1.5
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
  gap: 12,
  margin: '20px 0'
};

const card = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 18,
  marginBottom: 16,
  boxShadow: '0 3px 12px #00000008'
};

const btn = {
  background: '#111827',
  color: '#fff',
  border: 0,
  borderRadius: 7,
  padding: '10px 16px',
  cursor: 'pointer'
};

const activeBtn = {
  ...btn,
  background: '#15803d'
};

const secondaryBtn = {
  ...btn,
  background: '#e2e8f0',
  color: '#111827'
};

const field = {
  padding: 10,
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  width: '100%',
  boxSizing: 'border-box'
};

const label = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 600
};

const flex = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
  gap: 8,
  marginTop: 12
};

const tableWrap = {
  overflowX: 'auto'
};

const table = {
  width: '100%',
  borderCollapse: 'collapse'
};

const th = {
  textAlign: 'left',
  padding: 10,
  borderBottom: '1px solid #e2e8f0',
  fontSize: 13
};
