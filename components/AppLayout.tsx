'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, List, Timer, Target, Sparkles, Quote } from 'lucide-react';
import { useUIStore, useTaskStore, usePomodoroStore } from '@/lib/store';
import { TabId } from '@/lib/types';
import DashboardView from './DashboardView';
import TasksView from './CalendarView';
import FocusView from './PomodoroView';
import HabitsView from './HabitsView';
import AIView from './AIView';
import QuotesView from './QuotesView';
import BrainDump from './BrainDump';
import ErrorBoundary from './ErrorBoundary';

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', Icon: List },
  { id: 'focus', label: 'Focus', Icon: Timer },
  { id: 'habits', label: 'Habits', Icon: Target },
  { id: 'ai', label: 'AI', Icon: Sparkles },
  { id: 'quotes', label: 'Quotes', Icon: Quote },
];

const VIEWS: Record<TabId, React.ReactNode> = {
  dashboard: <DashboardView />,
  tasks: <TasksView />,
  focus: <FocusView />,
  habits: <HabitsView />,
  ai: <AIView />,
  quotes: <QuotesView />,
};

export default function AppLayout() {
  const { activeTab, setActiveTab } = useUIStore();
  const { isFocusMode } = useTaskStore();
  const { isRunning, phase, timeLeft } = usePomodoroStore();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden relative">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,122,0,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-2 flex items-center justify-between relative z-10 transition-all duration-300"
        style={{ opacity: isFocusMode ? 0.3 : 1, filter: isFocusMode ? 'blur(4px)' : 'none' }}
      >
        <div>
          <h2 className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Elshaikh</h2>
          <h1 className="text-base font-bold leading-none" style={{ color: '#ff7a00' }}>Study Point</h1>
        </div>

        {/* Timer badge */}
        {(isRunning || timeLeft > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: isRunning
                ? phase === 'work'
                  ? 'rgba(255,122,0,0.15)'
                  : 'rgba(34,197,94,0.12)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isRunning ? (phase === 'work' ? 'rgba(255,122,0,0.3)' : 'rgba(34,197,94,0.3)') : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {isRunning && (
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: phase === 'work' ? '#ff7a00' : '#22c55e' }}
              />
            )}
            <Timer size={12} className="text-white/50" />
            <span
              className="text-xs font-mono font-semibold tabular-nums"
              style={{
                color: isRunning
                  ? phase === 'work'
                    ? '#ff7a00'
                    : '#22c55e'
                  : 'rgba(255,255,255,0.5)',
              }}
            >
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-hidden relative transition-all duration-300"
        style={{ opacity: isFocusMode ? 0.2 : 1, filter: isFocusMode ? 'blur(8px)' : 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 overflow-hidden flex flex-col"
            style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
          >
            <ErrorBoundary>
              {VIEWS[activeTab]}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div
        className="flex-shrink-0 relative z-20 transition-all duration-300"
        style={{ opacity: isFocusMode ? 0.15 : 1, filter: isFocusMode ? 'blur(4px)' : 'none' }}
      >
        <div className="mx-3 mb-3 p-1.5 rounded-2xl" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl relative active:scale-95"
                  style={{ minHeight: '52px', pointerEvents: isFocusMode ? 'none' : 'auto' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'rgba(255,122,0,0.1)',
                        border: '1px solid rgba(255,122,0,0.2)',
                      }}
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    />
                  )}
                  <Icon
                    size={18}
                    className="relative z-10"
                    style={{ color: isActive ? '#ff7a00' : 'rgba(255,255,255,0.3)' }}
                  />
                  <span
                    className="text-[9px] font-medium relative z-10"
                    style={{ color: isActive ? '#ff7a00' : 'rgba(255,255,255,0.25)' }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brain Dump FAB */}
      <AnimatePresence>
        {!isFocusMode && <BrainDump />}
      </AnimatePresence>
    </div>
  );
}
