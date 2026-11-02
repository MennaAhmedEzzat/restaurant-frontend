import axios from 'axios';

// إنشاء API Client متصل بـ NestJS Backend
export const api = axios.create({
  baseURL: 'http://localhost:3000',
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