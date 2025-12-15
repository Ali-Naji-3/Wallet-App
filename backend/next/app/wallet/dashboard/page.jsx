'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  Send,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Euro,
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  BarChart3,
  Home,
} from 'lucide-react';

import TransactionAnalytics from '@/components/TransactionAnalytics';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

// --- UI config (static) ---
const WALLET_UI = {
  USD: {
    currency: 'USD',
    symbol: '$',
    change: '+2.5%',
    trend: 'up',
    icon: DollarSign,
    cardType: 'PLATINUM',
    cardNumber: '4532',
    cardColor: 'from-slate-700 via-slate-600 to-slate-800',
    textColor: 'text-white',
  },
  EUR: {
    currency: 'EUR',
    symbol: '€',
    change: '+1.8%',
    trend: 'up',
    icon: Euro,
    cardType: 'GOLD',
    cardNumber: '6852',
    cardColor: 'from-amber-600 via-amber-500 to-yellow-600',
    textColor: 'text-white',
  },
  LBP: {
    currency: 'LBP',
    symbol: 'ل.ل',
    change: '+0.1%',
    trend: 'up',
    icon: DollarSign,
    cardType: 'BLACK',
    cardNumber: '3117',
    cardColor: 'from-gray-900 via-gray-800 to-black',
    textColor: 'text-white',
  },
};

const quickActions = [
  { name: 'Send', href: '/wallet/send', icon: Send, color: 'bg-blue-500' },
  { name: 'Receive', href: '/wallet/receive', icon: Download, color: 'bg-emerald-500' },
  { name: 'Exchange', href: '/wallet/exchange', icon: RefreshCw, color: 'bg-purple-500' },
  { name: 'Add Card', href: '/wallet/cards', icon: CreditCard, color: 'bg-amber-500' },
];

// Exchange rates to USD (for total only)
const exchangeRates = {
  USD: 1,
  EUR: 1.09,
  LBP: 0.0000112,
};

// Sample chart data (UI only)
const chartData = [24.2, 24.8, 24.5, 25.1, 25.3, 25.8, 26.4];

// Helpers
function safeNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function formatTxTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function mapTxToRecent(tx) {
  // Map database transaction types: 'exchange' or 'transfer'
  const type = tx.type === 'exchange' ? 'exchange' : tx.type === 'transfer' ? 'sent' : 'exchange';

  const name = tx.type === 'exchange' 
    ? (tx.from_currency && tx.to_currency ? `${tx.from_currency} → ${tx.to_currency}` : 'Exchange')
    : (tx.note || 'Transfer');

  const fromCur = tx.from_currency || '';
  const fromAmt = parseFloat(tx.from_amount) || 0;
  const toCur = tx.to_currency || '';
  const toAmt = parseFloat(tx.to_amount) || 0;

  let amountText = '';
  if (tx.type === 'exchange') {
    // Show both currencies for exchange
    amountText = `${fromCur} ${fromAmt.toFixed(2)} → ${toCur} ${toAmt.toFixed(2)}`;
  } else if (tx.type === 'transfer') {
    // Show sent amount with minus sign
    amountText = `-${WALLET_UI[fromCur]?.symbol || ''}${fromAmt.toFixed(2)}`;
  }

  return {
    id: tx.id,
    type,
    name,
    amount: amountText,
    time: formatTxTime(tx.created_at),
    status: tx.status || 'completed',
  };
}

