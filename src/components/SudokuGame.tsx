'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, RefreshCw, Zap, Lock, CheckCircle2, Award, Eraser } from 'lucide-react';

interface SudokuGameProps {
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

export default function SudokuGame({ isOpen, onClose, onGameWin, lang = 'ar', gameSettings }: SudokuGameProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentGameInStage, setCurrentGameInStage] = useState(1);

  const [gridSize, setGridSize] = useState<number>(4);
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

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
    title: lang === 'en' ? 'Sudoku Challenge' : 'لغز السودوكو (Sudoku)',
    stageName: lang === 'en' ? currentStageConfig.nameEn : currentStageConfig.nameAr,
    levelInfo: lang === 'en' ? `Level ${currentGameInStage} of ${currentStageConfig.totalGames}` : `المستوى ${currentGameInStage} من ${currentStageConfig.totalGames}`,
    rewardInfo: lang === 'en' ? `Reward: +${currentStageConfig.pointsPerGame} PTS` : `المكافأة: +${currentStageConfig.pointsPerGame} نقاط`,
    levelsCount: (count: number) => lang === 'en' ? `${count} levels` : `${count} مستويات`,
    moves: lang === 'en' ? 'Moves:' : 'الحركات:',
    resetGrid: lang === 'en' ? 'Retry / Reset' : 'إعادة المحاولة',
    erase: lang === 'en' ? 'Erase Cell' : 'مسح الخلية',
    wellDone: lang === 'en' ? 'Awesome! Sudoku solved successfully 🥳' : 'أحسنت! حللت السودوكو بنجاح 🥳',
    pointsAdded: (pts: number) => lang === 'en' ? `+${pts} points added to your balance.` : `تمت إضافة +${pts} نقاط لرصيدك.`,
    nextLevelBtn: lang === 'en' ? 'Next Level →' : 'المستوى التالي ←',
    finishAllBtn: lang === 'en' ? 'Complete All Stages 🏆' : 'إنهاء كافة المستويات والمراحل 🏆',
    stageShortName: (s: typeof STAGES[0]) => lang === 'en' ? s.nameEn.split(' ')[0] : s.nameAr.split(' ')[1],
  };

  const getPuzzleConfig = useCallback((stageIdx: number, gameNum: number) => {
    let size = 9;
    let emptyRatio = 0.3;

    if (stageIdx === 0) {
      if (gameNum <= 3) {
        size = 4;
        emptyRatio = 0.35;
      } else if (gameNum <= 8) {
        size = 6;
        emptyRatio = 0.4;
      } else {
        size = 9;
        emptyRatio = 0.35;
      }
    } else if (stageIdx === 1) {
      size = 9;
      emptyRatio = 0.5;
    } else {
      size = 9;
      emptyRatio = 0.65;
    }

    return { size, emptyRatio };
  }, []);

  const generateSudoku = useCallback((size: number, emptyRatio: number) => {
    const sol: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

    const isValid = (grid: number[][], r: number, c: number, val: number) => {
      for (let i = 0; i < size; i++) {
        if (grid[r][i] === val || grid[i][c] === val) return false;
      }
      const boxWidth = size === 6 ? 3 : size === 4 ? 2 : 3;
      const boxHeight = size === 6 ? 2 : size === 4 ? 2 : 3;
      const startR = Math.floor(r / boxHeight) * boxHeight;
      const startC = Math.floor(c / boxWidth) * boxWidth;

      for (let i = 0; i < boxHeight; i++) {
        for (let j = 0; j < boxWidth; j++) {
          if (grid[startR + i][startC + j] === val) return false;
        }
      }
      return true;
    };

    const fillGrid = (grid: number[][]): boolean => {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 0) {
            const numbers = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
            for (const num of numbers) {
              if (isValid(grid, r, c, num)) {
                grid[r][c] = num;
                if (fillGrid(grid)) return true;
                grid[r][c] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    fillGrid(sol);

    const puzzle = sol.map((row) => [...row]);
    const totalCells = size * size;
    let cellsToRemove = Math.floor(totalCells * emptyRatio);

    while (cellsToRemove > 0) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        cellsToRemove--;
      }
    }

    return { puzzle, sol };
  }, []);

  const startRound = useCallback(
    (stageIdx: number, gameNum: number) => {
      const { size, emptyRatio } = getPuzzleConfig(stageIdx, gameNum);
      const { puzzle, sol } = generateSudoku(size, emptyRatio);

      setGridSize(size);
      setInitialBoard(puzzle.map((row) => [...row]));
      setBoard(puzzle.map((row) => [...row]));
      setSolution(sol);
      setSelectedCell(null);

      setMoves(0);
      setWon(false);
      setIsPlaying(true);
      hasWonRef.current = false;
    },
    [getPuzzleConfig, generateSudoku]
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

  const handleNumberInput = (num: number) => {
    if (!selectedCell || !isPlaying || won) return;
    const [r, c] = selectedCell;

    if (initialBoard[r][c] !== 0) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);
    setMoves((m) => m + 1);

    let isComplete = true;
    let isCorrect = true;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (newBoard[i][j] === 0) {
          isComplete = false;
        } else if (newBoard[i][j] !== solution[i][j]) {
          isCorrect = false;
        }
      }
    }

    if (isComplete && isCorrect) {
      setIsPlaying(false);
      setWon(true);
    }
  };

  const handleErase = () => {
    if (!selectedCell || !isPlaying || won) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = 0;
    setBoard(newBoard);
  };

  const handleResetPuzzle = () => {
    setBoard(initialBoard.map((row) => [...row]));
    setSelectedCell(null);
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
    currentStageIdx === STAGES.length - 1 && currentGameInStage === currentStageConfig.totalGames;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-800 custom-scrollbar">
       
        <button
          onClick={onClose}
          className={`sticky top-0 z-20 text-slate-400 hover:text-slate-600 transition p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 ${
            lang === 'ar' ? 'float-left' : 'float-right'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3 clear-both">
          <span className="bg-rose-50 text-rose-600 text-[11px] font-black px-3 py-1 rounded-full border border-rose-100 inline-block mb-1">
            {txt.stageName} ({gridSize}x{gridSize})
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-800">
            {txt.levelInfo}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            <span className="font-bold text-amber-600">{txt.rewardInfo}</span>
          </p>
        </div>

        <div className="flex justify-between items-center bg-slate-50 p-2 sm:p-2.5 rounded-2xl mb-3 border border-slate-100">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div key={s.stage} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isCurrent ? s.stage : <Lock className="w-3 h-3" />}
                </div>
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                  <p className={`text-[10px] font-bold leading-none ${isCurrent ? 'text-rose-600' : 'text-slate-400'}`}>
                    {txt.stageShortName(s)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold">{txt.levelsCount(s.totalGames)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl mb-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
            <Zap className="w-4 h-4 text-rose-500" />
            <span>{txt.moves} <strong className="text-slate-800 font-black">{moves}</strong></span>
          </div>

          <button
            onClick={handleResetPuzzle}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{txt.resetGrid}</span>
          </button>
        </div>

        <div className="flex justify-center mb-3">
          <div
            className="grid gap-0.5 bg-slate-400 p-1 rounded-2xl border-2 border-slate-500 max-w-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {board.map((row, r) =>
              row.map((val, c) => {
                const isInitial = initialBoard[r][c] !== 0;
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isError = val !== 0 && !isInitial && val !== solution[r][c];

                const boxW = gridSize === 6 ? 3 : gridSize === 4 ? 2 : 3;
                const boxH = gridSize === 6 ? 2 : gridSize === 4 ? 2 : 3;
               
                const borderSide = lang === 'ar'
                  ? ((c + 1) % boxW === 0 && c < gridSize - 1 ? 'border-l-2 border-l-slate-600' : '')
                  : ((c + 1) % boxW === 0 && c < gridSize - 1 ? 'border-r-2 border-r-slate-600' : '');
                const borderBottom = (r + 1) % boxH === 0 && r < gridSize - 1 ? 'border-b-2 border-b-slate-600' : '';

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSelectedCell([r, c])}
                    className={`w-7 h-7 sm:w-9 sm:h-9 text-xs sm:text-sm font-black transition-all flex items-center justify-center ${borderSide} ${borderBottom} ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-md z-10'
                        : isInitial
                        ? 'bg-slate-200 text-slate-800 cursor-not-allowed'
                        : isError
                        ? 'bg-rose-100 text-rose-600 font-bold'
                        : val !== 0
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {val !== 0 ? val : ''}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-center items-center gap-1 mb-3 flex-wrap">
          {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white font-black text-xs sm:text-sm text-slate-700 transition shadow-sm border border-slate-200 active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleErase}
            title={txt.erase}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 transition flex items-center justify-center border border-slate-200 active:scale-95"
          >
            <Eraser className="w-4 h-4" />
          </button>
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

        {won && (
          <div className="mt-2 pb-2">
            <button
              onClick={handleNextGame}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5"
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