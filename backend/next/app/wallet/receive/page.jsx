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
import { Download, Copy, Share2, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'LBP', name: 'Lebanese Lira' },
];

export default function ReceivePage() {
  const [copied, setCopied] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  
  const walletAddress = 'FXW-USR-8FK3-9QWE-7HGT';

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My FXWallet Address',
        text: `Send money to my wallet: ${walletAddress}`,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-500/10 dark:to-green-600/10 mb-4 shadow-lg">
          <Download className="h-8 w-8 text-white dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receive Money</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Share your wallet to receive funds</p>
      </div>

      {/* QR Code Card */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-6 text-center">
          {/* Simulated QR Code */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:bg-white p-4 rounded-xl inline-block mb-4 shadow-inner">
            <div className="h-48 w-48 bg-gray-900 dark:bg-slate-900 rounded-lg flex items-center justify-center">
              <QrCode className="h-32 w-32 text-gray-600 dark:text-slate-600" />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 font-medium">Scan to pay</p>
          
          {/* Wallet Address */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-900 dark:to-slate-900 rounded-lg p-3 flex items-center justify-between gap-2 border border-gray-200 dark:border-slate-700">
            <code className="text-sm text-amber-600 dark:text-emerald-400 font-mono font-semibold">{walletAddress}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Specific Amount */}
      <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Request specific amount</h3>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Amount (optional)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-emerald-500"
              />
            </div>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-24 bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white">
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

          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 text-white font-semibold shadow-lg"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

