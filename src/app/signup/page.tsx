'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import axios from 'axios';
import { Phone, Lock, User, ArrowLeft, Sparkles, Globe } from 'lucide-react';

interface DynamicSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  nameAr?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DynamicSettings | null>(null);

  // جلب إعدادات الآدمن (اللوجو، الألوان، واسم المنصة) عند تحميل الصفحة
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost:3000/settings');
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.warn('Could not load dynamic settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', {
        fullName: nameAr,
        fullNameAr: nameAr,
        fullNameEn: nameEn,
        phone,
        password,
      });

      // تخزين الاسمين ورقم الهاتف في الـ localStorage
      localStorage.setItem('phone', phone);
      localStorage.setItem('userNameAr', nameAr);
      localStorage.setItem('userNameEn', nameEn);

      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMessage || 'حدث خطأ أثناء إنشاء الحساب، تأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = settings?.primaryColor || '#f0f9ff';
  const secondaryColor = settings?.secondaryColor || '#1d4ed8';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 font-['Changa',sans-serif] transition-all duration-300" 
      dir="rtl"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/90 rounded-3xl p-8 shadow-2xl">

        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-3 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center p-2">
            <Image 
              src={settings?.logoUrl || "/logo.png"} 
              alt="Logo" 
              width={64} 
              height={64} 
              className="object-contain w-full h-full" 
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <span>إنشاء حساب جديد</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">انضم إلينا وابدأ في جمع النقاط والحصول على المكافآت</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم بالعربية</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم بالإنجليزية (English Name)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Username"
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف (Phone Number)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كلمة المرور (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-3"
            style={{ backgroundColor: secondaryColor }}
          >
            {loading ? (
              <span>جاري إنشاء الحساب...</span>
            ) : (
              <>
                <span>تسجيل حساب جديد</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-500">
            لديك حساب بالفعل؟{' '}
            <a href="/login" className="font-bold hover:underline" style={{ color: secondaryColor }}>
              تسجيل الدخول
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}