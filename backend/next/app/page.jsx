'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, Shield, Globe, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      {/* Simple Nav */}
      <nav className="border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Wallet className="h-6 w-6 text-amber-500" />
            FX Wallet
          </div>
          <div className="flex gap-4">
            <Button onClick={() => router.push('/login')} variant="ghost">Sign In</Button>
            <Button onClick={() => router.push('/login')} className="bg-amber-500 text-black">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Manage Wealth <span className="text-amber-500">Without Limits</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Global transfers, real-time analytics, and bank-grade security.
        </p>

        <div className="flex justify-center gap-4">
          <Button onClick={() => router.push('/login')} className="h-12 px-8 bg-amber-500 text-black text-lg">
            Start Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <Globe className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Global Access</h3>
            <p className="text-gray-400">Send money anywhere instantly.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <Shield className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Secure</h3>
            <p className="text-gray-400">Bank-grade encryption.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <TrendingUp className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p className="text-gray-400">Track your wealth.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
