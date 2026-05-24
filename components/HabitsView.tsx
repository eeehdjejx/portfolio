'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Flame, Trophy, X } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { useHabitStore } from '@/lib/store';
import { Habit } from '@/lib/types';

const HABIT_ICONS = ['💪', '📚', '🏃', '💧', '🧘', '🎯', '🌱', '✍️', '🎵', '🍎', '😴', '🧠'];
const HABIT_COLORS = ['#ff7a00', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444'];
const DAYS_TO_SHOW = 7;

function HabitRow({ habit }: { habit: Habit }) {
  const { toggleHabitDate, deleteHabit } = useHabitStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const last7Days = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = subDays(new Date(), DAYS_TO_SHOW - 1 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const todayCompleted = habit.completedDates.includes(today);

  const handleDelete = () => {
    if (confirmDelete) deleteHabit(habit.id);
    else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass rounded-2xl p-4"
      style={{ borderLeft: `3px solid ${habit.color}` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{habit.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{habit.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {habit.streak > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: habit.color }}>
                <Flame size={11} className="streak-fire" />
                {habit.streak} day{habit.streak !== 1 ? 's' : ''}
              </span>
            )}
            {habit.longestStreak > 0 && (
              <span className="flex items-center gap-1 text-xs text-white/30">
                <Trophy size={10} />
                {habit.longestStreak} best
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => toggleHabitDate(habit.id, today)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            todayCompleted ? 'scale-100' : 'hover:scale-110'
          }`}
          style={{
            background: todayCompleted ? habit.color : 'rgba(255,255,255,0.06)',
            border: `1px solid ${todayCompleted ? habit.color : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {todayCompleted && <Check size={14} className="text-white" />}
        </button>

        <button
          onClick={handleDelete}
          className={`p-1.5 rounded-lg transition-all ${
            confirmDelete ? 'bg-red-500/20 text-red-400' : 'text-white/20 hover:text-red-400 hover:bg-white/10'
          }`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* 7-day streak view */}
      <div className="flex gap-1.5 items-center">
        {last7Days.map((dateStr, i) => {
          const done = habit.completedDates.includes(dateStr);
          const isToday = dateStr === today;
          return (
            <button
              key={dateStr}
              onClick={() => toggleHabitDate(habit.id, dateStr)}
              className="flex-1 flex flex-col items-center gap-1"
              title={dateStr}
            >
              <div
                className="w-full h-6 rounded-md transition-all"
                style={{
                  background: done ? habit.color : 'rgba(255,255,255,0.05)',
                  opacity: isToday ? 1 : done ? 0.7 : 0.4,
                  border: isToday ? `1px solid ${done ? habit.color : 'rgba(255,255,255,0.2)'}` : 'none',
                }}
              />
              <span
                className="text-[9px]"
                style={{ color: isToday ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
              >
                {format(parseISO(dateStr), 'EEE')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function AddHabitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addHabit } = useHabitStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState('#ff7a00');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, color, frequency, category: 'Normal' });
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-sm glass-strong rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">New Habit</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Habit name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-orange-500 transition-all"
                required
              />

              <div>
                <label className="text-xs text-white/40 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className="w-9 h-9 rounded-xl text-lg transition-all"
                      style={{
                        background: icon === ic ? 'rgba(255,122,0,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${icon === ic ? '#ff7a00' : 'transparent'}`,
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: c,
                        transform: color === c ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: color === c ? `0 0 0 2px rgba(255,255,255,0.3)` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {(['daily', 'weekly'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className="flex-1 py-2 rounded-xl text-sm capitalize border transition-all"
                    style={{
                      background: frequency === f ? 'rgba(255,122,0,0.15)' : 'transparent',
                      borderColor: frequency === f ? 'rgba(255,122,0,0.5)' : 'rgba(255,255,255,0.1)',
                      color: frequency === f ? '#ff7a00' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-black transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)' }}
              >
                Add Habit
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function HabitsView() {
  const { habits } = useHabitStore();
  const [addOpen, setAddOpen] = useState(false);

  const totalCompleted = habits.filter((h) =>
    h.completedDates.includes(format(new Date(), 'yyyy-MM-dd'))
  ).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Habits</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {totalCompleted}/{habits.length} done today
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)' }}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="flex-1 px-4 pb-6 overflow-auto">
        {habits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
              style={{ background: 'rgba(255,122,0,0.1)' }}
            >
              🎯
            </div>
            <p className="text-white/50 text-base font-medium">No habits yet</p>
            <p className="text-white/25 text-sm mt-1">Start building your routine</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {habits.map((habit) => (
                <HabitRow key={habit.id} habit={habit} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddHabitModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
