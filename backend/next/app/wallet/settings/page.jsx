'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useGetIdentity } from '@refinedev/core';
import {
  Settings,
  User,
  Shield,
  Bell,
  Lock,
  Globe,
  CreditCard,
  Smartphone,
  Mail,
  Save,
  Eye,
  EyeOff,
  Key,
  Smartphone as Phone,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WalletSettingsPage() {
  const { data: identity } = useGetIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: identity?.name || '',
    email: identity?.email || '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    transactionAlerts: true,
    marketingEmails: false,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    biometricAuth: false,
    sessionTimeout: '30',
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Profile updated successfully!');
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="phone"
                type="tel"
                placeholder="+961 3 123 456"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white pl-10"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Security
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Change Password
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isLoading}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-slate-500 text-sm">Add an extra layer of security</p>
            </div>
            <Switch
              checked={security.twoFactorAuth}
              onCheckedChange={(checked) => setSecurity({ ...security, twoFactorAuth: checked })}
            />
          </div>

          {/* Biometric Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Biometric Authentication</p>
              <p className="text-slate-500 text-sm">Use fingerprint or face ID</p>
            </div>
            <Switch
              checked={security.biometricAuth}
              onCheckedChange={(checked) => setSecurity({ ...security, biometricAuth: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            Notifications
          </CardTitle>
          <CardDescription className="text-slate-400">
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-slate-500 text-sm">Receive updates via email</p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-slate-500 text-sm">Get instant alerts on your device</p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Transaction Alerts</p>
              <p className="text-slate-500 text-sm">Notify me about all transactions</p>
            </div>
            <Switch
              checked={notifications.transactionAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, transactionAlerts: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Marketing Emails</p>
              <p className="text-slate-500 text-sm">Receive promotional content</p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            Preferences
          </CardTitle>
          <CardDescription className="text-slate-400">
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Default Currency</p>
              <p className="text-slate-500 text-sm">USD</p>
            </div>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              Change
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Language</p>
              <p className="text-slate-500 text-sm">English</p>
            </div>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              Change
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Session Timeout</p>
              <p className="text-slate-500 text-sm">{security.sessionTimeout} minutes</p>
            </div>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


