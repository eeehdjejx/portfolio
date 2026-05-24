'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, addDays, parseISO, isToday } from 'date-fns';
import { BookOpen, Pen, Brain, CheckCircle2, Timer, TrendingUp, Calendar, Flame, Heart, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTaskStore, usePomodoroStore, useHabitStore, useUIStore } from '@/lib/store';
import { TaskType, Category } from '@/lib/types';
import ErrorBoundary from './ErrorBoundary';

const TYPE_ICONS: Record<TaskType, { Icon: React.ElementType; color: string; label: string }> = {
  Explain: { Icon: BookOpen, color: '#3b82f6', label: 'Read/Watch' },
  Solve: { Icon: Pen, color: '#22c55e', label: 'Practice' },
  Review: { Icon: Brain, color: '#a855f7', label: 'Recall' },
  General: { Icon: CheckCircle2, color: '#ff7a00', label: 'General' },
};

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; color: string; label: string }> = {
  Study: { icon: BookOpen, color: '#ff7a00', label: 'Study' },
  Spiritual: { icon: Heart, color: '#a855f7', label: 'Spiritual' },
  Normal: { icon: List, color: '#22c55e', label: 'Normal' },
};

function CircularProgress({ progress, size = 120, strokeWidth = 8, color = '#a855f7' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

function WeekStrip() {
  const { getTaskCountForDate, setSelectedDate, selectedDate } = useTaskStore();

  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 3 - i);
      return { date: d, tasks: getTaskCountForDate(format(d, 'yyyy-MM-dd')) };
    });
  }, [getTaskCountForDate]);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {weekDays.map(({ date, tasks: tCount }) => {
        const isSelected = format(date, 'yyyy-MM-dd') === selectedDate;
        const isTd = isToday(date);

        return (
          <button
            key={date.toISOString()}
            onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl min-w-[48px] min-h-[60px] active:scale-95 transition-transform"
            style={{
              background: isSelected ? 'rgba(255,122,0,0.15)' : 'transparent',
              border: isSelected ? '1px solid rgba(255,122,0,0.3)' : '1px solid transparent',
            }}
          >
            <span className="text-[10px] font-medium" style={{ color: isTd ? '#ff7a00' : 'rgba(255,255,255,0.35)' }}>
              {format(date, 'EEE')}
            </span>
            <span className="text-base font-semibold" style={{ color: isSelected ? '#ff7a00' : 'rgba(255,255,255,0.7)' }}>
              {format(date, 'd')}
            </span>
            {tCount > 0 && (
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(tCount, 3) }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full" style={{ background: isSelected ? '#ff7a00' : 'rgba(255,122,0,0.5)' }} />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AcademicHub() {
  const [mounted, setMounted] = useState(false);
  const { tasks, selectedDate } = useTaskStore();
  const { getTodayFocusSessions } = usePomodoroStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const studyTasks = tasks.filter((t) => t.category === 'Study');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayStudyTasks = studyTasks.filter((t) => t.date === today);
  const completedStudy = todayStudyTasks.filter((t) => t.completed).length;

  // Get focus hours by subject - only Study category
  const focusData = useMemo(() => {
    const subjectHours: Record<string, number> = {};
    studyTasks
      .filter((t) => t.completed && t.subject)
      .forEach((t) => {
        if (t.subject) {
          const hours = (t.duration || 60) / 60;
          subjectHours[t.subject] = (subjectHours[t.subject] || 0) + hours;
        }
      });
    return Object.entries(subjectHours)
      .map(([subject, hours]) => ({ subject, hours: Number((hours).toFixed(1)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [studyTasks]);

  const focusSessions = getTodayFocusSessions();
  const totalHours = Number((focusSessions.totalMinutes / 60).toFixed(1));

  // Skeleton during SSR
  if (!mounted) {
    return (
      <div className="rounded-2xl p-4 animate-pulse" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="flex-1">
            <div className="h-3 bg-white/10 rounded w-24 mb-1" />
            <div className="h-2 bg-white/5 rounded w-16" />
          </div>
          <div className="text-right">
            <div className="h-5 bg-white/10 rounded w-8" />
          </div>
        </div>
        <div className="h-28 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,122,0,0.15)' }}>
          <BookOpen size={16} style={{ color: '#ff7a00' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Academic Hub</p>
          <p className="text-[10px] text-white/40">{completedStudy}/{todayStudyTasks.length} done today</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-bold" style={{ color: '#ff7a00' }}>{totalHours}h</p>
          <p className="text-[10px] text-white/40">focused</p>
        </div>
      </div>

      {/* Bar Chart - Focus by Subject */}
      {focusData.length > 0 && (
        <div className="h-28 w-full">
          <ErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                <XAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                  itemStyle={{ color: '#ff7a00', fontSize: 11 }}
                  formatter={(value: number) => [`${value}h`, 'Focus']}
                />
                <Bar dataKey="hours" fill="#ff7a00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        </div>
      )}

      {focusData.length === 0 && (
        <div className="flex items-center justify-center h-24 text-white/30 text-xs">
          No study sessions yet
        </div>
      )}
    </div>
  );
}

function SoulZone() {
  const [mounted, setMounted] = useState(false);
  const { tasks } = useTaskStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { completed, total } = useMemo(() => {
    const spiritual = tasks.filter((t) => t.category === 'Spiritual');
    return {
      completed: spiritual.filter((t) => t.completed).length,
      total: spiritual.length || 1,
    };
  }, [tasks]);

  const progress = (completed / total) * 100;

  // Skeleton during SSR
  if (!mounted) {
    return (
      <div className="rounded-2xl p-4 animate-pulse" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="flex-1">
            <div className="h-3 bg-white/10 rounded w-20 mb-1" />
            <div className="h-2 bg-white/5 rounded w-16" />
          </div>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="w-28 h-28 rounded-full bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
          <Heart size={16} style={{ color: '#a855f7' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Soul Zone</p>
          <p className="text-[10px] text-white/40">Spiritual Growth</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <CircularProgress progress={progress} color="#a855f7" />
      </div>

      <p className="text-center text-xs text-white/50 mt-2">
        {completed}/{total} spiritual tasks completed
      </p>
    </div>
  );
}

function LifeZone() {
  const [mounted, setMounted] = useState(false);
  const { tasks, setSelectedDate } = useTaskStore();
  const { setActiveTab } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pendingNormal = useMemo(
    () => tasks.filter((t) => t.category === 'Normal' && !t.completed).slice(0, 4),
    [tasks]
  );

  // Skeleton during SSR
  if (!mounted) {
    return (
      <div className="rounded-2xl p-4 animate-pulse" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10" />
            <div>
              <div className="h-3 bg-white/10 rounded w-16 mb-1" />
              <div className="h-2 bg-white/5 rounded w-12" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-2 h-2 rounded-full bg-white/10" />
              <div className="h-2 bg-white/5 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <List size={16} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Life Zone</p>
            <p className="text-[10px] text-white/40">Normal Tasks</p>
          </div>
        </div>
        <span className="text-xs text-white/40">{pendingNormal.length} pending</span>
      </div>

      {pendingNormal.length > 0 ? (
        <div className="space-y-2">
          {pendingNormal.map((task) => (
            <button
              key={task.id}
              onClick={() => {
                setSelectedDate(task.date);
                setActiveTab('tasks');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
              <p className="text-xs text-white/70 truncate flex-1">{task.title}</p>
              <span className="text-[10px] text-white/30">{format(parseISO(task.date), 'MMM d')}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-white/30 text-xs py-6">All caught up!</p>
      )}
    </div>
  );
}

function StatsRow() {
  const [mounted, setMounted] = useState(false);
  const { getWeekStats } = useTaskStore();
  const { getTodayMinutes } = usePomodoroStore();
  const { habits } = useHabitStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const weekStats = getWeekStats();
  const focusMinutes = getTodayMinutes();
  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);

  // Skeleton during SSR
  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-4 h-4 mx-auto mb-1.5 bg-white/10 rounded" />
            <div className="h-5 bg-white/10 rounded w-12 mx-auto mb-1" />
            <div className="h-2 bg-white/5 rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Today Focus */}
      <div className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Timer size={16} className="mx-auto mb-1.5 text-white/40" />
        <p className="text-lg font-bold text-white">{focusMinutes}</p>
        <p className="text-[9px] text-white/40">Focus (min)</p>
      </div>

      {/* Week Progress */}
      <div className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <TrendingUp size={16} className="mx-auto mb-1.5 text-white/40" />
        <p className="text-lg font-bold text-white">{weekStats.completed}/{weekStats.total}</p>
        <p className="text-[9px] text-white/40">This Week</p>
      </div>

      {/* Streak */}
      <div className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Flame size={16} className="mx-auto mb-1.5 text-white/40" />
        <p className="text-lg font-bold" style={{ color: '#22c55e' }}>{totalStreak}</p>
        <p className="text-[9px] text-white/40">Streaks</p>
      </div>
    </div>
  );
}

function QuoteCard() {
  const { getTodayQuote } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by using placeholder during SSR
  if (!mounted) {
    return (
      <div
        className="rounded-2xl p-4 animate-pulse"
        style={{ background: 'rgba(255,122,0,0.05)', border: '1px solid rgba(255,122,0,0.1)' }}
      >
        <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-2 bg-white/5 rounded w-1/3" />
      </div>
    );
  }

  const quote = getTodayQuote();

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'linear-gradient(135deg, rgba(255,122,0,0.08), rgba(255,122,0,0.02))', border: '1px solid rgba(255,122,0,0.12)' }}
    >
      <p className="text-xs text-white/60 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
      <p className="text-[10px] text-white/35 mt-2">— {quote.author}</p>
    </div>
  );
}

export default function DashboardView() {
  const today = new Date();

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{format(today, 'EEEE')}</p>
        <h1 className="text-xl font-bold text-white">{format(today, 'MMMM d')}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-28 space-y-3">
        {/* Week Strip */}
        <div className="rounded-2xl p-3" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ErrorBoundary>
            <WeekStrip />
          </ErrorBoundary>
        </div>

        {/* Academic Hub - Full Width */}
        <ErrorBoundary>
          <AcademicHub />
        </ErrorBoundary>

        {/* Soul & Life Zones - Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <ErrorBoundary>
            <SoulZone />
          </ErrorBoundary>
          <ErrorBoundary>
            <LifeZone />
          </ErrorBoundary>
        </div>

        {/* Stats Row */}
        <ErrorBoundary>
          <StatsRow />
        </ErrorBoundary>

        {/* Quote */}
        <QuoteCard />
      </div>
    </div>
  );
}
