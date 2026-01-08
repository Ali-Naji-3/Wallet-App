'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Search, Filter, Eye, RefreshCw, DollarSign, Euro, Coins } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import CreditFundsPanel from '@/components/admin/CreditFundsPanel';

const getCurrencyIcon = (currency) => {
  switch (currency) {
    case 'EUR':
      return Euro;
    case 'USD':
    case 'GBP':
    case 'LBP':
    default:
      return DollarSign;
  }
};

const formatBalance = (amount, currency) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  
  switch (currency) {
    case 'LBP':
      return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ل.ل`;
    case 'EUR':
      return `€${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'GBP':
      return `£${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'JPY':
      return `¥${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'USD':
    default:
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, frozen: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWallets = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiClient.get('/api/admin/wallets');
      const walletsData = Array.isArray(response.data) ? response.data : [];
      
      // Transform data to include user info
      const transformedWallets = walletsData.map((wallet) => ({
        id: wallet.id,
        walletId: wallet.id,
        userId: wallet.user_id,
        user: wallet.user_name || wallet.name || 'Unknown User',
        email: wallet.user_email || wallet.email || 'N/A',
        currency: wallet.currency_code,
        balance: parseFloat(wallet.balance || 0),
        status: wallet.status || 'active',
        address: wallet.address,
      }));

      setWallets(transformedWallets);

      // Calculate stats
      const totalWallets = transformedWallets.length;
      const activeWallets = transformedWallets.filter(w => w.status === 'active').length;
      const frozenWallets = transformedWallets.filter(w => w.status === 'frozen').length;

      setStats({
        total: totalWallets,
        active: activeWallets,
        frozen: frozenWallets,
      });
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreditSuccess = (data) => {
    console.log('[WalletsPage] Credit success callback, data:', data);
    toast.success('Refreshing wallet data...');
    // Don't refresh if we're about to navigate away
    // fetchWallets(true);
  };

  const filteredWallets = wallets.filter((wallet) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      wallet.email?.toLowerCase().includes(query) ||
      wallet.user?.toLowerCase().includes(query) ||
      wallet.currency?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallets</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage user wallets and credit test funds</p>
        </div>
        <Button
          onClick={() => fetchWallets(true)}
          disabled={isRefreshing}
          className="bg-gray-800 hover:bg-gray-900 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Wallets</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Active Wallets</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
      <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Frozen Wallets</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.frozen}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Test Funds Panel */}
      <CreditFundsPanel
        onSuccess={handleCreditSuccess}
        redirectToCustomerOnSuccess
        redirectDelayMs={400}
      />

      {/* Table */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search wallets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredWallets.length} {filteredWallets.length === 1 ? 'wallet' : 'wallets'}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Currency</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Balance</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="p-4">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-20" />
                      </td>
                    </tr>
                  ))
                ) : filteredWallets.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <Coins className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No wallets found matching your search' : 'No wallets found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  // Actual wallet data
                  filteredWallets.map((wallet) => {
                    const Icon = getCurrencyIcon(wallet.currency);
                  return (
                      <tr key={`${wallet.userId}-${wallet.currency}`} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{wallet.user}</p>
                          <p className="text-gray-500 dark:text-gray-500 text-sm">{wallet.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{wallet.currency}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-medium">
                          {formatBalance(wallet.balance, wallet.currency)}
                      </td>
                      <td className="p-4">
                        <Badge className={
                          wallet.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                        }>
                          {wallet.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              title="View wallet details"
                            >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
