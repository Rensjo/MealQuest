import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Swords, CheckCircle2, Circle, Zap, Star } from 'lucide-react';
import { useQuestStore } from '../../stores/questStore';
import { useXPStore } from '../../stores/xpStore';
import { useNotificationStore } from '../../stores/notificationStore';

interface WeeklyBossPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyBossPanel({ isOpen, onClose }: WeeklyBossPanelProps) {
  const { weeklyBoss, checkBossVictory } = useQuestStore();
  const victoryHandled = useRef(false);

  // Check for boss victory whenever conditions change
  useEffect(() => {
    if (!weeklyBoss || weeklyBoss.status !== 'active' || victoryHandled.current) return;
    const won = checkBossVictory();
    if (won) {
      victoryHandled.current = true;
      const { leveledUp, newLevel } = useXPStore.getState().awardXP(weeklyBoss.xpReward, 'weekly-boss', weeklyBoss.name);
      const push = useNotificationStore.getState().push;
      push({
        message: `Boss defeated: ${weeklyBoss.name}! 🎉`,
        xp: weeklyBoss.xpReward,
        tone: 'boss',
      });
      if (leveledUp) {
        push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
      }
    }
  }, [weeklyBoss, checkBossVictory]);

  const statusColors = {
    active: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40', label: 'ACTIVE' },
    victory: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/40', label: 'VICTORY!' },
    defeat: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/40', label: 'DEFEATED' },
  };

  const status = weeklyBoss?.status ?? 'active';
  const colors = statusColors[status] ?? statusColors.active;
  const metConditions = weeklyBoss?.conditions?.filter(c => c.met).length ?? 0;
  const totalConditions = weeklyBoss?.conditions?.length ?? 0;
  const bossProgress = totalConditions > 0 ? Math.round((metConditions / totalConditions) * 100) : 0;

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
            className="fixed top-[84px] right-3 z-50 w-72 rounded-2xl border border-red-500/30 bg-[#0f0f1a]/95 backdrop-blur-xl shadow-2xl shadow-red-900/30 overflow-hidden"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Red glow bar */}
            <div className="h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <Swords className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Weekly Boss</p>
                    <p className="text-zinc-500 text-[10px]">Battle resets Monday</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {weeklyBoss ? (
                <>
                  {/* Boss card */}
                  <div className="relative bg-gradient-to-br from-red-900/30 to-orange-900/20 border border-red-500/20 rounded-xl p-3 mb-3 overflow-hidden">
                    {/* Animated pulse glow */}
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ boxShadow: 'inset 0 0 30px rgba(239,68,68,0.15)' }}
                    />
                    <div className="relative flex items-start gap-3">
                      <div className="text-3xl leading-none mt-0.5 drop-shadow-lg">👹</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold text-sm leading-tight">{weeklyBoss.name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {colors.label}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-snug line-clamp-2">{weeklyBoss.description}</p>
                      </div>
                    </div>

                    {/* Boss HP bar */}
                    <div className="relative mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-red-400" />
                          <span className="text-[10px] text-zinc-400">Boss HP</span>
                        </div>
                        <span className="text-[10px] text-red-400 font-bold">{metConditions}/{totalConditions} conditions</span>
                      </div>
                      <div className="h-2.5 bg-zinc-900/80 rounded-full overflow-hidden border border-red-900/40">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500"
                          initial={{ width: '100%' }}
                          animate={{ width: `${100 - bossProgress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditions list */}
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 font-medium mb-2">Battle Conditions</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {weeklyBoss.conditions.map(condition => (
                        <motion.div
                          key={condition.id}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                            condition.met
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-zinc-800/40 border-zinc-700/30'
                          }`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          {condition.met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          )}
                          <span className={`text-xs flex-1 ${condition.met ? 'text-green-300 line-through opacity-70' : 'text-zinc-300'}`}>
                            {condition.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-brand/10 border border-brand/30 rounded-lg px-2.5 py-1.5 flex-1">
                      <Zap className="w-3.5 h-3.5 text-brand" />
                      <span className="text-brand text-xs font-bold">+{weeklyBoss.xpReward} XP</span>
                    </div>
                    {weeklyBoss.badgeReward && (
                      <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 rounded-lg px-2.5 py-1.5 flex-1">
                        <Star className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 text-xs font-bold truncate">{weeklyBoss.badgeReward}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-zinc-400 text-sm">No boss battle this week</p>
                  <p className="text-zinc-600 text-xs mt-1">Check back Monday!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