export default function WalletDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creditedCurrency = searchParams.get('currency'); // e.g., ?currency=USD
  
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [heroCardIndex, setHeroCardIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [walletBalances, setWalletBalances] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const balancesUrl = ENDPOINTS?.WALLETS?.BALANCES || '/api/wallets/balances';
    const txUrl = ENDPOINTS?.TRANSACTIONS?.MY || '/api/transactions/my';

    console.log('[Dashboard] Fetching balances from:', balancesUrl);
    console.log('[Dashboard] Fetching transactions from:', txUrl);

    const [bRes, tRes] = await Promise.all([
      apiClient.get(balancesUrl),
      apiClient.get(txUrl),
    ]);

    const balancesRaw = bRes?.data?.balances || [];
    const txRaw = tRes?.data?.transactions || [];

    console.log('[Dashboard] Balances received:', balancesRaw.length);
    console.log('[Dashboard] Transactions received:', txRaw.length);

    const mappedBalances = balancesRaw
      .map((w) => {
        const ui = WALLET_UI[w.currency] || {
          currency: w.currency,
          symbol: w.currency,
          change: '+0.0%',
          trend: 'up',
          icon: DollarSign,
          cardType: 'STANDARD',
          cardNumber: '0000',
          cardColor: 'from-slate-700 via-slate-600 to-slate-800',
          textColor: 'text-white',
        };

        return {
          ...ui,
          balance: safeNumber(w.balance),
        };
      })
      .sort((a, b) => {
        const order = { USD: 1, EUR: 2, LBP: 3 };
        return (order[a.currency] || 99) - (order[b.currency] || 99);
      });

    const mappedTx = txRaw.slice(0, 5).map(mapTxToRecent);

    setWalletBalances(mappedBalances);
    setRecentTransactions(mappedTx);

    console.log('[Dashboard] Mapped balances:', mappedBalances.map(b => ({ currency: b.currency, balance: b.balance })));

    // Activate currency card based on query param or first wallet with balance
    if (creditedCurrency) {
      const creditedIndex = mappedBalances.findIndex(w => w.currency === creditedCurrency);
      if (creditedIndex >= 0) {
        setHeroCardIndex(creditedIndex);
        console.log(`[Dashboard] ✅ Activated ${creditedCurrency} card (index ${creditedIndex}) from query param`);
      } else {
        console.log(`[Dashboard] ⚠️ Currency ${creditedCurrency} not found in balances`);
      }
    } else {
      // Find first wallet with balance > 0
      const firstWithBalance = mappedBalances.findIndex(w => w.balance > 0);
      if (firstWithBalance >= 0) {
        setHeroCardIndex(firstWithBalance);
        console.log(`[Dashboard] ✅ Auto-activated ${mappedBalances[firstWithBalance].currency} card (first with balance > 0)`);
      } else {
        console.log('[Dashboard] ℹ️ No wallets with balance > 0, using first card');
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchAll();
      } catch (err) {
        console.error('[Dashboard] fetch error:', err);
        console.error('[Dashboard] Error details:', err.response?.status, err.response?.data);
        setWalletBalances([
          { ...WALLET_UI.USD, balance: 0 },
          { ...WALLET_UI.EUR, balance: 0 },
          { ...WALLET_UI.LBP, balance: 0 },
        ]);
        setRecentTransactions([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditedCurrency]); // Re-fetch when currency query param changes

  const totalBalance = useMemo(() => {
    return walletBalances.reduce((sum, w) => {
      const rate = exchangeRates[w.currency] || 1;
      return sum + safeNumber(w.balance) * rate;
    }, 0);
  }, [walletBalances]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchAll();
    } catch (err) {
      console.error('[Dashboard] refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCardClick = (clickedIndex) => {
    if (clickedIndex !== heroCardIndex) setHeroCardIndex(clickedIndex);
  };

  const heroCard = walletBalances[heroCardIndex];
  const carouselCards = walletBalances.filter((_, index) => index !== heroCardIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!heroCard) {
    return (
      <div className="text-center py-16 text-slate-600 dark:text-slate-400">
        No wallets found.
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 p-1">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back! 👋</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Here's your wallet overview</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Total (USD est.): <span className="font-semibold">${totalBalance.toFixed(2)}</span>
            </p>
          </div>
          <Link href="/wallet/send">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Send className="h-4 w-4 mr-2" />
              Send Money
            </Button>
          </Link>
        </div>

        {/* Premium Hero Balance Card - SINGLE INSTANCE */}
        <Card className={`bg-gradient-to-br ${heroCard.cardColor} border-0 overflow-hidden relative shadow-2xl transition-all duration-500 ${
          creditedCurrency === heroCard.currency ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-slate-900 animate-pulse' : ''
        }`}>
          <CardContent className="p-8">
            {/* Decorative elements */}
            {heroCard.cardType === 'BLACK' ? (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              </>
            ) : heroCard.cardType === 'GOLD' ? (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              </>
            )}
            
            <div className="relative z-10">
              {/* Header with controls */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = heroCard.icon;
                    return <Icon className={`h-5 w-5 ${heroCard.textColor} opacity-70`} />;
                  })()}
                  <span className={`text-sm font-semibold ${heroCard.textColor} opacity-70`}>FXWallet {heroCard.cardType}</span>
                  <span className={`text-xs ${heroCard.textColor} opacity-50`}>• {heroCard.currency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className={`p-2 rounded-lg transition-colors ${
                      heroCard.textColor === 'text-white' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                    aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                  >
                    {balanceVisible ? (
                      <Eye className={`h-5 w-5 ${heroCard.textColor} opacity-80`} />
                    ) : (
                      <EyeOff className={`h-5 w-5 ${heroCard.textColor} opacity-80`} />
                    )}
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      heroCard.textColor === 'text-white' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                    aria-label="Refresh balance"
                  >
                    <RefreshCw className={`h-5 w-5 ${heroCard.textColor} opacity-80 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-8">
                {balanceVisible ? (
                  <div>
                    <p className={`text-6xl font-bold ${heroCard.textColor} mb-3 tracking-tight`}>
                      {heroCard.currency === 'LBP'
                        ? `${safeNumber(heroCard.balance).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${heroCard.symbol}`
                        : `${heroCard.symbol}${safeNumber(heroCard.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${
                        heroCard.trend === 'up'
                          ? 'bg-emerald-500/20 border-emerald-500/30'
                          : 'bg-red-500/20 border-red-500/30'
                      }`}>
                        {heroCard.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-400" />
                        )}
                        <span className={`text-sm font-bold ${heroCard.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {heroCard.change}
                        </span>
                      </div>
                      <span className={`${heroCard.textColor} opacity-60 text-sm`}>{heroCard.currency} Wallet</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={`text-6xl font-bold ${heroCard.textColor} mb-3 tracking-tight`}>•••••••</p>
                    <p className={`${heroCard.textColor} opacity-60 text-sm`}>Balance hidden</p>
                  </div>
                )}

                {/* Card details */}
                <div className="absolute bottom-8 right-8 text-right">
                  <p className={`text-xs ${heroCard.textColor} opacity-50 mb-1 tracking-widest`}>
                    •••• •••• •••• {heroCard.cardNumber}
                  </p>
                  <p className={`text-sm ${heroCard.textColor} opacity-70 font-medium`}>
                    Herman Psht
                  </p>
                </div>
              </div>

              {/* Sparkline */}
              <div className={`relative h-24 backdrop-blur-sm rounded-2xl p-4 overflow-hidden border ${
                heroCard.cardType === 'BLACK'
                  ? 'bg-white/5 border-white/10'
                  : heroCard.cardType === 'GOLD'
                  ? 'bg-yellow-400/10 border-yellow-400/20'
                  : 'bg-slate-400/10 border-slate-400/20'
              }`}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="heroChartLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  <path
                    d={`M 0,${60 - ((chartData[0] - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData))) * 50} ${chartData.map((value, index) => {
                      const x = (index / (chartData.length - 1)) * 200;
                      const normalizedValue = (value - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData));
                      const y = 60 - (normalizedValue * 50);
                      return `L ${x},${y}`;
                    }).join(' ')} L 200,60 L 0,60 Z`}
                    fill="url(#heroChartGradient)"
                  />

                  <path
                    d={`M 0,${60 - ((chartData[0] - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData))) * 50} ${chartData.map((value, index) => {
                      const x = (index / (chartData.length - 1)) * 200;
                      const normalizedValue = (value - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData));
                      const y = 60 - (normalizedValue * 50);
                      return `L ${x},${y}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke="url(#heroChartLine)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
                  <span className={`text-xs font-medium ${heroCard.textColor === 'text-white' ? 'text-white/60' : 'text-black/60'}`}>
                    Last 7 days
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Growth</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Carousel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Cards</h2>
            <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              <Plus className="h-4 w-4 mr-1" />
              Add Card
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {carouselCards.map((wallet) => {
              const Icon = wallet.icon;
              const originalIndex = walletBalances.findIndex((w) => w.currency === wallet.currency);

              return (
                <button
                  key={wallet.currency}
                  onClick={() => handleCardClick(originalIndex)}
                  className={`flex-shrink-0 w-80 transition-all duration-300 scale-100 hover:opacity-90 hover:scale-105 ${
                    creditedCurrency === wallet.currency ? 'opacity-100 ring-2 ring-emerald-400' : 'opacity-70'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${wallet.cardColor} rounded-2xl p-6 shadow-2xl relative overflow-hidden h-48 border-2 transition-all ${
                    creditedCurrency === wallet.currency ? 'border-emerald-400' : 'border-transparent hover:border-white/20'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -translate-x-4 translate-y-4" />

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-xs font-semibold ${wallet.textColor} opacity-70 mb-1`}>
                            FXWallet {wallet.cardType}
                          </p>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${wallet.textColor}`} />
                            <span className={`text-lg font-bold ${wallet.textColor}`}>
                              {wallet.currency}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-8 h-8 rounded-full ${wallet.textColor === 'text-white' ? 'bg-white/20' : 'bg-black/20'}`} />
                          <div className={`w-8 h-8 rounded-full ${wallet.textColor === 'text-white' ? 'bg-white/30' : 'bg-black/30'} -ml-3`} />
                        </div>
                      </div>

                      <div>
                        <p className={`text-sm ${wallet.textColor} opacity-60 mb-2 tracking-wider`}>
                          •••• •••• •••• {wallet.cardNumber}
                        </p>

                        {balanceVisible ? (
                          <p className={`text-3xl font-bold ${wallet.textColor}`}>
                            {wallet.currency === 'LBP'
                              ? `${(safeNumber(wallet.balance) / 1000000).toFixed(1)}M ${wallet.symbol}`
                              : `${wallet.symbol}${safeNumber(wallet.balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                            }
                          </p>
                        ) : (
                          <p className={`text-3xl font-bold ${wallet.textColor}`}>•••••••</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${wallet.textColor} opacity-50`}>Herman Psht</p>
                        <div className={`flex items-center gap-1 ${wallet.trend === 'up' ? 'text-emerald-300' : 'text-red-300'}`}>
                          {wallet.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          <span className="text-xs font-semibold">{wallet.change}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} href={action.href}>
                <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group backdrop-blur-sm">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`${action.color} p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{action.name}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Wallet Details */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {heroCard.currency} Wallet Details
              </CardTitle>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                heroCard.cardType === 'PLATINUM' ? 'bg-slate-600 text-white' :
                heroCard.cardType === 'GOLD' ? 'bg-amber-500 text-white' :
                'bg-gray-900 text-white'
              }`}>
                {heroCard.cardType}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {balanceVisible ? (
                    heroCard.currency === 'LBP'
                      ? `${safeNumber(heroCard.balance).toLocaleString()} ${heroCard.symbol}`
                      : `${heroCard.symbol}${safeNumber(heroCard.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  ) : '•••••••'}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Card Number</p>
                <p className="text-lg font-mono text-slate-900 dark:text-white">
                  •••• •••• •••• {heroCard.cardNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Monthly Change</p>
                <div className={`flex items-center gap-1 ${
                  heroCard.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {heroCard.trend === 'up' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  <span className="text-xl font-bold">{heroCard.change}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Recent Transactions</CardTitle>
              <Link href="/wallet/transactions">
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-sm text-slate-600 dark:text-slate-400">
                No transactions yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === 'received' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        tx.type === 'sent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      }`}>
                        {tx.type === 'received' ? <Download className="h-5 w-5" /> : tx.type === 'sent' ? <Send className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{tx.time}</p>
                      </div>
                    </div>

                    <span className={`text-sm font-semibold ${
                      tx.amount?.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' :
                      tx.amount?.startsWith('-') ? 'text-red-600 dark:text-red-400' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Analytics */}
      <TabsContent value="analytics" className="space-y-6">
        <TransactionAnalytics transactions={recentTransactions} />
      </TabsContent>
    </Tabs>
  );
}