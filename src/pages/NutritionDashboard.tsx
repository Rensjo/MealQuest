// ============================================================================
// MealQuest - Nutrition Dashboard  (Meal-Basics Redesign)
// ============================================================================
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, Sun, Moon, Apple, Droplets, Heart, AlertTriangle,
  ShoppingBag, TrendingUp, UtensilsCrossed, CheckCircle2, Circle,
  Flame, CalendarDays, Star, Zap, ChevronRight,
} from 'lucide-react';
import { useMealLogStore }    from '@/stores/mealLogStore';
import { useNutritionStore }  from '@/stores/nutritionStore';
import { useXPStore }         from '@/stores/xpStore';
import { useQuestStore }      from '@/stores/questStore';
import { useStreakStore }      from '@/stores/streakStore';
import { pageVariants } from '@/utils/animations';
import { todayISO, getLast7Days, getLast30Days } from '@/utils/date';
import {
  WaterTracker, SweetTracker, MealHeatmap,
  PantryWidget, GroceryWidget, NutritionGoalsWidget,
  FoodSourceWidget, CalorieTrendWidget, MacroBalanceWidget,
  FOOD_SOURCE_META,
} from '@/components/dashboard/DashboardWidgets';
import {
  NutritionScoreCard, InsightPanel, HabitPatternCard,
  MealSuggestionPanel, GroceryPredictionPanel,
  SmartNotificationBanner, MonthlyTrendChart,
} from '@/components/dashboard/SmartWidgets';
import { QuickMealLog }       from '@/components/dashboard/QuickMealLog';
import UserStatusPanel        from '@/components/gaming/UserStatusPanel';
import { cn, isLiquidLog }  from '@/utils';
import { soundManager } from '@/services/soundManager';
import type { MealType, FoodSource } from '@/types';

