// pages/submit.js — task submission with a file/document attachment.
// Uploads the completed work to /api/submit-task, which emails it (as an
// attachment) to the admin and sends the client an auto-reply confirmation.
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { TASKS } from '../lib/tasks';
import FlowShell from '../components/FlowShell';

const MAX_MB = 5;
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.mp3,.mp4,image/*';

export default function SubmitPage() {
  const router = useRouter();
  const { user, ready } = useUser();

  const [file,    setFile]    = useState(null);
  const [note,    setNote]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const task = TASKS.find(t => String(t.id) === String(router.query.task));

  function onPick(e) {
    const f = e.target.files?.[0];
    setError('');
    if (!f) { setFile(null); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`File is too large. Maximum ${MAX_MB} MB.`); setFile(null); e.target.value = ''; return; }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) { setError('Please attach your completed work file first.'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('taskId', String(task?.id ?? ''));
      fd.append('taskTitle', task?.title ?? '');
      fd.append('userId', user.id);
      fd.append('userEmail', user.email || '');
      fd.append('userName', user.fullName || '');
      fd.append('note', note || '');
      const res  = await fetch('/api/submit-task', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.emailSent === false) setError('Submitted, but the email could not be delivered. Please contact support.');
        setDone(true);
      } else {
        setError(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  if (!ready || !user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
    </div>;
  }

  // An active account is required before submitting any task
  if (!user.activated) {
    return (
      <FlowShell title="Submit Task" subtitle="Active account required" icon="📤">
        <div className="pay-message" style={{ borderColor: '#125C37', background: '#F0FFF4', marginBottom: 18 }}>
          You need an <strong>active account</strong> before you can submit tasks. Activate your account to get started.
        </div>
        <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }} onClick={() => router.push('/activate')}>✅ Activate My Account</button>
      </FlowShell>
    );
  }

  // Premium is required to submit
  if (!user.premium) {
    return (
      <FlowShell title="Submit Task" subtitle="Premium required" icon="📤">
        <div className="pay-message" style={{ borderColor: '#125C37', background: '#F0FFF4', marginBottom: 18 }}>
          Submitting completed tasks requires <strong>Premium</strong>. Upgrade to unlock task submissions.
        </div>
        <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #125C37, #1A7A4A)' }} onClick={() => router.push('/premium')}>⭐ Go to Premium</button>
      </FlowShell>
    );
  }

  if (!task) {
    return (
      <FlowShell title="Submit Task" icon="📤">
        <div className="pay-message" style={{ marginBottom: 18 }}>That task could not be found.</div>
        <button className="pay-btn" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </FlowShell>
    );
  }

  if (done) {
    return (
      <FlowShell title="Submit Task" subtitle="Submission received" icon="📤">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#059669', marginBottom: 6 }}>Submission Sent</div>
          <div className="pay-message" style={{ borderColor: '#059669', background: '#F0FFF4', textAlign: 'left', marginTop: 12 }}>
            Your file <strong>{file?.name}</strong> for <strong>{task.title}</strong> has been submitted. We’ve emailed you a confirmation at <strong>{user.email}</strong> and our team will review your work.
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
          <button className="pay-btn" style={{ background: 'linear-gradient(135deg, #059669, #1A7A4A)', marginTop: 18 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Submit Your Work" subtitle={task.title} icon="📤">
      <div className="pay-message" style={{ marginBottom: 18 }}>
        Attach your completed work for <strong>{task.title}</strong> ({task.category}) and submit. Accepted: documents, images, audio, video or zip — up to {MAX_MB} MB.
      </div>

      <div className="pay-phone-label">Your completed work (file)</div>
      <label
        htmlFor="submit-file"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: `2px dashed ${error && !file ? '#ef4444' : '#CBD5E1'}`, borderRadius: 12,
          padding: '26px 16px', cursor: 'pointer', background: file ? '#F0FFF4' : '#F9FAFB', textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 34 }}>{file ? '📄' : '📎'}</span>
        {file ? (
          <>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', wordBreak: 'break-all' }}>{file.name}</span>
            <span style={{ fontSize: 12, color: '#059669' }}>{(file.size / 1024).toFixed(0)} KB • tap to change</span>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tap to attach your document</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>PDF, Word, Excel, image, zip… (max {MAX_MB} MB)</span>
          </>
        )}
      </label>
      <input id="submit-file" type="file" accept={ACCEPT} onChange={onPick} style={{ display: 'none' }} />

      <div className="pay-phone-label" style={{ marginTop: 16 }}>Note to reviewer (optional)</div>
      <textarea
        className="pay-phone-input"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add any comments about your submission…"
        rows={3}
        style={{ resize: 'vertical', minHeight: 72, fontFamily: 'inherit' }}
      />

      {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}

      <button className="pay-btn" style={{ marginTop: 18, opacity: file ? 1 : 0.6 }} onClick={handleSubmit} disabled={loading || !file}>
        {loading ? <><span className="spinner" /> Uploading…</> : '📤 Submit Work'}
      </button>
      <div className="pay-secure">🔐 Your file is emailed securely to our review team</div>
    </FlowShell>
  );
}
