import axios from 'axios';
import { useUIStore } from '../store/uiStore';
import i18n from '../i18n';

// Create a custom axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and Language
api.interceptors.request.use(
  (config) => {
    // Start global loader
    useUIStore.getState().startLoading();
    
    // Language Header
    if (config.headers) {
      config.headers['Accept-Language'] = i18n.language || 'en';
    }

    const token = localStorage.getItem('fasalsetu_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    useUIStore.getState().stopLoading();
    return Promise.reject(error);
  }
);

// Response interceptor (optional: handle 401s, etc)
api.interceptors.response.use(
  (response) => {
    // Stop global loader
    useUIStore.getState().stopLoading();
    return response;
  },
  (error) => {
    // Stop global loader even on error
    useUIStore.getState().stopLoading();
    
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
