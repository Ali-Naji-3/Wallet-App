'use client';

import { useGetIdentity } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, Calendar, Settings, Edit, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function WalletProfilePage() {
  const { data: identity, isLoading } = useGetIdentity();

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
            <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800">
              Two-Factor Auth
            </Button>
            <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800">
              Login History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

