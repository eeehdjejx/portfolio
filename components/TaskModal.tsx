'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, BookOpen, Pen, Brain, CheckCircle2, Flag, Heart, List, Repeat } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useTaskStore } from '@/lib/store';
import { Task, Priority, TaskType, Category, SRSConfig } from '@/lib/types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editTask?: Task | null;
  defaultDate?: string;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

const TYPES: { value: TaskType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'Explain', label: 'Explain', icon: BookOpen, color: '#3b82f6' },
  { value: 'Solve', label: 'Solve', icon: Pen, color: '#22c55e' },
  { value: 'Review', label: 'Review', icon: Brain, color: '#a855f7' },
  { value: 'General', label: 'General', icon: CheckCircle2, color: '#ff7a00' },
];

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'Study', label: 'Study', icon: BookOpen, color: '#ff7a00' },
  { value: 'Spiritual', label: 'Spiritual', icon: Heart, color: '#a855f7' },
  { value: 'Normal', label: 'Normal', icon: List, color: '#22c55e' },
];

const SRS_INTERVALS: { value: 1 | 3 | 7; label: string }[] = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
];

export default function TaskModal({ open, onClose, editTask, defaultDate }: TaskModalProps) {
  const { addTask, updateTask } = useTaskStore();
  const titleRef = useRef<HTMLInputElement>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? today);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('Normal');
  const [type, setType] = useState<TaskType>('General');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState('');
  const [srsEnabled, setSrsEnabled] = useState(false);
  const [srsInterval, setSrsInterval] = useState<1 | 3 | 7>(1);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDate(editTask.date);
      setTime(editTask.time ?? '');
      setDuration(editTask.duration ? String(editTask.duration) : '');
      setPriority(editTask.priority);
      setCategory(editTask.category);
      setType(editTask.type);
      setSubject(editTask.subject ?? '');
      setChapter(editTask.chapter ?? '');
      setNotes(editTask.notes ?? '');
      setSrsEnabled(editTask.srsConfig?.enabled ?? false);
      setSrsInterval(editTask.srsConfig?.interval ?? 1);
    } else {
      setTitle('');
      setDate(defaultDate ?? today);
      setTime('');
      setDuration('');
      setPriority('medium');
      setCategory('Normal');
      setType('General');
      setSubject('');
      setChapter('');
      setNotes('');
      setSrsEnabled(false);
      setSrsInterval(1);
    }
  }, [editTask, defaultDate, open]);

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const srsConfig: SRSConfig | undefined =
      category === 'Study' && srsEnabled
        ? { enabled: true, interval: srsInterval, nextReviewDate: format(addDays(parseISO(date), srsInterval), 'yyyy-MM-dd') }
        : undefined;

    const taskData = {
      title: title.trim(),
      date,
      time: time || undefined,
      duration: duration ? Number(duration) : undefined,
      priority,
      category,
      type: category === 'Study' ? type : 'General',
      subject: category === 'Study' ? subject.trim() || undefined : undefined,
      chapter: category === 'Study' ? chapter.trim() || undefined : undefined,
      completed: editTask?.completed ?? false,
      recurrence: 'once' as const,
      srsConfig,
      notes: notes || undefined,
    };

    if (editTask) {
      updateTask(editTask.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  // Auto-disable SRS when category is not Study
  useEffect(() => {
    if (category !== 'Study') {
      setSrsEnabled(false);
    }
  }, [category]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/85" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0" style={{ background: '#1a1a1a' }}>
              <h2 className="text-lg font-semibold text-white">{editTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X size={18} className="text-white/50" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Title */}
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 text-base"
                style={{ minHeight: '48px' }}
                required
              />

              {/* Category selector */}
              <div>
                <label className="text-[10px] text-white/40 mb-2 block uppercase tracking-wider">Category</label>
                <div className="flex gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl active:scale-95"
                        style={{
                          background: isActive ? `${cat.color}15` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isActive ? cat.color : 'rgba(255,255,255,0.08)'}`,
                          minHeight: '56px',
                        }}
                      >
                        <Icon size={16} style={{ color: isActive ? cat.color : 'rgba(255,255,255,0.4)' }} />
                        <span className="text-[10px]" style={{ color: isActive ? cat.color : 'rgba(255,255,255,0.5)' }}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type selector - only for Study */}
              {category === 'Study' && (
                <div>
                  <label className="text-[10px] text-white/40 mb-2 block uppercase tracking-wider">Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TYPES.map((t) => {
                      const Icon = t.icon;
                      const isActive = type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setType(t.value)}
                          className="flex flex-col items-center gap-1 py-3 rounded-xl active:scale-95"
                          style={{
                            background: isActive ? `${t.color}15` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isActive ? t.color : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <Icon size={14} style={{ color: isActive ? t.color : 'rgba(255,255,255,0.4)' }} />
                          <span className="text-[9px]" style={{ color: isActive ? t.color : 'rgba(255,255,255,0.5)' }}>
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500 [color-scheme:dark]"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500 [color-scheme:dark]"
                    style={{ minHeight: '48px' }}
                    placeholder="Time"
                  />
                </div>
              </div>

              {/* Subject & Chapter - only for Study */}
              {category === 'Study' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject (e.g. Physics)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500"
                    style={{ minHeight: '48px' }}
                  />
                  <input
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="Chapter"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>
              )}

              {/* Duration */}
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Duration (minutes)"
                  min="1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500"
                  style={{ minHeight: '48px' }}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] text-white/40 mb-2 block flex items-center gap-1.5 uppercase tracking-wider">
                  <Flag size={10} /> Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className="flex-1 py-3 rounded-xl text-xs font-medium active:scale-95"
                      style={{
                        background: priority === p.value ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                        borderColor: priority === p.value ? p.color : 'rgba(255,255,255,0.08)',
                        border: '1px solid',
                        color: priority === p.value ? p.color : 'rgba(255,255,255,0.5)',
                        minHeight: '44px',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SRS - only for Study */}
              {category === 'Study' && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,122,0,0.08)', border: '1px solid rgba(255,122,0,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat size={14} style={{ color: '#ff7a00' }} />
                      <span className="text-xs text-white/70">Spaced Review</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSrsEnabled(!srsEnabled)}
                      className={`w-12 h-7 rounded-full transition-colors ${srsEnabled ? 'bg-orange-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${srsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {srsEnabled && (
                    <div className="flex gap-2 mt-3">
                      {SRS_INTERVALS.map((interval) => (
                        <button
                          key={interval.value}
                          type="button"
                          onClick={() => setSrsInterval(interval.value)}
                          className="flex-1 py-2.5 rounded-lg text-[10px] font-medium active:scale-95"
                          style={{
                            background: srsInterval === interval.value ? 'rgba(255,122,0,0.25)' : 'rgba(255,255,255,0.05)',
                            color: srsInterval === interval.value ? '#ff7a00' : 'rgba(255,255,255,0.5)',
                            minHeight: '40px',
                          }}
                        >
                          {interval.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500 resize-none"
              />

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-semibold text-black active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)', minHeight: '56px' }}
              >
                {editTask ? 'Save Changes' : 'Add Task'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function parseISO(dateStr: string): Date {
  return new Date(dateStr);
}
