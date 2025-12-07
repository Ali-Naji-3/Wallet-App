'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Memoized stat card component to prevent unnecessary re-renders
 */
export const StatCard = memo(function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  iconColor = 'text-blue-500',
  bgColor = 'bg-blue-500/10',
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 transition-transform hover:scale-105">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * Memoized table row component
 */
export const TableRow = memo(function TableRow({ children, onClick, className = '' }) {
  return (
    <tr 
      onClick={onClick}
      className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
});

/**
 * Loading skeleton for table
 */
export const TableSkeleton = memo(function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-gray-800">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
});

/**
 * Loading skeleton for cards grid
 */
export const CardsGridSkeleton = memo(function CardsGridSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
});

/**
 * Memoized notification item
 */
export const NotificationItem = memo(function NotificationItem({ 
  notification, 
  onClick, 
  onMarkRead,
  isDark = true 
}) {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-3 border-b cursor-pointer transition-colors ${
        notification.is_read 
          ? isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'
          : isDark ? 'border-gray-800 bg-amber-500/10 hover:bg-amber-500/20' : 'border-gray-100 bg-amber-50 hover:bg-amber-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="h-2 w-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {notification.body}
          </p>
        </div>
      </div>
    </div>
  );
});

