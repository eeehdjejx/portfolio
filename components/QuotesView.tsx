'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Quote, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore, QUOTES } from '@/lib/store';

export default function QuotesView() {
  const { getTodayQuote } = useUIStore();
  const [currentIndex, setCurrentIndex] = useState(() => {
    const q = getTodayQuote();
    return QUOTES.findIndex((qu) => qu.id === q.id);
  });
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState(1);

  const quote = QUOTES[currentIndex];

  const nextQuote = () => {
    setDirection(1);
    setCurrentIndex((i) => (i + 1) % QUOTES.length);
  };

  const prevQuote = () => {
    setDirection(-1);
    setCurrentIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  };

  const toggleLike = () => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(quote.id)) next.delete(quote.id);
      else next.add(quote.id);
      return next;
    });
  };

  const handleRandom = () => {
    setDirection(1);
    setCurrentIndex(Math.floor(Math.random() * QUOTES.length));
  };

  const isLiked = liked.has(quote.id);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-white">Daily Motivation</h1>
        <p className="text-xs text-white/40 mt-0.5">
          {currentIndex + 1} of {QUOTES.length} quotes
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Quote card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={quote.id}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 60, scale: 0.95 }),
              center: { opacity: 1, x: 0, scale: 1 },
              exit: (d: number) => ({ opacity: 0, x: d * -60, scale: 0.95 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm p-8 rounded-3xl text-center"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(255,122,0,0.12)' }}
            >
              <Quote size={22} style={{ color: '#ff7a00' }} />
            </div>

            <blockquote className="text-lg font-medium text-white leading-relaxed mb-6">
              &ldquo;{quote.text}&rdquo;
            </blockquote>

            <p className="text-sm text-white/40 font-medium">— {quote.author}</p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button onClick={prevQuote} className="p-3 rounded-xl transition-all hover:scale-110" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <ChevronLeft size={20} className="text-white/50" />
          </button>

          <button
            onClick={toggleLike}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isLiked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isLiked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Heart
              size={20}
              style={{
                color: isLiked ? '#ef4444' : 'rgba(255,255,255,0.3)',
                fill: isLiked ? '#ef4444' : 'none',
              }}
            />
          </button>

          <button
            onClick={nextQuote}
            className="p-3 rounded-xl transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <ChevronRight size={20} className="text-white/50" />
          </button>
        </div>

        {/* Random */}
        <button onClick={handleRandom} className="mt-4 flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-all">
          <RefreshCw size={14} />
          Random quote
        </button>

        {/* Liked quotes */}
        {liked.size > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 w-full max-w-sm">
            <p className="text-xs text-white/30 mb-3 uppercase tracking-wider font-medium">Saved ({liked.size})</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {QUOTES.filter((q) => liked.has(q.id)).map((q) => (
                <div key={q.id} className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-xs text-white/60 leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                  <p className="text-xs text-white/25 mt-1">— {q.author}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
