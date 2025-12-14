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
import { Send, DollarSign, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

export default function SendMoneyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    currency: 'USD',
    note: '',
  });

  // Fetch real balances on mount
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.WALLETS.BALANCES);
        const balances = response.data?.balances || [];
        
        const currencyData = balances.map(b => ({
          code: b.currency,
          name: b.currency === 'USD' ? 'US Dollar' : b.currency === 'EUR' ? 'Euro' : 'Lebanese Lira',
          symbol: b.currency === 'USD' ? '$' : b.currency === 'EUR' ? '€' : 'ل.ل',
          balance: parseFloat(b.balance) || 0,
        }));
        
        setCurrencies(currencyData);
        setLoadingBalances(false);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
        toast.error('Failed to load wallet balances');
        setLoadingBalances(false);
      }
    };
    
    fetchBalances();
  }, []);

  const selectedCurrency = currencies.find(c => c.code === formData.currency);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        recipientEmail: formData.recipient.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        note: formData.note.trim() || undefined,
      };

      const response = await apiClient.post(ENDPOINTS.WALLETS.TRANSFER, payload);

      toast.success('Money sent successfully!', {
        description: `Sent ${payload.amount} ${payload.currency} to ${payload.recipientEmail}`,
        duration: 5000,
      });

      // Reset form
      setFormData({ recipient: '', amount: '', currency: 'USD', note: '' });
      
      // Redirect to dashboard to see updated balance
      setTimeout(() => {
        router.push(`/wallet/dashboard?currency=${formData.currency}`);
      }, 1500);
    } catch (err) {
      console.error('Send failed:', err);
      const errorMessage = err?.response?.data?.message || 'Failed to send money';
      toast.error('Transfer Failed', {
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
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-blue-500/10 dark:to-blue-600/10 mb-4 shadow-lg">
          <Send className="h-8 w-8 text-white dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Transfer funds to anyone, anywhere</p>
      </div>

      {/* Form Card */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-900 dark:text-slate-300 font-medium">Recipient</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <Input
                  id="recipient"
                  placeholder="Email or phone number"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-blue-500"
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
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-lg focus:border-amber-500 dark:focus:border-blue-500"
                    step="0.01"
                    min="0"
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
                    {currencies.map((c) => (
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
                placeholder="What's this for?"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-blue-500"
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
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white h-12 font-semibold shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
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
    </div>
  );
}

