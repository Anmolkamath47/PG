import axios from 'axios';

// Get base URL from environment or default to '/api'
let rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

let baseURL = '/api';
if (rawBase && rawBase.trim() !== '') {
  baseURL = rawBase.trim().replace(/\/+$/, '');
  if (!baseURL.endsWith('/api')) {
    baseURL = `${baseURL}/api`;
  }
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and normalize relative URLs
api.interceptors.request.use(
  (config) => {
    // When baseURL is relative '/api' and url is '/auth/login', Axios in browsers
    // can resolve '/auth/login' against origin http://localhost:5173, dropping '/api'.
    // Normalize to guarantee '/api' prefix is preserved:
    if (config.baseURL === '/api' && config.url && !config.url.startsWith('/api')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
      config.baseURL = '';
    }

    const token = localStorage.getItem('pgmate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired or invalid, clear and redirect to login if not already on login page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('pgmate_token');
        localStorage.removeItem('pgmate_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
