import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = user.id;

    // Get user's wallet IDs
    const [userWallets] = await pool.query(
      `SELECT id FROM wallets WHERE user_id = ?`,
      [userId]
    );
    const walletIds = userWallets.map(w => w.id);

    if (walletIds.length === 0) {
      return NextResponse.json({
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        avgTransaction: 0,
        totalTransactions: 0,
        balanceTrend: [],
        categories: [],
        monthlyIncome: [],
        monthlyExpenses: [],
      });
    }

    // Calculate total income (transfers where user receives money)
    const placeholders = walletIds.map(() => '?').join(',');
    const [incomeResult] = await pool.query(
      `SELECT COALESCE(SUM(target_amount), 0) as total
       FROM transactions
       WHERE type = 'transfer' 
         AND target_wallet_id IN (${placeholders})
         AND user_id = ?`,
      [...walletIds, userId]
    );
    const totalIncome = parseFloat(incomeResult[0]?.total || 0);

    // Calculate total expenses (transfers where user sends money)
    const [expensesResult] = await pool.query(
      `SELECT COALESCE(SUM(source_amount), 0) as total
       FROM transactions
       WHERE type = 'transfer'
         AND source_wallet_id IN (${placeholders})
         AND user_id = ?`,
      [...walletIds, userId]
    );
    const totalExpenses = parseFloat(expensesResult[0]?.total || 0);

    // Calculate net income
    const netIncome = totalIncome - totalExpenses;

    // Get all transactions for calculations
    const [allTransactions] = await pool.query(
      `SELECT 
         source_amount,
         target_amount,
         type,
         created_at,
         note
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const totalTransactions = allTransactions.length;
    
    // Calculate average transaction amount
    let avgTransaction = 0;
    if (totalTransactions > 0) {
      const totalAmount = allTransactions.reduce((sum, tx) => {
        const amount = tx.type === 'transfer' 
          ? (tx.source_amount || 0) + (tx.target_amount || 0)
          : Math.abs(parseFloat(tx.source_amount || 0));
        return sum + amount;
      }, 0);
      avgTransaction = totalAmount / totalTransactions;
    }

    // Balance trend (last 30 days) - daily balance changes
    const balanceTrend = [];
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily transaction sums
    const [dailyData] = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         SUM(CASE WHEN type = 'transfer' AND target_wallet_id IN (${placeholders}) THEN target_amount ELSE 0 END) as daily_income,
         SUM(CASE WHEN type = 'transfer' AND source_wallet_id IN (${placeholders}) THEN source_amount ELSE 0 END) as daily_expenses
       FROM transactions
       WHERE user_id = ? 
         AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [...walletIds, ...walletIds, userId, thirtyDaysAgo]
    );

    // Build balance trend array (30 days)
    let runningBalance = 0;
    const dateMap = new Map();
    dailyData.forEach(row => {
      dateMap.set(row.date.toISOString().split('T')[0], {
        income: parseFloat(row.daily_income || 0),
        expenses: parseFloat(row.daily_expenses || 0),
      });
    });

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dateMap.get(dateStr) || { income: 0, expenses: 0 };
      
      runningBalance += dayData.income - dayData.expenses;
      
      balanceTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: Math.max(0, runningBalance), // Ensure non-negative
        income: dayData.income,
        expenses: dayData.expenses,
      });
    }

    // Categories (from transaction notes or type)
    const categoryMap = new Map();
    allTransactions.forEach(tx => {
      let category = 'Other';
      const note = (tx.note || '').toLowerCase();
      
      if (note.includes('food') || note.includes('restaurant') || note.includes('dining')) {
        category = 'Food & Dining';
      } else if (note.includes('shop') || note.includes('purchase') || note.includes('buy')) {
        category = 'Shopping';
      } else if (note.includes('transport') || note.includes('uber') || note.includes('taxi')) {
        category = 'Transportation';
      } else if (note.includes('bill') || note.includes('utility') || note.includes('electric')) {
        category = 'Bills';
      } else if (note.includes('salary') || note.includes('payroll') || note.includes('income')) {
        category = 'Salary';
      } else if (note.includes('business') || note.includes('freelance')) {
        category = 'Business';
      } else if (tx.type === 'exchange') {
        category = 'Exchange';
      }

      const amount = tx.type === 'transfer'
        ? (tx.target_amount || 0) - (tx.source_amount || 0)
        : Math.abs(parseFloat(tx.source_amount || 0));

      if (amount > 0) {
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + amount);
      }
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: parseFloat(value),
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly income and expenses (last 12 months)
    const monthlyIncome = [];
    const monthlyExpenses = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const [monthlyData] = await pool.query(
      `SELECT 
         DATE_FORMAT(created_at, '%Y-%m') as month,
         SUM(CASE WHEN type = 'transfer' AND target_wallet_id IN (${placeholders}) THEN target_amount ELSE 0 END) as income,
         SUM(CASE WHEN type = 'transfer' AND source_wallet_id IN (${placeholders}) THEN source_amount ELSE 0 END) as expenses
       FROM transactions
       WHERE user_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [...walletIds, ...walletIds, userId]
    );

    const monthlyMap = new Map();
    monthlyData.forEach(row => {
      monthlyMap.set(row.month, {
        income: parseFloat(row.income || 0),
        expenses: parseFloat(row.expenses || 0),
      });
    });

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthData = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      
      monthlyIncome.push({
        month: months[date.getMonth()],
        income: monthData.income,
      });
      
      monthlyExpenses.push({
        month: months[date.getMonth()],
        expenses: monthData.expenses,
      });
    }

    // Combine monthly data
    const monthlyCombined = monthlyIncome.map((item, index) => ({
      month: item.month,
      income: item.income,
      expenses: monthlyExpenses[index].expenses,
    }));

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netIncome,
      avgTransaction,
      totalTransactions,
      balanceTrend,
      categories,
      monthlyData: monthlyCombined,
    });
  } catch (err) {
    console.error('Wallet stats error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to get wallet stats' },
      { status: 500 }
    );
  }
}

// Helper function to assign colors to categories
function getCategoryColor(category) {
  const colors = {
    'Food & Dining': '#f59e0b',
    'Shopping': '#8b5cf6',
    'Transportation': '#3b82f6',
    'Bills': '#ef4444',
    'Salary': '#10b981',
    'Business': '#6366f1',
    'Exchange': '#06b6d4',
    'Other': '#64748b',
  };
  return colors[category] || '#64748b';
}

