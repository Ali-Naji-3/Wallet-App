'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

// Sample data - in production, this would come from API
const generateBalanceData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: 10000 + Math.random() * 5000,
      income: Math.random() * 2000,
      expenses: Math.random() * 1500,
    });
  }
  return data;
};

const generateCategoryData = () => [
  { name: 'Food & Dining', value: 1250, color: '#f59e0b' },
  { name: 'Shopping', value: 890, color: '#8b5cf6' },
  { name: 'Transportation', value: 340, color: '#3b82f6' },
  { name: 'Bills', value: 560, color: '#ef4444' },
  { name: 'Salary', value: 5000, color: '#10b981' },
  { name: 'Business', value: 2100, color: '#6366f1' },
  { name: 'Other', value: 450, color: '#64748b' },
];

const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    income: 3000 + Math.random() * 2000,
    expenses: 2000 + Math.random() * 1500,
  }));
};

const COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#6366f1', '#64748b'];

export default function TransactionAnalytics({ transactions = [] }) {
  const balanceData = generateBalanceData();
  const categoryData = generateCategoryData();
  const monthlyData = generateMonthlyData();

  // Calculate stats from real transactions if provided
  const stats = {
    totalIncome: transactions.filter(t => t.transaction_type === 'receive').reduce((sum, t) => sum + (t.amount || 0), 0),
    totalExpenses: transactions.filter(t => t.transaction_type === 'send').reduce((sum, t) => sum + (t.amount || 0), 0),
    totalTransactions: transactions.length,
    avgTransaction: transactions.length > 0 ? transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) / transactions.length : 0,
  };

  const netIncome = stats.totalIncome - stats.totalExpenses;
  const incomeGrowth = 12.5; // This would be calculated from historical data

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Income</p>
                <p className="text-2xl font-bold mt-1">${stats.totalIncome.toFixed(2)}</p>
                <div className="flex items-center mt-2 text-emerald-100 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+{incomeGrowth}% vs last month</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <ArrowDownLeft className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold mt-1">${stats.totalExpenses.toFixed(2)}</p>
                <div className="flex items-center mt-2 text-red-100 text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span>-8.2% vs last month</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <ArrowUpRight className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Net Income</p>
                <p className="text-2xl font-bold mt-1">${netIncome.toFixed(2)}</p>
                <div className="flex items-center mt-2 text-blue-100 text-sm">
                  {netIncome >= 0 ? (
                    <><TrendingUp className="h-4 w-4 mr-1" /><span>Positive</span></>
                  ) : (
                    <><TrendingDown className="h-4 w-4 mr-1" /><span>Negative</span></>
                  )}
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Transaction</p>
                <p className="text-2xl font-bold mt-1">${stats.avgTransaction.toFixed(2)}</p>
                <div className="flex items-center mt-2 text-purple-100 text-sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  <span>{stats.totalTransactions} total</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Trend Chart */}
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Balance Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={balanceData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="date" stroke="#6b7280" className="dark:stroke-slate-400" />
                <YAxis stroke="#6b7280" className="dark:stroke-slate-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-700 dark:text-slate-300">{cat.name}</span>
                  <span className="text-gray-500 dark:text-slate-500 ml-auto">${cat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Income vs Expenses */}
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Income vs Expenses (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="month" stroke="#6b7280" className="dark:stroke-slate-400" />
                <YAxis stroke="#6b7280" className="dark:stroke-slate-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

