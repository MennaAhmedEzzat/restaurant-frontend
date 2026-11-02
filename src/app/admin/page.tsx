'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Palette,
  Gift,
  Gamepad2,
  BarChart3,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  ImageIcon,
  Tag,
  Settings as SettingsIcon,
  Globe,
  Loader2,
  Users,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface Offer {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  pointsRequired: number;
  code: string;
  imageUrl?: string;
  isActive: boolean;
}

interface GameSetting {
  id: string;
  nameAr: string;
  nameEn: string;
  easyPoints?: number;
  mediumPoints?: number;
  hardPoints?: number;
  pointsPerWin?: number;
  isEnabled: boolean;
}

interface RestaurantConfig {
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessageAr: string;
  welcomeMessageEn: string;
}

interface UserProfile {
  id: string | number;
  email: string;
  name?: string;
  points: number;
}

interface AnalyticsData {
  totalUsers: number;
  totalPointsGranted: number;
  totalCouponsRedeemed: number;
}

const DEFAULT_GAMES: GameSetting[] = [
  { id: 'sudoku', nameAr: 'لعبة السودوكو', nameEn: 'Sudoku Game', easyPoints: 5, mediumPoints: 10, hardPoints: 20, isEnabled: true },
  { id: 'shikaku', nameAr: 'لعبة شيكاكو', nameEn: 'Shikaku Game', easyPoints: 10, mediumPoints: 15, hardPoints: 25, isEnabled: true },
  { id: 'memory', nameAr: 'لعبة الذاكرة', nameEn: 'Memory Game', easyPoints: 5, mediumPoints: 10, hardPoints: 15, isEnabled: true },
  { id: 'kings', nameAr: 'تحدي الملوك', nameEn: 'Kings Game', pointsPerWin: 25, isEnabled: true },
  { id: 'snap', nameAr: 'تحدي Snap السريع', nameEn: 'Snap Game', pointsPerWin: 15, isEnabled: true },
];

