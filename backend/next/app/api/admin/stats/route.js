import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = parseBearer(authHeader || undefined);
    
    if (!token) {
      console.log('[Admin Stats] No token provided');
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // Verify admin access
    try {
      await requireAdmin(token);
    } catch (authError) {
      console.error('[Admin Stats] Auth error:', authError.message);
      return NextResponse.json({ 
        message: authError.message || 'Unauthorized' 
      }, { status: 401 });
    }

    const pool = getPool();

    // User stats
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as newUsersLast7Days
      FROM users
    `);

    // Transaction stats
    const [txStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) as totalExchanges,
        SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) as totalTransfers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as txLast24Hours,
        COALESCE(SUM(source_amount), 0) as totalVolume
      FROM transactions
    `);

    // Wallet stats - Active wallets are those with balance > 0
    const [walletStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalWallets,
        COUNT(CASE WHEN balance > 0 THEN 1 END) as activeWallets,
        COALESCE(SUM(balance), 0) as totalBalance
      FROM wallets
    `);

    return NextResponse.json({
      users: userStats[0],
      transactions: txStats[0],
      wallets: walletStats[0],
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin stats error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to get admin stats' },
      { status: 500 }
    );
  }
}

