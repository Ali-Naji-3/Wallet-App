import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { sendVerificationEmail } from '@/lib/email';

/**
 * POST /api/admin/support/send-verification
 * Send verification email to a user (admin only)
 * 
 * Required: userId OR email
 * Returns: { success: true/false, message: string }
 */
export async function POST(req) {
  console.log('[Send Verification] ====== REQUEST STARTED ======');
  
  try {
    // ===== STEP 1: Authentication Check =====
    let adminUser;
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
        console.log('[Send Verification] No token provided');
        return NextResponse.json(
          { 
            success: false,
            message: 'Unauthorized: Authentication token required',
            error: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
    }

      adminUser = await requireAdmin(token);
      console.log('[Send Verification] Admin authenticated:', adminUser.id);
    } catch (authError) {
      console.error('[Send Verification] Authentication error:', authError);
      console.error('[Send Verification] Auth error message:', authError.message);
      console.error('[Send Verification] Auth error stack:', authError.stack);
      
      // Return 401 for auth errors, not 500
      return NextResponse.json(
        { 
          success: false,
          message: authError.message || 'Unauthorized: Admin access required',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // ===== STEP 2: Parse Request Body =====
    let body;
    try {
      body = await req.json();
      console.log('[Send Verification] Request body received:', {
        hasUserId: !!body.userId,
        hasEmail: !!body.email,
        userId: body.userId,
        email: body.email
      });
    } catch (parseError) {
      console.error('[Send Verification] JSON parse error:', parseError);
      console.error('[Send Verification] Parse error stack:', parseError.stack);
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request format. Please check your input.',
          error: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // ===== STEP 3: Validate Input Fields =====
    const { userId, email } = body || {};

    if (!userId && !email) {
      console.log('[Send Verification] Validation failed: Missing userId and email');
      return NextResponse.json(
        { 
          success: false,
          message: 'User ID or email is required',
          error: 'MISSING_USER_IDENTIFIER'
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        console.log('[Send Verification] Validation failed: Invalid email format');
        return NextResponse.json(
          { 
            success: false,
            message: 'Invalid email format',
            error: 'INVALID_EMAIL_FORMAT'
          },
          { status: 400 }
        );
      }
    }

    // Validate userId if provided
    if (userId && (isNaN(userId) || parseInt(userId) <= 0)) {
      console.log('[Send Verification] Validation failed: Invalid userId');
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid user ID',
          error: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    console.log('[Send Verification] Validation passed');

    // ===== STEP 4: Get Database Pool =====
    let pool;
    try {
      pool = getPool();
      if (!pool) {
        throw new Error('Database connection pool is null');
      }
      console.log('[Send Verification] Database pool obtained');
    } catch (dbError) {
      console.error('[Send Verification] Database pool error:', dbError);
      console.error('[Send Verification] Database pool error stack:', dbError.stack);
      return NextResponse.json(
        { 
          success: false,
          message: 'Database connection error. Please try again later.',
          error: 'DATABASE_POOL_ERROR',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // ===== STEP 5: Find User =====
    let user;
    try {
    if (userId) {
        console.log('[Send Verification] Searching user by ID:', userId);
      const [rows] = await pool.query(
        `SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1`,
          [parseInt(userId)]
      );
      user = rows[0];
      } else if (email) {
        console.log('[Send Verification] Searching user by email:', email);
      const [rows] = await pool.query(
        `SELECT id, email, full_name FROM users WHERE email = ? LIMIT 1`,
          [email.trim()]
      );
      user = rows[0];
    }

    if (!user) {
        console.log('[Send Verification] User not found');
        return NextResponse.json(
          { 
            success: false,
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      console.log('[Send Verification] User found:', {
        id: user.id,
        email: user.email,
        name: user.full_name
      });
    } catch (queryError) {
      console.error('[Send Verification] ===== USER QUERY ERROR =====');
      console.error('[Send Verification] Query error message:', queryError.message);
      console.error('[Send Verification] Query error code:', queryError.code);
      console.error('[Send Verification] Query error sqlMessage:', queryError.sqlMessage);
      console.error('[Send Verification] Query error stack:', queryError.stack);
      
      return NextResponse.json(
        { 
          success: false,
          message: 'Database query error. Please try again.',
          error: 'DATABASE_QUERY_ERROR',
          details: process.env.NODE_ENV === 'development' 
            ? `${queryError.message}${queryError.sqlMessage ? ` - ${queryError.sqlMessage}` : ''}` 
            : undefined
        },
        { status: 500 }
      );
    }

    // ===== STEP 6: Send Verification Email =====
    let emailResult;
    try {
      console.log('[Send Verification] Attempting to send email to:', user.email);
      
      emailResult = await sendVerificationEmail(
      user.email,
      user.full_name || 'User',
      {
        verificationLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/wallet/kyc`,
      }
    );

      console.log('[Send Verification] Email send result:', {
        success: emailResult.success,
        skipped: emailResult.skipped,
        message: emailResult.message,
        error: emailResult.error
      });
    } catch (emailError) {
      console.error('[Send Verification] ===== EMAIL ERROR =====');
      console.error('[Send Verification] Email error message:', emailError.message);
      console.error('[Send Verification] Email error code:', emailError.code);
      console.error('[Send Verification] Email error stack:', emailError.stack);

      // Return email error as JSON, not 500
      return NextResponse.json(
        {
          success: false,
          message: emailError.message || 'Failed to send verification email',
          error: 'EMAIL_ERROR',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
        );
    }

    // ===== STEP 7: Handle Email Result =====
    if (!emailResult.success) {
      // Email failed or was skipped
      const isSkipped = emailResult.skipped;
      const errorMessage = emailResult.message || 'Failed to send verification email';
      
      console.log('[Send Verification] Email not sent:', {
        skipped: isSkipped,
        message: errorMessage,
        error: emailResult.error
      });

      // Log failed email attempt
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS email_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            user_name VARCHAR(255),
            email_type VARCHAR(50) DEFAULT 'verification',
            status VARCHAR(20) DEFAULT 'failed',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            error_message TEXT,
            INDEX idx_user_id (user_id),
            INDEX idx_sent_at (sent_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(
          `INSERT INTO email_logs (user_id, user_email, user_name, email_type, status, error_message, sent_at)
           VALUES (?, ?, ?, 'verification', 'failed', ?, NOW())`,
          [user.id, user.email, user.full_name || null, errorMessage]
        );
      } catch (logError) {
        console.error('[Send Verification] Error logging failed email:', logError);
        // Don't fail the request if logging fails
      }

      // Return 200 with error for EMAIL_NOT_CONFIGURED (not a server error, just missing config)
      // This allows frontend to handle it gracefully without treating it as a failure
      if (isSkipped) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email service is not configured. Please configure SMTP settings in the backend environment variables (SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT).',
            error: 'EMAIL_NOT_CONFIGURED',
            emailResult,
            configurable: true, // Indicates this can be fixed by admin
          },
          { status: 200 } // Return 200 so frontend treats it as a handled response, not a server error
        );
      }
      
      // For actual email send failures, return 500
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: 'EMAIL_ERROR',
          emailResult,
        },
        { status: 500 }
      );
    }

    // ===== STEP 8: Log Successful Email =====
    try {
      console.log('[Send Verification] Logging successful email send');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          user_name VARCHAR(255),
          email_type VARCHAR(50) DEFAULT 'verification',
          status VARCHAR(20) DEFAULT 'sent',
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          error_message TEXT,
          INDEX idx_user_id (user_id),
          INDEX idx_sent_at (sent_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(
        `INSERT INTO email_logs (user_id, user_email, user_name, email_type, status, sent_at)
         VALUES (?, ?, ?, 'verification', 'sent', NOW())`,
        [user.id, user.email, user.full_name || null]
      );
      
      console.log('[Send Verification] Email logged successfully');
    } catch (logError) {
      console.error('[Send Verification] Error logging email (non-fatal):', logError);
      // Don't fail the request if logging fails - email was already sent
    }

    // ===== STEP 9: Return Success =====
    console.log('[Send Verification] ====== SUCCESS ======');
    
    return NextResponse.json({
      success: true,
      message: `Verification email sent successfully to ${user.email}`,
      emailResult,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
      },
    }, { status: 200 });

  } catch (error) {
    // ===== CATCH-ALL FOR UNEXPECTED ERRORS =====
    console.error('[Send Verification] ====== UNEXPECTED ERROR ======');
    console.error('[Send Verification] Error type:', error?.constructor?.name);
    console.error('[Send Verification] Error message:', error?.message);
    console.error('[Send Verification] Error code:', error?.code);
    console.error('[Send Verification] Error name:', error?.name);
    console.error('[Send Verification] Error stack:', error?.stack);
    
    // Log full error object for debugging
    try {
      console.error('[Send Verification] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (stringifyError) {
      console.error('[Send Verification] Could not stringify error object');
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: 'An unexpected error occurred. Please try again later.',
        error: 'UNEXPECTED_ERROR',
        details: process.env.NODE_ENV === 'development' 
          ? `${error?.message || 'Unknown error'}${error?.stack ? `\nStack: ${error.stack}` : ''}` 
          : undefined
      },
      { status: 500 }
    );
  }
}
