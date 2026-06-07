import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and let React Router handle the redirect in App.tsx
      useAuthStore.getState().logout();
      toast.error('Session expired. Please log in again.');
      
      // We could use window.location.href = '/login' here as a last resort,
      // but ProtectedRoute in App.tsx should catch it since we cleared the state.
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Backend might be unavailable.');
    } else {
      toast.error(error.response?.data?.message || 'An unexpected API error occurred.');
    }
    return Promise.reject(error);
  }
);

export default api;
