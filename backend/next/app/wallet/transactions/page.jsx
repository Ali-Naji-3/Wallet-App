'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Calendar,
  X,
  FileText,
  FileSpreadsheet,
  Tag,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Transaction categories with icons
const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: MoreHorizontal },
  { value: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { value: 'food', label: 'Food & Dining', icon: Coffee },
  { value: 'transport', label: 'Transportation', icon: Car },
  { value: 'bills', label: 'Bills & Utilities', icon: Home },
  { value: 'salary', label: 'Salary & Income', icon: TrendingUp },
  { value: 'business', label: 'Business', icon: Briefcase },
  { value: 'transfer', label: 'Transfers', icon: Send },
  { value: 'other', label: 'Other', icon: Tag },
];

// Quick filter periods
const QUICK_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'All Time', value: 'all' },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(ENDPOINTS.TRANSACTIONS.MY);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      // Fallback to mock data for demo
      setTransactions([
        { id: 1, transaction_type: 'receive', description: 'John Smith', amount: 500.00, currency: 'USD', created_at: '2025-12-06T10:30:00Z', status: 'completed', category: 'salary' },
        { id: 2, transaction_type: 'send', description: 'Amazon Purchase', amount: 89.99, currency: 'USD', created_at: '2025-12-06T08:15:00Z', status: 'completed', category: 'shopping' },
        { id: 3, transaction_type: 'exchange', description: 'USD → EUR', amount: 200.00, currency: 'USD', created_at: '2025-12-05T15:45:00Z', status: 'completed', category: 'transfer' },
        { id: 4, transaction_type: 'receive', description: 'Sarah Johnson', amount: 1200.00, currency: 'USD', created_at: '2025-12-05T11:20:00Z', status: 'completed', category: 'business' },
        { id: 5, transaction_type: 'send', description: 'Netflix', amount: 15.99, currency: 'USD', created_at: '2025-12-04T09:00:00Z', status: 'completed', category: 'bills' },
        { id: 6, transaction_type: 'send', description: 'Electric Bill', amount: 145.00, currency: 'USD', created_at: '2025-12-03T14:30:00Z', status: 'completed', category: 'bills' },
        { id: 7, transaction_type: 'receive', description: 'Freelance Payment', amount: 850.00, currency: 'USD', created_at: '2025-12-02T16:15:00Z', status: 'completed', category: 'business' },
        { id: 8, transaction_type: 'exchange', description: 'GBP → USD', amount: 300.00, currency: 'GBP', created_at: '2025-12-01T10:00:00Z', status: 'pending', category: 'transfer' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filter helper
  const applyDateFilter = (txDate) => {
    const date = new Date(txDate);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case '30days':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= thirtyDaysAgo;
      case 'custom':
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (from && to) return date >= from && date <= to;
        if (from) return date >= from;
        if (to) return date <= to;
        return true;
      default:
        return true;
    }
  };

  // Advanced filtering
  const filteredTransactions = transactions.filter(tx => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    
    // Date filter
    const matchesDate = applyDateFilter(tx.created_at);
    
    // Amount filter - handle different transaction formats
    const txAmount = Math.abs(parseFloat(tx.from_amount || tx.amount || 0) || 0);
    const matchesMinAmount = minAmount === '' || txAmount >= parseFloat(minAmount);
    const matchesMaxAmount = maxAmount === '' || txAmount <= parseFloat(maxAmount);
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory && 
           matchesDate && matchesMinAmount && matchesMaxAmount;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Status', 'Category'];
    const csvData = filteredTransactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.transaction_type || tx.type,
      tx.description || tx.note || '',
      parseFloat(tx.from_amount || tx.amount || 0) || 0,
      tx.from_currency || tx.currency || '',
      tx.status,
      tx.category || 'other'
    ]);
    
    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported to CSV');
    setExportDialogOpen(false);
  };

  // Export to PDF (simplified - would use a library like jsPDF in production)
  const exportToPDF = () => {
    toast.info('PDF export coming soon! Use CSV for now.');
    setExportDialogOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Calculate stats
  const stats = {
    total: filteredTransactions.length,
    completed: filteredTransactions.filter(tx => tx.status === 'completed').length,
    pending: filteredTransactions.filter(tx => tx.status === 'pending').length,
    totalIncome: filteredTransactions.filter(tx => tx.transaction_type === 'receive').reduce((sum, tx) => sum + (parseFloat(tx.amount || 0) || 0), 0),
    totalExpense: filteredTransactions.filter(tx => tx.transaction_type === 'send').reduce((sum, tx) => sum + (parseFloat(tx.from_amount || tx.amount || 0) || 0), 0),
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5" />;
      case 'send':
        return <ArrowUpRight className="h-5 w-5" />;
      case 'exchange':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'receive':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'send':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'exchange':
        return 'bg-amber-500/10 text-amber-600 dark:text-purple-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-slate-400';
    }
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    if (!cat) return Tag;
    return cat.icon;
  };

  const formatAmount = (tx) => {
    // Handle different transaction types and API response formats
    if (tx.type === 'exchange' || tx.transaction_type === 'exchange') {
      const fromAmt = parseFloat(tx.from_amount || tx.amount || 0) || 0;
      const toAmt = parseFloat(tx.to_amount || 0) || 0;
      const fromCur = tx.from_currency || tx.currency || '';
      const toCur = tx.to_currency || '';
      return `${fromCur} ${fromAmt.toFixed(2)} → ${toCur} ${toAmt.toFixed(2)}`;
    } else if (tx.type === 'transfer' || tx.transaction_type === 'send') {
      const amt = parseFloat(tx.from_amount || tx.amount || 0) || 0;
      const cur = tx.from_currency || tx.currency || '$';
      return `-${cur}${amt.toFixed(2)}`;
    } else if (tx.transaction_type === 'receive') {
      const amt = parseFloat(tx.amount || 0) || 0;
      const cur = tx.currency || '$';
      return `+${cur}${amt.toFixed(2)}`;
    } else {
      const amt = parseFloat(tx.amount || 0) || 0;
      const cur = tx.currency || '$';
      return `${cur}${amt.toFixed(2)}`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            {stats.total} transactions • 
            <span className="text-emerald-600 dark:text-emerald-400 ml-1">+${stats.totalIncome.toFixed(2)}</span>
            <span className="text-red-600 dark:text-red-400 ml-1">-${stats.totalExpense.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Export Transactions</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-slate-400">
                  Export {filteredTransactions.length} filtered transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Button 
                  onClick={exportToCSV}
                  className="w-full justify-start bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Export as CSV</div>
                    <div className="text-xs opacity-80">Open in Excel, Google Sheets</div>
                  </div>
                </Button>
                <Button 
                  onClick={exportToPDF}
                  variant="outline"
                  className="w-full justify-start border-gray-300 dark:border-slate-700"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Export as PDF</div>
                    <div className="text-xs text-gray-600 dark:text-slate-400">Formatted report (Coming soon)</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={dateFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setDateFilter(filter.value);
              setCurrentPage(1);
            }}
            className={dateFilter === filter.value ? "bg-amber-500 hover:bg-amber-600 text-gray-900" : "border-gray-300 dark:border-slate-700"}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Basic Filters */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <Input
                placeholder="Search by description, recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-44 bg-gray-50 dark:bg-slate-900">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receive">Received</SelectItem>
                <SelectItem value="send">Sent</SelectItem>
                <SelectItem value="exchange">Exchange</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-44 bg-gray-50 dark:bg-slate-900">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-gray-50 dark:bg-slate-900">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="text-gray-600 dark:text-slate-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-slate-300">Custom Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setDateFilter('custom');
                      }}
                      className="bg-gray-50 dark:bg-slate-900"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setDateFilter('custom');
                      }}
                      className="bg-gray-50 dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-slate-300">Amount Range</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="pl-9 bg-gray-50 dark:bg-slate-900"
                      />
                    </div>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="pl-9 bg-gray-50 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-0">
          {paginatedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileText className="h-16 w-16 text-gray-300 dark:text-slate-600 mb-4" />
              <p className="text-gray-600 dark:text-slate-400 text-center">
                No transactions found
              </p>
              {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="mt-2 text-amber-600 dark:text-amber-400"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {paginatedTransactions.map((tx) => {
                  const CategoryIcon = getCategoryIcon(tx.category);
                  return (
              <div
                key={tx.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors gap-4"
              >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(tx.transaction_type)}`}>
                          {getTypeIcon(tx.transaction_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {tx.description || 'Transaction'}
                            </p>
                            {tx.category && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-xs text-gray-600 dark:text-slate-400">
                                <CategoryIcon className="h-3 w-3" />
                                <span>{CATEGORIES.find(c => c.value === tx.category)?.label || tx.category}</span>
                              </div>
                            )}
                  </div>
                          <p className="text-sm text-gray-500 dark:text-slate-500">
                            {formatDate(tx.created_at)}
                          </p>
                  </div>
                </div>
                
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                            tx.transaction_type === 'receive' ? 'text-emerald-600 dark:text-emerald-400' :
                            tx.transaction_type === 'send' ? 'text-red-600 dark:text-red-400' :
                            'text-amber-600 dark:text-amber-400'
                  }`}>
                            {formatAmount(tx)}
                          </p>
                        </div>
                    <Badge
                      className={
                        tx.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-xs font-medium'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-xs font-medium'
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
                  );
                })}
          </div>

          {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700 gap-4">
            <p className="text-sm text-gray-600 dark:text-slate-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  {filteredTransactions.length !== transactions.length && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">(filtered from {transactions.length})</span>
                  )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
                  <span className="text-sm text-gray-700 dark:text-slate-300 px-2">
                    Page {currentPage} of {totalPages || 1}
                  </span>
              <Button
                variant="outline"
                size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

