import { useState, useEffect } from 'react';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const BROADCAST_DEFAULT_SUBJECT = 'Welcome to Gweno Hub';
const BROADCAST_DEFAULT_BODY = `Dear Client,

Welcome to Gweno Hub! We are delighted to have you as part of our community.

We have been working hard to improve our services and address your concerns. We are pleased to introduce a few simple steps that will make it easier for you to manage your Activation Fee and Premium Fee at your convenience.

We also encourage you to carefully complete the available tasks and assessments, as they provide genuine earning opportunities that can help you cover your activation and premium fees.

For your security, we kindly ask you to withdraw your earnings promptly. In line with our policies, Gweno Hub does not hold clients' funds. We operate as a secure bridge between clients and service providers, not as a bank.

Our mission is to create opportunities, empower our community, and give back to society through a reliable and transparent platform.

Thank you for choosing Gweno Hub. We look forward to supporting your success.`;

async function dbProxy(op, params = {}) {
  const r = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...params }),
  });
  return r.json();
}

// Sends the "Task Submission Returned for Corrections" email to one user.
async function sendCorrectionEmail({ secret, taskName, userName, userEmail, userId, reason }) {
  try {
    const r = await fetch('/api/correction-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminSecret: secret, taskName, userName, userEmail, userId, reason }),
    });
    return r.json();
  } catch (e) {
    return { success: false, message: 'Network error sending email.' };
  }
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
  pending:  { bg: '#f3f4f6', color: '#374151' },
  approved: { bg: '#e5e7eb', color: '#1f2937' },
  declined: { bg: '#e5e7eb', color: '#1f2937' },
};

