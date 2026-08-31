// lib/useUser.js
// Shared auth-gate hook for the flow pages: loads the current user, redirects to
// /login if none, and exposes the user + a setter so a page can update it.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from './auth';

export function useUser() {
  const router = useRouter();
  const [user,  setUser]  = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then(u => {
        if (!alive) return;
        if (!u) { router.replace('/login'); return; }
        setUser(u);
        setReady(true);
      })
      .catch(() => { if (alive) router.replace('/login'); });
    return () => { alive = false; };
  }, [router]);

  return { user, setUser, ready };
}
