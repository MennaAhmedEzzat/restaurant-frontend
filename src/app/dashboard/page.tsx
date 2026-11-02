'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Trophy, 
  Gift, 
  Languages, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  History,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  Filter,
  LogOut,
} from 'lucide-react';

import { api } from '@/lib/api';

import SpinWheel from '@/components/SpinWheel';
import KingsGame from '@/components/KingsGame';
import MemoryGame from '@/components/MemoryGame';
import ShikakuGame from '@/components/ShikakuGame';
import SnapGame from '@/components/SnapGame';
import SudokuGame from '@/components/SudokuGame';

type Language = 'ar' | 'en';
type FilterType = 'all' | 'earn' | 'spend';

interface Transaction {
  id: string | number;
  title?: string;
  description?: string;
  points: number;
  type?: 'earn' | 'spend' | 'redeem' | string;
  date?: string;
  createdAt?: string;
}

interface DynamicSettings {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessageAr?: string;
  welcomeMessageEn?: string;
  gameSettingsJson?: string;
}

interface RewardItem {
  id: string | number;
  title: string;
  description?: string;
  pointsRequired?: number;
  cost?: number;
  imageUrl?: string;
  image?: string;
}

const formatRelativeTime = (rawDate?: string, lang: Language = 'ar'): string => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return lang === 'ar' ? 'الآن' : 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return lang === 'ar' ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24 && now.getDate() === date.getDate()) {
    const timeStr = date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    return lang === 'ar' ? `اليوم، ${timeStr}` : `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.getDate() === date.getDate() && yesterday.getMonth() === date.getMonth() && yesterday.getFullYear() === date.getFullYear()) {
    const timeStr = date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    return lang === 'ar' ? `أمس، ${timeStr}` : `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function DashboardPage() {
  const router = useRouter();
  const [points, setPoints] = useState<number>(0);
  
  const [userNameAr] = useState<string>(() => {
    return typeof window !== 'undefined' 
      ? localStorage.getItem('userNameAr') || localStorage.getItem('userName') || 'صديق بلبن' 
      : 'صديق بلبن';
  });

  const [userNameEn] = useState<string>(() => {
    return typeof window !== 'undefined' 
      ? localStorage.getItem('userNameEn') || localStorage.getItem('userName') || 'B.Laban Friend' 
      : 'B.Laban Friend';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [redeemedRewards, setRedeemedRewards] = useState<(string | number)[]>([]);

  const [rewardsList, setRewardsList] = useState<RewardItem[]>([]);
  const [settings, setSettings] = useState<DynamicSettings | null>(null);

  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [filterType, setFilterType] = useState<FilterType>('all');

  const currentPhone = typeof window !== 'undefined' ? localStorage.getItem('phone') || '01000000000' : '01000000000';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('phone');
    localStorage.removeItem('userName');
    localStorage.removeItem('userNameAr');
    localStorage.removeItem('userNameEn');
    router.push('/login');
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.warn('Could not load dynamic settings', err);
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/rewards');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRewardsList(data);
        }
      }
    } catch (err) {
      console.warn('Could not load dynamic rewards from backend', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get(`/users/dashboard?phone=${currentPhone}`);
      setPoints(response.data.points ?? response.data.totalPoints ?? 0);
      setTransactions(response.data.transactions || []);
      setError(null);
    } catch {
      try {
        const fallbackRes = await api.get(`/points/user?phone=${currentPhone}`);
        setPoints(fallbackRes.data.totalPoints ?? fallbackRes.data.points ?? 0);
        setTransactions(fallbackRes.data.transactions || []);
        setError(null);
      } catch {
        setError('تعذر جلب البيانات من خادم الباك إند');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPhone]);

  // 🌟 تحديث البيانات تلقائياً عند فتح الصفحة أو العودة إليها (Window Focus)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      await fetchSettings();
      await fetchRewards();
      await fetchDashboardData();
    };

    if (isMounted) {
      loadInitialData();
    }

    // إعادة جلب العروض والبيانات تلقائياً فور رجوع المستخدم لصفحة الداشبورد
    const handleFocus = () => {
      fetchRewards();
      fetchDashboardData();
      fetchSettings();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchSettings, fetchRewards, fetchDashboardData]);

  const handleGameWin = async (score: number = 100, earnedPoints: number = 2, gameCode: string = 'MEMORY_GAME') => {
    try {
      await api.post('/points/game/complete', {
        phone: currentPhone,
        gameCode: gameCode,
        score: score,
        pointsEarned: earnedPoints,
      });

      fetchDashboardData();
    } catch (err) {
      console.error('Error adding game points:', err);
    }
  };

  const handleRedeem = async (rewardId: string | number, pointsCost: number, rewardTitle: string) => {
    if (points < pointsCost) {
      alert(t.notEnoughPoints);
      return;
    }

    try {
      await api.post('/points/redeem', {
        phone: currentPhone,
        points: pointsCost,
        title: rewardTitle,
        rewardId: rewardId,
      });
      alert(`تم استبدال ${rewardTitle} بنجاح!`);
      setRedeemedRewards((prev) => [...prev, rewardId]);
      setLoading(true);
      fetchDashboardData();
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(errorMessage || 'حدث خطأ أثناء الاستبدال');
    }
  };

  const getParsedGameSettings = () => {
    if (!settings?.gameSettingsJson) return {};
    try {
      const gamesArray = typeof settings.gameSettingsJson === 'string' 
        ? JSON.parse(settings.gameSettingsJson) 
        : settings.gameSettingsJson;
      if (!Array.isArray(gamesArray)) return {};
      
      return gamesArray.reduce<Record<string, { 
        id: string; 
        easyPoints?: number; 
        mediumPoints?: number; 
        hardPoints?: number; 
        pointsPerWin?: number; 
        isEnabled?: boolean 
      }>>((acc, game) => {
        if (game && typeof game === 'object' && 'id' in game && typeof game.id === 'string') {
          acc[game.id] = game;
        }
        return acc;
      }, {});
    } catch (e) {
      console.error('Failed to parse gameSettingsJson', e);
      return {};
    }
  };

  const parsedGameSettings = getParsedGameSettings();

  const formatTransactionTitle = useCallback((tx: Transaction, lang: Language): string => {
    let rawDescription = tx.description || tx.title || '';
    rawDescription = rawDescription.replace(/:?\s*100\s*نقطة/g, '');

    if (lang === 'ar') return rawDescription.trim();

    if (rawDescription.includes('فوز في لعبة')) {
      const gameTypeMatch = rawDescription.match(/\(([^)]+)\)/);
      const gameType = gameTypeMatch ? gameTypeMatch[1] : 'Game';
      return `Won in ${gameType}`;
    }

    if (rawDescription.includes('استبدال نقاط لـ')) {
      const rewardMatch = rawDescription.match(/استبدال نقاط لـ (.+)/);
      const rewardTitle = rewardMatch ? rewardMatch[1] : 'Reward';
      return `Redeemed points for ${rewardTitle}`;
    }

    return rawDescription.trim();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const isEarn = tx.points > 0 || tx.type === 'earn';
      if (filterType === 'earn') return isEarn;
      if (filterType === 'spend') return !isEarn;
      return true;
    });
  }, [transactions, filterType]);

  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const t = {
    ar: {
      brand: lang === 'ar' ? (settings?.nameAr || 'بلبن | B.LABAN') : (settings?.nameEn || 'Rewards'),
      subtitle: 'برنامج المكافآت والألعاب',
      points: 'مجموع نقاطك',
      ptUnit: 'نقطة',
      welcome: `أهلاً بك، ${userNameAr}! ✨`,
      welcomeSub: 'العب واجمع النقاط لترقية عضويتك واستبدالها بمنتجات وقسائم مجانية!',
      nextTier: 'الترقية إلى:',
      remaining: 'باقي',
      forNextTier: 'نقطة للترقية التالية',
      gamesTitle: 'الألعاب',
      gamesSub: 'اختر لعبتك المفضلة واجمع آلاف النقاط يومياً',
      playNow: 'العب الآن',
      rewardsTitle: 'استبدال النقاط والجوائز',
      rewardsSub: 'استبدل نقاطك المجمعة بقسائم ومنتجات',
      redeemBtn: 'استبدل الآن',
      redeemed: 'تم الاستبدال',
      notEnoughPoints: 'نقاط غير كافية',
      historyTitle: 'سجل العمليات والنقاط',
      historySub: 'تابع تفاصيل كسب واستبدال النقاط الخاصة بحسابك',
      emptyHistory: 'لا توجد عمليات مسجلة حتى الآن',
      loadMore: 'عرض المزيد من العمليات',
      filterAll: 'الكل',
      filterEarn: 'نقاط مكتسبة',
      filterSpend: 'نقاط مستبدلة',
      showing: 'عرض',
      of: 'من أصل',
      spinTitle: 'عجلة الحظ الكبرى',
      spinDesc: 'أدر العجلة يومياً واحصل على نقاط مجانية مباشرة!',
      memoryTitle: 'تحدي الذاكرة',
      memoryDesc: 'طابق الصور واحصل على النقاط حسب سرعتك.',
      kingsTitle: 'تحدي الملوك',
      kingsDesc: 'ضع الملوك في أماكنها الصحيحة على الرقعة بدون تقاطع.',
      snapTitle: 'تحدي Snap السريع',
      snapDesc: 'اضغط بسرعة فور ظهور الكروت المتطابقة لتجميع النقاط!',
      sudokuTitle: 'سودوكو',
      sudokuDesc: 'حل ألغاز الأرقام واختبر قوة تركيزك للحصول على جوائز قيمة.',
      shikakuTitle: 'لغز المستطيلات (Shikaku)',
      shikakuDesc: 'قسم الشبكة إلى مستطيلات متناسبة مع الأرقام للفوز النقاط.',
      bronze: 'العضوية البرونزية',
      silver: 'العضوية الفضية',
      gold: 'العضوية الذهبية',
      diamond: 'العضوية الماسّية',
      daily: 'مرة واحدة يومياً',
      unlimited: 'غير محدود',
      highReward: 'مكافأة كبيرة',
      skill: 'تحدي المهارة',
      levels: 'مراحل متعددة',
      pro: 'للمحترفين',
      logout: 'تسجيل الخروج',
    },
    en: {
      brand: lang === 'en' ? (settings?.nameEn || 'B.LABAN Rewards') : (settings?.nameAr || 'بلبن | B.LABAN'),
      subtitle: 'Rewards & Gaming Hub',
      points: 'Total Balance',
      ptUnit: 'PTS',
      welcome: `Welcome back, ${userNameEn}! ✨`,
      welcomeSub: 'Play, earn points, upgrade your tier, and redeem free rewards!',
      nextTier: 'Upgrade to:',
      remaining: 'Remaining',
      forNextTier: 'PTS for next tier',
      gamesTitle: 'Prize Games',
      gamesSub: 'Pick your favorite game and earn thousands of daily points',
      playNow: 'Play Now',
      rewardsTitle: 'Redeem Points & Rewards',
      rewardsSub: 'Exchange your points for vouchers and items',
      redeemBtn: 'Redeem Now',
      redeemed: 'Redeemed',
      notEnoughPoints: 'Insufficient Points',
      historyTitle: 'Transaction History',
      historySub: 'Track your earned and redeemed points history',
      emptyHistory: 'No transactions recorded yet',
      loadMore: 'Load More Transactions',
      filterAll: 'All',
      filterEarn: 'Earned',
      filterSpend: 'Spent',
      showing: 'Showing',
      of: 'of',
      spinTitle: 'Lucky Spin Wheel',
      spinDesc: 'Spin the wheel daily and instantly earn bonus points!',
      memoryTitle: 'Memory Challenge',
      memoryDesc: 'Match cards and earn points based on speed.',
      kingsTitle: 'Kings Puzzle',
      kingsDesc: 'Place kings correctly on the grid without conflicting.',
      snapTitle: 'Speed Snap Game',
      snapDesc: 'Click fast when matching cards appear to score higher!',
      sudokuTitle: 'Sudoku',
      sudokuDesc: 'Solve number puzzles and test your focus to win big.',
      shikakuTitle: 'Shikaku Rectangles',
      shikakuDesc: 'Divide the grid into rectangles matching the numbers.',
      bronze: 'Bronze Tier',
      silver: 'Silver Tier',
      gold: 'Gold Tier',
      diamond: 'Diamond Tier',
      daily: 'Once Daily',
      unlimited: 'Unlimited',
      highReward: 'High Reward',
      skill: 'Skill Based',
      levels: 'Multi Levels',
      pro: 'Pro Level',
      logout: 'Logout',
    }
  }[lang];

  const getTierInfo = (currentPoints: number) => {
    if (currentPoints >= 25000) {
      return {
        name: t.diamond,
        badgeColor: 'from-cyan-500 to-blue-600 text-cyan-700 border-cyan-300',
        badgeImg: '/gold-badge-v2.png',
        nextTierPoints: 50000,
        nextTierName: 'Diamond Pro',
        progress: 100,
      };
    } else if (currentPoints >= 10000) {
      return {
        name: t.gold,
        badgeColor: 'from-amber-400 to-amber-600 text-amber-700 border-amber-300',
        badgeImg: '/gold-badge-v2.png',
        nextTierPoints: 25000,
        nextTierName: t.diamond,
        progress: Math.min(100, ((currentPoints - 10000) / 15000) * 100),
      };
    } else if (currentPoints >= 5000) {
      return {
        name: t.silver,
        badgeColor: 'from-slate-400 to-slate-600 text-slate-700 border-slate-300',
        badgeImg: '/silver-badge-v2.png',
        nextTierPoints: 10000,
        nextTierName: t.gold,
        progress: Math.min(100, ((currentPoints - 5000) / 5000) * 100),
      };
    } else {
      return {
        name: t.bronze,
        badgeColor: 'from-amber-700 to-amber-900 text-amber-900 border-amber-300',
        badgeImg: '/bronze-badge-v2.png',
        nextTierPoints: 5000,
        nextTierName: t.silver,
        progress: Math.min(100, (currentPoints / 5000) * 100),
      };
    }
  };

  const tier = getTierInfo(points);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3" dir="rtl">
      <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      <p className="text-sm font-bold text-blue-600 animate-pulse">جاري تحميل بيانات لوحة التحكم...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 p-4" dir="rtl">
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold text-center shadow-lg max-w-md w-full">
        {error}
      </div>
    </div>
  );

  const primaryColor = settings?.primaryColor;
  const secondaryColor = settings?.secondaryColor;

  return (
    <div 
      className="min-h-screen text-slate-800 font-['Changa',sans-serif] relative overflow-hidden transition-all duration-300"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: primaryColor || '#f0f9ff'
      }}
    >
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white border border-blue-200 shadow-sm flex items-center justify-center overflow-hidden p-1 shrink-0">
              <Image 
                src={settings?.logoUrl || "/logo.png"} 
                alt="Logo" 
                width={44} 
                height={44} 
                className="object-contain w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate" style={{ color: secondaryColor }}>
                {t.brand}
              </h1>
              <p className="text-[9px] sm:text-[11px] font-normal text-slate-500 truncate">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            <div className="flex items-center gap-1.5 bg-white/90 border border-blue-200/80 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-sm">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 animate-pulse shrink-0" />
              <div>
                <div className="text-[8px] sm:text-[9px] font-medium text-slate-400 leading-none">{t.points}</div>
                <div className="text-xs sm:text-sm font-bold text-blue-700 leading-tight mt-0.5" style={secondaryColor ? { color: secondaryColor } : undefined}>
                  {points.toLocaleString()} <span className="text-[9px] sm:text-[10px] font-normal">{t.ptUnit}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/90 border border-blue-200 text-[10px] sm:text-xs font-semibold text-blue-700 hover:bg-blue-50 transition shadow-sm"
              style={secondaryColor ? { color: secondaryColor, borderColor: secondaryColor } : undefined}
            >
              <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" style={secondaryColor ? { color: secondaryColor } : undefined} />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition shadow-sm"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold mr-1">{t.logout}</span>
            </button>

          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 space-y-6 sm:space-y-8">
        
        <div className="relative overflow-hidden bg-white/80 border border-white/90 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto text-center md:text-start flex-col md:flex-row">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                <Image 
                  src={tier.badgeImg} 
                  alt={tier.name} 
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                  <span className={`text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 border ${tier.badgeColor}`}>
                    {tier.name}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900" style={secondaryColor ? { color: secondaryColor } : undefined}>{t.welcome}</h2>
                <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">{t.welcomeSub}</p>
              </div>
            </div>

            <div className="w-full md:w-80 bg-blue-50/80 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">{t.nextTier} <strong className="text-blue-700 font-bold" style={secondaryColor ? { color: secondaryColor } : undefined}>{tier.nextTierName}</strong></span>
                <span className="text-blue-600" style={secondaryColor ? { color: secondaryColor } : undefined}>{Math.round(tier.progress)}%</span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ 
                    width: `${tier.progress}%`,
                    background: `linear-gradient(to right, ${primaryColor || '#f0f9ff'}, ${secondaryColor || '#1d4ed8'})` 
                  }}
                />
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 text-center font-normal">
                {t.remaining} {(tier.nextTierPoints - points) > 0 ? (tier.nextTierPoints - points).toLocaleString() : 0} {t.forNextTier}
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 شبكة الألعاب: 3 ألعاب بجانب بعضها مع عناوين كاملة بدون تقطيع */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" style={secondaryColor ? { color: secondaryColor } : undefined} />
                {t.gamesTitle}
              </h2>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">{t.gamesSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            
            {[
              { id: 'spin', img: '/spin-wheel.png', tag: t.daily, tagBg: 'bg-amber-100 text-amber-800 border-amber-200', title: t.spinTitle },
              { id: 'memory', img: '/memory.png', tag: t.unlimited, tagBg: 'bg-blue-100 text-blue-800 border-blue-200', title: t.memoryTitle },
              { id: 'kings', img: '/kings.png', tag: t.highReward, tagBg: 'bg-purple-100 text-purple-800 border-purple-200', title: t.kingsTitle },
              { id: 'snap', img: '/snap.png', tag: t.skill, tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-200', title: t.snapTitle },
              { id: 'sudoku', img: '/sudoku.png', tag: t.levels, tagBg: 'bg-rose-100 text-rose-800 border-rose-200', title: t.sudokuTitle },
              { id: 'shikaku', img: '/shikaku.png', tag: t.pro, tagBg: 'bg-sky-100 text-sky-800 border-sky-200', title: t.shikakuTitle },
            ].map((game) => (
              <div 
                key={game.id}
                onClick={() => setActiveGame(game.id)} 
                className="group relative bg-white/75 hover:bg-white border border-white/80 hover:border-blue-300 backdrop-blur-xl p-3 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-lg shadow-blue-900/5 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-10 h-10 sm:w-14 sm:h-14 mb-2 sm:mb-4 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm mx-auto sm:mx-0">
                    <Image src={game.img} alt={game.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain" />
                  </div>
                  <div className="text-center sm:text-right">
                    <span className={`text-[8px] sm:text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border inline-block ${game.tagBg}`}>{game.tag}</span>
                    <h3 className="text-[11px] sm:text-base font-bold text-slate-800 mt-1 sm:mt-2 leading-tight">{game.title}</h3>
                  </div>
                </div>
                <div className="mt-3 sm:mt-5 pt-2 sm:pt-4 border-t border-slate-100 flex items-center justify-center sm:justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-blue-600 flex items-center gap-1" style={secondaryColor ? { color: secondaryColor } : undefined}>
                    <span className="hidden sm:inline">{t.playNow}</span>
                    {lang === 'ar' ? <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>

        <div className="pt-6 border-t border-blue-200/60">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" style={secondaryColor ? { color: secondaryColor } : undefined} />
                {t.rewardsTitle}
              </h2>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">{t.rewardsSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {rewardsList.map((reward) => {
              const rewardCost = reward.pointsRequired ?? reward.cost ?? 0;
              const isRedeemed = redeemedRewards.includes(reward.id);
              const canAfford = points >= rewardCost;
              const rewardImage = reward.imageUrl || reward.image || '/logo.png';

              return (
                <div key={reward.id} className="bg-white/80 border border-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-lg shadow-blue-900/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-md overflow-hidden p-1 shrink-0">
                        <Image src={rewardImage} alt={reward.title} fill className="object-cover rounded-xl" />
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100" style={secondaryColor ? { color: secondaryColor } : undefined}>
                        {rewardCost.toLocaleString()} {t.ptUnit}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">{reward.title}</h3>
                    <p className="text-xs font-normal text-slate-500 leading-relaxed mt-1">{reward.description}</p>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.id, rewardCost, reward.title)}
                    disabled={isRedeemed || !canAfford}
                    className={`mt-6 w-full py-2.5 sm:py-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                      isRedeemed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                        : canAfford
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                    style={canAfford && !isRedeemed && secondaryColor ? { backgroundColor: secondaryColor } : undefined}
                  >
                    {isRedeemed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{t.redeemed}</span>
                      </>
                    ) : canAfford ? (
                      <span>{t.redeemBtn}</span>
                    ) : (
                      <span>{t.notEnoughPoints}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-blue-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" style={secondaryColor ? { color: secondaryColor } : undefined} />
                {t.historyTitle}
              </h2>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">{t.historySub}</p>
            </div>

            <div className="flex items-center gap-1 bg-white/80 border border-blue-100 p-1 rounded-xl sm:rounded-2xl shadow-sm self-start sm:self-auto">
              <button
                onClick={() => { setFilterType('all'); setVisibleCount(10); }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition-all ${filterType === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50'}`}
                style={filterType === 'all' && secondaryColor ? { backgroundColor: secondaryColor } : undefined}
              >
                {t.filterAll}
              </button>
              <button
                onClick={() => { setFilterType('earn'); setVisibleCount(10); }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition-all ${filterType === 'earn' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50'}`}
              >
                {t.filterEarn}
              </button>
              <button
                onClick={() => { setFilterType('spend'); setVisibleCount(10); }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition-all ${filterType === 'spend' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-rose-50'}`}
              >
                {t.filterSpend}
              </button>
            </div>
          </div>

          <div className="bg-white/80 border border-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-lg shadow-blue-900/5">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-normal text-xs flex flex-col items-center justify-center gap-2">
                <Filter className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <span>{t.emptyHistory}</span>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {visibleTransactions.map((tx, index) => {
                    const displayTitle = formatTransactionTitle(tx, lang);
                    const isEarn = tx.points > 0 || tx.type === 'earn';
                    const rawDate = tx.createdAt || tx.date;
                    const relativeTime = formatRelativeTime(rawDate, lang);
                    const fullDate = rawDate ? new Date(rawDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '';

                    return (
                      <div key={tx.id ? `${tx.id}-${index}` : index} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-blue-50/40 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {isEarn ? (
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                              <MinusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate">{displayTitle}</h4>
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 font-normal mt-0.5">
                              {relativeTime && <span className="font-medium text-slate-500">{relativeTime}</span>}
                              {relativeTime && fullDate && <span>•</span>}
                              {fullDate && <span>{fullDate}</span>}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[11px] sm:text-xs font-semibold dir-ltr shrink-0 ${isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isEarn ? `+${tx.points}` : tx.points} {t.ptUnit}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {visibleCount < filteredTransactions.length && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] sm:text-xs font-semibold transition-all border border-blue-200/60 shadow-sm active:scale-95"
                      style={secondaryColor ? { color: secondaryColor } : undefined}
                    >
                      <span>{t.loadMore}</span>
                      <ChevronDown className="w-4 h-4 text-blue-600 animate-bounce" style={secondaryColor ? { color: secondaryColor } : undefined} />
                    </button>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">
                      {t.showing} {visibleTransactions.length} {t.of} {filteredTransactions.length}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </main>

      <SpinWheel key={activeGame === 'spin' ? 'spin-open' : 'spin-closed'} isOpen={activeGame === 'spin'} onClose={() => setActiveGame(null)} onGameWin={(score, pts) => handleGameWin(score, parsedGameSettings['spin']?.pointsPerWin || pts || 20, 'SPIN_WHEEL')} lang={lang} />
      <KingsGame key={activeGame === 'kings' ? 'kings-open' : 'kings-closed'} isOpen={activeGame === 'kings'} onClose={() => setActiveGame(null)} onGameWin={(score, pts) => handleGameWin(score, pts, 'KINGS_GAME')} lang={lang} pointsPerWin={parsedGameSettings['kings']?.pointsPerWin || 25} />
      <MemoryGame key={activeGame === 'memory' ? 'memory-open' : 'memory-closed'} isOpen={activeGame === 'memory'} onClose={() => setActiveGame(null)} onGameWin={(score, pts) => handleGameWin(score, pts, 'MEMORY_GAME')} lang={lang} gameSettings={parsedGameSettings['memory']} />
      <ShikakuGame key={activeGame === 'shikaku' ? 'shikaku-open' : 'shikaku-closed'} isOpen={activeGame === 'shikaku'} onClose={() => setActiveGame(null)} onGameWin={(score, pts) => handleGameWin(score, pts, 'SHIKAKU_GAME')} lang={lang} gameSettings={parsedGameSettings['shikaku']} />
      <SnapGame key={activeGame === 'snap' ? 'snap-open' : 'snap-closed'} isOpen={activeGame === 'snap'} onClose={() => setActiveGame(null)} onGameWin={(score, pts) => handleGameWin(score, pts, 'SNAP_GAME')} lang={lang} pointsPerWin={parsedGameSettings['snap']?.pointsPerWin || 15} />
      <SudokuGame key={activeGame === 'sudoku' ? 'sudoku-open' : 'sudoku-closed'} isOpen={activeGame === 'sudoku'} onClose={() => setActiveGame(null)} onGameWin={(score, pts) => handleGameWin(score, pts, 'SUD_GAME')} lang={lang} gameSettings={parsedGameSettings['sudoku']} />
    </div>
  );
}