// Flat monochrome icons for the account Hold / Release control.
function HoldIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
      <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function ReleaseIcon({ size = 14 }) {   // play glyph = resume / release
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

// ─── Hold Confirmation Modal ──────────────────────────────────────────────────
// Places an account on hold (or releases it) with a reason shown to the client.
function SuspendModal({ modal, reason, setReason, onConfirm, onCancel }) {
  if (!modal) return null;
  const isHolding = modal.action === 'suspend';
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ background: '#111827', borderRadius: '12px 12px 0 0', padding: '20px 24px', color: '#fff' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isHolding ? <><HoldIcon size={17} /> Hold Account</> : <><ReleaseIcon size={17} /> Release Account</>}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            {modal.user.fullName}, {modal.user.email}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {isHolding ? (
            <>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 14 }}>
                This immediately places the account on hold and blocks the client from signing in until it is released.
              </p>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Reason for hold (shown to client)
              </label>
              <textarea
                style={{ ...styles.input, marginBottom: 0, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="e.g. Verification pending, or violation of terms of service"
                value={reason}
                onChange={e => setReason(e.target.value)}
                autoFocus
              />
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#374151' }}>
              This will release the hold and restore full access to <strong>{modal.user.fullName}</strong>&apos;s account immediately.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ ...styles.btn, background: '#111827', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onConfirm}>
              {isHolding ? <><HoldIcon size={15} /> Place on Hold</> : <><ReleaseIcon size={15} /> Release</>}
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
      mpesaFeesPaid: Number(getEdit(user.id, 'mpesaFeesPaid', user.mpesaFeesPaid ?? 0)),
    };

    // Only send a password when the admin actually typed a new one (write-only
    // reset; stored hashes are never fetched or displayed).
    const newPassword = getEdit(user.id, 'password', '').trim();
    if (newPassword) params.password = newPassword;

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
      setMsg(prev => ({ ...prev, [user.id]: { type: 'ok', text: action === 'suspend' ? 'Account on hold!' : 'Hold released!' } }));
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
                <tr key={user.id} style={{ ...styles.tr, background: isSusp ? '#f9fafb' : undefined }}>

                  {/* Name / Email / Phone */}
                  <td style={styles.td}>
                    {isSusp && <span style={{ ...styles.badge, background: '#111827', color: '#fff', fontSize: 10, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}><HoldIcon size={10} /> ON HOLD</span>}
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
                    <div style={{ fontSize: 11, color: '#64748B', margin: '6px 0 2px' }}>🔑 Reset password</div>
                    <input
                      type="password"
                      autoComplete="new-password"
                      style={{ ...styles.numInput, width: '100%', fontFamily: 'monospace', color: '#111827', fontWeight: 600 }}
                      value={getEdit(user.id, 'password', '')}
                      onChange={e => setEdit(user.id, 'password', e.target.value)}
                      placeholder="Leave blank to keep"
                    />
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Passwords are hashed and can&apos;t be viewed. Type a new one to reset it.</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{user.country || '—'}</div>
                    {isSusp && user.suspendReason && (
                      <div style={{ fontSize: 11, color: '#1f2937', marginTop: 2 }}>Reason: {user.suspendReason}</div>
                    )}
                  </td>

                  {/* Dates */}
                  <td style={{ ...styles.td, minWidth: 180 }}>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Joined</span><span style={styles.dateVal}>{fmtDate(user.createdAt)}</span></div>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Activated</span><span style={styles.dateVal}>{fmtDate(user.activatedAt)}</span></div>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Premium paid</span><span style={styles.dateVal}>{fmtDate(user.premiumPaidAt)}</span></div>
                    {isSusp && <div style={styles.dateRow}><span style={{ ...styles.dateLabel, color: '#1f2937' }}>On hold since</span><span style={styles.dateVal}>{fmtDate(user.suspendedAt)}</span></div>}
                  </td>

                  {/* Balance + verified M-Pesa fee count */}
                  <td style={styles.td}>
                    <input type="number" min="0" style={styles.numInput} value={balVal}
                      onChange={e => setEdit(user.id, 'balance', e.target.value)} />
                    <div style={{ fontSize: 11, color: '#64748B', margin: '10px 0 3px' }}>M-Pesa fees paid (×650)</div>
                    <select
                      style={{ ...styles.numInput, width: 70 }}
                      value={getEdit(user.id, 'mpesaFeesPaid', user.mpesaFeesPaid ?? 0)}
                      title="Verified number of KES 650 M-Pesa fees this client has paid. This is the credit applied on a bank/international withdrawal (KES 650 × count, up to 3 = KES 1,950); the client pays the remaining amount."
                      onChange={e => setEdit(user.id, 'mpesaFeesPaid', e.target.value)}
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>KES 650 × count credited</div>
                  </td>

                  {/* Activation */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ ...styles.badge, background: isAct ? '#e5e7eb' : '#e5e7eb', color: isAct ? '#1f2937' : '#1f2937' }}>
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
                        style={{ width: 16, height: 16, accentColor: '#111827' }} />
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
                    <span style={{ ...styles.badge, background: isSusp ? '#111827' : isAct ? '#e5e7eb' : '#F1F5F9', color: isSusp ? '#fff' : isAct ? '#1f2937' : '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {isSusp ? <><HoldIcon size={11} /> On Hold</> : isAct ? 'Active' : 'Inactive'}
                    </span>
                    {isPrem && !isSusp && (
                      <span style={{ ...styles.badge, background: '#f3f4f6', color: '#1f2937', display: 'block', marginTop: 4 }}>⭐ Premium</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={styles.td}>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%' }}
                      disabled={isSaving} onClick={() => saveUser(user)}>
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#374151', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      disabled={isSaving}
                      onClick={() => { setSuspendReason(''); setSuspendModal({ user, action: isSusp ? 'unsuspend' : 'suspend' }); }}>
                      {isSusp ? <><ReleaseIcon size={13} /> Release</> : <><HoldIcon size={13} /> Hold</>}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#111827' }}
                      disabled={isSaving}
                      onClick={() => deleteUser(user)}>
                      🗑️ Delete
                    </button>
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#1f2937' : '#1f2937' }}>{m.text}</p>}
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
      status:       getEdit(wd.id, 'status',   wd.status),
      amount:       getEdit(wd.id, 'amount',   wd.amount),
      phone:        getEdit(wd.id, 'phone',    wd.phone),
      idNumber:     getEdit(wd.id, 'idNumber', wd.idNumber),
      fullName:     getEdit(wd.id, 'fullName', wd.fullName),
      rejectReason: getEdit(wd.id, 'rejectReason', wd.rejectReason || ''),
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

  async function setStatus(wd, status) {
    const params = { adminSecret: secret, requestId: wd.id, status };
    if (status === 'declined') {
      const reason = prompt(`Reason for rejecting ${wd.fullName || 'this'} withdrawal? (optional)`, wd.rejectReason || '');
      if (reason === null) return;            // cancelled
      params.rejectReason = reason;
    } else if (status === 'approved') {
      params.rejectReason = '';               // clear any old reason on approval
    }
    setSaving(prev => ({ ...prev, [wd.id]: true }));
    const res = await dbProxy('adminUpdateWithdrawal', params);
    setSaving(prev => ({ ...prev, [wd.id]: false }));
    if (res.success) {
      setMsg(prev => ({ ...prev, [wd.id]: { type: 'ok', text: status === 'approved' ? 'Approved!' : 'Rejected!' } }));
      await onRefresh();
    } else {
      setMsg(prev => ({ ...prev, [wd.id]: { type: 'err', text: res.error || 'Failed.' } }));
    }
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[wd.id]; return n; }), 3000);
  }

  async function payout(wd) {
    if (!confirm(`Send KES ${Number(wd.amount).toLocaleString()} to ${wd.phone} via M-Pesa (B2C)?\n\nThis pays out REAL money and cannot be undone.`)) return;
    setSaving(prev => ({ ...prev, [wd.id]: true }));
    const res = await dbProxy('adminPayoutWithdrawal', { adminSecret: secret, requestId: wd.id });
    setSaving(prev => ({ ...prev, [wd.id]: false }));
    if (res.success) {
      setMsg(prev => ({ ...prev, [wd.id]: { type: 'ok', text: '💸 Payout queued via M-Pesa.' } }));
      await onRefresh();
    } else {
      setMsg(prev => ({ ...prev, [wd.id]: { type: 'err', text: res.error || 'Payout failed.' } }));
    }
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[wd.id]; return n; }), 4000);
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
                    <textarea
                      style={{ ...styles.numInput, width: 130, marginTop: 6, minHeight: 42, resize: 'vertical', fontSize: 12 }}
                      value={getEdit(wd.id, 'rejectReason', wd.rejectReason || '')}
                      onChange={e => setEdit(wd.id, 'rejectReason', e.target.value)}
                      placeholder="Reason for rejection"
                    />
                  </td>

                  {/* Dates */}
                  <td style={{ ...styles.td, minWidth: 160 }}>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Requested</span><span style={styles.dateVal}>{fmtDate(wd.requestedAt)}</span></div>
                    <div style={styles.dateRow}><span style={styles.dateLabel}>Updated</span><span style={styles.dateVal}>{fmtDate(wd.updatedAt)}</span></div>
                    {wd.deadline && <div style={styles.dateRow}><span style={styles.dateLabel}>Deadline</span><span style={styles.dateVal}>{fmtDate(wd.deadline)}</span></div>}
                  </td>

                  {/* Actions */}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...styles.btn, padding: '7px 10px', fontSize: 12, flex: 1, background: '#374151' }}
                        disabled={isSaving || isDel} onClick={() => setStatus(wd, 'approved')}>
                        ✅ Approve
                      </button>
                      <button style={{ ...styles.btn, padding: '7px 10px', fontSize: 12, flex: 1, background: '#374151' }}
                        disabled={isSaving || isDel} onClick={() => setStatus(wd, 'declined')}>
                        ❌ Reject
                      </button>
                    </div>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#065F46' }}
                      disabled={isSaving || isDel || wd.status === 'paid' || wd.status === 'processing'} onClick={() => payout(wd)}
                      title="Send the money now via Safaricom M-Pesa B2C">
                      {wd.status === 'paid' ? '✅ Paid' : wd.status === 'processing' ? '⏳ Processing…' : '💸 Pay via M-Pesa'}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6 }}
                      disabled={isSaving || isDel} onClick={() => saveWithdrawal(wd)}>
                      {isSaving ? 'Saving…' : 'Save edits'}
                    </button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#4b5563' }}
                      disabled={isSaving || isDel} onClick={() => deleteWithdrawal(wd)}>
                      {isDel ? 'Deleting…' : 'Delete'}
                    </button>
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#1f2937' : '#1f2937' }}>{m.text}</p>}
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
            : `Done, ${data.sent} sent, ${data.failed} failed out of ${data.total} client(s).`,
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
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 4 }}>
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
          <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: result.ok ? '#1f2937' : '#1f2937' }}>
            {result.text}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Task Management Tab ──────────────────────────────────────────────────────
