'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const stats = [
    {
      title: 'Total Users',
    value: '2,543',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
    color: 'amber',
    },
    {
    title: 'Active Wallets',
    value: '1,832',
      change: '+8.2%',
      trend: 'up',
      icon: Wallet,
    color: 'emerald',
    },
    {
      title: 'Transactions',
    value: '12,456',
    change: '+23.1%',
      trend: 'up',
      icon: ArrowLeftRight,
    color: 'blue',
    },
    {
    title: 'Total Volume',
    value: '$1.2M',
    change: '+15.3%',
      trend: 'up',
    icon: DollarSign,
    color: 'purple',
  },
];

const recentTransactions = [
  { id: 1, user: 'John Doe', type: 'Deposit', amount: '+$500.00', status: 'completed', time: '2 min ago' },
  { id: 2, user: 'Jane Smith', type: 'Withdrawal', amount: '-$200.00', status: 'pending', time: '5 min ago' },
  { id: 3, user: 'Mike Johnson', type: 'Transfer', amount: '-$150.00', status: 'completed', time: '10 min ago' },
  { id: 4, user: 'Sarah Wilson', type: 'Deposit', amount: '+$1,000.00', status: 'completed', time: '15 min ago' },
  { id: 5, user: 'Tom Brown', type: 'Exchange', amount: '$300.00', status: 'processing', time: '20 min ago' },
];

const pendingItems = [
  { title: 'KYC Verifications', count: 12, icon: AlertCircle, color: 'amber' },
  { title: 'Pending Withdrawals', count: 5, icon: Clock, color: 'blue' },
  { title: 'Support Tickets', count: 8, icon: AlertCircle, color: 'red' },
  ];

export default function DashboardPage() {
    return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            amber: 'bg-amber-500/10 text-amber-500',
            emerald: 'bg-emerald-500/10 text-emerald-500',
            blue: 'bg-blue-500/10 text-blue-500',
            purple: 'bg-purple-500/10 text-purple-500',
          };
          
          return (
            <Card key={stat.title} className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
              <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={stat.trend === 'up' ? 'text-emerald-500 text-sm' : 'text-red-500 text-sm'}>
                        {stat.change}
                      </span>
                      <span className="text-gray-500 text-sm">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-amber-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {tx.user.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.user}</p>
                      <p className="text-xs text-gray-500">{tx.type} • {tx.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      tx.amount.startsWith('+') ? 'text-emerald-500' : 
                      tx.amount.startsWith('-') ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {tx.amount}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {tx.status}
              </span>
            </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {pendingItems.map((item) => {
              const Icon = item.icon;
              const colorClasses = {
                amber: 'bg-amber-500/10 text-amber-500',
                blue: 'bg-blue-500/10 text-blue-500',
                red: 'bg-red-500/10 text-red-500',
              };
              
              return (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses[item.color]}`}>
                      <Icon className="h-4 w-4" />
            </div>
                    <span className="text-sm text-gray-300">{item.title}</span>
            </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses[item.color]}`}>
                    {item.count}
              </span>
            </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-gray-500">Completed Today</p>
                <p className="text-lg font-semibold text-white">156</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">Processing</p>
                <p className="text-lg font-semibold text-white">23</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Exchange Rate Updates</p>
                <p className="text-lg font-semibold text-white">12</p>
                </div>
                </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">New Users Today</p>
                <p className="text-lg font-semibold text-white">34</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
