import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * POST /api/admin/support/save-request
 * Save a support request email (admin only)
 */
export async function POST(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Create support_requests table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert the support request
    const [result] = await pool.query(
      `INSERT INTO support_requests (email, created_at)
       VALUES (?, NOW())`,
      [email.trim()]
    );

    return NextResponse.json({
      success: true,
      message: 'Support request saved successfully',
      request: {
        id: result.insertId,
        email: email.trim(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving support request:', error);
    return NextResponse.json(
      { message: 'Failed to save support request', error: error.message },
      { status: 500 }
    );
  }
}

