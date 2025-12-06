'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isLoading } = useLogin();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    login(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: (data) => {
          toast.success('Login successful!');
          
          // Redirect based on role
          const role = data?.user?.role || localStorage.getItem('user_role');
          
          if (role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/wallet/dashboard');
          }
        },
        onError: (err) => {
          setError(err?.message || 'Invalid credentials');
          toast.error('Login failed');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-gray-950 to-purple-500/5" />
      
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 relative z-10">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
              <Wallet className="h-8 w-8 text-gray-900" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to your FXWallet account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@admin.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            {/* Demo credentials */}
            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-500 text-center mb-3">Demo credentials:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-gray-800/50 text-center">
                  <p className="text-gray-400 mb-1">Admin</p>
                  <p className="text-gray-300">admin@admin.com</p>
                  <p className="text-gray-500">admin123</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-800/50 text-center">
                  <p className="text-gray-400 mb-1">Customer</p>
                  <p className="text-gray-300">user@example.com</p>
                  <p className="text-gray-500">password</p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
