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

    // Query with correct column names (full_name not name)
    const [rows] = await pool.query(
      `SELECT 
        t.id,
        t.type,
        t.user_id,
        t.source_wallet_id,
        t.target_wallet_id,
        t.source_amount,
        t.source_currency,
        t.target_amount,
        t.target_currency,
        t.fx_rate,
        t.fee_amount,
        t.note,
        t.created_at,
        ws.currency_code AS source_currency_code,
        ws.user_id AS source_user_id,
        wt.currency_code AS target_currency_code,
        wt.user_id AS target_user_id,
        sender.full_name AS sender_name,
        sender.email AS sender_email,
        recipient.full_name AS recipient_name,
        recipient.email AS recipient_email
      FROM transactions t
      LEFT JOIN wallets ws ON t.source_wallet_id = ws.id
      LEFT JOIN wallets wt ON t.target_wallet_id = wt.id
      LEFT JOIN users sender ON ws.user_id = sender.id
      LEFT JOIN users recipient ON wt.user_id = recipient.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 100`,
      [user.id]
    );

    console.log(`[Transactions API] Found ${rows.length} transactions for user ${user.id}`);

    // Transform transactions for frontend
    const transactions = rows.map(row => {
      let transaction_type = row.type;
      let description = row.note || 'Transaction';
      let recipient_name = null;
      let sender_name = null;

      if (row.type === 'transfer') {
        // Admin credit (no source wallet - funds credited by admin)
        if (!row.source_wallet_id) {
          transaction_type = 'receive';
          description = row.note || 'Funds credited';
          sender_name = 'Admin';
        }
        // User sent money (source_user_id matches current user)
        else if (row.source_user_id === user.id) {
          transaction_type = 'send';
          const toName = row.recipient_name || row.recipient_email || 'Unknown';
          description = `Sent to ${toName}`;
          recipient_name = toName;
        }
        // User received money (target_user_id matches current user)
        else if (row.target_user_id === user.id) {
          transaction_type = 'receive';
          const fromName = row.sender_name || row.sender_email || 'Unknown';
          description = `Received from ${fromName}`;
          sender_name = fromName;
        }
        // Fallback
        else {
          description = row.note || 'Transfer';
          recipient_name = row.recipient_email || row.sender_email || 'Unknown';
        }
      } else if (row.type === 'exchange') {
        transaction_type = 'exchange';
        const fromCurrency = row.source_currency_code || row.source_currency || '?';
        const toCurrency = row.target_currency_code || row.target_currency || '?';
        description = `${fromCurrency} → ${toCurrency}`;
      }

      return {
        id: row.id,
        transaction_type,
        description,
        recipient_name,
        sender_name,
        amount: parseFloat(row.source_amount) || 0,
        currency: row.source_currency || 'USD',
        target_amount: parseFloat(row.target_amount) || 0,
        target_currency: row.target_currency,
        from_currency: row.source_currency_code || row.source_currency,
        to_currency: row.target_currency_code || row.target_currency,
        note: row.note,
        created_at: row.created_at,
        status: 'completed',
        category: 'transfer',
        sender_email: row.sender_email,
        recipient_email: row.recipient_email,
      };
    });

    console.log(`[Transactions API] Returning ${transactions.length} transactions`);

    return NextResponse.json({ transactions });
  } catch (err) {
    console.error('[Transactions API] Error:', err.message);
    console.error('[Transactions API] Stack:', err.stack);
    return NextResponse.json(
      { message: err?.message || 'Failed to load transactions' },
      { status: 500 }
    );
  }
}
