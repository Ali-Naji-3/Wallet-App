'use client';

import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import dataProvider from '@/lib/refine/data-provider';
import { authProvider } from '@/lib/refine/auth-provider';
import { accessControlProvider } from '@/lib/refine/access-control';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RefineProvider({ children }) {
  return (
    <ThemeProvider>
      <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      resources={[
        {
          name: 'users',
          list: '/admin/users',
          create: '/admin/users/create',
          edit: '/admin/users/:id/edit',
          show: '/admin/users/:id',
          meta: {
            label: 'Users',
            icon: '👥',
          },
        },
        {
          name: 'transactions',
          list: '/admin/transactions',
          show: '/admin/transactions/:id',
          meta: {
            label: 'Transactions',
            icon: '💸',
          },
        },
        {
          name: 'wallets',
          list: '/admin/wallets',
          show: '/admin/wallets/:id',
          meta: {
            label: 'Wallets',
            icon: '💼',
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: false, // Disable to improve performance
        // Disable telemetry to prevent OpaqueResponseBlocking errors
        // projectId: 'fxwallet-admin', // Commented out to disable telemetry
        reactQuery: {
          devtoolConfig: false, // Disable devtools in production
          // OPTIMIZATION: Configure React Query caching
          clientConfig: {
            defaultOptions: {
              queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
                gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
                retry: 1, // Retry once on failure
                refetchOnWindowFocus: true, // Refetch when window regains focus
                refetchOnReconnect: true, // Refetch on reconnect
                refetchOnMount: true, // Refetch on component mount
              },
              mutations: {
                retry: 1, // Retry failed mutations once
              },
            },
          },
        },
      }}
    >
      {children}
    </Refine>
    </ThemeProvider>
  );
}

