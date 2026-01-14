'use client';

import { useState, useMemo } from 'react';
import { useList } from '@refinedev/core';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  ArrowLeftRight,
  Search,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { AdminTransactionDetailsModal } from '@/components/admin/AdminTransactionDetailsModal';
import { AdminUserDetailsModal } from '@/components/admin/AdminUserDetailsModal';

export default function AdminTransactionsPage() {
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Table State
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Construct filters for Refine
  const filters = useMemo(() => {
    const f = [];
    if (typeFilter && typeFilter !== 'all') f.push({ field: 'type', operator: 'eq', value: typeFilter });
    // Status is not in DB, remove filter functionality or mock it?
    // For now, we ignore status filter or implement if we add column later.
    // if (statusFilter && statusFilter !== 'all') f.push({ field: 'status', operator: 'eq', value: statusFilter });
    if (searchFilter) f.push({ field: 'search', operator: 'contains', value: searchFilter });
    return f;
  }, [typeFilter, statusFilter, searchFilter]);

  // Fetch Data
  const { data: listData, isLoading, isError } = useList({
    resource: 'transactions',
    pagination: {
      current: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    },
    filters: filters,
  });

  const transactions = listData?.data || [];
  const totalCount = listData?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const columns = useMemo(() => [
    {
      id: 'id',
      header: 'ID',
      accessorKey: 'id',
      cell: ({ getValue }) => <span className="font-mono text-xs text-center block">#{getValue()}</span>,
    },
    {
      id: 'user_email',
      header: 'User / Initiator',
      accessorKey: 'user_email',
      cell: ({ getValue, row }) => (
        <div
          className="flex flex-col cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUserId(row.original.user_id);
            setIsUserModalOpen(true);
          }}
        >
          <span className="font-medium text-sm text-white group-hover:text-amber-500 transition-colors underline-offset-4 group-hover:underline">
            {getValue() || 'Unknown'}
          </span>
          <span className="text-xs text-gray-500">User ID: {row.original.user_id}</span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => {
        const type = getValue();
        let icon = <ArrowLeftRight className="w-4 h-4" />;
        if (type === 'exchange') icon = <RefreshCw className="w-4 h-4" />;

        return (
          <div className="flex items-center gap-2 capitalize text-gray-300">
            <div className="p-1.5 rounded-md bg-white/5 border border-white/10">{icon}</div>
            {type}
          </div>
        );
      },
    },
    {
      id: 'amount',
      header: 'Source Amount',
      accessorKey: 'source_amount', // Adjusted Key
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white">
            {Number(row.original.source_amount).toFixed(2)} <span className="text-xs text-gray-400">{row.original.source_currency}</span>
          </span>
          {row.original.type === 'exchange' && (
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              → {Number(row.original.target_amount).toFixed(2)} {row.original.target_currency}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        // Hardcoded Completed as DB has no status
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 capitalize">
          Completed
        </Badge>
      ),
    },
    {
      id: 'created_at',
      header: 'Date',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-xs">
          {new Date(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/10"
          onClick={() => {
            setSelectedTx(row.original);
            setIsModalOpen(true);
          }}
        >
          <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
        </Button>
      ),
    },
  ], []);

  // Update state logic for table...
  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pageCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1c] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Transactions</h1>
          <p className="text-gray-400">Manage and monitor all system transactions.</p>
        </div>
        <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards - Hardcoded */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">Total Volume</CardDescription>
            <CardTitle className="text-2xl">$1,240,500</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">Total Count</CardDescription>
            <CardTitle className="text-2xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by Transaction ID or User Email..."
              className="pl-10 bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="rounded-md">
          <Table>
            <TableHeader className="bg-white/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-gray-400">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2 text-amber-500">
                      <Loader2 className="animate-spin h-5 w-5" />
                      Loading transactions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTx(row.original);
                      setIsModalOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-white/10 bg-transparent text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-white/10 bg-transparent text-white hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <AdminTransactionDetailsModal
        transaction={selectedTx}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <AdminUserDetailsModal
        userId={selectedUserId}
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
      />
    </div>
  );
}

