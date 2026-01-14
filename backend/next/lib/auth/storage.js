/**
 * Centralized auth storage management
 * Prevents duplicate code and ensures consistency
 */

const AUTH_KEYS = {
  TOKEN: 'fxwallet_token',
  USER: 'fxwallet_user',
  ROLE: 'user_role',
};

// Internal: get safe references to storages (may throw in some environments)
function getSessionStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage || null;
  } catch {
    return null;
  }
}

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

/**
 * Clear all authentication data.
 * SECURITY: Clears BOTH sessionStorage (source of truth) and legacy localStorage.
 */
export function clearAuthData() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss && !ls) return;

  if (ss) {
    ss.removeItem(AUTH_KEYS.TOKEN);
    ss.removeItem(AUTH_KEYS.USER);
    ss.removeItem(AUTH_KEYS.ROLE);
  }
  if (ls) {
    ls.removeItem(AUTH_KEYS.TOKEN);
    ls.removeItem(AUTH_KEYS.USER);
    ls.removeItem(AUTH_KEYS.ROLE);
  }
}

/**
 * Store authentication data.
 * SECURITY: Writes ONLY to sessionStorage. localStorage is legacy, read-only fallback.
 */
export function storeAuthData(token, user) {
  const ss = getSessionStorage();
  if (!ss) return;

  if (token) ss.setItem(AUTH_KEYS.TOKEN, token);
  if (user) {
    ss.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    ss.setItem(AUTH_KEYS.ROLE, user.role || 'user');
  }
}

/**
 * Get stored token.
 * SECURITY: sessionStorage is source of truth; localStorage is ONE-TIME legacy fallback.
 */
export function getStoredToken() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss && !ls) return null;

  // Primary: sessionStorage
  const sessionToken = ss ? ss.getItem(AUTH_KEYS.TOKEN) : null;
  if (sessionToken) return sessionToken;

  // Legacy fallback: read once from localStorage, migrate, then clear.
  const legacyToken = ls ? ls.getItem(AUTH_KEYS.TOKEN) : null;
  if (!legacyToken) return null;

  if (ss) {
    ss.setItem(AUTH_KEYS.TOKEN, legacyToken);
  }
  if (ls) {
    ls.removeItem(AUTH_KEYS.TOKEN);
  }
  return legacyToken;
}

/**
 * Get stored user data.
 * SECURITY: sessionStorage is source of truth; localStorage is ONE-TIME legacy fallback.
 */
export function getStoredUser() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss && !ls) return null;

  let userStr = ss ? ss.getItem(AUTH_KEYS.USER) : null;
  if (!userStr && ls) {
    // Legacy migrate once
    const legacyUserStr = ls.getItem(AUTH_KEYS.USER);
    if (legacyUserStr) {
      if (ss) {
        ss.setItem(AUTH_KEYS.USER, legacyUserStr);
      }
      ls.removeItem(AUTH_KEYS.USER);
      userStr = legacyUserStr;
    }
  }

  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get stored role.
 * SECURITY: sessionStorage is source of truth; localStorage is ONE-TIME legacy fallback.
 */
export function getStoredRole() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss && !ls) return null;

  let role = ss ? ss.getItem(AUTH_KEYS.ROLE) : null;
  if (!role && ls) {
    const legacyRole = ls.getItem(AUTH_KEYS.ROLE);
    if (legacyRole) {
      if (ss) {
        ss.setItem(AUTH_KEYS.ROLE, legacyRole);
      }
      ls.removeItem(AUTH_KEYS.ROLE);
      role = legacyRole;
    }
  }

  return role;
}


