'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Loading component for lazy-loaded components
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
  </div>
);

/**
 * Lazy-loaded heavy components with loading states
 */

// Admin components
export const LazyNotificationBell = dynamic(
  () => import('@/components/NotificationBell'),
  {
    loading: () => <div className="h-10 w-10" />,
    ssr: false, // Don't SSR for better performance
  }
);

export const LazyThemeToggle = dynamic(
  () => import('@/components/ThemeToggle'),
  {
    loading: () => <div className="h-10 w-10" />,
    ssr: false,
  }
);

// Chart components (usually heavy)
export const LazyChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Dialog/Modal components (lazy load to reduce initial bundle)
export const LazyDialog = dynamic(
  () => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })),
  {
    ssr: false,
  }
);

export const LazyDialogContent = dynamic(
  () => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogContent })),
  {
    ssr: false,
  }
);

// Dropdown menu (lazy load)
export const LazyDropdownMenu = dynamic(
  () => import('@/components/ui/dropdown-menu').then(mod => ({ default: mod.DropdownMenu })),
  {
    ssr: false,
  }
);

// Calendar/Date picker (usually heavy)
export const LazyCalendar = dynamic(
  () => import('@/components/ui/calendar'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Code editor or rich text editor (if used)
export const LazyRichEditor = dynamic(
  () => import('@/components/RichEditor'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

/**
 * Lazy load page sections
 */
export const LazyDashboardStats = dynamic(
  () => import('@/components/DashboardStats'),
  {
    loading: LoadingSpinner,
  }
);

export const LazyTransactionsList = dynamic(
  () => import('@/components/TransactionsList'),
  {
    loading: LoadingSpinner,
  }
);

export const LazyKYCForm = dynamic(
  () => import('@/components/KYCForm'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);




