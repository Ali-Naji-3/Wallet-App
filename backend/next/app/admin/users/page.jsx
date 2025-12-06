'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
  User,
} from 'lucide-react';

// Sample user data matching the Laravel Filament screenshot
const usersData = [
  { id: 1, name: 'Admin', email: 'admin@admin.com', role: 'admin', orders: 1, reviews: 0, apiTokens: 1, joined: '2025-10-14 08:27:09' },
  { id: 2, name: 'qqq', email: 'qq@gmail.com', role: 'customer', orders: 3, reviews: 0, apiTokens: 0, joined: '2025-10-15 13:50:36' },
  { id: 3, name: 'aref', email: 'aref1@gmail.com', role: 'customer', orders: 3, reviews: 0, apiTokens: 0, joined: '2025-10-14 20:11:16' },
  { id: 4, name: 'aref2', email: 'aref@gmail.com', role: 'customer', orders: 0, reviews: 3, apiTokens: 0, joined: '2025-10-14 12:37:59' },
  { id: 5, name: 'ahmad', email: 'ahmad@gmail.com', role: 'customer', orders: 0, reviews: 0, apiTokens: 0, joined: '2025-10-14 09:33:05' },
  { id: 6, name: 'John Customer', email: 'customer@example.com', role: 'customer', orders: 0, reviews: 0, apiTokens: 0, joined: '2025-10-14 09:29:35' },
  { id: 7, name: 'Jane Doe', email: 'jane@example.com', role: 'customer', orders: 0, reviews: 1, apiTokens: 0, joined: '2025-10-14 09:29:35' },
  { id: 8, name: 'ali', email: 'ali@gmail.com', role: 'customer', orders: 5, reviews: 4, apiTokens: 1, joined: '2025-10-14 09:06:15' },
];

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'orders', label: 'Orders', sortable: true },
  { key: 'reviews', label: 'Reviews', sortable: true },
  { key: 'apiTokens', label: 'API Tokens', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
];

export default function UsersPage() {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(10);

  const toggleSelectAll = () => {
    if (selectedUsers.length === usersData.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersData.map(u => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/users" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">Users</Link>
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
        <span className="text-gray-600 dark:text-gray-300">List</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <Link href="/admin/users/create">
          <Button className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium">
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </Link>
      </div>

      {/* Table Card */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl">
        <CardContent className="p-0">
          {/* Search and Filters */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter */}
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                <Filter className="h-4 w-4" />
              </Button>
              {/* Toggle View */}
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

      {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4 w-12">
                    <Checkbox
                      checked={selectedUsers.length === usersData.length}
                      onCheckedChange={toggleSelectAll}
                      className="border-gray-400 dark:border-gray-600"
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="p-4 text-left text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {col.label}
                          {sortColumn === col.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="h-4 w-4" />
          ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                  <th className="p-4 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {usersData.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        className="border-gray-400 dark:border-gray-600"
                      />
                    </td>
                    <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">{user.name}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <Badge
                        className={
                          user.role === 'admin'
                            ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/30'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                        }
                      >
                        {user.role === 'admin' ? (
                          <Shield className="h-3 w-3 mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                        </Badge>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                        {user.orders}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        {user.reviews}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
                        {user.apiTokens}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(user.joined)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                              <Link href={`/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white h-8 px-2">
                            <Eye className="h-4 w-4 mr-1" />
                                View
                          </Button>
                              </Link>
                              <Link href={`/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 h-8 px-2">
                            <Pencil className="h-4 w-4 mr-1" />
                                Edit
                          </Button>
                              </Link>
                        {user.role !== 'admin' && (
                          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 h-8 px-2">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing 1 to {usersData.length} of {usersData.length} results
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Per page</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      {perPage}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    {[10, 25, 50, 100].map((num) => (
                            <DropdownMenuItem
                        key={num}
                        onClick={() => setPerPage(num)}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                        {num}
                            </DropdownMenuItem>
                    ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                  <ChevronLeft className="h-4 w-4" />
                  </Button>
                <Button variant="outline" size="sm" disabled className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                  <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
