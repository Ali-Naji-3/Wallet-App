'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  Wallet,
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
  Sparkles,
  ChevronRight,
  BarChart3,
  Home,
} from 'lucide-react';
import TransactionAnalytics from '@/components/TransactionAnalytics';

const walletBalances = [
  { 
    currency: 'USD', 
    symbol: '$', 
    balance: 12450.00, 
    change: '+2.5%', 
    trend: 'up', 
    icon: DollarSign,
    cardType: 'PLATINUM',
    cardNumber: '4532',
    cardColor: 'from-slate-700 via-slate-600 to-slate-800',
    textColor: 'text-white',
  },
  { 
    currency: 'EUR', 
    symbol: '€', 
    balance: 8320.50, 
    change: '+1.8%', 
    trend: 'up', 
    icon: Euro,
    cardType: 'GOLD',
    cardNumber: '6852',
    cardColor: 'from-amber-600 via-amber-500 to-yellow-600',
    textColor: 'text-white',
  },
  { 
    currency: 'LBP', 
    symbol: 'ل.ل', 
    balance: 450000000, 
    change: '+0.1%', 
    trend: 'up', 
    icon: DollarSign,
    cardType: 'BLACK',
    cardNumber: '3117',
    cardColor: 'from-gray-900 via-gray-800 to-black',
    textColor: 'text-white',
  },
];

const recentTransactions = [
  { id: 1, type: 'received', name: 'John Smith', amount: '+$500.00', time: '2 hours ago', status: 'completed' },
  { id: 2, type: 'sent', name: 'Amazon Purchase', amount: '-$89.99', time: '5 hours ago', status: 'completed' },
  { id: 3, type: 'exchange', name: 'USD → EUR', amount: '$200.00', time: 'Yesterday', status: 'completed' },
  { id: 4, type: 'received', name: 'Sarah Johnson', amount: '+$1,200.00', time: 'Yesterday', status: 'completed' },
  { id: 5, type: 'sent', name: 'Netflix', amount: '-$15.99', time: '2 days ago', status: 'completed' },
];

const quickActions = [
  { name: 'Send', href: '/wallet/send', icon: Send, color: 'bg-blue-500' },
  { name: 'Receive', href: '/wallet/receive', icon: Download, color: 'bg-emerald-500' },
  { name: 'Exchange', href: '/wallet/exchange', icon: RefreshCw, color: 'bg-purple-500' },
  { name: 'Add Card', href: '/wallet/cards', icon: CreditCard, color: 'bg-amber-500' },
];

// Exchange rates to USD
const exchangeRates = {
  USD: 1,
  EUR: 1.09, // 1 EUR = 1.09 USD
  LBP: 0.0000112, // 1 LBP = 0.0000112 USD (approximately 89,500 LBP per USD)
};

// Sample chart data for sparkline (7 days) - more realistic values
const chartData = [24.2, 24.8, 24.5, 25.1, 25.3, 25.8, 26.4];

