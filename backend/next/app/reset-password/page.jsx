'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ✅ Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token');
        setIsValidating(false);
        return;
      }

      try {
        const response = await apiClient.get(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );

        if (response.data.valid) {
          setIsValidToken(true);
        } else {
          setError(response.data.message || 'Invalid or expired token');
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to validate token');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // ✅ Password strength meter
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    setPasswordStrength(Math.min(strength, 4));
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      return;
    }

    try {
      setIsLoading(true);

      await apiClient.post('/api/auth/reset-password', {
        token,
        password,
      });

      setSuccess(true);
      toast.success('Password reset successful!');

      setTimeout(() => {
        router.push('/auth/login'); // adjust to your actual login route
      }, 3000);
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Failed to reset password';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-600';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  // ───────────────── LOADING STATE ─────────────────
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-gray-950 to-purple-500/5" />
        <Card className="w-full max-w-md bg-gray-900 border-gray-800 relative z-10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
              <p className="text-gray-400">Validating reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────────────── INVALID TOKEN ─────────────────
  if (!isValidToken && !isValidating) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-gray-950 to-purple-500/5" />
        <Card className="w-full max-w-md bg-gray-900 border-gray-800 relative z-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Invalid Token
            </CardTitle>
            <CardDescription className="text-gray-400">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────────────── SUCCESS ─────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-gray-950 to-purple-500/5" />
        <Card className="w-full max-w-md bg-gray-900 border-gray-800 relative z-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Password Reset!
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your password has been successfully reset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center mb-4">
              Redirecting to login page...
            </p>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────────────── MAIN FORM ─────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-gray-950 to-purple-500/5" />

      <Card className="w-full max-w-md bg-gray-900 border-gray-800 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
              <Wallet className="h-8 w-8 text-gray-900" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Create New Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Strength bar */}
              {passwordStrength > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Password strength</span>
                    <span>{getPasswordStrengthText()}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full ${getPasswordStrengthColor()} transition-all`}
                      style={{
                        width: `${(passwordStrength / 4) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="w-full text-sm text-gray-400 hover:text-gray-300 py-2"
            >
              Back to Login
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
