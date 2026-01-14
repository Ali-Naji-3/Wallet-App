import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
    Copy,
    ExternalLink,
    FileJson,
    FileText,
    ArrowRightLeft,
    Calendar,
    CreditCard,
    User,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminTransactionDetailsModal({ transaction, open, onOpenChange }) {
    if (!transaction) return null;

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#0a0f1c] border-white/10 text-white">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Transaction Details
                                <Badge variant="outline" className={`${getStatusColor(transaction.status)} uppercase text-xs`}>
                                    {transaction.status || 'Completed'}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 mt-1">
                                Internal Ref: <span className="font-mono text-xs">{transaction.id}</span>
                            </DialogDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold tracking-tight text-white">
                                {Number(transaction.source_amount).toFixed(2)} {transaction.source_currency}
                            </div>
                            {transaction.type === 'exchange' && (
                                <div className="text-sm text-emerald-500 font-medium">
                                    → {Number(transaction.target_amount).toFixed(2)} {transaction.target_currency}
                                </div>
                            )}
                            <div className="text-sm text-gray-500 capitalize">{transaction.type}</div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="bg-white/5 border border-white/10 w-full justify-start">
                        <TabsTrigger value="details" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                            <FileText className="w-4 h-4 mr-2" />
                            General Info
                        </TabsTrigger>
                        <TabsTrigger value="raw" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                            <FileJson className="w-4 h-4 mr-2" />
                            Raw Data
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                        {/* Involved Parties */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <User className="w-4 h-4" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Initiator (User)</span>
                                </div>
                                <div className="font-medium text-white truncate" title={transaction.user_email}>
                                    {transaction.user_email || 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                    ID: {transaction.user_id}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    <span className="text-xs uppercase font-bold tracking-wider">Recipient / Target</span>
                                </div>
                                <div className="font-medium text-white truncate">
                                    {transaction.recipient_email || transaction.recipient_name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                    ID: {transaction.recipient_id || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Timestamps & Meta */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center py-1 border-b border-white/5 pb-2">
                                <span className="text-sm text-gray-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date Created
                                </span>
                                <span className="text-sm font-mono">{formatDate(transaction.created_at)}</span>
                            </div>

                            <div className="flex justify-between items-center py-1 border-b border-white/5 pb-2">
                                <span className="text-sm text-gray-400 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Payment Method
                                </span>
                                <span className="text-sm capitalize">{transaction.payment_method || 'System'}</span>
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-400 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Reference
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono text-amber-500">{transaction.reference_id || 'N/A'}</span>
                                    {transaction.reference_id && (
                                        <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400 hover:text-white" onClick={() => copyToClipboard(transaction.reference_id, 'Reference ID')}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {transaction.description && (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <h4 className="text-sm font-medium text-amber-500 mb-1">Description / Memo</h4>
                                <p className="text-sm text-gray-300">{transaction.description}</p>
                            </div>
                        )}

                        {/* Metadata / Error message */}
                        {transaction.metadata && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Meta Information</h4>
                                <pre className="text-xs bg-black/50 p-2 rounded text-gray-300 overflow-x-auto">
                                    {typeof transaction.metadata === 'string'
                                        ? transaction.metadata
                                        : JSON.stringify(transaction.metadata, null, 2)}
                                </pre>
                            </div>
                        )}

                    </TabsContent>

                    <TabsContent value="raw" className="mt-4">
                        <div className="h-[300px] w-full rounded-md border border-white/10 bg-black/50 p-4 overflow-auto">
                            <pre className="text-xs font-mono text-green-400">
                                {JSON.stringify(transaction, null, 2)}
                            </pre>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                    {(transaction.status === 'pending') && (
                        <Button variant="destructive" className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Flag Transaction
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
}
