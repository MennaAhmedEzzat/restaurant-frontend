import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, RotateCcw, Trophy, Timer } from 'lucide-react';

interface SnapGameProps {
  isOpen: boolean;
  onClose: () => void;
  onGameWin?: (score: number, earnedPoints: number) => void;
  lang?: 'ar' | 'en';
  pointsPerWin?: number;
}

const EMOJIS = ['🥤', '🍕', '🍔', '🍟', '🍦', '🍩', '🍎', '🥑'];
const TARGET_MATCHES = 3;

export default function SnapGame({
  isOpen,
  onClose,
  onGameWin,
  lang = 'ar',
  pointsPerWin = 15,
}: SnapGameProps) {
  const [currentEmoji, setCurrentEmoji] = useState<string>('🥤');
  const [previousEmoji, setPreviousEmoji] = useState<string>('');
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(15);
    setIsGameOver(false);
    setFeedback(null);
    setPreviousEmoji('');
    setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      timer = setTimeout(() => {
        startGame();
      }, 0);
    } else {
      timer = setTimeout(() => {
        stopGame();
      }, 0);
    }

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, startGame, stopGame]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      intervalRef.current = setInterval(() => {
        setCurrentEmoji((prev) => {
          setPreviousEmoji(prev);
          const isRepeat = Math.random() < 0.35;
          if (isRepeat) return prev;
          const remaining = EMOJIS.filter((e) => e !== prev);
          return remaining[Math.floor(Math.random() * remaining.length)];
        });
      }, 900);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopGame();
            setIsGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver, stopGame]);

  const handleSnap = () => {
    if (!isPlaying || isGameOver) return;

    if (currentEmoji === previousEmoji) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback('success');
      setTimeout(() => setFeedback(null), 400);

      if (newScore >= TARGET_MATCHES) {
        stopGame();
        setIsGameOver(true);
      }
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 400);
    }
  };

  const handleClaimReward = () => {
    const totalPoints = score > 0 ? pointsPerWin : 0;
    if (onGameWin && totalPoints > 0) {
      onGameWin(score, totalPoints);
    }
    onClose();
  };

  if (!isOpen) return null;

  const totalEarnedPoints = score > 0 ? pointsPerWin : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 mb-2">
            <Zap className="w-3.5 h-3.5 fill-amber-500" />
            {lang === 'ar' ? 'لعبة السرعة والتركيز' : 'Speed Game'}
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">
            {lang === 'ar' ? 'لعبة Snap السريعة ⚡️' : 'Snap Challenge ⚡️'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? `احصل على ${TARGET_MATCHES} تطابقات لتفوز بـ ${pointsPerWin} نقطة!`
              : `Get ${TARGET_MATCHES} matches to earn ${pointsPerWin} pts!`}
          </p>
        </div>

        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl mb-4 border border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 text-amber-600">
            <Timer className="w-4 h-4" />
            <span>
              {timeLeft} {lang === 'ar' ? 'ثانية' : 's'}
            </span>
          </div>
          <div>
            {lang === 'ar' ? 'التطابقات:' : 'Matches:'}{' '}
            <span className="text-blue-600 font-bold">
              {score} / {TARGET_MATCHES}
            </span>
          </div>
        </div>

        <div
          onClick={handleSnap}
          className={`h-44 rounded-2xl flex items-center justify-center text-7xl select-none cursor-pointer transition-all duration-150 border-2 relative overflow-hidden shadow-inner ${
            feedback === 'success'
              ? 'bg-emerald-100 border-emerald-400 scale-98'
              : feedback === 'wrong'
              ? 'bg-rose-100 border-rose-400'
              : 'bg-slate-50 border-slate-200 hover:border-amber-300'
          }`}
        >
          <span>{currentEmoji}</span>

          {!isGameOver && (
            <span className="absolute bottom-2 text-[11px] font-bold text-slate-400 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
              {lang === 'ar'
                ? 'انقر هنا عند تكرار الرمز فوراً!'
                : 'Tap here when repeated!'}
            </span>
          )}
        </div>

        {isGameOver && (
          <div className="mt-5 p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-center">
            <Trophy className="w-10 h-10 text-emerald-500 mx-auto mb-1 animate-bounce" />
            <h3 className="font-extrabold text-emerald-900 text-base">
              {score >= TARGET_MATCHES
                ? lang === 'ar'
                  ? 'سرعة بديهة خرافية! 🎉'
                  : 'Awesome Speed! 🎉'
                : lang === 'ar'
                ? 'انتهى الوقت! ⏱️'
                : 'Time Up! ⏱️'}
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              {score > 0
                ? lang === 'ar'
                  ? `حققت ${score} تطابقات وتستحق ${totalEarnedPoints} نقطة!`
                  : `You got ${score} matches and earned ${totalEarnedPoints} points!`
                : lang === 'ar'
                ? 'حاول مرة أخرى لتحقيق النقاط'
                : 'Try again to earn points'}
            </p>

            <div className="mt-3 inline-block bg-white px-4 py-1.5 rounded-full border border-emerald-300 text-xs font-bold text-emerald-800 shadow-sm">
              {lang === 'ar' ? 'النقاط المكتسبة:' : 'Points Earned:'}{' '}
              <span className="text-amber-600">+{totalEarnedPoints}</span>
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {isGameOver ? (
            <>
              <button
                onClick={handleClaimReward}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition text-sm"
              >
                {lang === 'ar' ? 'استلام النقاط والإغلاق' : 'Claim Points & Close'}
              </button>
              <button
                onClick={startGame}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleSnap}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-extrabold rounded-2xl shadow-lg transition text-base flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-white" />
              {lang === 'ar' ? 'SNAP! (اضغط الآن)' : 'SNAP NOW!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}