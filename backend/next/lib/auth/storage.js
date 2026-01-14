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
 * Internal helper to safely access Web Storage in the browser.
 * This ensures we never throw during SSR and keeps all storage
 * logic in one place for easier auditing.
 */
function getSessionStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * One-time migration helper.
 * If data exists in localStorage but not in sessionStorage,
 * move it into sessionStorage and remove it from localStorage.
 *
 * This guarantees per-tab isolation going forward while
 * preserving existing sessions once at first read.
 */
function migrateKeyOnce(key) {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss || !ls) return;

  const hasSession = ss.getItem(key);
  const legacyValue = ls.getItem(key);

  if (!hasSession && legacyValue) {
    ss.setItem(key, legacyValue);
  }

  // Always clear legacy storage to prevent future confusion
  ls.removeItem(key);
}

/**
 * Clear all authentication data
 */
export function clearAuthData() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
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
 * Store authentication data
 * Writes go to sessionStorage only to ensure per-tab isolation.
 */
export function storeAuthData(token, user) {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss) return;

  if (token) {
    ss.setItem(AUTH_KEYS.TOKEN, token);
  }
  if (user) {
    ss.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    ss.setItem(AUTH_KEYS.ROLE, user.role || 'user');
  }

  // Ensure legacy copies are removed so future reads never
  // accidentally resurrect old cross-tab state.
  if (ls) {
    ls.removeItem(AUTH_KEYS.TOKEN);
    ls.removeItem(AUTH_KEYS.USER);
    ls.removeItem(AUTH_KEYS.ROLE);
  }
}

/**
 * Get stored token
 */
export function getStoredToken() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss) return null;

  // First, prefer the per-tab session token
  const sessionToken = ss.getItem(AUTH_KEYS.TOKEN);
  if (sessionToken) return sessionToken;

  // One-time migration from localStorage if present
  if (ls) {
    migrateKeyOnce(AUTH_KEYS.TOKEN);
    return ss.getItem(AUTH_KEYS.TOKEN);
  }

  return null;
}

/**
 * Get stored user data
 */
export function getStoredUser() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss) return null;

  let userStr = ss.getItem(AUTH_KEYS.USER);

  if (!userStr && ls) {
    migrateKeyOnce(AUTH_KEYS.USER);
    userStr = ss.getItem(AUTH_KEYS.USER);
  }

  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get stored role
 */
export function getStoredRole() {
  const ss = getSessionStorage();
  const ls = getLocalStorage();
  if (!ss) return null;

  let role = ss.getItem(AUTH_KEYS.ROLE);

  if (!role && ls) {
    migrateKeyOnce(AUTH_KEYS.ROLE);
    role = ss.getItem(AUTH_KEYS.ROLE);
  }

  return role;
}

