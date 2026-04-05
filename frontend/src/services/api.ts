import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Injeta token em toda requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login se token expirar
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  signup: (data: object) => api.post('/api/auth/signup', data),
  login: (data: object) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const chatApi = {
  send: (data: object) => api.post('/api/chat', data),
  getHistory: (sessionId: string) => api.get(`/api/chat/history/${sessionId}`),
  getSessions: () => api.get('/api/chat/sessions'),
  deleteSession: (sessionId: string) => api.delete(`/api/chat/sessions/${sessionId}`),
};

export default api;
