'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { clearAuthData, getStoredToken } from '@/lib/auth/storage';

/**
 * Custom hook for real-time notifications using Server-Sent Events (SSE)
 * Automatically reconnects on disconnect and handles errors gracefully
 */
export function useNotifications(options = {}) {
  const { 
    enabled = true,
    scope = 'auto', // 'auto' | 'admin' | 'user'
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

  // Determine which API namespace to use.
  // - admin: /api/admin/notifications + /api/admin/notifications/stream
  // - user:  /api/notifications/my     + /api/notifications/stream
  const resolveScope = useCallback(() => {
    if (scope === 'admin' || scope === 'user') return scope;
    if (typeof window === 'undefined') return 'user';
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'user';
  }, [scope]);

  const getEndpoints = useCallback(() => {
    const resolved = resolveScope();
    if (resolved === 'admin') {
      return {
        list: '/api/admin/notifications',
        stream: '/api/admin/notifications/stream',
        mutate: '/api/admin/notifications',
      };
    }
    return {
      list: '/api/notifications/my',
      stream: '/api/notifications/stream',
      mutate: '/api/notifications/my',
    };
  }, [resolveScope]);
  
  // Fetch initial notifications
  const fetchInitialNotifications = useCallback(async () => {
    try {
      const endpoints = getEndpoints();
      const { data } = await apiClient.get(endpoints.list, {
        timeout: 5000, // 5 second timeout
      });
      const list = data?.notifications || [];
      // User endpoint doesn't return unreadCount; compute it locally.
      const computedUnread = typeof data?.unreadCount === 'number'
        ? data.unreadCount
        : list.reduce((acc, n) => acc + (n?.is_read ? 0 : 1), 0);
      setNotifications(list);
      setUnreadCount(computedUnread);
      setLoading(false);
    } catch (err) {
      // Ignore timeout/abort errors - SSE will provide data
      if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
        setLoading(false);
        return;
      }
      console.error('[useNotifications] Error fetching initial notifications:', err);
      setError(err.message);
      setLoading(false);
      if (onError) onError(err);
    }
  }, [onError, getEndpoints]);
  
  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('[useNotifications] Connection already in progress, skipping');
      return;
    }
    
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    isConnectingRef.current = true;
    
    // Use session-scoped token so each tab's SSE connection is tied to its own session.
    const token = getStoredToken();
    if (!token) {
      console.warn('[useNotifications] No token found, skipping SSE connection');
      isConnectingRef.current = false;
      return;
    }
    
    try {
      // Create EventSource with token in query param (SSE doesn't support custom headers easily)
      const endpoints = getEndpoints();
      const url = new URL(endpoints.stream, window.location.origin);
      url.searchParams.set('token', token);
      
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;
      
        eventSource.onopen = () => {
          console.log('[useNotifications] SSE connection opened');
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
                  console.log('[useNotifications] Connected:', data.message);
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
              // Add new notifications to the list
              setNotifications(prev => {
                // Avoid duplicates
                const existingIds = new Set(prev.map(n => n.id));
                const newOnes = data.notifications.filter(n => !existingIds.has(n.id));
                return [...newOnes, ...prev].slice(0, 50); // Keep latest 50
              });
              
              setUnreadCount(data.unreadCount || 0);
              
              // IMPORTANT: Check for admin_credit notifications
              // These require immediate logout to refresh wallet data
              const hasAdminCredit = data.notifications.some(n => n.type === 'admin_credit');
              if (hasAdminCredit && resolveScope() === 'user') {
                console.log('[useNotifications] Admin credit detected - forcing logout for data refresh');
                
                // Show notification before logout
                const creditNotif = data.notifications.find(n => n.type === 'admin_credit');
                if (creditNotif && typeof window !== 'undefined') {
                  // Use toast/alert to show message
                  if (window.alert) {
                    window.alert(creditNotif.title + '\n\n' + creditNotif.body);
                  }
                  
                  // Force logout and redirect to login (fail-closed on session change)
                  clearAuthData();
                  
                  setTimeout(() => {
                    window.location.href = '/login?message=account_credited';
                  }, 500);
                }
                return; // Don't process other callbacks
              }
              
              // Call callback if provided
              if (onNewNotification && data.notifications.length > 0) {
                data.notifications.forEach(notif => onNewNotification(notif));
              }
              break;
              
            case 'heartbeat':
              // Connection is alive
              break;
              
            case 'error':
              console.error('[useNotifications] SSE error:', data.message);
              setError(data.message);
              if (onError) onError(new Error(data.message));
              
              // Close on auth errors
              if (data.code === 'UNAUTHORIZED') {
                eventSource.close();
              }
              break;
              
            default:
              console.log('[useNotifications] Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('[useNotifications] Error parsing SSE message:', err);
        }
      };
      
      eventSource.onerror = (err) => {
        console.error('[useNotifications] SSE connection error:', err);
        setConnected(false);
        isConnectingRef.current = false;
        
        // Don't reconnect if component is unmounted
        if (!mountedRef.current) {
          console.log('[useNotifications] Component unmounted, not reconnecting');
          return;
        }
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
          
          console.log(`[useNotifications] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[useNotifications] Max reconnect attempts reached');
          setError('Connection lost. Please refresh the page.');
          if (onError) onError(new Error('Connection lost'));
        }
      };
      
      } catch (err) {
        console.error('[useNotifications] Error creating EventSource:', err);
        setError(err.message);
        isConnectingRef.current = false;
        if (onError) onError(err);
      }
    }, [enabled, onNewNotification, onError, getEndpoints]);
  
  // Disconnect from SSE stream
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
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const endpoints = getEndpoints();
      await apiClient.post(endpoints.mutate, { notificationId });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      throw err;
    }
  }, [getEndpoints]);
  
  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const endpoints = getEndpoints();
      await apiClient.post(endpoints.mutate, { markAllRead: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      throw err;
    }
  }, [getEndpoints]);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const endpoints = getEndpoints();
      await apiClient.delete(`${endpoints.mutate}?id=${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useNotifications] Error deleting notification:', err);
      throw err;
    }
  }, [getEndpoints]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const endpoints = getEndpoints();
      await apiClient.delete(`${endpoints.mutate}?clearAll=true`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error clearing all notifications:', err);
      throw err;
    }
  }, [getEndpoints]);
  
  // Refresh notifications manually
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
  }, [enabled]); // Only depend on enabled, not the functions
  
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




