'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Trophy, RefreshCw, Timer, Zap, Lock, CheckCircle2, Award } from 'lucide-react';

interface MemoryGameProps {
  isOpen: boolean;
  onClose: () => void;
  onGameWin: (score: number, earnedPoints: number) => void;
  lang?: 'ar' | 'en';
  gameSettings?: {
    easyPoints?: number;
    mediumPoints?: number;
    hardPoints?: number;
  };
}

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_ICONS = [
  '🍨', '🥭', '🍧', '🍰', '🍓', '🧇', '🍩', '🍫', '🥑', '🍉',
  '🍕', '🍔', '🍟', '🌭', '🍿', '🥐', '🥨', '🥞', '🌮', '🍣'
];

export default function MemoryGame({ isOpen, onClose, onGameWin, lang = 'ar', gameSettings }: MemoryGameProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentGameInStage, setCurrentGameInStage] = useState(1);

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // تعريف المراحل داخل useMemo لتجنب إعادة الإنشاء المتكرر وتحذيرات المترجم
  const STAGES = useMemo(() => [
    { stage: 1, nameAr: 'المرحلة السهلة', nameEn: 'Easy Stage', pairs: 6, cols: 'grid-cols-4', time: 40, pointsPerGame: gameSettings?.easyPoints ?? 2, totalGames: 15 },
    { stage: 2, nameAr: 'المرحلة المتوسطة', nameEn: 'Medium Stage', pairs: 12, cols: 'grid-cols-4 md:grid-cols-5', time: 60, pointsPerGame: gameSettings?.mediumPoints ?? 5, totalGames: 10 },
    { stage: 3, nameAr: 'المرحلة الصعبة', nameEn: 'Hard Stage', pairs: 16, cols: 'grid-cols-4 md:grid-cols-8', time: 120, pointsPerGame: gameSettings?.hardPoints ?? 10, totalGames: 5 },
  ], [gameSettings?.easyPoints, gameSettings?.mediumPoints, gameSettings?.hardPoints]);

  const currentStageConfig = STAGES[currentStageIdx];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasWonRef = useRef(false);

  const txt = {
    stageName: lang === 'en' ? currentStageConfig.nameEn : currentStageConfig.nameAr,
    level: lang === 'en' ? `Level ${currentGameInStage} of ${currentStageConfig.totalGames}` : `المستوى ${currentGameInStage} من ${currentStageConfig.totalGames}`,
    reward: lang === 'en' ? `Win Reward: +${currentStageConfig.pointsPerGame} PTS` : `مكافأة الفوز بالجيم: +${currentStageConfig.pointsPerGame} نقاط`,
    timeLeft: lang === 'en' ? 'Time Left' : 'الوقت المتبقي',
    seconds: lang === 'en' ? 'sec' : 'ثانية',
    attempts: lang === 'en' ? 'Attempts' : 'المحاولات',
    levelsCount: (count: number) => lang === 'en' ? `${count} levels` : `${count} مستويات`,
    wellDone: lang === 'en' ? `Well done! Level ${currentGameInStage} completed 🥳` : `أحسنت! فزت بالمستوى ${currentGameInStage} 🥳`,
    pointsAdded: (pts: number) => lang === 'en' ? `+${pts} points added to your balance.` : `تمت إضافة +${pts} نقاط لرصيدك.`,
    timeOut: lang === 'en' ? 'Time is up! ⏳' : 'انتهى الوقت! ⏳',
    retryText: lang === 'en' ? 'Retry this level to continue progress.' : 'أعد هذا المستوى لتستكمل تقدمك.',
    retryBtn: lang === 'en' ? 'Retry Level' : 'إعادة المستوى',
    nextLevelBtn: lang === 'en' ? 'Next Level →' : 'المستوى التالي ←',
    finishAllBtn: lang === 'en' ? 'Complete All Stages 🏆' : 'إنهاء كافة المستويات والمراحل 🏆',
    stageShortName: (s: typeof STAGES[0]) => {
      const name = lang === 'en' ? s.nameEn : s.nameAr;
      return name.split(' ')[1] || name;
    }
  };

  const startRound = useCallback((stageIdx: number) => {
    const config = STAGES[stageIdx];
    const icons = ALL_ICONS.slice(0, config.pairs);
    const duplicated = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(duplicated);
    setFlippedCards([]);
    setMoves(0);
    setWon(false);
    setGameOver(false);
    setIsPlaying(true);
    setTimeLeft(config.time);
    hasWonRef.current = false;
  }, [STAGES]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startRound(0);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, startRound]);

  useEffect(() => {
    if (isPlaying && !won && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsPlaying(false);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, won, gameOver]);

  useEffect(() => {
    if (won && !hasWonRef.current) {
      hasWonRef.current = true;
      onGameWin(100, currentStageConfig.pointsPerGame);
    }
  }, [won, currentStageConfig.pointsPerGame, onGameWin]);

  const handleCardClick = (id: number) => {
    if (!isPlaying || won || gameOver || flippedCards.length === 2) return;
    const targetCard = cards.find((c) => c.id === id);
    if (!targetCard || targetCard.isFlipped || targetCard.isMatched) return;

    const updatedCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(updatedCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.icon === secondCard.icon) {
        setTimeout(() => {
          setCards((prev) => {
            const matched = prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
            );
           
            if (matched.every((c) => c.isMatched)) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setWon(true);
            }
            return matched;
          });
          setFlippedCards([]);
        }, 200);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 600);
      }
    }
  };

  const handleNextGame = () => {
    if (currentGameInStage < currentStageConfig.totalGames) {
      setCurrentGameInStage((prev) => prev + 1);
      startRound(currentStageIdx);
    } else if (currentStageIdx < STAGES.length - 1) {
      const nextStage = currentStageIdx + 1;
      setCurrentStageIdx(nextStage);
      setCurrentGameInStage(1);
      startRound(nextStage);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isLastStageAndGame = currentStageIdx === STAGES.length - 1 && currentGameInStage === currentStageConfig.totalGames;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-800 custom-scrollbar">
       
        <button
          onClick={onClose}
          className={`sticky top-0 z-20 text-slate-400 hover:text-slate-600 transition p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 ${lang === 'ar' ? 'float-left' : 'float-right'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3 clear-both">
          <span className="bg-blue-50 text-blue-600 text-[11px] font-black px-3 py-1 rounded-full border border-blue-100 inline-block mb-1">
            {txt.stageName}
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-800">
            {txt.level}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {txt.reward}
          </p>
        </div>

        <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-2.5 rounded-2xl mb-3 border border-slate-100">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div key={s.stage} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isCurrent ? s.stage : <Lock className="w-3 h-3" />}
                </div>
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                  <p className={`text-[10px] font-bold leading-none ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                    {txt.stageShortName(s)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold">{txt.levelsCount(s.totalGames)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold mb-0.5">
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              <span>{txt.timeLeft}</span>
            </div>
            <span className={`text-sm font-black ${timeLeft <= 10 ? 'text-rose-600 animate-ping' : 'text-slate-700'}`}>
              {timeLeft} {txt.seconds}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold mb-0.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span>{txt.attempts}</span>
            </div>
            <span className="text-sm font-black text-slate-700">{moves}</span>
          </div>
        </div>

        <div className={`grid ${currentStageConfig.cols} gap-1.5 bg-slate-100 p-2.5 rounded-2xl border border-slate-200/80 mb-3`}>
          {cards.map((card) => {
            const isRevealed = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="aspect-square relative focus:outline-none"
              >
                <div
                  className={`w-full h-full duration-300 transition-all rounded-xl shadow-sm flex items-center justify-center text-lg font-bold cursor-pointer ${
                    isRevealed
                      ? 'bg-white border-2 border-blue-500 scale-100'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isRevealed ? (
                    <span className="animate-in zoom-in-50">{card.icon}</span>
                  ) : (
                    <span className="text-white/30 text-[10px] font-black">?</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {won && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center space-y-1 mb-3 animate-in zoom-in-95">
            <Trophy className="w-6 h-6 text-emerald-500 mx-auto" />
            <h4 className="font-black text-emerald-900 text-xs sm:text-sm">{txt.wellDone}</h4>
            <p className="text-xs text-emerald-700 font-semibold">
              {txt.pointsAdded(currentStageConfig.pointsPerGame)}
            </p>
          </div>
        )}

        {gameOver && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-center space-y-1 mb-3 animate-in zoom-in-95">
            <h4 className="font-black text-rose-800 text-xs">{txt.timeOut}</h4>
            <p className="text-[11px] text-rose-600">{txt.retryText}</p>
          </div>
        )}

        <div className="flex gap-2">
          {gameOver && (
            <button
              onClick={() => startRound(currentStageIdx)}
              className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{txt.retryBtn}</span>
            </button>
          )}

          {won && (
            <button
              onClick={handleNextGame}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>
                {isLastStageAndGame ? txt.finishAllBtn : txt.nextLevelBtn}
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}