import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://restaurant-backend-psi-sand.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// تمرير الـ JWT Token تلقائياً في كل طلب إذا كان المستخدم مسجلاً لدخوله
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});