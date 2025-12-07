import { NextResponse } from 'next/server';

/**
 * Add performance headers to responses
 */
export function addPerformanceHeaders(response, options = {}) {
  const {
    cacheControl = 'private, max-age=0, must-revalidate',
    enableCompression = true,
  } = options;

  const headers = new Headers(response.headers);
  
  // Cache control
  headers.set('Cache-Control', cacheControl);
  
  // Performance headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Enable compression hint
  if (enableCompression) {
    headers.set('Vary', 'Accept-Encoding');
  }
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Optimize response by removing unnecessary data
 */
export function optimizeResponse(data) {
  // Remove null/undefined values
  if (Array.isArray(data)) {
    return data.map(item => optimizeResponse(item));
  }
  
  if (data && typeof data === 'object') {
    const optimized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        optimized[key] = optimizeResponse(value);
      }
    }
    return optimized;
  }
  
  return data;
}

