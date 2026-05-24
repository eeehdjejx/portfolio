export type Category = 'Study' | 'Spiritual' | 'Normal';
export type TaskType = 'Explain' | 'Solve' | 'Review' | 'General';
export type Priority = 'low' | 'medium' | 'high';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'custom';

export interface SRSConfig {
  enabled: boolean;
  interval: 1 | 3 | 7; // days
  nextReviewDate?: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  type: TaskType;
  subject?: string;
  chapter?: string;
  date: string;
  time?: string;
  duration?: number;
  priority: Priority;
  completed: boolean;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  recurrenceDays?: number[];
  parentId?: string;
  srsConfig?: SRSConfig;
  notes?: string;
  createdAt: string;
  isAIGenerated?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly';
  targetDays?: number[];
  completedDates: string[];
  streak: number;
  longestStreak: number;
  createdAt: string;
  color: string;
  category: Category;
}

export interface PomodoroSession {
  id: string;
  taskTitle?: string;
  startTime: string;
  duration: number;
  completed: boolean;
  category?: Category;
  subject?: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: Category;
}

export type TabId = 'dashboard' | 'tasks' | 'focus' | 'habits' | 'ai' | 'quotes';

export interface FocusSession {
  date: string;
  totalMinutes: number;
  sessionsCount: number;
  byCategory: Record<Category, number>;
  bySubject: Record<string, number>;
}
