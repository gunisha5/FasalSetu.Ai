import axios from 'axios';

// Create a custom axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fasalsetu_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional: handle 401s, etc)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthFlowRequest = requestUrl.includes('/auth/send-otp')
      || requestUrl.includes('/auth/verify-email')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isAuthFlowRequest) {
      // Handle unauthenticated state (e.g. clear token, redirect to login)
      localStorage.removeItem('fasalsetu_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
