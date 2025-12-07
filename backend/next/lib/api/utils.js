import { NextResponse } from 'next/server';
import { parseBearer, verifyToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { getPool } from '@/lib/db';

/**
 * Extract ID from route parameters or URL path
 * Handles both Promise and non-Promise params (Next.js 15+ compatibility)
 */
export async function extractIdFromParams(req, params, resourceName = 'users') {
  // Handle params - might be a Promise in Next.js 15+
  let resolvedParams = params;
  if (params && typeof params.then === 'function') {
    resolvedParams = await params;
  }
  
  // Try to get ID from params first
  if (resolvedParams?.id) {
    const userId = parseInt(String(resolvedParams.id), 10);
    if (!isNaN(userId) && userId > 0) {
      return userId;
    }
  }
  
  // Fallback: extract from URL pathname
  // URL format: /api/admin/users/4/freeze or /api/admin/users/4
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const resourceIndex = segments.indexOf(resourceName);
  
  if (resourceIndex !== -1 && segments[resourceIndex + 1]) {
    const userId = parseInt(segments[resourceIndex + 1], 10);
    if (!isNaN(userId) && userId > 0) {
      return userId;
    }
  }
  
  // Last resort: find any numeric segment
  for (let i = segments.length - 1; i >= 0; i--) {
    const parsed = parseInt(segments[i], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Authenticate and get admin user
 */
export async function authenticateAdmin(req) {
  const token = parseBearer(req.headers.get('authorization') || undefined);
  
  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }
  
  try {
    const adminUser = await requireAdmin(token);
    return { token, adminUser };
  } catch (authError) {
    throw new Error(authError.message || 'Unauthorized');
  }
}

/**
 * Authenticate and get user (any role)
 */
export async function authenticateUser(req) {
  const token = parseBearer(req.headers.get('authorization') || undefined);
  
  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }
  
  try {
    const user = verifyToken(token);
    if (!user || !user.id) {
      throw new Error('Invalid token');
    }
    return { token, user };
  } catch (tokenError) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if user account is frozen and throw error if so
 */
export async function checkAccountActive(userId) {
  const pool = getPool();
  const [userCheck] = await pool.query(
    `SELECT id, email, is_active, suspension_reason FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  
  if (!userCheck || userCheck.length === 0) {
    throw new Error('User not found');
  }
  
  const user = userCheck[0];
  
  if (!user.is_active) {
    const suspensionReason = user.suspension_reason || null;
    const error = new Error('Account Suspended');
    error.code = 'ACCOUNT_SUSPENDED';
    error.details = suspensionReason 
      ? `Your account has been suspended. Reason: ${suspensionReason}`
      : 'Your account has been suspended. Please contact support for assistance.';
    error.contactSupport = true;
    throw error;
  }
  
  return user;
}

/**
 * Create error response helper
 */
export function createErrorResponse(message, status = 400, additionalData = {}) {
  return NextResponse.json(
    { message, ...additionalData },
    { status }
  );
}

/**
 * Create success response helper
 */
export function createSuccessResponse(data, message = null, status = 200) {
  return NextResponse.json(
    message ? { message, ...data } : data,
    { status }
  );
}

