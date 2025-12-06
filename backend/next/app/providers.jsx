'use client';

import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from '@/lib/refine/data-provider';
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
        warnWhenUnsavedChanges: true,
        projectId: 'fxwallet-admin',
      }}
    >
      {children}
    </Refine>
    </ThemeProvider>
  );
}

