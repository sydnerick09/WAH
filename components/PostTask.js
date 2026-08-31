// components/PostTask.js — marketplace (Phase A): Post a Task + My Posted Tasks.
import { useState, useEffect } from 'react';
import Icon from './Icon';
import { postUserTask, listMyPostedTasks, deleteMyTask } from '../lib/auth';

const CATEGORIES = ['Writing', 'Research', 'Data Entry', 'Design', 'Marketing', 'Transcription', 'Translation', 'Survey', 'Testing', 'Audio', 'Education', 'Admin', 'General'];

export function PostTaskModal({ onClose, onPosted }) {
  const [f, setF]     = useState({ title: '', category: 'Writing', reward: '', workers: '1', deadline: '', description: '', instructions: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function submit() {
    setErr('');
    if (!f.title.trim())          { setErr('Please enter a task title.'); return; }
    if (!(Number(f.reward) > 0))  { setErr('Enter a valid reward amount.'); return; }
    setBusy(true);
    const res = await postUserTask({
      title: f.title, category: f.category, reward: Number(f.reward),
      workers: Number(f.workers) || 1, deadline: f.deadline,
      description: f.description, instructions: f.instructions,
    });
    setBusy(false);
    if (res?.success) { onPosted?.(res.task); onClose(); }
    else setErr(res?.error || 'Could not post the task. Please try again.');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: '#000' }}>
          <div>
            <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="plus" size={18} /> Post a Task</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Create a task for the community marketplace</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>×</button>
        </div>
        <div className="pay-modal-body">
          <div className="pay-phone-label">Task Title</div>
          <input className="pay-phone-input" value={f.title} maxLength={120} onChange={e => set('title', e.target.value)} placeholder="e.g. Write 5 product descriptions" />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="pay-phone-label">Category</div>
              <select className="pay-phone-input" value={f.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <div className="pay-phone-label">Workers</div>
              <input className="pay-phone-input" type="number" min="1" max="50" value={f.workers} onChange={e => set('workers', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="pay-phone-label">Reward (KES)</div>
              <input className="pay-phone-input" type="number" min="1" value={f.reward} onChange={e => set('reward', e.target.value)} placeholder="1500" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="pay-phone-label">Deadline</div>
              <input className="pay-phone-input" type="date" value={f.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>

          <div className="pay-phone-label">Description</div>
          <textarea className="pay-phone-input" style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} maxLength={2000} value={f.description} onChange={e => set('description', e.target.value)} placeholder="What is the task about?" />

          <div className="pay-phone-label">Instructions</div>
          <textarea className="pay-phone-input" style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} maxLength={2000} value={f.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Step-by-step instructions for the worker" />

          <div style={{ fontSize: 12, color: 'var(--gray)', margin: '2px 0 12px', lineHeight: 1.6 }}>
            Attachments are coming soon. Payment protection (escrow) arrives in the next update; for now our team reviews submissions before any payout.
          </div>

          {err && <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button className="pay-btn" style={{ background: '#000' }} onClick={submit} disabled={busy}>
            {busy ? <><span className="spinner" /> Posting…</> : <><Icon name="plus" size={16} /> Post Task to Marketplace</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyPostedTasksModal({ onClose, onChanged }) {
  const [tasks, setTasks] = useState(null);
  const [busy, setBusy]   = useState({});

  useEffect(() => { (async () => setTasks(await listMyPostedTasks()))(); }, []);

  async function remove(t) {
    if (typeof window !== 'undefined' && !window.confirm(`Remove "${t.title}" from the marketplace?`)) return;
    setBusy(p => ({ ...p, [t.id]: true }));
    const res = await deleteMyTask(t.id);
    setBusy(p => ({ ...p, [t.id]: false }));
    if (res?.success) { setTasks(ts => ts.filter(x => x.id !== t.id)); onChanged?.(); }
    else alert(res?.error || 'Could not remove the task.');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pay-modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="pay-modal-header" style={{ background: '#000' }}>
          <div>
            <div className="pay-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="clipboard" size={18} /> My Posted Tasks</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Tasks you created in the marketplace</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>×</button>
        </div>
        <div className="pay-modal-body">
          {tasks === null ? (
            <div style={{ textAlign: 'center', padding: '22px 0' }}><span className="spinner" style={{ borderTopColor: '#000', borderColor: '#e5e7eb', width: 26, height: 26 }} /></div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray)', padding: '24px 0', fontSize: 14 }}>You haven&apos;t posted any tasks yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ border: '1px solid var(--gray-light)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{t.category} · KES {Number(t.payment).toLocaleString()} · {t.claimed || 0}/{t.slots || 0} taken · {t.active ? 'Active' : 'Closed'}</div>
                  </div>
                  <button onClick={() => remove(t)} disabled={busy[t.id]}
                    style={{ background: '#000', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Icon name="trash" size={13} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


