'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, RefreshCw, Zap, Lock, CheckCircle2, Award, HelpCircle, Crown } from 'lucide-react';

interface ShikakuGameProps {
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

interface NumberHint {
  r: number;
  c: number;
  value: number;
}

interface Region {
  id: number;
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  hintR: number;
  hintC: number;
  targetValue: number;
  colorIdx: number;
}

const PALETTES = [
  { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-700' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-800' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-700' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-700' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-800' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-800' },
];

export default function ShikakuGame({ isOpen, onClose, onGameWin, lang = 'ar', gameSettings }: ShikakuGameProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentGameInStage, setCurrentGameInStage] = useState(1);

  const [gridSize, setGridSize] = useState(4);
  const [hints, setHints] = useState<NumberHint[]>([]);
  const [userRegions, setUserRegions] = useState<Region[]>([]);

  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [won, setWon] = useState(false);

  const STAGES = [
    { stage: 1, nameAr: 'المرحلة السهلة', nameEn: 'Easy Stage', pointsPerGame: gameSettings?.easyPoints ?? 2, totalGames: 15 },
    { stage: 2, nameAr: 'المرحلة المتوسطة', nameEn: 'Medium Stage', pointsPerGame: gameSettings?.mediumPoints ?? 5, totalGames: 10 },
    { stage: 3, nameAr: 'المرحلة الصعبة', nameEn: 'Hard Stage', pointsPerGame: gameSettings?.hardPoints ?? 10, totalGames: 5 },
  ];

  const currentStageConfig = STAGES[currentStageIdx];
  const hasWonRef = useRef(false);

  const txt = {
    title: lang === 'en' ? 'Shikaku Puzzle' : 'لغز المستطيلات (Shikaku)',
    stageName: lang === 'en' ? currentStageConfig.nameEn : currentStageConfig.nameAr,
    levelInfo: lang === 'en' ? `Level ${currentGameInStage} of ${currentStageConfig.totalGames}` : `المستوى ${currentGameInStage} من ${currentStageConfig.totalGames}`,
    rewardInfo: lang === 'en' ? `Reward: +${currentStageConfig.pointsPerGame} PTS` : `المكافأة: +${currentStageConfig.pointsPerGame} نقاط`,
    levelsCount: (count: number) => lang === 'en' ? `${count} levels` : `${count} مراحل`,
    instruction: lang === 'en' ? 'Drag to form a rectangle covering a number equal to its area!' : 'اسحب لتحديد مستطيل يحوي رقماً يطابق مساحته بالضبط!',
    moves: lang === 'en' ? 'Moves:' : 'الحركات:',
    resetGrid: lang === 'en' ? 'Reset Grid' : 'إعادة اللوحة',
    wellDone: lang === 'en' ? 'Great job! Puzzle solved successfully 👑' : 'ممتاز! أكملت تقسيم اللوحة بنجاح 👑',
    pointsAdded: (pts: number) => lang === 'en' ? `+${pts} points added to your balance.` : `تم إضافة +${pts} نقاط لرصيدك.`,
    nextLevelBtn: lang === 'en' ? 'Next Level →' : 'المستوى التالي ←',
    finishAllBtn: lang === 'en' ? 'Complete All Stages 🏆' : 'إنهاء كافة المراحل والتحديات 🏆',
    stageShortName: (s: typeof STAGES[0]) => lang === 'en' ? s.nameEn : s.nameAr,
  };

  const generatePuzzle = useCallback((stageIdx: number, gameNum: number) => {
    let size = 4;
    if (stageIdx === 0) {
      size = gameNum <= 5 ? 4 : 5;
    } else if (stageIdx === 1) {
      size = 6;
    } else {
      size = 8;
    }

    interface Rect {
      r1: number;
      c1: number;
      r2: number;
      c2: number;
    }

    const rects: Rect[] = [{ r1: 0, c1: 0, r2: size - 1, c2: size - 1 }];
    const targetRectCount = size === 4 ? 4 : size === 5 ? 6 : size === 6 ? 7 : 9;

    let attempts = 0;
    while (rects.length < targetRectCount && attempts < 100) {
      attempts++;
      rects.sort((a, b) => (b.r2 - b.r1 + 1) * (b.c2 - b.c1 + 1) - (a.r2 - a.r1 + 1) * (a.c2 - a.c1 + 1));
      const target = rects[0];
      const height = target.r2 - target.r1 + 1;
      const width = target.c2 - target.c1 + 1;

      if (height <= 1 && width <= 1) break;

      const splitHorizontally = height > 1 && (width <= 1 || Math.random() > 0.5);

      if (splitHorizontally) {
        const splitR = Math.floor(Math.random() * (height - 1)) + target.r1;
        const rectA: Rect = { ...target, r2: splitR };
        const rectB: Rect = { ...target, r1: splitR + 1 };
        rects.splice(0, 1, rectA, rectB);
      } else {
        const splitC = Math.floor(Math.random() * (width - 1)) + target.c1;
        const rectA: Rect = { ...target, c2: splitC };
        const rectB: Rect = { ...target, c1: splitC + 1 };
        rects.splice(0, 1, rectA, rectB);
      }
    }

    const generatedHints: NumberHint[] = rects.map((rect) => {
      const area = (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1);
      const hintR = Math.floor(Math.random() * (rect.r2 - rect.r1 + 1)) + rect.r1;
      const hintC = Math.floor(Math.random() * (rect.c2 - rect.c1 + 1)) + rect.c1;
      return { r: hintR, c: hintC, value: area };
    });

    return { size, hints: generatedHints };
  }, []);