const generateRandomCode = (brandName?: string) => {
  const cleanBrand = brandName 
    ? brandName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() 
    : '';
  const prefix = cleanBrand && cleanBrand.length > 0 ? cleanBrand : 'OFFER';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<'branding' | 'offers' | 'games' | 'users' | 'analytics'>('branding');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customPointsInput, setCustomPointsInput] = useState<{ [key: string]: string }>({});

  const [config, setConfig] = useState<RestaurantConfig>({
    nameAr: 'المطعم',
    nameEn: 'RESTAURANT',
    logoUrl: '/logo.png',
    primaryColor: '#e11d48',
    secondaryColor: '#f43f5e',
    welcomeMessageAr: 'أهلاً بك في عالم الحلوى والجوائز!',
    welcomeMessageEn: 'Welcome to the world of desserts & rewards!',
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  
  const [newOffer, setNewOffer] = useState<Omit<Offer, 'id'>>({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    pointsRequired: 10,
    code: generateRandomCode('RESTAURANT'),
    imageUrl: '',
    isActive: true,
  });

  const [gameSettings, setGameSettings] = useState<GameSetting[]>(DEFAULT_GAMES);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalPointsGranted: 0,
    totalCouponsRedeemed: 0,
  });

  const fetchRewardsList = useCallback(async () => {
    try {
      const res = await api.get('/rewards');
      const data = res.data;

      if (Array.isArray(data)) {
        setOffers(data);
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  }, []);

  // 🌟 دالة جلب بيانات المستخدمين والإحصائيات لتحديثها فوراً
  const fetchUsersAndAnalytics = useCallback(async () => {
    try {
      const resAnalytics = await api.get('/admin/analytics').catch(() => null);
      if (resAnalytics?.data) {
        setAnalytics({
          totalUsers: resAnalytics.data.totalUsers || 1,
          totalPointsGranted: resAnalytics.data.totalPointsGranted || 0,
          totalCouponsRedeemed: resAnalytics.data.totalCouponsRedeemed || 0,
        });
      }

      const resUsers = await api.get('/admin/users').catch(() => null);
      if (resUsers?.data) {
        setUsersList(Array.isArray(resUsers.data) ? resUsers.data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch users or analytics', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAllAdminData = async () => {
      try {
        setLoading(true);

        await fetchRewardsList();
        await fetchUsersAndAnalytics();

        const resSettings = await fetch('http://localhost:3000/settings');
        if (resSettings.ok && isMounted) {
          const data = await resSettings.json();
          const loadedNameEn = data.nameEn || 'RESTAURANT';
          
          setConfig({
            nameAr: data.nameAr || 'المطعم',
            nameEn: loadedNameEn,
            logoUrl: data.logoUrl || '/logo.png',
            primaryColor: data.primaryColor || '#e11d48',
            secondaryColor: data.secondaryColor || '#f43f5e',
            welcomeMessageAr: data.welcomeMessageAr || 'أهلاً بك في عالم الجوائز!',
            welcomeMessageEn: data.welcomeMessageEn || 'Welcome to rewards!',
          });

          setNewOffer(prev => ({
            ...prev,
            code: generateRandomCode(loadedNameEn)
          }));

          if (data.gameSettingsJson) {
            try {
              const parsedGames = typeof data.gameSettingsJson === 'string' 
                ? JSON.parse(data.gameSettingsJson) 
                : data.gameSettingsJson;
              if (Array.isArray(parsedGames) && parsedGames.length > 0) {
                const filteredGames = parsedGames.filter((g: { id?: string }) => g?.id !== 'spin');
                const mergedGames = DEFAULT_GAMES.map(defaultGame => {
                  const found = filteredGames.find((g: { id: string }) => g.id === defaultGame.id);
                  return found ? { ...defaultGame, ...found } : defaultGame;
                });
                setGameSettings(mergedGames);
              }
            } catch (e) {
              console.error('Error parsing game settings', e);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllAdminData();

    // 🌟 تحديث بيانات المستخدمين تلقائياً عند العودة لصفحة الآدمن أو التركيز عليها
    const handleFocus = () => {
      fetchUsersAndAnalytics();
      fetchRewardsList();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchRewardsList, fetchUsersAndAnalytics]);

  // 🌟 تحديث المستخدمين تلقائياً عند الضغط على تبويب المستخدمين أو الإحصائيات
  const handleTabChange = (tab: 'branding' | 'offers' | 'games' | 'users' | 'analytics') => {
    setActiveTab(tab);
    if (tab === 'users' || tab === 'analytics') {
      fetchUsersAndAnalytics();
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = {
        ...config,
        gameSettingsJson: gameSettings,
      };

      const res = await fetch('http://localhost:3000/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        router.refresh();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddOffer = async () => {
    if (!newOffer.titleAr || !newOffer.code) return;
    
    try {
      const response = await api.post('/rewards', {
        title: newOffer.titleAr,
        description: newOffer.descriptionAr,
        pointsRequired: Number(newOffer.pointsRequired),
        discountCode: newOffer.code,
        imageUrl: newOffer.imageUrl,
      });

      if (response.data) {
        setOffers(prev => [response.data, ...prev]);
      } else {
        await fetchRewardsList();
      }
      
      setNewOffer({
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
        pointsRequired: 10,
        code: generateRandomCode(config.nameEn),
        imageUrl: '',
        isActive: true,
      });
      alert('تم إضافة العرض بنجاح!');
    } catch (err) {
      console.error('Failed to add offer:', err);
      alert('حدث خطأ أثناء إضافة العرض، تأكد من تشغيل الباك إند');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await api.delete(`/rewards/${id}`);
      setOffers(prev => prev.filter(o => o.id !== id));
      alert('تم حذف العرض بنجاح من قاعدة البيانات!');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('حدث خطأ أثناء الحذف، تأكد من تشغيل الباك إند');
    }
  };

  const handleUpdateUserPoints = async (email: string, isSubtract: boolean = false) => {
    const rawVal = customPointsInput[email];
    const val = Number(rawVal);

    if (!val || isNaN(val) || val <= 0) {
      alert(lang === 'ar' ? 'الرجاء إدخال رقم صحيح أكبر من الصفر' : 'Please enter a valid positive number');
      return;
    }

    const finalAmount = isSubtract ? -val : val;

    try {
      await api.post('/admin/users/points', { email, points: finalAmount });
      setUsersList(prev => prev.map(u => u.email === email ? { ...u, points: u.points + finalAmount } : u));
      setCustomPointsInput(prev => ({ ...prev, [email]: '' }));
      alert(lang === 'ar' ? 'تم تحديث نقاط المستخدم بنجاح!' : 'User points updated successfully!');
    } catch {
      try {
        await api.post('/points/add', { email, points: finalAmount });
        setUsersList(prev => prev.map(u => u.email === email ? { ...u, points: u.points + finalAmount } : u));
        setCustomPointsInput(prev => ({ ...prev, [email]: '' }));
        alert(lang === 'ar' ? 'تم تحديث النقاط بنجاح!' : 'Points updated successfully!');
      } catch (err) {
        console.error('Failed to update points', err);
        alert(lang === 'ar' ? 'تعذر تعديل النقاط، تأكد من اتصال الباك إند' : 'Failed to update points');
      }
    }
  };

  const txt = {
    title: lang === 'ar' ? 'لوحة تحكم إدارة المطعم' : 'Restaurant Management Admin',
    subtitle: lang === 'ar' ? 'تخصيص الهوية، العروض، وإعدادات الجوائز' : 'Customize branding, offers, and game rewards',
    saveBtn: lang === 'ar' ? 'حفظ التغيرات' : 'Save Changes',
    savedMsg: lang === 'ar' ? 'تم حفظ الإعدادات بنجاح في قاعدة البيانات!' : 'Settings saved successfully!',
    tabBranding: lang === 'ar' ? 'الهوية والألوان' : 'Branding & Theme',
    tabOffers: lang === 'ar' ? 'إدارة العروض' : 'Manage Offers',
    tabGames: lang === 'ar' ? 'مكافآت الألعاب' : 'Game Rewards',
    tabUsers: lang === 'ar' ? 'إدارة المستخدمين والنقاط' : 'Users & Points',
    tabAnalytics: lang === 'ar' ? 'الإحصائيات' : 'Analytics',
    
    brandSectionTitle: lang === 'ar' ? 'بيانات المطعم والشعار' : 'Restaurant Details & Logo',
    brandNameAr: lang === 'ar' ? 'اسم المطعم (بالعربية)' : 'Restaurant Name (Arabic)',
    brandNameEn: lang === 'ar' ? 'اسم المطعم (بالإنجليزية)' : 'Restaurant Name (English)',
    logoUrl: lang === 'ar' ? 'شعار المطعم (Logo)' : 'Restaurant Logo',
    welcomeAr: lang === 'ar' ? 'رسالة الترحيب (بالعربية)' : 'Welcome Message (Arabic)',
    welcomeEn: lang === 'ar' ? 'رسالة الترحيب (بالإنجليزية)' : 'Welcome Message (English)',
    colorsTitle: lang === 'ar' ? 'تخصيص ألوان الهوية (Theme Colors)' : 'Customize Brand Colors',
    primaryColor: lang === 'ar' ? 'اللون الأساسي (Primary)' : 'Primary Color',
    secondaryColor: lang === 'ar' ? 'اللون الثانوي (Secondary)' : 'Secondary Color',

    addOfferTitle: lang === 'ar' ? 'إضافة عرض / كوبون جديد' : 'Add New Offer / Coupon',
    offerTitleAr: lang === 'ar' ? 'العنوان بالعربية' : 'Title (Arabic)',
    offerTitleEn: lang === 'ar' ? 'العنوان بالإنجليزية' : 'Title (English)',
    offerCode: lang === 'ar' ? 'كود الخصم (يتم توليده تلقائياً أو يمكنك تعديله)' : 'Coupon Code',
    pointsReq: lang === 'ar' ? 'النقاط المطلوبة' : 'Points Required',
    descAr: lang === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)',
    descEn: lang === 'ar' ? 'الوصف بالإنجليزية' : 'Description (English)',
    addOfferBtn: lang === 'ar' ? 'إضافة العرض الآن' : 'Add Offer Now',
    activeOffers: lang === 'ar' ? 'العروض المتاحة حالياً' : 'Current Active Offers',

    gamesTitle: lang === 'ar' ? 'تخصيص نقاط الألعاب والمراحل' : 'Game Rewards Configuration',
    easyPts: lang === 'ar' ? 'نقاط المرحلة السهلة' : 'Easy Stage PTS',
    mediumPts: lang === 'ar' ? 'نقاط المرحلة المتوسطة' : 'Medium Stage PTS',
    hardPts: lang === 'ar' ? 'نقاط المرحلة الصعبة' : 'Hard Stage PTS',
    ptsPerWin: lang === 'ar' ? 'نقاط الفوز عند كل مرة' : 'Points Per Win',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-sm font-bold">جاري تحميل بيانات لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-white">{txt.title}</h1>
            <p className="text-xs text-slate-400">{txt.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <Globe className="w-4 h-4 text-rose-400" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{txt.saveBtn}</span>
          </button>
        </div>
      </header>

      {savedSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{txt.savedMsg}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-slate-900/60 border-l border-r border-slate-800/80 p-4 space-y-2">
          <button
            onClick={() => handleTabChange('branding')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'branding' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span>{txt.tabBranding}</span>
          </button>

          <button
            onClick={() => handleTabChange('offers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'offers' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span>{txt.tabOffers}</span>
          </button>

          <button
            onClick={() => handleTabChange('games')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'games' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span>{txt.tabGames}</span>
          </button>

          <button
            onClick={() => handleTabChange('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'users' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>{txt.tabUsers}</span>
          </button>

          <button
            onClick={() => handleTabChange('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'analytics' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>{txt.tabAnalytics}</span>
          </button>
        </aside>

        <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {txt.brandSectionTitle}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">{txt.brandNameAr}</label>
                    <input
                      type="text"
                      value={config.nameAr}
                      onChange={(e) => setConfig({ ...config, nameAr: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">{txt.brandNameEn}</label>
                    <input
                      type="text"
                      value={config.nameEn}
                      onChange={(e) => setConfig({ ...config, nameEn: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">{txt.logoUrl}</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-4 cursor-pointer bg-slate-950 transition group">
                    {config.logoUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={config.logoUrl}
                          alt="Logo Preview"
                          className="w-14 h-14 object-contain rounded-lg border border-slate-700 bg-slate-900 p-1"
                        />
                        <div className="text-right">
                          <span className="text-xs text-emerald-400 font-bold block">
                            {lang === 'ar' ? 'تم اختيار الشعار بنجاح' : 'Logo selected successfully'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lang === 'ar' ? 'انقر هنا لتغيير اللوجو' : 'Click to change logo'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-rose-400 transition">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold">
                          {lang === 'ar' ? 'اختر صورة الشعار من جهازك' : 'Select logo image from your device'}
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const logoUrl = URL.createObjectURL(file);
                          setConfig({ ...config, logoUrl });
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">{txt.welcomeAr}</label>
                    <input
                      type="text"
                      value={config.welcomeMessageAr}
                      onChange={(e) => setConfig({ ...config, welcomeMessageAr: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">{txt.welcomeEn}</label>
                    <input
                      type="text"
                      value={config.welcomeMessageEn}
                      onChange={(e) => setConfig({ ...config, welcomeMessageEn: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-rose-400">{txt.colorsTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300">{txt.primaryColor}</label>
                      <span className="font-mono text-xs text-slate-400">{config.primaryColor}</span>
                    </div>
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300">{txt.secondaryColor}</label>
                      <span className="font-mono text-xs text-slate-400">{config.secondaryColor}</span>
                    </div>
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {txt.addOfferTitle}
                  </h2>
                  <button
                    onClick={() => setNewOffer({ ...newOffer, code: generateRandomCode(config.nameEn) })}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    {lang === 'ar' ? 'توليد كود عشوائي جديد 🎲' : 'Generate New Code 🎲'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={txt.offerTitleAr}
                    value={newOffer.titleAr}
                    onChange={(e) => setNewOffer({ ...newOffer, titleAr: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={txt.offerTitleEn}
                    value={newOffer.titleEn}
                    onChange={(e) => setNewOffer({ ...newOffer, titleEn: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={txt.offerCode}
                    value={newOffer.code}
                    onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono"
                  />
                  <input
                    type="number"
                    placeholder={txt.pointsReq}
                    value={newOffer.pointsRequired || ''}
                    onChange={(e) => setNewOffer({ ...newOffer, pointsRequired: Number(e.target.value) })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      {lang === 'ar' ? 'صورة العرض' : 'Offer Image'}
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-4 cursor-pointer bg-slate-950 transition group">
                      {newOffer.imageUrl ? (
                        <div className="flex items-center gap-3">
                          <img src={newOffer.imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
                          <span className="text-xs text-emerald-400 font-bold">
                            {lang === 'ar' ? 'تم اختيار الصورة بنجاح (انقر لتغييرها)' : 'Image selected successfully (Click to change)'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-rose-400 transition">
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold">
                            {lang === 'ar' ? 'اختر صورة العرض' : 'Select an offer image'}
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const imageUrl = URL.createObjectURL(file);
                            setNewOffer({ ...newOffer, imageUrl });
                          }
                        }}
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder={txt.descAr}
                    value={newOffer.descriptionAr}
                    onChange={(e) => setNewOffer({ ...newOffer, descriptionAr: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={txt.descEn}
                    value={newOffer.descriptionEn}
                    onChange={(e) => setNewOffer({ ...newOffer, descriptionEn: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAddOffer}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{txt.addOfferBtn}</span>
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400">{txt.activeOffers} ({offers.length})</h3>
                {offers.map((offer) => (
                  <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {offer.imageUrl ? (
                        <img
                          src={offer.imageUrl}
                          alt={offer.titleAr}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-700"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 border border-slate-700">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">
                            {lang === 'ar' ? offer.titleAr : offer.titleEn}
                          </span>
                          <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700">
                            <Tag className="w-3 h-3" />
                            {offer.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{lang === 'ar' ? offer.descriptionAr : offer.descriptionEn}</p>
                        <span className="text-xs font-bold text-amber-400 block">{offer.pointsRequired} PTS</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition border border-rose-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  {txt.gamesTitle}
                </h2>

                <div className="space-y-4">
                  {gameSettings.map((game, idx) => {
                    const isMultiLevel = game.id !== 'kings' && game.id !== 'snap';

                    return (
                      <div key={game.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="font-bold text-white text-sm">
                            {lang === 'ar' ? game.nameAr : game.nameEn}
                          </h4>
                        </div>

                        {isMultiLevel ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] text-emerald-400 font-bold mb-1">{txt.easyPts}</label>
                              <input
                                type="number"
                                value={game.easyPoints ?? 5}
                                onChange={(e) => {
                                  const updated = [...gameSettings];
                                  updated[idx].easyPoints = Number(e.target.value);
                                  setGameSettings(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-amber-400 font-bold mb-1">{txt.mediumPts}</label>
                              <input
                                type="number"
                                value={game.mediumPoints ?? 10}
                                onChange={(e) => {
                                  const updated = [...gameSettings];
                                  updated[idx].mediumPoints = Number(e.target.value);
                                  setGameSettings(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-rose-400 font-bold mb-1">{txt.hardPts}</label>
                              <input
                                type="number"
                                value={game.hardPoints ?? 20}
                                onChange={(e) => {
                                  const updated = [...gameSettings];
                                  updated[idx].hardPoints = Number(e.target.value);
                                  setGameSettings(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-cyan-400 font-bold mb-1">{txt.ptsPerWin}</label>
                              <input
                                type="number"
                                value={game.pointsPerWin ?? 20}
                                onChange={(e) => {
                                  const updated = [...gameSettings];
                                  updated[idx].pointsPerWin = Number(e.target.value);
                                  setGameSettings(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {lang === 'ar' ? 'إدارة المستخدمين وأرصدة النقاط يدوياً' : 'Users & Manual Points Management'}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'ar' ? 'اكتب عدد النقاط المطلوب في الحقل ثم اختر إضافة أو خصم.' : 'Enter the points value in the input field then choose add or deduct.'}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="py-3 px-4">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                        <th className="py-3 px-4">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="py-3 px-4">{lang === 'ar' ? 'رصيد النقاط' : 'Points Balance'}</th>
                        <th className="py-3 px-4 text-center">{lang === 'ar' ? 'تعديل النقاط يدوياً' : 'Manual Adjustment'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {usersList.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono text-xs text-slate-300">{user.email}</td>
                          <td className="py-3 px-4 font-bold text-white">{user.name || 'مستخدم عام'}</td>
                          <td className="py-3 px-4 font-black text-amber-400">{user.points} PTS</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                placeholder={lang === 'ar' ? 'العدد' : 'Amount'}
                                value={customPointsInput[user.email] || ''}
                                onChange={(e) => setCustomPointsInput({
                                  ...customPointsInput,
                                  [user.email]: e.target.value
                                })}
                                className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none text-center font-bold"
                              />
                              <button
                                onClick={() => handleUpdateUserPoints(user.email, false)}
                                title={lang === 'ar' ? 'إضافة نقاط' : 'Add Points'}
                                className="p-2 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition border border-emerald-500/20 flex items-center gap-1 text-xs font-bold"
                              >
                                <PlusCircle className="w-4 h-4" />
                                <span>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
                              </button>
                              <button
                                onClick={() => handleUpdateUserPoints(user.email, true)}
                                title={lang === 'ar' ? 'خصم نقاط' : 'Deduct Points'}
                                className="p-2 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 rounded-xl transition border border-rose-500/20 flex items-center gap-1 text-xs font-bold"
                              >
                                <MinusCircle className="w-4 h-4" />
                                <span>{lang === 'ar' ? 'خصم' : 'Deduct'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</span>
                <p className="text-2xl font-black text-white mt-2">{analytics.totalUsers.toLocaleString()}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'النقاط الممنوحة' : 'Points Granted'}</span>
                <p className="text-2xl font-black text-amber-400 mt-2">{analytics.totalPointsGranted.toLocaleString()}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'الكوبونات المستبدلة' : 'Coupons Redeemed'}</span>
                <p className="text-2xl font-black text-emerald-400 mt-2">{analytics.totalCouponsRedeemed.toLocaleString()}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}