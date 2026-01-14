import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { clearAuthData, storeAuthData, getStoredToken, getStoredUser } from '../auth/storage';

// Helper: Check if account is suspended
const isSuspendedError = (error) => {
  const statusCode = error.response?.status;
  const code = error.response?.data?.code;
  return statusCode === 403 || code === 'ACCOUNT_SUSPENDED';
};

// Helper: Get error response data
const getErrorData = (error) => {
  const responseData = error.response?.data || {};
  const errorCode = responseData.code;
  const statusCode = error.response?.status;
  
  // Debug logging
  console.log('[Auth Provider] Error data:', {
    errorCode,
    statusCode,
    responseData,
    message: responseData.message,
    details: responseData.details,
  });
  
  // Map error codes to appropriate error names
  let errorName = 'LoginError';
  if (errorCode === 'ACCOUNT_SUSPENDED' || errorCode === 'ACCOUNT_FROZEN') {
    errorName = 'AccountFrozen';
  } else if (errorCode === 'ACCOUNT_REJECTED') {
    errorName = 'AccountRejected';
  } else if (errorCode === 'ACCOUNT_DELETED') {
    errorName = 'AccountDeleted';
  } else if (errorCode === 'INVALID_EMAIL') {
    errorName = 'InvalidEmail';
  } else if (errorCode === 'INVALID_PASSWORD') {
    errorName = 'InvalidPassword';
  } else if (statusCode === 403) {
    // Default to frozen if 403 and no specific code
    errorName = 'AccountFrozen';
  }
  
  const errorData = {
    name: errorName,
    message: responseData.details || responseData.message || responseData.error || 'Login failed',
    code: errorCode || (statusCode === 403 ? 'ACCOUNT_SUSPENDED' : undefined),
    contactSupport: responseData.contactSupport || statusCode === 403,
    kycRejected: responseData.kycRejected || false,
  };
  
  console.log('[Auth Provider] Returning error data:', errorData);
  return errorData;
};

// Helper: Fetch and update user data from backend
const fetchAndStoreUser = async () => {
  const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
  if (data.user) {
    // CRITICAL: Log to detect user switching bug
    const storedUser = getStoredUser();
    if (storedUser && storedUser.id !== data.user.id) {
      console.error('[Auth] USER SWITCH DETECTED!', {
        storedUserId: storedUser.id,
        storedUserEmail: storedUser.email,
        fetchedUserId: data.user.id,
        fetchedUserEmail: data.user.email,
      });
      // SECURITY: Hard fail on identity mismatch.
      // Clear all auth data to force re-login and DO NOT re-store user/token.
      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }
    
    console.log('[Auth] Fetched user from /api/auth/me:', data.user.email, 'Role:', data.user.role);
    storeAuthData(null, data.user);
    return data.user;
  }
  return null;
};

export const authProvider = {
  login: async ({ email, password }) => {
    try {
      // Clear old data BEFORE making request
      clearAuthData();
      if (typeof window !== 'undefined') sessionStorage.clear();
      
      console.log('[Auth] Login attempt for email:', email);
      
      const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });

      if (!data.token) {
        const error = { name: 'LoginError', message: 'Invalid email or password' };
        console.log('[Auth] Login failed - no token:', error);
        clearAuthData();
        throw error;
      }

      // Verify email matches (case-insensitive)
      if (data.user?.email?.toLowerCase() !== email.toLowerCase()) {
        console.error('[Auth] Email mismatch!', { loginEmail: email, returnedEmail: data.user.email });
        clearAuthData();
        const error = { name: 'LoginError', message: 'Authentication error: User data mismatch' };
        throw error;
      }
      
      console.log('[Auth] Login successful:', data.user.email, 'Role:', data.user.role);
      
      // Store auth data SYNCHRONOUSLY before returning success
      storeAuthData(data.token, data.user);
      
      // Small delay to ensure localStorage is written before navigation
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        success: true,
        redirectTo: data.user.role === 'admin' ? '/admin/dashboard' : '/wallet/dashboard',
        user: data.user,
      };
    } catch (error) {
      console.log('[Auth] Login error caught:', error);
      clearAuthData();
      
      // Get properly formatted error data
      const errorData = getErrorData(error);
      
      // CRITICAL: Throw the error so Refine's useLogin can catch it in onError
      // This ensures the error propagates correctly to the login page's onError handler
      const errorToThrow = {
        name: errorData.name,
        message: errorData.message,
        code: errorData.code,
        details: errorData.message,
        response: error.response, // Preserve original response for detailed error handling
        ...errorData, // Include all error data
      };
      
      console.log('[Auth] Throwing error for useLogin:', errorToThrow);
      throw errorToThrow;
    }
  },

  logout: async () => {
    clearAuthData();
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = getStoredToken();
    if (!token) return { authenticated: false, redirectTo: '/login' };

    try {
      // Quick timeout to prevent blocking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const user = await fetchAndStoreUser();
        // If mismatch was detected, fetchAndStoreUser returns null after hard-failing.
        if (!user) {
          return { authenticated: false, redirectTo: '/login' };
        }
      } finally {
        clearTimeout(timeoutId);
      }

      return { authenticated: true };
    } catch (error) {
      // Don't clear auth on timeout/abort - might just be slow network
      if (error.code === 'ECONNABORTED' || error.name === 'AbortError' || error.message?.includes('timeout')) {
        // Still authenticated if we have a token, just couldn't verify
        return { authenticated: true };
      }
      
      clearAuthData();
      const isSuspended = isSuspendedError(error);
      
      if (isSuspended && typeof window !== 'undefined') {
        const details = error.response?.data?.details || 'Your account has been suspended.';
        sessionStorage.setItem('suspended_message', details);
      }
      
      return {
        authenticated: false,
        redirectTo: '/login',
        error: isSuspended ? { message: error.response?.data?.details || 'Account suspended', name: 'AccountSuspended' } : undefined,
      };
    }
  },

  getPermissions: async () => {
    const token = getStoredToken();
    if (!token) return null;
    
    try {
      const user = await fetchAndStoreUser();
      return user?.role || 'user';
    } catch (error) {
      // Don't log 401 errors (token expired - expected)
      if (error.response?.status !== 401) {
        console.error('[Auth] Error getting permissions:', error);
      }
      return null;
    }
  },

  getIdentity: async () => {
    const token = getStoredToken();
    if (!token) return null;
    
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Identity fetch timeout')), 8000)
      );
      
      const user = await Promise.race([fetchAndStoreUser(), timeoutPromise]);
      
      if (!user?.email) {
        console.error('[Auth] Invalid user data');
        clearAuthData();
        return null;
      }
      
      console.log('[Auth] getIdentity:', user.email);
      return {
        id: user.id,
        name: user.fullName || user.full_name || user.email,
        email: user.email,
        avatar: null,
        role: user.role,
      };
    } catch (error) {
      // Ignore timeout/aborted errors silently (component may have unmounted)
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
        return null; // Return null instead of clearing auth to avoid disrupting navigation
      }
      // Don't log 401 errors (token expired - expected)
      if (error.response?.status !== 401) {
        console.error('[Auth] Error getting identity:', error);
      }
      clearAuthData();
      return null;
    }
  },

  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      return { logout: true, redirectTo: '/login', error };
    }
    return { error };
  },
};
