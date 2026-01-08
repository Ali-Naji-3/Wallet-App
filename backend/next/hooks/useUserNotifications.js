'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '@/lib/api/client';

/**
 * Custom hook for REGULAR USER real-time notifications using SSE
 * Works for wallet users (not just admins)
 */
export function useUserNotifications(options = {}) {
  const { 
    enabled = true,
    onNewNotification,
    onError,
  } = options;
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(false);
  
  // Fetch initial notifications
  const fetchInitialNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/notifications/my', {
        timeout: 5000, // 5 second timeout
      });
      setNotifications(data.notifications || []);
      
      // Count unread
      const unread = (data.notifications || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
      setLoading(false);
    } catch (err) {
      // Ignore timeout/abort errors - SSE will provide data
      if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
        setLoading(false);
        return;
      }
      console.error('[useUserNotifications] Error:', err);
      setError(err.message);
      setLoading(false);
      if (onError) onError(err);
    }
  }, [onError]);
  
  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('[useUserNotifications] Connection already in progress, skipping');
      return;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    isConnectingRef.current = true;
    
    const token = localStorage.getItem('fxwallet_token');
    if (!token) {
      console.warn('[useUserNotifications] No token found');
      isConnectingRef.current = false;
      return;
    }
    
    try {
      const url = new URL('/api/notifications/stream', window.location.origin);
      url.searchParams.set('token', token);
      
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('[useUserNotifications] ✅ SSE connected');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('[useUserNotifications]', data.message);
              break;
              
            case 'initial':
              // Initial data from SSE - use it immediately
              if (data.notifications) {
                setNotifications(data.notifications);
                setLoading(false);
              }
              setUnreadCount(data.unreadCount || 0);
              break;
              
            case 'new_notifications':
              console.log('[useUserNotifications] 🔔 New notifications:', data.notifications.length);
              
              // PRIORITY 1: Check for admin_credit notifications (force logout for data refresh)
              const adminCreditNotif = data.notifications.find(n => n.type === 'admin_credit');
              if (adminCreditNotif && typeof window !== 'undefined') {
                console.log('[useUserNotifications] 💰 Admin credit detected - forcing logout for data refresh');
                
                // Show alert
                if (window.alert) {
                  window.alert(adminCreditNotif.title + '\n\n' + adminCreditNotif.body);
                }
                
                // Force logout and redirect to login
                localStorage.removeItem('fxwallet_token');
                localStorage.removeItem('fxwallet_user');
                localStorage.removeItem('user_role');
                
                setTimeout(() => {
                  window.location.href = '/login?message=account_credited';
                }, 500);
                
                return; // Stop processing
              }
              
              // PRIORITY 2: Check for suspension notifications
              const suspensionNotif = data.notifications.find(
                n => n.type === 'kyc_rejected' && (n.title?.includes('Account Suspended') || n.body?.includes('account has been suspended'))
              );
              
              if (suspensionNotif) {
                // Handle suspension immediately - process this notification first
                if (onNewNotification) {
                  onNewNotification(suspensionNotif);
                }
                // Don't process other notifications if account is suspended
                return;
              }
              
              // Add new notifications
              setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const newOnes = data.notifications.filter(n => !existingIds.has(n.id));
                return [...newOnes, ...prev].slice(0, 50);
              });
              
              setUnreadCount(data.unreadCount || 0);
              
              // Trigger callback for each new notification
              if (onNewNotification && data.notifications.length > 0) {
                data.notifications.forEach(notif => onNewNotification(notif));
              }
              break;
              
            case 'heartbeat':
              // Connection alive
              break;
              
            case 'error':
              console.error('[useUserNotifications] Error:', data.message);
              setError(data.message);
              if (data.code === 'UNAUTHORIZED') {
                eventSource.close();
              }
              break;
          }
        } catch (err) {
          console.error('[useUserNotifications] Parse error:', err);
        }
      };
      
      eventSource.onerror = (err) => {
        console.error('[useUserNotifications] Connection error');
        setConnected(false);
        isConnectingRef.current = false;
        
        // Don't reconnect if component is unmounted
        if (!mountedRef.current) {
          console.log('[useUserNotifications] Component unmounted, not reconnecting');
          return;
        }
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          console.log(`[useUserNotifications] Reconnecting in ${delay}ms (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
      
    } catch (err) {
      console.error('[useUserNotifications] Connection error:', err);
      setError(err.message);
      isConnectingRef.current = false;
      if (onError) onError(err);
    }
  }, [enabled, onNewNotification, onError]);
  
  // Disconnect
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnected(false);
  }, []);
  
  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiClient.post('/api/notifications/my', { notificationId });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useUserNotifications] Error marking as read:', err);
      throw err;
    }
  }, []);
  
  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.post('/api/notifications/my', { markAllRead: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[useUserNotifications] Error marking all as read:', err);
      throw err;
    }
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiClient.delete(`/api/notifications/my?id=${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useUserNotifications] Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await apiClient.delete('/api/notifications/my?clearAll=true');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[useUserNotifications] Error clearing all notifications:', err);
      throw err;
    }
  }, []);
  
  // Refresh
  const refresh = useCallback(async () => {
    await fetchInitialNotifications();
  }, [fetchInitialNotifications]);
  
  // Initialize - SINGLE connection only, after page is fully loaded
  useEffect(() => {
    if (!enabled) return;
    
    mountedRef.current = true;
    
    // Wait for page to fully load and hydrate before connecting
    // This prevents interruptions during SSR/hydration
    const initTimeout = setTimeout(() => {
      if (mountedRef.current && !isConnectingRef.current) {
        connect();
      }
    }, 500);
    
    // Fetch initial data as fallback
    const fetchTimeout = setTimeout(() => {
      if (mountedRef.current && notifications.length === 0) {
        fetchInitialNotifications().catch(() => {
          // Silently fail - SSE will provide data
        });
      }
    }, 1500);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
      clearTimeout(fetchTimeout);
      disconnect();
    };
  }, [enabled]); // Only depend on enabled
  
  return {
    notifications,
    unreadCount,
    loading,
    connected,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
    reconnect: connect,
  };
}

