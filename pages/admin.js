import { useState, useEffect } from 'react';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const BROADCAST_DEFAULT_SUBJECT = 'Welcome to Business Hub';
const BROADCAST_DEFAULT_BODY = `Dear Client,

Welcome to Business Hub! We are delighted to have you as part of our community.

We have been working hard to improve our services and address your concerns. We are pleased to introduce a few simple steps that will make it easier for you to manage your Activation Fee and Premium Fee at your convenience.

We also encourage you to carefully complete the available tasks and assessments, as they provide genuine earning opportunities that can help you cover your activation and premium fees.

For your security, we kindly ask you to withdraw your earnings promptly. In line with our policies, Business Hub does not hold clients' funds. We operate as a secure bridge between clients and service providers, not as a bank.

Our mission is to create opportunities, empower our community, and give back to society through a reliable and transparent platform.

Thank you for choosing Business Hub. We look forward to supporting your success.`;

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
  const left = Math.ceil((paidAt + ONE_MONTH_MS - Date.now()) / (1000 * 60 * 60 * 24));
  return left > 0 ? left : 0;
}

const STATUS_COLORS = {
  pending:  { bg: '#FEF3C7', color: '#92400E' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  declined: { bg: '#FEE2E2', color: '#991B1B' },
};

// ─── Suspend Confirmation Modal ───────────────────────────────────────────────
function SuspendModal({ modal, reason, setReason, onConfirm, onCancel }) {
  if (!modal) return null;
  const isSuspending = modal.action === 'suspend';
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ background: isSuspending ? '#DC2626' : '#059669', borderRadius: '12px 12px 0 0', padding: '20px 24px', color: '#fff' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17 }}>
            {isSuspending ? '🚫 Suspend Account' : '✅ Unsuspend Account'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            {modal.user.fullName} — {modal.user.email}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {isSuspending ? (
            <>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 14 }}>
                This will immediately block the client from accessing their account.
              </p>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Reason (shown to client)
              </label>
              <input
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="e.g. Violation of terms of service"
                value={reason}
                onChange={e => setReason(e.target.value)}
                autoFocus
              />
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#374151' }}>
              This will restore full access to <strong>{modal.user.fullName}</strong>&apos;s account immediately.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ ...styles.btn, background: isSuspending ? '#DC2626' : '#059669', flex: 1 }} onClick={onConfirm}>
              {isSuspending ? 'Yes, Suspend' : 'Yes, Unsuspend'}
            </button>
            <button style={{ ...styles.btn, background: '#64748B', flex: 1 }} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users Table ──────────────────────────────────────────────────────────────
