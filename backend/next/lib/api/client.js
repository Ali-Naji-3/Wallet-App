import axios from 'axios';
import { clearAuthData } from '../auth/storage';

// Use relative URLs for Next.js API routes, or fallback to env variable
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // In browser: use current origin (same as Next.js app)
    return window.location.origin;
  }
  // Server-side: use env variable or default to localhost:4000
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout (increased for large datasets)
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fxwallet_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // SECURITY: Log token info to help debug user switching issues
      console.log('[API Client] Request with token:', {
        url: config.url,
        method: config.method,
        tokenPreview: token.slice(0, 20) + '...',
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore aborted/cancelled requests (component unmounted or request cancelled)
    if (
      error.code === 'ECONNABORTED' || 
      error.code === 'ERR_CANCELED' ||
      error.name === 'AbortError' || 
      error.name === 'CanceledError' ||
      error.message === 'Request aborted' ||
      error.message === 'canceled'
    ) {
      return Promise.reject(error); // Return error but don't log it
    }
    
    const status = error.response?.status;
    const responseData = error.response?.data;
    const isSuspended = responseData?.code === 'ACCOUNT_SUSPENDED' || status === 403;
    
    if (status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        const isOnLoginPage = window.location.pathname.includes('/login');
        const isOnSupportPage = window.location.pathname.includes('/wallet/support');
        const isLoginEndpoint = error.config?.url?.includes('/api/auth/login');
        const isSupportEndpoint = error.config?.url?.includes('/api/support/');
        
        // CRITICAL: Don't redirect from support page or support endpoints
        // Support page must be accessible to everyone, including unauthenticated users
        if (isOnSupportPage || isSupportEndpoint) {
          console.log('[API Client] 401 on support page/endpoint - not redirecting (public access)');
          // Just reject the promise - don't interfere with support page
          return Promise.reject(error);
        }
        
        // CRITICAL: Don't redirect or clear data on login page or login endpoint
        // The login page needs to handle the error itself
        if (!isOnLoginPage && !isLoginEndpoint) {
        console.warn('[API Client] 401 Unauthorized - clearing token and redirecting to login');
        clearAuthData();
          window.location.href = '/login';
        } else {
          // On login page or login endpoint - don't interfere
          // Just let the error pass through so login page can handle it
          console.log('[API Client] 401 on login - letting login page handle error');
        }
      }
    } else if (isSuspended) {
      // IMPORTANT: Handle 403 errors carefully
      const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
      const isOnSupportPage = typeof window !== 'undefined' && window.location.pathname.includes('/wallet/support');
      const isLoginEndpoint = error.config?.url?.includes('/api/auth/login');
      const isSupportEndpoint = error.config?.url?.includes('/api/support/');
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/me') || 
                            error.config?.url?.includes('/api/admin/notifications/stream');
      
      // CRITICAL: Don't redirect from support page or support endpoints
      // Support page must be accessible even for frozen/suspended users
      if (isOnSupportPage || isSupportEndpoint) {
        console.log('[API Client] 403 on support page/endpoint - not redirecting (public access)');
        // Just reject the promise - don't interfere with support page
        return Promise.reject(error);
      }
      
      // CRITICAL: If this is a login attempt (403 from /api/auth/login), 
      // DON'T clear auth data or redirect - let the login page handle it
      if (isLoginEndpoint || isOnLoginPage) {
        console.log('[API Client] 403 on login endpoint - letting login page handle error');
        // Just reject the promise - don't interfere
        // The login page's onError handler will show the notification
      } else if (isAuthEndpoint && typeof window !== 'undefined') {
        // This is an authenticated user whose account was suspended
        console.warn('[API Client] 403 Account Suspended - clearing auth data');
        clearAuthData();
        
        // Store suspension message for login page
        sessionStorage.setItem('suspended_message', responseData?.details || 'Your account has been suspended.');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        // 403 from other endpoints (like admin actions) - don't log out, just reject
        console.warn('[API Client] 403 Forbidden on action - not logging out');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

