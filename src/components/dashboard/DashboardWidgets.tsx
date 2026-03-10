// ============================================================================
// MealQuest — Dashboard Widgets
// ============================================================================
// Water Tracker, Sweet Tracker, Meal Heatmap, Pantry, Grocery,
// Nutrition Goals and Health Analytics for the dashboard.

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../services/soundManager';
import {
  AlertTriangle,
  Beef,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Cookie,
  Droplets,
  Factory,
  Flame,
  Flame as CaloriesIcon,
  Minus,
  Package,
  Pencil,
  Pizza,
  Plus,
  RefreshCcw,
  Salad,
  ShoppingBag,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react';
import { cn, formatCurrency, formatML, toPercent, isLiquidLog } from '@/utils';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { usePantryStore } from '@/stores/pantryStore';
import { useGroceryStore } from '@/stores/groceryStore';
import { todayISO, getLast7Days, formatDate } from '@/utils/date';
import { isSweet } from '@/utils/foodDatabase';
import { Card, Input, Modal } from '@/components/ui';
import { staggerChild } from '@/utils/animations';
import { useNutritionTracker } from '@/hooks';
import type { FoodSource, GroceryItem, PantryItem, UnitType } from '@/types';
import { UNIT_TYPES } from '@/types';

// ---------------------------------------------------------------------------
// Water Tracker Widget
// ---------------------------------------------------------------------------

type DrinkType = 'water' | 'sugary' | 'softdrink' | 'alcohol';

const DRINK_CATEGORIES: { type: DrinkType; label: string; icon: string; color: string; border: string; bg: string; glow: string; amounts: number[] }[] = [
  { type: 'water',     label: 'Water',        icon: '💧', color: 'text-blue-300',   border: 'border-blue-400/22',   bg: 'bg-blue-500/10',   glow: 'rgba(56,189,248,0.35)',  amounts: [250, 500, 750] },
  { type: 'sugary',    label: 'Sugary Drinks', icon: '🧃', color: 'text-yellow-300', border: 'border-yellow-400/22', bg: 'bg-yellow-500/10', glow: 'rgba(250,204,21,0.35)',  amounts: [200, 350] },
  { type: 'softdrink', label: 'Soft Drinks',   icon: '🥤', color: 'text-cyan-300',   border: 'border-cyan-400/22',   bg: 'bg-cyan-500/10',   glow: 'rgba(34,211,238,0.35)', amounts: [250, 330] },
  { type: 'alcohol',   label: 'Alcohol',       icon: '🍺', color: 'text-amber-300',  border: 'border-amber-400/22',  bg: 'bg-amber-500/10',  glow: 'rgba(251,191,36,0.35)', amounts: [150, 330] },
];

interface WaterTrackerProps {
  className?: string;
}

export function WaterTracker({ className }: WaterTrackerProps) {
  const goals = useNutritionStore((s) => s.goals);
  const meals = useMealLogStore((s) => s.meals);
  const getDailyTotals = useMealLogStore((s) => s.getDailyTotals);
  const { logMeal } = useNutritionTracker();
  const today = todayISO();
  const totals = useMemo(() => getDailyTotals(today), [getDailyTotals, today, meals]);
  const [activeDrink, setActiveDrink] = useState<DrinkType>('water');

  const waterPercent = toPercent(totals.water, goals.water);
  const remaining = Math.max(0, goals.water - totals.water);
  const glassesTarget = Math.max(1, Math.ceil(goals.water / 250));
  const glassesDrunk = Math.floor(totals.water / 250);

  // Count drink types from food names
  const drinkCounts = useMemo(() => {
    const counts: Record<DrinkType, number> = { water: 0, sugary: 0, softdrink: 0, alcohol: 0 };
    meals.filter((m) => m.date === today).forEach((m) => {
      m.foods.forEach((f) => {
        const n = f.name.toLowerCase();
        if (n.includes('alcohol') || n.includes('beer') || n.includes('wine') || n.includes('cocktail')) counts.alcohol++;
        else if (n.includes('sugary') || n.includes('juice') || n.includes('sweet drink')) counts.sugary++;
        else if (n.includes('soft drink') || n.includes('soda') || n.includes('cola')) counts.softdrink++;
        else if (n.includes('water')) counts.water++;
      });
    });
    return counts;
  }, [meals, today]);

  const addDrink = (type: DrinkType, ml: number) => {
    const cat = DRINK_CATEGORIES.find((c) => c.type === type)!;
    const isWater = type === 'water';
    logMeal({
      date: today,
      mealType: 'snack',
      isLiquidLog: true,
      foods: [{
        id: `${type}-${Date.now()}`,
        name: `${cat.label} (${ml}ml)`,
        calories: isWater ? 0 : type === 'sugary' ? Math.round(ml * 0.4) : type === 'softdrink' ? Math.round(ml * 0.35) : Math.round(ml * 0.5),
        protein: 0, carbs: 0, fat: 0,
        serving: `${ml}ml`, quantity: 1,
      }],
      calories: isWater ? 0 : type === 'sugary' ? Math.round(ml * 0.4) : type === 'softdrink' ? Math.round(ml * 0.35) : Math.round(ml * 0.5),
      protein: 0, carbs: 0, fat: 0,
      water: isWater ? ml : 0,
      foodSource: 'processed',
      isHomeCooked: false,
      isBalanced: isWater,
    });
  };

  const activeCat = DRINK_CATEGORIES.find((c) => c.type === activeDrink)!;

  return (
    <motion.div
      variants={staggerChild}
      className="h-full"
      onMouseEnter={() => soundManager.playHover()}
      whileHover={{ y: -4, boxShadow: '0 0 44px rgba(56,189,248,0.35), 0 8px 32px rgba(0,0,0,0.50)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <Card hover={false} className={cn('h-full rounded-2xl border-brand/20 bg-[#1a0d00]/85 p-4', className)}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Hydration Tracker</h3>
            </div>
            <p className="mt-1 text-xs text-amber-200/38">Track water and all beverages throughout your day.</p>
          </div>
          <span className={cn(
            'rounded-full border px-2 py-0.5 text-[11px] font-bold',
            waterPercent >= 100
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
              : 'border-blue-400/20 bg-blue-400/10 text-blue-300'
          )}>
            {Math.round(waterPercent)}%
          </span>
        </div>

        {/* Progress ring + stats */}
        <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3">
          <div className="relative flex h-[84px] w-[84px] items-center justify-center">
            <svg className="h-[84px] w-[84px] -rotate-90" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <motion.circle cx="42" cy="42" r="34" fill="none" stroke="#38BDF8" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(1, waterPercent / 100)) }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ filter: waterPercent >= 100 ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.65))' : 'none' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white">{glassesDrunk}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-300/80">glasses</span>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-blue-400/16 bg-blue-500/8 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-blue-200/55">Consumed</p>
                <p className="mt-1 text-sm font-black text-blue-300">{formatML(totals.water)}</p>
              </div>
              <div className="rounded-xl border border-brand/14 bg-brand/6 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-amber-200/45">Remaining</p>
                <p className="mt-1 text-sm font-black text-white/85">{formatML(remaining)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-[11px] text-amber-200/45">
                <span>Daily glass goal</span>
                <span>{glassesDrunk}/{glassesTarget}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(glassesTarget, 10) }, (_, index) => (
                  <div key={index} className={cn('h-5 flex-1 rounded-md border transition-all duration-200',
                    index < glassesDrunk
                      ? 'border-blue-300/30 bg-gradient-to-b from-blue-300/65 to-blue-500/35'
                      : 'border-white/6 bg-white/6'
                  )} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drink type selector tabs */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {DRINK_CATEGORIES.map((cat) => (
            <motion.button key={cat.type}
              onClick={() => { soundManager.playClick(); setActiveDrink(cat.type); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'rounded-xl border px-1.5 py-2 text-center transition-all duration-200',
                activeDrink === cat.type
                  ? `${cat.border} ${cat.bg} shadow-sm`
                  : 'border-white/6 bg-white/3 opacity-60 hover:opacity-90'
              )}
            >
              <span className="text-base block leading-none">{cat.icon}</span>
              <span className={cn('text-[10px] font-bold block mt-1 leading-tight', activeDrink === cat.type ? cat.color : 'text-white/50')}>
                {drinkCounts[cat.type]}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Quick add buttons for active drink */}
        <div className="mt-2.5 flex gap-2">
          {activeCat.amounts.map((ml) => (
            <motion.button key={ml}
              onClick={() => { soundManager.playClick(); addDrink(activeDrink, ml); }}
              whileHover={{ scale: 1.04, boxShadow: `0 0 20px ${activeCat.glow}` }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 20 }}
              className={cn('flex-1 rounded-xl border px-2 py-2 text-sm font-semibold transition-all', activeCat.border, activeCat.bg, activeCat.color)}
            >
              + {ml}ml
            </motion.button>
          ))}
        </div>

        {/* Drink breakdown summary */}
        <div className="mt-3 mb-1 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/45 mb-2">Today's Beverages</p>
          <div className="grid grid-cols-2 gap-1.5">
            {DRINK_CATEGORIES.map((cat) => (
              <div key={cat.type} className="flex items-center gap-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs text-white/55 flex-1 truncate">{cat.label}</span>
                <span className={cn('text-xs font-bold', drinkCounts[cat.type] > 0 ? cat.color : 'text-white/25')}>{drinkCounts[cat.type]}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sweet / Dessert Tracker Widget
// ---------------------------------------------------------------------------

interface SweetTrackerProps {
  className?: string;
}

export function SweetTracker({ className }: SweetTrackerProps) {
  const meals = useMealLogStore((s) => s.meals);
  const today = todayISO();
  const last7 = getLast7Days();

  const todaySweetMeals = useMemo(
    () => meals.filter((meal) => meal.date === today && meal.foods.some((food) => isSweet(food.name))),
    [meals, today]
  );

  const todaySweetFoods = useMemo(() => {
    const names = todaySweetMeals.flatMap((meal) => meal.foods.filter((food) => isSweet(food.name)).map((food) => food.name));
    return [...new Set(names)];
  }, [todaySweetMeals]);

  const weekData = useMemo(
    () => last7.map((date) => {
      const count = meals.filter((meal) => meal.date === date && meal.foods.some((food) => isSweet(food.name))).length;
      return { date, count };
    }),
    [last7, meals]
  );

  const sweetCaloriesToday = todaySweetMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const dailyLimit = 200;
  const sweetFreeDays = weekData.filter((entry) => entry.count === 0).length;
  const weekTotal = weekData.reduce((s, e) => s + e.count, 0);
  const statusTone = sweetCaloriesToday === 0 ? 'clear' : sweetCaloriesToday <= dailyLimit ? 'balanced' : 'over';
  const statusLabel = statusTone === 'clear' ? 'Clean' : statusTone === 'balanced' ? 'Balanced' : 'Watch It';
  const statusIcon = statusTone === 'clear' ? '✨' : statusTone === 'balanced' ? '🍬' : '⚠️';
  const maxCount = Math.max(...weekData.map((entry) => entry.count), 1);
  const limitPct = dailyLimit > 0 ? Math.min(100, Math.round((sweetCaloriesToday / dailyLimit) * 100)) : 0;

  return (
    <motion.div
      variants={staggerChild}
      className="h-full"
      onMouseEnter={() => soundManager.playHover()}
      whileHover={{ y: -4, boxShadow: '0 0 44px rgba(236,72,153,0.30), 0 8px 32px rgba(0,0,0,0.50)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <Card hover={false} className={cn('h-full rounded-2xl border-brand/20 bg-[#1a0d00]/85 p-4', className)}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cookie size={18} className="text-pink-400" />
              <h3 className="text-sm font-semibold text-white">Sweet Tracker</h3>
            </div>
            <p className="mt-1 text-xs text-amber-200/38">Track desserts and sweet intake to stay aware.</p>
          </div>
          <span className={cn(
            'rounded-full border px-2 py-0.5 text-[11px] font-bold',
            statusTone === 'clear'
              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
              : statusTone === 'balanced'
                ? 'border-pink-400/20 bg-pink-500/10 text-pink-300'
                : 'border-orange-400/25 bg-orange-500/10 text-orange-300'
          )}>
            {statusIcon} {statusLabel}
          </span>
        </div>

        {/* Progress ring + daily stats */}
        <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3">
          <div className="relative flex h-[84px] w-[84px] items-center justify-center">
            <svg className="h-[84px] w-[84px] -rotate-90" viewBox="0 0 84 84" style={{ overflow: 'visible' }}>
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <motion.circle cx="42" cy="42" r="34" fill="none"
                stroke={statusTone === 'over' ? '#FB923C' : '#F472B6'}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(1, limitPct / 100)) }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ filter: statusTone === 'over' ? 'drop-shadow(0 0 10px rgba(251,146,60,0.65))' : 'none' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-lg font-black', statusTone === 'over' ? 'text-orange-300' : 'text-white')}>{limitPct}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-pink-300/80">limit</span>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-pink-400/16 bg-pink-500/8 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-pink-200/55">Sweet kcal</p>
                <p className={cn('mt-1 text-sm font-black', statusTone === 'over' ? 'text-orange-300' : 'text-pink-300')}>{sweetCaloriesToday}</p>
              </div>
              <div className="rounded-xl border border-brand/14 bg-brand/6 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-amber-200/45">Daily limit</p>
                <p className="mt-1 text-sm font-black text-white/85">{dailyLimit} kcal</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-xl border border-white/8 bg-white/3 px-2 py-1.5 text-center">
                <p className="text-sm font-black text-pink-300">{todaySweetFoods.length}</p>
                <p className="text-[10px] text-amber-200/35">Today</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/3 px-2 py-1.5 text-center">
                <p className="text-sm font-black text-emerald-300">{sweetFreeDays}</p>
                <p className="text-[10px] text-amber-200/35">Free days</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/3 px-2 py-1.5 text-center">
                <p className="text-sm font-black text-white/75">{weekTotal}</p>
                <p className="text-[10px] text-amber-200/35">Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* 7-day pattern bar chart */}
        <div className="mt-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/45 mb-2">7-Day Pattern</p>
          <div className="flex items-end gap-1.5">
            {weekData.map((entry, i) => (
              <div key={entry.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-10 w-full items-end rounded-lg bg-pink-500/4 overflow-hidden">
                  <motion.div
                    className={cn('w-full rounded-lg',
                      entry.count === 0 ? 'bg-white/6' : entry.count === 1 ? 'bg-pink-400/40' : entry.count === 2 ? 'bg-pink-400/65' : 'bg-pink-400'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(12, (entry.count / maxCount) * 100)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                  />
                </div>
                <span className={cn('text-[10px] font-semibold',
                  entry.date === today ? 'text-pink-300' : 'text-amber-200/30'
                )}>{formatDate(entry.date, 'EEEEE')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's sweet list */}
        <div className="mt-3 rounded-xl border border-pink-400/12 bg-pink-500/6 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-200/60 mb-1.5">Today's Sweets</p>
          {todaySweetFoods.length === 0 ? (
            <p className="text-xs text-emerald-300/80">No sweets logged today — streak lives on! 🌟</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {todaySweetFoods.slice(0, 6).map((food) => (
                <span key={food} className="rounded-full border border-pink-400/18 bg-[#2b0f18] px-2 py-1 text-[11px] text-pink-200/85">
                  🍬 {food}
                </span>
              ))}
              {todaySweetFoods.length > 6 && (
                <span className="rounded-full border border-white/10 bg-white/3 px-2 py-1 text-[11px] text-amber-200/45">
                  +{todaySweetFoods.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Meal Heatmap Widget  (365-day dotted year view, GitHub-style)
// ---------------------------------------------------------------------------

interface MealHeatmapProps {
  className?: string;
}

export function MealHeatmap({ className }: MealHeatmapProps) {
  const meals = useMealLogStore((s) => s.meals);
  const goals = useNutritionStore((s) => s.goals);
  const todayStr = todayISO();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { weekColumns, monthLabels, activeDays } = useMemo(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);

    type Day = { date: string; count: number; dow: number };

    // Build flat array: 364 days ago through today
    const allDays: Day[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = meals.filter((m) => m.date === dateStr && !isLiquidLog(m)).length;
      allDays.push({ date: dateStr, count, dow: d.getDay() });
    }

    // Pad front so the first week column starts on Sunday
    const pad = allDays[0].dow; // 0 = Sunday
    const padded: (Day | null)[] = [...Array(pad).fill(null), ...allDays];

    // Group into columns of 7 (one column = one week)
    const weekColumns: (Day | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const col = padded.slice(i, i + 7);
      while (col.length < 7) col.push(null);
      weekColumns.push(col);
    }

    // Track which column each new month first appears in
    const monthLabels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    weekColumns.forEach((col, ci) => {
      for (const day of col) {
        if (day) {
          const m = new Date(day.date + 'T12:00:00').getMonth();
          if (m !== lastMonth) {
            monthLabels.push({
              month: new Date(day.date + 'T12:00:00')
                .toLocaleDateString('en-US', { month: 'short' }),
              col: ci,
            });
            lastMonth = m;
          }
          break;
        }
      }
    });

    const activeDays = allDays.filter((d) => d.count > 0).length;
    return { weekColumns, monthLabels, activeDays };
  }, [meals]);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    const allDayMeals = meals.filter((m) => m.date === selectedDay);
    const dayMeals = allDayMeals.filter((m) => !isLiquidLog(m));
    const liquidMeals = allDayMeals.filter((m) => isLiquidLog(m));
    const totalCal = dayMeals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = Math.round(dayMeals.reduce((s, m) => s + m.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(dayMeals.reduce((s, m) => s + m.carbs, 0) * 10) / 10;
    const totalFat = Math.round(dayMeals.reduce((s, m) => s + m.fat, 0) * 10) / 10;
    const byType = {
      breakfast: dayMeals.filter((m) => m.mealType === 'breakfast').length,
      lunch: dayMeals.filter((m) => m.mealType === 'lunch').length,
      dinner: dayMeals.filter((m) => m.mealType === 'dinner').length,
      snack: dayMeals.filter((m) => m.mealType === 'snack').length,
    };
    return { dayMeals, liquidMeals, totalCal, totalProtein, totalCarbs, totalFat, byType };
  }, [selectedDay, meals]);

  const selectedDateLabel = selectedDay
    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  const getDotClass = (count: number, isToday: boolean): string => {
    if (isToday && count === 0) return 'w-3 h-3 rounded-full bg-white/8 ring-2 ring-brand/60 transition-colors';
    if (count === 0) return 'w-3 h-3 rounded-full bg-white/8 transition-colors';
    if (count === 1) return 'w-3 h-3 rounded-full bg-brand/40 transition-colors shadow-[0_0_4px_rgba(230,183,95,0.28)]';
    if (count === 2) return 'w-3 h-3 rounded-full bg-brand/62 transition-colors shadow-[0_0_6px_rgba(230,183,95,0.42)]';
    if (count === 3) return 'w-3 h-3 rounded-full bg-brand/82 transition-colors shadow-[0_0_8px_rgba(230,183,95,0.58)]';
    return 'w-3 h-3 rounded-full bg-brand transition-colors shadow-[0_0_11px_rgba(230,183,95,0.78)]';
  };

  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-brand/22 bg-[#1a0d00]/88 p-5 backdrop-blur-sm',
        className
      )}
      onMouseEnter={() => soundManager.playHover()}
      whileHover={{ y: -4, boxShadow: '0 0 48px rgba(230,183,95,0.44), 0 10px 36px rgba(0,0,0,0.55)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CaloriesIcon size={15} className="text-brand" />
        <span className="text-sm font-bold text-white/85">Activity Heatmap</span>
        <span className="ml-auto text-xs text-amber-200/35">{activeDays} active days this year</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: 'max-content' }}>
          {/* Month labels */}
          <div className="flex mb-1.5" style={{ gap: '2px', paddingLeft: '18px' }}>
            {weekColumns.map((_, wi) => {
              const lbl = monthLabels.find((m) => m.col === wi);
              return (
                <div key={wi} style={{ width: '12px' }}
                  className="text-[11px] text-amber-200/45 font-semibold overflow-visible whitespace-nowrap">
                  {lbl?.month ?? ''}
                </div>
              );
            })}
          </div>

          {/* Rows of days */}
          <div className="flex" style={{ gap: '2px' }}>
            {/* Day-of-week labels */}
            <div className="flex flex-col mr-1" style={{ gap: '2px' }}>
              {DOW_LABELS.map((d, i) => (
                <div key={i} style={{ height: '12px', width: '12px' }}
                  className="text-[11px] text-amber-200/25 flex items-center justify-end pr-1">
                  {i % 2 !== 0 ? d : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weekColumns.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: '2px' }}>
                {week.map((day, di) =>
                  day ? (
                    day.count > 0 ? (
                      <button
                        key={di}
                        onClick={() => { soundManager.playClick(); setSelectedDay(day.date); }}
                        className={cn(getDotClass(day.count, day.date === todayStr), 'cursor-pointer hover:brightness-125 hover:scale-125 p-0 m-0 border-0 bg-transparent outline-none')}
                        title={`${day.date}: ${day.count} meal${day.count !== 1 ? 's' : ''} — click to view`}
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <div
                        key={di}
                        className={getDotClass(day.count, day.date === todayStr)}
                        title={`${day.date}: no meals`}
                      />
                    )
                  ) : (
                    <div key={di} className="w-3 h-3" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-brand/10">
        <span className="text-xs text-amber-200/35">Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div key={lvl} className={cn('w-3 h-3 rounded-full',
            lvl === 0 ? 'bg-white/8' :
            lvl === 1 ? 'bg-brand/50' :
            lvl === 2 ? 'bg-brand/70' :
            lvl === 3 ? 'bg-brand/88' : 'bg-brand'
          )} />
        ))}
        <span className="text-xs text-amber-200/35">More</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/8 ring-2 ring-brand/60" />
          <span className="text-xs text-amber-200/35">Today</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal isOpen={selectedDay !== null} onClose={() => setSelectedDay(null)} title={selectedDateLabel}>
        {selectedDayData && (
          <div className="space-y-4">
            {/* Summary stat cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-brand/16 bg-brand/6 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-brand">{selectedDayData.dayMeals.length}</p>
                <p className="text-[11px] text-amber-200/45">Meals</p>
              </div>
              <div className="rounded-xl border border-orange-400/16 bg-orange-500/8 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-orange-300">{selectedDayData.totalCal}</p>
                <p className="text-[11px] text-amber-200/45">kcal</p>
              </div>
              <div className="rounded-xl border border-red-400/16 bg-red-500/8 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-red-300">{selectedDayData.totalProtein}g</p>
                <p className="text-[11px] text-amber-200/45">Protein</p>
              </div>
              <div className="rounded-xl border border-yellow-400/16 bg-yellow-500/8 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-yellow-300">{selectedDayData.totalCarbs}g</p>
                <p className="text-[11px] text-amber-200/45">Carbs</p>
              </div>
            </div>

            {/* Macro progress bars vs goals */}
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/45">Intake vs Goal</p>
              {[
                { label: 'Calories', value: selectedDayData.totalCal, goal: goals.calories, unit: ' kcal', color: 'bg-brand', textColor: 'text-brand' },
                { label: 'Protein',  value: selectedDayData.totalProtein, goal: goals.protein, unit: 'g', color: 'bg-red-400', textColor: 'text-red-300' },
                { label: 'Carbs',    value: selectedDayData.totalCarbs,   goal: goals.carbs,   unit: 'g', color: 'bg-yellow-400', textColor: 'text-yellow-300' },
                { label: 'Fat',      value: selectedDayData.totalFat,     goal: goals.fat,     unit: 'g', color: 'bg-purple-400', textColor: 'text-purple-300' },
              ].map(({ label, value, goal, unit, color, textColor }) => {
                const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">{label}</span>
                      <span className={cn('text-xs font-bold', textColor)}>
                        {value}{unit} <span className="font-normal text-white/28">/ {goal}{unit}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meal type breakdown */}
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/45 mb-2.5">By Meal Type</p>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { type: 'breakfast', emoji: '🌅', label: 'Breakfast', color: 'text-amber-300' },
                  { type: 'lunch',     emoji: '☀️',  label: 'Lunch',     color: 'text-yellow-300' },
                  { type: 'dinner',    emoji: '🌙',  label: 'Dinner',    color: 'text-blue-300'   },
                  { type: 'snack',     emoji: '🍎',  label: 'Snack',     color: 'text-green-300'  },
                ] as const).map(({ type, emoji, label, color }) => {
                  const count = selectedDayData.byType[type];
                  return (
                    <div key={type} className="flex flex-col items-center rounded-xl border border-white/8 bg-white/3 px-2 py-2.5">
                      <span className="text-lg leading-none">{emoji}</span>
                      <span className={cn('text-sm font-black mt-1', count > 0 ? color : 'text-white/25')}>{count}</span>
                      <span className="text-[10px] text-amber-200/35 mt-0.5">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meals list */}
            {selectedDayData.dayMeals.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/45">Meals Logged</p>
                {selectedDayData.dayMeals.map((meal) => (
                  <div key={meal.id} className="flex items-start gap-3 rounded-xl border border-brand/14 bg-brand/6 px-3 py-2.5">
                    <span className="text-base shrink-0 leading-none mt-0.5">
                      {meal.mealType === 'breakfast' ? '🌅' : meal.mealType === 'lunch' ? '☀️' : meal.mealType === 'dinner' ? '🌙' : '🍎'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white/88 truncate capitalize">{meal.foods.map((f) => f.name).join(', ')}</p>
                      <p className="text-[11px] text-amber-200/38 capitalize">{meal.mealType}{meal.foodSource ? ` · ${meal.foodSource}` : ''}</p>
                    </div>
                    {meal.calories > 0 && <span className="text-xs font-bold text-brand shrink-0">{meal.calories} kcal</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-brand/15 py-6">
                <p className="text-sm italic text-white/25">No meals logged this day</p>
              </div>
            )}

            {/* Liquid intake section */}
            {selectedDayData.liquidMeals.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-300/50">Liquid Intake</p>
                {selectedDayData.liquidMeals.map((meal) => (
                  <div key={meal.id} className="flex items-start gap-3 rounded-xl border border-sky-400/14 bg-sky-500/6 px-3 py-2.5">
                    <span className="text-base shrink-0 leading-none mt-0.5">💧</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white/88 truncate">{meal.foods.map((f) => f.name).join(', ')}</p>
                      <p className="text-[11px] text-sky-300/40">Liquid intake</p>
                    </div>
                    {meal.water > 0 && <span className="text-xs font-bold text-sky-300 shrink-0">{meal.water} ml</span>}
                    {meal.calories > 0 && <span className="text-xs font-bold text-brand shrink-0">{meal.calories} kcal</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Food Source breakdown helper (used by health analytics & health indicator)
// ---------------------------------------------------------------------------

export const FOOD_SOURCE_META: Record<FoodSource, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  'home-cooked': { label: 'Home Cooked', emoji: '🍳', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  'fast-food':   { label: 'Fast Food',   emoji: '🍔', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'dine-out':    { label: 'Dine Out',    emoji: '🍽️', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  'street-food': { label: 'Street Food', emoji: '🌮', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'processed':   { label: 'Processed',   emoji: '📦', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
};

// ---------------------------------------------------------------------------
// WidgetCard — animated glowing wrapper for dashboard widgets
// ---------------------------------------------------------------------------

function WidgetCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-brand/22 bg-[#1a0d00]/88 backdrop-blur-sm',
        className,
      )}
      onMouseEnter={() => soundManager.playHover()}
      whileHover={{ y: -4, boxShadow: '0 0 48px rgba(230,183,95,0.44), 0 10px 36px rgba(0,0,0,0.55)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

function getDaysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T12:00:00`);
  const base = new Date(`${todayISO()}T12:00:00`);
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

function formatScheduleLabel(dateStr?: string): string {
  if (!dateStr) return 'Unscheduled';
  const diff = getDaysUntil(dateStr);
  if (diff === null) return 'Unscheduled';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff <= 6) return `In ${diff} days`;
  return formatDate(dateStr, 'EEE, MMM d');
}


// ---------------------------------------------------------------------------
// Pantry Dashboard Widget
// ---------------------------------------------------------------------------

interface PantryWidgetProps { className?: string; }

interface PantryDraft {
  name: string;
  quantity: string;
  unit: UnitType;
  category: string;
  expiryDate: string;
  shelfLifeDays: string;
  lowStockThreshold: string;
}

function createPantryDraft(item?: PantryItem): PantryDraft {
  return {
    name: item?.name ?? '',
    quantity: item ? String(item.quantity) : '1',
    unit: item?.unit ?? 'piece',
    category: item?.category ?? '',
    expiryDate: item?.expiryDate ?? '',
    shelfLifeDays: item?.shelfLifeDays ? String(item.shelfLifeDays) : '',
    lowStockThreshold: item?.lowStockThreshold ? String(item.lowStockThreshold) : '2',
  };
}

export function PantryWidget({ className }: PantryWidgetProps) {
  const items = usePantryStore((s) => s.items);
  const addItem = usePantryStore((s) => s.addItem);
  const updateItem = usePantryStore((s) => s.updateItem);
  const deleteItem = usePantryStore((s) => s.deleteItem);
  const consumeItem = usePantryStore((s) => s.consumeItem);
  const restockItem = usePantryStore((s) => s.restockItem);
  const getLowStockItems = usePantryStore((s) => s.getLowStockItems);
  const getExpiringSoon = usePantryStore((s) => s.getExpiringSoon);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [draft, setDraft] = useState<PantryDraft>(() => createPantryDraft());

  const lowStock = useMemo(() => getLowStockItems(), [items, getLowStockItems]);
  const expiring = useMemo(() => getExpiringSoon(7), [items, getExpiringSoon]);
  const syncedCount = items.filter((item) => item.source === 'grocery-sync').length;

  const featuredItems = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const aExp = getDaysUntil(a.expiryDate) ?? 999;
        const bExp = getDaysUntil(b.expiryDate) ?? 999;
        const aLow = a.quantity <= (a.lowStockThreshold ?? 2) ? 0 : 1;
        const bLow = b.quantity <= (b.lowStockThreshold ?? 2) ? 0 : 1;
        if (aLow !== bLow) return aLow - bLow;
        if (aExp !== bExp) return aExp - bExp;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [items]);

  const categoryGroups = useMemo(() => {
    const map: Record<string, PantryItem[]> = {};
    featuredItems.forEach((item) => {
      const cat = item.category?.trim() || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  }, [featuredItems]);

  const openCreate = () => {
    setEditingItem(null);
    setDraft(createPantryDraft());
    setEditorOpen(true);
  };

  const openEdit = (item: PantryItem) => {
    setEditingItem(item);
    setDraft(createPantryDraft(item));
    setEditorOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name: draft.name.trim(),
      quantity: Math.max(0, Number(draft.quantity) || 0),
      unit: draft.unit,
      category: draft.category.trim() || undefined,
      expiryDate: draft.expiryDate || undefined,
      shelfLifeDays: draft.shelfLifeDays ? Number(draft.shelfLifeDays) : undefined,
      lowStockThreshold: Math.max(1, Number(draft.lowStockThreshold) || 1),
      source: editingItem?.source ?? 'manual' as const,
    };

    if (!payload.name) return;

    if (editingItem) {
      updateItem(editingItem.id, payload);
    } else {
      addItem(payload);
    }

    setEditorOpen(false);
    setEditingItem(null);
    setDraft(createPantryDraft());
  };

  return (
    <WidgetCard className={cn('flex h-full flex-col gap-4 p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12">
              <Package size={16} className="text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/90">Pantry Status</h3>
              <p className="text-xs text-amber-200/40">Manual edits and grocery-sync stock now live in one place.</p>
            </div>
          </div>
        </div>
        <motion.button
          onClick={() => { soundManager.playClick(); openCreate(); }}
          onMouseEnter={() => soundManager.playHover()}
          whileHover={{ scale: 1.06, boxShadow: '0 0 18px rgba(230,183,95,0.40)' }}
          whileTap={{ scale: 0.93 }}
          className="flex items-center gap-1.5 rounded-xl border border-brand/35 bg-brand/12 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/22 hover:border-brand/55"
        >
          <Plus size={13} />
          Add Item
        </motion.button>
      </div>

      <div className="rounded-xl border border-emerald-500/14 bg-emerald-500/6 px-3 py-2 text-xs text-emerald-200/75">
        When you mark a grocery item as purchased, it automatically lands here as a pantry entry — no extra steps needed. You can still fine-tune quantities, set shelf-life durations, and update expiry dates manually at any time to keep your pantry accurate and waste-free.
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Tracked', value: items.length, tone: 'text-white/85' },
          { label: 'Low', value: lowStock.length, tone: lowStock.length ? 'text-orange-300' : 'text-white/55' },
          { label: 'Expiring', value: expiring.length, tone: expiring.length ? 'text-red-300' : 'text-white/55' },
          { label: 'Synced', value: syncedCount, tone: 'text-emerald-300' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/8 bg-white/3 px-2 py-2 text-center">
            <p className={`text-lg font-black ${card.tone}`}>{card.value}</p>
            <p className="text-[11px] text-amber-200/35">{card.label}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-brand/15 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-white/70">Your pantry is still empty.</p>
          <p className="mt-1 text-xs text-amber-200/30">Add staple items now so the grocery schedule can tell you when extending is safe.</p>
        </div>
      ) : (
        <>
          {(lowStock.length > 0 || expiring.length > 0) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/45">Needs Attention</p>
                <p className="text-[11px] text-amber-200/30">{lowStock.length + expiring.length} alerts</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {expiring.slice(0, 2).map((item) => (
                  <div key={item.id} className="rounded-xl border border-red-500/14 bg-red-500/8 px-3 py-2">
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] text-red-200/80">Expires {formatScheduleLabel(item.expiryDate)}</p>
                  </div>
                ))}
                {lowStock.slice(0, 2).map((item) => (
                  <div key={item.id} className="rounded-xl border border-orange-500/14 bg-orange-500/8 px-3 py-2">
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] text-orange-200/80">{item.quantity} {item.unit} left</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/45">Quick Controls</p>
              <p className="text-[11px] text-amber-200/30">{featuredItems.length} items · {categoryGroups.length} categories</p>
            </div>
            <div className="space-y-3">
              {categoryGroups.map(([category, catItems]) => (
                <div key={category}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-px flex-1 bg-brand/10" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand/60">{category}</span>
                    <span className="h-px flex-1 bg-brand/10" />
                  </div>
                  <div className="space-y-2">
              {catItems.map((item) => {
                const low = item.quantity <= (item.lowStockThreshold ?? 2);
                const expiringSoon = (getDaysUntil(item.expiryDate) ?? 999) <= 3;
                return (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                          {item.source === 'grocery-sync' && (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Synced
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-amber-200/38">
                          {item.category && <span>{item.category}</span>}
                          <span>{item.quantity} {item.unit}</span>
                          {item.expiryDate && <span>{expiringSoon ? 'Expires soon' : formatScheduleLabel(item.expiryDate)}</span>}
                          {low && <span className="text-orange-300">Below threshold</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-lg border border-brand/18 bg-brand/8 p-2 text-brand transition-colors hover:bg-brand/14"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => { soundManager.playClick(); consumeItem(item.id, 1); }} className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:border-brand/20 hover:text-white">
                        <Minus size={12} />
                      </button>
                      <div className="flex-1 rounded-lg border border-white/8 bg-[#140900] px-3 py-2 text-center text-sm font-bold text-white">
                        {item.quantity} {item.unit}
                      </div>
                      <button onClick={() => { soundManager.playClick(); restockItem(item.id, 1); }} className="rounded-lg border border-brand/18 bg-brand/10 p-2 text-brand hover:bg-brand/16">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Modal isOpen={editorOpen} onClose={() => setEditorOpen(false)} title={editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}>
        <div className="space-y-3">
          <Input label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Chicken breast" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} />
            <div>
              <label className="mb-1 block text-sm font-medium text-amber-200/60">Unit</label>
              <select value={draft.unit} onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value as UnitType }))} className="w-full rounded-lg border border-brand/18 bg-[#140900]/90 px-3 py-2 text-sm text-white hover:border-brand/30 focus:border-brand/50 focus:outline-none">
                {UNIT_TYPES.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Protein, dairy, produce..." />
            <Input label="Low stock threshold" type="number" value={draft.lowStockThreshold} onChange={(event) => setDraft((current) => ({ ...current, lowStockThreshold: event.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry date" type="date" value={draft.expiryDate} onChange={(event) => setDraft((current) => ({ ...current, expiryDate: event.target.value }))} />
            <Input label="Shelf life (days)" type="number" value={draft.shelfLifeDays} onChange={(event) => setDraft((current) => ({ ...current, shelfLifeDays: event.target.value }))} placeholder="Optional" />
          </div>
          <div className="flex justify-between gap-2 pt-2">
            {editingItem ? (
              <button onClick={() => { deleteItem(editingItem.id); setEditorOpen(false); }} className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
                Delete
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button onClick={() => setEditorOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70">Cancel</button>
              <button onClick={handleSave} className="rounded-xl border border-brand/22 bg-brand/12 px-4 py-2 text-sm font-semibold text-brand">Save</button>
            </div>
          </div>
        </div>
      </Modal>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// Grocery Dashboard Widget
// ---------------------------------------------------------------------------

interface GroceryWidgetProps { className?: string; }

interface GroceryDraft {
  name: string;
  quantity: string;
  unit: UnitType;
  store: string;
  price: string;
  category: string;
  scheduledDate: string;
  addToPantryOnPurchase: boolean;
}

function createGroceryDraft(defaultDate: string, item?: GroceryItem): GroceryDraft {
  return {
    name: item?.name ?? '',
    quantity: item ? String(item.quantity) : '1',
    unit: item?.unit ?? 'piece',
    store: item?.store ?? '',
    price: item?.price ? String(item.price) : '',
    category: item?.category ?? '',
    scheduledDate: item?.scheduledDate ?? defaultDate,
    addToPantryOnPurchase: item?.addToPantryOnPurchase ?? true,
  };
}

export function GroceryWidget({ className }: GroceryWidgetProps) {
  const items = useGroceryStore((s) => s.items);
  const schedule = useGroceryStore((s) => s.schedule);
  const addItem = useGroceryStore((s) => s.addItem);
  const deleteItem = useGroceryStore((s) => s.deleteItem);
  const togglePurchased = useGroceryStore((s) => s.togglePurchased);
  const getTotalCost = useGroceryStore((s) => s.getTotalCost);
  const updateSchedule = useGroceryStore((s) => s.updateSchedule);
  const snoozeSchedule = useGroceryStore((s) => s.snoozeSchedule);
  const lowStockItems = usePantryStore((s) => s.getLowStockItems());

  const [editorOpen, setEditorOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [draft, setDraft] = useState<GroceryDraft>(() => createGroceryDraft(schedule.nextDate));
  const [scheduleDraft, setScheduleDraft] = useState({
    nextDate: schedule.nextDate,
    cadenceDays: String(schedule.cadenceDays),
    label: schedule.label ?? 'Weekly grocery run',
    reminderDaysBefore: String(schedule.reminderDaysBefore),
  });

  const unpurchased = useMemo(() => items.filter((item) => !item.isPurchased), [items]);
  const purchased = useMemo(() => items.filter((item) => item.isPurchased), [items]);
  const totalCost = getTotalCost();
  const nextTripDiff = getDaysUntil(schedule.nextDate) ?? 0;
  const scheduledForNextTrip = unpurchased.filter((item) => item.scheduledDate === schedule.nextDate).length;

  const grouped = useMemo(() => {
    const map: Record<string, GroceryItem[]> = {};
    unpurchased.forEach((item) => {
      const key = item.scheduledDate ?? 'Unscheduled';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort(([left], [right]) => {
      if (left === 'Unscheduled') return 1;
      if (right === 'Unscheduled') return -1;
      return left.localeCompare(right);
    });
  }, [unpurchased]);

  const openCreate = () => {
    setDraft(createGroceryDraft(schedule.nextDate));
    setEditorOpen(true);
  };

  const handleSaveItem = () => {
    if (!draft.name.trim()) return;
    addItem({
      name: draft.name.trim(),
      quantity: Math.max(0, Number(draft.quantity) || 0),
      unit: draft.unit,
      store: draft.store.trim() || undefined,
      price: draft.price ? Number(draft.price) : undefined,
      category: draft.category.trim() || undefined,
      scheduledDate: draft.scheduledDate || schedule.nextDate,
      addToPantryOnPurchase: draft.addToPantryOnPurchase,
    });
    setEditorOpen(false);
    setDraft(createGroceryDraft(schedule.nextDate));
  };

  const handleSaveSchedule = () => {
    updateSchedule({
      nextDate: scheduleDraft.nextDate,
      cadenceDays: Math.max(1, Number(scheduleDraft.cadenceDays) || 7),
      label: scheduleDraft.label.trim() || 'Weekly grocery run',
      reminderDaysBefore: Math.max(0, Number(scheduleDraft.reminderDaysBefore) || 0),
    });
    setScheduleOpen(false);
  };

  const reminderTone = nextTripDiff < 0 ? 'overdue' : nextTripDiff <= schedule.reminderDaysBefore ? 'soon' : 'future';
  const reminderText = nextTripDiff < 0
    ? `${Math.abs(nextTripDiff)} day${Math.abs(nextTripDiff) === 1 ? '' : 's'} overdue`
    : nextTripDiff === 0
      ? 'Grocery day is today'
      : nextTripDiff === 1
        ? 'Grocery day is tomorrow'
        : `Grocery day in ${nextTripDiff} days`;

  return (
    <WidgetCard className={cn('flex h-full flex-col gap-4 p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12">
              <ShoppingCart size={16} className="text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/90">Grocery Timeline</h3>
              <p className="text-xs text-amber-200/40">Items now stay organized by trip date and purchase status.</p>
            </div>
          </div>
        </div>
        <motion.button
          onClick={() => { soundManager.playClick(); openCreate(); }}
          onMouseEnter={() => soundManager.playHover()}
          whileHover={{ scale: 1.06, boxShadow: '0 0 18px rgba(230,183,95,0.40)' }}
          whileTap={{ scale: 0.93 }}
          className="flex items-center gap-1.5 rounded-xl border border-brand/35 bg-brand/12 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/22 hover:border-brand/55"
        >
          <Plus size={13} />
          Add Item
        </motion.button>
      </div>

      <div className={cn(
        'rounded-2xl border px-3 py-3',
        reminderTone === 'overdue'
          ? 'border-red-500/18 bg-red-500/8'
          : reminderTone === 'soon'
            ? 'border-brand/18 bg-brand/10'
            : 'border-white/8 bg-white/3'
      )}>
        <div className="flex items-start gap-3">
          <Bell size={15} className={cn(reminderTone === 'overdue' ? 'text-red-300' : reminderTone === 'soon' ? 'text-brand' : 'text-amber-200/55')} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">{schedule.label ?? 'Weekly grocery run'}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200/45">
                {formatScheduleLabel(schedule.nextDate)}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-200/45">{reminderText} with {scheduledForNextTrip} item{scheduledForNextTrip === 1 ? '' : 's'} queued.</p>
            <p className="mt-1 text-[11px] text-amber-200/28">Cadence: every {schedule.cadenceDays} day{schedule.cadenceDays === 1 ? '' : 's'} ? reminder {schedule.reminderDaysBefore} day(s) before.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setScheduleOpen(true)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:border-brand/18 hover:text-white">
            Edit schedule
          </button>
          <button
            onClick={() => snoozeSchedule(3)}
            disabled={lowStockItems.length > 0}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-semibold',
              lowStockItems.length > 0
                ? 'cursor-not-allowed border-white/8 text-white/25'
                : 'border-brand/18 bg-brand/10 text-brand hover:bg-brand/18'
            )}
          >
            Extend 3 days
          </button>
          <button
            onClick={() => snoozeSchedule(7)}
            disabled={lowStockItems.length > 0}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-semibold',
              lowStockItems.length > 0
                ? 'cursor-not-allowed border-white/8 text-white/25'
                : 'border-white/12 bg-white/5 text-white/70 hover:border-brand/18 hover:text-white'
            )}
          >
            Extend 1 week
          </button>
          {lowStockItems.length > 0 && (
            <p className="text-[11px] text-orange-300/80">Extension locked while pantry is low on {lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'}.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pending', value: unpurchased.length, tone: 'text-white/85' },
          { label: 'Purchased', value: purchased.length, tone: 'text-emerald-300' },
          { label: 'Cost', value: formatCurrency(totalCost, 'PHP'), tone: 'text-brand' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-center">
            <p className={`text-sm font-black ${card.tone}`}>{card.value}</p>
            <p className="text-[11px] text-amber-200/35">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {grouped.length === 0 ? (
          <div className="flex h-full min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-brand/15 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-white/70">No grocery items yet.</p>
            <p className="mt-1 text-xs text-amber-200/30">Add a few staples and assign them to the next grocery run.</p>
          </div>
        ) : (
          grouped.map(([dateKey, dateItems]) => (
            <div key={dateKey}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-brand" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand/80">{formatScheduleLabel(dateKey === 'Unscheduled' ? undefined : dateKey)}</p>
                </div>
                <p className="text-[11px] text-amber-200/30">{dateItems.length} item{dateItems.length === 1 ? '' : 's'}</p>
              </div>
              <div className="space-y-2 border-l border-brand/12 pl-3">
                {dateItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { soundManager.playClick(); togglePurchased(item.id); }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/22 bg-brand/8 text-brand transition-colors hover:bg-brand/16"
                      >
                        {item.isPurchased ? <Check size={14} /> : <ShoppingCart size={14} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                          {item.addToPantryOnPurchase && (
                            <span className="rounded-full border border-emerald-400/18 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Auto pantry
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-amber-200/38">
                          {item.quantity} {item.unit}
                          {item.store ? ` ? ${item.store}` : ''}
                          {item.category ? ` ? ${item.category}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        {item.price ? <p className="text-xs font-semibold text-brand">{formatCurrency(item.price * item.quantity, 'PHP')}</p> : <p className="text-xs text-amber-200/28">No price</p>}
                        <button onClick={() => deleteItem(item.id)} className="mt-1 text-[11px] text-red-300/80 hover:text-red-200">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={editorOpen} onClose={() => setEditorOpen(false)} title="Add Grocery Item">
        <div className="space-y-3">
          <Input label="Item name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. milk, spinach, chicken" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} />
            <div>
              <label className="mb-1 block text-sm font-medium text-amber-200/60">Unit</label>
              <select value={draft.unit} onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value as UnitType }))} className="w-full rounded-lg border border-brand/18 bg-[#140900]/90 px-3 py-2 text-sm text-white hover:border-brand/30 focus:border-brand/50 focus:outline-none">
                {UNIT_TYPES.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Store" value={draft.store} onChange={(event) => setDraft((current) => ({ ...current, store: event.target.value }))} placeholder="Optional" />
            <Input label="Category" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Produce, protein..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} placeholder="Optional" />
            <Input label="Trip date" type="date" value={draft.scheduledDate} onChange={(event) => setDraft((current) => ({ ...current, scheduledDate: event.target.value }))} />
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-emerald-400/14 bg-emerald-500/6 px-3 py-2 text-sm text-emerald-200/85">
            <input type="checkbox" checked={draft.addToPantryOnPurchase} onChange={(event) => setDraft((current) => ({ ...current, addToPantryOnPurchase: event.target.checked }))} />
            Auto-add this item to the pantry when purchased.
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditorOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70">Cancel</button>
            <button onClick={handleSaveItem} className="rounded-xl border border-brand/22 bg-brand/12 px-4 py-2 text-sm font-semibold text-brand">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Grocery Schedule">
        <div className="space-y-3">
          <Input label="Trip label" value={scheduleDraft.label} onChange={(event) => setScheduleDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Weekly grocery run" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Next date" type="date" value={scheduleDraft.nextDate} onChange={(event) => setScheduleDraft((current) => ({ ...current, nextDate: event.target.value }))} />
            <Input label="Cadence (days)" type="number" value={scheduleDraft.cadenceDays} onChange={(event) => setScheduleDraft((current) => ({ ...current, cadenceDays: event.target.value }))} />
          </div>
          <Input label="Reminder lead time" type="number" value={scheduleDraft.reminderDaysBefore} onChange={(event) => setScheduleDraft((current) => ({ ...current, reminderDaysBefore: event.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setScheduleOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70">Cancel</button>
            <button onClick={handleSaveSchedule} className="rounded-xl border border-brand/22 bg-brand/12 px-4 py-2 text-sm font-semibold text-brand">Save schedule</button>
          </div>
        </div>
      </Modal>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// Nutrition Goals Dashboard Widget
// ---------------------------------------------------------------------------

interface NutritionGoalsWidgetProps { className?: string; }

export function NutritionGoalsWidget({ className }: NutritionGoalsWidgetProps) {
  const goals = useNutritionStore((s) => s.goals);
  const getDailyTotals = useMealLogStore((s) => s.getDailyTotals);
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const today = todayISO();
  const last7 = getLast7Days();
  const totals = useMemo(() => getDailyTotals(today), [getDailyTotals, today]);

  const weekMeals = useMemo(() => getMealsByDateRange(last7[0], last7[last7.length - 1]), [getMealsByDateRange, last7]);
  const weekAvgCalories = useMemo(() => {
    if (weekMeals.length === 0) return 0;
    return Math.round(weekMeals.reduce((s, m) => s + m.calories, 0) / 7);
  }, [weekMeals]);

  const goalItems = [
    { label: 'Calories', icon: <Flame size={12} className="text-brand" />,         current: totals.calories, goal: goals.calories, unit: 'kcal', color: 'from-brand to-amber-300',       glow: 'rgba(230,183,95,0.4)'   },
    { label: 'Protein',  icon: <Beef size={12} className="text-red-400" />,         current: totals.protein,  goal: goals.protein,  unit: 'g',    color: 'from-red-400 to-rose-300',     glow: 'rgba(248,113,113,0.4)'  },
    { label: 'Carbs',    icon: <Wheat size={12} className="text-yellow-400" />,     current: totals.carbs,    goal: goals.carbs,    unit: 'g',    color: 'from-yellow-400 to-amber-200', glow: 'rgba(250,204,21,0.4)'   },
    { label: 'Fat',      icon: <CircleDot size={12} className="text-purple-400" />, current: totals.fat,      goal: goals.fat,      unit: 'g',    color: 'from-purple-400 to-violet-300', glow: 'rgba(167,139,250,0.4)' },
    { label: 'Water',    icon: <Droplets size={12} className="text-blue-400" />,    current: totals.water,    goal: goals.water,    unit: 'ml',   color: 'from-blue-400 to-sky-300',     glow: 'rgba(56,189,248,0.4)'   },
  ];

  const metCount    = goalItems.filter(g => g.goal > 0 && g.current >= g.goal).length;
  const totalGoals  = goalItems.filter(g => g.goal > 0).length;
  const calPct      = goals.calories > 0 ? Math.min(100, Math.round((totals.calories / goals.calories) * 100)) : 0;
  const arcLen      = 2 * Math.PI * 18; // ≈ 113.1

  return (
    <WidgetCard className="p-4 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/12">
            <Target size={14} className="text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90 leading-tight">Nutrition Goals</h3>
            <p className="text-xs text-amber-200/38">Today vs targets</p>
          </div>
        </div>
        <div className={cn('text-xs font-bold rounded-lg px-2 py-0.5 border',
          metCount > 0 && metCount === totalGoals
            ? 'text-green-400 border-green-400/25 bg-green-400/8'
            : 'text-brand border-brand/22 bg-brand/8')}>
          {metCount}/{totalGoals} met
        </div>
      </div>

      {/* Calorie arc + overview strip */}
      <div className="flex items-center gap-3 rounded-xl border border-brand/12 bg-brand/4 px-3 py-2.5">
        {/* Arc */}
        <div className="relative flex-shrink-0">
          <svg width="48" height="48" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none"
              stroke="url(#calArcGrad)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(calPct / 100) * arcLen} ${arcLen}`} />
            <defs>
              <linearGradient id="calArcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E6B75F" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-brand select-none"
            style={{ transform: 'rotate(90deg)' }}>
            {calPct}%
          </span>
        </div>
        {/* Calorie summary */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-black text-brand leading-tight">{Math.round(totals.calories)}</span>
            <span className="text-xs text-amber-200/38">/ {goals.calories} kcal</span>
          </div>
          <p className="text-xs text-amber-200/35 mt-0.5">
            {totals.calories < goals.calories
              ? `${goals.calories - Math.round(totals.calories)} kcal to go`
              : `${Math.round(totals.calories - goals.calories)} over goal`}
          </p>
          {/* All-goal mini bars */}
          <div className="flex gap-0.5 mt-2">
            {goalItems.map((g) => {
              const p = g.goal > 0 ? Math.min(100, (g.current / g.goal) * 100) : 0;
              return (
                <div key={g.label} className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden" title={`${g.label}: ${Math.round(p)}%`}>
                  <div className={cn('h-full rounded-full bg-gradient-to-r', g.color)} style={{ width: `${p}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[11px] text-amber-200/25">Cal · Pro · Carb · Fat · H₂O</span>
            <span className="text-[11px] text-amber-200/28">7d avg: {weekAvgCalories} kcal</span>
          </div>
        </div>
      </div>

      {/* Individual goal bars */}
      <div className="space-y-2">
        {goalItems.map((item) => {
          const pct  = Math.min(100, item.goal > 0 ? (item.current / item.goal) * 100 : 0);
          const over = item.goal > 0 && item.current > item.goal;
          const met  = item.goal > 0 && item.current >= item.goal;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="text-sm font-semibold text-white/72">{item.label}</span>
                  {met && <span className="text-xs text-green-400 font-bold leading-none">✓</span>}
                </div>
                <span className="text-xs text-amber-200/45">
                  <span className="text-white/28"> / {item.goal} {item.unit}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full bg-gradient-to-r', item.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={met ? { boxShadow: `0 0 6px ${item.glow}` } : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Macro footer */}
      <div className="flex items-center justify-between pt-2 border-t border-brand/10 mt-auto">
        <div className="flex gap-2">
          {[
            { label: 'P', val: totals.protein, goal: goals.protein, col: 'bg-red-400',    text: 'text-red-400'    },
            { label: 'C', val: totals.carbs,   goal: goals.carbs,   col: 'bg-yellow-400', text: 'text-yellow-400' },
            { label: 'F', val: totals.fat,     goal: goals.fat,     col: 'bg-purple-400', text: 'text-purple-400' },
          ].map(({ label, val, goal, col, text }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <span className={cn('w-1.5 h-1.5 rounded-sm flex-shrink-0', col)} />
                <span className={cn('text-xs font-black', text)}>{Math.round(val)}g</span>
              </div>
              <span className="text-[11px] text-white/22">
                {goal > 0 ? `${Math.round((val / goal) * 100)}%` : label}
              </span>
            </div>
          ))}
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-brand block">{Math.round(totals.calories)} kcal</span>
          <span className="text-[11px] text-amber-200/30">today</span>
        </div>
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// Food Source Breakdown Widget (enhanced health analytics)
// ---------------------------------------------------------------------------

interface FoodSourceWidgetProps { days: string[]; className?: string; }

export function FoodSourceWidget({ days, className }: FoodSourceWidgetProps) {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const meals = useMemo(() => getMealsByDateRange(days[0], days[days.length - 1]), [getMealsByDateRange, days]);

  const sources = useMemo(() => {
    const map: Partial<Record<FoodSource, number>> = {};
    let noSource = 0;
    meals.forEach((m) => {
      if (m.foodSource) map[m.foodSource] = (map[m.foodSource] || 0) + 1;
      else {
        // Backwards compat: derive from isHomeCooked
        const src: FoodSource = m.isHomeCooked ? 'home-cooked' : 'fast-food';
        map[src] = (map[src] || 0) + 1;
      }
      noSource;
    });
    const total = meals.length;
    return (Object.entries(map) as [FoodSource, number][])
      .map(([src, count]) => ({ src, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [meals]);

  const total = meals.length;
  const homePct = useMemo(() => {
    const h = sources.find((s) => s.src === 'home-cooked');
    return h ? h.pct : 0;
  }, [sources]);

  const healthScore = Math.min(100, homePct * 1.2 - (sources.find(s => s.src === 'fast-food')?.pct ?? 0) * 0.5);
  const scoreLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Work';
  const scoreColor = healthScore >= 80 ? 'text-green-400' : healthScore >= 60 ? 'text-emerald-400' : healthScore >= 40 ? 'text-yellow-400' : 'text-orange-400';

  return (
    <WidgetCard className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={15} className="text-brand" />
          <span className="text-sm font-bold text-white/85">Food Sources</span>
        </div>
        <div className="text-right">
          <span className={cn('text-sm font-black', scoreColor)}>{scoreLabel}</span>
          <p className="text-xs text-amber-200/35">{total} meals</p>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-xs text-white/22 italic text-center py-4">No meals logged yet</p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="h-4 rounded-full overflow-hidden flex gap-px">
            {sources.map(({ src, pct }) => {
              const m = FOOD_SOURCE_META[src];
              const colorMap: Record<FoodSource, string> = {
                'home-cooked': 'bg-green-400',
                'fast-food': 'bg-orange-400',
                'dine-out': 'bg-blue-400',
                'street-food': 'bg-yellow-400',
                'processed': 'bg-red-400',
              };
              return pct > 0 ? (
                <div
                  key={src}
                  className={cn('h-full transition-all', colorMap[src])}
                  style={{ width: `${pct}%` }}
                  title={`${m.label}: ${pct}%`}
                />
              ) : null;
            })}
          </div>

          {/* Legend rows with bars */}
          <div className="space-y-2">
            {sources.map(({ src, count, pct }) => {
              const m = FOOD_SOURCE_META[src];
              const colorMap: Record<FoodSource, string> = {
                'home-cooked': 'bg-green-400',
                'fast-food': 'bg-orange-400',
                'dine-out': 'bg-blue-400',
                'street-food': 'bg-yellow-400',
                'processed': 'bg-red-400',
              };
              return (
                <div key={src} className="flex items-center gap-2">
                  <span className="text-sm w-5">{m.emoji}</span>
                  <span className="text-sm text-white/65 w-24 truncate">{m.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', colorMap[src])}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white/55 w-8 text-right">{pct}%</span>
                  <span className="text-xs text-amber-200/30 w-10 text-right">{count}x</span>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          {homePct < 50 && (
            <div className="flex items-center gap-2 rounded-xl border border-orange-500/18 bg-orange-500/6 px-3 py-2">
              <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
              <p className="text-sm text-orange-300/80">Less than half your meals are home-cooked. Try cooking more!</p>
            </div>
          )}
          {homePct >= 70 && (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/18 bg-green-500/6 px-3 py-2">
              <TrendingUp size={12} className="text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300/80">Great job! {homePct}% home-cooked meals this week.</p>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// Calorie Trend Widget (7-day bar chart)
// ---------------------------------------------------------------------------

interface CalorieTrendWidgetProps { days: string[]; className?: string; }

export function CalorieTrendWidget({ days, className }: CalorieTrendWidgetProps) {
  const getDailyTotals = useMealLogStore((s) => s.getDailyTotals);
  const goals = useNutritionStore((s) => s.goals);

  const data = useMemo(() => days.map((d) => {
    const t = getDailyTotals(d);
    const label = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    return { date: d, calories: t.calories, label, isToday: d === todayISO() };
  }), [days, getDailyTotals]);

  const maxVal = Math.max(...data.map((d) => d.calories), goals.calories, 1);
  const avgCal = data.reduce((s, d) => s + d.calories, 0) / data.filter((d) => d.calories > 0).length || 0;
  const trend = data.length > 1
    ? data[data.length - 1].calories - data[data.length - 2].calories
    : 0;

  return (
    <WidgetCard className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-brand" />
          <span className="text-sm font-bold text-white/85">Calorie Trend</span>
        </div>
        <div className="flex items-center gap-1.5">
          {trend !== 0 && (
            <span className={cn('flex items-center gap-0.5 text-xs font-bold',
              trend > 0 ? 'text-orange-400' : 'text-green-400')}>
              {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(trend)} kcal
            </span>
          )}
          <span className="text-xs text-amber-200/40">avg {Math.round(avgCal || 0)}</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d) => {
          const barH = maxVal > 0 ? (d.calories / maxVal) * 80 : 0;
          const atGoal = d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1;
          const over = d.calories > goals.calories;
          return (
            <div key={d.date} title={`${d.date}: ${d.calories} kcal`}
              className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <motion.div
                  className={cn('w-full rounded-t-md transition-colors',
                    d.isToday ? 'bg-brand shadow-[0_0_8px_rgba(230,183,95,0.5)]'
                    : over ? 'bg-orange-400/70'
                    : atGoal ? 'bg-green-400/70'
                    : d.calories === 0 ? 'bg-white/5'
                    : 'bg-brand/45'
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${barH}px` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className={cn('text-xs font-semibold', d.isToday ? 'text-brand' : 'text-amber-200/30')}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Goal line label */}
      <div className="flex items-center gap-2 pt-1 border-t border-brand/10">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 border-t border-dashed border-green-400/50" />
          <span className="text-xs text-green-400/60">Goal {goals.calories} kcal</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="w-2 h-2 rounded-sm bg-brand" />
          <span className="text-xs text-amber-200/40">Today</span>
        </div>
      </div>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// Macro Balance Radar Widget
// ---------------------------------------------------------------------------

interface MacroBalanceWidgetProps { days: string[]; className?: string; }

export function MacroBalanceWidget({ days, className }: MacroBalanceWidgetProps) {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const goals = useNutritionStore((s) => s.goals);
  const meals = useMemo(() => getMealsByDateRange(days[0], days[days.length - 1]), [getMealsByDateRange, days]);

  const totals = useMemo(() => ({
    protein: meals.reduce((s, m) => s + m.protein, 0) / days.length,
    carbs:   meals.reduce((s, m) => s + m.carbs,   0) / days.length,
    fat:     meals.reduce((s, m) => s + m.fat,     0) / days.length,
    calories:meals.reduce((s, m) => s + m.calories,0) / days.length,
  }), [meals, days]);

  const macros = [
    { label: 'Protein', val: totals.protein, goal: goals.protein, color: 'text-red-400', bar: 'bg-red-400', unit: 'g' },
    { label: 'Carbs',   val: totals.carbs,   goal: goals.carbs,   color: 'text-yellow-400', bar: 'bg-yellow-400', unit: 'g' },
    { label: 'Fat',     val: totals.fat,     goal: goals.fat,     color: 'text-purple-400', bar: 'bg-purple-400', unit: 'g' },
  ];

  // Calorie split
  const kcalFromP = totals.protein * 4;
  const kcalFromC = totals.carbs * 4;
  const kcalFromF = totals.fat * 9;
  const totalMacroKcal = kcalFromP + kcalFromC + kcalFromF || 1;

  return (
    <WidgetCard className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Salad size={15} className="text-green-400" />
        <span className="text-sm font-bold text-white/85">Macro Balance</span>
        <span className="ml-auto text-xs text-amber-200/35">7-day daily avg</span>
      </div>

      <div className="space-y-2.5">
        {macros.map((m) => {
          const pct = m.goal > 0 ? Math.min(150, (m.val / m.goal) * 100) : 0;
          const over = m.val > m.goal;
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-sm font-semibold', m.color)}>{m.label}</span>
                <span className="text-xs text-amber-200/45">
                  {Math.round(m.val)}<span className="text-white/25">/{m.goal}{m.unit}</span>
                  {over && <span className="text-orange-400 ml-1 text-xs">▲</span>}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', over ? 'bg-orange-400' : m.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Calorie split pie visual (simple segmented bar) */}
      <div>
        <p className="text-xs text-amber-200/35 mb-1.5">Calorie split</p>
        <div className="h-3 rounded-full overflow-hidden flex gap-px">
          <div className="bg-red-400/80 h-full transition-all" style={{ width: `${(kcalFromP / totalMacroKcal) * 100}%` }} title={`Protein ${Math.round((kcalFromP/totalMacroKcal)*100)}%`} />
          <div className="bg-yellow-400/80 h-full transition-all" style={{ width: `${(kcalFromC / totalMacroKcal) * 100}%` }} title={`Carbs ${Math.round((kcalFromC/totalMacroKcal)*100)}%`} />
          <div className="bg-purple-400/80 h-full transition-all" style={{ width: `${(kcalFromF / totalMacroKcal) * 100}%` }} title={`Fat ${Math.round((kcalFromF/totalMacroKcal)*100)}%`} />
        </div>
        <div className="flex gap-3 mt-1.5">
          {[
            { label: 'P', pct: Math.round((kcalFromP / totalMacroKcal) * 100), col: 'bg-red-400', text: 'text-red-400/70' },
            { label: 'C', pct: Math.round((kcalFromC / totalMacroKcal) * 100), col: 'bg-yellow-400', text: 'text-yellow-400/70' },
            { label: 'F', pct: Math.round((kcalFromF / totalMacroKcal) * 100), col: 'bg-purple-400', text: 'text-purple-400/70' },
          ].map(({ label, pct, col, text }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={cn('w-2 h-2 rounded-sm', col)} />
              <span className={cn('text-xs', text)}>{label} {pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
