'use client';

import { useState } from 'react';
import KingsGame from '@/components/KingsGame';
import ShikakuGame from '@/components/ShikakuGame';

export default function GamesHubPage() {
  const [activeGame, setActiveGame] = useState<'kings' | 'shikaku' | null>(null);
  const [userPoints, setUserPoints] = useState(120);
  const [userLevel, setUserLevel] = useState(3);

  const handleGameWin = (score: number, points: number) => {
    setUserPoints((prev) => prev + points);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8" dir="rtl">
      {/* Header & Stats Bar */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-2xl">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
              🎮 مركز الألعاب والتمارين الذكية
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              دربي عقلك يومياً، اجمعي النقاط، وارتقي في المستويات!
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl">
            <div className="text-center">
              <span className="block text-xs text-slate-400 font-bold">المستوى</span>
              <span className="text-xl font-black text-purple-400">Level {userLevel}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <span className="block text-xs text-slate-400 font-bold">مجموع النقاط</span>
              <span className="text-xl font-black text-amber-400">🪙 {userPoints}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Games */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kings Game Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:glow-amber group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition">
              👑
            </div>
            <h2 className="text-xl font-black text-white mb-2">لعبة Kings / Queens</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              ضعي الملوك في الأقاليم الملونة بدون أن يلمس بعضهم بعضاً. أنماط ملونة متجددة وعشوائية في كل جيم!
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
              <span>المكافأة: <strong className="text-amber-400">+17 نقطة</strong></span>
              <span>الصعوبة: <strong className="text-rose-400">متوسط</strong></span>
            </div>
            <button
              onClick={() => setActiveGame('kings')}
              className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-black py-3 rounded-2xl shadow-lg transition"
            >
              🚀 ابدأ اللعب
            </button>
          </div>
        </div>

        {/* Shikaku Game Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:glow-teal group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition">
              🧩
            </div>
            <h2 className="text-xl font-black text-white mb-2">شيكاكو الاحترافية (Shikaku)</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              قسمي الرقعة إلى مستطيلات ومربعات متناسبة مع أرقام المساحة على نمط تطبيق Almanac العالمي.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
              <span>المكافأة: <strong className="text-teal-400">+25 نقطة</strong></span>
              <span>الصعوبة: <strong className="text-amber-400">ذكاء عالي</strong></span>
            </div>
            <button
              onClick={() => setActiveGame('shikaku')}
              className="w-full bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-slate-950 font-black py-3 rounded-2xl shadow-lg transition"
            >
              🚀 ابدأ اللعب
            </button>
          </div>
        </div>
      </div>

      {/* Modals for Active Games */}
      <KingsGame
        isOpen={activeGame === 'kings'}
        onClose={() => setActiveGame(null)}
        onGameWin={handleGameWin}
      />

      <ShikakuGame
        isOpen={activeGame === 'shikaku'}
        onClose={() => setActiveGame(null)}
        onGameWin={handleGameWin}
      />
    </div>
  );
}