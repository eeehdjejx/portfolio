'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2, Edit3, CheckCircle2, Circle, BookOpen, Pen, Brain, Heart, List, Repeat } from 'lucide-react';
import { useTaskStore } from '@/lib/store';
import { Task, TaskType, Category } from '@/lib/types';
import TaskModal from './TaskModal';

interface TaskCardProps {
  task: Task;
}

const TYPE_CONFIG: Record<TaskType, { icon: React.ElementType; color: string; label: string }> = {
  Explain: { icon: BookOpen, color: '#3b82f6', label: 'Explain' },
  Solve: { icon: Pen, color: '#22c55e', label: 'Solve' },
  Review: { icon: Brain, color: '#a855f7', label: 'Review' },
  General: { icon: CheckCircle2, color: '#ff7a00', label: 'General' },
};

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; color: string }> = {
  Study: { icon: BookOpen, color: '#ff7a00' },
  Spiritual: { icon: Heart, color: '#a855f7' },
  Normal: { icon: List, color: '#22c55e' },
};

export default function TaskCard({ task }: TaskCardProps) {
  const { toggleTask, deleteTask } = useTaskStore();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const typeCfg = TYPE_CONFIG[task.type];
  const TypeIcon = typeCfg.icon;
  const catCfg = CATEGORY_CONFIG[task.category];
  const CatIcon = catCfg.icon;

  const handleDelete = () => {
    if (confirmDelete) {
      deleteTask(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        className="group relative rounded-2xl overflow-hidden"
        style={{
          background: '#1a1a1a',
          border: `1px solid rgba(255,255,255,0.06)`,
          opacity: task.completed ? 0.5 : 1,
        }}
      >
        {/* Category indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: catCfg.color }} />

        <div className="flex items-start gap-3 px-4 py-4 pl-5">
          {/* Complete toggle */}
          <button
            onClick={() => toggleTask(task.id)}
            className="mt-0.5 flex-shrink-0 active:scale-90"
            style={{ minHeight: '40px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {task.completed ? (
              <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
            ) : (
              <Circle size={22} className="text-white/20" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${task.completed ? 'line-through text-white/30' : 'text-white'}`}>
              {task.title}
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Category badge */}
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: `${catCfg.color}12`, color: catCfg.color }}>
                <CatIcon size={10} />
                {task.category}
              </span>

              {/* Type badge for Study */}
              {task.category === 'Study' && task.type !== 'General' && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]" style={{ background: `${typeCfg.color}12`, color: typeCfg.color }}>
                  <TypeIcon size={10} />
                  {typeCfg.label}
                </span>
              )}

              {task.subject && (
                <span className="text-[10px] text-white/40">
                  {task.subject}{task.chapter && ` Ch.${task.chapter}`}
                </span>
              )}

              {task.time && (
                <span className="flex items-center gap-1 text-[10px] text-white/35">
                  <Clock size={10} />
                  {task.time}
                </span>
              )}

              {task.srsConfig?.enabled && (
                <span className="flex items-center gap-1 text-[10px] text-orange-400/60">
                  <Repeat size={10} />
                  {task.srsConfig.interval}d
                </span>
              )}

              {task.isAIGenerated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">AI</span>
              )}
            </div>
          </div>

          {/* Actions - larger touch targets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditOpen(true)}
              className="p-2.5 rounded-xl active:scale-90"
              style={{ background: 'rgba(255,255,255,0.03)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Edit3 size={16} className="text-white/40" />
            </button>
            <button
              onClick={handleDelete}
              className={`p-2.5 rounded-xl active:scale-90 ${
                confirmDelete ? 'bg-red-500/20' : ''
              }`}
              style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={16} className={confirmDelete ? 'text-red-400' : 'text-white/40'} />
            </button>
          </div>
        </div>
      </motion.div>

      <TaskModal open={editOpen} onClose={() => setEditOpen(false)} editTask={task} />
    </>
  );
}
