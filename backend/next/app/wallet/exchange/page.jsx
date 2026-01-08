'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { RefreshCw, ArrowDown, Loader2, TrendingUp, DollarSign, Euro } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';

// Currency display configuration (UI properties only)
const currencyConfig = {
  USD: { name: 'US Dollar', symbol: '$', icon: DollarSign },
  EUR: { name: 'Euro', symbol: '€', icon: Euro },
  LBP: { name: 'Lebanese Lira', symbol: 'ل.ل', icon: DollarSign },
};

export default function ExchangePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [wallets, setWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [exchangeRates, setExchangeRates] = useState({});

  // Helper function to format balance (removes duplicate code)
  const formatBalance = (balance, currencyCode) => {
    const numericBalance = parseFloat(balance) || 0;
    if (currencyCode === 'LBP') {
      return numericBalance.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return numericBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Fetch real wallet balances from backend
  const fetchWallets = async () => {
    try {
      setLoadingWallets(true);
      const response = await apiClient.get('/api/wallets/my');
      const walletsData = response.data || [];
      
      // Only show USD, EUR, LBP
      const filtered = walletsData.filter(w => 
        ['USD', 'EUR', 'LBP'].includes(w.currency_code)
      );
      
      setWallets(filtered);
      console.log('✅ Wallets refreshed:', filtered); // Debug log
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      toast.error('Failed to load wallet balances');
    } finally {
      setLoadingWallets(false);
    }
  };

  // Fetch exchange rates from backend
  const fetchExchangeRates = async () => {
    try {
      const response = await apiClient.get('/api/wallets/fx/latest?base=USD');
      if (response.data?.rates && Array.isArray(response.data.rates)) {
        // Transform array [{quote_currency: "EUR", rate: 0.85}] 
        // into object {EUR: 0.85, USD: 1, LBP: 89500}
        const ratesObject = response.data.rates.reduce((acc, r) => {
          acc[r.quote_currency] = r.rate;
          return acc;
        }, {});
        setExchangeRates(ratesObject);
        console.log('✅ Exchange rates loaded:', ratesObject);
      }
    } catch (error) {
      console.error('Failed to fetch FX rates:', error);
      // Use fallback rates if API fails (USD base)
      setExchangeRates({
        USD: 1,
        EUR: 0.92,
        LBP: 89500,
      });
    }
  };

  useEffect(() => {
    fetchWallets();
    fetchExchangeRates();
  }, []);

  // Log balance updates for debugging
  useEffect(() => {
    if (wallets.length > 0) {
      const usd = wallets.find(w => w.currency_code === 'USD');
      const eur = wallets.find(w => w.currency_code === 'EUR');
      const lbp = wallets.find(w => w.currency_code === 'LBP');
      console.log('💰 Balances updated:', {
        USD: usd?.balance,
        EUR: eur?.balance,
        LBP: lbp?.balance
      });
    }
  }, [wallets]);

  // Log exchange rate changes (only when they actually change)
  useEffect(() => {
    if (fromCurrency && toCurrency && exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const fromRate = exchangeRates[fromCurrency];
      const toRate = exchangeRates[toCurrency];
      const rate = toRate / fromRate;
      console.log(`📊 Exchange rate: ${fromCurrency}(${fromRate}) → ${toCurrency}(${toRate}) = ${rate.toFixed(4)}`);
    }
  }, [fromCurrency, toCurrency, exchangeRates]);

  // Recalculate TO amount when currencies or exchange rates change
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      const rate = toRate / fromRate;
      const newToAmount = (parseFloat(fromAmount) * rate).toFixed(2);
      setToAmount(newToAmount);
    }
  }, [fromCurrency, toCurrency, exchangeRates]);

  // Get current wallet data
  const fromWallet = wallets.find(w => w.currency_code === fromCurrency);
  const toWallet = wallets.find(w => w.currency_code === toCurrency);
  
  const fromCurrencyData = {
    code: fromCurrency,
    balance: fromWallet ? parseFloat(fromWallet.balance) : 0,
    ...currencyConfig[fromCurrency],
  };
  
  const toCurrencyData = {
    code: toCurrency,
    balance: toWallet ? parseFloat(toWallet.balance) : 0,
    ...currencyConfig[toCurrency],
  };
  
  // Calculate exchange rate
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  const exchangeRate = toRate / fromRate;

  // Build currency list for selects
  const availableCurrencies = ['USD', 'EUR', 'LBP'].map(code => ({
    code,
    ...currencyConfig[code],
  }));

  const handleFromAmountChange = (value) => {
    setFromAmount(value);
    if (value) {
      setToAmount((parseFloat(value) * exchangeRate).toFixed(2));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (value) => {
    setToAmount(value);
    if (value) {
      setFromAmount((parseFloat(value) / exchangeRate).toFixed(2));
    } else {
      setFromAmount('');
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleExchange = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const numericAmount = parseFloat(fromAmount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (numericAmount > fromCurrencyData.balance) {
      toast.error(`Insufficient ${fromCurrency} balance. Available: ${fromCurrencyData.symbol}${fromCurrencyData.balance.toFixed(2)}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call real backend API
      const response = await apiClient.post('/api/wallet/exchange', {
        sourceCurrency: fromCurrency,
        targetCurrency: toCurrency,
        amount: numericAmount,
        note: `Exchange ${fromCurrency} → ${toCurrency}`,
      });
      
      // Success
      toast.success(
        response.data.message || 
        `Successfully exchanged ${fromCurrencyData.symbol}${numericAmount.toFixed(2)} to ${toCurrencyData.symbol}${response.data.transaction.targetAmount.toFixed(2)}`
      );
      
      // Refresh wallet balances
      await fetchWallets();
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      
    } catch (error) {
      console.error('Exchange failed:', error);
      const errorMessage = error.response?.data?.message || 'Exchange failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching wallets
  if (loadingWallets) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">Loading wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-500/10 dark:to-indigo-600/10 mb-4 shadow-lg">
          <RefreshCw className="h-8 w-8 text-white dark:text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Currency Exchange</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Convert between currencies instantly</p>
      </div>

      {/* Exchange Rate Info */}
      <Card className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-purple-500/10 dark:to-blue-500/10 border-amber-300 dark:border-purple-500/20 shadow-lg">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-purple-400" />
            <span className="text-gray-700 dark:text-slate-300 text-sm font-medium">Current Rate:</span>
          </div>
          <span className="text-gray-900 dark:text-white font-bold">
            1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </span>
        </CardContent>
      </Card>

      {/* Exchange Form */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleExchange} className="space-y-4">
            {/* From Currency */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-slate-300 font-semibold">From</Label>
              <div className="flex gap-3">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-32 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    {availableCurrencies.map((c) => (
                      <SelectItem
                        key={c.code}
                        value={c.code}
                        disabled={c.code === toCurrency}
                        className="text-gray-900 dark:text-slate-300"
                      >
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-lg focus:border-amber-500 dark:focus:border-purple-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Balance: {fromCurrencyData.symbol}{formatBalance(fromCurrencyData.balance, fromCurrency)}
              </p>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={swapCurrencies}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-slate-700 dark:to-slate-600 hover:from-amber-200 hover:to-yellow-200 dark:hover:bg-slate-600 text-amber-700 dark:text-slate-300 border border-amber-300 dark:border-transparent shadow-md"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-slate-300 font-semibold">To</Label>
              <div className="flex gap-3">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-32 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    {availableCurrencies.map((c) => (
                      <SelectItem
                        key={c.code}
                        value={c.code}
                        disabled={c.code === fromCurrency}
                        className="text-gray-900 dark:text-slate-300"
                      >
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-lg focus:border-amber-500 dark:focus:border-purple-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Balance: {toCurrencyData.symbol}{formatBalance(toCurrencyData.balance, toCurrency)}
              </p>
            </div>

            {/* Summary */}
            {fromAmount && toAmount && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-slate-900 dark:to-slate-900 rounded-lg p-4 space-y-2 border border-amber-200 dark:border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Exchange Rate</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Fee</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free</span>
                </div>
                <div className="border-t border-amber-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="text-gray-900 dark:text-slate-300 font-semibold">You'll receive</span>
                  <span className="text-gray-900 dark:text-white font-bold text-lg">
                    {toCurrencyData.symbol}{parseFloat(toAmount).toFixed(2)} {toCurrency}
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !fromAmount || !toAmount}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white h-12 font-semibold shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Exchange Now
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

