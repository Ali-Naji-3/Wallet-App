'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Download, 
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const transactions = [
  { id: 'TXN001', type: 'transfer', from: 'John Doe', to: 'Jane Smith', amount: '$500.00', status: 'completed', date: 'Dec 6, 2025 10:30' },
  { id: 'TXN002', type: 'deposit', from: 'Bank Account', to: 'Mike Johnson', amount: '+$1,200.00', status: 'completed', date: 'Dec 6, 2025 09:15' },
  { id: 'TXN003', type: 'withdrawal', from: 'Sarah Wilson', to: 'Bank Account', amount: '-$800.00', status: 'pending', date: 'Dec 6, 2025 08:45' },
  { id: 'TXN004', type: 'exchange', from: 'Tom Brown', to: 'USD → EUR', amount: '$300.00', status: 'completed', date: 'Dec 5, 2025 16:20' },
  { id: 'TXN005', type: 'transfer', from: 'Alice Wang', to: 'Bob Chen', amount: '$150.00', status: 'failed', date: 'Dec 5, 2025 14:00' },
];

const getTypeIcon = (type) => {
  switch (type) {
    case 'deposit': return <ArrowDownLeft className="h-4 w-4" />;
    case 'withdrawal': return <ArrowUpRight className="h-4 w-4" />;
    case 'exchange': return <RefreshCw className="h-4 w-4" />;
    default: return <ArrowLeftRight className="h-4 w-4" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'bg-emerald-500/20 text-emerald-400';
    case 'pending': return 'bg-amber-500/20 text-amber-400';
    case 'failed': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

export default function TransactionsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/transactions" className="text-gray-400 hover:text-white">Transactions</Link>
        <ChevronRight className="h-4 w-4 text-gray-600" />
        <span className="text-gray-300">All</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">All Transactions</h1>
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-white mt-1">12,456</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">11,890</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">542</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-400 mt-1">24</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="p-4 text-left text-sm font-medium text-gray-400">ID</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Type</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">From</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">To</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Amount</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4 text-white font-mono text-sm">{tx.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        {getTypeIcon(tx.type)}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{tx.from}</td>
                    <td className="p-4 text-gray-300">{tx.to}</td>
                    <td className="p-4 text-white font-medium">{tx.amount}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{tx.date}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
