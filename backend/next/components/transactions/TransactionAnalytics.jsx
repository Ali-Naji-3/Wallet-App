'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    Target,
    Calendar,
    Award,
} from 'lucide-react';

const COLORS = {
    shopping: '#f59e0b',
    food: '#10b981',
    transport: '#3b82f6',
    bills: '#ef4444',
    salary: '#8b5cf6',
    business: '#06b6d4',
    transfer: '#ec4899',
    other: '#6b7280',
};

const CATEGORY_LABELS = {
    shopping: 'Shopping',
    food: 'Food & Dining',
    transport: 'Transportation',
    bills: 'Bills & Utilities',
    salary: 'Salary & Income',
    business: 'Business',
    transfer: 'Transfers',
    other: 'Other',
};

export default function TransactionAnalytics({ transactions }) {
    const analytics = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return null;
        }

        // Calculate category breakdown
        const categoryData = {};
        transactions.forEach(tx => {
            const category = tx.category || 'other';
            if (!categoryData[category]) {
                categoryData[category] = { total: 0, count: 0 };
            }
            categoryData[category].total += Math.abs(tx.amount || 0);
            categoryData[category].count += 1;
        });

        const categoryChartData = Object.entries(categoryData).map(([category, data]) => ({
            name: CATEGORY_LABELS[category] || category,
            value: data.total,
            count: data.count,
            color: COLORS[category] || COLORS.other,
        }));

        // Calculate income vs expenses over time (last 30 days)
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const dailyData = {};
        transactions
            .filter(tx => new Date(tx.created_at) >= last30Days)
            .forEach(tx => {
                const date = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (!dailyData[date]) {
                    dailyData[date] = { date, income: 0, expenses: 0 };
                }
                if (tx.transaction_type === 'receive') {
                    dailyData[date].income += Math.abs(tx.amount || 0);
                } else if (tx.transaction_type === 'send') {
                    dailyData[date].expenses += Math.abs(tx.amount || 0);
                }
            });

        const timelineData = Object.values(dailyData).slice(-14); // Last 14 days

        // Calculate insights
        const totalIncome = transactions
            .filter(tx => tx.transaction_type === 'receive')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const totalExpenses = transactions
            .filter(tx => tx.transaction_type === 'send')
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const avgTransaction = transactions.length > 0
            ? transactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) / transactions.length
            : 0;

        const largestTransaction = transactions.reduce((max, tx) => {
            const amount = Math.abs(tx.amount || 0);
            return amount > max.amount ? { amount, tx } : max;
        }, { amount: 0, tx: null });

        const topCategory = categoryChartData.reduce((max, cat) =>
            cat.value > max.value ? cat : max
            , { value: 0, name: 'N/A' });

        // Monthly comparison (current vs previous month)
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthExpenses = transactions
            .filter(tx => tx.transaction_type === 'send' && new Date(tx.created_at) >= currentMonthStart)
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const previousMonthExpenses = transactions
            .filter(tx =>
                tx.transaction_type === 'send' &&
                new Date(tx.created_at) >= previousMonthStart &&
                new Date(tx.created_at) <= previousMonthEnd
            )
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        const monthlyChange = previousMonthExpenses > 0
            ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
            : 0;

        return {
            categoryChartData,
            timelineData,
            totalIncome,
            totalExpenses,
            avgTransaction,
            largestTransaction,
            topCategory,
            monthlyChange,
            netBalance: totalIncome - totalExpenses,
        };
    }, [transactions]);

    if (!analytics) {
        return (
            <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                <CardContent className="p-8 text-center">
                    <p className="text-gray-500 dark:text-slate-400">No transaction data available for analytics</p>
                </CardContent>
            </Card>
        );
    }

    const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'amber' }) => (
        <Card className={`bg-gradient-to-br from-${color}-500/10 to-${color}-500/5 border-${color}-500/20`}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
                        {subtext && (
                            <p className="text-xs text-gray-500 dark:text-slate-500">{subtext}</p>
                        )}
                        {trend !== undefined && (
                            <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                <span>{Math.abs(trend).toFixed(1)}% vs last month</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl bg-${color}-500/20`}>
                        <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={ArrowDownLeft}
                    label="Total Income"
                    value={`$${analytics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color="emerald"
                />
                <StatCard
                    icon={ArrowUpRight}
                    label="Total Expenses"
                    value={`$${analytics.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    trend={-analytics.monthlyChange}
                    color="red"
                />
                <StatCard
                    icon={DollarSign}
                    label="Net Balance"
                    value={`$${analytics.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color={analytics.netBalance >= 0 ? 'emerald' : 'red'}
                />
                <StatCard
                    icon={Target}
                    label="Avg Transaction"
                    value={`$${analytics.avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color="amber"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending by Category */}
                <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            Spending by Category
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {analytics.categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                    formatter={(value) => `$${value.toFixed(2)}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Income vs Expenses Timeline */}
                <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            Income vs Expenses (Last 14 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                    formatter={(value) => `$${value.toFixed(2)}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981' }}
                                    name="Income"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ fill: '#ef4444' }}
                                    name="Expenses"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Insights */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        Key Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Top Spending Category</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{analytics.topCategory.name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                ${analytics.topCategory.value.toFixed(2)} spent
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Largest Transaction</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                ${analytics.largestTransaction.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 truncate">
                                {analytics.largestTransaction.tx?.description || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Spending Trend</p>
                            <p className={`text-xl font-bold ${analytics.monthlyChange >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {analytics.monthlyChange >= 0 ? '+' : ''}{analytics.monthlyChange.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">vs previous month</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
