// ============================================================================
// MealQuest — Gaming Components
// ============================================================================
// XP notifications, level-up celebration, energy meter, streak display, etc.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy, Star, Swords, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/utils';
import { floatUp } from '@/utils/animations';
import type { StreakRecord, CharacterEnergy, Mission, Badge as BadgeType, WeeklyBoss } from '@/types';
import { useXPStore } from '@/stores/xpStore';

// ---------------------------------------------------------------------------
// Floating XP Notification
// ---------------------------------------------------------------------------

interface FloatingXPProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

export function FloatingXP({ amount, show, onComplete }: FloatingXPProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={floatUp}
          initial="initial"
          animate="animate"
          onAnimationComplete={onComplete}
          className="pointer-events-none fixed right-8 top-20 z-50 text-lg font-bold text-brand drop-shadow-lg"
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Level Up Celebration
// ---------------------------------------------------------------------------

interface LevelUpProps {
  level: number;
  show: boolean;
  onDismiss: () => void;
}

export function LevelUpCelebration({ level, show, onDismiss }: LevelUpProps) {
  const { current: xpCurrent, required: xpRequired, progress } = useXPStore(
    (s) => s.getXPToNextLevel()
  );

  // Sparkle positions — deterministic per level value
  const sparkles = React.useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      x: Math.cos((i / 8) * Math.PI * 2) * 120,
      y: Math.sin((i / 8) * Math.PI * 2) * 120,
      delay: i * 0.07,
    })),
  []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={onDismiss}
        >
          {/* Orbit sparkles */}
          {sparkles.map((s, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute text-brand/70"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x: s.x, y: s.y, scale: [0, 1.2, 0.8], opacity: [0, 1, 0] }}
              transition={{ delay: s.delay, duration: 0.9, ease: 'easeOut' }}
            >
              <Sparkles size={14} />
            </motion.div>
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.45, duration: 0.7 }}
            className="flex flex-col items-center gap-5 rounded-2xl border border-brand/40 bg-[#0c0600]/98 p-10 shadow-[0_0_60px_rgba(230,183,95,0.2)] backdrop-blur-sm"
            style={{ minWidth: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/15 text-brand"
              animate={{ boxShadow: ['0 0 0px rgba(230,183,95,0)', '0 0 30px rgba(230,183,95,0.5)', '0 0 0px rgba(230,183,95,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star size={40} />
            </motion.div>

            {/* Titles */}
            <div className="space-y-1 text-center">
              <h2 className="text-3xl font-bold text-white">Level Up!</h2>
              <p className="text-2xl font-semibold text-brand">Level {level}</p>
              <p className="text-sm text-neutral-400">Keep fueling your journey!</p>
            </div>

            {/* XP progress toward next level */}
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Progress to Level {level + 1}</span>
                <span>{xpCurrent} / {xpRequired} XP</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-800 border border-neutral-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand/70 to-brand"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(progress * 100)}%` }}
                  transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="mt-1 rounded-lg border border-brand/30 bg-brand/10 px-6 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Character Energy Meter
// ---------------------------------------------------------------------------

interface EnergyMeterProps {
  energy: CharacterEnergy;
  className?: string;
}

export function EnergyMeter({ energy, className }: EnergyMeterProps) {
  const percent = (energy.current / energy.max) * 100;
  const color =
    percent >= 70 ? 'from-green-500 to-green-400' :
    percent >= 40 ? 'from-yellow-500 to-yellow-400' :
    'from-red-500 to-red-400';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          <Zap size={16} className="text-neon-energy" />
          Energy
        </div>
        <span className="text-xs text-neutral-400">
          {energy.current}/{energy.max}
        </span>
      </div>
      <div className="h-3 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percent)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streak Display
// ---------------------------------------------------------------------------

interface StreakDisplayProps {
  streak: StreakRecord;
  className?: string;
}

export function StreakDisplay({ streak, className }: StreakDisplayProps) {
  const { type, current, longest } = streak;
  const labels: Record<string, string> = {
    breakfast: 'Breakfast Streak',
    hydration: 'Hydration Streak',
    'home-cooked': 'Home Chef Streak',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-800/30 p-3',
      current >= 7 && 'border-brand/30 shadow-neon',
      className
    )}>
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg',
        current >= 7 ? 'bg-brand/10 text-brand' : 'bg-neutral-800 text-neutral-400'
      )}>
        <Flame size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{labels[type] ?? type}</p>
        <p className="text-xs text-neutral-500">Longest: {longest} days</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-brand">{current}</p>
        <p className="text-[10px] uppercase text-neutral-500">Days</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mission Card
// ---------------------------------------------------------------------------

interface MissionCardProps {
  mission: Mission;
  onComplete?: (id: string) => void; // kept for API compat, no longer used for manual trigger
}

export function MissionCard({ mission }: MissionCardProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border p-3 transition-colors',
      mission.completed
        ? 'border-green-500/20 bg-green-500/5'
        : 'border-neutral-800 bg-neutral-800/30'
    )}>
      {/* Status indicator — read-only, quests complete via gameplay triggers only */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
          mission.completed
            ? 'border-green-500 bg-green-500/10 text-green-400'
            : 'border-neutral-700 bg-neutral-800/50 text-neutral-600'
        )}
      >
        {mission.completed ? '✓' : '🔒'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          mission.completed ? 'text-neutral-500 line-through' : 'text-white'
        )}>
          {mission.title}
        </p>
        <p className="text-xs text-neutral-500 truncate">{mission.description}</p>
      </div>
      <span className="text-xs font-medium text-brand">+{mission.xpReward} XP</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Boss Battle Card
// ---------------------------------------------------------------------------

interface BossCardProps {
  boss: WeeklyBoss;
  onUpdateCondition: (conditionId: string, met: boolean) => void;
}

export function BossCard({ boss, onUpdateCondition }: BossCardProps) {
  const metCount = boss.conditions.filter((c) => c.met).length;
  const progress = (metCount / boss.conditions.length) * 100;

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
          <Swords size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{boss.name}</h3>
          <p className="text-xs text-neutral-400">{boss.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        {boss.conditions.map((cond) => (
          <div
            key={cond.id}
            className="flex items-center gap-2 text-sm"
          >
            <button
              onClick={() => onUpdateCondition(cond.id, !cond.met)}
              className={cn(
                'h-5 w-5 rounded border flex items-center justify-center text-xs transition-colors',
                cond.met
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-neutral-600 text-transparent hover:border-brand'
              )}
            >
              {cond.met ? '✓' : ''}
            </button>
            <span className={cond.met ? 'text-neutral-500 line-through' : 'text-neutral-300'}>
              {cond.label}
            </span>
          </div>
        ))}
      </div>

      {/* Reward */}
      <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
        <span className="flex items-center gap-1">
          <Trophy size={14} className="text-brand" />
          Reward: +{boss.xpReward} XP
        </span>
        <span className={cn(
          'font-medium uppercase',
          boss.status === 'victory' ? 'text-green-400' :
          boss.status === 'defeat' ? 'text-red-400' : 'text-yellow-400'
        )}>
          {boss.status}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Display
// ---------------------------------------------------------------------------

interface BadgeDisplayProps {
  badge: BadgeType;
  size?: 'sm' | 'md';
}

export function BadgeDisplay({ badge, size = 'md' }: BadgeDisplayProps) {
  const isLocked = !badge.unlockedAt;

  return (
    <div className={cn(
      'flex flex-col items-center gap-1 rounded-lg p-3 text-center transition-all',
      isLocked ? 'opacity-40 grayscale' : 'hover:bg-neutral-800/30',
      size === 'sm' && 'p-2'
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-full border',
        isLocked
          ? 'border-neutral-700 bg-neutral-800 text-neutral-600'
          : 'border-brand/30 bg-brand/10 text-brand shadow-neon',
        size === 'md' ? 'h-12 w-12' : 'h-9 w-9'
      )}>
        <Trophy size={size === 'md' ? 20 : 16} />
      </div>
      <p className={cn(
        'font-medium',
        size === 'md' ? 'text-xs' : 'text-[10px]',
        isLocked ? 'text-neutral-600' : 'text-neutral-300'
      )}>
        {badge.name}
      </p>
    </div>
  );
}
