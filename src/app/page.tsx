'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // هنا نفحص هل المستخدم مسجل دخول (مثلاً بالبحث عن الـ token في الـ localStorage)
    const token = localStorage.getItem('token'); // أو أي مفتاح تستخدمينه لحفظ حالة الدخول

    if (token) {
      // إذا كان مسجلاً، نوجهه لوحة التحكم
      router.push('/dashboard');
    } else {
      // إذا لم يكن مسجلاً، نوجهه لصفحة تسجيل الدخول
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <p>جاري التحميل والتوجيه...</p>
    </div>
  );
}