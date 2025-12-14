import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * POST /api/admin/credit-wallet
 * Credit user wallet with test/fake money (DEMO ONLY)
 * Admin can add balance to any user's wallet for testing purposes
 */
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = parseBearer(authHeader || undefined);
    
    if (!token) {
      console.log('[Admin Credit Wallet] No token provided');
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // Verify admin access
    try {
      await requireAdmin(token);
    } catch (authError) {
      console.error('[Admin Credit Wallet] Auth error:', authError.message);
      return NextResponse.json({ 
        message: authError.message || 'Unauthorized' 
      }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { userId, currency, amount } = body;

    // Validation
    if (!userId || !currency || !amount) {
      return NextResponse.json({ 
        message: 'Missing required fields: userId, currency, amount' 
      }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ 
        message: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    const numericUserId = parseInt(userId);
    if (!numericUserId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const pool = getPool();

    // Check if user exists
    const [users] = await pool.query(
      `SELECT id, email, full_name FROM users WHERE id = ?`,
      [numericUserId]
    );

    if (users.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Check if wallet exists for this user and currency
    const [wallets] = await pool.query(
      `SELECT id, balance FROM wallets WHERE user_id = ? AND currency_code = ?`,
      [numericUserId, currency]
    );

    let newBalance;
    
    if (wallets.length === 0) {
      // Create wallet if it doesn't exist
      const address = `FXW-${currency}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      
      await pool.query(
        `INSERT INTO wallets (user_id, currency_code, address, balance) 
         VALUES (?, ?, ?, ?)`,
        [numericUserId, currency, address, numericAmount]
      );
      
      newBalance = numericAmount;
      console.log(`[Admin] Created wallet for user ${user.email} with ${numericAmount} ${currency}`);
    } else {
      // Update existing wallet
      const currentBalance = Number(wallets[0].balance) || 0;
      newBalance = currentBalance + numericAmount;
      
      await pool.query(
        `UPDATE wallets SET balance = ? WHERE id = ?`,
        [newBalance, wallets[0].id]
      );
      
      console.log(`[Admin] Updated wallet for user ${user.email}: ${currentBalance} + ${numericAmount} = ${newBalance} ${currency}`);
    }

    // Create notification for the user
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          numericUserId,
          'transaction',
          'Test Balance Added',
          `Admin credited your ${currency} wallet with ${numericAmount.toFixed(2)} ${currency} for testing purposes.`
        ]
      );
    } catch (notifError) {
      console.error('[Admin] Failed to create notification:', notifError);
      // Continue even if notification fails
    }

    // Get admin user info from token for logging
    const adminUser = verifyToken(token);
    console.log(`[ADMIN ACTION] User ${adminUser.email} (ID: ${adminUser.id}) credited ${numericAmount} ${currency} to user ${user.email} (ID: ${numericUserId})`);

    return NextResponse.json({
      message: 'Wallet credited successfully',
      data: {
        userId: numericUserId,
        userEmail: user.email,
        userName: user.full_name || null,
        currency,
        amountAdded: numericAmount,
        newBalance: newBalance,
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ 
        message: err.message 
      }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    
    console.error('[Admin Credit Wallet] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to credit wallet' },
      { status: 500 }
    );
  }
}
