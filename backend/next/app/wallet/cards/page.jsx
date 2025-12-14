'use client';

import { useState, useEffect } from 'react';
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
  SelectValue 
} from '@/components/ui/select';
import { CreditCard, Plus, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

export default function CardsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [formData, setFormData] = useState({
    currency: 'USD',
    cardType: 'VIRTUAL',
    cardName: '',
  });

  // Fetch available currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.WALLETS.BALANCES);
        const balances = response.data?.balances || [];
        setCurrencies(balances.map(b => b.currency));
        setLoadingCurrencies(false);
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
        toast.error('Failed to load currencies');
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cardName.trim()) {
      toast.error('Please enter a card name');
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll just simulate card creation since there's no backend endpoint
      // In a real app, you would call: await apiClient.post('/api/wallet/cards', formData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Card Request Submitted!', {
        description: `Your ${formData.currency} ${formData.cardType.toLowerCase()} card request has been submitted. You'll be notified once it's ready.`,
        duration: 5000,
      });

      // Reset form
      setFormData({
        currency: 'USD',
        cardType: 'VIRTUAL',
        cardName: '',
      });
      setShowAddForm(false);

      // Redirect back to dashboard
      setTimeout(() => {
        router.push('/wallet/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Failed to create card:', err);
      toast.error('Failed to submit card request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/wallet/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-amber-500/10 dark:to-yellow-600/10 shadow-lg">
              <CreditCard className="h-6 w-6 text-white dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Cards</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your virtual and physical cards</p>
            </div>
          </div>
        </div>
        
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 dark:from-amber-500 dark:to-yellow-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request New Card
          </Button>
        )}
      </div>

      {/* Add Card Form */}
      {showAddForm && (
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Request New Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Card Type */}
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-slate-300 font-medium">Card Type</Label>
                <Select
                  value={formData.cardType}
                  onValueChange={(val) => setFormData({ ...formData, cardType: val })}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <SelectItem value="VIRTUAL" className="text-gray-900 dark:text-slate-300">
                      Virtual Card (Instant)
                    </SelectItem>
                    <SelectItem value="PHYSICAL" className="text-gray-900 dark:text-slate-300">
                      Physical Card (7-10 days)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  Virtual cards are available instantly. Physical cards will be mailed to your registered address.
                </p>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-slate-300 font-medium">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                  disabled={loadingCurrencies}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    {currencies.map(curr => (
                      <SelectItem key={curr} value={curr} className="text-gray-900 dark:text-slate-300">
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Card Name */}
              <div className="space-y-2">
                <Label htmlFor="cardName" className="text-gray-900 dark:text-slate-300 font-medium">
                  Card Name / Nickname
                </Label>
                <Input
                  id="cardName"
                  placeholder="e.g., Shopping Card, Business Expenses"
                  value={formData.cardName}
                  onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                  className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  Give your card a memorable name to identify it easily
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> This is a demo feature. Card requests are simulated and no actual card will be issued.
                  In production, this would integrate with a card issuing service.
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={isLoading}
                  className="flex-1 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 dark:from-amber-500 dark:to-yellow-600 text-white shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Cards (Placeholder) */}
      {!showAddForm && (
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Cards Yet
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              You haven't requested any cards yet. Click "Request New Card" to get started.
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="border-gray-300 dark:border-slate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Your First Card
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
