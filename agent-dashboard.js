import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getCurrentUser, getToken, logout } from '../lib/auth';

const KENYAN_BANKS = [
  'Absa Bank Kenya', 'Access Bank Kenya', 'African Banking Corporation (ABC Bank)', 'Bank of Africa Kenya',
  'Bank of Baroda Kenya', 'Bank of India Kenya', 'Citibank N.A. Kenya', 'Consolidated Bank of Kenya',
  'Co-operative Bank of Kenya', 'Credit Bank', 'Development Bank of Kenya', 'DIB Bank Kenya',
  'DTB Bank (Diamond Trust Bank)', 'Ecobank Kenya', 'Equity Bank Kenya', 'Family Bank',
  'First Community Bank', 'Guaranty Trust Bank (Kenya)', 'Guardian Bank', 'Gulf African Bank',
  'Habib Bank AG Zurich Kenya', 'I&M Bank', 'Kingdom Bank', 'KCB Bank Kenya', 'Mayfair Bank',
  'M-Oriental Bank', 'Middle East Bank Kenya', 'National Bank of Kenya', 'NCBA Bank Kenya',
  'Paramount Bank', 'Prime Bank Kenya', 'Sidian Bank', 'SBM Bank Kenya', 'Spire Bank',
  'Standard Chartered Bank Kenya', 'Stanbic Bank Kenya', 'UBA Kenya', 'Victoria Commercial Bank',
  'Postbank Kenya', 'KWFT Bank'
].sort((a, b) => a.localeCompare(b));

const links = [
  ['Profile', '/profile'], ['Terms & Conditions', '/terms'],
  ['Privacy Policy', '/privacy'], ['Conduct', '/conduct'],
];

