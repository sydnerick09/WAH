// pages/profile.js
// ─────────────────────────────────────────────────────────────────────────────
// Dedicated Profile page (not a modal). Flat 2017, black & white, WhatsApp-style
// centered avatar. Sections:
//   • Header: Back · Profile · Edit / Search / Referral-QR
//   • Centered circular avatar → Username → Email
//   • Change picture (5 MB max, image formats, circular, community notice)
//   • Info cards: Full Name, Username, Address, Email, Phone, Postal Code,
//     State/Region, Country
//   • Editable: Full Name + Username (save on confirm)
//   • Protected: Email + Phone (changing them cancels Premium)
//   • Sessions: Sign Out
//   • Danger Zone: Delete Account (multiple confirmations)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import {
  logout, updateProfile, updateAvatar, changeContact, deleteAccount,
} from '../lib/auth';
import Icon from '../components/Icon';
import { ProfileSkeleton } from '../components/Skeleton';
import MpesaPay from '../components/MpesaPay';

const PROFILE_FEE = 480;   // KES fee (via Daraja) to change personal name / email / phone

// Validate a chosen image file and return a data URL (cropping happens later,
// in the interactive AvatarCropper).
function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      return reject(new Error('Please choose a PNG, JPG or WebP image.'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('Image must be 5 MB or smaller.'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });
}

