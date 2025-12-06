'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Mail,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'FXWallet',
    siteEmail: 'admin@fxwallet.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    twoFactorRequired: false,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your application settings</p>
        </div>
        <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-gray-900">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-amber-500" />
            General Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Basic configuration for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-gray-300">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteEmail" className="text-gray-300">Contact Email</Label>
              <Input
                id="siteEmail"
                type="email"
                value={settings.siteEmail}
                onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <Separator className="bg-gray-800" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Maintenance Mode</p>
              <p className="text-gray-500 text-sm">Disable access for regular users</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">User Registration</p>
              <p className="text-gray-500 text-sm">Allow new users to register</p>
            </div>
            <Switch
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notifications
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-gray-500 text-sm">Receive email alerts for important events</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Security
          </CardTitle>
          <CardDescription className="text-gray-400">
            Security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Require Two-Factor Auth</p>
              <p className="text-gray-500 text-sm">Force all users to enable 2FA</p>
            </div>
            <Switch
              checked={settings.twoFactorRequired}
              onCheckedChange={(checked) => setSettings({ ...settings, twoFactorRequired: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
