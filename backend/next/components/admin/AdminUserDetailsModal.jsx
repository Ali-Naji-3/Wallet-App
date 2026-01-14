
'use client';

import { useState } from 'react';
import { useOne } from '@refinedev/core';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, MapPin, Calendar, Wallet, CreditCard, Shield } from 'lucide-react';

export function AdminUserDetailsModal({ userId, open, onOpenChange }) {
    const { data: queryResult, isLoading, isError } = useOne({
        resource: 'users',
        id: userId,
        queryOptions: {
            enabled: !!userId && open,
        }
    });

    const user = queryResult?.data?.user;
    const wallets = queryResult?.data?.wallets || [];
    const stats = queryResult?.data?.stats || {};

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-[#0a0f1c] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        User Profile
                        {isLoading && <Loader2 className="animate-spin h-4 w-4 text-amber-500" />}
                        {!isLoading && user && (
                            <Badge variant="outline" className={`${user.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} border border-emerald-500/20 uppercase text-xs`}>
                                {user.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                        )}
                        {!isLoading && user?.role === 'admin' && (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 uppercase text-xs">
                                Admin
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Detailed information about the client.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                ) : isError || !user ? (
                    <div className="py-8 text-center text-red-500">
                        Failed to load user details.
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="bg-white/5 border border-white/10 w-full justify-start">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                                <Shield className="w-4 h-4 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="wallets" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                                <Wallet className="w-4 h-4 mr-2" />
                                Wallets ({wallets.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Identity Card */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Identity</h3>

                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                                            {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{user.fullName || 'No Name Set'}</div>
                                            <div className="text-xs text-gray-500 font-mono">ID: {user.id}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            {user.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            Region: {user.timezone || 'UTC'}
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Stats */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Activity Stats</h3>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-black/30 p-2 rounded border border-white/5">
                                            <div className="text-xs text-gray-500">Total Tx</div>
                                            <div className="text-xl font-mono">{stats.totalTransactions}</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded border border-white/5">
                                            <div className="text-xs text-gray-500">Exchanges</div>
                                            <div className="text-xl font-mono">{stats.exchanges}</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded border border-white/5">
                                            <div className="text-xs text-gray-500">Transfers</div>
                                            <div className="text-xl font-mono">{stats.transfers}</div>
                                        </div>
                                        <div className="bg-black/30 p-2 rounded border border-white/5">
                                            <div className="text-xs text-gray-500">Default Currency</div>
                                            <div className="text-xl font-mono text-amber-500">{user.baseCurrency}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="wallets" className="mt-4">
                            <div className="space-y-2">
                                {wallets.map((wallet) => (
                                    <div key={wallet.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5 hover:border-amber-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-white/5">
                                                <CreditCard className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{wallet.currency_code} Wallet</div>
                                                <div className="text-xs text-gray-500 font-mono truncate w-32 md:w-auto">{wallet.address || 'Internal'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-mono font-bold text-emerald-400">
                                                {Number(wallet.balance).toFixed(2)}
                                            </div>
                                            <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-gray-500">
                                                {wallet.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}

                                {wallets.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No wallets found for this user.
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
