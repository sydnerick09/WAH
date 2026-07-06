// pages/skills-test.js — the Premium Skills Test has been removed.
// This route now just redirects to the Premium page.
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SkillsTestRemoved() {
  const router = useRouter();
  useEffect(() => { router.replace('/premium'); }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white-off)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--green)', borderColor: 'var(--gray-light)', borderWidth: 3 }} />
    </div>
  );
}
