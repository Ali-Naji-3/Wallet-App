'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Send,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const transactions = [
  { id: 1, type: 'received', name: 'John Smith', email: 'john@example.com', amount: '+$500.00', date: 'Dec 6, 2025 10:30 AM', status: 'completed' },
  { id: 2, type: 'sent', name: 'Amazon Purchase', email: 'amazon@orders.com', amount: '-$89.99', date: 'Dec 6, 2025 08:15 AM', status: 'completed' },
  { id: 3, type: 'exchange', name: 'USD → EUR', email: 'Currency exchange', amount: '$200.00', date: 'Dec 5, 2025 03:45 PM', status: 'completed' },
  { id: 4, type: 'received', name: 'Sarah Johnson', email: 'sarah@company.com', amount: '+$1,200.00', date: 'Dec 5, 2025 11:20 AM', status: 'completed' },
  { id: 5, type: 'sent', name: 'Netflix', email: 'billing@netflix.com', amount: '-$15.99', date: 'Dec 4, 2025 09:00 AM', status: 'completed' },
  { id: 6, type: 'sent', name: 'Electric Bill', email: 'utility@power.com', amount: '-$145.00', date: 'Dec 3, 2025 02:30 PM', status: 'completed' },
  { id: 7, type: 'received', name: 'Freelance Payment', email: 'client@business.com', amount: '+$850.00', date: 'Dec 2, 2025 04:15 PM', status: 'completed' },
  { id: 8, type: 'exchange', name: 'GBP → USD', email: 'Currency exchange', amount: '£300.00', date: 'Dec 1, 2025 10:00 AM', status: 'pending' },
];

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'received':
        return <ArrowDownLeft className="h-5 w-5" />;
      case 'sent':
        return <ArrowUpRight className="h-5 w-5" />;
      case 'exchange':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'received':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'sent':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'exchange':
        return 'bg-amber-500/10 text-amber-600 dark:text-purple-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">View your transaction history</p>
        </div>
        <Button variant="outline" className="border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-blue-500"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white">
                <Filter className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                <SelectItem value="all" className="text-gray-900 dark:text-slate-300">All types</SelectItem>
                <SelectItem value="received" className="text-gray-900 dark:text-slate-300">Received</SelectItem>
                <SelectItem value="sent" className="text-gray-900 dark:text-slate-300">Sent</SelectItem>
                <SelectItem value="exchange" className="text-gray-900 dark:text-slate-300">Exchange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTypeColor(tx.type)}`}>
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{tx.name}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-500">{tx.email}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    tx.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' :
                    tx.amount.startsWith('-') ? 'text-red-600 dark:text-red-400' :
                    'text-gray-900 dark:text-slate-300'
                  }`}>
                    {tx.amount}
                  </p>
                  <div className="flex items-center gap-2 justify-end mt-1">
                    <span className="text-xs text-gray-500 dark:text-slate-500">{tx.date}</span>
                    <Badge
                      className={
                        tx.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-xs font-medium'
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-600 dark:text-slate-500">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

