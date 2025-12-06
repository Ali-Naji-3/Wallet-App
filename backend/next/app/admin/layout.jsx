'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGetIdentity, useLogout } from '@refinedev/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  FileCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Search,
  Coins,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Sliders,
  Globe,
  Image,
  Star,
  Home,
} from 'lucide-react';

// Sidebar menu structure with collapsible sections
const menuSections = [
  { 
    title: null, // No title for main section
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'User Management',
    collapsible: true,
    items: [
      { name: 'Users (Customers & Admins)', href: '/admin/users', icon: Users },
    ],
  },
  {
    title: 'Wallet Management',
    collapsible: true,
    items: [
      { name: 'Wallets', href: '/admin/wallets', icon: Wallet },
      { name: 'Currencies', href: '/admin/currencies', icon: Coins },
      { name: 'Exchange Rates', href: '/admin/exchange-rates', icon: TrendingUp },
    ],
  },
  { 
    title: 'Transactions',
    collapsible: true,
    items: [
      { name: 'All Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
      { name: 'Pending', href: '/admin/transactions/pending', icon: Clock },
      { name: 'Completed', href: '/admin/transactions/completed', icon: CheckCircle },
    ],
  },
  { 
    title: 'KYC & Verification',
    collapsible: true,
    items: [
      { name: 'Pending Reviews', href: '/admin/kyc', icon: AlertCircle },
      { name: 'Verified Users', href: '/admin/kyc/verified', icon: FileCheck },
    ],
  },
  {
    title: 'Communication',
    collapsible: true,
    items: [
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
      { name: 'Support Tickets', href: '/admin/support', icon: HelpCircle },
    ],
  },
  { 
    title: 'Homepage Management',
    collapsible: true,
    items: [
      { name: 'Hero Sliders', href: '/admin/sliders', icon: Image },
      { name: 'Feature Icons', href: '/admin/features', icon: Star },
      { name: 'Site Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

function SidebarSection({ section, pathname, expandedSections, toggleSection }) {
  const isExpanded = expandedSections.includes(section.title);
  const hasActiveItem = section.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));

  if (!section.collapsible) {
    return (
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-l-2 border-amber-500 ml-0 pl-[10px]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => toggleSection(section.title)}
          className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
          hasActiveItem ? 'text-amber-600 dark:text-amber-500' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        )}
      >
        <span>{section.title}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="space-y-1 ml-2">
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: identity } = useGetIdentity();
  const { mutate: logout } = useLogout();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState([
    'User Management',
    'Wallet Management',
    'Transactions',
  ]);

  const toggleSection = (title) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 transition-colors duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                <Wallet className="h-5 w-5 text-gray-900" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">FXWallet</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {menuSections.map((section, idx) => (
              <SidebarSection
                key={section.title || idx}
                section={section}
                pathname={pathname}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
              />
            ))}
          </nav>

          {/* User section at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  <Avatar className="h-8 w-8 border border-gray-300 dark:border-gray-700">
                    <AvatarFallback className="bg-amber-500 text-gray-900 font-semibold text-sm">
                      {identity?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {identity?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {identity?.email || 'admin@admin.com'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg px-4 lg:px-6 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full"></span>
            </Button>
            
            {/* User info (desktop) */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-300 dark:border-gray-700">
              <Avatar className="h-8 w-8 border border-gray-300 dark:border-gray-700">
                <AvatarFallback className="bg-amber-500 text-gray-900 font-semibold text-sm">
                  {identity?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {identity?.name || 'Admin'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
