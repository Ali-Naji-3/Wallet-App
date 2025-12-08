'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useGetIdentity } from '@refinedev/core';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { data: authData, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  useEffect(() => {
    // Add timeout to prevent blocking
    const timeout = setTimeout(() => {
    if (!authLoading && !identityLoading) {
      if (authData?.authenticated) {
        // Redirect based on user role
        if (identity?.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/wallet/dashboard');
        }
      } else {
          // Use window.location for faster redirect, bypassing RSC
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else if (authLoading || identityLoading) {
        // If still loading after 2 seconds, redirect to login to avoid blocking
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
      }
    }
    }, 500); // Small delay to allow auth check

    return () => clearTimeout(timeout);
  }, [authData, authLoading, identity, identityLoading, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
