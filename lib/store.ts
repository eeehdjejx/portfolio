'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format, addDays, parseISO, isAfter, isBefore, isSameDay } from 'date-fns';
import { Task, Habit, PomodoroSession, TabId, Priority, RecurrenceType, TaskType, Category, SRSConfig, FocusSession } from './types';

// Quotes data - Study focused with some spiritual/general mixed
export const QUOTES = [
  { id: '1', text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', category: 'Normal' as Category },
  { id: '2', text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela', category: 'Normal' as Category },
  { id: '3', text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson', category: 'Normal' as Category },
  { id: '4', text: 'Quality is not an act, it is a habit.', author: 'Aristotle', category: 'Study' as Category },
  { id: '5', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Study' as Category },
  { id: '6', text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'Spiritual' as Category },
  { id: '7', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Study' as Category },
  { id: '8', text: 'The mind is everything. What you think you become.', author: 'Buddha', category: 'Spiritual' as Category },
  { id: '9', text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin', category: 'Study' as Category },
  { id: '10', text: 'Education is the passport to the future.', author: 'Malcolm X', category: 'Study' as Category },
];

// Safe storage wrapper with error handling
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      const item = localStorage.getItem(name);
      return item;
    } catch {
      console.warn(`[Storage] Unable to read ${name}`);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(name, value);
    } catch {
      console.warn(`[Storage] Unable to save ${name}`);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
    } catch {
      console.warn(`[Storage] Unable to remove ${name}`);
    }
  },
};

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Task Store ─────────────────────────────────────────────────────────────
interface TaskStore {
  tasks: Task[];
  selectedDate: string;
  isFocusMode: boolean;
  setSelectedDate: (date: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  getTasksForDate: (date: string) => Task[];
  getTaskCountForDate: (date: string) => number;
  toggleFocusMode: () => void;
  getTodaysStats: () => { total: number; completed: number; byCategory: Record<Category, number>; byType: Record<TaskType, number> };
  getWeekStats: () => { total: number; completed: number; byCategory: Record<Category, number> };
  getStudyFocusHoursBySubject: () => { subject: string; hours: number }[];
  getPendingNormalTasks: () => Task[];
  getSpiritualCompletionRate: () => { completed: number; total: number };
  getUpcomingReviews: () => Task[];
}

function generateRecurringTasks(base: Omit<Task, 'id' | 'createdAt'>): Omit<Task, 'id' | 'createdAt'>[] {
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];
  const startDate = parseISO(base.date);

  if (base.recurrence === 'once') return [base];

  const endDate = base.recurrenceEndDate
    ? parseISO(base.recurrenceEndDate)
    : addDays(startDate, base.recurrence === 'daily' ? 30 : 84);

  let current = startDate;
  while (!isAfter(current, endDate)) {
    const dateStr = format(current, 'yyyy-MM-dd');
    if (base.recurrence === 'daily') {
      tasks.push({ ...base, date: dateStr });
      current = addDays(current, 1);
    } else if (base.recurrence === 'weekly') {
      const dayOfWeek = current.getDay();
      const targetDays = base.recurrenceDays ?? [startDate.getDay()];
      if (targetDays.includes(dayOfWeek)) tasks.push({ ...base, date: dateStr });
      current = addDays(current, 1);
    } else {
      tasks.push({ ...base, date: dateStr });
      current = addDays(current, 1);
    }
  }
  return tasks;
}

function generateSRSTasks(baseTask: Task): Task[] {
  if (!baseTask.srsConfig?.enabled || baseTask.category !== 'Study') return [];

  const srsTasks: Task[] = [];
  const interval = baseTask.srsConfig.interval;
  const originalDate = parseISO(baseTask.date);
  const now = new Date().toISOString();

  // Create review task
  const reviewDate = addDays(originalDate, interval);
  const reviewTask: Task = {
    ...baseTask,
    id: generateId(),
    title: `[Review] ${baseTask.title}`,
    date: format(reviewDate, 'yyyy-MM-dd'),
    parentId: baseTask.id,
    completed: false,
    createdAt: now,
    srsConfig: undefined, // Don't create nested SRS
    type: 'Review',
  };
  srsTasks.push(reviewTask);

  return srsTasks;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      isFocusMode: false,

      setSelectedDate: (date) => set({ selectedDate: date }),
      toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })),

      addTask: (taskData) => {
        const instances = generateRecurringTasks(taskData);
        const parentId = generateId();

        // Create base task
        const now = new Date().toISOString();
        const mainTask: Task = {
          ...instances[0],
          id: parentId,
          createdAt: now,
        };

        // Generate SRS follow-up if applicable
        const srsFollowUps = taskData.srsConfig?.enabled && taskData.category === 'Study'
          ? generateSRSTasks(mainTask)
          : [];

        // Create additional recurring instances
        const additionalInstances: Task[] = instances.slice(1).map((instance) => ({
          ...instance,
          id: generateId(),
          parentId: parentId,
          createdAt: now,
        }));

        // Check for duplicate dates
        const existingDates = new Set(
          get().tasks
            .filter((t) => t.parentId === parentId || t.id === parentId)
            .map((t) => t.date)
        );

        set((state) => ({
          tasks: [
            ...state.tasks,
            mainTask,
            ...additionalInstances.filter((t) => !existingDates.has(t.date)),
            ...srsFollowUps,
          ].filter(Boolean),
        }));

        return parentId;
      },

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id && t.parentId !== id),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      getTasksForDate: (date) => {
        const tasks = get().tasks.filter((t) => t.date === date);
        return tasks.sort((a, b) => {
          // Category order: Study > Spiritual > Normal
          const catOrder: Record<Category, number> = { Study: 0, Spiritual: 1, Normal: 2 };
          if (catOrder[a.category] !== catOrder[b.category]) return catOrder[a.category] - catOrder[b.category];
          const typeOrder: Record<TaskType, number> = { Explain: 0, Solve: 1, Review: 2, General: 3 };
          if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
          return 0;
        });
      },

      getTaskCountForDate: (date) => get().tasks.filter((t) => t.date === date).length,

      getTodaysStats: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayTasks = get().tasks.filter((t) => t.date === today);
        const completed = todayTasks.filter((t) => t.completed).length;
        const byCategory: Record<Category, number> = { Study: 0, Spiritual: 0, Normal: 0 };
        const byType: Record<TaskType, number> = { Explain: 0, Solve: 0, Review: 0, General: 0 };
        todayTasks.forEach((t) => {
          byCategory[t.category]++;
          byType[t.type]++;
        });
        return { total: todayTasks.length, completed, byCategory, byType };
      },

      getWeekStats: () => {
        const today = new Date();
        const weekStart = addDays(today, -today.getDay());
        const weekTasks = get().tasks.filter((t) => {
          const taskDate = parseISO(t.date);
          return !isBefore(taskDate, weekStart) && !isAfter(taskDate, addDays(weekStart, 6));
        });
        const byCategory: Record<Category, number> = { Study: 0, Spiritual: 0, Normal: 0 };
        weekTasks.forEach((t) => {
          if (t.completed) byCategory[t.category]++;
        });
        return { total: weekTasks.length, completed: weekTasks.filter((t) => t.completed).length, byCategory };
      },

      getStudyFocusHoursBySubject: () => {
        const studyTasks = get().tasks.filter((t) => t.category === 'Study' && t.subject && t.completed);
        const hoursBySubject: Record<string, number> = {};
        studyTasks.forEach((t) => {
          if (t.subject) {
            const hours = (t.duration || 60) / 60;
            hoursBySubject[t.subject] = (hoursBySubject[t.subject] || 0) + hours;
          }
        });
        return Object.entries(hoursBySubject)
          .map(([subject, hours]) => ({ subject, hours: Math.round(hours * 10) / 10 }))
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 6);
      },

      getPendingNormalTasks: () =>
        get().tasks.filter((t) => t.category === 'Normal' && !t.completed).slice(0, 5),

      getSpiritualCompletionRate: () => {
        const spiritual = get().tasks.filter((t) => t.category === 'Spiritual');
        return {
          completed: spiritual.filter((t) => t.completed).length,
          total: spiritual.length || 1,
        };
      },

      getUpcomingReviews: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().tasks.filter((t) =>
          t.category === 'Study' &&
          t.srsConfig?.enabled &&
          t.srsConfig.nextReviewDate &&
          !isBefore(parseISO(t.srsConfig.nextReviewDate), parseISO(today)) &&
          !t.completed
        );
      },
    }),
    {
      name: 'elshaikh-study-tasks',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ tasks: state.tasks, selectedDate: state.selectedDate, isFocusMode: state.isFocusMode }),
    }
  )
);

