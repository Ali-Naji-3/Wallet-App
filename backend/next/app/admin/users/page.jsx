'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
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
  Download,
  MoreHorizontal,
  Key,
  Snowflake,
  Sun,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// Columns that match the live API data
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [resetPasswordModal, setResetPasswordModal] = useState({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async (pageToLoad = page) => {
    try {
      setLoading(true);
      setError('');

      const { data } = await apiClient.get(ENDPOINTS.ADMIN_USERS.LIST, {
        params: {
          page: pageToLoad,
          limit: perPage,
          search: searchQuery || undefined,
        },
      });

      const mappedUsers = (data.users || []).map((u) => ({
        id: u.id,
        name: u.full_name || u.email,
        email: u.email,
        role: u.role || 'user',
        isActive: u.is_active,
        joined: u.created_at,
      }));

      setUsers(mappedUsers);
      setTotal(data.pagination?.total || mappedUsers.length);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(data.pagination?.page || pageToLoad);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, searchQuery]);

  const fetchStats = async () => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.ADMIN_STATS.DASHBOARD);
      setStats(data?.users || null);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
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

  const handleFreezeToggle = async (user) => {
    try {
      const endpoint = user.isActive
        ? ENDPOINTS.ADMIN_USERS.FREEZE(user.id)
        : ENDPOINTS.ADMIN_USERS.UNFREEZE(user.id);

      await apiClient.post(endpoint);

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u))
      );
      toast.success(
        user.isActive
          ? `User ${user.email} has been frozen`
          : `User ${user.email} has been unfrozen`
      );
    } catch (err) {
      console.error('Failed to update user status', err);
      toast.error(err?.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    setActionLoading(true);
    try {
      await apiClient.delete(ENDPOINTS.ADMIN_USERS.DELETE(deleteModal.user.id));

      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id));
      setSelectedUsers((prev) => prev.filter((id) => id !== deleteModal.user.id));
      toast.success(`User ${deleteModal.user.email} deleted successfully`);
      setDeleteModal({ open: false, user: null });
      fetchStats();
    } catch (err) {
      console.error('Failed to delete user', err);
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordModal.user || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN_USERS.RESET_PASSWORD(resetPasswordModal.user.id), {
        newPassword,
      });

      toast.success(`Password reset for ${resetPasswordModal.user.email}`);
      setResetPasswordModal({ open: false, user: null });
      setNewPassword('');
    } catch (err) {
      console.error('Failed to reset password', err);
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined'];
    const rows = filteredUsers.map((user) => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.isActive ? 'Active' : 'Frozen',
      formatDate(user.joined),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Users exported to CSV');
  };

  const handleBulkFreeze = async (freeze) => {
    if (selectedUsers.length === 0) return;
    try {
      await Promise.all(
        selectedUsers.map((id) => {
          const user = users.find((u) => u.id === id);
          if (!user || user.role === 'admin') return null;
          const endpoint = freeze
            ? ENDPOINTS.ADMIN_USERS.FREEZE(id)
            : ENDPOINTS.ADMIN_USERS.UNFREEZE(id);
          return apiClient.post(endpoint);
        })
      );

      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.includes(u.id) && u.role !== 'admin'
            ? { ...u, isActive: freeze ? false : true }
            : u
        )
      );

      toast.success(
        freeze ? 'Selected users frozen successfully' : 'Selected users unfrozen successfully'
      );
      setSelectedUsers([]);
    } catch (err) {
      console.error('Bulk freeze/unfreeze error', err);
      toast.error(err?.response?.data?.message || 'Failed to update selected users');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    const nonAdminUsers = selectedUsers.filter((id) => {
      const user = users.find((u) => u.id === id);
      return user && user.role !== 'admin';
    });

    if (nonAdminUsers.length === 0) {
      toast.error('Cannot delete admin accounts');
      return;
    }

    try {
      await Promise.all(
        nonAdminUsers.map((id) => apiClient.delete(ENDPOINTS.ADMIN_USERS.DELETE(id)))
      );

      setUsers((prev) => prev.filter((u) => !nonAdminUsers.includes(u.id)));
      setSelectedUsers([]);
      toast.success(`${nonAdminUsers.length} user(s) deleted successfully`);
      fetchStats();
    } catch (err) {
      console.error('Bulk delete error', err);
      toast.error(err?.response?.data?.message || 'Failed to delete selected users');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal) * dir;
    }
    if (aVal instanceof Date || bVal instanceof Date) {
      return (new Date(aVal) - new Date(bVal)) * dir;
    }
    return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * dir;
  });

  const filteredUsers = sortedUsers.filter((user) => {
    const roleOk =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && user.role === 'admin') ||
      (roleFilter === 'user' && user.role !== 'admin');

    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'frozen' && !user.isActive);

    return roleOk && statusOk;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/users"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          Users
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
        <span className="text-gray-600 dark:text-gray-300">List</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage customers and admins for FXWallet
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchUsers()}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/admin/users/create">
            <Button className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New User
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                +{stats.newUsersLast7Days} last 7 days
              </span>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Active users
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.activeUsers}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Admin accounts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.adminUsers}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              {/* Role filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {roleFilter === 'all'
                      ? 'All roles'
                      : roleFilter === 'admin'
                      ? 'Admins'
                      : 'Users'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <DropdownMenuItem onClick={() => setRoleFilter('all')}>All roles</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admins</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('user')}>Users</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    {statusFilter === 'all'
                      ? 'All statuses'
                      : statusFilter === 'active'
                      ? 'Active'
                      : 'Frozen'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('frozen')}>Frozen</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk actions bar */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-amber-500/5">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Selected {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkFreeze(true)}
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                >
                  <Snowflake className="h-4 w-4 mr-1" />
                  Freeze
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkFreeze(false)}
                  className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Unfreeze
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 w-12">
                      <Checkbox
                        checked={users.length > 0 && selectedUsers.length === users.length}
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
                    <th className="p-4 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
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
                      <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">
                        {user.name}
                      </td>
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
                        <Badge
                          className={
                            user.isActive
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                          }
                        >
                          {user.isActive ? 'Active' : 'Frozen'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.joined)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 w-48"
                          >
                            <Link href={`/admin/users/${user.id}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/admin/users/${user.id}/edit`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                setResetPasswordModal({ open: true, user })
                              }
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role !== 'admin' && (
                              <>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleFreezeToggle(user)}
                                >
                                  {user.isActive ? (
                                    <>
                                      <Snowflake className="h-4 w-4 mr-2" />
                                      Freeze Account
                                    </>
                                  ) : (
                                    <>
                                      <Sun className="h-4 w-4 mr-2" />
                                      Unfreeze Account
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-500/10"
                                  onClick={() => setDeleteModal({ open: true, user })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredUsers.length} of {total} results
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Per page</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    fetchUsers(newPage);
                  }}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 disabled:opacity-60"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    setPage(newPage);
                    fetchUsers(newPage);
                  }}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 disabled:opacity-60"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, user: null })}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{deleteModal.user?.email}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, user: null })}
              disabled={actionLoading}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog
        open={resetPasswordModal.open}
        onOpenChange={(open) => {
          setResetPasswordModal({ open, user: null });
          setNewPassword('');
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Key className="h-5 w-5 text-amber-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Set a new password for <strong>{resetPasswordModal.user?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordModal({ open: false, user: null });
                setNewPassword('');
              }}
              disabled={actionLoading}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={actionLoading || !newPassword}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
