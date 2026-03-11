// ============================================================================
// MealQuest — Quick Meal Log Widget
// ============================================================================
// FinanceQuest-style "Quick Add" form for rapid meal logging.
// Autocomplete food name → auto-estimate macros → one-click log.

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { soundManager } from '../../services/soundManager';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Zap,
  CheckCircle,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Loader2,
} from 'lucide-react';
import { cn, isLiquidLog } from '@/utils';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useNutritionTracker } from '@/hooks';
import { suggestFoods, estimateNutrition, applyPortion } from '@/utils/foodDatabase';
import { searchFoodOnline } from '@/services/foodApiService';
import { todayISO } from '@/utils/date';
import type { MealType, FoodSource } from '@/types';
import { MEAL_TYPES, FOOD_SOURCES } from '@/types';
import type { FoodEstimate } from '@/utils/foodDatabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const PORTION_SIZES = ['small', 'medium', 'large', 'extra large'] as const;
type PortionSize = (typeof PORTION_SIZES)[number];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
};

const FOOD_SOURCE_META: Record<FoodSource, { label: string; emoji: string; color: string; border: string; active: string }> = {
  'home-cooked':  { label: 'Home', emoji: '🍳', color: 'text-green-400',  border: 'border-green-500/25', active: 'bg-green-500/15 border-green-500/45 text-green-300' },
  'fast-food':    { label: 'Fast Food', emoji: '🍔', color: 'text-orange-400', border: 'border-orange-500/25', active: 'bg-orange-500/15 border-orange-500/45 text-orange-300' },
  'dine-out':     { label: 'Dine Out', emoji: '🍽️', color: 'text-blue-400',   border: 'border-blue-500/25',   active: 'bg-blue-500/15 border-blue-500/40 text-blue-300'   },
  'street-food':  { label: 'Street', emoji: '🌮', color: 'text-yellow-400', border: 'border-yellow-500/25', active: 'bg-yellow-500/15 border-yellow-500/45 text-yellow-300' },
  'processed':    { label: 'Processed', emoji: '📦', color: 'text-red-400',    border: 'border-red-500/25',    active: 'bg-red-500/15 border-red-500/45 text-red-300'   },
};

