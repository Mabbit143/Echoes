import React, { useState, useEffect } from 'react';
import { History, Play, Pause, RotateCcw, Eye, Compass, Calendar } from 'lucide-react';

interface TimeTravelSliderProps {
  currentYear: number;
  minYear?: number;
  maxYear?: number;
  onChangeYear: (year: number) => void;
  visibleCount: number;
  totalCount: number;
  isHistoricalMode: boolean;
  onToggleHistoricalMode: (val: boolean) => void;
}

const MILESTONES = [
  { year: 1846, label: '1846: Pioneer Founding' },
  { year: 1892, label: '1892: Timber & Orchard' },
  { year: 1902, label: '1902: Rail & Depot' },
  { year: 1975, label: '1975: Pre & The Pipe' },
  { year: 2014, label: '2014: Simpsons Art' },
  { year: 2026, label: '2026: Living Present' },
];

export const TimeTravelSlider: React.FC<TimeTravelSliderProps> = ({
  currentYear,
  minYear = 1840,
  maxYear = 2026,
  onChangeYear,
  visibleCount,
  totalCount,
  isHistoricalMode,
  onToggleHistoricalMode,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (currentYear >= maxYear) {
        setIsPlaying(false);
      } else {
        onChangeYear(Math.min(maxYear, currentYear + 5));
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isPlaying, currentYear, maxYear, onChangeYear]);

  // Current era description
  const activeMilestone =
    MILESTONES.slice()
      .reverse()
      .find((m) => currentYear >= m.year) || MILESTONES[0];

  return (
    <div
      className={`border backdrop-blur-xl rounded-2xl p-3 sm:p-3.5 shadow-2xl text-slate-100 max-w-2xl mx-auto w-full transition-all duration-300 ${
        isHistoricalMode
          ? 'bg-amber-950/90 border-amber-600/70 shadow-[0_0_30px_rgba(217,119,6,0.25)]'
          : 'bg-slate-900/90 border-slate-700/80'
      }`}
    >
      {/* Top status bar & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-2 mb-2">
        {/* Era status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center border font-bold transition-colors ${
              isHistoricalMode
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-amber-400 border-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">Time Travel:</span>
              <span className="font-mono text-amber-300 text-sm font-black">{currentYear}</span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              {activeMilestone.label}
            </span>
          </div>
        </div>

        {/* View Mode Toggle: Historical Archival vs Current Living Map */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                onToggleHistoricalMode(true);
                if (currentYear > 1980) onChangeYear(1892);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                isHistoricalMode
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <span>📜 Historical View</span>
            </button>

            <button
              onClick={() => {
                onToggleHistoricalMode(false);
                onChangeYear(2026);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                !isHistoricalMode
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <span>🌐 Current View</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {visibleCount}/{totalCount} Echoes
          </span>

          {/* Time Lapse Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg border transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={isPlaying ? 'Pause Time Lapse' : 'Play Time-Lapse Evolution'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              onChangeYear(maxYear);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white"
            title="Reset to Present Day"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="relative py-1">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={currentYear}
          onChange={(e) => {
            setIsPlaying(false);
            onChangeYear(Number(e.target.value));
          }}
          className={`w-full h-2 rounded-lg cursor-pointer ${
            isHistoricalMode ? 'accent-amber-400 bg-amber-950/60' : 'accent-cyan-400 bg-slate-800'
          }`}
        />

        {/* Milestone Marks */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 select-none">
          {MILESTONES.map((m) => (
            <button
              key={m.year}
              onClick={() => {
                setIsPlaying(false);
                onChangeYear(m.year);
              }}
              className={`hover:text-amber-300 transition-colors ${
                currentYear >= m.year ? 'text-amber-400 font-bold' : 'text-slate-500'
              }`}
            >
              {m.year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
