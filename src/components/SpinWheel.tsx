'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Clock, RefreshCw } from 'lucide-react';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onGameWin: (score: number, points: number) => void;
  lang?: 'ar' | 'en';
}

const TRANSLATIONS = {
  ar: {
    title: 'عجلة الحظ الكبرى',
    subtitle: 'فرصتك اليومية! أدر العجلة واكسب نقاطاً مجانية',
    points: 'نقاط',
    pointSingle: 'نقطة',
    betterLuck: 'حظ أوفر',
    borderMessage: '⚠️ استقرت العجلة على الخط الفاصل تماماً! يمكنك المحاولة مرة أخرى الآن.',
    winMessage: '🎉 مبروك! لقد فزت بـ',
    loseMessage: '😢 حظاً أوفر المرة القادمة!',
    nextSpin: 'المحاولة القادمة بعد:',
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    spinNow: 'أدر العجلة الآن',
    spinUsed: 'تم استهلاك المحاولة اليومية',
  },
  en: {
    title: 'Grand Spin Wheel',
    subtitle: 'Your daily chance! Spin the wheel and win free points',
    points: 'Points',
    pointSingle: 'Point',
    betterLuck: 'Better Luck',
    borderMessage: '⚠️ The wheel landed exactly on the border line! Try again now.',
    winMessage: '🎉 Congratulations! You won',
    loseMessage: '😢 Better luck next time!',
    nextSpin: 'Next spin in:',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    spinNow: 'Spin Now',
    spinUsed: 'Daily spin used',
  },
};

const PRIZES_DATA = [
  { p: 10, labelAr: '10 نقاط', labelEn: '10 Points', color: '#bae6fd', textColor: 'text-sky-950' },
  { p: 0, labelAr: 'حظ أوفر', labelEn: 'Better Luck', color: '#e2e8f0', textColor: 'text-slate-600' },
  { p: 50, labelAr: '50 نقطة', labelEn: '50 Points', color: '#ddd6fe', textColor: 'text-purple-950' },
  { p: 20, labelAr: '20 نقطة', labelEn: '20 Points', color: '#c7d2fe', textColor: 'text-indigo-950' },
  { p: 100, labelAr: '100 نقطة', labelEn: '100 Points', color: '#fde68a', textColor: 'text-amber-900 font-extrabold' },
  { p: 30, labelAr: '30 نقطة', labelEn: '30 Points', color: '#bfdbfe', textColor: 'text-blue-950' },
];

