'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar, List, BookOpen, Heart } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import { TaskType, Category } from '@/lib/types';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import ErrorBoundary from './ErrorBoundary';

export default function TasksView() {
  const { selectedDate, setSelectedDate, getTasksForDate, getTaskCountForDate } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [view, setView] = useState<'month' | 'day'>('day');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = monthStart.getDay();
  const paddedDays: (Date | null)[] = [...Array(startPad).fill(null), ...days];

  const selectedDateObj = parseISO(selectedDate);
  let tasks = getTasksForDate(selectedDate);

  if (categoryFilter !== 'all') {
    tasks = tasks.filter((t) => t.category === categoryFilter);
  }
  if (typeFilter !== 'all') {
    tasks = tasks.filter((t) => t.type === typeFilter);
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setView('day');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            {view === 'month' ? format(currentMonth, 'MMMM yyyy') : format(selectedDateObj, 'EEE, MMM d')}
          </h1>
          {view === 'day' && (
            <p className="text-xs text-white/40 mt-0.5">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              {tasks.length > 0 && ` · ${completedCount} done`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setView('day')}
              className={`p-2.5 rounded-md active:scale-95 ${view === 'day' ? 'bg-white/10' : ''}`}
              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <List size={16} style={{ color: view === 'day' ? 'white' : 'rgba(255,255,255,0.4)' }} />
            </button>
            <button
              onClick={() => setView('month')}
              className={`p-2.5 rounded-md active:scale-95 ${view === 'month' ? 'bg-white/10' : ''}`}
              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Calendar size={16} style={{ color: view === 'month' ? 'white' : 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          {view === 'month' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2.5 rounded-lg active:scale-90"
                style={{ background: 'rgba(255,255,255,0.05)', minWidth: '44px', minHeight: '44px' }}
              >
                <ChevronLeft size={16} className="text-white/50" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2.5 rounded-lg text-xs active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', minHeight: '44px' }}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2.5 rounded-lg active:scale-90"
                style={{ background: 'rgba(255,255,255,0.05)', minWidth: '44px', minHeight: '44px' }}
              >
                <ChevronRight size={16} className="text-white/50" />
              </button>
            </div>
          )}

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)', minHeight: '44px' }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'month' ? (
          <motion.div
            key="month"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 px-4 pb-4 overflow-auto"
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-center text-[10px] text-white/30 py-2 font-medium">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = getTaskCountForDate(dateStr);
                const isSelected = dateStr === selectedDate;
                const isTd = isToday(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(day)}
                    className="relative flex flex-col items-center justify-start pt-2 pb-1.5 rounded-xl min-h-[52px] min-w-[48px] active:scale-95"
                    style={{
                      background: isSelected ? 'rgba(255,122,0,0.15)' : isTd ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255,122,0,0.3)' : isTd ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    }}
                  >
                    <span
                      className="text-sm font-semibold leading-none"
                      style={{ color: isSelected ? '#ff7a00' : isTd ? 'white' : 'rgba(255,255,255,0.6)' }}
                    >
                      {format(day, 'd')}
                    </span>

                    {count > 0 && (
                      <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <div
                            key={j}
                            className="w-1 h-1 rounded-full"
                            style={{ background: isSelected ? '#ff7a00' : 'rgba(255,122,0,0.5)' }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="day"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 px-4 pb-4 overflow-auto"
          >
            {/* Date nav */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDateObj);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(format(prev, 'yyyy-MM-dd'));
                  }}
                  className="p-2.5 rounded-lg active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.05)', minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronLeft size={16} className="text-white/50" />
                </button>
                <button
                  onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                  className="px-3 py-2 rounded-lg text-[10px] active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', minHeight: '40px' }}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(selectedDateObj);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(format(next, 'yyyy-MM-dd'));
                  }}
                  className="p-2.5 rounded-lg active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.05)', minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronRight size={16} className="text-white/50" />
                </button>
              </div>

              {/* Category filter */}
              <div className="flex gap-1.5">
                {(['all', 'Study', 'Spiritual', 'Normal'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCategoryFilter(f)}
                    className={`px-2.5 py-2 rounded-lg text-[10px] font-medium active:scale-90 ${
                      categoryFilter === f ? 'bg-orange-500/15 border border-orange-500/30' : ''
                    }`}
                    style={{
                      color: categoryFilter === f ? '#ff7a00' : 'rgba(255,255,255,0.4)',
                      minHeight: '36px',
                    }}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks list */}
            <ErrorBoundary>
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,122,0,0.1)' }}>
                    <Calendar size={28} style={{ color: '#ff7a00' }} />
                  </div>
                  <p className="text-white/50 text-base font-medium">No tasks for this day</p>
                  <p className="text-white/25 text-sm mt-1">Tap + to add your first task</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {tasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskModal open={addModalOpen} onClose={() => setAddModalOpen(false)} defaultDate={selectedDate} />
    </div>
  );
}
