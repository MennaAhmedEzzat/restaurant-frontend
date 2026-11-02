'use client';

import { useState, useEffect, useCallback } from 'react';
import { Crown, RotateCcw, HelpCircle, CheckCircle2 } from 'lucide-react';

interface KingsGameProps {
  isOpen: boolean;
  onClose: () => void;
  onGameWin: (score: number, points: number) => void;
  lang: 'ar' | 'en';
  pointsPerWin?: number;
}

interface LevelConfig {
  id: number;
  size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  regions: number[][];
}

const REGION_COLORS = [
  'bg-amber-200/90 border-amber-300 text-amber-900',
  'bg-purple-200/80 border-purple-300 text-purple-900',
  'bg-sky-200/80 border-sky-300 text-sky-900',
  'bg-emerald-200/80 border-emerald-300 text-emerald-900',
  'bg-rose-200/80 border-rose-300 text-rose-900',
  'bg-indigo-200/80 border-indigo-300 text-indigo-900',
  'bg-orange-200/80 border-orange-300 text-orange-900',
];

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    size: 5,
    difficulty: 'easy',
    regions: [
      [1, 1, 1, 1, 0],
      [1, 1, 2, 2, 2],
      [3, 3, 2, 2, 2],
      [3, 3, 4, 4, 2],
      [3, 3, 4, 4, 4],
    ],
  },
  {
    id: 2,
    size: 5,
    difficulty: 'easy',
    regions: [
      [1, 1, 1, 2, 2],
      [1, 1, 2, 2, 2],
      [3, 3, 0, 2, 2],
      [3, 3, 4, 4, 2],
      [3, 4, 4, 4, 4],
    ],
  },
  {
    id: 3,
    size: 5,
    difficulty: 'easy',
    regions: [
      [0, 1, 1, 2, 2],
      [3, 1, 1, 2, 2],
      [3, 3, 1, 2, 2],
      [3, 3, 4, 4, 2],
      [3, 4, 4, 4, 4],
    ],
  },
  {
    id: 4,
    size: 6,
    difficulty: 'medium',
    regions: [
      [1, 1, 1, 1, 1, 0],
      [1, 2, 2, 3, 3, 3],
      [1, 2, 2, 3, 3, 3],
      [4, 4, 2, 3, 5, 5],
      [4, 4, 5, 5, 5, 5],
      [4, 4, 5, 5, 5, 5],
    ],
  },
  {
    id: 5,
    size: 6,
    difficulty: 'medium',
    regions: [
      [1, 1, 2, 2, 2, 2],
      [1, 1, 2, 0, 3, 3],
      [4, 1, 2, 3, 3, 3],
      [4, 4, 5, 5, 3, 3],
      [4, 4, 5, 5, 5, 3],
      [4, 4, 5, 5, 5, 5],
    ],
  },
  {
    id: 6,
    size: 7,
    difficulty: 'hard',
    regions: [
      [1, 1, 1, 2, 2, 2, 0],
      [1, 1, 1, 2, 2, 2, 3],
      [4, 4, 1, 2, 3, 3, 3],
      [4, 4, 5, 5, 3, 3, 3],
      [4, 6, 5, 5, 5, 3, 3],
      [6, 6, 6, 5, 5, 5, 3],
      [6, 6, 6, 6, 5, 5, 5],
    ],
  },
];

type CellState = 'empty' | 'king' | 'cross';

