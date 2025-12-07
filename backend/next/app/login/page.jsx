'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Mail, Lock, Loader2, AlertCircle, ShieldX, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isLoading } = useLogin();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [suspendedAccount, setSuspendedAccount] = useState(null); // { message, details }
  const [isRegistering, setIsRegistering] = useState(false);

  // Check for suspended message on page load (when redirected from a frozen account)
  useEffect(() => {
    const suspendedMessage = sessionStorage.getItem('suspended_message');
    if (suspendedMessage) {
      setSuspendedAccount({
        message: 'Account Suspended',
        details: suspendedMessage,
      });
      // Clear the message after showing it
      sessionStorage.removeItem('suspended_message');
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuspendedAccount(null);

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
          
          // Redirect based on role from FRESH login response only
          // Never use cached localStorage here as it could be stale
          const role = data?.user?.role;
          
          if (role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/wallet/dashboard');
          }
        },
        onError: (err) => {
          // Check if account is suspended (multiple ways to detect)
          const errorMessage = err?.message || '';
          const isSuspended = 
            err?.code === 'ACCOUNT_SUSPENDED' || 
            err?.name === 'AccountSuspended' ||
            errorMessage.toLowerCase().includes('suspended') ||
            errorMessage.toLowerCase().includes('account suspended');
          
          if (isSuspended) {
            setSuspendedAccount({
              message: 'Account Suspended',
              details: errorMessage || 'Your account has been suspended. Please contact support for assistance.',
            });
            toast.error('Account Suspended');
          } else {
            setError(errorMessage || 'Invalid credentials');
            toast.error('Login failed');
          }
        },
      }
    );
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!registerData.fullName || !registerData.email || !registerData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsRegistering(true);

      const { data } = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
      });

      toast.success('Account created! Signing you in...');

      // Auto-login using Refine auth
      login(
        { email: registerData.email, password: registerData.password },
        {
          onSuccess: (loginData) => {
            const role = loginData?.user?.role || data?.user?.role || 'user';
            if (role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/wallet/dashboard');
            }
          },
          onError: () => {
            // If auto-login fails, fallback to login page with prefilled email
            setMode('login');
            setFormData({
              email: registerData.email,
              password: '',
            });
          },
        }
      );
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create account';
      setError(message);
      toast.error(message);
    } finally {
      setIsRegistering(false);
    }
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
          <CardTitle className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {mode === 'login'
              ? 'Sign in to your FXWallet account'
              : 'Register to start using FXWallet'}
          </CardDescription>

          {/* Mode toggle */}
          <div className="mt-4 flex justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`px-3 py-1 rounded-full border text-xs ${
                mode === 'login'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`px-3 py-1 rounded-full border text-xs ${
                mode === 'register'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Suspended Account Warning */}
          {suspendedAccount && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-red-950/50 to-red-900/30 border border-red-500/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                  <ShieldX className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 text-sm">{suspendedAccount.message}</h3>
                  <p className="mt-1 text-xs text-red-300/80">{suspendedAccount.details}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <Phone className="h-3 w-3" />
                    <span>Contact support: <a href="mailto:support@fxwallet.com" className="text-amber-400 hover:underline">support@fxwallet.com</a></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuspendedAccount(null)}
                className="mt-3 w-full text-xs text-gray-500 hover:text-gray-400"
              >
                Try another account
              </button>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Error message */}
              {error && !suspendedAccount && (
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
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="registerEmail" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="registerPassword" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold h-11"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