export default function AgentDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank');
  const [bank, setBank] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [mpesa, setMpesa] = useState({ nationalId: '', phone: '' });
  const [bankSearch, setBankSearch] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);

  async function refresh() {
    const r = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'getAgentDashboard', authToken: getToken() }) });
    const d = await r.json();
    if (!d.success) { setError(d.error || 'Could not load agent dashboard.'); return; }
    setData(d);
    setBank(old => ({ ...old, accountName: old.accountName || d.fullName || '' }));
  }

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { router.replace('/login'); return; }
      if (user.agent?.status !== 'active') { router.replace('/dashboard'); return; }
      await refresh();
    })();
  }, [router]);

  if (!data) return <main style={wrap}><h1>Agent Dashboard</h1><p>{error || 'Loading…'}</p></main>;

  const agentLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://gweno.business'}/register?agent=${data.agent.code}`;
  const qualifiedCount = Number(data.qualifiedCount || 0);
  const rewardMilestones = Math.floor(qualifiedCount / 10);
  const canRequest = qualifiedCount >= 10;
  const filteredKenyanBanks = KENYAN_BANKS.filter(name => name.toLowerCase().includes(bankSearch.trim().toLowerCase()));

  async function requestWithdrawal() {
    let details;
    if (withdrawalMethod === 'bank') {
      if (!bank.bankName || !bank.accountName.trim() || !/^\d{5,30}$/.test(bank.accountNumber)) {
        setWithdrawMsg('Select a bank, enter the account holder’s full name, and enter a valid account number (5–30 digits).');
        return;
      }
      details = bank;
    } else {
      const nationalId = mpesa.nationalId.replace(/\D/g, '');
      const phoneDigits = mpesa.phone.replace(/\D/g, '');
      const validSafaricom = /^(?:254|0)(?:7|1)\d{8}$/.test(phoneDigits) && (phoneDigits.startsWith('07') || phoneDigits.startsWith('01') || phoneDigits.startsWith('2547') || phoneDigits.startsWith('2541'));
      if (!/^\d{8,9}$/.test(nationalId) || !validSafaricom) {
        setWithdrawMsg('Enter a valid Kenyan ID (8–9 digits) and a Safaricom number in 07…, 01…, or 254… format.');
        return;
      }
      details = { nationalId, phone: phoneDigits };
    }
    setWithdrawing(true); setWithdrawMsg('');
    try {
      const r = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        op: 'requestAgentCommissionWithdrawal', authToken: getToken(), method: withdrawalMethod, ...details,
      }) });
      const d = await r.json();
      setWithdrawMsg(d.success ? `${withdrawalMethod === 'bank' ? 'Bank' : 'M-Pesa'} withdrawal request submitted: KSh ${Number(d.amount).toLocaleString()}. No withdrawal fee.` : (d.error || 'Request failed.'));
      if (d.success) await refresh();
    } catch (_) { setWithdrawMsg('Could not submit the request. Please try again.'); }
    finally { setWithdrawing(false); }
  }

  return <main style={wrap}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div><h1 style={{ margin: 0 }}>Agent Dashboard</h1><small>Agent since {new Date(data.startDate).toLocaleDateString()}</small></div>
      <button style={button} onClick={() => { logout(); router.push('/login'); }}>Sign out</button>
    </header>
    <nav style={nav}>{links.map(([label, href]) => <Link key={href} href={href} style={navLink}>{label}</Link>)}</nav>

    <section style={grid}>{[
      ['Qualified clients', qualifiedCount], ['Agent reward earned', `KSh ${(Number(data.agent.rewardedMilestones?.length || 0) * 25000).toLocaleString()}`], ['This week', `${data.weekQualified} / 10`],
      ['Pending commission', `KES ${Number(data.balances.pending).toLocaleString()}`],
      ['Available commission', `KES ${Number(data.balances.available).toLocaleString()}`],
      ['Total earned', `KES ${Number(data.balances.total).toLocaleString()}`],
      ['Paid commission', `KES ${Number(data.balances.paid).toLocaleString()}`],
    ].map(([label, value]) => <div key={label} style={card}><small style={{ color: '#64748b' }}>{label}</small><strong style={{ display: 'block', fontSize: 22, marginTop: 5 }}>{value}</strong></div>)}</section>

    <section style={card}><h2 style={sectionTitle}>Referral link</h2><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input readOnly value={agentLink} style={{ ...field, flex: 1, minWidth: 220 }} /><button style={button} onClick={() => navigator.clipboard.writeText(agentLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}>{copied ? 'Copied' : 'Copy link'}</button></div><p style={smallText}>KSh 434 per distinct qualified client after their withdrawal is approved. Each set of 10 qualified clients also earns a KSh 25,000 reward, credited once per milestone. You currently qualify for {rewardMilestones} milestone(s).</p></section>

    <section style={card}><h2 style={sectionTitle}>Commission withdrawal</h2>
      <button
        style={{ ...button, opacity: canRequest && Number(data.balances.available) > 0 ? 1 : .45, cursor: canRequest && Number(data.balances.available) > 0 ? 'pointer' : 'not-allowed' }}
        disabled={!canRequest || Number(data.balances.available) <= 0 || withdrawing}
        onClick={() => { setShowBankForm(true); setWithdrawMsg(''); }}
      >Withdraw Full Balance</button>
      {showBankForm && canRequest && Number(data.balances.available) > 0 && <div style={{ marginTop: 14 }}>
        <p style={smallText}>Your entire available commission balance will be withdrawn. Agent withdrawals have no fee. Choose M-Pesa or bank transfer.</p>
        <div style={{ ...formGrid, marginBottom: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>Withdrawal method
            <select style={field} value={withdrawalMethod} onChange={e => { setWithdrawalMethod(e.target.value); setWithdrawMsg(''); }}>
              <option value="mpesa">M-Pesa (Safaricom)</option><option value="bank">Bank transfer</option>
            </select>
          </label>
          {withdrawalMethod === 'bank' ? <>
            <div style={{ display: 'grid', gap: 7 }}>
              <input style={field} placeholder="Search Kenyan banks…" aria-label="Search Kenyan banks" value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
              <select style={field} aria-label="Select bank" value={bank.bankName} onChange={e => setBank({ ...bank, bankName: e.target.value })} required>
                <option value="">Select your bank</option>
                {filteredKenyanBanks.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              {bankSearch && filteredKenyanBanks.length === 0 && <small style={{ color: '#b91c1c' }}>No matching bank. Try another search.</small>}
            </div>
            <input style={field} placeholder="Account holder’s full name" value={bank.accountName} onChange={e => setBank({ ...bank, accountName: e.target.value })} required />
            <input style={field} placeholder="Bank account number" inputMode="numeric" autoComplete="off" value={bank.accountNumber} onChange={e => setBank({ ...bank, accountNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 30) })} required />
          </> : <>
            <input style={field} placeholder="National ID number (8–9 digits)" aria-label="National ID number" inputMode="numeric" autoComplete="off" maxLength={9} value={mpesa.nationalId} onChange={e => setMpesa({ ...mpesa, nationalId: e.target.value.replace(/\D/g, '').slice(0, 9) })} required />
            <input style={field} placeholder="Safaricom number (07…, 01…, or 254…)" aria-label="Safaricom phone number" inputMode="tel" autoComplete="tel" value={mpesa.phone} onChange={e => setMpesa({ ...mpesa, phone: e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 18) })} required />
          </>}
          <input style={{ ...field, background: '#f8fafc' }} aria-label="Full withdrawal amount" value={`KSh ${Number(data.balances.available).toLocaleString()}`} readOnly />
        </div>
        <p style={smallText}>Withdrawal fee: KSh 0. The amount shown above is the full available balance; partial withdrawals are not allowed.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button style={button} disabled={withdrawing} onClick={requestWithdrawal}>{withdrawing ? 'Submitting…' : 'Submit Full-Balance Withdrawal'}</button>
          <button style={{ ...button, background: '#64748b' }} disabled={withdrawing} onClick={() => setShowBankForm(false)}>Cancel</button>
        </div>
        {withdrawMsg && <p role="status">{withdrawMsg}</p>}
      </div>}
    </section>

    <section style={card}><h2 style={sectionTitle}>Your clients</h2><div style={{ overflowX: 'auto' }}><table style={table}><thead><tr>{['Client', 'Joined', 'Status'].map(x => <th key={x} style={cell}>{x}</th>)}</tr></thead><tbody>{(data.clients || []).map(c => <tr key={c.id}><td style={cell}>{c.fullName || c.email}<br /><small>{c.email}</small></td><td style={cell}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td><td style={cell}>{c.qualified ? 'Withdrawal approved' : 'Not yet qualified'}</td></tr>)}{!data.clients?.length && <tr><td style={cell} colSpan="3">No clients yet.</td></tr>}</tbody></table></div></section>

    <section style={card}><h2 style={sectionTitle}>Weekly performance</h2><div style={{ overflowX: 'auto' }}><table style={table}><thead><tr>{['Week starting', 'Qualified', 'Target', 'Shortfall'].map(x => <th key={x} style={cell}>{x}</th>)}</tr></thead><tbody>{(data.weeklyHistory || []).map(w => <tr key={w.weekStart}>{[w.weekStart, w.qualified, w.target, w.shortfall].map((v, i) => <td key={i} style={cell}>{v}</td>)}</tr>)}{!data.weeklyHistory?.length && <tr><td style={cell} colSpan="4">No weekly history yet.</td></tr>}</tbody></table></div></section>

    <section style={card}><h2 style={sectionTitle}>Commission withdrawals</h2><div style={{ overflowX: 'auto' }}><table style={table}><thead><tr>{['Reference', 'Amount', 'Status', 'Date'].map(x => <th key={x} style={cell}>{x}</th>)}</tr></thead><tbody>{(data.agent.withdrawalHistory || []).slice().reverse().map(w => <tr key={w.id}>{[w.id, `KES ${Number(w.amount || 0).toLocaleString()}`, w.status, w.requestedAt ? new Date(w.requestedAt).toLocaleDateString() : '—'].map((v, i) => <td key={i} style={cell}>{v}</td>)}</tr>)}{!data.agent.withdrawalHistory?.length && <tr><td style={cell} colSpan="4">No withdrawals yet.</td></tr>}</tbody></table></div></section>
  </main>;
}

const wrap = { fontFamily: 'Arial,sans-serif', maxWidth: 1000, margin: '24px auto', padding: 18, color: '#111827', lineHeight: 1.45 };
const nav = { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 20px' };
const navLink = { padding: '8px 11px', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1f2937', textDecoration: 'none', fontSize: 13 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, margin: '18px 0' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 };
const button = { background: '#111827', color: '#fff', border: 0, borderRadius: 7, padding: '10px 14px', cursor: 'pointer' };
const field = { width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid #cbd5e1', borderRadius: 7 };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 9 };
const sectionTitle = { margin: '0 0 12px', fontSize: 18 };
const smallText = { fontSize: 13, color: '#64748b' };
const table = { width: '100%', borderCollapse: 'collapse' };
const cell = { textAlign: 'left', padding: 9, borderBottom: '1px solid #e2e8f0', fontSize: 13, verticalAlign: 'top' };
