'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, DollarSign, User, ArrowRight, Loader2, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';

// Currency symbols mapping
const currencySymbols = {
  USD: '$',
  EUR: '€',
  LBP: 'ل.ل',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: '$',
  AUD: '$',
};

export default function SendMoneyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    currency: '',
    note: '',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // Fetch user's wallets on mount
  useEffect(() => {
    fetchWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const response = await apiClient.get('/api/wallets/my');
      const walletsData = response.data || [];
      
      // Only show USD, EUR, and LBP currencies
      const allowedCurrencies = ['USD', 'EUR', 'LBP'];
      
      // Transform wallet data and filter for allowed currencies
      const transformedWallets = walletsData
        .filter(wallet => 
          wallet.status === 'active' && 
          allowedCurrencies.includes(wallet.currency_code)
        )
        .map(wallet => ({
          code: wallet.currency_code,
          name: wallet.currency_code,
          symbol: currencySymbols[wallet.currency_code] || wallet.currency_code,
          balance: parseFloat(wallet.balance) || 0,
        }));
      
      setWallets(transformedWallets);
      
      // Set default currency to first wallet if available
      if (transformedWallets.length > 0 && !formData.currency) {
        setFormData(prev => ({ ...prev, currency: transformedWallets[0].code }));
      }
    } catch (error) {
      console.error('Failed to fetch wallets from API:', error);
      console.error('API Error details:', error.response?.data || error.message);
      toast.error('Failed to load wallets. Please check your connection and refresh.');
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const selectedCurrency = wallets.find(c => c.code === formData.currency);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation with specific error messages
    if (!formData.recipient) {
      toast.error('Please enter recipient email');
      return;
    }

    if (!formData.amount) {
      toast.error('Please enter amount');
      return;
    }

    if (!formData.currency) {
      toast.error('Please select a currency');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const numericAmount = parseFloat(formData.amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (selectedCurrency && numericAmount > selectedCurrency.balance) {
      toast.error(`Insufficient funds. Available: ${selectedCurrency.symbol}${selectedCurrency.balance.toLocaleString()}`);
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare request payload
      const payload = {
        recipient: formData.recipient.trim(),
        amount: numericAmount,
        currency: formData.currency,
        note: formData.note ? formData.note.trim() : null,
      };

      // Log request for debugging
      console.log('[Send Money] Submitting transfer:', {
        recipient: payload.recipient,
        amount: payload.amount,
        currency: payload.currency,
        hasNote: !!payload.note,
      });

      // Call real transfer API
      const response = await apiClient.post('/api/transactions/transfer', payload);

      console.log('[Send Money] Transfer successful:', response.data);
      
      // Store transaction details for success modal
      setTransactionDetails({
        recipient: payload.recipient,
        amount: numericAmount,
        currency: payload.currency,
        symbol: selectedCurrency.symbol,
        transactionId: response.data.transactionId,
        note: payload.note,
        timestamp: new Date().toISOString(),
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        currency: wallets.length > 0 ? wallets[0].code : '',
        note: '',
      });
      
      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/wallet/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('[Send Money] Transfer failed:', error);
      console.error('[Send Money] Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
      
      const errorMessage = error.response?.data?.message || 'Transfer failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching wallets
  if (isLoadingWallets) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-blue-500/10 dark:to-blue-600/10 mb-4 shadow-lg">
            <Send className="h-8 w-8 text-white dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Transfer funds to anyone, anywhere</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading your wallets...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no wallets available
  if (wallets.length === 0 && !isLoadingWallets) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-blue-500/10 dark:to-blue-600/10 mb-4 shadow-lg">
            <Send className="h-8 w-8 text-white dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Transfer funds to anyone, anywhere</p>
        </div>
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              No active wallets found for USD, EUR, or LBP.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              You need an active wallet in one of these currencies to send money.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Please contact support to activate your wallets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-blue-500/10 dark:to-blue-600/10 mb-4 shadow-lg">
          <Send className="h-8 w-8 text-white dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Transfer funds to anyone, anywhere</p>
      </div>

      {/* Form Card */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-900 dark:text-slate-300 font-medium">Recipient</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <Input
                  id="recipient"
                  name="transfer-recipient"
                  type="text"
                  placeholder="Email or phone number"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-blue-500"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            {/* Amount & Currency */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-slate-300 font-medium">Amount</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <Input
                    type="number"
                    name="transfer-amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-lg focus:border-amber-500 dark:focus:border-blue-500"
                    step="0.01"
                    min="0"
                    autoComplete="off"
                    required
                  />
                </div>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                >
                  <SelectTrigger className="w-28 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    {wallets.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-gray-900 dark:text-slate-300">
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Available: {selectedCurrency?.symbol}{selectedCurrency?.balance.toLocaleString()}
              </p>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note" className="text-gray-900 dark:text-slate-300 font-medium">Note (optional)</Label>
              <Input
                id="note"
                name="transfer-note"
                type="text"
                placeholder="What's this for?"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-blue-500"
                autoComplete="off"
              />
            </div>

            {/* Summary */}
            {formData.amount && formData.recipient && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-slate-900 dark:to-slate-900 rounded-lg p-4 space-y-2 border border-amber-200 dark:border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Amount</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedCurrency?.symbol}{parseFloat(formData.amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Fee</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free</span>
                </div>
                <div className="border-t border-amber-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="text-gray-900 dark:text-slate-300 font-semibold">Total</span>
                  <span className="text-gray-900 dark:text-white font-bold text-lg">
                    {selectedCurrency?.symbol}{parseFloat(formData.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !formData.currency || wallets.length === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white h-12 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : wallets.length === 0 ? (
                <>No wallets available</>
              ) : !formData.currency ? (
                <>Select currency to continue</>
              ) : (
                <>
                  Send Money
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Confirmation Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800">
          <DialogHeader>
            <div className="mx-auto mb-4">
              {/* Animated Success Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 rounded-full p-6 animate-bounce">
                  <CheckCircle2 className="h-16 w-16 text-white" strokeWidth={3} />
                </div>
                {/* Sparkle effects */}
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-emerald-400 animate-pulse delay-150" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              Transfer Successful! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 dark:text-slate-400">
              Your money has been sent successfully
            </DialogDescription>
          </DialogHeader>
          
          {transactionDetails && (
            <div className="space-y-4 py-4">
              {/* Transaction Details Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="space-y-3">
                  {/* Amount */}
                  <div className="text-center pb-3 border-b border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount Sent</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {transactionDetails.symbol}{transactionDetails.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{transactionDetails.currency}</p>
                  </div>
                  
                  {/* Recipient */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Recipient</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{transactionDetails.recipient}</span>
                  </div>
                  
                  {/* Transaction ID */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Transaction ID</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">#{transactionDetails.transactionId}</span>
                  </div>
                  
                  {/* Note (if provided) */}
                  {transactionDetails.note && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Note</span>
                      <span className="text-sm text-gray-900 dark:text-white text-right max-w-[200px]">{transactionDetails.note}</span>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="flex justify-between items-center pt-3 border-t border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs text-slate-500 dark:text-slate-500">Completed</span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(transactionDetails.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Auto-redirect message */}
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to dashboard in a moment...
                </p>
              </div>
              
              {/* Manual navigation button */}
              <Button
                onClick={() => router.push('/wallet/dashboard')}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
              >
                Go to Dashboard Now
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

