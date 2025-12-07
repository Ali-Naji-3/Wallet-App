import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 * This allows the client to receive notifications instantly without polling
 * Note: EventSource doesn't support custom headers, so we use query param for token
 */
export async function GET(req) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Helper to send SSE message
      const send = (data) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      // Send initial connection message
      send({ type: 'connected', message: 'Connected to notification stream' });
      
      try {
        // Get token from query params (EventSource doesn't support custom headers)
        const url = new URL(req.url);
        const token = url.searchParams.get('token') || parseBearer(req.headers.get('authorization') || undefined);
        
        if (!token) {
          send({ type: 'error', message: 'No token provided', code: 'UNAUTHORIZED' });
          setTimeout(() => controller.close(), 1000);
          return;
        }
        
        // Authenticate admin
        let adminUser;
        try {
          adminUser = await requireAdmin(token);
        } catch (authError) {
          send({ type: 'error', message: authError.message || 'Unauthorized', code: 'UNAUTHORIZED' });
          setTimeout(() => controller.close(), 1000);
          return;
        }
        
        const pool = getPool();
        
        // Send initial notification count
        const [unreadCount] = await pool.query(
          `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
          [adminUser.id]
        );
        
        send({ 
          type: 'initial', 
          unreadCount: unreadCount[0]?.count || 0 
        });
        
        // Poll database for new notifications every 2 seconds for instant updates
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
              [adminUser.id, lastCheck]
            );
            
            // Only send heartbeat if no new notifications (reduce bandwidth)
            if (newNotifications.length > 0) {
              // Get updated unread count only when there are new notifications
              const [unreadCount] = await pool.query(
                `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
                [adminUser.id]
              );
              
              send({
                type: 'new_notifications',
                notifications: newNotifications,
                unreadCount: unreadCount[0]?.count || 0,
              });
              
              // Update last check time
              lastCheck = Date.now();
            } else {
              // Send heartbeat only every 10 seconds to reduce overhead
              if (Date.now() - lastCheck > 10000) {
                send({ type: 'heartbeat', timestamp: Date.now() });
              }
            }
            
          } catch (error) {
            console.error('[SSE] Error checking notifications:', error);
            send({ type: 'error', message: 'Error checking notifications' });
          }
        }, 2000); // Check every 2 seconds for instant notifications
        
        // Cleanup on client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(checkInterval);
          controller.close();
        });
        
      } catch (error) {
        console.error('[SSE] Authentication error:', error);
        send({ 
          type: 'error', 
          message: error.message || 'Authentication failed',
          code: error.message.includes('Unauthorized') ? 'UNAUTHORIZED' : 'ERROR'
        });
        
        // Close connection after error
        setTimeout(() => {
          controller.close();
        }, 1000);
      }
    },
  });
  
  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

