import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { clearAuthData, storeAuthData, getStoredToken } from '../auth/storage';

// Helper: Check if account is suspended
const isSuspendedError = (error) => {
  const statusCode = error.response?.status;
  const code = error.response?.data?.code;
  return statusCode === 403 || code === 'ACCOUNT_SUSPENDED';
};

// Helper: Get error response data
const getErrorData = (error) => {
  const responseData = error.response?.data || {};
  const isSuspended = isSuspendedError(error);
  return {
    name: isSuspended ? 'AccountSuspended' : 'LoginError',
    message: responseData.details || responseData.message || responseData.error || 'Login failed',
    code: responseData.code || (isSuspended ? 'ACCOUNT_SUSPENDED' : undefined),
    contactSupport: responseData.contactSupport || isSuspended,
  };
};

// Helper: Fetch and update user data from backend
const fetchAndStoreUser = async () => {
  const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
  if (data.user) {
    storeAuthData(null, data.user);
    return data.user;
  }
  return null;
};

export const authProvider = {
  login: async ({ email, password }) => {
    try {
      clearAuthData();
      if (typeof window !== 'undefined') sessionStorage.clear();
      
      console.log('[Auth] Login attempt for email:', email);
      
      const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });

      if (!data.token) {
        return { success: false, error: { name: 'LoginError', message: 'Invalid email or password' } };
      }

      // Verify email matches
      if (data.user?.email !== email) {
        console.error('[Auth] Email mismatch!', { loginEmail: email, returnedEmail: data.user.email });
        clearAuthData();
        return { success: false, error: { name: 'LoginError', message: 'Authentication error: User data mismatch' } };
      }
      
      console.log('[Auth] Login successful:', data.user.email, 'Role:', data.user.role);
      storeAuthData(data.token, data.user);

      return {
        success: true,
        redirectTo: data.user.role === 'admin' ? '/admin/dashboard' : '/wallet/dashboard',
        user: data.user,
      };
    } catch (error) {
      return { success: false, error: getErrorData(error) };
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
      await fetchAndStoreUser();
      return { authenticated: true };
    } catch (error) {
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
      const user = await fetchAndStoreUser();
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
