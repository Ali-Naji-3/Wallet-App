'use client';

import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { ReactNode } from 'react';
import { dataProvider } from './refine/data-provider';
import { authProvider } from './refine/auth-provider';
import { accessControlProvider } from './refine/access-control';

interface RefineProviderProps {
  children: ReactNode;
}

export function RefineProvider({ children }: RefineProviderProps) {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      resources={[
        {
          name: 'dashboard',
          list: '/admin/dashboard',
          meta: {
            label: 'Dashboard',
            icon: '📊',
          },
        },
        {
          name: 'users',
          list: '/admin/users',
          create: '/admin/users/create',
          edit: '/admin/users/:id/edit',
          show: '/admin/users/:id',
          meta: {
            label: 'Users',
            icon: '👥',
            canDelete: true,
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
          name: 'kyc',
          list: '/admin/kyc',
          show: '/admin/kyc/:id',
          meta: {
            label: 'KYC',
            icon: '🔐',
          },
        },
        {
          name: 'settings',
          list: '/admin/settings',
          meta: {
            label: 'Settings',
            icon: '⚙️',
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        useNewQueryKeys: true,
        projectId: 'fxwallet-admin',
      }}
    >
      {children}
    </Refine>
  );
}