function UsersTab({ users, secret, onRefresh }) {
  const [search,       setSearch]       = useState('');
  const [edits,        setEdits]        = useState({});
  const [saving,       setSaving]       = useState({});
  const [msg,          setMsg]          = useState({});
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  function setEdit(uid, field, val) {
    setEdits(prev => ({ ...prev, [uid]: { ...(prev[uid] || {}), [field]: val } }));
  }
  function getEdit(uid, field, fallback) {
    const e = edits[uid];
    return e && field in e ? e[field] : fallback;
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
      fullName: getEdit(user.id, 'fullName', user.fullName),
      email:    getEdit(user.id, 'email',    user.email),
      phone:    getEdit(user.id, 'phone',    user.phone || ''),
      password: getEdit(user.id, 'password', user.password || ''),
    };

    if (premiumDays !== null && premium) {
      params.premiumPaidAt = Date.now() - (ONE_MONTH_MS - premiumDays * 24 * 60 * 60 * 1000);
    } else if (!premium) {
      params.premiumPaidAt = null;
    }

    const actEdit = e.activatedDays;
    if (actEdit !== undefined) {
      if (Number(actEdit) <= 0) params.clearActivation = true;
      else params.activatedAt = Date.now() - (ONE_MONTH_MS - Number(actEdit) * 24 * 60 * 60 * 1000);
    }

    setSaving(prev => ({ ...prev, [user.id]: true }));
    const res = await dbProxy('adminUpdateUser', params);
    setSaving(prev => ({ ...prev, [user.id]: false }));

    if (res.success) {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'ok', text: 'Saved!' } }));
      setEdits(prev => { const n = { ...prev }; delete n[user.id]; return n; });
      await onRefresh();
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
      await onRefresh();
    } else {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'err', text: res.error || 'Failed.' } }));
    }
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
  }

  async function deleteUser(user) {
    if (!confirm(`Permanently delete ${user.fullName || user.email || 'this account'} from the database?\n\nThis removes the account entirely and cannot be undone.`)) return;
    setSaving(prev => ({ ...prev, [user.id]: true }));
    const res = await dbProxy('adminDeleteUser', { adminSecret: secret, userId: user.id });
    setSaving(prev => ({ ...prev, [user.id]: false }));
    if (res.success) {
      await onRefresh();
    } else {
      setMsg(prev => ({ ...prev, [user.id]: { type: 'err', text: res.error || 'Delete failed.' } }));
      setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  return (
    <>
      <SuspendModal
        modal={suspendModal}
        reason={suspendReason}
        setReason={setSuspendReason}
        onConfirm={confirmSuspend}
        onCancel={() => { setSuspendModal(null); setSuspendReason(''); }}
      />

      <div style={styles.searchWrap}>
        <input
          style={{ ...styles.input, maxWidth: 360, margin: 0 }}
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 13, color: '#64748B', marginLeft: 12 }}>{filtered.length} users</span>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Name / Email / Phone / Password', 'Dates', 'Balance (KES)', 'Activation', 'Premium', 'Status', 'Actions'].map(h => (
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
              const isSusp   = user.suspended;
              const m        = msg[user.id];
              const isSaving = saving[user.id];

              const balVal       = getEdit(user.id, 'balance',       user.balance);
              const premVal      = getEdit(user.id, 'premium',       isPrem);
              const actDaysEdit  = getEdit(user.id, 'activatedDays', actDays ?? (isAct ? 30 : 0));
              const premDaysEdit = getEdit(user.id, 'premiumDays',   premDays ?? (isPrem ? 30 : 0));

              return (
                <tr key={user.id} style={{ ...styles.tr, background: isSusp ? '#FFF1F1' : undefined }}>

                  {/* Name / Email / Phone */}
                  <td style={styles.td}>
                    {isSusp && <span style={{ ...styles.badge, background: '#FEE2E2', color: '#991B1B', fontSize: 10, marginBottom: 6, display: 'inline-block' }}>🚫 SUSPENDED</span>}
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Full Name</div>
                    <input
                      style={{ ...styles.numInput, width: '100%', marginBottom: 6 }}
                      value={getEdit(user.id, 'fullName', user.fullName || '')}
                      onChange={e => setEdit(user.id, 'fullName', e.target.value)}
                      placeholder="Full name"
                    />
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Email</div>
                    <input
                      style={{ ...styles.numInput, width: '100%', marginBottom: 6 }}
                      type="email"
                      value={getEdit(user.id, 'email', user.email || '')}
                      onChange={e => setEdit(user.id, 'email', e.target.value)}
                      placeholder="Email"
                    />
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Phone</div>
                    <input
                      style={{ ...styles.numInput, width: '100%' }}
                      value={getEdit(user.id, 'phone', user.phone || '')}
                      onChange={e => setEdit(user.id, 'phone', e.target.value)}
                      placeholder="Phone"
                    />
                    <div style={{ fontSize: 11, color: '#64748B', margin: '6px 0 2px' }}>🔑 Password</div>
                    <input
                      style={{ ...styles.numInput, width: '100%', fontFamily: 'monospace', color: '#0F766E', fontWeight: 600 }}
                      value={getEdit(user.id, 'password', user.password || '')}
                      onChange={e => setEdit(user.id, 'password', e.target.value)}
                      placeholder="(no password on file)"
                    />
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Type a new password here, then Save to change it.</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{user.country || '—'}</div>
                    {isSusp && user.suspendReason && (
                      <div style={{ fontSize: 11, color: '#991B1B', marginTop: 2 }}>Reason: {user.suspendReason}</div>
                    )}
                  </td>

                  {/* Dates */}
                  <td style={{ ...styles.td, minWidth: 180 }}>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Joined</span><span style={styles.dateVal}>{fmtDate(user.createdAt)}</span></div>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Activated</span><span style={styles.dateVal}>{fmtDate(user.activatedAt)}</span></div>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Premium paid</span><span style={styles.dateVal}>{fmtDate(user.premiumPaidAt)}</span></div>
                    {isSusp && <div style={styles.dateRow}><span style={{ ...styles.dateLabel, color: '#991B1B' }}>Suspended</span><span style={styles.dateVal}>{fmtDate(user.suspendedAt)}</span></div>}
                  </td>

                  {/* Balance */}
                  <td style={styles.td}>
                    <input type="number" min="0" style={styles.numInput} value={balVal}
                      onChange={e => setEdit(user.id, 'balance', e.target.value)} />
                  </td>

                  {/* Activation */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ ...styles.badge, background: isAct ? '#D1FAE5' : '#FEE2E2', color: isAct ? '#065F46' : '#991B1B' }}>
                        {isAct ? 'Active' : 'Inactive'}
                      </span>
                      <input type="number" min="0" max="3" style={{ ...styles.numInput, width: 54 }}
                        value={actDaysEdit} title="Days remaining (0 = deactivate)"
                        onChange={e => setEdit(user.id, 'activatedDays', e.target.value)} />
                      <span style={{ fontSize: 11, color: '#64748B' }}>days</span>
                    </div>
                  </td>

                  {/* Premium */}
                  <td style={styles.td}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 6 }}>
                      <input type="checkbox" checked={premVal}
                        onChange={e => setEdit(user.id, 'premium', e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#0F766E' }} />
                      <span style={{ fontSize: 13 }}>{premVal ? 'ON' : 'OFF'}</span>
                    </label>
                    {premVal && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" min="1" max="30" style={{ ...styles.numInput, width: 54 }}
                          value={premDaysEdit} title="Days remaining"
                          onChange={e => setEdit(user.id, 'premiumDays', e.target.value)} />
                        <span style={{ fontSize: 11, color: '#64748B' }}>days</span>
                      </div>
                    )}
                  </td>

                  {/* Status badge */}
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: isSusp ? '#FEE2E2' : isAct ? '#D1FAE5' : '#F1F5F9', color: isSusp ? '#991B1B' : isAct ? '#065F46' : '#64748B' }}>
                      {isSusp ? 'Suspended' : isAct ? 'Active' : 'Inactive'}
                    </span>
                    {isPrem && !isSusp && (
                      <span style={{ ...styles.badge, background: '#ECFDF5', color: '#065F46', display: 'block', marginTop: 4 }}>⭐ Premium</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={styles.td}>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%' }}
                      disabled={isSaving} onClick={() => saveUser(user)}>
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: isSusp ? '#059669' : '#DC2626' }}
                      disabled={isSaving}
                      onClick={() => { setSuspendReason(''); setSuspendModal({ user, action: isSusp ? 'unsuspend' : 'suspend' }); }}>
                      {isSusp ? '✅ Unsuspend' : '🚫 Suspend'}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#7F1D1D' }}
                      disabled={isSaving}
                      onClick={() => deleteUser(user)}>
                      🗑️ Delete
                    </button>
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#065F46' : '#991B1B' }}>{m.text}</p>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Withdrawals Table ────────────────────────────────────────────────────────
function WithdrawalsTab({ withdrawals, secret, onRefresh }) {
  const [search,  setSearch]  = useState('');
  const [edits,   setEdits]   = useState({});
  const [saving,  setSaving]  = useState({});
  const [msg,     setMsg]     = useState({});
  const [deleting, setDeleting] = useState({});

  function setEdit(id, field, val) {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));
  }
  function getEdit(id, field, fallback) {
    const e = edits[id];
    return e && field in e ? e[field] : fallback;
  }

  async function saveWithdrawal(wd) {
    const e = edits[wd.id] || {};
    setSaving(prev => ({ ...prev, [wd.id]: true }));
    const res = await dbProxy('adminUpdateWithdrawal', {
      adminSecret: secret,
      requestId:   wd.id,
      status:      getEdit(wd.id, 'status',   wd.status),
      amount:      getEdit(wd.id, 'amount',   wd.amount),
      phone:       getEdit(wd.id, 'phone',    wd.phone),
      idNumber:    getEdit(wd.id, 'idNumber', wd.idNumber),
      fullName:    getEdit(wd.id, 'fullName', wd.fullName),
    });
    setSaving(prev => ({ ...prev, [wd.id]: false }));
    if (res.success) {
      setMsg(prev => ({ ...prev, [wd.id]: { type: 'ok', text: 'Saved!' } }));
      setEdits(prev => { const n = { ...prev }; delete n[wd.id]; return n; });
      await onRefresh();
    } else {
      setMsg(prev => ({ ...prev, [wd.id]: { type: 'err', text: res.error || 'Failed.' } }));
    }
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[wd.id]; return n; }), 3000);
  }

  async function deleteWithdrawal(wd) {
    if (!confirm(`Delete withdrawal request from ${wd.fullName}?`)) return;
    setDeleting(prev => ({ ...prev, [wd.id]: true }));
    await dbProxy('adminDeleteWithdrawal', { adminSecret: secret, requestId: wd.id });
    setDeleting(prev => ({ ...prev, [wd.id]: false }));
    await onRefresh();
  }

  const filtered = withdrawals.filter(w => {
    const q = search.toLowerCase();
    return !q || w.fullName?.toLowerCase().includes(q) || w.phone?.includes(q) || w.status?.includes(q);
  });

  return (
    <>
      <div style={styles.searchWrap}>
        <input
          style={{ ...styles.input, maxWidth: 360, margin: 0 }}
          placeholder="Search by name, phone or status…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 13, color: '#64748B', marginLeft: 12 }}>{filtered.length} requests</span>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Client Name', 'Phone / National ID', 'Amount (KES)', 'Status', 'Dates', 'Actions'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(wd => {
              const sc       = STATUS_COLORS[wd.status] || STATUS_COLORS.pending;
              const isSaving = saving[wd.id];
              const isDel    = deleting[wd.id];
              const m        = msg[wd.id];

              return (
                <tr key={wd.id} style={styles.tr}>

                  {/* Name */}
                  <td style={styles.td}>
                    <input style={{ ...styles.numInput, width: 160 }} value={getEdit(wd.id, 'fullName', wd.fullName || '')}
                      onChange={e => setEdit(wd.id, 'fullName', e.target.value)} />
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>ID: {wd.userId}</div>
                  </td>

                  {/* Phone / ID */}
                  <td style={styles.td}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>Phone</div>
                    <input style={{ ...styles.numInput, width: 160, marginBottom: 6 }}
                      value={getEdit(wd.id, 'phone', wd.phone || '')}
                      onChange={e => setEdit(wd.id, 'phone', e.target.value)} />
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>National ID</div>
                    <input style={{ ...styles.numInput, width: 160 }}
                      value={getEdit(wd.id, 'idNumber', wd.idNumber || '')}
                      onChange={e => setEdit(wd.id, 'idNumber', e.target.value)} />
                  </td>

                  {/* Amount */}
                  <td style={styles.td}>
                    <input type="number" min="0" style={{ ...styles.numInput, width: 110 }}
                      value={getEdit(wd.id, 'amount', wd.amount)}
                      onChange={e => setEdit(wd.id, 'amount', e.target.value)} />
                  </td>

                  {/* Status */}
                  <td style={styles.td}>
                    <select
                      style={{ ...styles.numInput, width: 120, background: sc.bg, color: sc.color, fontWeight: 600 }}
                      value={getEdit(wd.id, 'status', wd.status)}
                      onChange={e => setEdit(wd.id, 'status', e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="declined">Declined</option>
                    </select>
                  </td>

                  {/* Dates */}
                  <td style={{ ...styles.td, minWidth: 160 }}>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Requested</span><span style={styles.dateVal}>{fmtDate(wd.requestedAt)}</span></div>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Updated</span><span style={styles.dateVal}>{fmtDate(wd.updatedAt)}</span></div>
                    {wd.deadline && <div style={styles.dateRow}><span style={styles.dateLabel}>Deadline</span><span style={styles.dateVal}>{fmtDate(wd.deadline)}</span></div>}
                  </td>

                  {/* Actions */}
                  <td style={styles.td}>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%' }}
                      disabled={isSaving || isDel} onClick={() => saveWithdrawal(wd)}>
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#EF4444' }}
                      disabled={isSaving || isDel} onClick={() => deleteWithdrawal(wd)}>
                      {isDel ? 'Deleting…' : 'Delete'}
                    </button>
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#065F46' : '#991B1B' }}>{m.text}</p>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No withdrawal requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Broadcast Email Tab ──────────────────────────────────────────────────────
function BroadcastTab({ secret, userCount }) {
  const [subject, setSubject] = useState(BROADCAST_DEFAULT_SUBJECT);
  const [body,    setBody]    = useState(BROADCAST_DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null);

  async function send(test) {
    if (!body.trim() || !subject.trim()) {
      setResult({ ok: false, text: 'Subject and message cannot be empty.' });
      return;
    }
    if (!test && !confirm(`Send this email to ALL ${userCount} client(s) in the database? This cannot be undone.`)) {
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const r = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminSecret: secret, subject, body, test }),
      });
      const data = await r.json();
      if (data.success) {
        setResult({
          ok: true,
          text: test
            ? `Test email sent to your own inbox (${data.sent} sent).`
            : `Done — ${data.sent} sent, ${data.failed} failed out of ${data.total} client(s).`,
        });
      } else {
        setResult({ ok: false, text: data.message || 'Failed to send.' });
      }
    } catch (err) {
      setResult({ ok: false, text: err.message || 'Network error.' });
    }
    setSending(false);
  }

  return (
    <div style={{ padding: '20px 32px', maxWidth: 720 }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#0F766E', marginBottom: 4 }}>
          📣 Email All Clients
        </div>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
          This sends the message below to every registered client&apos;s email address ({userCount} on file). Use “Send test to myself” first to preview it.
        </p>

        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Subject</label>
        <input style={{ ...styles.input, marginBottom: 16 }} value={subject} onChange={e => setSubject(e.target.value)} />

        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Message</label>
        <textarea
          style={{ ...styles.input, minHeight: 260, resize: 'vertical', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6 }}
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            style={{ ...styles.btn, background: '#64748B', flex: 1 }}
            disabled={sending}
            onClick={() => send(true)}
          >
            {sending ? 'Sending…' : '✉️ Send test to myself'}
          </button>
          <button
            style={{ ...styles.btn, flex: 2 }}
            disabled={sending}
            onClick={() => send(false)}
          >
            {sending ? 'Sending…' : `📣 Send to all ${userCount} client(s)`}
          </button>
        </div>

        {result && (
          <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: result.ok ? '#065F46' : '#991B1B' }}>
            {result.text}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Clean Invalid Emails Tab ─────────────────────────────────────────────────
function CleanupTab({ secret, onRefresh }) {
  const [text,   setText]   = useState('');
  const [busy,   setBusy]   = useState(false);
  const [result, setResult] = useState(null);

  // Parse whatever is pasted (commas, spaces, or newlines) into unique valid emails
  const emails = Array.from(new Set(
    text.split(/[\s,;]+/).map(s => s.trim().toLowerCase())
      .filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
  ));

  async function run() {
    if (!emails.length) { setResult({ ok: false, text: 'No valid email addresses found in the box.' }); return; }
    if (!confirm(`Permanently delete ${emails.length} email account(s) from the database?\n\nThis cannot be undone.`)) return;
    setBusy(true);
    setResult(null);
    const r = await dbProxy('adminDeleteUsersByEmail', { adminSecret: secret, emails });
    setBusy(false);
    if (r.success) {
      setResult({ ok: true, deleted: r.deleted, notFound: r.notFound || [], deletedEmails: r.deletedEmails || [] });
      if (r.deleted > 0) { setText(''); await onRefresh?.(); }
    } else {
      setResult({ ok: false, text: r.error || 'Delete failed.' });
    }
  }

  return (
    <div style={{ padding: '20px 32px', maxWidth: 720 }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#991B1B', marginBottom: 4 }}>
          🧹 Remove Invalid / Bounced Emails
        </div>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>
          Paste the addresses that bounced (the ones your “Mail Delivery Subsystem” failure notices list). One per line, or separated by commas — mixed text is fine, only valid email addresses are picked up.
        </p>
        <p style={{ fontSize: 12.5, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
          ⚠️ This <strong>permanently deletes</strong> the matching accounts. It only removes <strong>exact</strong> address matches, so double-check before deleting.
        </p>

        <textarea
          style={{ ...styles.input, minHeight: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 }}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'ghost123@example.com\nnotreal@fake.com\n...'}
        />
        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>
          <strong>{emails.length}</strong> valid address{emails.length === 1 ? '' : 'es'} detected.
        </div>

        <button
          style={{ ...styles.btn, background: '#991B1B' }}
          disabled={busy || emails.length === 0}
          onClick={run}
        >
          {busy ? 'Deleting…' : `🗑️ Delete ${emails.length} account${emails.length === 1 ? '' : 's'} from database`}
        </button>

        {result && (
          <div style={{ marginTop: 16, fontSize: 14 }}>
            {result.ok ? (
              <>
                <p style={{ fontWeight: 700, color: '#065F46' }}>
                  ✅ Deleted {result.deleted} account{result.deleted === 1 ? '' : 's'}.
                </p>
                {result.notFound.length > 0 && (
                  <p style={{ color: '#92400E', marginTop: 6 }}>
                    {result.notFound.length} address{result.notFound.length === 1 ? ' was' : 'es were'} not in the database (nothing to delete): {result.notFound.join(', ')}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontWeight: 600, color: '#991B1B' }}>{result.text}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [secret,      setSecret]      = useState('');
  const [authed,      setAuthed]      = useState(false);
  const [authErr,     setAuthErr]     = useState('');
  const [users,       setUsers]       = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [tab,         setTab]         = useState('users');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setAuthErr('');
    const [uRes, wRes] = await Promise.all([
      dbProxy('listUsers',             { adminSecret: secret }),
      dbProxy('adminListWithdrawals',  { adminSecret: secret }),
    ]);
    setLoading(false);
    if (uRes.error === 'Unauthorized') { setAuthErr('Wrong admin password.'); return; }
    setUsers(uRes.data || []);
    setWithdrawals(wRes.data || []);
    setAuthed(true);
  }

  async function refresh() {
    const [uRes, wRes] = await Promise.all([
      dbProxy('listUsers',            { adminSecret: secret }),
      dbProxy('adminListWithdrawals', { adminSecret: secret }),
    ]);
    if (uRes.data)  setUsers(uRes.data);
    if (wRes.data)  setWithdrawals(wRes.data);
  }

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>BUSINESS HUB</div>
          <p style={styles.loginSub}>Admin Panel</p>
          <form onSubmit={handleLogin}>
            <input style={styles.input} type="password" placeholder="Admin password"
              value={secret} onChange={e => setSecret(e.target.value)} autoFocus />
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
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Admin — Full Database Manager</p>
        </div>
        <button style={{ ...styles.btn, padding: '8px 18px', fontSize: 13, width: 'auto' }} onClick={refresh}>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'users',       label: `👤 Users (${users.length})` },
          { key: 'withdrawals', label: `💸 Withdrawals (${withdrawals.length})` },
          { key: 'broadcast',   label: '📣 Broadcast' },
          { key: 'cleanup',     label: '🧹 Clean Emails' },
        ].map(t => (
          <button key={t.key} style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabBtnActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users'       && <UsersTab       users={users}             secret={secret} onRefresh={refresh} />}
      {tab === 'withdrawals' && <WithdrawalsTab withdrawals={withdrawals} secret={secret} onRefresh={refresh} />}
      {tab === 'broadcast'   && <BroadcastTab   secret={secret} userCount={users.length} />}
      {tab === 'cleanup'     && <CleanupTab     secret={secret} onRefresh={refresh} />}
    </div>
  );
}

const styles = {
  loginWrap: { minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif' },
  loginCard: { background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: 380, textAlign: 'center' },
  logo:      { fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#0F766E', letterSpacing: 1, marginBottom: 4 },
  loginSub:  { fontSize: 13, color: '#64748B', marginBottom: 24 },
  input: {
    display: 'block', width: '100%', padding: '11px 14px',
    border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14,
    fontFamily: 'Manrope, sans-serif', marginBottom: 12,
    background: '#F8FAFC', color: '#111827', boxSizing: 'border-box',
  },
  numInput: {
    padding: '7px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8,
    fontSize: 13, fontFamily: 'Manrope, sans-serif', background: '#F8FAFC', color: '#111827',
  },
  err: { color: '#991B1B', fontSize: 13, marginBottom: 10 },
  btn: {
    display: 'block', width: '100%', padding: '12px',
    background: '#0F766E', color: '#fff', borderRadius: 10,
    fontWeight: 700, fontSize: 15, fontFamily: 'Poppins, sans-serif',
    cursor: 'pointer', border: 'none', transition: 'background 0.2s',
  },
  wrap:      { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Manrope, sans-serif', paddingBottom: 40 },
  header:    { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  tabs:      { display: 'flex', gap: 0, padding: '0 32px', background: '#fff', borderBottom: '2px solid #E2E8F0' },
  tabBtn:    { padding: '14px 24px', fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', borderBottom: '3px solid transparent', marginBottom: -2 },
  tabBtnActive: { color: '#0F766E', borderBottomColor: '#0F766E' },
  searchWrap: { padding: '20px 32px 0', display: 'flex', alignItems: 'center' },
  tableWrap:  { padding: '16px 32px', overflowX: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  th:         { background: '#0F766E', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, padding: '13px 14px', textAlign: 'left', whiteSpace: 'nowrap' },
  tr:         { borderBottom: '1px solid #F1F5F9' },
  td:         { padding: '13px 14px', fontSize: 13, verticalAlign: 'top' },
  badge:      { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  dateRow:    { display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 3 },
  dateLabel:  { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', minWidth: 72 },
  dateVal:    { fontSize: 11, color: '#374151' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard:    { background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 440, overflow: 'hidden' },
};
