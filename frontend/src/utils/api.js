import axios from "axios";
import { ErrorCodes } from "./errorCodes";
import { API_BASE_URL, getAuthToken } from "./config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          error.code = "BAD_REQUEST";
          break;
        case 401:
          localStorage.removeItem("typeaware_token");
          localStorage.removeItem("token");
          window.location.href = "/login";
          error.code = "AUTH_UNAUTHORIZED";
          break;
        case 403:
          error.code = "AUTH_FORBIDDEN";
          break;
        case 404:
          error.code = "RESOURCE_NOT_FOUND";
          break;
        case 422:
          error.code = "VALIDATION_ERROR";
          break;
        case 429:
          error.code = "RATE_LIMIT_EXCEEDED";
          break;
        case 500:
          error.code = "SERVER_ERROR";
          break;
        default:
          error.code = "UNKNOWN_ERROR";
      }

      error.message = data?.detail || data?.message || error.message;
      error.details = data?.details || null;
    } else if (error.request) {
      error.code = "NETWORK_ERROR";
      error.message = "No response received from server. Please check your connection.";
    } else {
      error.code = "REQUEST_SETUP_ERROR";
      error.message = "There was an error setting up the API request.";
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error) => {
  const errorCode = error.code || "SERVER_ERROR";
  const errorDetails = ErrorCodes[errorCode] || {};

  return {
    code: errorDetails.code || 500,
    message: errorDetails.message || error.message || "Unexpected error occurred.",
    details: error.details || null,
    originalError: error,
  };
};
