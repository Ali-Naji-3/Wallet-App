'use client';

import { cn } from '@/lib/utils';

/**
 * Shimmer Skeleton Component with CSS animation
 */
export function ShimmerSkeleton({ 
  className, 
  width = '100%', 
  height = '1rem',
  rounded = true,
  ...props 
}) {
  return (
    <div
      className={cn(
        'shimmer-skeleton bg-gray-200 dark:bg-slate-700',
        rounded && 'rounded',
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

/**
 * Card Skeleton with shimmer effect
 */
export function CardSkeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-6 space-y-4',
        className
      )}
      {...props}
    >
      <ShimmerSkeleton height="1.5rem" width="60%" />
      <ShimmerSkeleton height="2.5rem" width="100%" />
      <ShimmerSkeleton height="1rem" width="40%" />
    </div>
  );
}

/**
 * Balance Card Skeleton
 */
export function BalanceCardSkeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 relative overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="space-y-4">
        <ShimmerSkeleton height="1rem" width="40%" className="bg-white/20" />
        <ShimmerSkeleton height="3rem" width="70%" className="bg-white/30" />
        <ShimmerSkeleton height="1rem" width="50%" className="bg-white/20" />
      </div>
    </div>
  );
}

