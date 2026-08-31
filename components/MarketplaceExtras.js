// components/MarketplaceExtras.js — Phase B UI: Pending Reviews (creator reviews
// submissions to their own tasks) + Notifications.
import { useState, useEffect } from 'react';
import Icon from './Icon';
import { listMyReviewSubmissions, reviewSubmission, markNotificationsRead } from '../lib/auth';

const fmt = ts => { try { return new Date(ts).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };

export function PendingReviewsModal({ onClose, onReviewed }) {
  const [subs, setSubs] = useState(null);
  const [busy, setBusy] = useState({});

  useEffect(() => { (async () => setSubs(await listMyReviewSubmissions()))(); }, []);

  async function act(s, status) {
    let reason = '';
    if (status === 'rejected' || status === 'correction') {
      const r = window.prompt(status === 'rejected' ? 'Reason for rejecting this submission:' : 'What corrections are needed?', '');
      if (r === null) return;           // cancelled
      reason = r;
    } else if (status === 'approved') {
      if (!window.confirm(`Approve and pay KES ${Number(s.reward).toLocaleString()} to ${s.name || 'the worker'}? This releases the escrow you funded.`)) return;
    }
    setBusy(p => ({ ...p, [s.id]: true }));
    const res = await reviewSubmission(s.id, status, reason);
    setBusy(p => ({ ...p, [s.id]: false }));
    if (res?.success) { setSubs(list => list.map(x => x.id === s.id ? { ...x, status, reason } : x)); onReviewed?.(); }
    else alert(res?.error || 'Could not update the submission.');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: '#000' }}>
          <div>
            <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={18} /> Pending Reviews</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Approve to pay from your escrow, or return with a reason</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {subs === null ? (
            <div style={{ textAlign: 'center', padding: '22px 0' }}><span className="spinner" style={{ borderTopColor: '#000', borderColor: '#e5e7eb', width: 26, height: 26 }} /></div>
          ) : subs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray)', padding: '24px 0', fontSize: 14 }}>No submissions to your tasks yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subs.map(s => (
                <div key={s.id} style={{ border: '1px solid var(--gray-light)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{s.taskTitle || 'Task'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{s.name || s.email || 'Worker'} · KES {Number(s.reward).toLocaleString()} · {fmt(s.createdAt)}</div>
                      {s.note ? <div style={{ fontSize: 12.5, color: '#374151', marginTop: 6 }}>{s.note}</div> : null}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#f3f4f6', color: '#374151', whiteSpace: 'nowrap' }}>{s.status}</span>
                  </div>
                  {s.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => act(s, 'approved')} disabled={busy[s.id]} style={{ flex: 1, minWidth: 120, background: 'var(--mpesa-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="check" size={14} /> Approve &amp; Pay</button>
                      <button onClick={() => act(s, 'correction')} disabled={busy[s.id]} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Corrections</button>
                      <button onClick={() => act(s, 'rejected')} disabled={busy[s.id]} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                    </div>
                  )}
                  {s.reason ? <div style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}><strong>Reason:</strong> {s.reason}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationsModal({ notifications, onClose }) {
  useEffect(() => { markNotificationsRead(); }, []);
  const list = Array.isArray(notifications) ? notifications : [];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: '#000' }}>
          <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="bell" size={18} /> Notifications</div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray)', padding: '24px 0', fontSize: 14 }}>You&apos;re all caught up.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(n => (
                <div key={n.id} style={{ border: '1px solid var(--gray-light)', borderRadius: 10, padding: '11px 13px', background: n.read ? '#fff' : '#f9fafb' }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{n.title}</div>
                  {n.body ? <div style={{ fontSize: 12.5, color: '#374151', marginTop: 3, lineHeight: 1.5 }}>{n.body}</div> : null}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{fmt(n.at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


