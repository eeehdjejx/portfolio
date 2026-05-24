'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Eye, EyeOff, Coffee, Brain, Timer, BookOpen, Heart, List } from 'lucide-react';
import { format } from 'date-fns';
import { usePomodoroStore, useTaskStore } from '@/lib/store';
import { Category } from '@/lib/types';
import ErrorBoundary from './ErrorBoundary';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; color: string }> = {
  Study: { icon: BookOpen, color: '#ff7a00' },
  Spiritual: { icon: Heart, color: '#a855f7' },
  Normal: { icon: List, color: '#22c55e' },
};

export default function FocusView() {
  const {
    isRunning,
    phase,
    timeLeft,
    workDuration,
    breakDuration,
    currentTask,
    currentCategory,
    currentSubject,
    sessions,
    start,
    pause,
    reset,
    tick,
    setCurrentTask,
    setCurrentCategory,
    setCurrentSubject,
    setWorkDuration,
    setBreakDuration,
    getTodayMinutes,
    getTodayFocusSessions,
  } = usePomodoroStore();

  const { isFocusMode, toggleFocusMode } = useTaskStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const totalSeconds = phase === 'work' ? workDuration * 60 : breakDuration * 60;
  const progress = 1 - timeLeft / totalSeconds;
  const circumference = 2 * Math.PI * 108;
  const strokeDashoffset = circumference * (1 - progress);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter((s) => s.startTime.startsWith(today) && s.completed);
  const totalMinutes = getTodayMinutes();
  const focusData = getTodayFocusSessions();

  const CategoryIcon = CATEGORY_CONFIG[currentCategory].icon;
  const categoryColor = CATEGORY_CONFIG[currentCategory].color;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Focus Mode</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {totalMinutes}m focused · {todaySessions.length} sessions
          </p>
        </div>

        <button
          onClick={toggleFocusMode}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold active:scale-95 ${
            isFocusMode ? 'bg-orange-500/15 border border-orange-500/30' : 'bg-white/5 border border-white/10'
          }`}
          style={{ minHeight: '48px', color: isFocusMode ? '#ff7a00' : 'rgba(255,255,255,0.6)' }}
        >
          {isFocusMode ? <EyeOff size={16} /> : <Eye size={16} />}
          {isFocusMode ? 'Exit' : 'Focus'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pb-6 overflow-auto gap-5">
        {/* Timer Ring */}
        <motion.div
          className="relative mt-2"
          animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="260" height="260" className="-rotate-90">
            <circle cx="130" cy="130" r="108" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
            <circle
              cx="130" cy="130" r="108"
              fill="none"
              stroke={phase === 'work' ? '#ff7a00' : '#22c55e'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: phase === 'work' ? '#ff7a00' : '#22c55e' }}>
              {phase === 'work' ? 'Deep Focus' : 'Break'}
            </div>
            <div
              className="text-6xl font-bold tabular-nums"
              style={{
                color: 'white',
                textShadow: isRunning ? `0 0 30px ${phase === 'work' ? 'rgba(255,122,0,0.5)' : 'rgba(34,197,94,0.5)'}` : 'none',
              }}
            >
              {formatTime(timeLeft)}
            </div>
            {phase === 'work' ? (
              <Brain size={20} className="mt-3 text-white/20" />
            ) : (
              <Coffee size={20} className="mt-3 text-white/20" />
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-95"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minWidth: '48px', minHeight: '48px' }}
          >
            <RotateCcw size={20} className="text-white/50" />
          </button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={isRunning ? pause : start}
            className="w-16 h-16 rounded-full flex items-center justify-center text-black"
            style={{
              background: 'linear-gradient(135deg, #ff7a00, #ff9d45)',
              boxShadow: isRunning ? '0 0 40px rgba(255,122,0,0.4)' : 'none',
              minWidth: '64px',
              minHeight: '64px',
            }}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </motion.button>

          <button
            onClick={toggleFocusMode}
            className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 ${isFocusMode ? 'bg-orange-500/15 border border-orange-500/30' : ''}`}
            style={{
              background: isFocusMode ? undefined : 'rgba(255,255,255,0.05)',
              minWidth: '48px',
              minHeight: '48px',
            }}
          >
            {isFocusMode ? <EyeOff size={20} style={{ color: '#ff7a00' }} /> : <Eye size={20} className="text-white/50" />}
          </button>
        </div>

        {/* Task input */}
        <div className="w-full max-w-sm space-y-3">
          <input
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            placeholder="What are you working on?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500 text-center"
            style={{ minHeight: '48px' }}
          />

          {/* Category selector */}
          <div className="flex gap-2">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const isActive = currentCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCurrentCategory(cat)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium active:scale-95"
                  style={{
                    background: isActive ? `${cfg.color}15` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isActive ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                    color: isActive ? cfg.color : 'rgba(255,255,255,0.5)',
                    minHeight: '48px',
                  }}
                >
                  <Icon size={14} />
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Subject input for Study */}
          {currentCategory === 'Study' && (
            <input
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              placeholder="Subject (e.g. Physics)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500"
              style={{ minHeight: '48px' }}
            />
          )}
        </div>

        {/* Duration settings */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-white/40 mb-2">Focus</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWorkDuration(Math.max(5, workDuration - 5))}
                className="w-10 h-10 rounded-lg text-lg active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px', minHeight: '40px' }}
              >
                −
              </button>
              <span className="flex-1 text-center text-lg font-semibold text-white tabular-nums">{workDuration}m</span>
              <button
                onClick={() => setWorkDuration(Math.min(90, workDuration + 5))}
                className="w-10 h-10 rounded-lg text-lg active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px', minHeight: '40px' }}
              >
                +
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-white/40 mb-2">Break</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBreakDuration(Math.max(1, breakDuration - 1))}
                className="w-10 h-10 rounded-lg text-lg active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px', minHeight: '40px' }}
              >
                −
              </button>
              <span className="flex-1 text-center text-lg font-semibold text-white tabular-nums">{breakDuration}m</span>
              <button
                onClick={() => setBreakDuration(Math.min(30, breakDuration + 1))}
                className="w-10 h-10 rounded-lg text-lg active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px', minHeight: '40px' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Session stats */}
        {todaySessions.length > 0 && (
          <div className="w-full max-w-sm">
            <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">Today's Sessions</p>
            <div className="flex flex-wrap gap-2">
              {todaySessions.slice(-6).map((s, i) => (
                <div
                  key={s.id}
                  className="px-3 py-2 rounded-lg text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.04)', minHeight: '36px' }}
                >
                  <span className="text-white/50">#{i + 1}</span>
                  <span className="text-white/40 mx-1">·</span>
                  <span className="text-white/70">{s.duration}m</span>
                  {s.category && (
                    <span className="ml-1 text-white/30">{s.category}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.97)' }}
          >
            <motion.div
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-center"
            >
              <div className="text-[10px] font-semibold tracking-widest uppercase mb-6" style={{ color: phase === 'work' ? '#ff7a00' : '#22c55e' }}>
                {phase === 'work' ? 'Deep Focus Mode' : 'Break Time'}
              </div>

              <div className="relative inline-block mb-6">
                <svg width="300" height="300" className="-rotate-90">
                  <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                  <circle
                    cx="150" cy="150" r="130"
                    fill="none"
                    stroke={phase === 'work' ? '#ff7a00' : '#22c55e'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 130}
                    strokeDashoffset={2 * Math.PI * 130 * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-7xl font-bold tabular-nums" style={{ color: 'white', textShadow: `0 0 50px ${phase === 'work' ? 'rgba(255,122,0,0.6)' : 'rgba(34,197,94,0.6)'}` }}>
                    {formatTime(timeLeft)}
                  </div>
                  {currentTask && <p className="text-white/30 text-sm mt-4 max-w-48 text-center">{currentTask}</p>}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center">
                <button onClick={reset} className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <RotateCcw size={20} className="text-white/40" />
                </button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={isRunning ? pause : start} className="w-16 h-16 rounded-full flex items-center justify-center text-black" style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)', boxShadow: '0 0 50px rgba(255,122,0,0.4)' }}>
                  {isRunning ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
                </motion.button>
                <button onClick={toggleFocusMode} className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/15 active:scale-90">
                  <EyeOff size={20} style={{ color: '#ff7a00' }} />
                </button>
              </div>

              <p className="text-white/15 text-[10px] mt-8">Tap eye icon to exit</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
