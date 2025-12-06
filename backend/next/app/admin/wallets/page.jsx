'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Search, Filter, Eye, Pencil, DollarSign, Euro } from 'lucide-react';
import Link from 'next/link';

const wallets = [
  { id: 1, user: 'John Doe', email: 'john@example.com', currency: 'USD', balance: 12450.00, status: 'active', icon: DollarSign },
  { id: 2, user: 'Jane Smith', email: 'jane@example.com', currency: 'EUR', balance: 8320.50, status: 'active', icon: Euro },
  { id: 3, user: 'Mike Johnson', email: 'mike@example.com', currency: 'LBP', balance: 450000000, status: 'frozen', icon: DollarSign },
  { id: 4, user: 'Sarah Wilson', email: 'sarah@example.com', currency: 'USD', balance: 23100.00, status: 'active', icon: DollarSign },
  { id: 5, user: 'Tom Brown', email: 'tom@example.com', currency: 'LBP', balance: 150000000, status: 'active', icon: DollarSign },
];

export default function WalletsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallets</h1>
          <p className="text-gray-400 text-sm mt-1">Manage user wallets</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-gray-900">
          <Plus className="h-4 w-4 mr-2" />
          Create Wallet
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Wallets</p>
                <p className="text-2xl font-bold text-white">1,832</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Wallets</p>
                <p className="text-2xl font-bold text-white">1,756</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
      <div>
                <p className="text-gray-400 text-sm">Frozen Wallets</p>
                <p className="text-2xl font-bold text-white">76</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
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
                placeholder="Search wallets..."
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
                  <th className="p-4 text-left text-sm font-medium text-gray-400">User</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Currency</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Balance</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => {
                  const Icon = wallet.icon;
                  return (
                    <tr key={wallet.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{wallet.user}</p>
                          <p className="text-gray-500 text-sm">{wallet.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{wallet.currency}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white font-medium">
                        {wallet.currency === 'LBP' 
                          ? `${wallet.balance.toLocaleString()} ل.ل`
                          : wallet.currency === 'EUR'
                          ? `€${wallet.balance.toLocaleString()}`
                          : `$${wallet.balance.toLocaleString()}`
                        }
                      </td>
                      <td className="p-4">
                        <Badge className={
                          wallet.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }>
                          {wallet.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-amber-400">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
