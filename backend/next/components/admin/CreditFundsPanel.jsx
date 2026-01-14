'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Search, X, Loader2, AlertCircle, CheckCircle2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import { clearAuthData } from '@/lib/auth/storage';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
];

export default function CreditFundsPanel({
  onSuccess,
  redirectToCustomerOnSuccess = false,
  redirectDelayMs = 0,
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Helper: Force logout and redirect to login (removes duplicate code)
  const forceLogout = (message = 'Session expired. Please login again.') => {
    console.error('[CreditFunds] forceLogout called:', message);
    console.trace('[CreditFunds] forceLogout stack trace');
    toast.error(message, { duration: 6000 });

    // Fail-closed: clear all auth data (session + legacy localStorage) before redirect.
    clearAuthData();
    
    setTimeout(() => {
      console.log('[CreditFunds] Redirecting to /login...');
      window.location.href = '/login';
    }, 2000);
  };

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await apiClient.get(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data.users || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        const status = error.response?.status;
        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to search users';

        // If unauthorized/forbidden, force re-login (most common cause: stale token or non-admin session)
        if (status === 401 || status === 403) {
          forceLogout(message);
          return;
        }

        toast.error(message);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.email);
    setShowResults(false);
    // Auto-set currency to user's base currency if available
    if (user.base_currency) {
      setCurrency(user.base_currency);
    }
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleCreditFunds = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!currency) {
      toast.error('Please select a currency');
      return;
    }

    setIsSubmitting(true);

    try {
      // Proceed with credit operation (server will verify admin role)
      console.log('[CreditFunds] Starting credit operation:', {
        targetUser: selectedUser.email,
        amount: numericAmount,
        currency,
      });

      const creditedUserId = selectedUser?.id;
      const response = await apiClient.post('/api/admin/wallets/credit', {
        userId: selectedUser.id,
        currency,
        amount: numericAmount,
        note: note || `Admin test funds credit: ${numericAmount} ${currency}`,
      });

      console.log('[CreditFunds] Credit successful');

      toast.success(
        `Successfully credited ${numericAmount} ${currency} to ${selectedUser.email}`,
        { duration: 5000 }
      );

      // Reset form completely
      setSelectedUser(null);
      setSearchQuery('');
      setAmount('');
      setNote('');
      setCurrency('USD');
      setSearchResults([]);
      setShowResults(false);

      // Callback for parent component to refresh data
      if (onSuccess) {
        onSuccess(response.data);
      }

      // OPTIONAL UX: take admin directly to the credited customer's page
      // (keeps flow fast: credit → review customer)
      if (redirectToCustomerOnSuccess && creditedUserId) {
        console.log('[CreditFunds] Redirecting to customer page:', `/admin/users/${creditedUserId}`);
        if (redirectDelayMs > 0) {
          setTimeout(() => {
            console.log('[CreditFunds] Executing delayed redirect...');
            router.push(`/admin/users/${creditedUserId}`);
          }, redirectDelayMs);
        } else {
          router.push(`/admin/users/${creditedUserId}`);
        }
      } else {
        console.log('[CreditFunds] Redirect skipped:', { redirectToCustomerOnSuccess, creditedUserId });
      }
    } catch (error) {
      console.error('[CreditFunds] Error:', error);
      
      // SECURITY: If 401/403, force logout (user switched or session expired)
      if (error.response?.status === 401 || error.response?.status === 403) {
        forceLogout('Session expired or unauthorized. Please login again.');
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to credit funds';
      toast.error(errorMessage);
    } finally {
      // ALWAYS reset submitting state so button works again
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    // CRITICAL: Ensure everything is reset for next credit
    setSelectedUser(null);
    setSearchQuery('');
    setAmount('');
    setNote('');
    setCurrency('USD');
    setSearchResults([]);
    setShowResults(false);
    setIsSubmitting(false); // Ensure button is enabled
  };

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-gray-900 dark:text-white">Credit Test Funds</span>
          <span className="ml-2 px-2 py-1 text-xs font-semibold bg-amber-500 text-gray-900 rounded-full">
            SANDBOX ONLY
          </span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Add fake money to user wallets for development and testing purposes
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreditFunds} className="space-y-4">
          {/* User Search */}
          <div className="space-y-2" ref={dropdownRef}>
            <Label htmlFor="user-search" className="text-gray-900 dark:text-white">
              Search User
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="user-search"
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                disabled={isSubmitting}
                className="pl-10 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
              {selectedUser && !searchLoading && (
                <button
                  type="button"
                  onClick={handleClearUser}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start justify-between border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </p>
                        {user.full_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.full_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {user.base_currency || 'USD'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              )}
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedUser.email}
                  </p>
                  {selectedUser.full_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedUser.full_name}
                    </p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  ID: {selectedUser.id}
                </span>
              </div>
            )}
          </div>

          {/* Currency and Amount Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Currency Select */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-gray-900 dark:text-white">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isSubmitting}>
                <SelectTrigger id="currency" className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      {curr.symbol} {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-900 dark:text-white">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Note (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-gray-900 dark:text-white">
              Note (Optional)
            </Label>
            <Input
              id="note"
              type="text"
              placeholder="e.g., Test funds for feature X"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUser || !amount}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Credit Funds
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isSubmitting}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

