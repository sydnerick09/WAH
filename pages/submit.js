// pages/submit.js, task submission with a file/document attachment.
// Uploads the completed work to /api/submit-task, which emails it (as an
// attachment) to the admin and sends the client an auto-reply confirmation.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import { getToken } from '../lib/auth';
import { TASKS } from '../lib/tasks';
import FlowShell from '../components/FlowShell';
import Icon from '../components/Icon';
import { FlowSkeleton } from '../components/Skeleton';

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
  const [dbTasks, setDbTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [appStatus, setAppStatus] = useState(undefined); // undefined=loading, null=none, or status string

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'listTasks' }),
        });
        const { data } = await r.json();
        if (Array.isArray(data)) setDbTasks(data);
      } catch (_) {}
      setTasksLoaded(true);
    })();
  }, []);

  const task = [...dbTasks, ...TASKS].find(t => String(t.id) === String(router.query.task));
  // Offers and community (user-posted, id contains "~") tasks skip the proposal
  // + premium gates and go straight to proof submission.
  const isOfferTask = String(task?.id || '').startsWith('offer_') || String(task?.id || '').includes('~');

  // Load this user's application status for the task (proposal gate).
  useEffect(() => {
    if (!user?.id || !task || isOfferTask) { setAppStatus(null); return; }
    setAppStatus(undefined);
    (async () => {
      try {
        const r = await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'listUserApplications', userId: user.id, authToken: getToken() }),
        });
        const { data } = await r.json();
        const mine = (Array.isArray(data) ? data : []).find(a => String(a.taskId) === String(task.id));
        setAppStatus(mine?.status || null);
      } catch { setAppStatus(null); }
    })();
  }, [user?.id, task?.id, isOfferTask]);

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
      fd.append('taskPayment', String(task?.payment ?? ''));
      fd.append('taskCategory', task?.category ?? '');
      fd.append('userId', user.id);
      fd.append('authToken', getToken() || '');
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

  if (!ready || !user || !tasksLoaded || appStatus === undefined) {
    return <FlowSkeleton rows={3} />;
  }

  // An active account is required before submitting any task
  if (!user.activated) {
    return (
      <FlowShell title="Submit Task" subtitle="Active account required" icon="upload">
        <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 18 }}>
          You need an <strong>active account</strong> before you can submit tasks. Activate your account to get started.
        </div>
        <button className="pay-btn" style={{ background: '#000000' }} onClick={() => router.push('/activate')}><Icon name="check" size={16} /> Activate My Account</button>
      </FlowShell>
    );
  }

  // A proposal must be submitted and APPROVED before working on a task
  // (offer tasks are exempt). Blocks direct navigation to /submit?task=…
  if (task && !isOfferTask && appStatus !== 'approved') {
    const pending = appStatus === 'pending';
    const needsFix = appStatus === 'correction' || appStatus === 'rejected';
    return (
      <FlowShell title="Submit Task" subtitle="Proposal approval required" icon="edit">
        <div className="pay-message" style={{ borderColor: pending ? '#4b5563' : '#1f2937', background: pending ? '#f9fafb' : '#f9fafb', marginBottom: 18 }}>
          {pending
            ? <>Your proposal for <strong>{task.title}</strong> is <strong>under review</strong>. You&apos;ll be able to submit your work once it&apos;s approved.</>
            : needsFix
              ? <>Your proposal for <strong>{task.title}</strong> {appStatus === 'rejected' ? 'was not approved' : 'needs corrections'}. Please re-apply from your dashboard.</>
              : <>You need an <strong>approved proposal</strong> before you can submit <strong>{task.title}</strong>. Apply for the task from your dashboard first.</>}
        </div>
        <button className="pay-btn" style={{ background: '#000000' }} onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={16} /> Back to Dashboard</button>
      </FlowShell>
    );
  }

  // Premium is required to submit, except OFFER and community (user-posted) tasks
  if (!user.premium && !isOfferTask) {
    return (
      <FlowShell title="Submit Task" subtitle="Premium required" icon="upload">
        <div className="pay-message" style={{ borderColor: '#1f2937', background: '#f9fafb', marginBottom: 18 }}>
          Submitting completed tasks requires <strong>Premium</strong>. Upgrade to unlock task submissions.
        </div>
        <button className="pay-btn" style={{ background: '#000000' }} onClick={() => router.push('/premium')}><Icon name="star" size={16} /> Go to Premium</button>
      </FlowShell>
    );
  }

  if (!task) {
    return (
      <FlowShell title="Submit Task" icon="upload">
        <div className="pay-message" style={{ marginBottom: 18 }}>That task could not be found.</div>
        <button className="pay-btn" onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={16} /> Back to Dashboard</button>
      </FlowShell>
    );
  }

  if (done) {
    return (
      <FlowShell title="Submit Task" subtitle="Submission received" icon="upload">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#111827' }}><Icon name="check" size={52} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#374151', marginBottom: 6 }}>Submission Sent</div>
          <div className="pay-message" style={{ borderColor: '#374151', background: '#f9fafb', textAlign: 'left', marginTop: 12 }}>
            Your file <strong>{file?.name}</strong> for <strong>{task.title}</strong> has been submitted. We’ve emailed you a confirmation at <strong>{user.email}</strong> and our team will review your work.
          </div>
          {error && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 8 }}>{error}</div>}
          <button className="pay-btn" style={{ background: '#000000', marginTop: 18 }} onClick={() => router.push('/dashboard')}><Icon name="arrowLeft" size={16} /> Back to Dashboard</button>
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell title="Submit Your Work" subtitle={task.title} icon="upload">
      <div className="pay-message" style={{ marginBottom: 18 }}>
        Attach your completed work for <strong>{task.title}</strong> ({task.category}) and submit. Accepted: documents, images, audio, video or zip, up to {MAX_MB} MB.
      </div>

      <div className="pay-phone-label">Your completed work (file)</div>
      <label
        htmlFor="submit-file"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: `2px dashed ${error && !file ? '#4b5563' : '#CBD5E1'}`, borderRadius: 12,
          padding: '26px 16px', cursor: 'pointer', background: file ? '#f9fafb' : '#F9FAFB', textAlign: 'center',
        }}
      >
        <span style={{ color: '#111827', display: 'flex' }}><Icon name={file ? 'file' : 'upload'} size={32} /></span>
        {file ? (
          <>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', wordBreak: 'break-all' }}>{file.name}</span>
            <span style={{ fontSize: 12, color: '#374151' }}>{(file.size / 1024).toFixed(0)} KB • tap to change</span>
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

      {error && <div style={{ color: '#4b5563', fontSize: 12, marginTop: 8 }}>{error}</div>}

      <button className="pay-btn" style={{ marginTop: 18, opacity: file ? 1 : 0.6 }} onClick={handleSubmit} disabled={loading || !file}>
        {loading ? <><span className="spinner" /> Uploading…</> : <><Icon name="upload" size={16} /> Submit Work</>}
      </button>
      <div className="pay-secure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="lock" size={13} /> Your file is emailed securely to our review team</div>
    </FlowShell>
  );
}


