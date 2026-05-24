'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles, Calendar, Clock, BookOpen, Heart, List, Repeat } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useTaskStore, useUIStore } from '@/lib/store';
import { TaskType, Category, SRSConfig } from '@/lib/types';

// Category detection keywords
const CATEGORY_KEYWORDS: { category: Category; keywords: string[] }[] = [
  {
    category: 'Spiritual',
    keywords: [
      'prayer', 'meditation', 'quran', 'bible', 'spiritual', 'worship',
      'dhikr', 'faith', 'zikr', 'salah', 'namaz', 'dua', 'ibadah',
      'contemplation', 'mindfulness', 'spiritual reading', 'religious',
    ],
  },
  {
    category: 'Study',
    keywords: [
      'study', 'learn', 'read', 'chapter', 'homework', 'assignment',
      'exam', 'test', 'quiz', 'lecture', 'course', 'class', 'subject',
      'physics', 'math', 'chemistry', 'biology', 'history', 'english',
      'science', 'programming', 'coding', 'algorithm', 'formula',
      'practice', 'solve', 'exercise', 'notes', 'revision', 'review',
      'explain', 'understand', 'textbook', 'lesson', 'calculus', 'algebra',
    ],
  },
];

const TYPE_CONFIG: Record<TaskType, { color: string; label: string }> = {
  Explain: { color: '#3b82f6', label: 'Read/Watch' },
  Solve: { color: '#22c55e', label: 'Practice' },
  Review: { color: '#a855f7', label: 'Recall' },
  General: { color: '#ff7a00', label: 'Task' },
};

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; color: string; label: string }> = {
  Study: { icon: BookOpen, color: '#ff7a00', label: 'Study' },
  Spiritual: { icon: Heart, color: '#a855f7', label: 'Spiritual' },
  Normal: { icon: List, color: '#22c55e', label: 'Normal' },
};

const SRS_INTERVALS: { value: 1 | 3 | 7; label: string }[] = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
];

interface ParsedResult {
  title: string;
  category: Category;
  type: TaskType;
  date: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  subject?: string;
  chapter?: string;
  srsEnabled: boolean;
  srsInterval: 1 | 3 | 7;
}

function detectCategory(input: string): Category {
  const lower = input.toLowerCase();

  // Check spiritual keywords first (higher priority for specific spiritual terms)
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  // Default to Normal
  return 'Normal';
}

function detectType(input: string): TaskType {
  const lower = input.toLowerCase();

  if (/\b(read|watch|learn|understand|explain|concept)\b/.test(lower)) return 'Explain';
  if (/\b(solve|practice|exercise|problem|do)\b/.test(lower)) return 'Solve';
  if (/\b(review|revise|recall|memorize)\b/.test(lower)) return 'Review';

  return 'General';
}

function detectPriority(input: string): 'low' | 'medium' | 'high' {
  const lower = input.toLowerCase();
  if (/\b(urgent|important|asap|critical|high)\b/.test(lower)) return 'high';
  if (/\b(low|later|someday)\b/.test(lower)) return 'low';
  return 'medium';
}

function parseDate(input: string): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  const lower = input.toLowerCase();

  if (lower.includes('tomorrow')) {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }
  if (lower.includes('next week')) {
    return format(addDays(new Date(), 7), 'yyyy-MM-dd');
  }

  return today;
}

