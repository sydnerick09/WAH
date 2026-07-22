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
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../lib/useUser';
import {
  logout, updateProfile, updateAvatar, changeContact, deleteAccount,
} from '../lib/auth';
import Icon from '../components/Icon';

// Center-crop + downscale an image file to a compact square JPEG data URL.
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      return reject(new Error('Please choose a PNG, JPG or WebP image.'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('Image must be 5 MB or smaller.'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const SIZE = 512;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('That image could not be read.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });
}

const initialsOf = name =>
  (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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

  const [noticeOpen,  setNoticeOpen]  = useState(false);  // community notice before upload
  const [qrOpen,      setQrOpen]      = useState(false);
  const [contactEdit, setContactEdit] = useState(null);   // { field:'email'|'phone', value }
  const [deleteStep,  setDeleteStep]  = useState(0);       // 0 closed · 1 warning · 2 final
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!ready || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#000', borderColor: '#e5e7eb', borderWidth: 3 }} />
      </div>
    );
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
  function openPicker() { setNoticeOpen(true); }
  function agreeAndPick() { setNoticeOpen(false); fileRef.current?.click(); }
  async function onFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';                     // allow re-selecting the same file
    if (!file) return;
    try {
      setBusy(true);
      const dataUrl = await processImageFile(file);
      const res = await updateAvatar(user.id, dataUrl);
      if (res.success && res.user) { setUser(res.user); setToast('Profile picture updated'); }
      else setToast(res.error || res.message || 'Upload failed');
    } catch (err) {
      setToast(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  // ── Protected fields (Email, Phone) ──────────────────────────────────────────
  function beginContact(field) {
    setContactEdit({ field, value: field === 'email' ? (user.email || '') : (user.phone || '') });
  }
  async function confirmContact() {
    const { field, value } = contactEdit;
    const v = value.trim();
    if (!v) { setToast('Please enter a value'); return; }
    setBusy(true);
    const res = await changeContact(user.id, { [field]: v });
    setBusy(false);
    if (res.success && res.user) {
      setUser(res.user);
      setContactEdit(null);
      // Premium is now cancelled — send them to re-subscribe via the normal flow.
      router.push('/premium');
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
    { key: 'fullName',   label: 'Full Name',      value: user.fullName,   icon: 'user',   kind: 'edit' },
    { key: 'username',   label: 'Username',       value: user.username,   icon: 'atSign', kind: 'edit' },
    { key: 'address',    label: 'Address',        value: user.address,    icon: 'mapPin', kind: 'read' },
    { key: 'email',      label: 'Email Address',  value: user.email,      icon: 'mail',   kind: 'protected' },
    { key: 'phone',      label: 'Phone Number',   value: user.phone,      icon: 'phone',  kind: 'protected' },
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
          <button className="profile-icon-btn" aria-label="Edit profile" onClick={() => beginEdit('fullName')}>
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
          <div className="profile-avatar" onClick={openPicker} title="Change profile picture">
            {user.avatar
              ? <img src={user.avatar} alt="Profile" />
              : <span>{initialsOf(user.fullName)}</span>}
            <span className="profile-avatar-cam" aria-hidden="true">
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
                          : r.kind === 'protected' ? () => beginContact(r.key)
                          : undefined;
            return (
              <Tag key={r.key} className="profile-row" onClick={onClick}>
                <span className="profile-row-ico"><Icon name={r.icon} size={20} /></span>
                <span className="profile-row-main">
                  <span className="profile-row-label">{r.label}</span>
                  <span className={`profile-row-value${empty ? ' muted' : ''}`}>{r.value || 'Not provided'}</span>
                </span>
                {r.kind === 'protected' && <span className="profile-row-lock"><Icon name="lock" size={16} /></span>}
                {r.kind === 'edit'      && <span className="profile-row-chevron"><Icon name="chevronRight" size={18} /></span>}
              </Tag>
            );
          })}
        </div>

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

      {/* ── Contact change (Email / Phone) ── */}
      {contactEdit && (
        <div className="profile-dialog-overlay" onClick={() => setContactEdit(null)}>
          <div className="profile-dialog" onClick={e => e.stopPropagation()}>
            <div className="profile-dialog-head">
              <span className="profile-dialog-ico"><Icon name="warning" size={20} /></span>
              <span className="profile-dialog-title">Change {contactEdit.field === 'email' ? 'Email Address' : 'Phone Number'}</span>
            </div>
            <div className="profile-dialog-body">
              <p style={{ marginBottom: 14 }}>
                Changing your email address or phone number will automatically <strong>cancel your Premium
                Subscription</strong>. You will need to subscribe again after verifying your new information.
                Do you wish to continue?
              </p>
              <input
                className="profile-input"
                type={contactEdit.field === 'email' ? 'email' : 'tel'}
                value={contactEdit.value}
                onChange={e => setContactEdit({ ...contactEdit, value: e.target.value })}
                placeholder={contactEdit.field === 'email' ? 'you@example.com' : '+254 7XX XXX XXX'}
              />
            </div>
            <div className="profile-dialog-actions">
              <button className="btn-mono" onClick={confirmContact} disabled={busy}>
                {busy ? <span className="spinner" /> : 'Continue'}
              </button>
              <button className="btn-mono ghost" onClick={() => setContactEdit(null)} disabled={busy}>Cancel</button>
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
