// ============================================================================
// MealQuest — Weekly Review Page
// ============================================================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Minus, Trophy, Flame, Target, Droplets } from 'lucide-react';
import { SectionCard, Card, Badge, ProgressBar } from '@/components/ui';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useXPStore } from '@/stores/xpStore';
import { useStreakStore } from '@/stores/streakStore';
import { pageVariants, staggerContainer, staggerChild } from '@/utils/animations';
import { getWeekDates, formatDate, startOfWeekISO, endOfWeekISO } from '@/utils/date';
import { calculateWeeklyGrade } from '@/utils/gamification';

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-300',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-orange-400',
  D: 'text-red-400',
  F: 'text-red-600',
};

export default function WeeklyReview() {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const goals = useSettingsStore((s) => s.nutritionGoals);
  const totalXP = useXPStore((s) => s.totalXP);
  const level = useXPStore((s) => s.level);
  const streaks = useStreakStore((s) => s.getAllStreaks());

  const weekStart = startOfWeekISO();
  const weekEnd = endOfWeekISO();
  const weekDates = getWeekDates();

  const weekMeals = useMemo(
    () => getMealsByDateRange(weekStart, weekEnd),
    [getMealsByDateRange, weekStart, weekEnd]
  );

  // Daily breakdown
  const dailyData = useMemo(() => {
    return weekDates.map((date) => {
      const meals = weekMeals.filter((m) => m.date === date);
      return {
        date,
        label: formatDate(date, 'short'),
        calories: meals.reduce((s, m) => s + m.calories, 0),
        protein: meals.reduce((s, m) => s + m.protein, 0),
        carbs: meals.reduce((s, m) => s + m.carbs, 0),
        fat: meals.reduce((s, m) => s + m.fat, 0),
        water: meals.reduce((s, m) => s + (m.water ?? 0), 0),
        mealCount: meals.length,
      };
    });
  }, [weekDates, weekMeals]);

  const daysLogged = dailyData.filter((d) => d.mealCount > 0).length;

  // Averages
  const avg = useMemo(() => {
    const div = daysLogged || 1;
    return {
      calories: Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / div),
      protein: Math.round(dailyData.reduce((s, d) => s + d.protein, 0) / div),
      carbs: Math.round(dailyData.reduce((s, d) => s + d.carbs, 0) / div),
      fat: Math.round(dailyData.reduce((s, d) => s + d.fat, 0) / div),
      water: Math.round(dailyData.reduce((s, d) => s + d.water, 0) / div),
    };
  }, [dailyData, daysLogged]);

  // Grade calculation
  const grade = useMemo(
    () => calculateWeeklyGrade(avg.calories, goals.calories, daysLogged, 7),
    [avg.calories, goals.calories, daysLogged]
  );

  const goalPercent = (actual: number, target: number) =>
    target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;

  const trendIcon = (actual: number, target: number) => {
    const ratio = target > 0 ? actual / target : 0;
    if (ratio >= 0.9 && ratio <= 1.1) return <Minus size={14} className="text-green-400" />;
    if (ratio < 0.9) return <TrendingDown size={14} className="text-red-400" />;
    return <TrendingUp size={14} className="text-orange-400" />;
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Weekly Review</h1>
        <p className="text-sm text-neutral-400">
          Week of {formatDate(weekStart, 'short')} – {formatDate(weekEnd, 'short')}
        </p>
      </div>

      {/* Grade + Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Grade Card */}
        <Card className="flex flex-col items-center justify-center py-6" glow>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className={`text-6xl font-black ${GRADE_COLORS[grade] ?? 'text-white'}`}>
              {grade}
            </div>
          </motion.div>
          <p className="mt-1 text-xs text-neutral-500">Weekly Grade</p>
        </Card>

        <Card className="text-center">
          <Target size={20} className="mx-auto mb-1 text-brand" />
          <p className="text-xs text-neutral-500">Days Logged</p>
          <p className="text-2xl font-bold text-white">{daysLogged}/7</p>
        </Card>

        <Card className="text-center">
          <Flame size={20} className="mx-auto mb-1 text-orange-400" />
          <p className="text-xs text-neutral-500">Total Meals</p>
          <p className="text-2xl font-bold text-white">{weekMeals.length}</p>
        </Card>

        <Card className="text-center">
          <Trophy size={20} className="mx-auto mb-1 text-yellow-400" />
          <p className="text-xs text-neutral-500">Level / XP</p>
          <p className="text-2xl font-bold text-white">Lv.{level}</p>
          <p className="text-xs text-neutral-500">{totalXP.toLocaleString()} XP</p>
        </Card>
      </div>

      {/* Goal vs. Actual */}
      <SectionCard title="Goal vs. Actual (Avg/Day)" subtitle="How close are you to your targets?">
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {[
            { label: 'Calories', actual: avg.calories, goal: goals.calories, unit: 'kcal', color: '#E6B75F' },
            { label: 'Protein', actual: avg.protein, goal: goals.protein, unit: 'g', color: '#60A5FA' },
            { label: 'Carbs', actual: avg.carbs, goal: goals.carbs, unit: 'g', color: '#34D399' },
            { label: 'Fat', actual: avg.fat, goal: goals.fat, unit: 'g', color: '#FB923C' },
            { label: 'Water', actual: avg.water, goal: goals.water, unit: 'ml', color: '#38BDF8' },
          ].map((row) => (
            <motion.div key={row.label} variants={staggerChild}>
              <div className="flex items-center gap-3">
                {trendIcon(row.actual, row.goal)}
                <div className="w-20 text-sm text-neutral-300">{row.label}</div>
                <div className="flex-1">
                  <ProgressBar
                    value={goalPercent(row.actual, row.goal)}
                    max={100}
                    color={row.color}
                  />
                </div>
                <div className="w-28 text-right text-xs text-neutral-400">
                  {row.actual} / {row.goal} {row.unit}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </SectionCard>

      {/* Daily Breakdown */}
      <SectionCard title="Daily Breakdown" subtitle="See each day's totals">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                <th className="pb-2 pr-4">Day</th>
                <th className="pb-2 pr-4">Meals</th>
                <th className="pb-2 pr-4">Calories</th>
                <th className="pb-2 pr-4">Protein</th>
                <th className="pb-2 pr-4">Carbs</th>
                <th className="pb-2 pr-4">Fat</th>
                <th className="pb-2">Water</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day) => (
                <tr key={day.date} className="border-b border-neutral-800/50">
                  <td className="py-2 pr-4 text-neutral-300">{day.label}</td>
                  <td className="py-2 pr-4 text-neutral-400">{day.mealCount}</td>
                  <td className="py-2 pr-4 font-medium text-brand">{day.calories}</td>
                  <td className="py-2 pr-4 text-blue-400">{day.protein}g</td>
                  <td className="py-2 pr-4 text-green-400">{day.carbs}g</td>
                  <td className="py-2 pr-4 text-orange-400">{day.fat}g</td>
                  <td className="py-2 text-sky-400">{day.water} ml</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Streaks Summary */}
      <SectionCard title="Streak Summary" subtitle="Your active streaks this week">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {streaks.map((streak) => (
            <div
              key={streak.type}
              className={`rounded-lg border p-3 ${
                streak.current > 0
                  ? 'border-brand/20 bg-brand/5'
                  : 'border-neutral-800 bg-neutral-800/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame size={16} className={streak.current > 0 ? 'text-brand' : 'text-neutral-600'} />
                <p className="text-sm font-medium text-white capitalize">{streak.type.replace(/-/g, ' ')}</p>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {streak.current} day{streak.current !== 1 ? 's' : ''} current · {streak.longest} longest
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}
