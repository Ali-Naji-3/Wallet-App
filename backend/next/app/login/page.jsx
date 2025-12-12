'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@refinedev/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Mail, Lock, Loader2, AlertCircle, ShieldX, Phone, XCircle, Ban, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isLoading: refineIsLoading } = useLogin();
  
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
  const [accountIssue, setAccountIssue] = useState(null); // { type, message, details, code }
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Local loading state to override Refine's
  
  // Use local loading state - it's more reliable than Refine's isLoading
  const isLoading = isLoggingIn || refineIsLoading;

  // Check for suspended message on page load (when redirected from a frozen account)
  useEffect(() => {
    const suspendedMessage = sessionStorage.getItem('suspended_message');
    if (suspendedMessage) {
      setAccountIssue({
        type: 'frozen',
        message: 'Account Frozen',
        details: suspendedMessage,
        code: 'ACCOUNT_FROZEN',
      });
      // Show toast notification
      toast.error('Account Frozen', {
        description: suspendedMessage,
        duration: 6000,
      });
      // Clear the message after showing it
      sessionStorage.removeItem('suspended_message');
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any event bubbling
    
    // Prevent form from submitting normally
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    setError('');
    setAccountIssue(null);
    setIsLoggingIn(true); // Set local loading state

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setIsLoggingIn(false); // Clear loading state
      toast.error('Missing Information', {
        description: 'Please enter both email and password',
        duration: 3000,
      });
      return false; // Prevent any further execution
    }

    // Helper function to handle errors and show notifications
    const handleError = (errorResponse) => {
      // Handle multiple possible error structures
      const responseData = errorResponse?.response?.data || errorResponse?.data || errorResponse || {};
      const errorCode = responseData.code || errorResponse?.code;
      const errorMessage = responseData.details || responseData.message || errorResponse?.message || errorResponse?.error?.message || '';
      const errorName = errorResponse?.name || responseData?.name || '';
      const statusCode = errorResponse?.response?.status || errorResponse?.status;
      
      console.log('[Login Page] Handling error:', { 
        errorCode, 
        errorMessage, 
        errorName, 
        statusCode,
        responseData,
        fullError: errorResponse 
      });
      
      // Always show toast notification - this ensures user sees feedback
      // Check for frozen account (multiple ways to detect)
      if (errorCode === 'ACCOUNT_FROZEN' || errorCode === 'ACCOUNT_SUSPENDED' || 
          errorName === 'AccountFrozen' || errorName === 'AccountSuspended' ||
          statusCode === 403) {
        const message = errorMessage || 'Your account has been frozen. Please contact support for assistance.';
        console.log('[Login Page] Showing frozen account notification:', message);
        setAccountIssue({
          type: 'frozen',
          message: 'Account Frozen',
          details: message,
          code: errorCode || 'ACCOUNT_FROZEN',
        });
        // Show toast IMMEDIATELY - no delay to prevent page reload
        toast.error('Account Frozen', {
          description: message,
          duration: 6000,
        });
      } else if (errorCode === 'ACCOUNT_DELETED' || errorName === 'AccountDeleted') {
        const message = errorMessage || 'This account has been deleted. If you believe this is an error, please contact support.';
        console.log('[Login Page] Showing deleted account notification:', message);
        setAccountIssue({
          type: 'deleted',
          message: 'Account Deleted',
          details: message,
          code: 'ACCOUNT_DELETED',
        });
        // Show toast IMMEDIATELY
        toast.error('Account Deleted', {
          description: message,
          duration: 6000,
        });
      } else if (errorCode === 'ACCOUNT_REJECTED' || errorName === 'AccountRejected') {
        const message = errorMessage || 'Your account has been rejected due to KYC verification failure. Please contact support for assistance.';
        console.log('[Login Page] Showing rejected account notification:', message);
        setAccountIssue({
          type: 'rejected',
          message: 'Account Rejected',
          details: message,
          code: 'ACCOUNT_REJECTED',
        });
        // Show toast IMMEDIATELY
        toast.error('Account Rejected', {
          description: message,
          duration: 6000,
        });
      } else if (errorCode === 'INVALID_EMAIL' || errorName === 'InvalidEmail') {
        const message = errorMessage || 'The email address you entered is not registered.';
        console.log('[Login Page] Showing invalid email notification:', message);
        setError(message);
        // Show toast IMMEDIATELY
        toast.error('Email Not Found', {
          description: message,
          duration: 4000,
        });
      } else if (errorCode === 'INVALID_PASSWORD' || errorName === 'InvalidPassword') {
        const message = errorMessage || 'The password you entered is incorrect.';
        console.log('[Login Page] Showing invalid password notification:', message);
        setError(message);
        // Show toast IMMEDIATELY
        toast.error('Incorrect Password', {
          description: message,
          duration: 4000,
        });
      } else {
        // Generic error fallback - always show notification
        const message = errorMessage || 'Invalid credentials. Please check your email and password.';
        console.log('[Login Page] Showing generic error notification:', message);
        setError(message);
        // Show toast IMMEDIATELY
        toast.error('Login Failed', {
          description: message,
          duration: 4000,
        });
      }
    };

    login(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: (data) => {
          setIsLoggingIn(false); // Clear loading state immediately
          toast.success('Login successful!', {
            description: 'Welcome back! Redirecting to your dashboard...',
            duration: 3000,
          });
          
          // Get role from fresh login response
          const role = data?.user?.role;
          
          // Use window.location for FASTER redirect (bypasses RSC fetch issues)
          // Small delay ensures localStorage is written
          setTimeout(() => {
          if (role === 'admin') {
              window.location.href = '/admin/dashboard';
          } else {
              window.location.href = '/wallet/dashboard';
          }
          }, 100);
        },
        onError: (err) => {
          // CRITICAL: Clear loading state IMMEDIATELY
          setIsLoggingIn(false);
          
          console.log('[Login Page] Error received from Refine:', err);
          console.log('[Login Page] Error structure:', JSON.stringify(err, null, 2));
          console.log('[Login Page] Error type:', typeof err);
          console.log('[Login Page] Error keys:', Object.keys(err || {}));
          
          // CRITICAL: Prevent any page reload or navigation
          // Show notification IMMEDIATELY before any async operations
          
          // Handle different error object structures (Refine might wrap it)
          // The error could be:
          // 1. Direct error object from auth provider
          // 2. Wrapped in err.error
          // 3. In err.response.data
          // 4. Direct properties on err
          
          let errorToHandle = null;
          
          // Try to extract error from various possible structures
          if (err?.error) {
            errorToHandle = err.error;
            console.log('[Login Page] Found error in err.error:', errorToHandle);
          } else if (err?.response?.data) {
            errorToHandle = err.response.data;
            console.log('[Login Page] Found error in err.response.data:', errorToHandle);
          } else if (err?.code || err?.name || err?.message) {
            errorToHandle = err;
            console.log('[Login Page] Using err directly:', errorToHandle);
          } else {
            // Last resort: check if err itself has the structure
            errorToHandle = err;
            console.log('[Login Page] Using err as-is (fallback):', errorToHandle);
          }
          
          // Now handle the error
          if (errorToHandle) {
            console.log('[Login Page] Handling error:', errorToHandle);
            handleError(errorToHandle);
          } else {
            // Fallback: Show generic error notification immediately
            console.warn('[Login Page] Unexpected error structure, showing generic notification');
            const genericMessage = err?.message || 'Login failed. Please check your credentials and try again.';
            setError(genericMessage);
            toast.error('Login Failed', {
              description: genericMessage,
              duration: 5000,
            });
          }
          
          // Prevent any navigation - return false explicitly
          return false;
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
            // Use window.location for FASTER redirect (bypasses RSC issues)
            setTimeout(() => {
            if (role === 'admin') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/wallet/dashboard';
            }
            }, 100);
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orbs with smooth animation */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Secondary smaller orbs for depth */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl animate-blob" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl animate-blob animation-delay-4000" />
        
        {/* Subtle noise overlay for texture */}
        <div className="absolute inset-0 bg-noise opacity-[0.015]" />
      </div>
      
      {/* Glassmorphism Card */}
      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800/50 relative z-10 shadow-2xl shadow-black/50">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-105">
              <Wallet className="h-8 w-8 text-gray-900 transition-transform duration-300 hover:rotate-12" />
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
                setAccountIssue(null);
              }}
              className={`px-3 py-1 rounded-full border text-xs transition-all duration-300 ${
                mode === 'login'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/20'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setAccountIssue(null);
              }}
              className={`px-3 py-1 rounded-full border text-xs transition-all duration-300 ${
                mode === 'register'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/20'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Register
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Account Issue Notification - Professional Display */}
          {accountIssue && (
            <div className={`mb-4 p-4 rounded-xl border ${
              accountIssue.type === 'frozen' 
                ? 'bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-500/30'
                : accountIssue.type === 'rejected'
                ? 'bg-gradient-to-br from-orange-950/50 to-orange-900/30 border-orange-500/30'
                : accountIssue.type === 'deleted'
                ? 'bg-gradient-to-br from-gray-950/50 to-gray-900/30 border-gray-500/30'
                : 'bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  accountIssue.type === 'frozen'
                    ? 'bg-red-500/20'
                    : accountIssue.type === 'rejected'
                    ? 'bg-orange-500/20'
                    : accountIssue.type === 'deleted'
                    ? 'bg-gray-500/20'
                    : 'bg-red-500/20'
                }`}>
                  {accountIssue.type === 'frozen' ? (
                    <Ban className="h-5 w-5 text-red-400" />
                  ) : accountIssue.type === 'rejected' ? (
                    <XCircle className="h-5 w-5 text-orange-400" />
                  ) : accountIssue.type === 'deleted' ? (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  ) : (
                  <ShieldX className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm ${
                    accountIssue.type === 'frozen'
                      ? 'text-red-400'
                      : accountIssue.type === 'rejected'
                      ? 'text-orange-400'
                      : accountIssue.type === 'deleted'
                      ? 'text-gray-400'
                      : 'text-red-400'
                  }`}>
                    {accountIssue.message}
                  </h3>
                  <p className={`mt-1 text-xs ${
                    accountIssue.type === 'frozen'
                      ? 'text-red-300/80'
                      : accountIssue.type === 'rejected'
                      ? 'text-orange-300/80'
                      : accountIssue.type === 'deleted'
                      ? 'text-gray-300/80'
                      : 'text-red-300/80'
                  }`}>
                    {accountIssue.details}
                  </p>
                  {(accountIssue.type === 'frozen' || accountIssue.type === 'rejected' || accountIssue.type === 'deleted') && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Phone className="h-3 w-3" />
                    <span>Contact support: <a href="mailto:support@fxwallet.com" className="text-amber-400 hover:underline">support@fxwallet.com</a></span>
                  </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-gray-900 text-xs h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[Login Page] Navigating to support page');
                          try {
                            router.push('/wallet/support');
                          } catch (error) {
                            console.error('[Login Page] Navigation error, using window.location:', error);
                            // Fallback to window.location if router fails
                            window.location.href = '/wallet/support';
                          }
                        }}
                        disabled={false}
                      >
                        <Mail className="h-3 w-3 mr-2" />
                        Submit Support Request
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccountIssue(null)}
                className="mt-3 w-full text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Try another account
              </button>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {/* Error message */}
              {error && !accountIssue && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
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
                    className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 hover:border-gray-600"
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
                    className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 hover:border-gray-600"
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-semibold h-11 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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

              {/* Test Notification Button (for debugging) */}
              <div className="pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Test] Showing test notification');
                    toast.error('Test Notification', {
                      description: 'If you see this, notifications are working!',
                      duration: 3000,
                    });
                  }}
                  className="w-full text-xs text-gray-500 hover:text-gray-400 underline"
                >
                  Test Notification (Click to verify notifications work)
                </button>
              </div>

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
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
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
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 hover:border-gray-600"
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
                    className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 hover:border-gray-600"
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
                    className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 hover:border-gray-600"
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
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 hover:border-gray-600"
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-semibold h-11 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
