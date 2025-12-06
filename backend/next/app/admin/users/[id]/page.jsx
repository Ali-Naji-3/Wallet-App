'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Mail,
  Calendar,
  Globe,
  Shield,
  User,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Key,
  Snowflake,
  Sun,
  Trash2,
  DollarSign,
  Euro,
  CreditCard,
  TrendingUp,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function UserShowPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteModal, setDeleteModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(ENDPOINTS.ADMIN_USERS.GET(userId));
      setUser(data.user);
      setWallets(data.wallets || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch user', err);
      setError(err?.response?.data?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFreezeToggle = async () => {
    if (!user) return;
    try {
      const endpoint = user.isActive
        ? ENDPOINTS.ADMIN_USERS.FREEZE(user.id)
        : ENDPOINTS.ADMIN_USERS.UNFREEZE(user.id);

      await apiClient.post(endpoint);
      setUser((prev) => ({ ...prev, isActive: !prev.isActive }));
      toast.success(user.isActive ? 'User frozen' : 'User unfrozen');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await apiClient.delete(ENDPOINTS.ADMIN_USERS.DELETE(user.id));
      toast.success('User deleted');
      router.push('/admin/users');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN_USERS.RESET_PASSWORD(user.id), { newPassword });
      toast.success('Password reset successfully');
      setResetPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBalance = (amount, currency) => {
    const num = parseFloat(amount) || 0;
    if (currency === 'LBP') {
      return `${num.toLocaleString()} ل.ل`;
    }
    if (currency === 'EUR') {
      return `€${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getCurrencyIcon = (currency) => {
    switch (currency) {
      case 'EUR':
        return <Euro className="h-4 w-4" />;
      case 'LBP':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'User not found'}</p>
        <Link href="/admin/users">
          <Button>Back to Users</Button>
        </Link>
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, w) => {
    // Convert to USD for simplicity
    const balance = parseFloat(w.balance) || 0;
    if (w.currency_code === 'LBP') return sum + balance / 89500;
    if (w.currency_code === 'EUR') return sum + balance * 1.08;
    return sum + balance;
  }, 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/users"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          Users
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
        <span className="text-gray-600 dark:text-gray-300">{user.fullName || user.email}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl font-bold text-gray-900">
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {user.fullName || 'No Name'}
                <Badge
                  className={
                    user.role === 'admin'
                      ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }
                >
                  {user.role === 'admin' ? (
                    <Shield className="h-3 w-3 mr-1" />
                  ) : (
                    <User className="h-3 w-3 mr-1" />
                  )}
                  {user.role === 'admin' ? 'Admin' : 'Customer'}
                </Badge>
                <Badge
                  className={
                    user.isActive
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                  }
                >
                  {user.isActive ? 'Active' : 'Frozen'}
                </Badge>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setResetPasswordModal(true)}
            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
          {user.role !== 'admin' && (
            <Button
              variant="outline"
              onClick={handleFreezeToggle}
              className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            >
              {user.isActive ? (
                <>
                  <Snowflake className="h-4 w-4 mr-2" />
                  Freeze
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Unfreeze
                </>
              )}
            </Button>
          )}
          <Link href={`/admin/users/${user.id}/edit`}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-gray-900">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Balance</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Transactions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalTransactions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Exchanges</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats?.exchanges || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Transfers</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats?.transfers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            Overview
          </TabsTrigger>
          <TabsTrigger value="wallets" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            Wallets ({wallets.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="text-gray-900 dark:text-white">{user.fullName || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Base Currency</p>
                    <p className="text-gray-900 dark:text-white">{user.baseCurrency || 'USD'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Timezone</p>
                    <p className="text-gray-900 dark:text-white">{user.timezone || 'UTC'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                    <p className="text-gray-900 dark:text-white capitalize">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          {user.role !== 'admin' && (
            <Card className="bg-white dark:bg-gray-900 border-red-200 dark:border-red-900/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Irreversible actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-4">
          {wallets.length === 0 ? (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No wallets found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {wallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          {getCurrencyIcon(wallet.currency_code)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {wallet.currency_code}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Wallet</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          wallet.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }
                      >
                        {wallet.status}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatBalance(wallet.balance, wallet.currency_code)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono truncate">
                      {wallet.address}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Activity log coming soon</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                User has {stats?.totalTransactions || 0} transactions
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Modal */}
      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{user?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordModal} onOpenChange={(open) => { setResetPasswordModal(open); setNewPassword(''); }}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Key className="h-5 w-5 text-amber-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Set a new password for <strong>{user?.email}</strong>
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
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordModal(false); setNewPassword(''); }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={actionLoading || !newPassword}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