const TASK_CATEGORIES = ['Writing','Research','Data Entry','Design','Marketing','Transcription','Translation','Survey','Testing','Audio','Education','Admin','General'];

function TasksTab({ secret }) {
  const [tasks,   setTasks]   = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [err,     setErr]     = useState('');
  const [edits,   setEdits]   = useState({});
  const [saving,  setSaving]  = useState({});
  const [msg,     setMsg]     = useState({});
  const [creating, setCreating] = useState(false);
  const [nt, setNt] = useState({ title: '', category: 'Writing', payment: '', slots: '', description: '' });

  async function load() {
    const res = await dbProxy('adminListTasks', { adminSecret: secret });
    setLoaded(true);
    if (res.error) { setErr(res.error); setTasks([]); return; }
    setErr(''); setTasks(res.data || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function setEdit(id, f, v) { setEdits(p => ({ ...p, [id]: { ...(p[id] || {}), [f]: v } })); }
  function getEdit(id, f, fb) { const e = edits[id]; return e && f in e ? e[f] : fb; }
  function flash(id, m) { setMsg(p => ({ ...p, [id]: m })); setTimeout(() => setMsg(p => { const n = { ...p }; delete n[id]; return n; }), 3000); }

  async function createTask() {
    if (!nt.title.trim()) { flash('_new', { type: 'err', text: 'Title is required.' }); return; }
    setCreating(true);
    const res = await dbProxy('adminCreateTask', {
      adminSecret: secret, title: nt.title, category: nt.category,
      payment: Number(nt.payment) || 0, slots: Number(nt.slots) || 0, description: nt.description,
    });
    setCreating(false);
    if (res.success) { setNt({ title: '', category: 'Writing', payment: '', slots: '', description: '' }); await load(); flash('_new', { type: 'ok', text: 'Task created!' }); }
    else flash('_new', { type: 'err', text: res.error || 'Failed.' });
  }

  async function saveTask(t) {
    setSaving(p => ({ ...p, [t.id]: true }));
    const res = await dbProxy('adminUpdateTask', {
      adminSecret: secret, taskId: t.id,
      title:       getEdit(t.id, 'title', t.title),
      category:    getEdit(t.id, 'category', t.category),
      description: getEdit(t.id, 'description', t.description),
      payment:     Number(getEdit(t.id, 'payment', t.payment)),
      slots:       Number(getEdit(t.id, 'slots', t.slots)),
      active:      getEdit(t.id, 'active', t.active),
    });
    setSaving(p => ({ ...p, [t.id]: false }));
    if (res.success) { setEdits(p => { const n = { ...p }; delete n[t.id]; return n; }); await load(); flash(t.id, { type: 'ok', text: 'Saved!' }); }
    else flash(t.id, { type: 'err', text: res.error || 'Failed.' });
  }

  async function deleteTask(t) {
    if (!confirm(`Delete task "${t.title}"? This removes it from the dashboard.`)) return;
    setSaving(p => ({ ...p, [t.id]: true }));
    await dbProxy('adminDeleteTask', { adminSecret: secret, taskId: t.id });
    setSaving(p => ({ ...p, [t.id]: false }));
    await load();
  }

  async function launchOffers() {
    if (!confirm('Launch a fresh batch of 15 OFFER tasks (KES 2,000 to 4,200)?\n\nNo premium needed, one submission each, and they run for 9 hours. This replaces any current offer batch and restarts the 9-hour window.')) return;
    setCreating(true);
    const res = await dbProxy('adminSeedOfferTasks', { adminSecret: secret });
    setCreating(false);
    if (res.success) { await load(); flash('_new', { type: 'ok', text: `Launched ${res.inserted} offer tasks!` }); }
    else flash('_new', { type: 'err', text: res.error || 'Failed.' });
  }

  const nm = msg._new;

  return (
    <div style={{ padding: '20px 32px' }}>
      {/* Offer launcher */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 20, maxWidth: 820, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#374151' }}>🔥 Limited-time Offer Tasks</div>
          <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 2 }}>15 tasks · KES 2,000 to 4,200 · no premium needed · one submission each · 9-hour window.</div>
        </div>
        <button style={{ ...styles.btn, background: '#4b5563', width: 'auto', padding: '10px 18px', fontSize: 14, whiteSpace: 'nowrap' }} disabled={creating} onClick={launchOffers}>
          {creating ? 'Working…' : 'Launch 15 Offer Tasks'}
        </button>
      </div>

      {/* Create form */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, marginBottom: 20, maxWidth: 820 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 14 }}>➕ Create Task</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.fieldLabel}>Title</label>
            <input style={{ ...styles.input, margin: 0 }} value={nt.title} onChange={e => setNt({ ...nt, title: e.target.value })} placeholder="e.g. Write 5 product descriptions" />
          </div>
          <div>
            <label style={styles.fieldLabel}>Category</label>
            <select style={{ ...styles.input, margin: 0 }} value={nt.category} onChange={e => setNt({ ...nt, category: e.target.value })}>
              {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={styles.fieldLabel}>Reward (KES)</label>
              <input type="number" min="0" style={{ ...styles.input, margin: 0 }} value={nt.payment} onChange={e => setNt({ ...nt, payment: e.target.value })} placeholder="1500" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.fieldLabel}>Limit (0 = ∞)</label>
              <input type="number" min="0" style={{ ...styles.input, margin: 0 }} value={nt.slots} onChange={e => setNt({ ...nt, slots: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.fieldLabel}>Description</label>
            <textarea style={{ ...styles.input, margin: 0, minHeight: 90, resize: 'vertical' }} value={nt.description} onChange={e => setNt({ ...nt, description: e.target.value })} placeholder="What should the worker do?" />
          </div>
        </div>
        <button style={{ ...styles.btn, marginTop: 14, maxWidth: 220 }} disabled={creating} onClick={createTask}>
          {creating ? 'Creating…' : '➕ Create Task'}
        </button>
        {nm && <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 600, color: nm.type === 'ok' ? '#1f2937' : '#1f2937' }}>{nm.text}</span>}
      </div>

      {err && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#1f2937', fontSize: 13, maxWidth: 820 }}>
          ⚠️ Could not load tasks: <strong>{err}</strong>. If this mentions a missing table, run the one-time SQL in <code>db/admin-tables.sql</code> in your Supabase SQL editor.
        </div>
      )}

      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
        {loaded ? `${tasks.length} custom task${tasks.length === 1 ? '' : 's'}` : 'Loading…'} · the built-in starter tasks live in code and aren&apos;t listed here.
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>{['Title / Description', 'Category', 'Reward (KES)', 'Limit / Claimed', 'Live?', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {tasks.map(t => {
              const m = msg[t.id]; const busy = saving[t.id];
              return (
                <tr key={t.id} style={styles.tr}>
                  <td style={{ ...styles.td, minWidth: 240 }}>
                    <input style={{ ...styles.numInput, width: '100%', marginBottom: 6 }} value={getEdit(t.id, 'title', t.title)} onChange={e => setEdit(t.id, 'title', e.target.value)} />
                    <textarea style={{ ...styles.numInput, width: '100%', minHeight: 54, resize: 'vertical' }} value={getEdit(t.id, 'description', t.description)} onChange={e => setEdit(t.id, 'description', e.target.value)} />
                  </td>
                  <td style={styles.td}>
                    <select style={{ ...styles.numInput, width: 120 }} value={getEdit(t.id, 'category', t.category)} onChange={e => setEdit(t.id, 'category', e.target.value)}>
                      {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={styles.td}>
                    <input type="number" min="0" style={{ ...styles.numInput, width: 90 }} value={getEdit(t.id, 'payment', t.payment)} onChange={e => setEdit(t.id, 'payment', e.target.value)} />
                  </td>
                  <td style={styles.td}>
                    <input type="number" min="0" style={{ ...styles.numInput, width: 70 }} value={getEdit(t.id, 'slots', t.slots)} onChange={e => setEdit(t.id, 'slots', e.target.value)} title="0 = unlimited" />
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{t.claimed || 0} claimed</div>
                  </td>
                  <td style={styles.td}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={getEdit(t.id, 'active', t.active)} onChange={e => setEdit(t.id, 'active', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#111827' }} />
                      <span style={{ fontSize: 12 }}>{getEdit(t.id, 'active', t.active) ? 'On' : 'Off'}</span>
                    </label>
                  </td>
                  <td style={styles.td}>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%' }} disabled={busy} onClick={() => saveTask(t)}>{busy ? 'Saving…' : 'Save'}</button>
                    <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 12, width: '100%', marginTop: 6, background: '#111827' }} disabled={busy} onClick={() => deleteTask(t)}>🗑️ Delete</button>
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#1f2937' : '#1f2937' }}>{m.text}</p>}
                  </td>
                </tr>
              );
            })}
            {loaded && tasks.length === 0 && !err && (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No custom tasks yet, create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Submitted-Task Review Tab ────────────────────────────────────────────────
const SUB_COLORS = { pending: { bg: '#f3f4f6', color: '#374151' }, approved: { bg: '#e5e7eb', color: '#1f2937' }, rejected: { bg: '#e5e7eb', color: '#1f2937' }, correction: { bg: '#e5e7eb', color: '#374151' } };

function SubmissionsTab({ secret }) {
  const [subs,   setSubs]   = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr]    = useState('');
  const [busy,   setBusy]   = useState({});
  const [msg,    setMsg]    = useState({});
  const [correcting, setCorrecting] = useState(null);
  const [reason, setReason] = useState('');

  async function load() {
    const res = await dbProxy('adminListSubmissions', { adminSecret: secret });
    setLoaded(true);
    if (res.error) { setErr(res.error); setSubs([]); return; }
    setErr(''); setSubs(res.data || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function flash(id, m) { setMsg(p => ({ ...p, [id]: m })); setTimeout(() => setMsg(p => { const n = { ...p }; delete n[id]; return n; }), 4000); }

  async function act(s, status) {
    if (status === 'approved' && !confirm(`Approve this submission and credit KES ${Number(s.reward).toLocaleString()} to ${s.name || s.email || 'the user'}?`)) return;
    setBusy(p => ({ ...p, [s.id]: true }));
    const res = await dbProxy('adminUpdateSubmission', { adminSecret: secret, submissionId: s.id, status });
    setBusy(p => ({ ...p, [s.id]: false }));
    await load();
    // On approval, surface the auto-sent confirmation email's delivery status.
    if (status === 'approved' && res?.email) {
      if (res.email.sent) flash(s.id, { type: 'ok', text: '✅ Approved, confirmation email sent.' });
      else flash(s.id, { type: 'err', text: `Approved & credited, but email ${String(res.email.status || 'failed').toLowerCase()}. Use “Resend”.` });
    } else if (status === 'approved') {
      flash(s.id, { type: 'ok', text: '✅ Approved & credited.' });
    }
  }

  async function resendApproval(s) {
    setBusy(p => ({ ...p, [s.id]: true }));
    const res = await dbProxy('adminResendApprovalEmail', { adminSecret: secret, submissionId: s.id });
    setBusy(p => ({ ...p, [s.id]: false }));
    if (res.success) flash(s.id, { type: 'ok', text: '✉️ Approval email resent.' });
    else flash(s.id, { type: 'err', text: res.error || res.message || 'Resend failed.' });
  }

  function openCorrection(s) { setCorrecting(s.id); setReason(s.reason || ''); setMsg(p => { const n = { ...p }; delete n[s.id]; return n; }); }

  async function sendCorrection(s) {
    setBusy(p => ({ ...p, [s.id]: true }));
    const mail = await sendCorrectionEmail({ secret, taskName: s.taskTitle, userName: s.name, userEmail: s.email, userId: s.userId, reason });
    await dbProxy('adminUpdateSubmission', { adminSecret: secret, submissionId: s.id, status: 'correction', reason });
    setBusy(p => ({ ...p, [s.id]: false }));
    setCorrecting(null);
    await load();
    if (mail.success) flash(s.id, { type: 'ok', text: '✉️ Correction email sent.' });
    else flash(s.id, { type: 'err', text: mail.message || (mail.unsubscribed ? 'User unsubscribed.' : 'Email not sent (status still updated).') });
  }

  return (
    <div style={{ padding: '20px 32px' }}>
      {err && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#1f2937', fontSize: 13, maxWidth: 820 }}>
          ⚠️ Could not load submissions: <strong>{err}</strong>. If this mentions a missing table, run the one-time SQL in <code>db/admin-tables.sql</code> in your Supabase SQL editor.
        </div>
      )}
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
        {loaded ? `${subs.length} submission${subs.length === 1 ? '' : 's'}` : 'Loading…'} · approving a task credits its reward to the user&apos;s balance. Use ✉️ Corrections to return work for fixes.
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>{['Worker', 'Task', 'Reward (KES)', 'Note', 'Submitted', 'Status', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {subs.map(s => {
              const sc = SUB_COLORS[s.status] || SUB_COLORS.pending; const b = busy[s.id]; const m = msg[s.id];
              return (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name || '—'}</div><div style={{ fontSize: 11, color: '#64748B' }}>{s.email || '—'}</div></td>
                  <td style={{ ...styles.td, maxWidth: 220 }}>{s.taskTitle || '—'}</td>
                  <td style={styles.td}><strong style={{ color: '#374151' }}>{Number(s.reward).toLocaleString()}</strong></td>
                  <td style={{ ...styles.td, maxWidth: 200, fontSize: 12, color: '#475569' }}>{s.note || '—'}{s.reason ? <div style={{ marginTop: 4, color: '#374151' }}><strong>Correction:</strong> {s.reason}</div> : null}</td>
                  <td style={styles.td}>{fmtDate(s.createdAt ? new Date(s.createdAt).getTime() : null)}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>{s.status}</span></td>
                  <td style={{ ...styles.td, minWidth: 210 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={{ ...styles.btn, padding: '7px 10px', fontSize: 12, width: 'auto', background: '#374151' }} disabled={b || s.status === 'approved'} onClick={() => act(s, 'approved')}>✅ Approve</button>
                      <button style={{ ...styles.btn, padding: '7px 10px', fontSize: 12, width: 'auto', background: '#374151' }} disabled={b || s.status === 'rejected'} onClick={() => act(s, 'rejected')}>❌ Reject</button>
                      <button style={{ ...styles.btn, padding: '7px 10px', fontSize: 12, width: 'auto', background: '#4b5563' }} disabled={b} onClick={() => openCorrection(s)}>✉️ Corrections</button>
                      {s.status === 'approved' && (
                        <button style={{ ...styles.btn, padding: '7px 10px', fontSize: 12, width: 'auto', background: '#111827' }} disabled={b} onClick={() => resendApproval(s)} title="Resend the approval & earnings-credited email">✉️ Resend approval</button>
                      )}
                    </div>
                    {correcting === s.id && (
                      <div style={{ marginTop: 8, background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Reason for correction (editable)</div>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                          placeholder="Explain what needs to be corrected…"
                          style={{ ...styles.input, marginBottom: 8, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#4b5563' }} disabled={b} onClick={() => sendCorrection(s)}>Send Email</button>
                          <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#94A3B8' }} onClick={() => setCorrecting(null)}>Cancel</button>
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>Task name is inserted automatically. Sends to {s.email || 'the user'}.</div>
                      </div>
                    )}
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#1f2937' : '#1f2937' }}>{m.text}</p>}
                  </td>
                </tr>
              );
            })}
            {loaded && subs.length === 0 && !err && (
              <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
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
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#1f2937', marginBottom: 4 }}>
          🧹 Remove Invalid / Bounced Emails
        </div>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>
          Paste the addresses that bounced (the ones your “Mail Delivery Subsystem” failure notices list). One per line, or separated by commas, mixed text is fine, only valid email addresses are picked up.
        </p>
        <p style={{ fontSize: 12.5, color: '#1f2937', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
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
          style={{ ...styles.btn, background: '#1f2937' }}
          disabled={busy || emails.length === 0}
          onClick={run}
        >
          {busy ? 'Deleting…' : `🗑️ Delete ${emails.length} account${emails.length === 1 ? '' : 's'} from database`}
        </button>

        {result && (
          <div style={{ marginTop: 16, fontSize: 14 }}>
            {result.ok ? (
              <>
                <p style={{ fontWeight: 700, color: '#1f2937' }}>
                  ✅ Deleted {result.deleted} account{result.deleted === 1 ? '' : 's'}.
                </p>
                {result.notFound.length > 0 && (
                  <p style={{ color: '#374151', marginTop: 6 }}>
                    {result.notFound.length} address{result.notFound.length === 1 ? ' was' : 'es were'} not in the database (nothing to delete): {result.notFound.join(', ')}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontWeight: 600, color: '#1f2937' }}>{result.text}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Applications (Proposals) Tab ────────────────────────────────────────
const APP_COLORS = {
  pending:    { bg: '#f3f4f6', color: '#374151' },
  approved:   { bg: '#e5e7eb', color: '#1f2937' },
  rejected:   { bg: '#e5e7eb', color: '#1f2937' },
  correction: { bg: '#e5e7eb', color: '#374151' },
};

function ApplicationsTab({ secret }) {
  const [apps,    setApps]    = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [err,     setErr]     = useState('');
  const [busy,    setBusy]    = useState({});
  const [msg,     setMsg]     = useState({});
  const [filter,  setFilter]  = useState('all');
  const [correcting, setCorrecting] = useState(null);  // application id whose correction box is open
  const [reason,  setReason]  = useState('');

  async function load() {
    const res = await dbProxy('adminListApplications', { adminSecret: secret });
    setLoaded(true);
    if (res.error) { setErr(res.error); setApps([]); return; }
    setErr(''); setApps(res.data || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function flash(id, m) { setMsg(p => ({ ...p, [id]: m })); setTimeout(() => setMsg(p => { const n = { ...p }; delete n[id]; return n; }), 4000); }

  async function setStatus(a, status) {
    if (status === 'approved' && !confirm(`Approve ${a.name || a.email || 'this applicant'}'s proposal for "${a.taskTitle}"? This unlocks the task for them.`)) return;
    let rejectReason = '';
    if (status === 'rejected') {
      rejectReason = prompt(`Reason for rejecting this application? (optional, shown to the user)`, a.reason || '') || '';
    }
    setBusy(p => ({ ...p, [a.id]: true }));
    const res = await dbProxy('adminUpdateApplication', { adminSecret: secret, applicationId: a.id, status, reason: rejectReason });
    setBusy(p => ({ ...p, [a.id]: false }));
    if (res.success) { await load(); flash(a.id, { type: 'ok', text: status === 'approved' ? 'Approved, task unlocked.' : 'Updated.' }); }
    else flash(a.id, { type: 'err', text: res.error || 'Failed.' });
  }

  function openCorrection(a) {
    setCorrecting(a.id);
    setReason(a.reason || '');
    setMsg(p => { const n = { ...p }; delete n[a.id]; return n; });
  }

  async function sendCorrection(a) {
    setBusy(p => ({ ...p, [a.id]: true }));
    // 1) email the user   2) mark the application "correction" (+ audit log)
    const mail = await sendCorrectionEmail({ secret, taskName: a.taskTitle, userName: a.name, userEmail: a.email, userId: a.userId, reason });
    await dbProxy('adminUpdateApplication', { adminSecret: secret, applicationId: a.id, status: 'correction', reason });
    setBusy(p => ({ ...p, [a.id]: false }));
    setCorrecting(null);
    await load();
    if (mail.success) flash(a.id, { type: 'ok', text: '✉️ Correction email sent.' });
    else flash(a.id, { type: 'err', text: mail.message || (mail.unsubscribed ? 'User unsubscribed.' : 'Email not sent (status still updated).') });
  }

  const counts = apps.reduce((m, a) => { m[a.status] = (m[a.status] || 0) + 1; return m; }, {});
  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  return (
    <div style={{ padding: '20px 32px' }}>
      {err && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#1f2937', fontSize: 13, maxWidth: 820 }}>
          ⚠️ Could not load applications: <strong>{err}</strong>. If this mentions a missing table, run the one-time SQL in <code>db/admin-tables.sql</code> in your Supabase SQL editor.
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['correction', 'Correction'], ['rejected', 'Rejected']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: '7px 14px', borderRadius: 999, border: '1.5px solid ' + (filter === k ? '#111827' : '#E2E8F0'),
              background: filter === k ? '#111827' : '#fff', color: filter === k ? '#fff' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {label}{k !== 'all' && counts[k] ? ` (${counts[k]})` : ''}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
        {loaded ? `${filtered.length} application${filtered.length === 1 ? '' : 's'}` : 'Loading…'} · approving a proposal unlocks the task for the applicant.
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>{['Applicant', 'Task', 'Proposal', 'Submitted', 'Status', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(a => {
              const sc = APP_COLORS[a.status] || APP_COLORS.pending; const b = busy[a.id]; const m = msg[a.id];
              return (
                <tr key={a.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{a.email || '—'}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>ID: {a.userId || '—'}</div>
                  </td>
                  <td style={{ ...styles.td, maxWidth: 200 }}>{a.taskTitle || '—'}</td>
                  <td style={{ ...styles.td, maxWidth: 320, fontSize: 12.5, color: '#334155' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{a.message || '—'}</div>
                    {a.extra ? <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #E2E8F0', color: '#64748B' }}><strong>Extra:</strong> {a.extra}</div> : null}
                    {a.reason ? <div style={{ marginTop: 6, color: '#374151' }}><strong>Reason:</strong> {a.reason}</div> : null}
                  </td>
                  <td style={styles.td}>{fmtDate(a.createdAt ? new Date(a.createdAt).getTime() : null)}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>{a.status}</span></td>
                  <td style={{ ...styles.td, minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#374151' }} disabled={b || a.status === 'approved'} onClick={() => setStatus(a, 'approved')}>✅ Approve</button>
                      <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#374151' }} disabled={b || a.status === 'rejected'} onClick={() => setStatus(a, 'rejected')}>❌ Reject</button>
                      <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#4b5563' }} disabled={b} onClick={() => openCorrection(a)}>✉️ Corrections</button>
                    </div>
                    {correcting === a.id && (
                      <div style={{ marginTop: 8, background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Reason for correction (editable)</div>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                          placeholder="Explain what needs to be corrected…"
                          style={{ ...styles.input, marginBottom: 8, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#4b5563' }} disabled={b} onClick={() => sendCorrection(a)}>Send Email</button>
                          <button style={{ ...styles.btn, padding: '6px 10px', fontSize: 12, width: 'auto', background: '#94A3B8' }} onClick={() => setCorrecting(null)}>Cancel</button>
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>Task name is inserted automatically. Sends to {a.email || 'the user'}.</div>
                      </div>
                    )}
                    {m && <p style={{ marginTop: 6, fontSize: 12, color: m.type === 'ok' ? '#1f2937' : '#1f2937' }}>{m.text}</p>}
                  </td>
                </tr>
              );
            })}
            {loaded && filtered.length === 0 && !err && (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No applications{filter === 'all' ? ' yet' : ` with status "${filter}"`}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
function AuditTab({ secret }) {
  const [rows,   setRows]   = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr]    = useState('');

  async function load() {
    const res = await dbProxy('adminListActions', { adminSecret: secret });
    setLoaded(true);
    if (res.error) { setErr(res.error); setRows([]); return; }
    setErr(''); setRows(res.data || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div style={{ padding: '20px 32px' }}>
      {err && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#1f2937', fontSize: 13, maxWidth: 820 }}>
          ⚠️ Could not load the audit log: <strong>{err}</strong>. If this mentions a missing table, run the one-time SQL in <code>db/admin-tables.sql</code>.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: '#64748B' }}>{loaded ? `${rows.length} recent action${rows.length === 1 ? '' : 's'}` : 'Loading…'} · newest first.</div>
        <button style={{ ...styles.btn, padding: '7px 14px', fontSize: 13, width: 'auto' }} onClick={load}>Refresh</button>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>{['When', 'Action', 'Entity', 'Detail'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={styles.tr}>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt ? new Date(r.createdAt).getTime() : null)}</td>
                <td style={styles.td}><span style={{ ...styles.badge, background: '#f3f4f6', color: '#1f2937' }}>{r.action}</span></td>
                <td style={styles.td}>{r.entity}{r.entityId ? ` #${r.entityId}` : ''}</td>
                <td style={{ ...styles.td, maxWidth: 420, fontSize: 12.5, color: '#475569' }}>{r.detail || '—'}</td>
              </tr>
            ))}
            {loaded && rows.length === 0 && !err && (
              <tr><td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No admin actions logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payment Settings (M-Pesa Buy Goods till) ─────────────────────────────────
function TillSettingsBar({ secret }) {
  const [till,   setTill]   = useState('');
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  useEffect(() => {
    dbProxy('getSettings').then(d => setTill(String(d?.till ?? '1545320'))).catch(() => setTill('1545320'));
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    const res = await dbProxy('adminSetSetting', { adminSecret: secret, key: 'mpesa_till', value: till });
    setSaving(false);
    setMsg(res?.success ? { ok: true, text: 'Till saved!' } : { ok: false, text: res?.error || 'Save failed.' });
    setTimeout(() => setMsg(null), 6000);
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap' }}>
        M-Pesa Buy Goods Till
      </div>
      <input
        style={{ ...styles.numInput, width: 150, fontSize: 15, letterSpacing: 1, fontWeight: 700 }}
        value={till}
        inputMode="numeric"
        onChange={e => setTill(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
        placeholder="1545320"
      />
      <button style={{ ...styles.btn, width: 'auto', padding: '8px 18px', fontSize: 13 }} disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save Till'}
      </button>
      <span style={{ fontSize: 12.5, color: '#64748B', flex: 1, minWidth: 200 }}>
        Used for Premium &amp; withdrawal-fee payments — clients pay this till, then notify support.
      </span>
      {msg && <span style={{ fontSize: 13, fontWeight: 700, color: msg.ok ? '#166534' : '#b91c1c' }}>{msg.text}</span>}
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
          <div style={styles.logo}>GWENO HUB</div>
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
          <div style={styles.logo}>GWENO HUB</div>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Admin, Full Database Manager</p>
        </div>
        <button style={{ ...styles.btn, padding: '8px 18px', fontSize: 13, width: 'auto' }} onClick={refresh}>
          Refresh
        </button>
      </div>

      <TillSettingsBar secret={secret} />

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'users',        label: `👤 Users (${users.length})` },
          { key: 'withdrawals',  label: `💸 Withdrawals (${withdrawals.length})` },
          { key: 'tasks',        label: '📋 Tasks' },
          { key: 'applications', label: '📝 Applications' },
          { key: 'submissions',  label: '📥 Submissions' },
          { key: 'audit',        label: '🧾 Audit Log' },
          { key: 'broadcast',    label: '📣 Broadcast' },
          { key: 'cleanup',      label: '🧹 Clean Emails' },
        ].map(t => (
          <button key={t.key} style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabBtnActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users'        && <UsersTab        users={users}             secret={secret} onRefresh={refresh} />}
      {tab === 'withdrawals'  && <WithdrawalsTab  withdrawals={withdrawals} secret={secret} onRefresh={refresh} />}
      {tab === 'tasks'        && <TasksTab        secret={secret} />}
      {tab === 'applications' && <ApplicationsTab secret={secret} />}
      {tab === 'submissions'  && <SubmissionsTab  secret={secret} />}
      {tab === 'audit'        && <AuditTab        secret={secret} />}
      {tab === 'broadcast'    && <BroadcastTab    secret={secret} userCount={users.length} />}
      {tab === 'cleanup'      && <CleanupTab      secret={secret} onRefresh={refresh} />}
    </div>
  );
}

const styles = {
  loginWrap: { minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif' },
  loginCard: { background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: 380, textAlign: 'center' },
  logo:      { fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#111827', letterSpacing: 1, marginBottom: 4 },
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
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 },
  err: { color: '#1f2937', fontSize: 13, marginBottom: 10 },
  btn: {
    display: 'block', width: '100%', padding: '12px',
    background: '#111827', color: '#fff', borderRadius: 10,
    fontWeight: 700, fontSize: 15, fontFamily: 'Poppins, sans-serif',
    cursor: 'pointer', border: 'none', transition: 'background 0.2s',
  },
  wrap:      { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Manrope, sans-serif', paddingBottom: 40 },
  header:    { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  tabs:      { display: 'flex', gap: 0, padding: '0 32px', background: '#fff', borderBottom: '2px solid #E2E8F0' },
  tabBtn:    { padding: '14px 24px', fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', borderBottom: '3px solid transparent', marginBottom: -2 },
  tabBtnActive: { color: '#111827', borderBottomColor: '#111827' },
  searchWrap: { padding: '20px 32px 0', display: 'flex', alignItems: 'center' },
  tableWrap:  { padding: '16px 32px', overflowX: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  th:         { background: '#111827', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, padding: '13px 14px', textAlign: 'left', whiteSpace: 'nowrap' },
  tr:         { borderBottom: '1px solid #F1F5F9' },
  td:         { padding: '13px 14px', fontSize: 13, verticalAlign: 'top' },
  badge:      { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  dateRow:    { display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 3 },
  dateLabel:  { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', minWidth: 72 },
  dateVal:    { fontSize: 11, color: '#374151' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard:    { background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 440, overflow: 'hidden' },
};