const initialsOf = name =>
  (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ── Interactive circular cropper ─────────────────────────────────────────────
// Pan by dragging, zoom with the slider; exports a centered 512² JPEG data URL.
const CROP_VIEW = 264;   // on-screen crop viewport (square, px)
const CROP_OUT  = 512;   // exported image size (px)

function AvatarCropper({ src, onCancel, onSave }) {
  const imgRef = useRef(null);
  const drag   = useRef(null);
  const [nat,   setNat]   = useState(null);          // natural { w, h }
  const [scale, setScale] = useState(1);
  const [off,   setOff]   = useState({ x: 0, y: 0 }); // image top-left within viewport
  const [busy,  setBusy]  = useState(false);

  const baseScale = nat ? CROP_VIEW / Math.min(nat.w, nat.h) : 1;
  const dispW = nat ? nat.w * baseScale * scale : CROP_VIEW;
  const dispH = nat ? nat.h * baseScale * scale : CROP_VIEW;

  // Keep the image always covering the circular viewport.
  const clamp = useCallback((o) => ({
    x: Math.min(0, Math.max(CROP_VIEW - dispW, o.x)),
    y: Math.min(0, Math.max(CROP_VIEW - dispH, o.y)),
  }), [dispW, dispH]);

  function onImgLoad(e) {
    const w = e.target.naturalWidth, h = e.target.naturalHeight;
    const bs = CROP_VIEW / Math.min(w, h);
    setNat({ w, h });
    setScale(1);
    setOff({ x: (CROP_VIEW - w * bs) / 2, y: (CROP_VIEW - h * bs) / 2 });
  }

  useEffect(() => { setOff(o => clamp(o)); }, [scale, clamp]);

  function onPointerDown(e) {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: off.x, oy: off.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    setOff(clamp({ x: drag.current.ox + (e.clientX - drag.current.sx), y: drag.current.oy + (e.clientY - drag.current.sy) }));
  }
  function onPointerUp() { drag.current = null; }

  async function save() {
    if (!nat || busy) return;
    setBusy(true);
    const canvas = document.createElement('canvas');
    canvas.width = CROP_OUT; canvas.height = CROP_OUT;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, CROP_OUT, CROP_OUT);
    const s = baseScale * scale;
    const srcX = -off.x / s, srcY = -off.y / s, srcSize = CROP_VIEW / s;
    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, CROP_OUT, CROP_OUT);
    try { await onSave(canvas.toDataURL('image/jpeg', 0.9)); }
    finally { setBusy(false); }
  }

  return (
    <div className="profile-dialog-overlay" onClick={onCancel}>
      <div className="profile-dialog cropper" onClick={e => e.stopPropagation()}>
        <div className="profile-dialog-head">
          <span className="profile-dialog-ico"><Icon name="camera" size={20} /></span>
          <span className="profile-dialog-title">Position &amp; Crop</span>
        </div>
        <div
          className="cropper-stage"
          style={{ width: CROP_VIEW, height: CROP_VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={onImgLoad}
            style={{ position: 'absolute', left: off.x, top: off.y, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none' }}
          />
          <div className="cropper-mask" />
        </div>
        <div className="cropper-controls">
          <Icon name="search" size={16} />
          <input
            type="range" min="1" max="3" step="0.01" value={scale}
            className="cropper-range" aria-label="Zoom"
            onChange={e => setScale(Number(e.target.value))}
          />
        </div>
        <div className="cropper-hint">Drag to reposition · slide to zoom</div>
        <div className="profile-dialog-actions">
          <button className="btn-mono" onClick={save} disabled={busy || !nat}>
            {busy ? <span className="spinner" /> : 'Save Photo'}
          </button>
          <button className="btn-mono ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, ready } = useUser();
  const fileRef = useRef(null);

  const [editing,     setEditing]   = useState(null);   // 'fullName' | 'username' | null
  const [draft,       setDraft]     = useState('');
  const [busy,        setBusy]      = useState(false);
  const [toast,       setToast]     = useState('');
  const [showSearch,  setShowSearch]= useState(false);
  const [query,       setQuery]     = useState('');

  const [noticeOpen,  setNoticeOpen]  = useState(false);  // community notice before a NEW upload
  const [viewerOpen,  setViewerOpen]  = useState(false);  // profile photo viewer
  const [cropSrc,     setCropSrc]     = useState(null);   // image being cropped (data URL)
  const [qrOpen,      setQrOpen]      = useState(false);
  const [feeEdit, setFeeEdit] = useState(null);   // { field:'fullName'|'email'|'phone', step:'notice'|'pay'|'input', value, feeRef }
  const [deleteStep,  setDeleteStep]  = useState(0);       // 0 closed · 1 warning · 2 final
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!ready || !user) {
    return <ProfileSkeleton />;
  }

  const referralLink = `https://onlinejob-pi.vercel.app/join?ref=${user.id || 'USER'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&color=000000&bgcolor=ffffff&data=${encodeURIComponent(referralLink)}`;

  // ── Editable fields (Full Name, Username) ────────────────────────────────────
  function beginEdit(field) {
    setEditing(field);
    setDraft(field === 'fullName' ? (user.fullName || '') : (user.username || ''));
  }
  async function saveEdit() {
    const value = draft.trim();
    if (editing === 'fullName' && !value) { setToast('Full name cannot be empty'); return; }
    setBusy(true);
    const res = await updateProfile(user.id, { [editing]: value });
    setBusy(false);
    if (res.success && res.user) {
      setUser(res.user);
      setEditing(null);
      setToast('Saved');
    } else {
      setToast(res.error || res.message || 'Could not save');
    }
  }

  // ── Profile picture ──────────────────────────────────────────────────────────
  // Tapping the avatar opens the photo viewer when a picture exists; otherwise it
  // starts the add flow. The camera badge always starts a change.
  function onAvatarClick() {
    if (user.avatar) setViewerOpen(true);
    else startChange();
  }
  function startChange() {                    // choose a NEW image (community notice first)
    setViewerOpen(false);
    setNoticeOpen(true);
  }
  function agreeAndPick() { setNoticeOpen(false); fileRef.current?.click(); }
  function editCurrent() {                     // re-crop / reposition the EXISTING photo
    setViewerOpen(false);
    if (user.avatar) setCropSrc(user.avatar);
  }
  async function onFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';                       // allow re-selecting the same file
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);   // validate, then hand off to the cropper
      setCropSrc(dataUrl);
    } catch (err) {
      setToast(err.message || 'That image could not be used');
    }
  }
  async function saveCropped(dataUrl) {
    setBusy(true);
    const res = await updateAvatar(user.id, dataUrl);
    setBusy(false);
    if (res.success && res.user) { setUser(res.user); setCropSrc(null); setToast('Profile picture updated'); }
    else setToast(res.error || res.message || 'Upload failed');
  }
  async function removePhoto() {
    if (!window.confirm('Remove your profile picture?')) return;
    setBusy(true);
    const res = await updateAvatar(user.id, '');
    setBusy(false);
    if (res.success && res.user) { setUser(res.user); setViewerOpen(false); setToast('Profile picture removed'); }
    else setToast(res.error || res.message || 'Could not remove picture');
  }

  // ── Fee-gated personal fields (Full Name, Email, Phone) ──────────────────────
  // Changing a personal name / email / phone requires a KES 480 fee paid via
  // Safaricom Daraja (M-Pesa). Flow: notice → pay (STK) → enter new value → save.
  // The server re-verifies the paid fee before applying the change.
  const fieldLabel = f => f === 'fullName' ? 'Full Name' : f === 'email' ? 'Email Address' : 'Phone Number';
  function beginPaidChange(field) {
    const cur = field === 'fullName' ? (user.fullName || '') : field === 'email' ? (user.email || '') : (user.phone || '');
    setFeeEdit({ field, step: 'notice', value: cur, feeRef: '' });
  }
  async function saveFeeChange() {
    const { field, value, feeRef } = feeEdit;
    const v = String(value || '').trim();
    if (!v) { setToast('Please enter a value'); return; }
    if (!feeRef) { setToast('Please complete the KES 480 payment first'); return; }
    setBusy(true);
    const res = await changeContact(user.id, { [field]: v, feeRef });
    setBusy(false);
    if (res.success && res.user) {
      setUser(res.user);
      setFeeEdit(null);
      setToast(`${fieldLabel(field)} updated`);
    } else {
      setToast(res.error || res.message || 'Could not update');
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────
  function signOut() {
    if (!window.confirm('Sign out of your account on this device?')) return;
    logout();
    router.push('/login');
  }

  // ── Danger zone ──────────────────────────────────────────────────────────────
  async function reallyDelete() {
    if (confirmText.trim().toUpperCase() !== 'DELETE') { setToast('Type DELETE to confirm'); return; }
    setBusy(true);
    const res = await deleteAccount(user.id);
    setBusy(false);
    if (res.success) {
      router.push('/register');
    } else {
      setToast(res.error || res.message || 'Could not delete account');
    }
  }

  // ── Info rows ────────────────────────────────────────────────────────────────
  const rows = [
    { key: 'fullName',   label: 'Full Name',      value: user.fullName,   icon: 'user',   kind: 'paid' },
    { key: 'username',   label: 'Username',       value: user.username,   icon: 'atSign', kind: 'edit' },
    { key: 'address',    label: 'Address',        value: user.address,    icon: 'mapPin', kind: 'read' },
    { key: 'email',      label: 'Email Address',  value: user.email,      icon: 'mail',   kind: 'paid' },
    { key: 'phone',      label: 'Phone Number',   value: user.phone,      icon: 'phone',  kind: 'paid' },
    { key: 'postalCode', label: 'Postal Code',    value: user.postalCode, icon: 'hash',   kind: 'read' },
    { key: 'state',      label: 'State / Region', value: user.state,      icon: 'map',    kind: 'read' },
    { key: 'country',    label: 'Country',        value: user.country,    icon: 'globe',  kind: 'read' },
  ];
  const q = query.trim().toLowerCase();
  const shownRows = q
    ? rows.filter(r => r.label.toLowerCase().includes(q) || String(r.value || '').toLowerCase().includes(q))
    : rows;

  return (
    <div className="profile-page">
      {/* ── Header ── */}
      <header className="profile-header">
        <div className="profile-header-left">
          <button className="profile-icon-btn" aria-label="Back" onClick={() => router.push('/dashboard')}>
            <Icon name="arrowLeft" size={22} />
          </button>
        </div>
        <div className="profile-header-title">Profile</div>
        <div className="profile-header-right">
          <button className="profile-icon-btn" aria-label="Edit username" onClick={() => beginEdit('username')}>
            <Icon name="edit" size={19} />
          </button>
          <button className="profile-icon-btn" aria-label="Search" onClick={() => { setShowSearch(s => !s); setQuery(''); }}>
            <Icon name="search" size={19} />
          </button>
          <button className="profile-icon-btn" aria-label="Referral QR code" onClick={() => setQrOpen(true)}>
            <Icon name="qrcode" size={20} />
          </button>
        </div>
      </header>

      <div className="profile-body">
        {showSearch && (
          <input
            autoFocus
            className="profile-input"
            style={{ marginBottom: 20 }}
            placeholder="Search your information…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        )}

        {/* ── Centered avatar ── */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" onClick={onAvatarClick} title={user.avatar ? 'View profile photo' : 'Add profile picture'}>
            {user.avatar
              ? <img src={user.avatar} alt="Profile" />
              : <span>{initialsOf(user.fullName)}</span>}
            <span className="profile-avatar-cam" role="button" aria-label="Change profile picture" onClick={e => { e.stopPropagation(); startChange(); }}>
              <Icon name="camera" size={18} />
            </span>
          </div>
          <div className="profile-username">{user.username || user.fullName || 'Your Name'}</div>
          <div className="profile-email">{user.email}</div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={onFileChosen}
        />

        {/* ── Account information ── */}
        <div className="profile-section-label">Account Information</div>
        <div className="profile-card">
          {shownRows.map(r => {
            const empty = !r.value;
            if (editing === r.key && r.kind === 'edit') {
              return (
                <div key={r.key} className="profile-edit-field">
                  <div className="profile-row-label" style={{ marginBottom: 8 }}>{r.label}</div>
                  <input
                    autoFocus
                    className="profile-input"
                    value={draft}
                    maxLength={r.key === 'username' ? 40 : 80}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null); }}
                    placeholder={r.label}
                  />
                  <div className="profile-inline-actions">
                    <button className="btn-mono ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                    <button className="btn-mono" onClick={saveEdit} disabled={busy}>
                      {busy ? <span className="spinner" /> : 'Save'}
                    </button>
                  </div>
                </div>
              );
            }
            const Tag = r.kind === 'read' ? 'div' : 'button';
            const onClick = r.kind === 'edit' ? () => beginEdit(r.key)
                          : r.kind === 'paid' ? () => beginPaidChange(r.key)
                          : undefined;
            return (
              <Tag key={r.key} className="profile-row" onClick={onClick}>
                <span className="profile-row-ico"><Icon name={r.icon} size={20} /></span>
                <span className="profile-row-main">
                  <span className="profile-row-label">{r.label}</span>
                  <span className={`profile-row-value${empty ? ' muted' : ''}`}>{r.value || 'Not provided'}</span>
                </span>
                {r.kind === 'paid' && <span className="profile-row-lock"><Icon name="lock" size={16} /></span>}
                {r.kind === 'edit' && <span className="profile-row-chevron"><Icon name="chevronRight" size={18} /></span>}
              </Tag>
            );
          })}
        </div>

        {/* ── Privacy & Cookies ── */}
        <div className="profile-section-label">Privacy &amp; Cookies</div>
        <button className="profile-action-btn" onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('gweno:open-cookies')); }}>
          <Icon name="shield" size={20} /> Manage Cookie Preferences
        </button>
        <button className="profile-action-btn" style={{ marginTop: 10 }} onClick={() => router.push('/cookie-policy')}>
          <Icon name="file" size={20} /> Cookie Policy
        </button>

        {/* ── Sessions ── */}
        <div className="profile-section-label">Sessions</div>
        <button className="profile-action-btn" onClick={signOut}>
          <Icon name="logout" size={20} /> Sign Out
        </button>

        {/* ── Danger zone ── */}
        <div className="profile-section-label danger">Danger Zone</div>
        <button className="profile-action-btn danger" onClick={() => { setDeleteStep(1); setConfirmText(''); }}>
          <Icon name="trash" size={20} /> Delete Account
        </button>
        <p className="profile-danger-note">
          Deleting your account is permanent and cannot be undone.
        </p>
      </div>

      {/* ── Community notice (before upload) ── */}
      {noticeOpen && (
        <div className="profile-dialog-overlay" onClick={() => setNoticeOpen(false)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-notice" style={{ border: 'none', margin: 0, borderRadius: 0 }}>
              <div className="profile-notice-title"><Icon name="shield" size={18} /> Community Notice</div>
              <p>
                Profile pictures must follow our community guidelines.<br /><br />
                Uploading explicit, offensive, or adult content may result in immediate account
                suspension or permanent account deletion.<br /><br />
                By continuing, you agree to follow our community standards.
              </p>
            </div>
            <div className="profile-dialog-actions">
              <button className="btn-mono" onClick={agreeAndPick}>Agree &amp; Choose Photo</button>
              <button className="btn-mono ghost" onClick={() => setNoticeOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile photo viewer (Edit / Change / Remove) ── */}
      {viewerOpen && user.avatar && (
        <div className="profile-dialog-overlay" onClick={() => setViewerOpen(false)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-dialog-head">
              <span className="profile-dialog-ico"><Icon name="user" size={20} /></span>
              <span className="profile-dialog-title">Profile Photo</span>
            </div>
            <div style={{ padding: '10px 24px 0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="photo-viewer-img" src={user.avatar} alt="Profile" />
            </div>
            <div className="photo-viewer-actions">
              <button className="btn-mono" onClick={editCurrent}><Icon name="edit" size={16} /> Edit Profile Picture</button>
              <button className="btn-mono ghost" onClick={startChange}><Icon name="camera" size={16} /> Change Profile Picture</button>
              <button className="btn-mono ghost" onClick={removePhoto} disabled={busy}><Icon name="trash" size={16} /> Remove Profile Picture</button>
              <button className="btn-mono ghost" onClick={() => setViewerOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Avatar cropper ── */}
      {cropSrc && (
        <AvatarCropper src={cropSrc} onCancel={() => setCropSrc(null)} onSave={saveCropped} />
      )}

      {/* ── Referral QR ── */}
      {qrOpen && (
        <div className="profile-dialog-overlay" onClick={() => setQrOpen(false)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-dialog-head">
              <span className="profile-dialog-ico"><Icon name="qrcode" size={20} /></span>
              <span className="profile-dialog-title">Your Referral QR</span>
            </div>
            <div className="profile-dialog-body" style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 14 }}>Scan or share this code — friends who join with it help you earn.</p>
              <img
                src={qrUrl}
                alt="Referral QR code"
                width={220}
                height={220}
                style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}
              />
              <div style={{ marginTop: 14, fontSize: 12.5, color: '#64748B', wordBreak: 'break-all' }}>
                {referralLink.replace('https://', '')}
              </div>
            </div>
            <div className="profile-dialog-actions">
              <button className="btn-mono" onClick={() => {
                navigator.clipboard?.writeText(referralLink);
                setToast('Referral link copied');
              }}>Copy Link</button>
              <button className="btn-mono ghost" onClick={() => setQrOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Personal field change (Full Name / Email / Phone) — KES 480 via Daraja ── */}
      {feeEdit && (
        <div className="profile-dialog-overlay" onClick={() => setFeeEdit(null)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-dialog-head">
              <span className="profile-dialog-ico"><Icon name={feeEdit.step === 'input' ? 'edit' : 'lock'} size={20} /></span>
              <span className="profile-dialog-title">Change {fieldLabel(feeEdit.field)}</span>
            </div>
            <div className="profile-dialog-body">
              {feeEdit.step === 'notice' && (
                <p style={{ marginBottom: 0 }}>
                  Changing your <strong>{fieldLabel(feeEdit.field).toLowerCase()}</strong> requires a one-time
                  <strong> KES {PROFILE_FEE} profile-change fee</strong>, paid via <strong>M-Pesa (Safaricom)</strong>.
                  After the payment is confirmed, you can enter and save the new value. Do you want to continue?
                </p>
              )}
              {feeEdit.step === 'pay' && (
                <>
                  <div className="pay-amount" style={{ marginBottom: 14 }}>
                    <div className="pay-amount-label">Profile Change Fee</div>
                    <div className="pay-amount-value" style={{ color: 'var(--mpesa-green)' }}>KES {PROFILE_FEE}</div>
                    <div className="pay-amount-sub">Paid via M-Pesa • unlocks this change once confirmed</div>
                  </div>
                  <MpesaPay
                    purpose="profile_change"
                    amount={PROFILE_FEE}
                    defaultPhone={user.phone || ''}
                    payLabel={`Pay KES ${PROFILE_FEE} via M-Pesa`}
                    onSuccess={(d) => setFeeEdit(f => ({ ...f, feeRef: d?.checkoutRequestId || '', step: 'input' }))}
                  />
                </>
              )}
              {feeEdit.step === 'input' && (
                <>
                  <div className="pay-message" style={{ borderColor: 'var(--mpesa-green)', background: '#f0fff4', marginBottom: 14, fontSize: 13 }}>
                    <Icon name="check" size={14} /> KES {PROFILE_FEE} fee paid and verified. Enter your new {fieldLabel(feeEdit.field).toLowerCase()}.
                  </div>
                  <input
                    className="profile-input"
                    type={feeEdit.field === 'email' ? 'email' : feeEdit.field === 'phone' ? 'tel' : 'text'}
                    value={feeEdit.value}
                    onChange={e => setFeeEdit({ ...feeEdit, value: e.target.value })}
                    placeholder={feeEdit.field === 'email' ? 'you@example.com' : feeEdit.field === 'phone' ? '+254 7XX XXX XXX' : 'Your full name'}
                    autoFocus
                  />
                </>
              )}
            </div>
            <div className="profile-dialog-actions">
              {feeEdit.step === 'notice' && (
                <button className="btn-mono" onClick={() => setFeeEdit(f => ({ ...f, step: 'pay' }))}>
                  <Icon name="lock" size={15} /> Pay KES {PROFILE_FEE} to continue
                </button>
              )}
              {feeEdit.step === 'input' && (
                <button className="btn-mono" onClick={saveFeeChange} disabled={busy}>
                  {busy ? <span className="spinner" /> : 'Save Change'}
                </button>
              )}
              <button className="btn-mono ghost" onClick={() => setFeeEdit(null)} disabled={busy}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete account (multi-confirm) ── */}
      {deleteStep === 1 && (
        <div className="profile-dialog-overlay" onClick={() => setDeleteStep(0)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-dialog-head">
              <span className="profile-dialog-ico"><Icon name="trash" size={19} /></span>
              <span className="profile-dialog-title">Delete Account</span>
            </div>
            <div className="profile-dialog-body">
              <p>
                Deleting your account is permanent. All personal information, profile data, uploaded images,
                tasks, Premium membership, balances, and account history will be permanently removed from the
                database and cannot be recovered.
              </p>
            </div>
            <div className="profile-dialog-actions">
              <button className="btn-mono danger-solid" style={{ background: '#000', color: '#fff', border: '1.5px solid #000' }} onClick={() => setDeleteStep(2)}>Delete Account</button>
              <button className="btn-mono ghost" onClick={() => setDeleteStep(0)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {deleteStep === 2 && (
        <div className="profile-dialog-overlay" onClick={() => setDeleteStep(0)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-dialog-head">
              <span className="profile-dialog-ico"><Icon name="warning" size={19} /></span>
              <span className="profile-dialog-title">Are you absolutely sure?</span>
            </div>
            <div className="profile-dialog-body">
              <p style={{ marginBottom: 14 }}>
                This is your final confirmation. Type <strong>DELETE</strong> below to permanently remove your account.
              </p>
              <input
                className="profile-input"
                autoFocus
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
              />
            </div>
            <div className="profile-dialog-actions">
              <button
                className="btn-mono"
                style={{ background: '#000', color: '#fff', border: '1.5px solid #000', opacity: confirmText.trim().toUpperCase() === 'DELETE' ? 1 : 0.5 }}
                onClick={reallyDelete}
                disabled={busy || confirmText.trim().toUpperCase() !== 'DELETE'}
              >
                {busy ? <span className="spinner" /> : 'Permanently Delete'}
              </button>
              <button className="btn-mono ghost" onClick={() => setDeleteStep(0)} disabled={busy}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="profile-toast"><Icon name="check" size={16} /> {toast}</div>
      )}
    </div>
  );
}


