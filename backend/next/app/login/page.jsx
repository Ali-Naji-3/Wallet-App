'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet, Mail, Lock, Loader2, AlertCircle, ShieldX,
  Phone, XCircle, Ban, ArrowRight, CheckCircle2,
  TrendingUp, Globe, Shield, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Check for suspended message or account_credited on page load
  useEffect(() => {
    // Check for account credited message (from admin credit)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const message = params.get('message');

      if (message === 'account_credited') {
        toast.success('Account Credited!', {
          description: 'Your wallet has been credited by an administrator. Please login to see your updated balance.',
          duration: 8000,
        });
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Check for suspended message (when redirected from a frozen account)
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
    e.stopPropagation();

    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    setError('');
    setAccountIssue(null);
    setIsLoggingIn(true);

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setIsLoggingIn(false);
      toast.error('Missing Information', {
        description: 'Please enter both email and password',
        duration: 3000,
      });
      return false;
    }

    // Helper function to handle errors and show notifications
    const handleError = (errorResponse) => {
      const responseData = errorResponse?.response?.data || errorResponse?.data || errorResponse || {};
      const errorCode = responseData.code || errorResponse?.code;
      const errorMessage = responseData.details || responseData.message || errorResponse?.message || errorResponse?.error?.message || '';
      const errorName = errorResponse?.name || responseData?.name || '';
      const statusCode = errorResponse?.response?.status || errorResponse?.status;

      console.log('[Login Page] Handling error:', {
        errorCode, errorMessage, errorName, statusCode
      });

      // Handle known error codes
      if (errorCode === 'ACCOUNT_FROZEN' || errorCode === 'ACCOUNT_SUSPENDED' || statusCode === 403) {
        const message = errorMessage || 'Your account has been frozen. Please contact support for assistance.';
        setAccountIssue({
          type: 'frozen',
          message: 'Account Frozen',
          details: message,
          code: errorCode || 'ACCOUNT_FROZEN',
        });
        toast.error('Account Frozen', { description: message, duration: 6000 });
      } else if (errorCode === 'ACCOUNT_DELETED') {
        setAccountIssue({
          type: 'deleted',
          message: 'Account Deleted',
          details: errorMessage,
          code: 'ACCOUNT_DELETED',
        });
        toast.error('Account Deleted', { description: errorMessage, duration: 6000 });
      } else if (errorCode === 'ACCOUNT_REJECTED') {
        const message = errorMessage || 'Your account has been rejected due to KYC verification failure.';
        setAccountIssue({
          type: 'rejected',
          message: 'Account Rejected',
          details: message,
          code: 'ACCOUNT_REJECTED',
        });
        toast.error('Account Rejected', { description: message, duration: 6000 });
      } else {
        const message = errorMessage || 'Invalid credentials. Please check your email and password.';
        setError(message);
        toast.error('Login Failed', { description: message, duration: 4000 });
      }
    };

    login(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: (data) => {
          setIsLoggingIn(false);
          toast.success('Login successful!', {
            description: 'Welcome back! Redirecting to your dashboard...',
            duration: 3000,
          });

          const role = data?.user?.role;
          setTimeout(() => {
            if (role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else {
              window.location.href = '/wallet/dashboard';
            }
          }, 100);
        },
        onError: (err) => {
          setIsLoggingIn(false);

          // Error parsing logic
          let errorToHandle = err?.error || err?.response?.data || err;
          handleError(errorToHandle);

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

      // Auto-login
      login(
        { email: registerData.email, password: registerData.password },
        {
          onSuccess: (loginData) => {
            const role = loginData?.user?.role || data?.user?.role || 'user';
            setTimeout(() => {
              if (role === 'admin') {
                window.location.href = '/admin/dashboard';
              } else {
                window.location.href = '/wallet/dashboard';
              }
            }, 100);
          },
          onError: () => {
            setMode('login');
            setFormData({
              email: registerData.email,
              password: '',
            });
          },
        }
      );
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create account';
      setError(message);
      toast.error(message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1c] flex relative overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Left Panel - Feature Showcase (Desktop only) */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col items-center justify-center p-12 overflow-hidden border-r border-white/5 bg-white/1 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-lg aspect-square"
        >
          {/* Animated decorative circles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-white/10"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[15%] rounded-full border border-white/5"
          />

          {/* Central Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-8 transform rotate-6 hover:rotate-0 transition-all duration-300">
              <Wallet className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              FX Wallet
            </h1>
            <p className="text-lg text-gray-400 max-w-sm leading-relaxed">
              Global transactions, instant transfers, and professional account management in one secure platform.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
              {[
                { icon: Globe, label: 'Global Access' },
                { icon: Shield, label: 'Bank-Grade Security' },
                { icon: TrendingUp, label: 'Real-time Analytics' },
                { icon: CreditCard, label: 'Instant Cards' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <feature.icon className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium text-gray-300">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">FX Wallet</h2>
          </div>

          <motion.div variants={fadeIn} className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-gray-400">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Fill in your details to get started with FX Wallet'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl"
            >
              {/* Account Issues Display */}
              {accountIssue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`mb-6 p-4 rounded-xl border flex gap-3 ${accountIssue.type === 'frozen' ? 'bg-red-500/10 border-red-500/20' :
                      accountIssue.type === 'rejected' ? 'bg-orange-500/10 border-orange-500/20' :
                        'bg-gray-500/10 border-gray-500/20'
                    }`}
                >
                  <AlertCircle className={`h-5 w-5 flex-shrink-0 ${accountIssue.type === 'frozen' ? 'text-red-400' : 'text-orange-400'}`} />
                  <div className="text-sm">
                    <h4 className={`font-semibold ${accountIssue.type === 'frozen' ? 'text-red-400' : 'text-orange-400'}`}>{accountIssue.message}</h4>
                    <p className="text-gray-400 mt-1">{accountIssue.details}</p>
                    <Button variant="link" className="p-0 h-auto mt-2 text-amber-400" onClick={() => window.location.href = '/wallet/support'}>
                      Contact Support <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Error Alert */}
              {error && !accountIssue && (
                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-11 h-12 bg-gray-950/50 border-gray-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-300">Password</Label>
                      <button type="button" className="text-xs text-amber-500 hover:text-amber-400">Forgot password?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-11 h-12 bg-gray-950/50 border-gray-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Full Name</Label>
                    <Input
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      className="h-12 bg-gray-950/50 border-gray-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Email Address</Label>
                    <Input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="h-12 bg-gray-950/50 border-gray-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-300">Password</Label>
                      <Input
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="h-12 bg-gray-950/50 border-gray-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-300">Confirm</Label>
                      <Input
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="h-12 bg-gray-950/50 border-gray-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                    disabled={isRegistering}
                  >
                    {isRegistering ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              )}

              {/* Mode Toggle */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError('');
                      setAccountIssue(null);
                    }}
                    className="font-medium text-amber-500 hover:text-amber-400 hover:underline transition-colors"
                  >
                    {mode === 'login' ? 'Sign up now' : 'Sign in'}
                  </button>
                </p>
              </div>

              {/* Quick Demo Credentials for Dev/Demo */}
              {mode === 'login' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 pt-6 border-t border-white/5"
                >
                  <p className="text-xs text-gray-600 text-center mb-3 uppercased tracking-wider">Demo Access</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setFormData({ email: 'admin@admin.com', password: 'admin123' })}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors border border-white/5"
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => setFormData({ email: 'user@example.com', password: 'password' })}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors border border-white/5"
                    >
                      User
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.p variants={fadeIn} className="text-center text-xs text-gray-600">
            By continuing, you agree to our <a href="#" className="hover:text-gray-400">Terms of Service</a> and <a href="#" className="hover:text-gray-400">Privacy Policy</a>.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