export default function KingsGame({ isOpen, onClose, onGameWin, lang, pointsPerWin = 25 }: KingsGameProps) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const currentLevel = LEVELS[currentLevelIdx];
  const size = currentLevel.size;

  const [board, setBoard] = useState<CellState[][]>(() =>
    Array(size)
      .fill(null)
      .map(() => Array(size).fill('empty'))
  );
  const [isWin, setIsWin] = useState(false);

  const recalculateBoard = useCallback(
    (kingsPositions: [number, number][]) => {
      const newBoard: CellState[][] = Array(size)
        .fill(null)
        .map(() => Array(size).fill('empty'));

      kingsPositions.forEach(([r, c]) => {
        newBoard[r][c] = 'king';
      });

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (newBoard[r][c] === 'king') continue;

          const isBlocked = kingsPositions.some(([kr, kc]) => {
            const sameRow = r === kr;
            const sameCol = c === kc;
            const sameRegion = currentLevel.regions[r][c] === currentLevel.regions[kr][kc];
            return sameRow || sameCol || sameRegion;
          });

          if (isBlocked) {
            newBoard[r][c] = 'cross';
          }
        }
      }

      return newBoard;
    },
    [size, currentLevel]
  );

  const resetBoard = useCallback(() => {
    const emptyBoard = recalculateBoard([]);
    setBoard(emptyBoard);
    setIsWin(false);
  }, [recalculateBoard]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        resetBoard();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentLevelIdx, resetBoard]);

  if (!isOpen) return null;

  const getKings = (currentBoard: CellState[][]): [number, number][] => {
    const kings: [number, number][] = [];
    if (!currentBoard || currentBoard.length === 0) return kings;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentBoard[r]?.[c] === 'king') {
          kings.push([r, c]);
        }
      }
    }
    return kings;
  };

  const currentKings = getKings(board);

  const handleCellClick = (r: number, c: number) => {
    if (isWin) return;

    let updatedKings: [number, number][];

    if (board[r][c] === 'king') {
      updatedKings = currentKings.filter(([kr, kc]) => !(kr === r && kc === c));
    } else {
      updatedKings = [...currentKings, [r, c]];
    }

    const newBoard = recalculateBoard(updatedKings);
    setBoard(newBoard);
    checkSolution(updatedKings);
  };

  const checkSolution = (kings: [number, number][]) => {
    if (kings.length !== size) return;

    const rows = new Set(kings.map(([r]) => r));
    if (rows.size !== size) return;

    const cols = new Set(kings.map(([, c]) => c));
    if (cols.size !== size) return;

    const regions = new Set(kings.map(([r, c]) => currentLevel.regions[r][c]));
    if (regions.size !== size) return;

    for (let i = 0; i < kings.length; i++) {
      for (let j = i + 1; j < kings.length; j++) {
        const [r1, c1] = kings[i];
        const [r2, c2] = kings[j];
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return;
      }
    }

    setIsWin(true);
    onGameWin(100, pointsPerWin);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-hidden"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-lg bg-white/95 border border-white/90 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-blue-950/20 max-h-[92vh] overflow-y-auto custom-scrollbar">
       
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10 -mt-2 pt-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {lang === 'ar'
                ? `المستوى ${currentLevel.id} (مكافأة الفوز: +${pointsPerWin} نقطة)`
                : `Level ${currentLevel.id} (+${pointsPerWin} PTS)`}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              👑 {lang === 'ar' ? 'تحدي الملوك (Kings Puzzle)' : 'Kings Puzzle'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <div className="my-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {lang === 'ar'
              ? 'انقر على المربع لوضع الملك. يتم استبعاد الصف والعمود والمنطقة المحيطة تلقائياً. ابدأ بالمنطقة ذات المربع الواحد!'
              : 'Click a cell to place a king. The row, column, and region will be auto-marked. Start with the single-tile region!'}
          </span>
        </div>

        <div className="flex items-center justify-between my-3">
          <div className="text-sm font-bold text-slate-700">
            {lang === 'ar' ? 'الملوك الموضوعة:' : 'Kings Placed:'}{' '}
            <span className={currentKings.length === size ? 'text-amber-600' : 'text-blue-600'}>
              {currentKings.length} / {size}
            </span>
          </div>
        </div>

        <div className="flex justify-center my-4">
          <div
            className="grid gap-1.5 p-2 bg-slate-800 rounded-2xl shadow-inner border-2 border-slate-700"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '360px',
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const regionId = currentLevel.regions[r][c];
                const colorStyle = REGION_COLORS[regionId % REGION_COLORS.length];

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-200 shadow-sm border ${colorStyle} hover:brightness-95 active:scale-95 relative`}
                  >
                    {cell === 'king' && (
                      <Crown className="w-6 h-6 text-amber-600 drop-shadow animate-bounce" />
                    )}
                    {cell === 'cross' && (
                      <span className="text-slate-500/60 font-black text-lg select-none">✕</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {isWin ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>
                {lang === 'ar'
                  ? `أحسنت! فزت بـ ${pointsPerWin} نقطة`
                  : `Awesome! You won ${pointsPerWin} PTS`}
              </span>
            </div>
            <div className="flex gap-2 justify-center">
              {currentLevelIdx < LEVELS.length - 1 ? (
                <button
                  onClick={() => setCurrentLevelIdx((prev) => prev + 1)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {lang === 'ar' ? 'المستوى التالي ➔' : 'Next Level ➔'}
                </button>
              ) : (
                <button
                  onClick={resetBoard}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {lang === 'ar' ? 'لعب المستوى مجدداً' : 'Replay Level'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={resetBoard}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}