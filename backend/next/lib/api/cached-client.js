/**
 * Cached API client with request deduplication
 * Prevents multiple identical requests from firing simultaneously
 */

import apiClient from './client';
import { get, set, getCacheKey } from '../cache';

const pendingRequests = new Map();

export async function cachedGet(url, options = {}) {
  const { 
    cache = true, 
    ttl = 60000, // 1 minute default
    params = {},
    ...axiosOptions 
  } = options;

  const cacheKey = getCacheKey(url, params);
  
  // Check cache first
  if (cache) {
    const cached = get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    // Wait for existing request to complete
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const requestPromise = apiClient.get(url, { params, ...axiosOptions })
    .then(response => {
      // Cache successful responses
      if (cache && response.data) {
        set(cacheKey, response.data, ttl);
      }
      pendingRequests.delete(cacheKey);
      return { data: response.data, fromCache: false };
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

export default cachedGet;

