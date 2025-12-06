'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Globe,
  DollarSign,
  Key,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Snowflake,
  Sun,
  Trash2,
  RefreshCw,
  Calendar,
  CreditCard,
  Euro,
  AlertTriangle,
  Info,
  Lock,
} from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().optional().nullable(),
  role: z.enum(['user', 'admin']).default('user'),
  baseCurrency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Modal states
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(userSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const role = watch('role');
  const isActive = watch('isActive');
  const email = watch('email');
  const fullName = watch('fullName');
  const baseCurrency = watch('baseCurrency');
  const timezone = watch('timezone');

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get(ENDPOINTS.ADMIN_USERS.GET(userId));
        const userData = data.user;
        setUser(userData);

        const formData = {
          email: userData.email || '',
          fullName: userData.fullName || userData.full_name || '',
          role: userData.role || 'user',
          baseCurrency: userData.baseCurrency || userData.base_currency || 'USD',
          timezone: userData.timezone || 'UTC',
          isActive: userData.isActive ?? userData.is_active ?? true,
        };

        reset(formData);
        setOriginalData(formData);
      } catch (err) {
        console.error('Failed to fetch user', err);
        toast.error(err?.response?.data?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, reset]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const current = {
        email,
        fullName,
        role,
        baseCurrency,
        timezone,
        isActive,
      };
      const changed = JSON.stringify(current) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [email, fullName, role, baseCurrency, timezone, isActive, originalData]);

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      await apiClient.put(ENDPOINTS.ADMIN_USERS.UPDATE(userId), {
        email: values.email,
        fullName: values.fullName,
        role: values.role,
        baseCurrency: values.baseCurrency,
        timezone: values.timezone,
        isActive: values.isActive,
      });

      toast.success('User updated successfully');
      router.push('/admin/users');
    } catch (err) {
      console.error('Failed to update user', err);
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      setActionLoading(true);
      await apiClient.post(ENDPOINTS.ADMIN_USERS.RESET_PASSWORD(userId), {
        newPassword: values.newPassword,
      });

      toast.success('Password reset successfully');
      setResetPasswordModal(false);
      resetPassword();
    } catch (err) {
      console.error('Failed to reset password', err);
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      const endpoint = user.isActive
        ? ENDPOINTS.ADMIN_USERS.FREEZE(user.id)
        : ENDPOINTS.ADMIN_USERS.UNFREEZE(user.id);

      await apiClient.post(endpoint);
      setUser((prev) => ({ ...prev, isActive: !prev.isActive }));
      setValue('isActive', !user.isActive);
      toast.success(user.isActive ? 'User frozen' : 'User unfrozen');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiClient.delete(ENDPOINTS.ADMIN_USERS.DELETE(userId));
      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">User not found</p>
        <Link href="/admin/users">
          <Button>Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/users"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          Users
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Link
          href={`/admin/users/${userId}`}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          {user.fullName || user.email}
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <span className="text-gray-600 dark:text-gray-300">Edit</span>
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
                Edit User
                {hasChanges && (
                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    Unsaved changes
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update user information and settings
              </p>
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
              disabled={actionLoading}
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      Update user's personal information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      {...register('email')}
                      disabled={saving}
                      className={`pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      {...register('fullName')}
                      disabled={saving}
                      className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Account Created</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role & Status */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Role & Status</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      Manage user permissions and account status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">User Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setValue('role', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <SelectItem value="user" className="text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-500" />
                          Customer
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" className="text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-pink-500" />
                          Administrator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {role === 'admin'
                      ? 'Administrators have full access to the admin panel'
                      : 'Customers can only access their wallet and transactions'}
                  </p>
                </div>

                <Separator />

                {/* Active Status */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-0.5">
                    <Label className="text-gray-700 dark:text-gray-300">Account Status</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isActive
                        ? 'User can login and use the application'
                        : 'User account is frozen and cannot login'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      }
                    >
                      {isActive ? 'Active' : 'Frozen'}
                    </Badge>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => setValue('isActive', checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Link href="/admin/users">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving || !hasChanges}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Globe className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Regional Settings</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      Configure currency and timezone preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {/* Base Currency */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Base Currency</Label>
                  <Select
                    value={baseCurrency}
                    onValueChange={(value) => setValue('baseCurrency', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <SelectItem value="USD" className="text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          USD - US Dollar
                        </div>
                      </SelectItem>
                      <SelectItem value="EUR" className="text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4" />
                          EUR - Euro
                        </div>
                      </SelectItem>
                      <SelectItem value="LBP" className="text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          LBP - Lebanese Pound
                        </div>
                      </SelectItem>
                      <SelectItem value="GBP" className="text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>£</span>
                          GBP - British Pound
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Timezone</Label>
                  <Select
                    value={timezone}
                    onValueChange={(value) => setValue('timezone', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <SelectItem value="UTC" className="text-gray-900 dark:text-white">
                        UTC (Coordinated Universal Time)
                      </SelectItem>
                      <SelectItem value="America/New_York" className="text-gray-900 dark:text-white">
                        Eastern Time (ET)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles" className="text-gray-900 dark:text-white">
                        Pacific Time (PT)
                      </SelectItem>
                      <SelectItem value="Europe/London" className="text-gray-900 dark:text-white">
                        London (GMT)
                      </SelectItem>
                      <SelectItem value="Europe/Paris" className="text-gray-900 dark:text-white">
                        Paris (CET)
                      </SelectItem>
                      <SelectItem value="Asia/Beirut" className="text-gray-900 dark:text-white">
                        Beirut (EET)
                      </SelectItem>
                      <SelectItem value="Asia/Dubai" className="text-gray-900 dark:text-white">
                        Dubai (GST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end pt-4">
              <Button
                type="submit"
                disabled={saving || !hasChanges}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Key className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Password Management</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Reset user's password securely
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Password Reset
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Click the button below to set a new password for this user. The user will need to
                      use this new password to login.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setResetPasswordModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {user.role !== 'admin' && (
            <Card className="bg-white dark:bg-gray-900 border-red-200 dark:border-red-900/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Irreversible actions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-300">
                        Delete User Account
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        Once you delete a user account, there is no going back. Please be certain.
                      </p>
                    </div>
                  </div>
                </div>
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
      </Tabs>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordModal} onOpenChange={setResetPasswordModal}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Key className="h-5 w-5 text-amber-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Set a new password for <strong>{user.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPassword(handleResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  {...registerPassword('newPassword')}
                  className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    passwordErrors.newPassword ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  {...registerPassword('confirmPassword')}
                  className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    passwordErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetPasswordModal(false);
                  resetPassword();
                }}
                disabled={actionLoading}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{user.email}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal(false)}
              disabled={actionLoading}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
