'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import axios from 'axios';
import Image from 'next/image';

interface DynamicSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  nameAr?: string;
  nameEn?: string;
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<DynamicSettings | null>(null);
  const router = useRouter();

  // جلب إعدادات الآدمن الديناميكية باستخدام مثيل الـ api المتصل بالإنترنت والباك إند
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.warn('Could not load dynamic settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { phone, password });
      const token = response.data.accessToken;
      
      const restaurantNameAr = settings?.nameAr || 'وهمي برجر';
      const restaurantNameEn = settings?.nameEn || 'Wahmy Burger';

      const userFullNameAr = response.data.user?.fullNameAr || response.data.user?.fullName || response.data.user?.name || restaurantNameAr;
      const userFullNameEn = response.data.user?.fullNameEn || response.data.user?.fullName || response.data.user?.name || restaurantNameEn;

      localStorage.setItem('token', token);
      localStorage.setItem('phone', phone);
      localStorage.setItem('userNameAr', userFullNameAr);
      localStorage.setItem('userNameEn', userFullNameEn);

      router.push('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'فشل تسجيل الدخول، تحقق من البيانات');
      } else {
        setError('حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = settings?.primaryColor || '#030712'; // افتراضي غامق
  const secondaryColor = settings?.secondaryColor || '#e11d48'; // افتراضي أحمر/روز

  // الاعتماد على اسم المطعم المعرّف في إعدادات الآدمن (مع دعم الاسم العربي والإنجليزي)
  const displayNameAr = settings?.nameAr || 'وهمي برجر';
  const displayNameEn = settings?.nameEn || 'Wahmy Burger';

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 transition-all duration-300" 
      dir="rtl"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl border border-white/20 p-8 shadow-2xl text-slate-800">
        
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center p-2">
            <Image 
              src={settings?.logoUrl || "/logo.png"} 
              alt="Logo" 
              width={64} 
              height={64} 
              className="object-contain w-full h-full" 
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: secondaryColor }}>
            {displayNameAr} - {displayNameEn}
          </h1>
          <p className="mt-1 text-xs text-slate-500">تسجيل الدخول برقم الهاتف والمتابعة</p>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-center text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف (Phone Number)</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
              placeholder="01012345678"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كلمة المرور (Password)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: secondaryColor }}
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>

          <p className="text-center text-xs text-slate-500 mt-4">
            ليس لديك حساب؟{' '}
            <a href="/signup" className="font-bold hover:underline" style={{ color: secondaryColor }}>
              إنشاء حساب جديد
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}