/**
 * Centralized auth storage management
 * Prevents duplicate code and ensures consistency
 */

const AUTH_KEYS = {
  TOKEN: 'fxwallet_token',
  USER: 'fxwallet_user',
  ROLE: 'user_role',
};

/**
 * Clear all authentication data
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEYS.TOKEN);
  localStorage.removeItem(AUTH_KEYS.USER);
  localStorage.removeItem(AUTH_KEYS.ROLE);
}

/**
 * Store authentication data
 */
export function storeAuthData(token, user) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(AUTH_KEYS.TOKEN, token);
  if (user) {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(AUTH_KEYS.ROLE, user.role || 'user');
  }
}

/**
 * Get stored token
 */
export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.TOKEN);
}

/**
 * Get stored user data
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(AUTH_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get stored role
 */
export function getStoredRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.ROLE);
}

