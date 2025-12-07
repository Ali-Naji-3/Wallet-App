'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '@/lib/api/client';

/**
 * Custom hook for real-time notifications using Server-Sent Events (SSE)
 * Automatically reconnects on disconnect and handles errors gracefully
 */
export function useNotifications(options = {}) {
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
  
  // Fetch initial notifications
  const fetchInitialNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/admin/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setLoading(false);
    } catch (err) {
      console.error('[useNotifications] Error fetching initial notifications:', err);
      setError(err.message);
      setLoading(false);
      if (onError) onError(err);
    }
  }, [onError]);
  
  // Connect to SSE stream
  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const token = localStorage.getItem('fxwallet_token');
    if (!token) {
      console.warn('[useNotifications] No token found, skipping SSE connection');
      return;
    }
    
    try {
      // Create EventSource with token in query param (SSE doesn't support custom headers easily)
      const url = new URL('/api/admin/notifications/stream', window.location.origin);
      url.searchParams.set('token', token);
      
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('[useNotifications] SSE connection opened');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('[useNotifications] Connected:', data.message);
              break;
              
            case 'initial':
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
      if (onError) onError(err);
    }
  }, [enabled, onNewNotification, onError]);
  
  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
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
      await apiClient.post('/api/admin/notifications', { notificationId });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      throw err;
    }
  }, []);
  
  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.post('/api/admin/notifications', { markAllRead: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      throw err;
    }
  }, []);
  
  // Refresh notifications manually
  const refresh = useCallback(async () => {
    await fetchInitialNotifications();
  }, [fetchInitialNotifications]);
  
  // Initialize
  useEffect(() => {
    if (enabled) {
      fetchInitialNotifications();
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, fetchInitialNotifications, connect, disconnect]);
  
  return {
    notifications,
    unreadCount,
    loading,
    connected,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
    reconnect: connect,
  };
}