// XP awarded per meal (matches gamification logic baseline)
const MEAL_XP_PREVIEW: Record<MealType, number> = {
  breakfast: 20,
  lunch: 15,
  dinner: 15,
  snack: 10,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickMealLog({ className }: { className?: string } = {}) {
  const { logMeal } = useNutritionTracker();
  const getMealsByDate = useMealLogStore((s) => s.getMealsByDate);
  const meals = useMealLogStore((s) => s.meals); // subscribe so memo recomputes on any meal change
  const today = todayISO();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayMeals = useMemo(() => getMealsByDate(today).filter((m) => !isLiquidLog(m)), [getMealsByDate, today, meals]);

  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState<PortionSize>('medium');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [foodSource, setFoodSource] = useState<FoodSource>('home-cooked');
  const [suggestions, setSuggestions] = useState<FoodEstimate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [estimated, setEstimated] = useState<FoodEstimate | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [loggedFeedback, setLoggedFeedback] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const apiAbortRef = useRef<AbortController | null>(null);

  // Auto-set meal type based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setMealType('breakfast');
    else if (hour < 15) setMealType('lunch');
    else if (hour < 20) setMealType('dinner');
    else setMealType('snack');
  }, []);

  // Update suggestions as user types.
  // Local DB is checked instantly; if fewer than 3 results and query >= 3 chars,
  // USDA FoodData Central is queried after a 450 ms debounce.
  useEffect(() => {
    setEstimated(null);

    if (foodName.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingApi(false);
      return;
    }

    const local = suggestFoods(foodName, 6);
    setSuggestions(local);
    setShowSuggestions(local.length > 0);

    if (local.length >= 3 || foodName.length < 3) {
      setIsLoadingApi(false);
      return;
    }

    // Trigger online search for obscure / non-Filipino foods
    setIsLoadingApi(true);
    let cancelled = false;
    const controller = new AbortController();
    apiAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const apiResults = await searchFoodOnline(foodName, controller.signal);
        if (!cancelled) {
          const localNames = new Set(local.map((f) => f.name));
          const merged = [
            ...local,
            ...apiResults.filter((r) => !localNames.has(r.name)),
          ];
          setSuggestions(merged.slice(0, 8));
          setShowSuggestions(merged.length > 0);
          setIsLoadingApi(false);
        }
      } catch {
        if (!cancelled) setIsLoadingApi(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
      setIsLoadingApi(false);
    };
  }, [foodName]);

  // Re-estimate when portion changes (if food was already set)
  useEffect(() => {
    if (foodName.trim().length >= 2) {
      const est = estimateNutrition(foodName, portion);
      if (est) setEstimated(est);
    }
  }, [portion, foodName]);

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = useCallback(
    (food: FoodEstimate) => {
      setFoodName(food.name);
      setShowSuggestions(false);
      setIsLoadingApi(false);
      // For API results, estimateNutrition returns null (not in local DB);
      // fall back to the suggestion's own nutrition scaled for the current portion.
      const est = estimateNutrition(food.name, portion) ?? applyPortion(food, portion);
      setEstimated(est);
      inputRef.current?.focus();
    },
    [portion]
  );

  const handleEstimate = useCallback(() => {
    const est = estimateNutrition(foodName, portion);
    setEstimated(est ?? null);
    if (!est) setEstimated(null);
  }, [foodName, portion]);

  const handleLog = useCallback(async () => {
    if (!foodName.trim()) return;

    const est = estimated ?? estimateNutrition(foodName, portion);

    setIsLogging(true);
    try {
      const foodItem = {
        id: `quick-${Date.now()}`,
        name: est?.name ?? foodName,
        calories: est?.calories ?? 0,
        protein: est?.protein ?? 0,
        carbs: est?.carbs ?? 0,
        fat: est?.fat ?? 0,
        serving: est?.serving ?? portion,
        quantity: 1,
      };

      logMeal({
        date: todayISO(),
        mealType,
        foods: [foodItem],
        calories: foodItem.calories,
        protein: foodItem.protein,
        carbs: foodItem.carbs,
        fat: foodItem.fat,
        water: 0,
        foodSource,
        isHomeCooked: foodSource === 'home-cooked',
        isBalanced: foodItem.protein > 10 && foodSource === 'home-cooked',
      });
      soundManager.playLogged();

      // Reset form
      setFoodName('');
      setEstimated(null);
      setLoggedFeedback(true);
      setTimeout(() => setLoggedFeedback(false), 2500);
    } finally {
      setIsLogging(false);
    }
  }, [foodName, portion, mealType, estimated, logMeal]);

  const canLog = foodName.trim().length >= 2;
  const xpPreview = MEAL_XP_PREVIEW[mealType];

  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-brand/24 bg-[#1a0d00]/88 p-5 backdrop-blur-sm flex flex-col',
        className,
      )}
      onMouseEnter={() => soundManager.playHover()}
      whileHover={{ boxShadow: '0 0 44px rgba(230,183,95,0.34), 0 8px 32px rgba(0,0,0,0.50)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/18 text-brand shadow-[0_0_12px_rgba(230,183,95,0.18)] border border-brand/25">
            <Utensils size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">Quick Meal Log</h3>
            <p className="text-xs text-amber-200/40">Log a meal in seconds</p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.06, boxShadow: '0 0 16px rgba(230,183,95,0.30)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
          className="flex items-center gap-1.5 rounded-xl border border-brand/28 bg-brand/10 px-3 py-1.5 cursor-default"
        >
          <Zap size={12} className="text-brand" />
          <span className="text-sm font-bold text-brand">+{xpPreview} XP</span>
        </motion.div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        {/* Row 1: Food name — full width */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="What did you eat? (e.g. chicken rice)"
            className={cn(
              'w-full rounded-xl border bg-[#1a0d00]/60 px-3 py-2.5 text-sm text-white',
              'placeholder:text-amber-200/28',
              'border-brand/20 focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/18',
              'transition-all duration-200'
            )}
          />

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {(showSuggestions || (isLoadingApi && foodName.length >= 3)) && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-brand/22 bg-[#1a0d00]/98 shadow-[0_8px_32px_rgba(0,0,0,0.65)] backdrop-blur-md"
              >
                {suggestions.map((food) => (
                  <button
                    key={food.name}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(food);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm hover:bg-brand/10 transition-colors duration-100 group"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="capitalize text-amber-100/80 group-hover:text-white transition-colors">{food.name}</span>
                      {food.fromApi && (
                        <span className="text-[9px] rounded px-1 py-0.5 bg-blue-500/12 text-blue-400/70 border border-blue-500/20 leading-none">
                          online
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-amber-200/40 group-hover:text-amber-200/60 transition-colors">
                      {food.calories} kcal · {food.serving}
                    </span>
                  </button>
                ))}
                {isLoadingApi && suggestions.length === 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-amber-200/40">
                    <Loader2 size={12} className="animate-spin" />
                    Searching food database…
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 2: Meal type pills (left) │ Portion pills (right) — all in one row */}
        <div className="flex items-stretch gap-2">
          {/* Meal type — 4 pill buttons, each flex-1 */}
          <div className="flex gap-1 flex-1 min-w-0">
            {MEAL_TYPES.map((type) => (
              <motion.button
                key={type}
                onClick={() => setMealType(type)}
                whileHover={{ scale: 1.04, boxShadow: mealType === type ? '0 0 14px rgba(230,183,95,0.38)' : '0 0 8px rgba(230,183,95,0.14)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl border py-2 px-1 text-xs font-semibold transition-all duration-200',
                  mealType === type
                    ? 'border-brand/52 bg-brand/18 text-brand shadow-[0_0_12px_rgba(230,183,95,0.22)]'
                    : 'border-brand/14 bg-[#1a0d00]/40 text-amber-200/42 hover:border-brand/30 hover:bg-brand/8 hover:text-amber-200/70',
                )}
              >
                <span className="text-base leading-none">{MEAL_TYPE_LABELS[type].split(' ')[0]}</span>
                <span className="text-[11px] capitalize leading-none">{type}</span>
              </motion.button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px bg-brand/16 self-stretch flex-shrink-0" />

          {/* Portion — S / M / L / XL pills */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <span className="text-[11px] text-amber-200/32 text-center font-semibold tracking-wide">Portion</span>
            <div className="flex gap-1">
              {PORTION_SIZES.map((p) => (
                <motion.button
                  key={p}
                  onClick={() => setPortion(p)}
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ scale: 1.06, boxShadow: portion === p ? '0 0 12px rgba(230,183,95,0.40)' : '0 0 6px rgba(230,183,95,0.15)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                  className={cn(
                    'w-9 rounded-lg border py-1.5 text-xs font-bold transition-all duration-200',
                    portion === p
                      ? 'border-brand/50 bg-brand/18 text-brand shadow-[0_0_8px_rgba(230,183,95,0.22)]'
                      : 'border-brand/12 bg-transparent text-amber-200/35 hover:border-brand/28 hover:text-amber-200/60',
                  )}
                >
                  {p === 'small' ? 'S' : p === 'medium' ? 'M' : p === 'large' ? 'L' : 'XL'}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Food source — enhanced themed pills */}
        <div className="rounded-xl border border-brand/14 bg-[#1a0d00]/40 p-2.5">
          <p className="text-[11px] text-amber-200/32 font-semibold mb-2 uppercase tracking-wider">Food Source</p>
          <div className="flex gap-1.5 flex-wrap">
            {FOOD_SOURCES.map((src) => {
              const m = FOOD_SOURCE_META[src];
              const active = foodSource === src;
              return (
                <motion.button
                  key={src}
                  onClick={() => setFoodSource(src)}
                  whileHover={{ scale: 1.05, boxShadow: active ? '0 0 14px rgba(230,183,95,0.28)' : '0 0 8px rgba(230,183,95,0.10)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                    active ? m.active : `${m.border} bg-[#1a0d00]/30 text-amber-200/38 hover:text-amber-200/65 hover:bg-brand/5`,
                  )}
                >
                  <span className="text-sm leading-none">{m.emoji}</span>
                  {m.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Estimated Macros Preview */}
        <AnimatePresence>
          {estimated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-brand/18 bg-[#1a0d00]/60 px-3.5 py-2.5 shadow-[0_0_10px_rgba(230,183,95,0.06)]">
                <span className="text-xs text-amber-200/40 mr-0.5">Est.</span>
                <MacroPill icon={<Flame size={10} />} label="Cal" value={`${estimated.calories}`} color="text-brand" />
                <MacroPill icon={<Beef size={10} />} label="Prot" value={`${estimated.protein}g`} color="text-red-400" />
                <MacroPill icon={<Wheat size={10} />} label="Carbs" value={`${estimated.carbs}g`} color="text-yellow-400" />
                <MacroPill icon={<Droplets size={10} />} label="Fat" value={`${estimated.fat}g`} color="text-purple-400" />
                <span className="ml-auto text-xs capitalize text-amber-200/35">
                  {estimated.serving}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Row */}
        <div className="flex items-center gap-2">
          {/* Estimate button */}
          <motion.button
            onClick={() => { soundManager.playClick(); handleEstimate(); }}
            disabled={!canLog}
            whileHover={canLog ? { scale: 1.03 } : {}}
            whileTap={canLog ? { scale: 0.97 } : {}}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            className={cn(
              'rounded-xl border px-3.5 py-2 text-sm font-medium',
              'transition-all duration-200',
              canLog
                ? 'border-brand/25 bg-brand/8 text-brand hover:border-brand/45 hover:bg-brand/15 hover:shadow-[0_0_10px_rgba(230,183,95,0.14)]'
                : 'border-brand/10 bg-transparent text-amber-200/25 cursor-not-allowed'
            )}
          >
            {estimated ? 'Re-estimate' : 'Estimate Macros'}
          </motion.button>

          {/* Log Meal button */}
          <motion.button
            onClick={() => { soundManager.playClick(); handleLog(); }}
            disabled={!canLog || isLogging}
            whileHover={canLog ? { scale: 1.03, boxShadow: '0 0 20px rgba(230,183,95,0.40)' } : {}}
            whileTap={canLog ? { scale: 0.97 } : {}}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            className={cn(
              'ml-auto flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all duration-200',
              canLog
                ? 'bg-gradient-to-r from-brand to-amber-400 text-neutral-950 shadow-[0_0_14px_rgba(230,183,95,0.28)]'
                : 'cursor-not-allowed bg-brand/10 border border-brand/12 text-amber-200/25'
            )}
          >
            {loggedFeedback ? (
              <>
                <CheckCircle size={14} className="text-green-900" />
                Logged!
              </>
            ) : (
              <>
                <Zap size={14} />
                Log Meal
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Today's Meals — Scrollable Log */}
      <div className="mt-4 pt-4 border-t border-brand/14 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold text-white/65 uppercase tracking-wider">Today's Log</span>
          <span className="text-xs text-amber-200/38 font-medium">
            {todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''} logged
          </span>
        </div>
        <div className="overflow-y-auto flex-1 min-h-[120px] space-y-1.5 pr-0.5
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand/20 hover:scrollbar-thumb-brand/38">
          {todayMeals.length === 0 ? (
            <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-brand/18">
              <p className="text-sm text-white/22 italic">No meals logged today yet</p>
            </div>
          ) : (
            [...todayMeals].reverse().map((meal) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 rounded-xl border border-brand/16 bg-brand/6 px-3 py-2 hover:bg-brand/12 hover:border-brand/28 hover:shadow-[0_0_8px_rgba(230,183,95,0.08)] transition-all duration-200"
              >
                <span className="text-base flex-shrink-0">
                  {meal.mealType === 'breakfast' ? '\u{1F305}'
                    : meal.mealType === 'lunch' ? '\u2600\uFE0F'
                    : meal.mealType === 'dinner' ? '\u{1F319}' : '\u{1F34E}'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">
                    {meal.foods.map((f) => f.name).join(', ')}
                  </p>
                  <p className="text-xs text-amber-200/38 capitalize">
                    {meal.mealType}
                    {meal.foodSource && ` · ${FOOD_SOURCE_META[meal.foodSource]?.emoji ?? ''} ${FOOD_SOURCE_META[meal.foodSource]?.label ?? meal.foodSource}`}
                  </p>
                </div>
                {meal.calories > 0 && (
                  <span className="text-xs font-bold text-brand flex-shrink-0">
                    {meal.calories} kcal
                  </span>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Macro Pill — tiny colored stat chip
// ---------------------------------------------------------------------------

interface MacroPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function MacroPill({ icon, label, value, color }: MacroPillProps) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn('flex items-center gap-0.5', color)}>
        {icon}
        <span className="text-xs font-medium text-amber-200/45">{label}</span>
      </span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
