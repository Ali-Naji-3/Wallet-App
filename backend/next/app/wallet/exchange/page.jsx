'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

export default function ExchangePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [fxRates, setFxRates] = useState({});
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  // Fetch balances and FX rates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const balancesRes = await apiClient.get(ENDPOINTS.WALLETS.BALANCES);
        const balances = balancesRes.data?.balances || [];

        const currencyData = balances.map(b => ({
          code: b.currency,
          name: b.currency === 'USD' ? 'US Dollar' : b.currency === 'EUR' ? 'Euro' : 'Lebanese Lira',
          symbol: b.currency === 'USD' ? '$' : b.currency === 'EUR' ? '€' : 'ل.ل',
          balance: parseFloat(b.balance) || 0,
          icon: b.currency === 'EUR' ? Euro : DollarSign,
        }));

        setCurrencies(currencyData);

        // Try to fetch FX rates, but don't fail if endpoint doesn't exist
        try {
          const ratesRes = await apiClient.get(ENDPOINTS.WALLETS.FX_LATEST);
          const rates = ratesRes.data?.rates || [];
          
          // Store FX rates as a map for easy lookup
          const ratesMap = {};
          rates.forEach(r => {
            const key = `${r.base_currency}_${r.quote_currency}`;
            ratesMap[key] = parseFloat(r.rate);
          });
          setFxRates(ratesMap);
        } catch (ratesErr) {
          console.warn('FX rates endpoint not available, using default rates:', ratesErr.message);
          // Set default rates if API fails
          setFxRates({
            'USD_EUR': 0.92,
            'USD_LBP': 89500,
            'EUR_USD': 1.09,
            'EUR_LBP': 97400,
            'LBP_USD': 0.000011,
            'LBP_EUR': 0.000010,
          });
        }

        setLoadingData(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        toast.error('Failed to load exchange data');
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);
  
  // Get the exchange rate from FX rates
  const exchangeRate = fxRates[`${fromCurrency}_${toCurrency}`] || 1;

  const handleFromAmountChange = (value) => {
    setFromAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      setToAmount((parseFloat(value) * exchangeRate).toFixed(2));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (value) => {
    setToAmount(value);
    if (value && !isNaN(parseFloat(value))) {
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
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (fromCurrency === toCurrency) {
      toast.error('Cannot exchange between the same currency');
      return;
    }

    if (!fromCurrencyData || !toCurrencyData) {
      toast.error('Please wait for currency data to load');
      return;
    }

    if (fromCurrencyData.balance < parseFloat(fromAmount)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    
    try {
      const payload = {
        sourceCurrency: fromCurrency,
        targetCurrency: toCurrency,
        amount: parseFloat(fromAmount),
        note: `Exchange ${fromCurrency} to ${toCurrency}`,
      };

      const response = await apiClient.post(ENDPOINTS.WALLETS.EXCHANGE, payload);

      toast.success('Exchange Successful!', {
        description: `Exchanged ${fromCurrencyData?.symbol}${fromAmount} ${fromCurrency} to ${toCurrencyData?.symbol}${toAmount} ${toCurrency}`,
        duration: 5000,
      });

      // Reset form
      setFromAmount('');
      setToAmount('');

      // Redirect to dashboard with the target currency to show updated balance
      setTimeout(() => {
        router.push(`/wallet/dashboard?currency=${toCurrency}`);
      }, 1500);
    } catch (err) {
      console.error('Exchange failed:', err);
      const errorMessage = err?.response?.data?.message || 'Failed to complete exchange';
      toast.error('Exchange Failed', {
        description: errorMessage,
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      {!loadingData && fromCurrencyData && toCurrencyData && (
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
      )}

      {/* Exchange Form */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-6">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-gray-600 dark:text-slate-400">Loading exchange data...</p>
            </div>
          ) : (
            <form onSubmit={handleExchange} className="space-y-4">
            {/* From Currency */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-slate-300 font-semibold">From</Label>
              <div className="flex gap-3">
                <Select value={fromCurrency} onValueChange={setFromCurrency} disabled={loadingData || currencies.length === 0}>
                  <SelectTrigger className="w-32 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    {currencies.length > 0 ? (
                      currencies.map((c) => (
                        <SelectItem
                          key={c.code}
                          value={c.code}
                          disabled={c.code === toCurrency}
                          className="text-gray-900 dark:text-slate-300"
                        >
                          {c.code}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No currencies available</SelectItem>
                    )}
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
              {loadingData ? (
                <p className="text-xs text-gray-500 dark:text-slate-500">Loading balance...</p>
              ) : fromCurrencyData ? (
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  Balance: {fromCurrencyData.symbol}{fromCurrencyData.balance.toLocaleString()}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-500">Balance: N/A</p>
              )}
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
                    {currencies.length > 0 ? (
                      currencies.map((c) => (
                        <SelectItem
                          key={c.code}
                          value={c.code}
                          disabled={c.code === fromCurrency}
                          className="text-gray-900 dark:text-slate-300"
                        >
                          {c.code}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No currencies available</SelectItem>
                    )}
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
              {loadingData ? (
                <p className="text-xs text-gray-500 dark:text-slate-500">Loading balance...</p>
              ) : toCurrencyData ? (
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  Balance: {toCurrencyData.symbol}{toCurrencyData.balance.toLocaleString()}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-500">Balance: N/A</p>
              )}
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
                    {toCurrencyData?.symbol || ''}{parseFloat(toAmount).toFixed(2)} {toCurrency}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