  const startRound = useCallback(
    (stageIdx: number, gameNum: number) => {
      const { size, hints: newHints } = generatePuzzle(stageIdx, gameNum);

      setGridSize(size);
      setHints(newHints);
      setUserRegions([]);
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsDragging(false);

      setMoves(0);
      setWon(false);
      setIsPlaying(true);
      hasWonRef.current = false;
    },
    [generatePuzzle]
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startRound(0, 1);
        setCurrentStageIdx(0);
        setCurrentGameInStage(1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, startRound]);

  useEffect(() => {
    if (won && !hasWonRef.current) {
      hasWonRef.current = true;
      onGameWin(100, currentStageConfig.pointsPerGame);
    }
  }, [won, currentStageConfig.pointsPerGame, onGameWin]);

  const checkWinCondition = (regions: Region[]) => {
    const totalCells = gridSize * gridSize;
    let coveredCells = 0;

    regions.forEach((reg) => {
      coveredCells += (reg.r2 - reg.r1 + 1) * (reg.c2 - reg.c1 + 1);
    });

    if (coveredCells !== totalCells) return false;

    for (const reg of regions) {
      const area = (reg.r2 - reg.r1 + 1) * (reg.c2 - reg.c1 + 1);
      if (area !== reg.targetValue) return false;

      if (
        reg.hintR < reg.r1 ||
        reg.hintR > reg.r2 ||
        reg.hintC < reg.c1 ||
        reg.hintC > reg.c2
      ) {
        return false;
      }
    }

    return true;
  };

  const handleTouchStart = (r: number, c: number, e: React.TouchEvent | React.MouseEvent) => {
    if (!isPlaying || won) return;
    e.preventDefault();
    setIsDragging(true);
    setSelectionStart([r, c]);
    setSelectionEnd([r, c]);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    // الحصول على الإحداثيات الحالية لمكان الإصبع/الماوس على الشاشة
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.hasAttribute('data-row') && element.hasAttribute('data-col')) {
      const r = parseInt(element.getAttribute('data-row') || '0', 10);
      const c = parseInt(element.getAttribute('data-col') || '0', 10);
      setSelectionEnd([r, c]);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !selectionStart || !selectionEnd) {
      setIsDragging(false);
      return;
    }

    setIsDragging(false);

    const r1 = Math.min(selectionStart[0], selectionEnd[0]);
    const r2 = Math.max(selectionStart[0], selectionEnd[0]);
    const c1 = Math.min(selectionStart[1], selectionEnd[1]);
    const c2 = Math.max(selectionStart[1], selectionEnd[1]);

    const hintsInside = hints.filter(
      (h) => h.r >= r1 && h.r <= r2 && h.c >= c1 && h.c <= c2
    );

