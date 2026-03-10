// ============================================================================
// MealQuest — Streak Tracker Page
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Award, Calendar } from 'lucide-react';
import { SectionCard, Card, Badge } from '@/components/ui';
import { StreakDisplay, BossCard } from '@/components/gaming/GamingComponents';
import { useStreakStore } from '@/stores/streakStore';
import { useQuestStore } from '@/stores/questStore';
import { pageVariants, staggerContainer, staggerChild } from '@/utils/animations';

const STREAK_MILESTONES = [
  { days: 3, xp: 20, label: '3 Day Streak', tier: 'Bronze' },
  { days: 7, xp: 50, label: '7 Day Streak', tier: 'Silver' },
  { days: 14, xp: 100, label: '14 Day Streak', tier: 'Gold' },
  { days: 30, xp: 200, label: '30 Day Streak', tier: 'Legendary' },
];

export default function StreakTracker() {
  const streaks = useStreakStore((s) => s.getAllStreaks());
  const weeklyBoss = useQuestStore((s) => s.weeklyBoss);
  const updateBossCondition = useQuestStore((s) => s.updateBossCondition);

  const totalStreakDays = streaks.reduce((s, st) => s + st.current, 0);
  const longestEver = Math.max(...streaks.map((s) => s.longest), 0);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Healthy Streak Tracker</h1>
        <p className="text-sm text-neutral-400">Maintain consistency to earn bonus XP</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <div className="mb-2 flex justify-center text-brand">
            <Flame size={24} />
          </div>
          <p className="text-xs text-neutral-500">Active Streaks</p>
          <p className="text-xl font-bold text-white">
            {streaks.filter((s) => s.current > 0).length}
          </p>
        </Card>
        <Card className="text-center">
          <div className="mb-2 flex justify-center text-orange-400">
            <Calendar size={24} />
          </div>
          <p className="text-xs text-neutral-500">Total Streak Days</p>
          <p className="text-xl font-bold text-white">{totalStreakDays}</p>
        </Card>
        <Card className="text-center">
          <div className="mb-2 flex justify-center text-yellow-400">
            <Trophy size={24} />
          </div>
          <p className="text-xs text-neutral-500">Longest Ever</p>
          <p className="text-xl font-bold text-white">{longestEver} days</p>
        </Card>
        <Card className="text-center">
          <div className="mb-2 flex justify-center text-purple-400">
            <Award size={24} />
          </div>
          <p className="text-xs text-neutral-500">Milestones Hit</p>
          <p className="text-xl font-bold text-white">
            {streaks.reduce(
              (count, s) =>
                count + STREAK_MILESTONES.filter((m) => s.longest >= m.days).length,
              0
            )}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Streaks */}
        <SectionCard title="Active Streaks" subtitle="Keep the fire burning!">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {streaks.map((streak) => (
              <motion.div key={streak.type} variants={staggerChild}>
                <StreakDisplay streak={streak} />
              </motion.div>
            ))}
          </motion.div>
        </SectionCard>

        {/* Milestones */}
        <SectionCard title="Streak Milestones" subtitle="Rewards for consistency">
          <div className="space-y-3">
            {STREAK_MILESTONES.map((milestone) => {
              const achieved = streaks.some((s) => s.longest >= milestone.days);
              return (
                <div
                  key={milestone.days}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    achieved
                      ? 'border-brand/30 bg-brand/5'
                      : 'border-neutral-800 bg-neutral-800/20'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      achieved
                        ? 'bg-brand/10 text-brand'
                        : 'bg-neutral-800 text-neutral-600'
                    }`}
                  >
                    {milestone.days}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${achieved ? 'text-white' : 'text-neutral-500'}`}>
                      {milestone.label}
                    </p>
                    <p className="text-xs text-neutral-500">+{milestone.xp} XP · {milestone.tier}</p>
                  </div>
                  {achieved && <Badge variant="success">Achieved</Badge>}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Weekly Boss Battle */}
      {weeklyBoss && (
        <SectionCard title="Weekly Boss Battle" subtitle="Defeat the boss for massive rewards!">
          <BossCard boss={weeklyBoss} onUpdateCondition={updateBossCondition} />
        </SectionCard>
      )}
    </motion.div>
  );
}
