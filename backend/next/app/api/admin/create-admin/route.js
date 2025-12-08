import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/create-admin
 * Creates admin user if it doesn't exist
 * This is a one-time setup endpoint
 */
export async function POST(req) {
  try {
    const pool = getPool();
    const email = 'admin@admin.com';
    const password = 'admin';
    
    // Check if admin user already exists
    const [existing] = await pool.query(
      `SELECT id, email, role FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existing.length > 0) {
      const user = existing[0];
      
      // Update to admin role and password if needed
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      await pool.query(
        `UPDATE users SET 
          role = 'admin', 
          is_active = 1, 
          is_verified = 1,
          password_hash = ?
         WHERE id = ?`,
        [passwordHash, user.id]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: 'admin',
        },
      });
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, 'Admin User', 'USD', 'UTC', 'admin', 1, 1]
    );

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: result.insertId,
        email: email,
        role: 'admin',
      },
      credentials: {
        email: email,
        password: password,
      },
    });
  } catch (err) {
    console.error('Create admin error:', err);
    return NextResponse.json(
      { 
        success: false,
        message: err?.message || 'Failed to create admin user',
        error: err.message,
      },
      { status: 500 }
    );
  }
}







