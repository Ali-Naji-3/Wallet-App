'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { clearAuthData, getStoredToken } from '@/lib/auth/storage';
import { toast } from 'sonner';

/**
 * Hook to automatically log out users when they receive money
 * Checks for force_logout notifications periodically
 */
export function useAutoLogout() {
  const router = useRouter();
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const checkForLogoutNotification = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) return;
      
      try {
        isCheckingRef.current = true;
        
        // Check if user is authenticated (sessionStorage is source of truth)
        const token = getStoredToken();
        if (!token) {
          return; // Not logged in, no need to check
        }

        // Fetch notifications
        const response = await apiClient.get('/api/notifications/my');
        const notifications = response.data?.notifications || [];

        // Check for force_logout notification
        const logoutNotification = notifications.find(
          notif => notif.type === 'force_logout' && notif.is_read === 0
        );

        if (logoutNotification) {
          console.log('[Auto Logout] Force logout notification detected:', logoutNotification);
          
          // Mark notification as read (so it doesn't trigger again)
          try {
            await apiClient.post(`/api/notifications/${logoutNotification.id}/read`);
          } catch (err) {
            console.error('[Auto Logout] Failed to mark notification as read:', err);
          }

          // Show notification to user
          toast.info(logoutNotification.body || 'You have received money. Please log in again.', {
            duration: 5000,
          });

          // Clear auth data
          clearAuthData();

          // Redirect to login
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience with error messages
        // Just log for debugging
        if (error.response?.status !== 401) {
          console.error('[Auto Logout] Check failed:', error.message);
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Start checking every 5 seconds
    intervalRef.current = setInterval(checkForLogoutNotification, 5000);

    // Initial check
    checkForLogoutNotification();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);
}