function parseTime(input: string): string | undefined {
  const match = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match) {
    let h = parseInt(match[1]);
    const m = parseInt(match[2] || '0');
    if (/pm/i.test(match[3]) && h !== 12) h += 12;
    if (/am/i.test(match[3]) && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  return undefined;
}

function extractSubjectChapter(input: string): { subject?: string; chapter?: string; cleanTitle: string } {
  const match = input.match(/(\w+(?:\s+\w+)?)\s+(?:chapter|ch)\s*(\d+)?/i);
  if (match) {
    const subject = match[1].trim();
    const chapter = match[2];
    const cleanTitle = input
      .replace(match[0], '')
      .replace(/\s+/g, ' ')
      .trim() || `${subject} Chapter ${chapter || ''}`;
    return { subject, chapter, cleanTitle };
  }

  return { cleanTitle: input };
}

function parseNaturalInput(input: string): ParsedResult {
  const category = detectCategory(input);
  const type = category === 'Study' ? detectType(input) : 'General';
  const date = parseDate(input);
  const time = parseTime(input);
  const priority = detectPriority(input);
  const { subject, chapter, cleanTitle } = extractSubjectChapter(input);

  // Only enable SRS for Study category
  const srsEnabled = category === 'Study' && type === 'Review';
  const srsInterval: 1 | 3 | 7 = 1;

  return {
    title: cleanTitle,
    category,
    type,
    date,
    time,
    priority,
    subject,
    chapter,
    srsEnabled,
    srsInterval,
  };
}

export default function BrainDump() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Normal');
  const [selectedType, setSelectedType] = useState<TaskType>('General');
  const [srsEnabled, setSrsEnabled] = useState(false);
  const [srsInterval, setSrsInterval] = useState<1 | 3 | 7>(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addTask } = useTaskStore();
  const { setActiveTab } = useUIStore();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const result = parseNaturalInput(value);
      setParsed(result);
      setSelectedCategory(result.category);
      setSelectedType(result.type);
      setSrsEnabled(result.srsEnabled);
    } else {
      setParsed(null);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || !parsed) return;

    const srsConfig: SRSConfig | undefined =
      selectedCategory === 'Study' && srsEnabled
        ? { enabled: true, interval: srsInterval, nextReviewDate: format(addDays(new Date(parsed.date), srsInterval), 'yyyy-MM-dd') }
        : undefined;

    addTask({
      title: parsed.title,
      category: selectedCategory,
      type: selectedType,
      date: parsed.date,
      time: parsed.time,
      priority: parsed.priority,
      subject: parsed.subject,
      chapter: parsed.chapter,
      completed: false,
      recurrence: 'once',
      srsConfig,
    });

    setOpen(false);
    setInput('');
    setParsed(null);
  };

  const CategoryIcon = parsed ? CATEGORY_CONFIG[selectedCategory].icon : List;

  return (
    <>
      {/* Floating FAB - 48x48 minimum touch target */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-30"
        style={{
          background: 'linear-gradient(135deg, #ff7a00, #ff9d45)',
          minWidth: '56px',
          minHeight: '56px',
        }}
      >
        <Plus size={28} className="text-black" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-black/85"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-3xl overflow-hidden"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,122,0,0.15)' }}>
                    <Sparkles size={20} style={{ color: '#ff7a00' }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Brain Dump</h2>
                    <p className="text-[10px] text-white/40">AI-powered categorization</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X size={18} className="text-white/50" />
                </button>
              </div>

              {/* Input */}
              <div className="p-5">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. Study Physics Chapter 3 for exam"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 text-base"
                  style={{ minHeight: '56px' }}
                />

                {/* Parsed preview */}
                {parsed && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                    {/* Category selector */}
                    <div>
                      <label className="text-[10px] text-white/40 mb-2 block uppercase tracking-wider">Category</label>
                      <div className="flex gap-2">
                        {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
                          const cfg = CATEGORY_CONFIG[cat];
                          const Icon = cfg.icon;
                          const isActive = selectedCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                if (cat !== 'Study') setSrsEnabled(false);
                              }}
                              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl active:scale-95"
                              style={{
                                background: isActive ? `${cfg.color}15` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isActive ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                              }}
                            >
                              <Icon size={16} style={{ color: isActive ? cfg.color : 'rgba(255,255,255,0.4)' }} />
                              <span className="text-[10px]" style={{ color: isActive ? cfg.color : 'rgba(255,255,255,0.5)' }}>
                                {cfg.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Type selector - only for Study */}
                    {selectedCategory === 'Study' && (
                      <div>
                        <label className="text-[10px] text-white/40 mb-2 block uppercase tracking-wider">Type</label>
                        <div className="grid grid-cols-4 gap-2">
                          {(Object.keys(TYPE_CONFIG) as TaskType[]).map((t) => {
                            const cfg = TYPE_CONFIG[t];
                            const isActive = selectedType === t;
                            return (
                              <button
                                key={t}
                                onClick={() => setSelectedType(t)}
                                className="py-2.5 rounded-xl text-[10px] font-medium active:scale-95"
                                style={{
                                  background: isActive ? `${cfg.color}15` : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${isActive ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                                  color: isActive ? cfg.color : 'rgba(255,255,255,0.5)',
                                }}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SRS - only for Study */}
                    {selectedCategory === 'Study' && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,122,0,0.08)', border: '1px solid rgba(255,122,0,0.15)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Repeat size={14} style={{ color: '#ff7a00' }} />
                            <span className="text-xs text-white/70">Spaced Review</span>
                          </div>
                          <button
                            onClick={() => setSrsEnabled(!srsEnabled)}
                            className={`w-12 h-7 rounded-full transition-colors ${srsEnabled ? 'bg-orange-500' : 'bg-white/10'}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${srsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                          </button>
                        </div>

                        {srsEnabled && (
                          <div className="flex gap-2 mt-2">
                            {SRS_INTERVALS.map((interval) => (
                              <button
                                key={interval.value}
                                onClick={() => setSrsInterval(interval.value)}
                                className="flex-1 py-2 rounded-lg text-[10px] font-medium active:scale-95"
                                style={{
                                  background: srsInterval === interval.value ? 'rgba(255,122,0,0.2)' : 'rgba(255,255,255,0.05)',
                                  color: srsInterval === interval.value ? '#ff7a00' : 'rgba(255,255,255,0.5)',
                                }}
                              >
                                {interval.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preview */}
                    <div className="px-4 py-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon size={12} style={{ color: CATEGORY_CONFIG[selectedCategory].color }} />
                        <p className="text-sm font-medium text-white">{parsed.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px]" style={{ background: `${CATEGORY_CONFIG[selectedCategory].color}15`, color: CATEGORY_CONFIG[selectedCategory].color }}>
                          {selectedCategory}
                        </span>
                        {selectedCategory === 'Study' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px]" style={{ background: `${TYPE_CONFIG[selectedType].color}15`, color: TYPE_CONFIG[selectedType].color }}>
                            {selectedType}
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-white/5 text-white/50">
                          <Calendar size={10} />
                          {parsed.date}
                        </span>
                        {parsed.time && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-white/5 text-white/50">
                            <Clock size={10} />
                            {parsed.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      className="w-full py-4 rounded-xl font-semibold text-black active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)', minHeight: '56px' }}
                    >
                      Add Task
                    </button>
                  </motion.div>
                )}

                {/* Empty state suggestions */}
                {!parsed && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Study Math Chapter 5', 'Prayer at 5pm', 'Buy groceries tomorrow'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleInputChange(suggestion)}
                        className="px-3 py-2 rounded-xl text-xs active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', minHeight: '40px' }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
