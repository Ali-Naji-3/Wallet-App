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
  timeout: 30000, // 30 second timeout for all requests
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fxwallet_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        
        // Only log warning if not on login page (expected 401s on login page)
        if (!isOnLoginPage) {
          console.warn('[API Client] 401 Unauthorized - clearing token and redirecting to login');
        }
        
        clearAuthData();
        
        // Only redirect if not already on login page
        if (!isOnLoginPage) {
          window.location.href = '/login';
        }
      }
    } else if (isSuspended) {
      // Account suspended - clear auth data but DON'T redirect automatically
      // Let the calling code handle the error display
      if (typeof window !== 'undefined') {
        console.warn('[API Client] 403 Account Suspended - clearing auth data');
        clearAuthData();
        
        // Store suspension message for login page
        sessionStorage.setItem('suspended_message', responseData?.details || 'Your account has been suspended.');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

