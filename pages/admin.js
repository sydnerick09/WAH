import { useState, useEffect } from 'react';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

async function dbProxy(op, params = {}) {
  const r = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...params }),
  });
  return r.json();
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

function daysLeft(paidAt) {
  if (!paidAt) return null;
  const left = Math.ceil((paidAt + THREE_DAYS_MS - Date.now()) / (1000 * 60 * 60 * 24));
  return left > 0 ? left : 0;
}

export default function AdminPanel() {
  const [secret, setSecret]     = useState('');
  const [authed, setAuthed]     = useState(false);
  const [authErr, setAuthErr]   = useState('');
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [edits, setEdits]       = useState({});
  const [saving, setSaving]     = useState({});
  const [msg, setMsg]           = useState({});
  const [suspendModal, setSuspendModal] = useState(null); // { user, action: 'suspend'|'unsuspend' }
  const [suspendReason, setSuspendReason] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setAuthErr('');
    const res = await dbProxy('listUsers', { adminSecret: secret });
    setLoading(false);
    if (res.error === 'Unauthorized') {
      setAuthErr('Wrong admin password.');
      return;
    }
    setUsers(res.data || []);
    setAuthed(true);
  }

  async function refreshUsers() {
    const res = await dbProxy('listUsers', { adminSecret: secret });
    if (res.data) setUsers(res.data);
  }

  function setEdit(userId, field, value) {
    setEdits(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [field]: value },
    }));
  }

  function getEdit(userId, field, fallback) {
    const e = edits[userId];
    if (e && field in e) return e[field];
    return fallback;
  }

  async function saveUser(user) {
    const e = edits[user.id] || {};
    const balance     = e.balance     !== undefined ? Number(e.balance)     : user.balance;
    const premium     = e.premium     !== undefined ? e.premium             : user.premium;
    const premiumDays = e.premiumDays !== undefined ? Number(e.premiumDays) : null;

    const params = {
      adminSecret: secret,
      userId:      user.id,
      balance,
      premium,
    };

    if (premiumDays !== null && premium) {
      params.premiumPaidAt = Date.now() - (THREE_DAYS_MS - premiumDays * 24 * 60 * 60 * 1000);
    } else if (!premium) {
      params.premiumPaidAt = null;
    }

    const actEdit = e.activatedDays;
    if (actEdit !== undefined) {
      if (Number(actEdit) <= 0) {
        params.clearActivation = true;
      } else {
        params.activatedAt = Date.now() - (THREE_DAYS_MS - Number(actEdit) * 24 * 60 * 60 * 1000);
      }
    }

    setSaving(prev => ({ ...prev, [user.id]: true }));
    const res = await dbProxy('adminUpdateUser', params);
    setSaving(prev => ({ ...prev, [user.id]: false }));

    if (res.success) {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'ok', text: 'Saved!' } }));
      setEdits(prev => { const n = { ...prev }; delete n[user.id]; return n; });
      await refreshUsers();
    } else {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'err', text: res.error || 'Failed.' } }));
    }
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
  }

  async function confirmSuspend() {
    const { user, action } = suspendModal;
    setSuspendModal(null);
    setSaving(prev => ({ ...prev, [user.id]: true }));
    const res = await dbProxy('adminUpdateUser', {
      adminSecret:   secret,
      userId:        user.id,
      suspended:     action === 'suspend',
      suspendReason: action === 'suspend' ? suspendReason : '',
    });
    setSaving(prev => ({ ...prev, [user.id]: false }));
    setSuspendReason('');
    if (res.success) {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'ok', text: action === 'suspend' ? 'Suspended!' : 'Unsuspended!' } }));
      await refreshUsers();
    } else {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'err', text: res.error || 'Failed.' } }));
    }
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>BUSINESS HUB</div>
          <p style={styles.loginSub}>Admin Panel</p>
          <form onSubmit={handleLogin}>
            <input
              style={styles.input}
              type="password"
              placeholder="Admin password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              autoFocus
            />
            {authErr && <p style={styles.err}>{authErr}</p>}
            <button style={styles.btn} disabled={loading}>
              {loading ? 'Checking…' : 'Enter Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>BUSINESS HUB</div>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Admin — Balance &amp; Account Manager</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>{users.length} users</span>
          <button style={{ ...styles.btn, padding: '8px 16px', fontSize: 13 }} onClick={refreshUsers}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.searchWrap}>
        <input
          style={{ ...styles.input, maxWidth: 360, margin: 0 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Suspend / Unsuspend Confirmation Modal */}
      {suspendModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{
              background: suspendModal.action === 'suspend' ? '#DC2626' : '#059669',
              borderRadius: '12px 12px 0 0',
              padding: '20px 24px',
              color: '#fff',
            }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17 }}>
                {suspendModal.action === 'suspend' ? '🚫 Suspend Account' : '✅ Unsuspend Account'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                {suspendModal.user.fullName} — {suspendModal.user.email}
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              {suspendModal.action === 'suspend' ? (
                <>
                  <p style={{ fontSize: 14, color: '#374151', marginBottom: 14 }}>
                    This will immediately block the client from accessing their account. They will see a suspension notice when they log in.
                  </p>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Reason (shown to client)
                  </label>
                  <input
                    style={{ ...styles.input, marginBottom: 0 }}
                    placeholder="e.g. Violation of terms of service"
                    value={suspendReason}
                    onChange={e => setSuspendReason(e.target.value)}
                    autoFocus
                  />
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#374151' }}>
                  This will restore full access to <strong>{suspendModal.user.fullName}</strong>'s account immediately.
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  style={{
                    ...styles.btn,
                    background: suspendModal.action === 'suspend' ? '#DC2626' : '#059669',
                    flex: 1,
                  }}
                  onClick={confirmSuspend}
                >
                  {suspendModal.action === 'suspend' ? 'Yes, Suspend' : 'Yes, Unsuspend'}
                </button>
                <button
                  style={{ ...styles.btn, background: '#64748B', flex: 1 }}
                  onClick={() => { setSuspendModal(null); setSuspendReason(''); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Name / Email', 'Account Balance (KES)', 'Activation (days left)', 'Premium (days left)', 'Actions'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const actDays  = daysLeft(user.activatedAt);
              const premDays = daysLeft(user.premiumPaidAt);
              const isPrem   = user.premium;
              const isAct    = user.activated;
              const m        = msg[user.id];
              const isSaving = saving[user.id];

              const balVal  = getEdit(user.id, 'balance',      user.balance);
              const premVal = getEdit(user.id, 'premium',      isPrem);
              const actDaysEdit  = getEdit(user.id, 'activatedDays', actDays ?? (isAct ? 3 : 0));
              const premDaysEdit = getEdit(user.id, 'premiumDays',   premDays ?? (isPrem ? 3 : 0));

              return (
                <tr key={user.id} style={{ ...styles.tr, background: user.suspended ? '#FFF1F1' : undefined }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.fullName || '—'}
                      {user.suspended && (
                        <span style={{ ...styles.badge, background: '#FEE2E2', color: '#991B1B', fontSize: 11 }}>
                          🚫 SUSPENDED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{user.email}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      Joined: {fmtDate(user.createdAt)}
                    </div>
                    {user.suspended && user.suspendReason && (
                      <div style={{ fontSize: 11, color: '#991B1B', marginTop: 2 }}>
                        Reason: {user.suspendReason}
                      </div>
                    )}
                  </td>

                  {/* Balance */}
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="0"
                      style={styles.numInput}
                      value={balVal}
                      onChange={e => setEdit(user.id, 'balance', e.target.value)}
                    />
                  </td>

                  {/* Activation days */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        ...styles.badge,
                        background: isAct ? '#D1FAE5' : '#FEE2E2',
                        color:      isAct ? '#065F46' : '#991B1B',
                      }}>
                        {isAct ? `Active` : 'Inactive'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        style={{ ...styles.numInput, width: 60 }}
                        value={actDaysEdit}
                        title="Set days remaining (0 = deactivate)"
                        onChange={e => setEdit(user.id, 'activatedDays', e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: '#64748B' }}>days</span>
                    </div>
                    {user.activatedAt && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                        Activated: {fmtDate(user.activatedAt)}
                      </div>
                    )}
                  </td>

                  {/* Premium */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={premVal}
                          onChange={e => setEdit(user.id, 'premium', e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                        />
                        <span style={{ fontSize: 13 }}>{premVal ? 'Premium ON' : 'Premium OFF'}</span>
                      </label>
                    </div>
                    {premVal && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          style={{ ...styles.numInput, width: 60 }}
                          value={premDaysEdit}
                          title="Days remaining for premium"
                          onChange={e => setEdit(user.id, 'premiumDays', e.target.value)}
                        />
                        <span style={{ fontSize: 11, color: '#64748B' }}>days remaining</span>
                      </div>
                    )}
                    {user.premiumPaidAt && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                        Paid: {fmtDate(user.premiumPaidAt)}
                      </div>
                    )}
                  </td>

                  {/* Save + Suspend */}
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.btn, padding: '8px 18px', fontSize: 13 }}
                      disabled={isSaving}
                      onClick={() => saveUser(user)}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      style={{
                        ...styles.btn,
                        padding: '8px 18px',
                        fontSize: 13,
                        marginTop: 8,
                        background: user.suspended ? '#059669' : '#DC2626',
                      }}
                      disabled={isSaving}
                      onClick={() => {
                        setSuspendReason('');
                        setSuspendModal({ user, action: user.suspended ? 'unsuspend' : 'suspend' });
                      }}
                    >
                      {user.suspended ? '✅ Unsuspend' : '🚫 Suspend'}
                    </button>
                    {m && (
                      <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#065F46' : '#991B1B' }}>
                        {m.text}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  loginWrap: {
    minHeight: '100vh',
    background: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Manrope, sans-serif',
  },
  loginCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
  },
  logo: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 800,
    fontSize: 22,
    color: '#0F766E',
    letterSpacing: 1,
    marginBottom: 4,
  },
  loginSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 24,
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'Manrope, sans-serif',
    marginBottom: 12,
    background: '#F8FAFC',
    color: '#111827',
  },
  numInput: {
    width: 110,
    padding: '8px 10px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Manrope, sans-serif',
    background: '#F8FAFC',
    color: '#111827',
  },
  err: {
    color: '#991B1B',
    fontSize: 13,
    marginBottom: 10,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    background: '#0F766E',
    color: '#fff',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    fontFamily: 'Poppins, sans-serif',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.2s',
  },
  wrap: {
    minHeight: '100vh',
    background: '#F8FAFC',
    fontFamily: 'Manrope, sans-serif',
    padding: '0 0 40px',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #E2E8F0',
    padding: '20px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  searchWrap: {
    padding: '20px 32px 0',
  },
  tableWrap: {
    padding: '20px 32px',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  th: {
    background: '#0F766E',
    color: '#fff',
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    fontSize: 13,
    padding: '14px 16px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    verticalAlign: 'top',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
  },
};