const MEAL_SLOTS: {
  type: MealType; label: string; icon: React.ReactNode;
  time: string; color: string; bg: string; border: string;
}[] = [
  { type: 'breakfast', label: 'Breakfast', icon: <Coffee size={18} />, time: '6-10 AM',       color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  { type: 'lunch',     label: 'Lunch',     icon: <Sun    size={18} />, time: '11 AM - 2 PM',  color: 'text-yellow-300', bg: 'bg-yellow-400/10', border: 'border-yellow-400/28' },
  { type: 'dinner',    label: 'Dinner',    icon: <Moon   size={18} />, time: '5 - 9 PM',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25'   },
  { type: 'snack',     label: 'Snack',     icon: <Apple  size={18} />, time: 'Anytime',       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
];

const RANGE_OPTS = [{ id: '7d', label: '7 Days' }, { id: '30d', label: '30 Days' }];

function WarmCard({ children, className, glow, onClick }: { children: React.ReactNode; className?: string; glow?: boolean; onClick?: () => void }) {
  const Tag = onClick ? motion.button : motion.div as React.ElementType;
  return (
    <Tag
      onClick={() => { if (onClick) { soundManager.playClick(); onClick(); } }}
      onMouseEnter={() => soundManager.playHover()}
      className={cn(
        'rounded-2xl border bg-[#1a0d00]/85 backdrop-blur-sm transition-all duration-300 text-left w-full',
        glow
          ? 'border-brand/55 shadow-[0_0_42px_rgba(230,183,95,0.38)]'
          : 'border-brand/20 hover:border-brand/52 hover:shadow-[0_0_44px_rgba(230,183,95,0.40)]',
        onClick && 'cursor-pointer',
        className,
      )}
      whileHover={{ y: onClick ? -4 : -2, scale: onClick ? 1.02 : 1.005, boxShadow: onClick ? '0 0 44px rgba(230,183,95,0.40)' : '0 0 28px rgba(230,183,95,0.18)' }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
    >
      {children}
    </Tag>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-white/90 tracking-wide">{children}</h2>
      {sub && <p className="text-xs text-amber-200/35 mt-0.5">{sub}</p>}
    </div>
  );
}

interface DailyMealCardProps { slot: (typeof MEAL_SLOTS)[number]; date: string; }

function DailyMealCard({ slot, date }: DailyMealCardProps) {
  const getMealsByType = useMealLogStore((s) => s.getMealsByType);
  const meals = useMemo(() => getMealsByType(date, slot.type), [getMealsByType, date, slot.type]);
  const logged = meals.length > 0;
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const foods = meals.flatMap((m) => m.foods.map((f) => f.name));

  return (
    <motion.div
      onMouseEnter={() => soundManager.playHover()}
      whileHover={{ y: -3, scale: 1.02, boxShadow: logged ? '0 0 28px rgba(230,183,95,0.30)' : '0 0 12px rgba(255,255,255,0.06)' }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className={cn('rounded-2xl border p-3 flex flex-col gap-1.5 cursor-default transition-all duration-300',
        logged ? `${slot.bg} ${slot.border} shadow-[0_2px_14px_rgba(230,183,95,0.08)]`
               : 'border-white/8 bg-white/3 opacity-60')}
    >
      {/* Header: icon + label + time + status icon */}
      <div className="flex items-center gap-2">
        <span className={cn('flex-shrink-0', logged ? slot.color : 'text-white/28')}>
          {React.cloneElement(slot.icon as React.ReactElement, { size: 16 })}
        </span>
        <div className="flex-1 min-w-0">
          <span className={cn('text-sm font-bold block leading-tight', logged ? 'text-white/90' : 'text-white/35')}>{slot.label}</span>
          <span className="text-xs text-amber-200/30 leading-none">{slot.time}</span>
        </div>
        {logged ? <CheckCircle2 size={14} className={slot.color} /> : <Circle size={14} className="text-white/18" />}
      </div>
      {/* Food list + calorie on the same row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {logged ? (
            <div className="space-y-0.5">
              {foods.slice(0, 2).map((f, i) => (
                <span key={i} className="text-xs text-amber-100/60 truncate block">· {f}</span>
              ))}
              {foods.length > 2 && (
                <span className="text-xs text-amber-200/32">+{foods.length - 2} more</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-white/22 italic">Not logged yet</span>
          )}
        </div>
        {logged && (
          <div className={cn('text-xs font-bold flex-shrink-0 text-right leading-snug pt-0.5', slot.color)}>
            {totalCal > 0 ? `${totalCal}` : '✓'}<br />
            {totalCal > 0 && <span className="text-[11px] font-semibold opacity-70">kcal</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HealthIndicator({ days }: { days: string[] }) {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const meals = useMemo(() => getMealsByDateRange(days[0], days[days.length - 1]).filter((m) => !isLiquidLog(m)), [getMealsByDateRange, days]);
  const total     = meals.length;
  const unhealthy = meals.filter((m) => !m.isBalanced).length;
  const pct       = total > 0 ? Math.round((unhealthy / total) * 100) : 0;
  const status    = pct === 0 ? 'Great' : pct < 25 ? 'Good' : pct < 50 ? 'Fair' : pct < 75 ? 'Poor' : 'Critical';
  const statusColor = pct === 0 ? 'text-green-400' : pct < 25 ? 'text-emerald-400' : pct < 50 ? 'text-yellow-400' : pct < 75 ? 'text-orange-400' : 'text-red-400';
  const barColor    = pct < 25 ? 'bg-green-400' : pct < 50 ? 'bg-yellow-400' : pct < 75 ? 'bg-orange-400' : 'bg-red-400';

  // Food source breakdown
  const sourceCounts = useMemo(() => {
    const m: Partial<Record<FoodSource, number>> = {};
    meals.forEach((meal) => {
      const src: FoodSource = meal.foodSource ?? (meal.isHomeCooked ? 'home-cooked' : 'fast-food');
      m[src] = (m[src] || 0) + 1;
    });
    return m;
  }, [meals]);

  const SOURCE_ROWS: { key: FoodSource; label: string; emoji: string; color: string; bar: string }[] = [
    { key: 'home-cooked',  label: 'Home Cooked',  emoji: '🍳', color: 'text-green-400',  bar: 'bg-green-400'  },
    { key: 'dine-out',     label: 'Dine Out',     emoji: '🍽️', color: 'text-blue-400',   bar: 'bg-blue-400'   },
    { key: 'street-food',  label: 'Street Food',  emoji: '🌮', color: 'text-yellow-400', bar: 'bg-yellow-400' },
    { key: 'fast-food',    label: 'Fast Food',    emoji: '🍔', color: 'text-orange-400', bar: 'bg-orange-400' },
    { key: 'processed',    label: 'Processed',    emoji: '📦', color: 'text-red-400',    bar: 'bg-red-400'    },
  ];

  return (
    <WarmCard className="p-5 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={15} className="text-red-400" />
        <span className="text-sm font-bold text-white/85">Health Indicator</span>
        {pct >= 50 && <AlertTriangle size={13} className="text-orange-400 ml-auto animate-pulse" />}
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={cn('text-3xl font-black leading-none', statusColor)}>{status}</span>
        <span className={cn('text-xs font-bold mb-0.5', statusColor)}>{100 - pct}% healthy</span>
      </div>
      <p className="text-xs text-amber-200/40 mb-2">
        {unhealthy} of {total} meals unbalanced this week
      </p>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-3">
        <motion.div className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </div>
      <div className="flex justify-between text-[11px] text-amber-200/25 mb-4">
        <span>Healthy</span><span>Unhealthy</span>
      </div>

      {/* Food source rows */}
      <div className="space-y-1.5">
        {SOURCE_ROWS.map(({ key, label, emoji, color, bar }) => {
          const count = sourceCounts[key] || 0;
          const srcPct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm w-5">{emoji}</span>
              <span className={cn('text-xs w-20 truncate', color)}>{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div className={cn('h-full rounded-full', bar)}
                  initial={{ width: 0 }} animate={{ width: `${srcPct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }} />
              </div>
              <span className="text-xs text-white/40 w-8 text-right">{count > 0 ? `${srcPct}%` : '—'}</span>
            </div>
          );
        })}
      </div>
    </WarmCard>
  );
}

const SLOT_META: { key: MealType; color: string; label: string }[] = [
  { key: 'breakfast', color: 'bg-amber-400',  label: 'B' },
  { key: 'lunch',     color: 'bg-yellow-300', label: 'L' },
  { key: 'dinner',    color: 'bg-blue-400',   label: 'D' },
  { key: 'snack',     color: 'bg-green-400',  label: 'S' },
];

function MealStreakGrid({ days }: { days: string[] }) {
  const getMealsByType = useMealLogStore((s) => s.getMealsByType);
  const grid = useMemo(() => days.map((d) => ({
    date:      d,
    dayLabel:  new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
    breakfast: getMealsByType(d, 'breakfast').length > 0,
    lunch:     getMealsByType(d, 'lunch').length > 0,
    dinner:    getMealsByType(d, 'dinner').length > 0,
    snack:     getMealsByType(d, 'snack').length > 0,
  })), [days, getMealsByType]);

  const total    = grid.reduce((s, d) => s + [d.breakfast, d.lunch, d.dinner, d.snack].filter(Boolean).length, 0);
  const possible = grid.length * 4;

  return (
    <WarmCard className="p-5 h-full">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays size={15} className="text-brand" />
        <span className="text-sm font-bold text-white/85">Meal Streak Grid</span>
        <span className="ml-auto text-xs font-bold text-brand">{total}/{possible}</span>
      </div>
      <p className="text-xs text-amber-200/35 mb-4">B - L - D - S  x  last 7 days</p>
      <div className="flex items-center gap-3 mb-3">
        {SLOT_META.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <span className={cn('w-2.5 h-2.5 rounded-sm', s.color)} />
            <span className="text-xs text-amber-200/45 font-semibold">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {grid.map((day) => (
          <div key={day.date} className="flex items-center gap-2">
            <span className="text-xs text-amber-200/40 font-semibold w-5 text-right">{day.dayLabel}</span>
            <div className="flex gap-1.5 flex-1">
              {SLOT_META.map((s) => (
                <motion.div key={s.key}
                  className={cn('flex-1 h-6 rounded-md border transition-all duration-200',
                    day[s.key] ? `${s.color} border-transparent shadow-sm` : 'bg-white/5 border-white/8')}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </WarmCard>
  );
}

const MEAL_DOT_COLOR: Record<MealType, string> = {
  breakfast: 'bg-amber-400',
  lunch:     'bg-yellow-300',
  dinner:    'bg-blue-400',
  snack:     'bg-green-400',
};
const MEAL_LABELS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch',     label: 'Lunch'     },
  { key: 'dinner',    label: 'Dinner'    },
  { key: 'snack',     label: 'Snack'     },
];
const MEDALS = ['🥇', '🥈', '🥉'];

function MostEatenMeals({ days }: { days: string[] }) {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const meals = useMemo(() => getMealsByDateRange(days[0], days[days.length - 1]).filter((m) => !isLiquidLog(m)), [getMealsByDateRange, days]);

  const { freq, totalServings, uniqueFoods, topCalFood } = useMemo(() => {
    const map: Record<string, { count: number; totalCal: number; mealTypes: Set<MealType> }> = {};
    meals.forEach((meal) =>
      meal.foods.forEach((food) => {
        const key = food.name.trim().toLowerCase();
        if (!map[key]) map[key] = { count: 0, totalCal: 0, mealTypes: new Set() };
        map[key].count += 1;
        map[key].totalCal += food.calories;
        map[key].mealTypes.add(meal.mealType);
      })
    );

    const sorted = Object.entries(map)
      .map(([key, data]) => ({
        name: key.replace(/\b\w/g, (char) => char.toUpperCase()),
        count: data.count,
        avgCal: data.count > 0 ? Math.round(data.totalCal / data.count) : 0,
        mealTypes: Array.from(data.mealTypes) as MealType[],
      }))
      .sort((left, right) => right.count - left.count);

    return {
      freq: sorted.slice(0, 7),  // top 7 only
      totalServings: sorted.reduce((sum, item) => sum + item.count, 0),
      uniqueFoods: sorted.length,
      topCalFood: [...sorted].sort((left, right) => right.avgCal - left.avgCal)[0],
    };
  }, [meals]);

  const max = freq[0]?.count || 1;

  const FoodRow = ({ item, i, compact = false }: { item: (typeof freq)[number]; i: number; compact?: boolean }) => {
    const pct = Math.round((item.count / max) * 100);
    const sharePct = totalServings > 0 ? Math.round((item.count / totalServings) * 100) : 0;

    return (
      <div
        className={cn(
          'rounded-2xl border px-3 py-3 transition-colors',
          i === 0 ? 'border-brand/22 bg-brand/7' : 'border-white/8 bg-white/3',
          compact ? 'hover:bg-white/5' : 'hover:border-brand/18 hover:bg-brand/6'
        )}
        onMouseEnter={() => soundManager.playHover()}
      >
        <div className="mb-2 flex items-start gap-3">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black',
            i === 0
              ? 'bg-amber-400/18 text-amber-300'
              : i === 1
                ? 'bg-white/8 text-white/55'
                : i === 2
                  ? 'bg-orange-500/14 text-orange-300'
                  : 'bg-white/6 text-white/35'
          )}>
            {i < 3 ? MEDALS[i] : i + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-white/88">{item.name}</p>
              <span className="text-xs font-black text-brand">{item.count}×</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-amber-200/35">
              <div className="flex gap-1">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
                  <span
                    key={mealType}
                    className={cn('h-2 w-2 rounded-full', item.mealTypes.includes(mealType) ? MEAL_DOT_COLOR[mealType] : 'bg-white/10')}
                    title={mealType}
                  />
                ))}
              </div>
              <span>{item.avgCal} kcal avg</span>
              <span className="ml-auto">{sharePct}% share</span>
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r from-brand to-amber-300', compact && 'opacity-70')}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.65, delay: i * 0.05, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  const mealDistribution = MEAL_LABELS.map(({ key, label }) => {
    const count = meals.reduce((sum, meal) => sum + (meal.mealType === key ? meal.foods.length : 0), 0);
    return {
      key,
      label,
      pct: totalServings > 0 ? Math.round((count / totalServings) * 100) : 0,
    };
  });

  return (
    <WarmCard className="p-5">
      {/* Header with stats badges */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-brand" />
          <span className="text-sm font-bold text-white/90">Most Eaten This Week</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand/18 bg-brand/6 px-2.5 py-1">
            <span className="text-xs text-amber-200/45">Unique</span>
            <span className="text-xs font-black text-brand">{uniqueFoods}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand/18 bg-brand/6 px-2.5 py-1">
            <span className="text-xs text-amber-200/45">Servings</span>
            <span className="text-xs font-black text-brand">{totalServings}</span>
          </span>
        </div>
      </div>

      {freq.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-brand/15">
          <p className="text-sm italic text-white/22">No foods logged yet this week</p>
        </div>
      ) : (
        <>
          {/* Summary row: Variety Grade + Top Calorie + Distribution */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl border border-brand/16 bg-brand/6 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-amber-200/40">Variety Grade</p>
              <div className="mt-1.5 flex items-end justify-between gap-2">
                <p className={cn(
                  'text-3xl font-black leading-none',
                  uniqueFoods >= 10 ? 'text-green-400'
                  : uniqueFoods >= 7 ? 'text-emerald-400'
                  : uniqueFoods >= 5 ? 'text-brand'
                  : uniqueFoods >= 3 ? 'text-orange-400' : 'text-red-400'
                )}>
                  {uniqueFoods >= 10 ? 'A+' : uniqueFoods >= 7 ? 'A' : uniqueFoods >= 5 ? 'B' : uniqueFoods >= 3 ? 'C' : 'D'}
                </p>
                <div className="text-right text-[11px] text-amber-200/35">
                  <p>{uniqueFoods} foods</p>
                  <p>{totalServings} total</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-500/16 bg-orange-500/8 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Flame size={12} className="text-orange-400" />
                <p className="text-[11px] uppercase tracking-wider text-orange-200/60">Top Calorie Food</p>
              </div>
              <p className="mt-1.5 text-sm font-bold text-white/88 truncate">{topCalFood?.name ?? '—'}</p>
              <p className="mt-0.5 text-xs text-orange-300">{topCalFood?.avgCal ?? 0} kcal avg</p>
            </div>

            <div className="rounded-2xl border border-brand/12 bg-white/3 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-amber-200/45 mb-2">By Meal Type</p>
              <div className="space-y-1.5">
                {mealDistribution.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', MEAL_DOT_COLOR[entry.key])} />
                    <span className="w-14 text-[10px] text-amber-200/45">{entry.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <motion.div className={cn('h-full rounded-full', MEAL_DOT_COLOR[entry.key])}
                        initial={{ width: 0 }} animate={{ width: `${entry.pct}%` }} transition={{ duration: 0.65, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="w-7 text-right text-[10px] text-white/28">{entry.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 podium */}
          {freq.length >= 1 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { item: freq[1], rank: 2, medal: '🥈', border: 'border-white/12', bg: 'bg-white/[0.04]', accent: 'text-slate-300', label: 'bg-white/10 text-white/50' },
                { item: freq[0], rank: 1, medal: '🥇', border: 'border-brand/30', bg: 'bg-brand/10', accent: 'text-brand', label: 'bg-brand/12 text-brand' },
                { item: freq[2], rank: 3, medal: '🥉', border: 'border-orange-500/18', bg: 'bg-orange-500/7', accent: 'text-orange-300', label: 'bg-orange-500/10 text-orange-300' },
              ].map(({ item, rank, medal, border, bg, accent, label }) =>
                item ? (
                  <div key={item.name} className={cn('flex flex-col items-center rounded-2xl border px-3 py-4 text-center transition-all hover:scale-[1.02]', border, bg)}
                    onMouseEnter={() => soundManager.playHover()}>
                    <span className="text-3xl leading-none mb-1">{medal}</span>
                    <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5 mb-2', label)}>#{rank} Most Eaten</span>
                    <p className={cn('text-sm font-bold truncate w-full leading-tight', accent)}>{item.name}</p>
                    <p className="text-[11px] text-amber-200/40 mt-1">{item.count}× &middot; {item.avgCal} kcal avg</p>
                    <div className="flex gap-1 mt-2 justify-center">
                      {(['breakfast','lunch','dinner','snack'] as MealType[]).map((t) => (
                        <span key={t} className={cn('h-2 w-2 rounded-full', item.mealTypes.includes(t) ? MEAL_DOT_COLOR[t] : 'bg-white/10')} title={t} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={rank} className="flex flex-col items-center justify-center rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-4 text-center">
                    <span className="text-2xl opacity-20 mb-1">{medal}</span>
                    <p className="text-xs text-white/18">Not enough data</p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Food ranking grid — ranks 4–7 only (top 3 shown in podium above) */}
          {freq.length > 3 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {freq.slice(3, 7).map((item, i) => (
                <FoodRow key={item.name} item={item} i={i + 3} compact={false} />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/10 bg-white/2 px-3 py-2 mt-3">
            {MEAL_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', MEAL_DOT_COLOR[key])} />
                <span className="text-xs text-amber-200/40">{label}</span>
              </div>
            ))}
            <span className="ml-auto text-xs text-white/22">Dots = meal-slot coverage</span>
          </div>
        </>
      )}
    </WarmCard>
  );
}


function FastFoodAnalytics() {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const days  = useMemo(() => range === '7d' ? getLast7Days() : getLast30Days(), [range]);
  const meals = useMemo(() => getMealsByDateRange(days[0], days[days.length - 1]).filter((m) => !isLiquidLog(m)), [getMealsByDateRange, days]);

  // All 5 categories
  const sourceCounts = useMemo(() => {
    const m: Partial<Record<FoodSource, number>> = {};
    meals.forEach((meal) => {
      const src: FoodSource = meal.foodSource ?? (meal.isHomeCooked ? 'home-cooked' : 'fast-food');
      m[src] = (m[src] || 0) + 1;
    });
    return m;
  }, [meals]);

  const total = meals.length;

  const SOURCE_DEF: { key: FoodSource; label: string; emoji: string; color: string; bar: string; statBg: string }[] = [
    { key: 'home-cooked',  label: 'Home Cooked',  emoji: '🍳', color: 'text-green-400',  bar: 'bg-green-400',  statBg: 'bg-green-500/8 border-green-500/18'  },
    { key: 'dine-out',     label: 'Dine Out',     emoji: '🍽️', color: 'text-blue-400',   bar: 'bg-blue-400',   statBg: 'bg-blue-500/8 border-blue-500/18'   },
    { key: 'street-food',  label: 'Street Food',  emoji: '🌮', color: 'text-yellow-400', bar: 'bg-yellow-400', statBg: 'bg-yellow-500/8 border-yellow-500/18' },
    { key: 'fast-food',    label: 'Fast Food',    emoji: '🍔', color: 'text-orange-400', bar: 'bg-orange-400', statBg: 'bg-orange-500/8 border-orange-500/18' },
    { key: 'processed',    label: 'Processed',    emoji: '📦', color: 'text-red-400',    bar: 'bg-red-400',    statBg: 'bg-red-500/8 border-red-500/18'    },
  ];

  const dailyCounts = useMemo(() => days.map((d) => {
    const dayMeals = meals.filter((m) => m.date === d);
    const label = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    const src: Partial<Record<FoodSource, number>> = {};
    dayMeals.forEach((m) => {
      const s: FoodSource = m.foodSource ?? (m.isHomeCooked ? 'home-cooked' : 'fast-food');
      src[s] = (src[s] || 0) + 1;
    });
    return { label, total: dayMeals.length, src };
  }), [days, meals]);

  const maxDay = Math.max(...dailyCounts.map((d) => d.total), 1);

  return (
    <WarmCard className="p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <ShoppingBag size={15} className="text-orange-400" />
        <span className="text-sm font-bold text-white/85">Food Type Breakdown</span>
        <div className="ml-auto flex rounded-lg border border-brand/18 overflow-hidden">
          {RANGE_OPTS.map((o) => (
            <button key={o.id} onClick={() => { soundManager.playClick(); setRange(o.id as '7d' | '30d'); }}
              onMouseEnter={() => soundManager.playHover()}
              className={cn('px-2.5 py-0.5 text-xs font-semibold transition-all duration-150',
                range === o.id ? 'bg-brand/25 text-brand' : 'bg-transparent text-amber-200/35 hover:text-amber-200/60')}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-amber-200/35 mb-3">Breakdown across all food source types</p>

      {/* All 5 categories in a single row */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {SOURCE_DEF.map(({ key, label, emoji, color, statBg }) => (
          <div key={key} className={cn('rounded-xl border px-1 py-2 text-center', statBg)}>
            <span className="text-base block leading-none">{emoji}</span>
            <span className={cn('text-sm font-black block leading-snug mt-0.5', color)}>{sourceCounts[key] ?? 0}</span>
            <p className="text-[10px] text-white/38 font-medium leading-tight mt-0.5 truncate px-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stacked bar chart — fills remaining vertical space */}
      <div className="flex-1 min-h-[80px] flex items-end gap-1 mt-1">
        {dailyCounts.slice(range === '7d' ? 0 : -14).map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full">
            <div className="w-full flex-1 flex flex-col-reverse gap-px">
              {SOURCE_DEF.map(({ key, bar }) => {
                const c = d.src[key] || 0;
                return c > 0 ? (
                  <motion.div key={key}
                    className={cn('w-full rounded-sm', bar)}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                    style={{ flex: c, minHeight: '5px', transformOrigin: 'bottom' }} />
                ) : null;
              })}
            </div>
            {range === '7d' && <span className="text-[11px] text-amber-200/30 font-semibold">{d.label}</span>}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2">
        {SOURCE_DEF.map(({ key, label, emoji, bar }) => (
          <div key={key} className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-sm', bar)} />
            <span className="text-[11px] text-amber-200/45">{emoji} {label}</span>
          </div>
        ))}
      </div>
    </WarmCard>
  );
}

function WeeklyQuestStats({ days }: { days: string[] }) {
  const getXPForRange = useXPStore((s) => s.getXPForRange);
  const dailyMissions = useQuestStore((s) => s.dailyMissions);
  const weeklyBoss    = useQuestStore((s) => s.weeklyBoss);
  const getAllStreaks  = useStreakStore((s) => s.getAllStreaks);

  const weeklyXP           = useMemo(() => getXPForRange(days[0], days[days.length - 1]), [getXPForRange, days]);
  const completedQuests    = dailyMissions.filter((m) => m.completed).length;
  const totalQuests        = dailyMissions.length;
  const activeStreaks       = useMemo(() => getAllStreaks().filter((s) => s.current > 0).length, [getAllStreaks]);
  const bossLabel          = weeklyBoss
    ? weeklyBoss.status === 'victory' ? '🏆 Defeated' : weeklyBoss.status === 'defeat' ? '💀 Lost' : `${weeklyBoss.conditions.filter((c) => c.met).length}/${weeklyBoss.conditions.length}`
    : '—';

  const grade = weeklyXP >= 500 ? 'S' : weeklyXP >= 300 ? 'A' : weeklyXP >= 150 ? 'B' : weeklyXP >= 50 ? 'C' : 'D';
  const gradeColor = grade === 'S' ? 'text-brand' : grade === 'A' ? 'text-green-400' : grade === 'B' ? 'text-blue-400' : grade === 'C' ? 'text-yellow-400' : 'text-zinc-400';

  const stats = [
    { label: 'XP This Week', value: `${weeklyXP}`, icon: <Zap size={13} className="text-brand" /> },
    { label: 'Quests Done',  value: `${completedQuests}/${totalQuests}`, icon: <CheckCircle2 size={13} className="text-emerald-400" /> },
    { label: 'Boss Progress', value: bossLabel, icon: <Star size={13} className="text-red-400" /> },
    { label: 'Active Streaks', value: `${activeStreaks}`, icon: <Flame size={13} className="text-orange-400" /> },
    { label: 'Weekly Grade', value: grade, icon: <TrendingUp size={13} className={gradeColor} />, valueClass: gradeColor },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {stats.map((s) => (
        <motion.div
          key={s.label}
          onMouseEnter={() => soundManager.playHover()}
          whileHover={{ y: -2, scale: 1.03, boxShadow: '0 0 18px rgba(230,183,95,0.22)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="flex flex-1 min-w-[110px] items-center gap-2 rounded-xl border border-brand/14 bg-brand/5 px-3 py-2.5 cursor-default"
        >
          {s.icon}
          <div className="min-w-0">
            <p className={cn('text-sm font-black leading-none', s.valueClass ?? 'text-white/90')}>{s.value}</p>
            <p className="text-[10px] text-amber-200/35 mt-0.5 truncate">{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function NutritionDashboard() {
  const getDailyTotals = useMealLogStore((s) => s.getDailyTotals);
  const goals          = useNutritionStore((s) => s.goals);
  const level          = useXPStore((s) => s.level);
  const xpInfo         = useXPStore((s) => s.getXPToNextLevel());
  const today          = todayISO();
  const last7Days      = useMemo(() => getLast7Days(), []);
  const totals         = useMemo(() => getDailyTotals(today), [getDailyTotals, today]);
  const [showProfile, setShowProfile] = useState(false);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  const motiveLine = totals.mealsLogged === 0
    ? 'Start strong — log your first meal today 🥗'
    : totals.mealsLogged < 3
    ? `${totals.mealsLogged} meal${totals.mealsLogged > 1 ? 's' : ''} logged — keep going!`
    : 'Great tracking today! 🌟';

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="space-y-6 pb-8">

      {/* Greeting + today’s vitals strip */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{greeting} 👋</h1>
          <p className="text-sm text-amber-200/42 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-xs text-amber-200/25 mt-1">{motiveLine}</p>
        </div>
        {/* Vitals cards */}
        <div className="flex items-stretch gap-2 flex-shrink-0">
          {/* Meals */}
          <motion.div
            onMouseEnter={() => soundManager.playHover()}
            whileHover={{ y: -3, scale: 1.04, boxShadow: '0 0 22px rgba(230,183,95,0.35)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex flex-col items-center justify-center rounded-xl border border-brand/22 bg-brand/8 px-3.5 py-2.5 text-center min-w-[62px] cursor-default"
          >
            <UtensilsCrossed size={12} className="text-brand mb-1" />
            <span className="text-xl font-black text-brand leading-none">
              {totals.mealsLogged}<span className="text-xs font-semibold text-amber-200/38">/4</span>
            </span>
            <span className="text-xs text-amber-200/40 mt-0.5">Meals</span>
          </motion.div>
          {/* Calories */}
          <motion.div
            onMouseEnter={() => soundManager.playHover()}
            whileHover={{ y: -3, scale: 1.04, boxShadow: '0 0 22px rgba(251,146,60,0.35)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex flex-col items-center justify-center rounded-xl border border-orange-400/22 bg-orange-400/7 px-3.5 py-2.5 text-center min-w-[70px] cursor-default"
          >
            <Flame size={12} className="text-orange-400 mb-1" />
            <span className="text-xl font-black text-orange-300 leading-none">{totals.calories}</span>
            <span className="text-xs text-amber-200/40 mt-0.5">kcal</span>
            {goals.calories > 0 && (
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-orange-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%` }} />
              </div>
            )}
          </motion.div>
          {/* Water */}
          <motion.div
            onMouseEnter={() => soundManager.playHover()}
            whileHover={{ y: -3, scale: 1.04, boxShadow: '0 0 22px rgba(96,165,250,0.35)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex flex-col items-center justify-center rounded-xl border border-blue-400/22 bg-blue-400/7 px-3.5 py-2.5 text-center min-w-[70px] cursor-default"
          >
            <Droplets size={12} className="text-blue-400 mb-1" />
            <span className="text-xl font-black text-blue-300 leading-none">{totals.water}</span>
            <span className="text-xs text-amber-200/40 mt-0.5">ml water</span>
            {goals.water > 0 && (
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-blue-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, (totals.water / goals.water) * 100)}%` }} />
              </div>
            )}
          </motion.div>
          {/* Level / Profile — opens UserStatusPanel */}
          <motion.button
            onClick={() => { soundManager.playClick(); setShowProfile(true); }}
            onMouseEnter={() => soundManager.playHover()}
            whileHover={{ y: -3, scale: 1.05, boxShadow: '0 0 26px rgba(230,183,95,0.45)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            className="flex flex-col items-center justify-center rounded-xl border border-brand/28 bg-gradient-to-b from-brand/12 to-brand/4 px-3.5 py-2.5 text-center min-w-[64px] hover:border-brand/55 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            {/* shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/12 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
            />
            <Star size={12} className="text-brand mb-1 group-hover:text-amber-300 transition-colors" />
            <span className="text-xl font-black text-brand leading-none">Lv.{level}</span>
            <span className="text-[11px] text-amber-200/40 mt-0.5">{xpInfo.current}/{xpInfo.required}</span>
            <ChevronRight size={10} className="text-amber-200/30 group-hover:text-brand transition-colors mt-0.5" />
          </motion.button>
        </div>
      </div>

      {/* User Status Panel */}
      <UserStatusPanel isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* Smart Notifications Banner */}
      <SmartNotificationBanner />

      <div>
        <SectionTitle sub="Check off your 3 meals and snacks for today">Today's Meals</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MEAL_SLOTS.map((slot) => (
            <DailyMealCard key={slot.type} slot={slot} date={today} />
          ))}
        </div>
      </div>

      {/* Weekly gamification stats strip */}
      <WeeklyQuestStats days={last7Days} />

      {/* ROW 2 — 30% Hydration + Sweet | 70% Quick Log */}
      <div>
        <SectionTitle sub="Daily hydration, sweet tracking and meal logging">Today's Tracking</SectionTitle>
        <div className="flex gap-4" style={{ height: '880px' }}>
          <div className="flex flex-col gap-4 flex-shrink-0 h-full" style={{ width: '36%', minWidth: 0 }}>
            <div className="flex-1 min-h-0"><WaterTracker /></div>
            <div className="flex-1 min-h-0"><SweetTracker /></div>
          </div>
          <div className="flex-1 min-w-0 h-full">
            <QuickMealLog className="h-full" />
          </div>
        </div>
      </div>

      {/* ROW 3 — Health Analytics: 60% Food Type Breakdown (left) + 40% Health Indicator (right), full-width Food Frequency below */}
      <div className="space-y-4">
        <SectionTitle sub="Food sources, health score and your most-eaten foods at a glance">Health Analytics</SectionTitle>
        <div className="flex gap-4 items-stretch">
          <div style={{ width: '60%', minWidth: 0 }}><FastFoodAnalytics /></div>
          <div style={{ width: '40%', minWidth: 0 }}><HealthIndicator days={last7Days} /></div>
        </div>
        <MostEatenMeals days={last7Days} />
      </div>

      {/* ROW 4 — Food Source Breakdown + Calorie Trend + Macro Balance */}
      <div>
        <SectionTitle sub="Deeper insights into how you eat">Eating Patterns</SectionTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FoodSourceWidget days={last7Days} />
          <CalorieTrendWidget days={last7Days} />
          <MacroBalanceWidget days={last7Days} />
        </div>
      </div>

      {/* ROW 5 — 74% (Grocery top + Pantry bottom) | 26% Nutrition Goals full height */}
      <div>
        <SectionTitle sub="Targets, pantry inventory and planned shopping">Goals & Supplies</SectionTitle>
        <div className="flex gap-4 items-stretch">
          {/* Left 74%: Grocery (top) + Pantry (bottom) */}
          <div className="flex flex-col gap-4" style={{ width: '74%', minWidth: 0 }}>
            <GroceryWidget />
            <PantryWidget />
          </div>
          {/* Right 26%: Nutrition Goals spanning full height */}
          <div className="flex-shrink-0" style={{ width: '26%', minWidth: 0 }}>
            <NutritionGoalsWidget className="h-full" />
          </div>
        </div>
      </div>

      {/* ROW 6 — Phase 3: Smart Intelligence (Bento Grid) */}
      <div className="space-y-4">
        <SectionTitle sub="AI-powered analysis of your nutrition habits">Smart Intelligence</SectionTitle>
        {/*
         * Bento layout — 4-column CSS grid.
         * CSS Grid default align-items:stretch makes every cell in a row the
         * same height as the tallest cell so no explicit row heights needed.
         *
         *  Row 1 │ Score (1) │ Weekly Insights (2) │ Habit Patterns (1) │
         *  Row 2 │ Monthly Trend Chart (3)          │ Grocery Plans (1)  │
         *  Row 3 │ Meal Suggestions ── full width ──────────────────────  │
         */}
        <div className="grid grid-cols-4 gap-4">
          {/* ── Row 1 ── */}
          <NutritionScoreCard />
          <div className="col-span-2 h-full"><InsightPanel /></div>
          <HabitPatternCard />

          {/* ── Row 2 ── */}
          <div className="col-span-3 h-full"><MonthlyTrendChart /></div>
          <GroceryPredictionPanel />

          {/* ── Row 3 ── */}
          <div className="col-span-4"><MealSuggestionPanel /></div>
        </div>
      </div>

      {/* ROW 7 — Full-width year heatmap */}
      <div>
        <SectionTitle sub="Your meal logging activity over the past year">Year in Review</SectionTitle>
        <MealHeatmap />
      </div>

    </motion.div>
  );
}