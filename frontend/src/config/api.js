// Centralized API configuration for local and cloud (Vercel) deployments
const envApiUrl = process.env.REACT_APP_API_URL;

/**
 * When deployed on Vercel together with the backend, API calls can use relative paths (''),
 * which automatically route to /api on the same domain without CORS issues.
 * If REACT_APP_API_URL is explicitly set (e.g. backend on separate domain), it takes priority.
 * In local development, defaults to http://localhost:5000.
 */
export const API_URL =
  typeof envApiUrl === 'string' && envApiUrl.trim() !== ''
    ? envApiUrl.replace(/\/+$/, '') // trim trailing slash
    : process.env.NODE_ENV === 'production'
    ? ''
    : 'http://localhost:5000';

export default API_URL;

