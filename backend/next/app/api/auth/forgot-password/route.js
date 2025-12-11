import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { sendPasswordResetSMS } from '@/lib/sms';

/**
 * POST /api/auth/forgot-password
 * Sends password reset link/code to user's email or phone
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, phone, method } = body || {}; // method: 'email' | 'sms'

    if (!email && !phone) {
      return NextResponse.json(
        { message: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Find user by email or phone
    let query = 'SELECT id, email, full_name, phone_number FROM users WHERE ';
    let params = [];
    
    if (email) {
      query += 'email = ?';
      params.push(email);
    } else {
      query += 'phone_number = ?';
      params.push(phone);
    }
    
    query += ' AND is_active = TRUE LIMIT 1';
    
    const [rows] = await pool.query(query, params);
    const user = rows[0];
    
    // Security: Always return success even if user not found
    if (!user) {
      console.log(`[ForgotPassword] User not found for: ${email || phone}`);
      
      return NextResponse.json({
        message: method === 'sms' 
          ? 'If this phone number is registered, you will receive a reset code shortly.'
          : 'If this email is registered, you will receive a reset link shortly.',
        success: true,
      });
    }

    // Generate reset token
    let resetToken;
    let expiresAt;
    
    if (method === 'sms') {
      // For SMS: 6-digit code (expires in 15 minutes)
      resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    } else {
      // For Email: secure URL token (expires in 1 hour)
      resetToken = crypto.randomBytes(32).toString('hex');
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }

    // Invalidate old tokens
    await pool.query(
      `UPDATE password_reset_tokens 
       SET used_at = NOW() 
       WHERE user_id = ? AND used_at IS NULL`,
      [user.id]
    );

    // Store new token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES (?, ?, ?)`,
      [user.id, resetToken, expiresAt]
    );

    // Send reset link/code
    if (method === 'sms' && user.phone_number) {
      const result = await sendPasswordResetSMS(user.phone_number, resetToken);
      
      if (!result.success) {
        console.error('[ForgotPassword] Failed to send SMS:', result.error);
        return NextResponse.json(
          { message: 'Failed to send SMS. Please try again later.' },
          { status: 500 }
        );
      }
      
      console.log(`✅ [ForgotPassword] SMS sent to: ${user.phone_number}`);
      
      return NextResponse.json({
        message: 'Reset code sent to your phone.',
        method: 'sms',
        success: true,
      });
      
    } else {
      const result = await sendPasswordResetEmail(
        user.email, 
        resetToken, 
        user.full_name
      );
      
      if (!result.success) {
        console.error('[ForgotPassword] Failed to send email:', result.error);
        return NextResponse.json(
          { message: 'Failed to send email. Please try again later.' },
          { status: 500 }
        );
      }
      
      console.log(`✅ [ForgotPassword] Email sent to: ${user.email}`);
      
      return NextResponse.json({
        message: 'Password reset link sent to your email.',
        method: 'email',
        success: true,
      });
    }
    
  } catch (err) {
    console.error('❌ [ForgotPassword] Error:', err);
    return NextResponse.json(
      { message: 'Failed to process request. Please try again later.' },
      { status: 500 }
    );
  }
}