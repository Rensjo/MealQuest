// ============================================================================
// MealQuest - Floating Missions Button
// ============================================================================
// Controlled missions panel with daily quests and grocery quests.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, X, Zap, ShoppingCart, Check } from 'lucide-react';
import { cn } from '@/utils';
import { useQuestStore } from '@/stores/questStore';
import { MissionCard } from '@/components/gaming/GamingComponents';
import { soundManager } from '../../services/soundManager';

interface FloatingMissionsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function FloatingMissions({ isOpen: externalOpen, onClose: externalClose }: FloatingMissionsProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dailyMissions = useQuestStore((s) => s.dailyMissions);
  const groceryQuests = useQuestStore((s) => s.groceryQuests);

  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;
  const closePanel = isControlled ? () => externalClose?.() : () => setInternalOpen(false);

  const completedCount = dailyMissions.filter((m) => m.completed).length;
  const groceryCompleted = groceryQuests.filter((q) => q.completed).length;
  const hasUnfinished = completedCount < dailyMissions.length || groceryCompleted < groceryQuests.length;

  const remainingXP = dailyMissions.filter((m) => !m.completed).reduce((sum, mission) => sum + mission.xpReward, 0)
    + groceryQuests.filter((q) => !q.completed).reduce((sum, quest) => sum + quest.xpReward, 0);

  return (
    <>
      {!isControlled && (
        <motion.button
          onClick={() => { soundManager.playClick(); setInternalOpen(!internalOpen); }}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center',
            'rounded-full border bg-neutral-900/95 backdrop-blur-sm',
            'shadow-lg transition-all duration-300',
            'hover:scale-105 active:scale-95',
            hasUnfinished
              ? 'border-brand/40 text-brand shadow-neon pulse-dot'
              : 'border-neutral-700 text-neutral-400 hover:border-brand/30 hover:text-brand'
          )}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          {internalOpen ? <X size={22} /> : <Scroll size={22} />}
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => { soundManager.playClick(); closePanel(); }}
            />
            <motion.div
              initial={{ opacity: 0, y: isControlled ? -10 : 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isControlled ? -10 : 40, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              className={cn(
                'fixed z-50 w-[22rem] max-h-[76vh] overflow-y-auto',
                isControlled ? 'top-[68px] right-4' : 'bottom-24 right-6',
                'rounded-2xl border border-brand/12 bg-[#0c0600]/98 backdrop-blur-md p-5 shadow-2xl'
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scroll size={18} className="text-brand" />
                  <h3 className="text-sm font-bold text-white">Daily Missions</h3>
                </div>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {completedCount + groceryCompleted}/{dailyMissions.length + groceryQuests.length}
                </span>
              </div>

              <div className="space-y-2">
                {dailyMissions.length === 0 && groceryQuests.length === 0 ? (
                  <div className="py-8 text-center">
                    <Scroll size={32} className="mx-auto mb-2 text-amber-200/20" />
                    <p className="text-sm text-amber-200/40">Missions refresh daily</p>
                    <p className="text-xs text-amber-200/25">Check back soon!</p>
                  </div>
                ) : (
                  <>
                    {dailyMissions.map((mission) => (
                      <MissionCard key={mission.id} mission={mission} />
                    ))}

                    {/* Grocery Quests — inline with daily missions */}
                    {groceryQuests.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-2">
                          <span className="h-px flex-1 bg-emerald-400/12" />
                          <div className="flex items-center gap-1.5">
                            <ShoppingCart size={11} className="text-emerald-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60">Grocery Quests</span>
                          </div>
                          <span className="h-px flex-1 bg-emerald-400/12" />
                        </div>
                        {groceryQuests.map((quest) => (
                          <div
                            key={quest.id}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                              quest.completed
                                ? 'border-emerald-500/20 bg-emerald-500/6'
                                : 'border-white/8 bg-white/[0.02]'
                            )}
                          >
                            {/* Read-only status indicator */}
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                                quest.completed
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                  : 'border-emerald-400/20 bg-transparent text-emerald-400/40'
                              )}
                            >
                              {quest.completed ? <Check size={14} /> : <ShoppingCart size={14} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-sm font-medium', quest.completed ? 'text-amber-200/30 line-through' : 'text-white/90')}>
                                {quest.title}
                              </p>
                              <p className="truncate text-xs text-amber-200/30">{quest.description}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-400">+{quest.xpReward} XP</span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>

              {(dailyMissions.length > 0 || groceryQuests.length > 0) && (
                <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-brand/10 bg-brand/5 py-2 text-xs">
                  <Zap size={12} className="text-brand" />
                  <span className="text-amber-200/40">{remainingXP} XP remaining across all quests</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