export default function SpinWheel({ isOpen, onClose, onGameWin, lang }: SpinWheelProps) {
  // حساب اللغة تلقائياً بدون تسبب في إعاقات للرندر أو تحذيرات ESLint
  const getLanguage = (): 'ar' | 'en' => {
    if (lang) return lang;

    if (typeof window !== 'undefined') {
      const htmlLang = document.documentElement.lang;
      const storedLang =
        localStorage.getItem('i18nextLng') ||
        localStorage.getItem('lang') ||
        localStorage.getItem('NEXT_LOCALE');

      if (htmlLang?.includes('en') || storedLang?.includes('en')) return 'en';
      if (htmlLang?.includes('ar') || storedLang?.includes('ar')) return 'ar';

      const dir = document.documentElement.dir || document.body.dir;
      if (dir === 'ltr') return 'en';
    }

    return 'ar';
  };

  const currentLang = getLanguage();
  const t = TRANSLATIONS[currentLang];
  const isRtl = currentLang === 'ar';

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  const [canSpin, setCanSpin] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const numPrizes = PRIZES_DATA.length;
  const arcDegree = 360 / numPrizes;

  useEffect(() => {
    const checkCooldown = () => {
      const lastSpin = localStorage.getItem('spin_wheel_last_played');
      if (lastSpin) {
        const lastSpinTime = parseInt(lastSpin, 10);
        const now = Date.now();
        const cooldownAmount = 24 * 60 * 60 * 1000;
        const diff = now - lastSpinTime;

        if (diff < cooldownAmount) {
          setCanSpin(false);
          const remaining = cooldownAmount - diff;
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          
          if (currentLang === 'ar') {
            setTimeLeft(`${hours} ${t.hours} و ${minutes} ${t.minutes} و ${seconds} ${t.seconds}`);
          } else {
            setTimeLeft(`${hours}${t.hours} ${minutes}${t.minutes} ${seconds}${t.seconds}`);
          }
        } else {
          setCanSpin(true);
          setTimeLeft('');
        }
      } else {
        setCanSpin(true);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentLang, t]);

  const handleClose = () => {
    if (isSpinning) return;
    setRotation(0);
    setWinMessage(null);
    onClose();
  };

  const spin = () => {
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);
    setWinMessage(null);

    const isBorderLand = Math.random() < 0.05;

    let finalRotation = 0;
    let targetIndex = 0;
    const extraSpins = Math.floor(Math.random() * 4 + 6);

    if (isBorderLand) {
      targetIndex = Math.floor(Math.random() * numPrizes);
      const borderAngle = targetIndex * arcDegree;
      finalRotation = (extraSpins * 360) + (360 - borderAngle);
    } else {
      const weights = [40, 30, 4, 15, 1, 10];
      const randomVal = Math.floor(Math.random() * 100);
      let cumulativeWeight = 0;

      for (let i = 0; i < weights.length; i++) {
        cumulativeWeight += weights[i];
        if (randomVal < cumulativeWeight) {
          targetIndex = i;
          break;
        }
      }

      const centerOffset = arcDegree / 2;
      const targetAngle = targetIndex * arcDegree + centerOffset;
      finalRotation = (extraSpins * 360) + (360 - targetAngle);
    }

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);

      if (isBorderLand) {
        setWinMessage(t.borderMessage);
      } else {
        const prize = PRIZES_DATA[targetIndex];
        const prizeLabel = currentLang === 'ar' ? prize.labelAr : prize.labelEn;

        if (prize.p > 0) {
          setWinMessage(`${t.winMessage} ${prizeLabel}`);
          onGameWin(prize.p, prize.p);
        } else {
          setWinMessage(t.loseMessage);
        }

        localStorage.setItem('spin_wheel_last_played', Date.now().toString());
        setCanSpin(false);
      }
    }, 4100);
  };

  const getSlicePath = (index: number) => {
    const startAngle = (index * arcDegree - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * arcDegree - 90) * (Math.PI / 180);
    const radius = 150;
    const x1 = 150 + radius * Math.cos(startAngle);
    const y1 = 150 + radius * Math.sin(startAngle);
    const x2 = 150 + radius * Math.cos(endAngle);
    const y2 = 150 + radius * Math.sin(endAngle);

    return `M 150 150 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 font-['Changa',sans-serif]"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-2xl shadow-blue-900/10 w-full max-w-xl relative"
          >
            <button
              onClick={handleClose}
              disabled={isSpinning}
              className={`absolute top-6 w-10 h-10 rounded-full bg-slate-100/70 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition active:scale-95 disabled:opacity-50 ${
                isRtl ? 'right-6' : 'left-6'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 bg-clip-text text-transparent flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                {t.title}
              </h2>
              <p className="text-sm text-slate-500 font-semibold mt-2">{t.subtitle}</p>
            </div>

            <div className="relative w-full aspect-square max-w-sm mx-auto mb-8 flex items-center justify-center">
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-8 border-slate-100 shadow-xl shadow-blue-900/10 overflow-hidden relative"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none',
                }}
              >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  {PRIZES_DATA.map((prize, index) => (
                    <path
                      key={index}
                      d={getSlicePath(index)}
                      fill={prize.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                {PRIZES_DATA.map((prize, index) => {
                  const textAngle = index * arcDegree + arcDegree / 2;
                  const label = currentLang === 'ar' ? prize.labelAr : prize.labelEn;

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 flex justify-center items-start pt-6 pointer-events-none"
                      style={{
                        transform: `rotate(${textAngle}deg)`,
                      }}
                    >
                      <span className={`text-sm md:text-base ${prize.textColor} select-none font-extrabold drop-shadow-sm`}>
                        {label}
                      </span>
                    </div>
                  );
                })}

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border-2 border-slate-100 shadow-md flex items-center justify-center z-20">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-500 drop-shadow-md" />
              </div>
            </div>

            {winMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center p-4 rounded-2xl mb-6 text-sm font-bold border ${
                  winMessage.includes('🎉')
                    ? 'bg-blue-50 border-blue-100 text-blue-900'
                    : winMessage.includes('⚠️')
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {winMessage}
              </motion.div>
            )}

            {!canSpin && !isSpinning && (
              <div className="mb-6 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-2xl text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                <span>{t.nextSpin} {timeLeft}</span>
              </div>
            )}

            <button
              onClick={spin}
              disabled={isSpinning || !canSpin}
              className={`w-full py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-3 ${
                isSpinning || !canSpin
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 text-white shadow-xl shadow-blue-500/20 active:scale-95'
              }`}
            >
              {canSpin ? <Gift className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
              <span>{canSpin ? t.spinNow : t.spinUsed}</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}