import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL;
const base = rawBase ? `${rawBase.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
  baseURL: base,
  headers: { 'Content-Type': 'application/json' }
});

// Ajouter le token à chaque requête
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les erreurs 401/403
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;