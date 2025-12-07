/**
 * Simple in-memory cache for API responses
 * For production, consider using Redis
 */

const cache = new Map();
const DEFAULT_TTL = 60 * 1000; // 1 minute

export function getCacheKey(key, params = {}) {
  const paramStr = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return paramStr ? `${key}?${paramStr}` : key;
}

export function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

export function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

export function invalidate(pattern) {
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.delete(pattern);
  }
}

export function clear() {
  cache.clear();
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
      if (now > item.expiresAt) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

