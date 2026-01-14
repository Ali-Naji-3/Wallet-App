'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Copy,
    Download,
    Share2,
    Check,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Calendar,
    DollarSign,
    User,
    FileText,
    Clock,
    Hash,
    Tag,
    Building,
    CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionDetailsModal({ transaction, open, onOpenChange }) {
    const [copied, setCopied] = useState(false);

    if (!transaction) return null;

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadReceipt = () => {
        toast.info('Receipt download coming soon!');
    };

    const shareTransaction = () => {
        if (navigator.share) {
            navigator.share({
                title: `Transaction: ${transaction.description}`,
                text: `${transaction.transaction_type} - ${formatAmount(transaction.amount, transaction.currency)}`,
            });
        } else {
            copyToClipboard(
                `Transaction ID: ${transaction.id}\nType: ${transaction.transaction_type}\nAmount: ${formatAmount(transaction.amount, transaction.currency)}\nDate: ${formatFullDate(transaction.created_at)}`,
                'Transaction details'
            );
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'receive':
                return <ArrowDownLeft className="h-6 w-6" />;
            case 'send':
                return <ArrowUpRight className="h-6 w-6" />;
            case 'exchange':
                return <RefreshCw className="h-6 w-6" />;
            default:
                return null;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'receive':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'send':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            case 'exchange':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default:
                return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
        }
    };

    const formatAmount = (amount, currency) => {
        const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'LBP' ? 'ل.ل' : currency;
        return `${currencySymbol} ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    };

    const InfoRow = ({ icon: Icon, label, value, copyable = false }) => (
        <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value || 'N/A'}</p>
                </div>
            </div>
            {copyable && value && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(value, label)}
                    className="ml-2 flex-shrink-0"
                >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            )}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Transaction Details
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 dark:text-slate-400">
                                Complete information about this transaction
                            </DialogDescription>
                        </div>
                        <div className={`p-4 rounded-xl border-2 ${getTypeColor(transaction.transaction_type)}`}>
                            {getTypeIcon(transaction.transaction_type)}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-slate-800">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="receipt">Receipt</TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-6 mt-6">
                        {/* Amount Card */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Transaction Amount</p>
                            <p className={`text-4xl font-bold ${transaction.transaction_type === 'receive' ? 'text-emerald-600 dark:text-emerald-400' :
                                transaction.transaction_type === 'send' ? 'text-red-600 dark:text-red-400' :
                                    'text-amber-600 dark:text-amber-400'
                                }`}>
                                {transaction.transaction_type === 'send' ? '-' : transaction.transaction_type === 'receive' ? '+' : ''}
                                {formatAmount(transaction.amount, transaction.currency)}
                            </p>
                            <Badge className={`mt-3 ${transaction.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                transaction.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                    'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                }`}>
                                {transaction.status}
                            </Badge>
                        </div>

                        {/* Transaction Information */}
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Transaction Information
                            </h3>
                            <div className="space-y-0">
                                <InfoRow icon={Hash} label="Transaction ID" value={`#${transaction.id}`} copyable />
                                <InfoRow icon={FileText} label="Description" value={transaction.description} />
                                <InfoRow icon={Tag} label="Type" value={transaction.transaction_type} />
                                <InfoRow icon={Tag} label="Category" value={transaction.category || 'Uncategorized'} />
                                <InfoRow icon={Calendar} label="Date & Time" value={formatFullDate(transaction.created_at)} />
                            </div>
                        </div>

                        {/* Parties Involved */}
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Parties Involved
                            </h3>
                            <div className="space-y-0">
                                {transaction.transaction_type === 'send' && (
                                    <InfoRow
                                        icon={User}
                                        label="Recipient"
                                        value={transaction.recipient_name || transaction.recipient_email || 'N/A'}
                                    />
                                )}
                                {transaction.transaction_type === 'receive' && (
                                    <InfoRow
                                        icon={User}
                                        label="Sender"
                                        value={transaction.sender_name || transaction.sender_email || transaction.recipient_name || 'System'}
                                    />
                                )}
                                {transaction.transaction_type === 'exchange' && (
                                    <>
                                        <InfoRow
                                            icon={RefreshCw}
                                            label="Exchange Type"
                                            value="Currency Exchange"
                                        />
                                        {transaction.from_currency && transaction.to_currency && (
                                            <InfoRow
                                                icon={CreditCard}
                                                label="Exchange"
                                                value={`${transaction.from_currency} → ${transaction.to_currency}`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financial Details
                            </h3>
                            <div className="space-y-0">
                                <InfoRow icon={CreditCard} label="Currency" value={transaction.currency} />
                                <InfoRow icon={DollarSign} label="Amount" value={formatAmount(transaction.amount, transaction.currency)} />
                                {transaction.fee && (
                                    <InfoRow icon={DollarSign} label="Transaction Fee" value={formatAmount(transaction.fee, transaction.currency)} />
                                )}
                                {transaction.exchange_rate && (
                                    <InfoRow icon={RefreshCw} label="Exchange Rate" value={transaction.exchange_rate} />
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {transaction.notes && (
                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Notes
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400">{transaction.notes}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="mt-6">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 w-0.5 bg-gray-200 dark:bg-slate-700 my-2" style={{ minHeight: '40px' }} />
                                </div>
                                <div className="flex-1 pb-8">
                                    <p className="font-semibold text-gray-900 dark:text-white">Transaction Created</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-500">{formatFullDate(transaction.created_at)}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Transaction initiated</p>
                                </div>
                            </div>

                            {transaction.status === 'completed' && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                                            <Check className="h-5 w-5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">Transaction Completed</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-500">{formatFullDate(transaction.updated_at || transaction.created_at)}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Successfully processed</p>
                                    </div>
                                </div>
                            )}

                            {transaction.status === 'pending' && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">Processing</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-500">In progress</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Awaiting confirmation</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Receipt Tab */}
                    <TabsContent value="receipt" className="mt-6">
                        <div className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl p-8">
                            <div className="text-center mb-8">
                                <Building className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FX Wallet</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-500">Transaction Receipt</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700">
                                    <span className="text-gray-600 dark:text-slate-400">Transaction ID</span>
                                    <span className="font-mono text-gray-900 dark:text-white">#{transaction.id}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700">
                                    <span className="text-gray-600 dark:text-slate-400">Date</span>
                                    <span className="text-gray-900 dark:text-white">{new Date(transaction.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700">
                                    <span className="text-gray-600 dark:text-slate-400">Type</span>
                                    <span className="text-gray-900 dark:text-white capitalize">{transaction.transaction_type}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700">
                                    <span className="text-gray-600 dark:text-slate-400">Description</span>
                                    <span className="text-gray-900 dark:text-white">{transaction.description}</span>
                                </div>
                                <div className="flex justify-between py-4 bg-amber-500/10 px-4 rounded-lg">
                                    <span className="font-semibold text-gray-900 dark:text-white">Amount</span>
                                    <span className="font-bold text-xl text-gray-900 dark:text-white">{formatAmount(transaction.amount, transaction.currency)}</span>
                                </div>
                            </div>

                            <div className="text-center text-xs text-gray-500 dark:text-slate-500 mb-6">
                                This is an official transaction receipt from FX Wallet
                            </div>

                            <Button onClick={downloadReceipt} className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900">
                                <Download className="h-4 w-4 mr-2" />
                                Download Receipt (PDF)
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <Button
                        variant="outline"
                        onClick={shareTransaction}
                        className="flex-1 border-gray-300 dark:border-slate-700"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button
                        onClick={downloadReceipt}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-900"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
