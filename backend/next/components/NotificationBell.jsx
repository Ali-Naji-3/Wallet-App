'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, FileCheck, AlertCircle, Clock, Send, Download, RefreshCw, TrendingUp, Shield, Volume2, VolumeX, Wifi, WifiOff, Trash2, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notification_sound') !== 'false';
    }
    return true;
  });
  const prevNotificationCountRef = useRef(0);

  // Use real-time notifications hook with SSE
  const {
    notifications,
    unreadCount,
    loading,
    connected,
    error: connectionError,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification,
    clearAll,
    refresh,
  } = useNotifications({
    enabled: true,
    onNewNotification: (notification) => {
      // Show toast for new notification
      toast.success(notification.title, {
        description: notification.body,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            handleNotificationClick(notification);
          },
        },
      });
      
      // Play sound
      playNotificationSound();
    },
    onError: (err) => {
      // Silently ignore connection errors
      if (err.code !== 'ECONNABORTED' && err.name !== 'AbortError') {
        console.error('[NotificationBell] Error:', err);
      }
    },
  });

  // Update count for detecting new notifications
  useEffect(() => {
    if (unreadCount > prevNotificationCountRef.current) {
      // New notification arrived
      prevNotificationCountRef.current = unreadCount;
    }
  }, [unreadCount]);

  // Play notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      // Use Web Audio API for a simple beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  // Toggle sound preference
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notification_sound', newValue.toString());
    toast.success(newValue ? 'Sound enabled 🔊' : 'Sound disabled 🔇');
  };

  // Use the hook's methods
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation(); // Prevent notification click
    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    try {
      await clearAll();
      toast.success('All notifications cleared');
      setOpen(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type) => {
    // Admin-specific icons with blue/purple theme
    switch (type) {
      case 'kyc_submitted':
      case 'kyc_review':
        return <FileCheck className="h-5 w-5 text-blue-500" />;
      case 'transaction_received':
        return <Download className="h-5 w-5 text-blue-400" />;
      case 'transaction_sent':
        return <Send className="h-5 w-5 text-purple-500" />;
      case 'transaction_completed':
        return <CheckCheck className="h-5 w-5 text-blue-500" />;
      case 'exchange':
        return <RefreshCw className="h-5 w-5 text-purple-500" />;
      case 'security_alert':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'balance_low':
        return <TrendingUp className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'kyc_submitted') {
      router.push('/admin/kyc');
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse text-blue-500' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce shadow-lg shadow-blue-500/50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {!connected && typeof window !== 'undefined' && (
            <span className="absolute bottom-1 right-1 h-2 w-2 bg-red-500 rounded-full" title="Disconnected" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`w-96 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} shadow-xl`}
      >
        <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Shield className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Admin Notifications
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  KYC reviews & system alerts
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Connection status */}
                <Badge 
                  variant="outline" 
                  className={`h-5 text-[10px] ${connected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-gray-500/10 text-gray-600 border-gray-500/30'}`}
                >
                  {connected ? <Wifi className="h-2.5 w-2.5 mr-1" /> : <WifiOff className="h-2.5 w-2.5 mr-1" />}
                  {connected ? 'Live' : 'Offline'}
                </Badge>
                {/* Sound toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleSound}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3 w-3 text-amber-500" />
                  ) : (
                    <VolumeX className="h-3 w-3 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className={`text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b transition-all group ${
                  notification.is_read 
                    ? isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'
                    : isDark ? 'border-slate-700 bg-blue-500/10 hover:bg-blue-500/20 border-l-4 border-l-blue-500' : 'border-gray-100 bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    onClick={() => handleNotificationClick(notification)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
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
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-red-500/20 hover:text-red-400' : 'hover:bg-red-100 hover:text-red-600'}`}
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Delete notification"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className={isDark ? 'bg-gray-800' : 'bg-gray-200'} />
            <div className="p-3 space-y-2">
              <div className="flex gap-2">
                <Link href="/admin/kyc" className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full justify-center ${isDark ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300' : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700'}`}
                    onClick={() => setOpen(false)}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Review KYC
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                  onClick={handleClearAll}
                  title="Clear all notifications"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Link href="/admin/notifications">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-center text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setOpen(false)}
                >
                  View All Notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

