'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGetIdentity, useLogout, useIsAuthenticated } from '@refinedev/core';
import { cn } from '@/lib/utils';
import { clearAuthData } from '@/lib/auth/storage';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from '@/components/ThemeToggle';
import UserNotificationBell from '@/components/UserNotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Send,
  Download,
  ArrowLeftRight,
  RefreshCw,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Wallet,
  ChevronDown,
  CreditCard,
  History,
  PiggyBank,
  Shield,
  Loader2,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/wallet/dashboard', icon: LayoutDashboard },
  { name: 'Send Money', href: '/wallet/send', icon: Send },
  { name: 'Receive', href: '/wallet/receive', icon: Download },
  { name: 'Transactions', href: '/wallet/transactions', icon: History },
  { name: 'Exchange', href: '/wallet/exchange', icon: RefreshCw },
  { name: 'Verify Identity', href: '/wallet/kyc', icon: Shield },
];

export default function WalletLayout({ children }) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const pathname = usePathname();
  const router = useRouter();
  
  // CRITICAL: Check if support page FIRST - before any auth hooks
  // This ensures support page is always accessible, even for frozen/suspended users
  const isSupportPage = pathname === '/wallet/support';
  
  // Only run auth hooks if NOT on support page (to avoid unnecessary API calls)
  // But we still need to call hooks conditionally - React rules require hooks to be called consistently
  // So we'll call them but skip their effects for support page
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const { data: authData, isLoading: authLoading } = useIsAuthenticated();
  const { mutate: logout } = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasRedirectedRef = useRef(false);
  
  // SECURITY: Redirect to login if not authenticated (only once)
  // BUT: Skip redirect entirely for support page
  useEffect(() => {
    // CRITICAL: Don't redirect if on support page - support page must be accessible to everyone
    if (isSupportPage) {
      console.log('[Wallet Layout] Support page detected - skipping authentication redirect');
      return; // Skip all redirects for support page
    }
    
    if (!authLoading && !authData?.authenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      console.log('[Wallet Layout] Not authenticated - redirecting to login');
      // Clear any stale data
      clearAuthData();
      // Use window.location for immediate redirect, bypassing React navigation
      window.location.href = '/login';
    }
  }, [authData, authLoading, isSupportPage]);
  
  // SECURITY: Check account status on mount and periodically
  // BUT: Allow access to support page even if account is frozen
  useEffect(() => {
    // Don't check account status if user is on support page
    if (pathname === '/wallet/support') {
      return; // Allow access to support page
    }
    
    const checkAccountStatus = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('fxwallet_token')}`,
          },
        });
        
        if (response.status === 403) {
          // Account suspended
          const data = await response.json();
          clearAuthData();
          sessionStorage.setItem('suspended_message', data.details || 'Your account has been suspended.');
          window.location.href = '/login';
        }
      } catch (error) {
        // Ignore errors - might be network issue
      }
    };
    
    // Check immediately on mount
    checkAccountStatus();
    
    // Check every 5 seconds to catch suspensions quickly
    const interval = setInterval(checkAccountStatus, 5000);
    
    return () => clearInterval(interval);
  }, [pathname]);
  
  // Show loading while checking auth (but skip for support page)
  if (authLoading || identityLoading) {
    // Allow support page to show even during loading - no auth required
    if (isSupportPage) {
      console.log('[Wallet Layout] Support page - rendering without waiting for auth');
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-2 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if not authenticated (except support page)
  // Support page must always be accessible
  if (!authData?.authenticated && !isSupportPage) {
    return null;
  }
  
  // For support page, always render - no authentication required
  if (isSupportPage) {
    console.log('[Wallet Layout] Support page - rendering without authentication requirement');
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Animated Gradient Mesh Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Light mode gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:opacity-0 opacity-100 transition-opacity duration-300" />
        
        {/* Dark mode gradient mesh */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          
          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-noise opacity-5" />
        </div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <Link href="/wallet/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">FXWallet</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Real-time Notifications */}
              <UserNotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                    <Avatar className="h-8 w-8 border border-slate-300 dark:border-slate-600">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-sm font-semibold">
                        {identity?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {identity?.name || 'User'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{identity?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{identity?.email || 'user@example.com'}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet/profile" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet/settings" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

