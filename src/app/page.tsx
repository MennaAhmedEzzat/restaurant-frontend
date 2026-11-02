'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // نفحص هل يوجد أي مفتاح دلالي يدل على تسجيل الدخول (مثل token أو user)
    // يمكنك لاحقاً تعديل كلمة 'token' أو 'user' حسب ما يخزنه كود صفحة الـ login لديكِ
    const token = localStorage.getItem('token') || localStorage.getItem('user');

    if (token) {
      // إذا كان المستخدم مسجلاً دخوله مسبقاً، نوجهه فوراً للداشبوورد
      router.push('/dashboard');
    } else {
      // إذا لم يكن مسجلاً، نوجهه لصفحة تسجيل الدخول
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-sans">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">جاري التحقق من الحساب...</h1>
        <p className="text-sm text-gray-400">برجاء الانتظار ليتم توجيهك للصفحة المناسبة.</p>
      </div>
    </div>
  );
}