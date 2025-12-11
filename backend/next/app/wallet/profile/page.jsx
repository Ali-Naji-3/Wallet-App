'use client';

import { useState, useEffect } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { User, Mail, Shield, Calendar, Settings, Edit, Wallet, Lock, Key, Eye, EyeOff, History } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';

export default function WalletProfilePage() {
  const { data: identity, isLoading } = useGetIdentity();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [loginHistoryOpen, setLoginHistoryOpen] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  
  // Security logs state
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load security settings when modal opens
  useEffect(() => {
    if (securityOpen) {
      loadSecuritySettings();
    }
  }, [securityOpen]);

  // Load security logs when modal opens
  useEffect(() => {
    if (loginHistoryOpen) {
      loadSecurityLogs();
    }
  }, [loginHistoryOpen]);

  const loadSecuritySettings = async () => {
    setLoadingSecurity(true);
    try {
      const { data } = await apiClient.get('/api/auth/security');
      if (data.success) {
        setSecuritySettings({
          twoFactorEnabled: data.security?.twoFactorEnabled || false,
        });
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoadingSecurity(false);
    }
  };

  const loadSecurityLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data } = await apiClient.get('/api/auth/security-logs');
      if (data.success) {
        setSecurityLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading security logs:', error);
      toast.error('Failed to load login history');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Password strength validation
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordStrengthRegex.test(passwordData.newPassword)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setChangePasswordOpen(false);
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggle2FA = async (enabled) => {
    setSecurityLoading(true);
    try {
      const { data } = await apiClient.put('/api/auth/security', {
        twoFactorEnabled: enabled,
      });

      if (data.success) {
        setSecuritySettings({ ...securitySettings, twoFactorEnabled: enabled });
        toast.success(`Two-Factor Authentication ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(data.message || 'Failed to update security settings');
      }
    } catch (error) {
      console.error('[Profile] Error toggling 2FA:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update security settings';
      toast.error(errorMessage);
      
      // Log full error details for debugging
      if (error.response) {
        console.error('[Profile] Error response:', error.response.data);
        console.error('[Profile] Error status:', error.response.status);
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  const formatAction = (action) => {
    const actionMap = {
      'password_changed': 'Password Changed',
      '2fa_enabled': '2FA Enabled',
      '2fa_disabled': '2FA Disabled',
      'login': 'Login',
      'logout': 'Logout',
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-800 rounded"></div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-20 w-20 border-2 border-slate-600">
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-2xl font-semibold">
                {identity?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {identity?.name || 'User'}
                </h2>
                <p className="text-slate-400">
                  {identity?.email || 'user@example.com'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <Wallet className="h-3 w-3 mr-1" />
                  Premium Member
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  Verified
                </Badge>
              </div>
            </div>

            {/* Edit Button */}
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Full Name</p>
              <p className="text-white">{identity?.name || 'User'}</p>
            </div>
            <Separator className="bg-slate-700" />
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-white">{identity?.email || 'user@example.com'}</p>
            </div>
            <Separator className="bg-slate-700" />
            <div>
              <p className="text-sm text-slate-500">Member Since</p>
              <p className="text-white">{new Date().toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setChangePasswordOpen(true)}
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setSecurityOpen(true)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Two-Factor Auth
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setLoginHistoryOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              Login History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your account password. Make sure it's strong and secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white pr-10"
                  placeholder="Enter current password"
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
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Settings Dialog */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Manage your account security preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingSecurity ? (
              <div className="text-center py-4 text-slate-400">Loading...</div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-slate-500 text-sm">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                  disabled={securityLoading}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSecurityOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={loginHistoryOpen} onOpenChange={setLoginHistoryOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Login History
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              View your recent security activities
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {loadingLogs ? (
              <div className="text-center py-8 text-slate-400">Loading...</div>
            ) : securityLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No security logs found</div>
            ) : (
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">{formatAction(log.action)}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {log.ipAddress} • {log.userAgent?.substring(0, 50)}...
                        </p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLoginHistoryOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
