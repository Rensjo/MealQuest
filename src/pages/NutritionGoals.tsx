// ============================================================================
// MealQuest — Nutrition Goals Page
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Save, RotateCcw, Flame, Beef, Wheat, CircleDot, Droplets, TrendingUp, Award, CheckCircle2, Zap } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useNutritionStore } from '@/stores/nutritionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMealLogStore } from '@/stores/mealLogStore';
import { todayISO, getLast7Days } from '@/utils/date';
import { toPercent, cn } from '@/utils';
import { pageVariants, staggerContainer, staggerChild } from '@/utils/animations';
import { DIET_GOAL_PRESETS } from '@/utils/gamification';
import { soundManager } from '@/services/soundManager';
import type { DietStrategy } from '@/types';

const DIET_STRATEGY_META: { id: DietStrategy; label: string; emoji: string; desc: string; xpNote: string }[] = [
  { id: 'balanced',      label: 'Balanced',     emoji: '⚖️', desc: 'Standard macro split',       xpNote: 'Base XP rates'                },
  { id: 'high-protein',  label: 'High Protein', emoji: '💪', desc: 'Muscle-building focus',      xpNote: '+10% XP every meal'           },
  { id: 'keto',          label: 'Keto',         emoji: '🥑', desc: 'Very low carb, high fat',   xpNote: '+5% XP (non-snack meals)'     },
  { id: 'plant-based',   label: 'Plant-Based',  emoji: '🌱', desc: 'Whole-foods plant diet',    xpNote: '+15% XP home cooked meals'    },
  { id: 'performance',   label: 'Performance',  emoji: '⚡', desc: 'High-energy athlete diet',   xpNote: '+10% XP every meal'           },
];

