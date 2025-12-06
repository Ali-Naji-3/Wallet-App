import axios from 'axios';

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
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fxwallet_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

