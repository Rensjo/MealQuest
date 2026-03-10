// ============================================================================
// MealQuest — Gamified Status Panel
// ============================================================================
// Always-visible top bar showing level, XP progress, streak, and quick actions.
// Clickable buttons open inline panels for weekly review & streak details.

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../services/soundManager';
import {
  Zap,
  Flame,
  Trophy,
  Star,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Swords,
} from 'lucide-react';
import { cn } from '@/utils';
import { useXPStore } from '@/stores/xpStore';
import { useStreakStore } from '@/stores/streakStore';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useQuestStore } from '@/stores/questStore';
import { formatDate, startOfWeekISO, endOfWeekISO, getWeekDates } from '@/utils/date';
import { calculateWeeklyGrade } from '@/utils/gamification';
import { BossCard } from '@/components/gaming/GamingComponents';
import type { StreakRecord, WeeklyBoss, NutritionGoal } from '@/types';

// ---------------------------------------------------------------------------
// Status Panel
// ---------------------------------------------------------------------------

export function StatusPanel() {
  const { totalXP, level } = useXPStore();
  const xpInfo = useXPStore((s) => s.getXPToNextLevel());
  const streaks = useStreakStore((s) => s.getAllStreaks());
  const goals = useSettingsStore((s) => s.nutritionGoals);
  const weeklyBoss = useQuestStore((s) => s.weeklyBoss);
  const updateBossCondition = useQuestStore((s) => s.updateBossCondition);

  const [expandedPanel, setExpandedPanel] = useState<'streak' | 'weekly' | null>(null);

  const topStreak = useMemo(() => {
    const active = streaks.filter((s) => s.current > 0);
    if (active.length === 0) return null;
    return active.reduce((best, s) => (s.current > best.current ? s : best), active[0]);
  }, [streaks]);

  const togglePanel = (panel: 'streak' | 'weekly') => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="relative">
      {/* Main Status Bar */}
      <div className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl',
        'border border-neutral-800/60 bg-neutral-900/90 backdrop-blur-sm',
        'px-4 py-3 shadow-lg',
        'sm:flex-nowrap sm:gap-4'
      )}>
        {/* Level Badge */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand shadow-neon">
            <Star size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">Level</p>
            <p className="text-lg font-black text-brand">{level}</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-brand" />
              {xpInfo.current} / {xpInfo.required} XP
            </span>
            <span className="text-brand font-medium">{Math.round(xpInfo.progress)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand to-neon-gold"
              style={{ boxShadow: '0 0 8px rgba(230, 183, 95, 0.4)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, xpInfo.progress)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Total XP */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-brand/5 border border-brand/10 px-2.5 py-1.5">
          <Zap size={14} className="text-brand" />
          <span className="text-sm font-bold text-brand">{totalXP.toLocaleString()}</span>
          <span className="text-[10px] text-neutral-500">XP</span>
        </div>

        {/* Streak Button */}
        <button
          onClick={() => { soundManager.playClick(); togglePanel('streak'); }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-200',
            'border',
            expandedPanel === 'streak'
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-orange-400 hover:border-orange-500/20'
          )}
        >
          <Flame size={16} className={topStreak && topStreak.current >= 3 ? 'text-orange-400' : ''} />
          <span className="text-sm font-bold">{topStreak?.current ?? 0}</span>
          {expandedPanel === 'streak' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Weekly Review Button */}
        <button
          onClick={() => { soundManager.playClick(); togglePanel('weekly'); }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-200',
            'border',
            expandedPanel === 'weekly'
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:text-purple-400 hover:border-purple-500/20'
          )}
        >
          <Trophy size={16} />
          <span className="text-xs font-medium hidden sm:inline">Weekly</span>
          {expandedPanel === 'weekly' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expandable Panels */}
      <AnimatePresence>
        {expandedPanel === 'streak' && (
          <StreakPanel streaks={streaks} />
        )}
        {expandedPanel === 'weekly' && (
          <WeeklyPanel
            goals={goals}
            weeklyBoss={weeklyBoss}
            onUpdateBossCondition={updateBossCondition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streak Panel
// ---------------------------------------------------------------------------

function StreakPanel({ streaks }: { streaks: StreakRecord[] }) {
  const labels: Record<string, string> = {
    breakfast: 'Breakfast',
    hydration: 'Hydration',
    'home-cooked': 'Home Chef',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-xl border border-orange-500/20 bg-neutral-900/95 p-4 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Flame size={16} className="text-orange-400" />
          Active Streaks
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {streaks.map((streak) => (
            <div
              key={streak.type}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                streak.current > 0
                  ? streak.current >= 7
                    ? 'border-brand/30 bg-brand/5'
                    : 'border-orange-500/20 bg-orange-500/5'
                  : 'border-neutral-800 bg-neutral-800/20'
              )}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg text-lg font-black',
                streak.current > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-neutral-800 text-neutral-600'
              )}>
                {streak.current}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{labels[streak.type] ?? streak.type}</p>
                <p className="text-[10px] text-neutral-500">
                  Longest: {streak.longest} days
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Weekly Review Panel
// ---------------------------------------------------------------------------

interface WeeklyPanelProps {
  goals: NutritionGoal;
  weeklyBoss: WeeklyBoss | null;
  onUpdateBossCondition: (conditionId: string, met: boolean) => void;
}

function WeeklyPanel({ goals, weeklyBoss, onUpdateBossCondition }: WeeklyPanelProps) {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const totalXP = useXPStore((s) => s.totalXP);
  const level = useXPStore((s) => s.level);

  const weekStart = startOfWeekISO();
  const weekEnd = endOfWeekISO();
  const weekDates = getWeekDates();

  const weekMeals = useMemo(
    () => getMealsByDateRange(weekStart, weekEnd),
    [getMealsByDateRange, weekStart, weekEnd]
  );

  const daysLogged = useMemo(() => {
    return weekDates.filter((d) => weekMeals.some((m) => m.date === d)).length;
  }, [weekDates, weekMeals]);

  const avg = useMemo(() => {
    const div = daysLogged || 1;
    return {
      calories: Math.round(weekMeals.reduce((s, m) => s + m.calories, 0) / div),
    };
  }, [weekMeals, daysLogged]);

  const grade = useMemo(
    () => calculateWeeklyGrade(avg.calories, goals.calories, daysLogged, 7),
    [avg.calories, goals.calories, daysLogged]
  );

  const GRADE_COLORS: Record<string, string> = {
    S: 'text-yellow-300',
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-orange-400',
    D: 'text-red-400',
    F: 'text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-xl border border-purple-500/20 bg-neutral-900/95 p-4 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy size={16} className="text-purple-400" />
          Weekly Review — {formatDate(weekStart, 'MMM d')} – {formatDate(weekEnd, 'MMM d')}
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Grade */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 text-center">
            <p className={cn('text-3xl font-black', GRADE_COLORS[grade] ?? 'text-white')}>
              {grade}
            </p>
            <p className="text-[10px] text-neutral-500">Weekly Grade</p>
          </div>

          {/* Days Logged */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 text-center">
            <p className="text-2xl font-bold text-white">{daysLogged}/7</p>
            <p className="text-[10px] text-neutral-500">Days Logged</p>
          </div>

          {/* Total Meals */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 text-center">
            <p className="text-2xl font-bold text-white">{weekMeals.length}</p>
            <p className="text-[10px] text-neutral-500">Total Meals</p>
          </div>

          {/* Level */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 text-center">
            <p className="text-2xl font-bold text-brand">Lv.{level}</p>
            <p className="text-[10px] text-neutral-500">{totalXP.toLocaleString()} XP</p>
          </div>
        </div>

        {/* Boss Battle (if active) */}
        {weeklyBoss && weeklyBoss.status === 'active' && (
          <div className="mt-3">
            <BossCard boss={weeklyBoss} onUpdateCondition={onUpdateBossCondition} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
