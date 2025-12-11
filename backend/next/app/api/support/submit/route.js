import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { sendSupportRequestNotification } from '@/lib/email';

/**
 * POST /api/support/submit
 * Submit a support request (user-facing endpoint)
 * This endpoint is PUBLIC - no authentication required
 * 
 * Required fields: email, message
 * Optional fields: subject, user_id (from auth token)
 */
export async function POST(req) {
  console.log('[Support Submit] ====== REQUEST STARTED ======');
  
  try {
    // ===== STEP 1: Parse Request Body =====
    let body;
    try {
      body = await req.json();
      console.log('[Support Submit] Request body received:', { 
        hasEmail: !!body.email, 
        hasSubject: !!body.subject, 
        hasMessage: !!body.message,
        emailLength: body.email?.length,
        messageLength: body.message?.length
      });
    } catch (parseError) {
      console.error('[Support Submit] JSON parse error:', parseError);
      console.error('[Support Submit] Parse error stack:', parseError.stack);
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request format. Please check your input and try again.',
          error: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // ===== STEP 2: Extract and Validate Fields =====
    const { email, subject, message } = body || {};

    // Validate email (required)
    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('[Support Submit] Validation failed: Missing email');
      return NextResponse.json(
        { 
          success: false,
          message: 'Email is required',
          error: 'MISSING_EMAIL'
        },
        { status: 400 }
      );
    }

    // Validate message (required)
    if (!message || typeof message !== 'string' || !message.trim()) {
      console.log('[Support Submit] Validation failed: Missing message');
      return NextResponse.json(
        { 
          success: false,
          message: 'Message is required',
          error: 'MISSING_MESSAGE'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      console.log('[Support Submit] Validation failed: Invalid email format');
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid email format',
          error: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate message length
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      console.log('[Support Submit] Validation failed: Message too short');
      return NextResponse.json(
        { 
          success: false,
          message: 'Message must be at least 10 characters long',
          error: 'MESSAGE_TOO_SHORT'
        },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 5000) {
      console.log('[Support Submit] Validation failed: Message too long');
      return NextResponse.json(
        { 
          success: false,
          message: 'Message must be less than 5000 characters',
          error: 'MESSAGE_TOO_LONG'
        },
        { status: 400 }
      );
    }

    // Subject is optional, default to 'Support Request'
    const trimmedSubject = subject?.trim() || 'Support Request';

    console.log('[Support Submit] Validation passed:', {
      email: trimmedEmail,
      subject: trimmedSubject,
      messageLength: trimmedMessage.length
    });

    // ===== STEP 3: Get Database Pool =====
    let pool;
    try {
      pool = getPool();
      if (!pool) {
        throw new Error('Database connection pool is null');
      }
      console.log('[Support Submit] Database pool obtained successfully');
    } catch (dbError) {
      console.error('[Support Submit] Database pool error:', dbError);
      console.error('[Support Submit] Database pool error stack:', dbError.stack);
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

    // ===== STEP 4: Try to Get User ID (Optional) =====
    let userId = null;
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = parseBearer(authHeader);
        if (token) {
          const decoded = verifyToken(token);
          userId = decoded?.id || null;
          console.log('[Support Submit] User authenticated:', userId);
        }
      } else {
        console.log('[Support Submit] No authorization header - proceeding as anonymous');
      }
    } catch (tokenError) {
      // Not authenticated - that's okay, user can still submit support request
      console.log('[Support Submit] Token verification failed (expected for anonymous users):', tokenError.message);
      userId = null;
    }

    // ===== STEP 5: Ensure Table Exists with Correct Structure =====
    try {
      console.log('[Support Submit] Checking table structure...');
      
      // Check if table exists
      let tableExists = false;
      try {
        const [tables] = await pool.query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'support_requests'
        `);
        tableExists = tables.length > 0;
        console.log('[Support Submit] Table exists check:', tableExists);
      } catch (tableCheckError) {
        console.error('[Support Submit] Error checking table existence:', tableCheckError);
        // Continue - we'll try to create it
        tableExists = false;
      }
      
      if (!tableExists) {
        // Create table with all required columns
        console.log('[Support Submit] Creating support_requests table...');
        await pool.query(`
          CREATE TABLE support_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) DEFAULT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_user_id (user_id),
            INDEX idx_created_at (created_at),
            INDEX idx_status (status)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('[Support Submit] Table created successfully');
      } else {
        // Table exists - ensure all columns exist
        console.log('[Support Submit] Table exists, checking columns...');
        let columns = [];
        try {
          [columns] = await pool.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'support_requests'
            ORDER BY ORDINAL_POSITION
          `);
        } catch (columnCheckError) {
          console.error('[Support Submit] Error checking columns:', columnCheckError);
          // Continue - we'll try to add columns if needed
        }
        
        const columnNames = columns.map(col => col.COLUMN_NAME);
        console.log('[Support Submit] Existing columns:', columnNames);
        
        // Add missing columns one by one with error handling
        if (!columnNames.includes('user_id')) {
          try {
            await pool.query(`ALTER TABLE support_requests ADD COLUMN user_id INT NULL AFTER id`);
            console.log('[Support Submit] Added user_id column');
          } catch (alterError) {
            console.error('[Support Submit] Error adding user_id column:', alterError.message);
            // Continue - column might already exist
          }
        }
        
        if (!columnNames.includes('subject')) {
          try {
            await pool.query(`ALTER TABLE support_requests ADD COLUMN subject VARCHAR(255) DEFAULT NULL AFTER email`);
            console.log('[Support Submit] Added subject column');
          } catch (alterError) {
            console.error('[Support Submit] Error adding subject column:', alterError.message);
          }
        }
        
        if (!columnNames.includes('message')) {
          try {
            await pool.query(`ALTER TABLE support_requests ADD COLUMN message TEXT NOT NULL AFTER subject`);
            console.log('[Support Submit] Added message column');
          } catch (alterError) {
            console.error('[Support Submit] Error adding message column:', alterError.message);
          }
        }
        
        if (!columnNames.includes('status')) {
          try {
            await pool.query(`ALTER TABLE support_requests ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER message`);
            console.log('[Support Submit] Added status column');
          } catch (alterError) {
            console.error('[Support Submit] Error adding status column:', alterError.message);
          }
        }
      }
      
      console.log('[Support Submit] Table structure verified');
    } catch (tableError) {
      console.error('[Support Submit] ===== TABLE ERROR =====');
      console.error('[Support Submit] Table error message:', tableError.message);
      console.error('[Support Submit] Table error code:', tableError.code);
      console.error('[Support Submit] Table error sqlMessage:', tableError.sqlMessage);
      console.error('[Support Submit] Table error stack:', tableError.stack);
      return NextResponse.json(
        { 
          success: false,
          message: 'Database setup error. Please contact support.',
          error: 'TABLE_ERROR',
          details: process.env.NODE_ENV === 'development' 
            ? `${tableError.message}${tableError.sqlMessage ? ` - ${tableError.sqlMessage}` : ''}` 
            : undefined
        },
        { status: 500 }
      );
    }

    // ===== STEP 6: Insert Support Request =====
    let result;
    let ticketId;
    
    try {
      console.log('[Support Submit] Preparing to insert request...');
      console.log('[Support Submit] Insert values:', {
        userId: userId || 'NULL',
        email: trimmedEmail,
        subject: trimmedSubject,
        messageLength: trimmedMessage.length
      });
      
      // Insert query - handle NULL user_id properly
      const insertQuery = `
        INSERT INTO support_requests (user_id, email, subject, message, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', NOW())
      `;
      
      const insertParams = [userId, trimmedEmail, trimmedSubject, trimmedMessage];
      
      console.log('[Support Submit] Executing INSERT query...');
      [result] = await pool.query(insertQuery, insertParams);
      
      console.log('[Support Submit] INSERT result:', {
        insertId: result?.insertId,
        affectedRows: result?.affectedRows,
        resultType: typeof result
      });

      if (!result) {
        throw new Error('INSERT query returned no result');
      }

      if (!result.insertId) {
        throw new Error('INSERT query returned no insertId');
      }

      ticketId = result.insertId;
      console.log('[Support Submit] Successfully inserted request with ticket_id:', ticketId);
      
    } catch (insertError) {
      console.error('[Support Submit] ===== INSERT ERROR =====');
      console.error('[Support Submit] Insert error message:', insertError.message);
      console.error('[Support Submit] Insert error code:', insertError.code);
      console.error('[Support Submit] Insert error errno:', insertError.errno);
      console.error('[Support Submit] Insert error sqlState:', insertError.sqlState);
      console.error('[Support Submit] Insert error sqlMessage:', insertError.sqlMessage);
      console.error('[Support Submit] Insert error sql:', insertError.sql);
      console.error('[Support Submit] Insert error stack:', insertError.stack);
      
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to save support request. Please try again.',
          error: 'INSERT_ERROR',
          details: process.env.NODE_ENV === 'development' 
            ? `${insertError.message}${insertError.sqlMessage ? ` - ${insertError.sqlMessage}` : ''}` 
            : undefined
        },
        { status: 500 }
      );
    }

    // ===== STEP 7: Send Email Notification to Admin =====
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log('[Support Submit] Attempting to send email notification to admin...');
      
      // Try to get user name from database if userId is available
      let userName = null;
      if (userId) {
        try {
          const [userRows] = await pool.query(
            `SELECT full_name FROM users WHERE id = ? LIMIT 1`,
            [userId]
          );
          if (userRows && userRows.length > 0) {
            userName = userRows[0].full_name || null;
          }
        } catch (userQueryError) {
          console.warn('[Support Submit] Could not fetch user name:', userQueryError.message);
          // Continue without user name
        }
      }

      const emailResult = await sendSupportRequestNotification({
        userEmail: trimmedEmail,
        userName: userName,
        subject: trimmedSubject,
        message: trimmedMessage,
        ticketId: ticketId,
        userId: userId,
      });

      if (emailResult.success) {
        emailSent = true;
        console.log('[Support Submit] Email notification sent successfully');
      } else if (emailResult.skipped) {
        console.warn('[Support Submit] Email notification skipped (SMTP not configured)');
        emailError = 'Email service not configured';
      } else {
        console.error('[Support Submit] Email notification failed:', emailResult.message);
        emailError = emailResult.message || 'Failed to send email notification';
      }
    } catch (emailSendError) {
      console.error('[Support Submit] ===== EMAIL SEND ERROR =====');
      console.error('[Support Submit] Email error message:', emailSendError.message);
      console.error('[Support Submit] Email error stack:', emailSendError.stack);
      emailError = emailSendError.message || 'Failed to send email notification';
      // Don't fail the request if email fails - the support request was already saved
    }

    // ===== STEP 8: Return Success Response =====
    console.log('[Support Submit] ====== SUCCESS ======');
    console.log('[Support Submit] Returning success response with ticket_id:', ticketId);
    console.log('[Support Submit] Email sent:', emailSent, 'Email error:', emailError);
    
    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
      ticket_id: ticketId,
      email_sent: emailSent,
      email_error: emailError || undefined,
      request: {
        id: ticketId,
        email: trimmedEmail,
        subject: trimmedSubject,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    }, { status: 200 });

  } catch (error) {
    // ===== CATCH-ALL FOR UNEXPECTED ERRORS =====
    console.error('[Support Submit] ====== UNEXPECTED ERROR ======');
    console.error('[Support Submit] Error type:', error?.constructor?.name);
    console.error('[Support Submit] Error message:', error?.message);
    console.error('[Support Submit] Error code:', error?.code);
    console.error('[Support Submit] Error name:', error?.name);
    console.error('[Support Submit] Error stack:', error?.stack);
    
    // Log full error object for debugging
    console.error('[Support Submit] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
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
