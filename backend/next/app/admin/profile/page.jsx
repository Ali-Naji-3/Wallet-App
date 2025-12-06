'use client';

import { useGetIdentity } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: identity, isLoading } = useGetIdentity();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-slate-200 dark:border-slate-700">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-3xl font-semibold">
                {identity?.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {identity?.name || 'Admin User'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  {identity?.email || 'admin@admin.com'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {identity?.role || 'Administrator'}
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-600">
                  Active
                </Badge>
              </div>
            </div>

            {/* Edit Button */}
            <Link href="/admin/settings">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Info */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {identity?.email || 'admin@admin.com'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {identity?.role || 'Administrator'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Member Since</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/settings" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Shield className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Mail className="mr-2 h-4 w-4" />
              Email Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

