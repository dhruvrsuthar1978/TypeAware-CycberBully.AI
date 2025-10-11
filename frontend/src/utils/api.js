import axios from 'axios';
import { ErrorCodes } from './errorCodes';

// Create axios instance with default config
export const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:5000/api' || 'https://type-aware-cycber-bully-ai.vercel.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      // Handle specific error cases
      switch (status) {
        case 401:
          // Unauthorized - clear auth state and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have required permissions
          error.code = 'AUTH_FORBIDDEN';
          break;

        case 404:
          // Not Found
          error.code = 'RESOURCE_NOT_FOUND';
          break;

        case 422:
          // Validation Error
          error.code = 'VALIDATION_ERROR';
          break;

        case 429:
          // Rate Limit Exceeded
          error.code = 'RATE_LIMIT_EXCEEDED';
          break;

        case 500:
          // Server Error
          error.code = 'API_ERROR';
          break;

        default:
          error.code = 'UNKNOWN_ERROR';
      }

      // Add error details from server response
      error.message = data?.message || error.message;
      error.details = data?.details;
    } else if (error.request) {
      // Request made but no response received
      error.code = 'API_TIMEOUT';
      error.message = 'No response received from server';
    } else {
      // Error in request configuration
      error.code = 'API_ERROR';
      error.message = 'Error setting up request';
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error) => {
  const errorCode = error.code || 'API_ERROR';
  const errorDetails = ErrorCodes[errorCode];

  return {
    code: errorDetails?.code || 500,
    message: errorDetails?.message || 'An unexpected error occurred',
    details: error.details || null,
    originalError: error
  };
};
