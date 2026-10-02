'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import API, { getUser } from '@/lib/api';

/**
 * Auth Guard Component
 * Verifies auth via HTTP-only cookie (server call).
 * Falls back to localStorage user for instant display.
 * Redirects unauthenticated users to login.
 */
export default function Guard({
  role,
  children,
}: {
  role?: 'ADMIN' | 'STUDENT';
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Quick check from localStorage first for display
    const cachedUser = getUser();

    // Verify with server (cookie-based)
    API.get('/auth/me')
      .then(({ data }) => {
        const user = data.user;

        // Update localStorage with fresh data
        localStorage.setItem('lta_user', JSON.stringify(user));

        if (role && user.role !== role) {
          router.replace(user.role === 'ADMIN' ? '/admin' : '/dashboard');
          return;
        }

        setAuthorized(true);
      })
      .catch(() => {
        // Cookie invalid/expired — clear and redirect
        localStorage.removeItem('lta_user');
        router.replace('/login');
      });
  }, [router, role]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg font-semibold text-slate-600">Loading secure portal...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
