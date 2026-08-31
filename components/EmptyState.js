// components/EmptyState.js — reusable empty-state block for lists/results.
// Part of the shared design system (consistent spacing, icon, typography).
import Icon from './Icon';

export default function EmptyState({ icon = 'info', title, message, action }) {
  return (
    <div
      role="status"
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        border: '1.5px dashed var(--gray-light)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--white)',
        color: 'var(--gray)',
      }}
    >
      <div style={{ color: 'var(--gray)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <Icon name={icon} size={40} stroke={1.5} />
      </div>
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--black)', marginBottom: 4 }}>
          {title}
        </div>
      )}
      {message && (
        <div style={{ fontSize: 14, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>{message}</div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}