export default function WalletDashboard() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [heroCardIndex, setHeroCardIndex] = useState(0); // Index of card in hero position
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate total balance in USD
  const totalBalance = walletBalances.reduce((sum, w) => {
    const rate = exchangeRates[w.currency] || 1;
    return sum + (w.balance * rate);
  }, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Handle card click - swap with hero card
  const handleCardClick = (clickedIndex) => {
    if (clickedIndex !== heroCardIndex) {
      setHeroCardIndex(clickedIndex);
    }
  };

  const heroCard = walletBalances[heroCardIndex];
  
  // Get all cards except the one in hero position
  const carouselCards = walletBalances.filter((_, index) => index !== heroCardIndex);

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
      {/* Premium Hero Balance Card - Dynamic Card Style */}
      <Card className={`bg-gradient-to-br ${heroCard.cardColor} border-0 overflow-hidden relative shadow-2xl transition-all duration-500`}>
        <CardContent className="p-8">
          {/* Decorative elements - unique per card type */}
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

            {/* Main Balance Display */}
            <div className="mb-8">
              {balanceVisible ? (
                <div>
                  <p className={`text-6xl font-bold ${heroCard.textColor} mb-3 tracking-tight`}>
                    {heroCard.currency === 'LBP' 
                      ? `${heroCard.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${heroCard.symbol}`
                      : `${heroCard.symbol}${heroCard.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                  <p className={`text-6xl font-bold ${heroCard.textColor} mb-3 tracking-tight`}>
                    •••••••
                  </p>
                  <p className={`${heroCard.textColor} opacity-60 text-sm`}>Balance hidden</p>
                </div>
              )}
              
              {/* Card Details - Bottom Right */}
              <div className="absolute bottom-8 right-8 text-right">
                <p className={`text-xs ${heroCard.textColor} opacity-50 mb-1 tracking-widest`}>
                  •••• •••• •••• {heroCard.cardNumber}
                </p>
                <p className={`text-sm ${heroCard.textColor} opacity-70 font-medium`}>
                  Herman Psht
                </p>
              </div>
            </div>

            {/* Mini Sparkline Chart */}
            <div className={`relative h-24 backdrop-blur-sm rounded-2xl p-4 overflow-hidden border ${
              heroCard.cardType === 'BLACK' 
                ? 'bg-white/5 border-white/10' 
                : heroCard.cardType === 'GOLD'
                ? 'bg-yellow-400/10 border-yellow-400/20'
                : 'bg-slate-400/10 border-slate-400/20'
            }`}>
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 60"
                preserveAspectRatio="none"
              >
                {/* Gradient definitions - unique per card type */}
                <defs>
                  {heroCard.cardType === 'BLACK' ? (
                    <>
                      <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="heroChartLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="1" />
                      </linearGradient>
                    </>
                  ) : heroCard.cardType === 'GOLD' ? (
                    <>
                      <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="heroChartLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity="1" />
                      </linearGradient>
                    </>
                  ) : (
                    <>
                      <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(148, 163, 184)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(148, 163, 184)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="heroChartLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="rgb(148, 163, 184)" stopOpacity="1" />
                      </linearGradient>
                    </>
                  )}
                </defs>
                
                {/* Area fill under the line */}
                <path
                  d={`M 0,${60 - ((chartData[0] - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData))) * 50} ${chartData.map((value, index) => {
                    const x = (index / (chartData.length - 1)) * 200;
                    const normalizedValue = (value - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData));
                    const y = 60 - (normalizedValue * 50);
                    return `L ${x},${y}`;
                  }).join(' ')} L 200,60 L 0,60 Z`}
                  fill="url(#heroChartGradient)"
                  className="transition-all duration-300"
                />
                
                {/* Main line */}
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
                  className="transition-all duration-300"
                />
                
                {/* Data points */}
                {chartData.map((value, index) => {
                  const x = (index / (chartData.length - 1)) * 200;
                  const normalizedValue = (value - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData));
                  const y = 60 - (normalizedValue * 50);
                  const isLast = index === chartData.length - 1;
                  const pointColor = heroCard.cardType === 'BLACK' 
                    ? (isLast ? "rgb(16, 185, 129)" : "rgb(255, 255, 255)")
                    : heroCard.cardType === 'GOLD'
                    ? (isLast ? "rgb(251, 191, 36)" : "rgb(255, 255, 255)")
                    : (isLast ? "rgb(148, 163, 184)" : "rgb(255, 255, 255)");
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r={isLast ? 4 : 0}
                      fill={pointColor}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              
              {/* Chart Labels */}
              <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
                <span className={`text-xs font-medium ${
                  heroCard.textColor === 'text-white' ? 'text-white/60' : 'text-black/60'
                }`}>Last 7 days</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3 w-3 ${
                    heroCard.cardType === 'BLACK' ? 'text-emerald-400' :
                    heroCard.cardType === 'GOLD' ? 'text-yellow-400' :
                    'text-slate-400'
                  }`} />
                  <span className={`text-xs font-semibold ${
                    heroCard.cardType === 'BLACK' ? 'text-emerald-400' :
                    heroCard.cardType === 'GOLD' ? 'text-yellow-400' :
                    'text-slate-400'
                  }`}>Growth</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horizontal Card Carousel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Cards</h2>
          <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
            <Plus className="h-4 w-4 mr-1" />
            Add Card
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {carouselCards.map((wallet, carouselIndex) => {
            const Icon = wallet.icon;
            // Find the original index in walletBalances array
            const originalIndex = walletBalances.findIndex(w => w.currency === wallet.currency);
            
            return (
              <button
                key={wallet.currency}
                onClick={() => handleCardClick(originalIndex)}
                className="flex-shrink-0 w-80 transition-all duration-300 scale-100 opacity-70 hover:opacity-90 hover:scale-105"
              >
                <div 
                  className={`bg-gradient-to-br ${wallet.cardColor} rounded-2xl p-6 shadow-2xl relative overflow-hidden h-48 border-2 border-transparent hover:border-white/20 transition-all`}
                >
                  {/* Card decorative pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -translate-x-4 translate-y-4" />
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {/* Card Header */}
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

                    {/* Card Number */}
                    <div>
                      <p className={`text-sm ${wallet.textColor} opacity-60 mb-2 tracking-wider`}>
                        •••• •••• •••• {wallet.cardNumber}
                      </p>
                      
                      {/* Balance */}
                      {balanceVisible ? (
                        <p className={`text-3xl font-bold ${wallet.textColor}`}>
                          {wallet.currency === 'LBP' 
                            ? `${(wallet.balance / 1000000).toFixed(1)}M ${wallet.symbol}`
                            : `${wallet.symbol}${wallet.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                          }
                        </p>
                      ) : (
                        <p className={`text-3xl font-bold ${wallet.textColor}`}>
                          •••••••
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs ${wallet.textColor} opacity-50`}>Herman Psht</p>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        wallet.trend === 'up' ? 'text-emerald-300' : 'text-red-300'
                      }`}>
                        {wallet.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
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

      {/* Current Card Details */}
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
                    ? `${heroCard.balance.toLocaleString()} ${heroCard.symbol}`
                    : `${heroCard.symbol}${heroCard.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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
                {heroCard.trend === 'up' ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
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
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    tx.type === 'received' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'sent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {tx.type === 'received' ? (
                      <Download className="h-5 w-5" />
                    ) : tx.type === 'sent' ? (
                      <Send className="h-5 w-5" />
                    ) : (
                      <RefreshCw className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{tx.time}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' :
                  tx.amount.startsWith('-') ? 'text-red-600 dark:text-red-400' :
                  'text-slate-700 dark:text-slate-300'
                }`}>
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <TransactionAnalytics transactions={recentTransactions} />
      </TabsContent>
    </Tabs>
  );
}

