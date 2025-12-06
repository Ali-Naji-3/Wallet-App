'use client';

import { useState } from 'react';
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

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', balance: 12450.00, icon: DollarSign, rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', balance: 8320.50, icon: Euro, rate: 0.92 },
  { code: 'LBP', name: 'Lebanese Lira', symbol: 'ل.ل', balance: 450000000, icon: DollarSign, rate: 89500 },
];

export default function ExchangePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);
  
  const exchangeRate = toCurrencyData.rate / fromCurrencyData.rate;

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
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Successfully exchanged ${fromCurrencyData.symbol}${fromAmount} to ${toCurrencyData.symbol}${toAmount}`);
    setIsLoading(false);
    setFromAmount('');
    setToAmount('');
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
                    {currencies.map((c) => (
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
                Balance: {fromCurrencyData.symbol}{fromCurrencyData.balance.toLocaleString()}
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
                    {currencies.map((c) => (
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
                Balance: {toCurrencyData.symbol}{toCurrencyData.balance.toLocaleString()}
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

