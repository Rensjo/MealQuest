import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { soundManager } from '../../services/soundManager';
import type { DietStrategy } from '@/types';

interface GoalsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIET_OPTS: { value: DietStrategy; label: string; desc: string; icon: string }[] = [
  { value: 'balanced',     label: 'Balanced',      desc: 'Even macro distribution',       icon: '⚖️' },
  { value: 'high-protein', label: 'High Protein',   desc: 'Prioritize protein intake',     icon: '💪' },
  { value: 'keto',         label: 'Keto',           desc: 'Very low carb, high fat',       icon: '🥑' },
  { value: 'plant-based',  label: 'Plant-Based',    desc: 'Focus on whole plant foods',    icon: '🥦' },
  { value: 'performance',  label: 'Performance',    desc: 'Optimized for athletic goals',  icon: '🏃' },
];

export default function GoalsPanel({ isOpen, onClose }: GoalsPanelProps) {
  const settings = useSettingsStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-[84px] right-3 z-50 w-72 rounded-2xl border border-brand/30 bg-[#1a0c02]/97 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Gold glow bar */}
            <div className="h-[3px] bg-gradient-to-r from-transparent via-brand to-transparent" />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center">
                    <Target className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Goals</p>
                    <p className="text-zinc-500 text-[10px]">Diet strategy & nutrition</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Diet Strategy */}
              <div>
                <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-2.5">
                  Nutrition Approach
                </p>
                <div className="space-y-1.5">
                  {DIET_OPTS.map((opt) => {
                    const active = settings.dietStrategy === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        onClick={() => { soundManager.playClick(); settings.setDietStrategy(opt.value); }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                          active
                            ? 'border-brand/50 bg-brand/12 shadow-[0_0_12px_rgba(230,183,95,0.12)]'
                            : 'border-[#3a1e08]/60 bg-[#241000]/40 hover:border-brand/28 hover:bg-brand/6'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{opt.icon}</span>
                          <div>
                            <p className={`text-xs font-semibold ${active ? 'text-brand' : 'text-zinc-200'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-zinc-500 leading-snug">{opt.desc}</p>
                          </div>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-brand shrink-0 ml-2" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