export default function NutritionGoals() {
  const goals           = useNutritionStore((s) => s.goals);
  const setGoals        = useNutritionStore((s) => s.setGoals);
  const currentStrategy = useSettingsStore((s)  => s.dietStrategy);
  const setDietStrategy = useSettingsStore((s)  => s.setDietStrategy);
  const getDailyTotals  = useMealLogStore((s)   => s.getDailyTotals);
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);

  const today = todayISO();
  const totals = getDailyTotals(today);
  const last7 = getLast7Days();

  const weekMeals = useMemo(() => getMealsByDateRange(last7[0], last7[last7.length - 1]), [getMealsByDateRange, last7]);
  const weekAvg = useMemo(() => {
    if (weekMeals.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
    return {
      calories: Math.round(weekMeals.reduce((s, m) => s + m.calories, 0) / 7),
      protein: Math.round(weekMeals.reduce((s, m) => s + m.protein, 0) / 7),
      carbs: Math.round(weekMeals.reduce((s, m) => s + m.carbs, 0) / 7),
      fat: Math.round(weekMeals.reduce((s, m) => s + m.fat, 0) / 7),
      water: Math.round(weekMeals.reduce((s, m) => s + (m.water ?? 0), 0) / 7),
    };
  }, [weekMeals]);

  const [editCalories, setEditCalories] = useState(String(goals.calories));
  const [editProtein, setEditProtein] = useState(String(goals.protein));
  const [editCarbs, setEditCarbs] = useState(String(goals.carbs));
  const [editFat, setEditFat] = useState(String(goals.fat));
  const [editWater, setEditWater] = useState(String(goals.water));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setGoals({
      calories: parseInt(editCalories) || 2000,
      protein: parseInt(editProtein) || 150,
      carbs: parseInt(editCarbs) || 250,
      fat: parseInt(editFat) || 65,
      water: parseInt(editWater) || 2500,
    });
    soundManager.playLogged();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setEditCalories('2000');
    setEditProtein('150');
    setEditCarbs('250');
    setEditFat('65');
    setEditWater('2500');
  };

  const applyPreset = (strategy: DietStrategy) => {
    const preset = DIET_GOAL_PRESETS[strategy];
    setDietStrategy(strategy); // updates settingsStore + syncs nutritionStore goals
    setEditCalories(String(preset.calories));
    setEditProtein(String(preset.protein));
    setEditCarbs(String(preset.carbs));
    setEditFat(String(preset.fat));
    setEditWater(String(preset.water));
  };

  const progressItems = [
    { label: 'Calories', icon: <Flame size={16} />, current: totals.calories, goal: goals.calories, avg: weekAvg.calories, unit: 'kcal', color: 'from-brand to-amber-300', barColor: 'bg-brand', iconColor: 'text-brand', glow: 'rgba(230,183,95,0.4)' },
    { label: 'Protein', icon: <Beef size={16} />, current: totals.protein, goal: goals.protein, avg: weekAvg.protein, unit: 'g', color: 'from-red-400 to-rose-300', barColor: 'bg-red-400', iconColor: 'text-red-400', glow: 'rgba(248,113,113,0.4)' },
    { label: 'Carbs', icon: <Wheat size={16} />, current: totals.carbs, goal: goals.carbs, avg: weekAvg.carbs, unit: 'g', color: 'from-yellow-400 to-amber-200', barColor: 'bg-yellow-400', iconColor: 'text-yellow-400', glow: 'rgba(250,204,21,0.4)' },
    { label: 'Fat', icon: <CircleDot size={16} />, current: totals.fat, goal: goals.fat, avg: weekAvg.fat, unit: 'g', color: 'from-purple-400 to-violet-300', barColor: 'bg-purple-400', iconColor: 'text-purple-400', glow: 'rgba(167,139,250,0.4)' },
    { label: 'Water', icon: <Droplets size={16} />, current: totals.water, goal: goals.water, avg: weekAvg.water, unit: 'ml', color: 'from-blue-400 to-sky-300', barColor: 'bg-blue-400', iconColor: 'text-blue-400', glow: 'rgba(56,189,248,0.4)' },
  ];

  const metCount = progressItems.filter(g => g.goal > 0 && g.current >= g.goal).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12">
            <Target size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Nutrition Goals</h1>
            <p className="text-sm text-amber-200/40">Set and track your daily targets</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 border text-sm font-bold',
          metCount === progressItems.length
            ? 'border-green-400/25 bg-green-400/8 text-green-400'
            : 'border-brand/22 bg-brand/8 text-brand'
        )}>
          <Award size={14} />
          {metCount}/{progressItems.length} met
        </div>
      </div>

      {/* Progress Cards */}
      <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-brand" />
          <span className="text-sm font-bold text-white/90">Today's Progress</span>
        </div>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {progressItems.map((item) => {
            const pct = Math.min(100, item.goal > 0 ? Math.round(toPercent(item.current, item.goal)) : 0);
            const met = item.goal > 0 && item.current >= item.goal;
            return (
              <motion.div key={item.label} variants={staggerChild} whileHover={{ y: -1, boxShadow: '0 4px 16px rgba(230,183,95,0.10)' }} onMouseEnter={() => soundManager.playHover()}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', met ? 'border-green-400/20 bg-green-400/8' : 'border-white/8 bg-white/3')}>
                    <span className={item.iconColor}>{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white/80">{item.label}</span>
                        {met && <CheckCircle2 size={12} className="text-green-400" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-amber-200/30">7d avg: {item.avg} {item.unit}</span>
                        <span className="text-white/50">{Math.round(item.current)} / {item.goal} {item.unit}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full bg-gradient-to-r', item.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={met ? { boxShadow: `0 0 6px ${item.glow}` } : undefined}
                      />
                    </div>
                  </div>
                  <span className={cn('w-12 text-right text-sm font-black', met ? 'text-green-400' : 'text-brand')}>
                    {pct}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Diet Strategy Presets */}
      <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-1">
          <Target size={15} className="text-brand" />
          <span className="text-sm font-bold text-white/90">Diet Strategy</span>
        </div>
        <p className="text-xs text-amber-200/35 mb-4">Selecting a strategy instantly updates your nutrition targets <em>and</em> the XP multiplier applied to every meal you log.</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DIET_STRATEGY_META.map((s) => {
            const preset = DIET_GOAL_PRESETS[s.id];
            const active = currentStrategy === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { soundManager.playClick(); applyPreset(s.id); }}
                onMouseEnter={() => soundManager.playHover()}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  active
                    ? 'border-brand/55 bg-brand/12 shadow-[0_0_14px_rgba(230,183,95,0.22)]'
                    : 'border-white/8 bg-white/[0.02] hover:border-brand/22 hover:bg-brand/6'
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base leading-none">{s.emoji}</span>
                  <p className={cn('text-xs font-bold', active ? 'text-brand' : 'text-white/85')}>{s.label}</p>
                  {active && <span className="ml-auto text-[9px] font-bold text-brand uppercase">Active</span>}
                </div>
                <p className="text-[10px] text-amber-200/40 leading-snug mb-1.5">{s.desc}</p>
                <div className="flex items-center gap-1">
                  <Zap size={9} className="text-brand/60" />
                  <span className="text-[10px] text-brand/70 font-medium">{s.xpNote}</span>
                </div>
                <p className="text-[10px] text-brand/55 mt-1.5">{preset.calories} kcal · {preset.protein}g P</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit Goals */}
      <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Save size={15} className="text-brand" />
            <span className="text-sm font-bold text-white/90">Custom Targets</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { soundManager.playClick(); handleReset(); }} onMouseEnter={() => soundManager.playHover()} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white hover:border-brand/18 transition-colors">
              <RotateCcw size={12} className="inline mr-1" />Reset
            </button>
            <button onClick={() => { soundManager.playClick(); handleSave(); }} onMouseEnter={() => soundManager.playHover()} className={cn('rounded-xl border px-4 py-1.5 text-xs font-semibold transition-colors', saved ? 'border-green-400/22 bg-green-400/10 text-green-400' : 'border-brand/22 bg-brand/10 text-brand hover:bg-brand/18')}>
              {saved ? '✓ Saved!' : 'Save Goals'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Daily Calories (kcal)" type="number" value={editCalories} onChange={(e) => setEditCalories(e.target.value)} icon={<Flame size={16} />} />
          <Input label="Protein (g)" type="number" value={editProtein} onChange={(e) => setEditProtein(e.target.value)} icon={<Beef size={16} />} />
          <Input label="Carbs (g)" type="number" value={editCarbs} onChange={(e) => setEditCarbs(e.target.value)} icon={<Wheat size={16} />} />
          <Input label="Fat (g)" type="number" value={editFat} onChange={(e) => setEditFat(e.target.value)} icon={<CircleDot size={16} />} />
          <Input label="Water (ml)" type="number" value={editWater} onChange={(e) => setEditWater(e.target.value)} icon={<Droplets size={16} />} />
        </div>
      </div>
    </motion.div>
  );
}
