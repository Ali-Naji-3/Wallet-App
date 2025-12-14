'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Plus,
  Coins,
} from 'lucide-react';

// Format number with commas
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US');
};

// Format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  const num = Number(amount);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

// Animated Stat Card Component
function StatCard({ title, value, icon: Icon, color, isLoading, trend, change }) {
  const colorClasses = {
    amber: {
      bg: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10',
      icon: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10',
      icon: 'text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10',
      icon: 'text-blue-400',
      border: 'border-blue-500/20',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10',
      icon: 'text-purple-400',
      border: 'border-purple-500/20',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  if (isLoading) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800/50 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const glowColor = color === 'amber' ? 'rgba(245,158,11,0.15)' :
                    color === 'emerald' ? 'rgba(16,185,129,0.15)' :
                    color === 'blue' ? 'rgba(59,130,246,0.15)' :
                    'rgba(168,85,247,0.15)';

  return (
    <Card 
      className={`
        bg-gray-900/80 backdrop-blur-sm border ${colors.border} rounded-2xl overflow-hidden
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl
        group cursor-pointer
        opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]
      `}
      style={{
        '--glow': glowColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <CardContent className="p-6 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className={`
          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
          ${colors.bg}
        `} />
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold text-white transition-all duration-300 group-hover:scale-105">
              {value}
            </p>
            {trend && change && (
              <div className="flex items-center gap-1.5 pt-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400 animate-pulse" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-red-400 rotate-180 animate-pulse" />
                )}
                <span className={`text-sm font-semibold ${
                  trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {change}
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          
          {/* Icon with animated background */}
          <div className={`
            relative p-4 rounded-xl ${colors.bg} ${colors.border} border
            transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
          `}>
            <Icon className={`h-6 w-6 ${colors.icon} transition-transform duration-300`} />
            {/* Pulsing glow effect */}
            <div className={`
              absolute inset-0 rounded-xl ${colors.bg}
              animate-pulse opacity-50
            `} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Background Animation Component
function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-amber-900/20" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '10s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '12s', animationDelay: '4s' }} />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

// Credit User Wallet Modal Component
function CreditWalletModal() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (open && users.length === 0) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiClient.get('/api/admin/users?limit=100');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId || !currency || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post('/api/admin/credit-wallet', {
        userId: parseInt(selectedUserId),
        currency,
        amount: numAmount,
      });

      const userEmail = selectedUser?.email || 'user';
      
      // Enhanced success message
      toast.success(
        `Successfully credited ${numAmount} ${currency} to ${userEmail}!`,
        {
          description: `User can view their updated balance at: /wallet/dashboard?currency=${currency}`,
          duration: 8000,
        }
      );
      
      // Reset form
      setSelectedUserId('');
      setCurrency('USD');
      setAmount('');
      setOpen(false);
      
      // Log for debugging
      console.log(`[Admin] ✅ Credited ${numAmount} ${currency} to user ID ${selectedUserId} (${userEmail})`);
      console.log(`[Admin] 🔗 User should visit: /wallet/dashboard?currency=${currency}`);
    } catch (err) {
      console.error('Failed to credit wallet:', err);
      toast.error(err.response?.data?.message || 'Failed to credit wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Credit User Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-5 w-5 text-emerald-400" />
            Add Test Balance
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Credit a user's wallet with test money for demo purposes. This is FAKE money for testing only.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user" className="text-sm font-medium text-gray-300">
              Select User
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder={loadingUsers ? "Loading users..." : "Choose a user"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)} className="text-white hover:bg-gray-700">
                    {user.email} {user.full_name ? `(${user.full_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUser && (
              <p className="text-xs text-gray-500">
                ID: {selectedUser.id} • Status: {selectedUser.is_active ? '✅ Active' : '❌ Inactive'}
              </p>
            )}
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium text-gray-300">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="USD" className="text-white hover:bg-gray-700">
                  💵 USD - US Dollar
                </SelectItem>
                <SelectItem value="EUR" className="text-white hover:bg-gray-700">
                  💶 EUR - Euro
                </SelectItem>
                <SelectItem value="LBP" className="text-white hover:bg-gray-700">
                  🇱🇧 LBP - Lebanese Pound
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-300">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder={currency === 'LBP' ? '1000000' : '100.00'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              required
            />
            <p className="text-xs text-gray-500">
              This amount will be ADDED to the user's existing {currency} balance
            </p>
          </div>

          {/* Preview */}
          {selectedUser && amount && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-sm text-emerald-400 font-medium mb-1">Preview:</p>
              <p className="text-white">
                Add <span className="font-bold text-emerald-400">{Number(amount).toLocaleString()} {currency}</span> to <span className="font-bold">{selectedUser.email}</span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUserId || !amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Credit Wallet
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiClient.get('/api/admin/stats');
      const data = response.data;

      // Transform API data to dashboard format
      const transformedStats = {
        totalUsers: data.users?.totalUsers || 0,
        activeWallets: data.wallets?.activeWallets || 0,
        totalTransactions: data.transactions?.totalTransactions || 0,
        totalVolume: data.transactions?.totalVolume || 0,
        // Calculate trends (mock for now - you can add real trend calculation)
        trends: {
          users: 'up',
          wallets: 'up',
          transactions: 'up',
          volume: 'up',
        },
        changes: {
          users: '+12.5%',
          wallets: '+8.2%',
          transactions: '+23.1%',
          volume: '+15.3%',
        },
      };

      setStats(transformedStats);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(true);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [fetchStats]);

  const statsConfig = [
    {
      title: 'Total Users',
      value: formatNumber(stats?.totalUsers),
      icon: Users,
      color: 'amber',
      trend: stats?.trends?.users,
      change: stats?.changes?.users,
    },
    {
      title: 'Active Wallets',
      value: formatNumber(stats?.activeWallets),
      icon: Wallet,
      color: 'emerald',
      trend: stats?.trends?.wallets,
      change: stats?.changes?.wallets,
    },
    {
      title: 'Transactions',
      value: formatNumber(stats?.totalTransactions),
      icon: ArrowLeftRight,
      color: 'blue',
      trend: stats?.trends?.transactions,
      change: stats?.changes?.transactions,
    },
    {
      title: 'Total Volume',
      value: formatCurrency(stats?.totalVolume),
      icon: DollarSign,
      color: 'purple',
      trend: stats?.trends?.volume,
      change: stats?.changes?.volume,
    },
  ];

  return (
    <div className="relative min-h-screen p-6 space-y-6">
      {/* Background Animation */}
      <BackgroundAnimation />

      {/* Page Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Welcome back! Here's what's happening.
            {lastUpdate && (
              <span className="ml-2 text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreditWalletModal />
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-gray-800/50 hover:bg-gray-800 border border-gray-700
              text-gray-300 hover:text-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="relative z-10 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {statsConfig.map((stat, index) => (
          <div
            key={stat.title}
            style={{ animationDelay: `${index * 100}ms` }}
            className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              isLoading={loading}
              trend={stat.trend}
              change={stat.change}
            />
          </div>
        ))}
      </div>

      {/* Additional Info Cards */}
      {!loading && stats && (
        <div className="grid gap-6 md:grid-cols-3 relative z-10">
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">24h Transactions</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(stats.totalTransactions)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">New Users (7d)</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(stats.totalUsers)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800/50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/20">
                  <DollarSign className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Total Balance</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(stats.totalVolume)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
