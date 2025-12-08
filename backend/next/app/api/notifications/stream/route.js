import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * Server-Sent Events (SSE) endpoint for real-time USER notifications
 * For regular users to get instant KYC, transaction notifications
 */
export async function GET(req) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const send = (data) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      send({ type: 'connected', message: 'Connected to notification stream' });
      
      try {
        // Get token from query params
        const url = new URL(req.url);
        const token = url.searchParams.get('token') || parseBearer(req.headers.get('authorization') || undefined);
        
        if (!token) {
          send({ type: 'error', message: 'No token provided', code: 'UNAUTHORIZED' });
          setTimeout(() => controller.close(), 1000);
          return;
        }
        
        // Verify token
        let user;
        try {
          user = verifyToken(token);
        } catch (authError) {
          send({ type: 'error', message: 'Invalid token', code: 'UNAUTHORIZED' });
          setTimeout(() => controller.close(), 1000);
          return;
        }
        
        const pool = getPool();
        
        // Send initial notifications immediately on connection
        const [initialNotifications] = await pool.query(
          `SELECT id, type, title, body, is_read, created_at
           FROM notifications
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 20`,
          [user.id]
        );
        
        const [unreadCount] = await pool.query(
          `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
          [user.id]
        );
        
        send({ 
          type: 'initial',
          notifications: initialNotifications,
          unreadCount: unreadCount[0]?.count || 0 
        });
        
        // Check for new notifications every 1 second (faster than admin - 2s)
        let lastCheck = Date.now();
        const checkInterval = setInterval(async () => {
          try {
            // Get new notifications since last check
            const [newNotifications] = await pool.query(
              `SELECT id, type, title, body, is_read, created_at
               FROM notifications
               WHERE user_id = ? AND created_at > FROM_UNIXTIME(? / 1000)
               ORDER BY created_at DESC
               LIMIT 10`,
              [user.id, lastCheck]
            );
            
            if (newNotifications.length > 0) {
              // Get updated unread count
              const [unreadCountResult] = await pool.query(
                `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
                [user.id]
              );
              
              send({
                type: 'new_notifications',
                notifications: newNotifications,
                unreadCount: unreadCountResult[0]?.count || 0,
              });
              
              lastCheck = Date.now();
            }
          } catch (error) {
            console.error('[SSE User] Error checking notifications:', error);
          }
        }, 1000); // Check every 1 second for instant updates
        
        // Cleanup on disconnect
            req.signal.addEventListener('abort', () => {
              closed = true;
              clearInterval(checkInterval);
              try {
                controller.close();
              } catch (err) {
                // Already closed
              }
            });
        
      } catch (error) {
        console.error('[SSE User] Error:', error);
        send({ 
          type: 'error', 
          message: error.message || 'Server error',
          code: 'ERROR'
        });
        setTimeout(() => controller.close(), 1000);
      }
    },
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

