'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  Globe,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

export default function CreateUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user',
    baseCurrency: 'USD',
    timezone: 'UTC',
    isActive: true,
  });

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN_USERS.CREATE, formData);
      toast.success('User created successfully');
      router.push('/admin/users');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create user';
      toast.error(message);
      if (message.includes('already registered')) {
        setErrors({ email: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/users" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          Users
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <span className="text-gray-600 dark:text-gray-300">Create</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create User</h1>
          <p className="text-gray-600 dark:text-gray-400">Add a new user to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Basic Information</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  User account credentials and identity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : ''
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
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
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
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Role & Permissions</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Set user access level and account status
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => updateField('role', value)}
                disabled={isLoading}
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
                {formData.role === 'admin'
                  ? 'Administrators have full access to the admin panel'
                  : 'Customers can only access their wallet and transactions'}
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="space-y-0.5">
                <Label className="text-gray-700 dark:text-gray-300">Account Status</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.isActive ? 'User can login and use the app' : 'User account is frozen'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={formData.isActive
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                }>
                  {formData.isActive ? 'Active' : 'Frozen'}
                </Badge>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Preferences</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Currency and regional settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Base Currency */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Base Currency</Label>
              <Select
                value={formData.baseCurrency}
                onValueChange={(value) => updateField('baseCurrency', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <SelectItem value="USD" className="text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>🇺🇸</span> USD - US Dollar
                    </div>
                  </SelectItem>
                  <SelectItem value="EUR" className="text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>🇪🇺</span> EUR - Euro
                    </div>
                  </SelectItem>
                  <SelectItem value="LBP" className="text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>🇱🇧</span> LBP - Lebanese Pound
                    </div>
                  </SelectItem>
                  <SelectItem value="GBP" className="text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>🇬🇧</span> GBP - British Pound
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => updateField('timezone', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <SelectItem value="UTC" className="text-gray-900 dark:text-white">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="America/New_York" className="text-gray-900 dark:text-white">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Los_Angeles" className="text-gray-900 dark:text-white">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London" className="text-gray-900 dark:text-white">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris" className="text-gray-900 dark:text-white">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Beirut" className="text-gray-900 dark:text-white">Beirut (EET)</SelectItem>
                  <SelectItem value="Asia/Dubai" className="text-gray-900 dark:text-white">Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link href="/admin/users">
            <Button type="button" variant="outline" disabled={isLoading} className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
