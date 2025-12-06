import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export const authProvider = {
  login: async ({ email, password }) => {
    try {
      const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      if (data.token) {
        localStorage.setItem('fxwallet_token', data.token);
        
        // Store user info including role
        if (data.user) {
          localStorage.setItem('fxwallet_user', JSON.stringify(data.user));
          localStorage.setItem('user_role', data.user.role || 'user');
        }
        
        // Determine redirect based on role
        const redirectTo = data.user?.role === 'admin' 
          ? '/admin/dashboard' 
          : '/wallet/dashboard';
        
        return {
          success: true,
          redirectTo,
          user: data.user, // Pass user data for login page to use
        };
      }

      return {
        success: false,
        error: {
          name: 'LoginError',
          message: 'Invalid email or password',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'LoginError',
          message: error.response?.data?.message || error.response?.data?.error || 'Login failed',
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem('fxwallet_token');
    localStorage.removeItem('fxwallet_user');
    localStorage.removeItem('user_role');
    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    const token = localStorage.getItem('fxwallet_token');
    
    if (!token) {
      return {
        authenticated: false,
        redirectTo: '/login',
      };
    }

    try {
      // Verify token with backend
      const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
      
      // Update stored user info
      if (data.user) {
        localStorage.setItem('fxwallet_user', JSON.stringify(data.user));
        localStorage.setItem('user_role', data.user.role || 'user');
      }
      
      return {
        authenticated: true,
      };
    } catch (error) {
      localStorage.removeItem('fxwallet_token');
      localStorage.removeItem('fxwallet_user');
      localStorage.removeItem('user_role');
      return {
        authenticated: false,
        redirectTo: '/login',
      };
    }
  },

  getPermissions: async () => {
    // First try localStorage for faster response
    const storedRole = localStorage.getItem('user_role');
    if (storedRole) {
      return storedRole;
    }
    
    try {
      const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
      const role = data.user?.role || 'user';
      localStorage.setItem('user_role', role);
      return role;
    } catch (error) {
      return null;
    }
  },

  getIdentity: async () => {
    // First try localStorage for faster response
    const storedUser = localStorage.getItem('fxwallet_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return {
          id: user.id,
          name: user.fullName || user.full_name || user.email,
          email: user.email,
          avatar: null,
          role: user.role,
        };
      } catch (e) {
        // If parsing fails, fetch from API
      }
    }
    
    try {
      const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
      
      // Store for future use
      if (data.user) {
        localStorage.setItem('fxwallet_user', JSON.stringify(data.user));
      }
      
      return {
        id: data.user?.id,
        name: data.user?.fullName || data.user?.full_name || data.user?.email,
        email: data.user?.email,
        avatar: null,
        role: data.user?.role,
      };
    } catch (error) {
      return null;
    }
  },

  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      return {
        logout: true,
        redirectTo: '/login',
        error,
      };
    }

    return { error };
  },
};