// ─── Habit Store ─────────────────────────────────────────────────────────────
interface HabitStore {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'longestStreak'>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDate: (id: string, date: string) => void;
  isHabitCompletedToday: (id: string) => boolean;
}

function recalcStreak(completedDates: string[]): { streak: number; longestStreak: number } {
  if (!completedDates.length) return { streak: 0, longestStreak: 0 };
  const sorted = [...completedDates].sort().reverse();
  let streak = 0;
  let current = format(new Date(), 'yyyy-MM-dd');
  for (const date of sorted) {
    if (date === current) {
      streak++;
      current = format(addDays(parseISO(current), -1), 'yyyy-MM-dd');
    } else break;
  }
  let tempStreak = 1, maxStreak = 1;
  const sortedAsc = [...completedDates].sort();
  for (let i = 1; i < sortedAsc.length; i++) {
    const diff = Math.round((parseISO(sortedAsc[i]).getTime() - parseISO(sortedAsc[i - 1]).getTime()) / 86400000);
    if (diff === 1) { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak); }
    else tempStreak = 1;
  }
  return { streak, longestStreak: maxStreak };
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (habitData) => {
        const habit: Habit = {
          ...habitData,
          id: generateId(),
          completedDates: [],
          streak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, habit] }));
      },
      deleteHabit: (id) => set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      toggleHabitDate: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const has = h.completedDates.includes(date);
            const newDates = has ? h.completedDates.filter((d) => d !== date) : [...h.completedDates, date];
            const { streak, longestStreak } = recalcStreak(newDates);
            return { ...h, completedDates: newDates, streak, longestStreak };
          }),
        })),
      isHabitCompletedToday: (id) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().habits.find((h) => h.id === id)?.completedDates.includes(today) ?? false;
      },
    }),
    {
      name: 'elshaikh-habits',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

// ─── Pomodoro Store ──────────────────────────────────────────────────────────
interface PomodoroStore {
  workDuration: number;
  breakDuration: number;
  sessions: PomodoroSession[];
  isRunning: boolean;
  phase: 'work' | 'break';
  timeLeft: number;
  currentTask: string;
  currentCategory: Category;
  currentSubject: string;
  setWorkDuration: (m: number) => void;
  setBreakDuration: (m: number) => void;
  setCurrentTask: (t: string) => void;
  setCurrentCategory: (c: Category) => void;
  setCurrentSubject: (s: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  completeSession: () => void;
  getTodayMinutes: () => number;
  getTodayFocusSessions: () => FocusSession;
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      workDuration: 25,
      breakDuration: 5,
      sessions: [],
      isRunning: false,
      phase: 'work',
      timeLeft: 25 * 60,
      currentTask: '',
      currentCategory: 'Study',
      currentSubject: '',
      setWorkDuration: (m) => set({ workDuration: m, timeLeft: m * 60, isRunning: false }),
      setBreakDuration: (m) => set({ breakDuration: m }),
      setCurrentTask: (t) => set({ currentTask: t }),
      setCurrentCategory: (c) => set({ currentCategory: c }),
      setCurrentSubject: (s) => set({ currentSubject: s }),
      start: () => set({ isRunning: true }),
      pause: () => set({ isRunning: false }),
      reset: () => {
        const { workDuration } = get();
        set({ isRunning: false, phase: 'work', timeLeft: workDuration * 60 });
      },
      tick: () => {
        const { timeLeft } = get();
        if (timeLeft <= 1) get().completeSession();
        else set({ timeLeft: timeLeft - 1 });
      },
      completeSession: () => {
        const { phase, workDuration, breakDuration, currentTask, sessions, currentCategory, currentSubject } = get();
        if (phase === 'work') {
          const session: PomodoroSession = {
            id: generateId(),
            taskTitle: currentTask || undefined,
            startTime: new Date().toISOString(),
            duration: workDuration,
            completed: true,
            category: currentCategory,
            subject: currentSubject || undefined,
          };
          set({ sessions: [...sessions, session], phase: 'break', timeLeft: breakDuration * 60, isRunning: false });
        } else {
          set({ phase: 'work', timeLeft: workDuration * 60, isRunning: false });
        }
      },
      getTodayMinutes: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().sessions
          .filter((s) => s.startTime.startsWith(today) && s.completed)
          .reduce((acc, s) => acc + s.duration, 0);
      },
      getTodayFocusSessions: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todaySessions = get().sessions.filter((s) => s.startTime.startsWith(today) && s.completed);
        const byCategory: Record<Category, number> = { Study: 0, Spiritual: 0, Normal: 0 };
        const bySubject: Record<string, number> = {};
        todaySessions.forEach((s) => {
          if (s.category) byCategory[s.category] += s.duration / 60;
          if (s.subject) bySubject[s.subject] = (bySubject[s.subject] || 0) + s.duration / 60;
        });
        return {
          date: today,
          totalMinutes: todaySessions.reduce((acc, s) => acc + s.duration, 0),
          sessionsCount: todaySessions.length,
          byCategory,
          bySubject,
        };
      },
    }),
    {
      name: 'elshaikh-pomodoro',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        workDuration: s.workDuration,
        breakDuration: s.breakDuration,
        sessions: s.sessions,
        currentTask: s.currentTask,
        currentCategory: s.currentCategory,
        currentSubject: s.currentSubject,
      }),
    }
  )
);

// ─── UI Store ────────────────────────────────────────────────────────────────
interface UIStore {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  todayQuoteIndex: number;
  lastQuoteDate: string;
  getTodayQuote: () => typeof QUOTES[0];
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),
      todayQuoteIndex: 0,
      lastQuoteDate: '',
      getTodayQuote: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { lastQuoteDate, todayQuoteIndex } = get();
        if (lastQuoteDate !== today) {
          const idx = Math.floor(Math.random() * QUOTES.length);
          set({ lastQuoteDate: today, todayQuoteIndex: idx });
          return QUOTES[idx];
        }
        return QUOTES[todayQuoteIndex] ?? QUOTES[0];
      },
    }),
    {
      name: 'elshaikh-ui',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