    if (hintsInside.length === 1) {
      const hint = hintsInside[0];
      const newRegion: Region = {
        id: Date.now(),
        r1,
        c1,
        r2,
        c2,
        hintR: hint.r,
        hintC: hint.c,
        targetValue: hint.value,
        colorIdx: userRegions.length % PALETTES.length,
      };

      const filteredRegions = userRegions.filter((reg) => {
        return reg.r2 < r1 || reg.r1 > r2 || reg.c2 < c1 || reg.c1 > c2;
      });

      const updated = [...filteredRegions, newRegion];
      setUserRegions(updated);
      setMoves((m) => m + 1);

      if (checkWinCondition(updated)) {
        setIsPlaying(false);
        setWon(true);
      }
    }

    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleResetPuzzle = () => {
    setUserRegions([]);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleNextGame = () => {
    if (currentGameInStage < currentStageConfig.totalGames) {
      const nextGame = currentGameInStage + 1;
      setCurrentGameInStage(nextGame);
      startRound(currentStageIdx, nextGame);
    } else if (currentStageIdx < STAGES.length - 1) {
      const nextStage = currentStageIdx + 1;
      setCurrentStageIdx(nextStage);
      setCurrentGameInStage(1);
      startRound(nextStage, 1);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isLastStageAndGame =
    currentStageIdx === STAGES.length - 1 &&
    currentGameInStage === currentStageConfig.totalGames;

  const isCellInSelection = (r: number, c: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const r1 = Math.min(selectionStart[0], selectionEnd[0]);
    const r2 = Math.max(selectionStart[0], selectionEnd[0]);
    const c1 = Math.min(selectionStart[1], selectionEnd[1]);
    const c2 = Math.max(selectionStart[1], selectionEnd[1]);
    return r >= r1 && r <= r2 && c >= c1 && c <= c2;
  };

  const getCellRegion = (r: number, c: number) => {
    return userRegions.find(
      (reg) => r >= reg.r1 && r <= reg.r2 && c >= reg.c1 && c <= reg.c2
    );
  };

  let selectionAreaInfo = '';
  if (selectionStart && selectionEnd) {
    const rows = Math.abs(selectionEnd[0] - selectionStart[0]) + 1;
    const cols = Math.abs(selectionEnd[1] - selectionStart[1]) + 1;
    selectionAreaInfo = `${rows} × ${cols} (${rows * cols})`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className={`absolute top-4 z-20 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 ${
            lang === 'ar' ? 'left-4' : 'right-4'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3.5 py-1 rounded-full mb-1.5 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-black">
              {txt.stageName} ({gridSize}x{gridSize})
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {txt.title}
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {txt.levelInfo} • <span className="text-amber-600 font-black">{txt.rewardInfo}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl mb-3 border border-slate-100">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div
                key={s.stage}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-white shadow-sm border border-purple-200 ring-2 ring-purple-500/10'
                    : 'opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isCurrent ? s.stage : <Lock className="w-3 h-3" />}
                </div>
                <div className={lang === 'ar' ? 'text-right overflow-hidden' : 'text-left overflow-hidden'}>
                  <p className={`text-[10px] font-black truncate ${isCurrent ? 'text-purple-900' : 'text-slate-600'}`}>
                    {txt.stageShortName(s)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold">{txt.levelsCount(s.totalGames)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-2xl mb-3 text-xs text-purple-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-bold">{txt.instruction}</span>
          </div>
          {selectionAreaInfo && (
            <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 animate-pulse shadow-sm">
              {selectionAreaInfo}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-2xl mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{txt.moves} <strong className="text-slate-900 font-black text-sm">{moves}</strong></span>
          </div>

          <button
            onClick={handleResetPuzzle}
            className="text-xs font-bold text-slate-600 hover:text-purple-700 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl transition hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{txt.resetGrid}</span>
          </button>
        </div>

        <div className="flex justify-center mb-3 select-none touch-none">
          <div
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            className="grid gap-1.5 bg-slate-100 p-2 rounded-3xl border border-slate-200 shadow-inner max-w-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              width: `${gridSize * 48}px`,
            }}
          >
            {Array.from({ length: gridSize }).map((_, r) =>
              Array.from({ length: gridSize }).map((_, c) => {
                const hint = hints.find((h) => h.r === r && h.c === c);
                const region = getCellRegion(r, c);
                const selected = isCellInSelection(r, c);

                let cellStyle = 'bg-white text-slate-800 border-slate-200 hover:border-purple-300';

                if (region) {
                  const palette = PALETTES[region.colorIdx % PALETTES.length];
                  cellStyle = `${palette.bg} ${palette.border} ${palette.text} font-black border-2`;
                } else if (selected) {
                  cellStyle = 'bg-purple-600 text-white border-purple-700 font-black shadow-md scale-95';
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    data-row={r}
                    data-col={c}
                    onTouchStart={(e) => handleTouchStart(r, c, e)}
                    onMouseDown={(e) => handleTouchStart(r, c, e)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center transition-all duration-150 cursor-pointer border ${cellStyle}`}
                  >
                    {hint ? (
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center pointer-events-none ${region ? '' : 'bg-slate-50 text-slate-900 shadow-2xs border border-slate-200'}`}>
                        {hint.value}
                      </span>
                    ) : ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {won && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-center space-y-1.5 animate-in zoom-in-95">
            <Trophy className="w-7 h-7 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-black text-emerald-950 text-sm sm:text-base">{txt.wellDone}</h4>
            <p className="text-xs text-emerald-700 font-bold">
              {txt.pointsAdded(currentStageConfig.pointsPerGame)}
            </p>
            <button
              onClick={handleNextGame}
              className="w-full mt-1.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>
                {isLastStageAndGame ? txt.finishAllBtn : txt.nextLevelBtn}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}