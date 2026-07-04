import axios from 'axios';

const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Aseguramos de que la URL base termine en /api por si en Vercel se configuró sin el /api
const finalBaseURL = configuredUrl.endsWith('/api') 
  ? configuredUrl 
  : `${configuredUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: finalBaseURL, // URL base de nuestro backend Express
});

// Interceptor de peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;