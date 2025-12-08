'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, FileCheck, AlertCircle, Send, Download, RefreshCw, Shield, Volume2, VolumeX, Wifi, WifiOff, TrendingUp, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { clearAuthData } from '@/lib/auth/storage';

export default function UserNotificationBell() {
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

  // Use real-time SSE notifications
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
  } = useUserNotifications({
    enabled: true,
    onNewNotification: (notification) => {
      // IMMEDIATE ACTION: If account is suspended, log out immediately
      if (notification.type === 'kyc_rejected' && notification.title?.includes('Account Suspended')) {
        // Clear auth data immediately
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fxwallet_token');
          localStorage.removeItem('fxwallet_user');
          sessionStorage.setItem('suspended_message', notification.body || 'Your account has been suspended due to KYC rejection.');
          
          // Show suspension message
          toast.error('Account Suspended', {
            description: notification.body || 'Your account has been suspended. Please contact support.',
            duration: 10000,
          });
          
          // Immediately redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
          
          return; // Don't show normal notification
        }
      }
      
      // Show toast with action button for normal notifications
      toast.success(notification.title, {
        description: notification.body,
        duration: 6000,
        action: notification.type?.includes('kyc') ? {
          label: 'View KYC',
          onClick: () => {
            router.push('/wallet/kyc');
          },
        } : {
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
        console.error('[UserNotificationBell] Error:', err);
      }
    },
  });

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notification_sound', newValue.toString());
    toast.success(newValue ? 'Sound enabled 🔊' : 'Sound disabled 🔇');
  };

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
    // Customer-specific icons with emerald/cyan theme
    switch (type) {
      case 'kyc_submitted':
      case 'kyc_review':
      case 'kyc_approved':
        return <FileCheck className="h-5 w-5 text-emerald-500" />;
      case 'kyc_rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'transaction_received':
        return <Download className="h-5 w-5 text-emerald-500" />;
      case 'transaction_sent':
        return <Send className="h-5 w-5 text-cyan-500" />;
      case 'transaction_completed':
        return <CheckCheck className="h-5 w-5 text-emerald-500" />;
      case 'exchange':
        return <RefreshCw className="h-5 w-5 text-cyan-500" />;
      case 'security_alert':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'balance_low':
        return <TrendingUp className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-emerald-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on type
    switch (notification.type) {
      case 'kyc_submitted':
      case 'kyc_review':
      case 'kyc_approved':
      case 'kyc_rejected':
        router.push('/wallet/kyc');
        break;
      case 'transaction_received':
      case 'transaction_sent':
      case 'transaction_completed':
        router.push('/wallet/transactions');
        break;
      default:
        router.push('/wallet/dashboard');
    }
    
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse text-emerald-500' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce shadow-lg shadow-emerald-500/50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {!connected && typeof window !== 'undefined' && (
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" title="Reconnecting..." />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`w-96 max-h-[600px] ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} shadow-xl`}
      >
        <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20' : 'border-gray-200 bg-gradient-to-r from-emerald-50 to-cyan-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <Bell className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  My Notifications
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Account updates & transactions
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={`h-5 text-[10px] px-1.5 ${connected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 animate-pulse' : 'bg-gray-500/10 text-gray-600 border-gray-500/30'}`}
                >
                  {connected ? <Wifi className="h-2.5 w-2.5 mr-1" /> : <WifiOff className="h-2.5 w-2.5 mr-1" />}
                  {connected ? 'Live' : 'Offline'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleSound}
                  title={soundEnabled ? 'Disable sound' : 'Enable sound'}
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
                className={`text-xs h-7 ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-500 mb-2" />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>No notifications</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b cursor-pointer transition-all ${
                  notification.is_read 
                    ? isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'
                    : isDark ? 'border-slate-700 bg-emerald-500/10 hover:bg-emerald-500/20 border-l-4 border-l-emerald-500' : 'border-gray-100 bg-emerald-50 hover:bg-emerald-100 border-l-4 border-l-emerald-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 ${!notification.is_read ? 'animate-pulse' : ''}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="h-2 w-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5 animate-ping" />
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-2`}>
                      {notification.body}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 justify-center ${isDark ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                      onClick={() => {
                        router.push('/wallet/kyc');
                        setOpen(false);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Check KYC
                    </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-center text-xs ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => {
                      router.push('/wallet/transactions');
                      setOpen(false);
                    }}
                  >
                    View Transactions
                  </Button>
                </div>
              </>
            )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

