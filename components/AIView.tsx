'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Pen, Brain, Plus, ChevronRight, X, Zap } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useTaskStore } from '@/lib/store';
import { TaskType } from '@/lib/types';

const TYPE_CONFIG: Record<TaskType, { icon: React.ElementType; color: string; label: string; description: string }> = {
  Explain: {
    icon: BookOpen,
    color: '#3b82f6',
    label: 'Explain',
    description: 'Read textbook, watch video lectures',
  },
  Solve: {
    icon: Pen,
    color: '#22c55e',
    label: 'Solve',
    description: 'Practice problems, exercises',
  },
  Review: {
    icon: Brain,
    color: '#a855f7',
    label: 'Review',
    description: 'Active recall, flashcards, notes',
  },
  General: {
    icon: Sparkles,
    color: '#ff7a00',
    label: 'General',
    description: 'Other study-related tasks',
  },
};

interface SubTask {
  title: string;
  type: TaskType;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  subtasks?: SubTask[];
  added?: Set<number>;
}

function generateStudyPlan(input: string): { subject: string; chapter: string; subtasks: SubTask[]; message: string } {
  // Extract subject and chapter
  const match = input.match(/(?:study|learn|plan)?\s*(\w+(?:\s+\w+)?)\s*(?:chapter|ch)?\s*(\d+)?/i);
  const subject = match ? match[1].trim() : input.trim();
  const chapter = match && match[2] ? match[2] : '1';

  // Generate the Explain-Solve-Review breakdown
  const subtasks: SubTask[] = [
    {
      title: `${subject} Chapter ${chapter}: Read & understand concepts`,
      type: 'Explain',
    },
    {
      title: `${subject} Chapter ${chapter}: Watch lecture video`,
      type: 'Explain',
    },
    {
      title: `${subject} Chapter ${chapter}: Solve practice problems`,
      type: 'Solve',
    },
    {
      title: `${subject} Chapter ${chapter}: Review notes & key formulas`,
      type: 'Review',
    },
    {
      title: `${subject} Chapter ${chapter}: Active recall quiz`,
      type: 'Review',
    },
  ];

  const message = `Perfect! I've broken down "${subject} Chapter ${chapter}" into a study plan following the Explain-Solve-Review method. Each task is ready to add to your calendar.`;

  return { subject, chapter, subtasks, message };
}

export default function AIView() {
  const { addTask, selectedDate } = useTaskStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Welcome! I\'m your AI Study Planner. Tell me what subject you need to study and I\'ll break it down into:\n\n- Explain (Read/Watch)\n- Solve (Practice)\n- Review (Recall)\n\nTry: "Plan Physics Chapter 3" or "Study Organic Chemistry"',
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDecompose = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };

    const { subtasks, message } = generateStudyPlan(text);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: message,
      subtasks,
      added: new Set(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const handleAddSubtask = (msgId: string, index: number, subtask: SubTask) => {
    const today = format(new Date(), 'yyyy-MM-dd');

    addTask({
      title: subtask.title,
      category: 'Study',
      type: subtask.type,
      date: selectedDate || today,
      priority: index < 2 ? 'high' : 'medium',
      completed: false,
      recurrence: 'once',
      isAIGenerated: true,
    });

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const newSet = new Set(m.added || []);
        newSet.add(index);
        return { ...m, added: newSet };
      })
    );
  };

  const handleAddAll = (msgId: string, subtasks: SubTask[]) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    subtasks.forEach((subtask, i) => {
      addTask({
        title: subtask.title,
        category: 'Study',
        type: subtask.type,
        date: selectedDate || today,
        priority: i < 2 ? 'high' : 'medium',
        completed: false,
        recurrence: 'once',
        isAIGenerated: true,
      });
    });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, added: new Set(subtasks.map((_, i) => i)) } : m
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,122,0,0.2), rgba(255,122,0,0.05))' }}
          >
            <Sparkles size={20} style={{ color: '#ff7a00' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">AI Study Planner</h1>
            <p className="text-xs text-white/40 mt-1">Academic task decomposition</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{
                  background: msg.role === 'assistant' ? 'rgba(255,122,0,0.15)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {msg.role === 'assistant' ? (
                  <Sparkles size={14} style={{ color: '#ff7a00' }} />
                ) : (
                  <span className="text-xs text-white/60">You</span>
                )}
              </div>

              <div className={`flex-1 space-y-2 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                {/* Text bubble */}
                {msg.text && (
                  <div
                    className="inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap"
                    style={{
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    {msg.text}
                  </div>
                )}

                {/* Subtasks */}
                {msg.subtasks && msg.subtasks.length > 0 && (
                  <div className="space-y-2 max-w-[85%]">
                    {/* Add all button */}
                    <button
                      onClick={() => handleAddAll(msg.id, msg.subtasks!)}
                      disabled={msg.added?.size === msg.subtasks?.length}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                      style={{
                        background: msg.added?.size === msg.subtasks?.length ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, rgba(255,122,0,0.2), rgba(255,122,0,0.08))',
                        border: '1px solid rgba(255,122,0,0.25)',
                        color: msg.added?.size === msg.subtasks?.length ? '#22c55e' : '#ff7a00',
                      }}
                    >
                      {msg.added?.size === msg.subtasks?.length ? (
                        <>All Added!</>
                      ) : (
                        <>
                          <Zap size={12} />
                          Add All Tasks
                        </>
                      )}
                    </button>

                    {/* Individual subtasks */}
                    {msg.subtasks.map((subtask, i) => {
                      const added = msg.added?.has(i);
                      const { icon: Icon, color } = TYPE_CONFIG[subtask.type];

                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleAddSubtask(msg.id, i, subtask)}
                          disabled={added}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group"
                          style={{
                            background: added ? 'rgba(34,197,94,0.08)' : '#1a1a1a',
                            border: `1px solid ${added ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}15` }}
                          >
                            <Icon size={16} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: added ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)' }}
                            >
                              {subtask.title}
                            </p>
                            <p
                              className="text-[10px] mt-0.5"
                              style={{ color: added ? 'rgba(255,255,255,0.25)' : color }}
                            >
                              {subtask.type}
                            </p>
                          </div>
                          {added ? (
                            <span className="text-[10px] text-green-400 font-medium">Added</span>
                          ) : (
                            <Plus size={16} className="text-white/30 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-white/5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDecompose(input)}
            placeholder="e.g. Plan Calculus Chapter 5"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500 transition-all"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDecompose(input)}
            disabled={!input.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-black transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #ff7a00, #ff9d45)' }}
          >
            <Sparkles size={18} />
          </motion.button>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {['Physics Chapter 1', 'Organic Chemistry', 'Math Calculus', 'Biology Cells'].map((s) => (
            <button
              key={s}
              onClick={() => setInput(`Plan ${s}`)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
