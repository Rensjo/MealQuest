// ============================================================================
// MealQuest — Meal Log Page (Auto-Estimation)
// ============================================================================
// Simplified meal logging: type a food name + pick a portion → auto-fill
// nutrition estimates from the food database. Manual override always available.

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  UtensilsCrossed,
  Search,
  Calendar,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Wand2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  Beef,
  Wheat,
  CircleDot,
  Droplets,
  Filter,
} from 'lucide-react';
import { SectionCard, Button, EmptyState, Badge, Modal, Input, Select } from '@/components/ui';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useNutritionTracker } from '@/hooks/useNutritionTracker';
import { todayISO, formatDate } from '@/utils/date';
import { formatCalories, formatGrams, cn } from '@/utils';
import { pageVariants } from '@/utils/animations';
import { suggestFoods, estimateNutrition } from '@/utils/foodDatabase';
import { soundManager } from '@/services/soundManager';
import type { MealType } from '@/types';

type PortionSize = 'small' | 'medium' | 'large' | 'extra-large';

const PORTION_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
];

const MEAL_TYPE_ICONS: Record<MealType, React.ReactNode> = {
  breakfast: <Coffee size={16} />,
  lunch: <Sun size={16} />,
  dinner: <Moon size={16} />,
  snack: <Cookie size={16} />,
};

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: 'border-amber-500/20 bg-amber-500/8 text-amber-300',
  lunch: 'border-green-500/20 bg-green-500/8 text-green-300',
  dinner: 'border-blue-500/20 bg-blue-500/8 text-blue-300',
  snack: 'border-purple-500/20 bg-purple-500/8 text-purple-300',
};

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

type FilterType = 'all' | MealType;

function getWeekDays(centerDate: string): string[] {
  const d = new Date(centerDate + 'T00:00:00');
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start);
    dd.setDate(dd.getDate() + i);
    return dd.toISOString().split('T')[0];
  });
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealLog() {
  const meals = useMealLogStore((s) => s.meals);
  const deleteMeal = useMealLogStore((s) => s.deleteMeal);
  const { logMeal } = useNutritionTracker();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Week navigation
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const shiftWeek = (dir: -1 | 1) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Meal counts by date (for week calendar dots)
  const mealCountsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    meals.forEach((m) => { map[m.date] = (map[m.date] || 0) + 1; });
    return map;
  }, [meals]);

  // Form state
  const [formMealType, setFormMealType] = useState<MealType>('lunch');
  const [formFoodName, setFormFoodName] = useState('');
  const [formPortion, setFormPortion] = useState<PortionSize>('medium');
  const [formCalories, setFormCalories] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');
  const [formWater, setFormWater] = useState('');
  const [formHomeCooked, setFormHomeCooked] = useState(false);
  const [formBalanced, setFormBalanced] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-suggest
  const suggestions = useMemo(() => {
    if (formFoodName.length < 2) return [];
    return suggestFoods(formFoodName, 6);
  }, [formFoodName]);

  // Auto-estimate when food name or portion changes
  const autoEstimate = useCallback(() => {
    if (!formFoodName.trim()) return;
    const est = estimateNutrition(formFoodName, formPortion);
    if (est) {
      setFormCalories(String(est.calories));
      setFormProtein(String(est.protein));
      setFormCarbs(String(est.carbs));
      setFormFat(String(est.fat));
    }
  }, [formFoodName, formPortion]);

  const selectSuggestion = (name: string) => {
    setFormFoodName(name);
    setShowSuggestions(false);
    // auto-fill estimation
    const est = estimateNutrition(name, formPortion);
    if (est) {
      setFormCalories(String(est.calories));
      setFormProtein(String(est.protein));
      setFormCarbs(String(est.carbs));
      setFormFat(String(est.fat));
    }
  };

  const filteredMeals = useMemo(() => {
    let filtered = meals.filter((m) => m.date === selectedDate);
    if (mealTypeFilter !== 'all') {
      filtered = filtered.filter((m) => m.mealType === mealTypeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.foods.some((f) => f.name.toLowerCase().includes(q)) ||
          m.mealType.includes(q)
      );
    }
    return filtered;
  }, [meals, selectedDate, searchQuery, mealTypeFilter]);

  // Daily summary totals
  const dailyTotals = useMemo(() => {
    const dayMeals = meals.filter((m) => m.date === selectedDate);
    return {
      calories: dayMeals.reduce((s, m) => s + m.calories, 0),
      protein: dayMeals.reduce((s, m) => s + m.protein, 0),
      carbs: dayMeals.reduce((s, m) => s + m.carbs, 0),
      fat: dayMeals.reduce((s, m) => s + m.fat, 0),
      water: dayMeals.reduce((s, m) => s + (m.water ?? 0), 0),
      count: dayMeals.length,
    };
  }, [meals, selectedDate]);

  // Group meals by type for chronological display
  const groupedByType = useMemo(() => {
    const order: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const map: Partial<Record<MealType, typeof filteredMeals>> = {};
    filteredMeals.forEach((m) => {
      if (!map[m.mealType]) map[m.mealType] = [];
      map[m.mealType]!.push(m);
    });
    return order
      .filter((t) => map[t] && map[t]!.length > 0)
      .map((t) => ({ type: t, meals: map[t]! }));
  }, [filteredMeals]);

  const handleAddMeal = () => {
    const cal = parseFloat(formCalories) || 0;
    const prot = parseFloat(formProtein) || 0;
    const carb = parseFloat(formCarbs) || 0;
    const fat = parseFloat(formFat) || 0;
    const water = parseFloat(formWater) || 0;

    logMeal({
      date: selectedDate,
      mealType: formMealType,
      foods: [
        {
          id: '',
          name: formFoodName || 'Meal',
          calories: cal,
          protein: prot,
          carbs: carb,
          fat,
          serving: formPortion,
          quantity: 1,
        },
      ],
      calories: cal,
      protein: prot,
      carbs: carb,
      fat,
      water,
      foodSource: formHomeCooked ? 'home-cooked' : 'dine-out',
      isHomeCooked: formHomeCooked,
      isBalanced: formBalanced,
    });

    soundManager.playLogged();

    // Reset
    setFormFoodName('');
    setFormPortion('medium');
    setFormCalories('');
    setFormProtein('');
    setFormCarbs('');
    setFormFat('');
    setFormWater('');
    setFormHomeCooked(false);
    setFormBalanced(false);
    setShowManual(false);
    setShowAddModal(false);
  };

  const today = todayISO();

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
        <div>
          <h1 className="text-2xl font-bold text-white">Meal Log</h1>
          <p className="text-sm text-amber-200/40">Track everything you eat</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Meal
        </Button>
      </div>

      {/* Week Calendar Strip */}
      <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { soundManager.playClick(); shiftWeek(-1); }} onMouseEnter={() => soundManager.playHover()} className="rounded-lg p-1.5 text-amber-200/50 hover:bg-brand/10 hover:text-brand transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-brand" />
            <span className="text-sm font-semibold text-white/85">{formatDate(selectedDate)}</span>
            {selectedDate !== today && (
              <button onClick={() => { soundManager.playClick(); setSelectedDate(today); }} onMouseEnter={() => soundManager.playHover()} className="rounded-lg border border-brand/18 bg-brand/8 px-2 py-0.5 text-[10px] font-semibold text-brand hover:bg-brand/14">
                Today
              </button>
            )}
          </div>
          <button onClick={() => { soundManager.playClick(); shiftWeek(1); }} onMouseEnter={() => soundManager.playHover()} className="rounded-lg p-1.5 text-amber-200/50 hover:bg-brand/10 hover:text-brand transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => {
            const isSelected = d === selectedDate;
            const isToday = d === today;
            const count = mealCountsByDate[d] || 0;
            const dayNum = new Date(d + 'T00:00:00').getDate();
            return (
              <button
                key={d}
                onClick={() => { soundManager.playClick(); setSelectedDate(d); }}
                onMouseEnter={() => soundManager.playHover()}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-2 transition-all',
                  isSelected
                    ? 'bg-brand/14 border border-brand/30 shadow-neon'
                    : 'border border-transparent hover:bg-white/4',
                )}
              >
                <span className={cn('text-[10px] uppercase tracking-wider', isSelected ? 'text-brand' : 'text-amber-200/35')}>{DAY_LABELS[i]}</span>
                <span className={cn('text-sm font-bold', isSelected ? 'text-brand' : isToday ? 'text-white' : 'text-white/60')}>{dayNum}</span>
                {count > 0 && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(count, 4) }).map((_, idx) => (
                      <span key={idx} className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-brand' : 'bg-brand/40')} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { icon: <Flame size={13} />, label: 'Cal', value: Math.round(dailyTotals.calories), unit: 'kcal', color: 'text-brand' },
          { icon: <Beef size={13} />, label: 'Protein', value: Math.round(dailyTotals.protein), unit: 'g', color: 'text-red-400' },
          { icon: <Wheat size={13} />, label: 'Carbs', value: Math.round(dailyTotals.carbs), unit: 'g', color: 'text-yellow-400' },
          { icon: <CircleDot size={13} />, label: 'Fat', value: Math.round(dailyTotals.fat), unit: 'g', color: 'text-purple-400' },
          { icon: <Droplets size={13} />, label: 'Water', value: Math.round(dailyTotals.water), unit: 'ml', color: 'text-blue-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
            <div className={cn('flex items-center justify-center gap-1 mb-1', item.color)}>
              {item.icon}
              <span className="text-lg font-black">{item.value}</span>
            </div>
            <p className="text-[10px] text-amber-200/35">{item.label} ({item.unit})</p>
          </div>
        ))}
      </div>

      {/* Filters: Search + Meal Type Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-200/35" />
          <input
            type="text"
            placeholder="Search meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-amber-200/25 focus:border-brand/30 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-1">
          {([{ key: 'all', label: 'All', icon: <Filter size={12} /> }, ...MEAL_TYPE_OPTIONS.map((o) => ({ key: o.value, label: o.label, icon: MEAL_TYPE_ICONS[o.value as MealType] }))] as { key: FilterType; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { soundManager.playClick(); setMealTypeFilter(tab.key); }}
              onMouseEnter={() => soundManager.playHover()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                mealTypeFilter === tab.key
                  ? 'bg-brand/14 text-brand border border-brand/22'
                  : 'text-amber-200/45 hover:text-white/70 border border-transparent'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Cards — Grouped by Type */}
      {filteredMeals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand/16 bg-white/[0.01] py-16">
          <EmptyState
            icon={<UtensilsCrossed size={48} />}
            title="No meals logged"
            description={mealTypeFilter !== 'all' ? `No ${mealTypeFilter} entries for this day` : 'Start tracking your nutrition by adding a meal'}
            action={
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>
                Log Meal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByType.map(({ type, meals: typeMeals }) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold', MEAL_TYPE_COLORS[type])}>
                  {MEAL_TYPE_ICONS[type]}
                  <span className="capitalize">{type}</span>
                </span>
                <span className="text-xs text-amber-200/30">{typeMeals.length} entr{typeMeals.length === 1 ? 'y' : 'ies'}</span>
                <span className="h-px flex-1 bg-brand/8" />
                <span className="text-xs text-amber-200/25">{Math.round(typeMeals.reduce((s, m) => s + m.calories, 0))} kcal</span>
              </div>
              <div className="space-y-2 pl-1 border-l-2 border-brand/10 ml-3">
                {typeMeals.map((meal) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ y: -1, boxShadow: '0 4px 16px rgba(230,183,95,0.10)' }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 ml-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white/90 truncate">
                            {meal.foods.map((f) => f.name).join(', ') || 'Meal'}
                          </p>
                          {meal.isHomeCooked && (
                            <span className="rounded-full border border-green-400/18 bg-green-500/8 px-2 py-0.5 text-[10px] font-semibold text-green-300">Home</span>
                          )}
                          {meal.isBalanced && (
                            <span className="rounded-full border border-brand/18 bg-brand/8 px-2 py-0.5 text-[10px] font-semibold text-brand">Balanced</span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-bold text-brand">{formatCalories(meal.calories)}</span>
                          <span className="text-red-300">{formatGrams(meal.protein)} P</span>
                          <span className="text-yellow-300">{formatGrams(meal.carbs)} C</span>
                          <span className="text-purple-300">{formatGrams(meal.fat)} F</span>
                          {(meal.water ?? 0) > 0 && (
                            <span className="text-blue-300">{meal.water}ml W</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { soundManager.playClick(); deleteMeal(meal.id); }}
                        className="rounded-lg p-2 text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Meal Modal — Simplified with auto-estimation */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Log New Meal">
        <div className="space-y-4">
          <Select
            label="Meal Type"
            options={MEAL_TYPE_OPTIONS}
            value={formMealType}
            onChange={(e) => setFormMealType(e.target.value as MealType)}
          />

          {/* Food Name with autocomplete */}
          <div className="relative">
            <Input
              label="Food Name"
              placeholder="e.g. Grilled Chicken, Rice Bowl..."
              value={formFoodName}
              onChange={(e) => {
                setFormFoodName(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {/* Suggestion dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl"
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.name}
                      onMouseDown={() => selectSuggestion(s.name)}
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-brand/10 hover:text-brand transition-colors"
                    >
                      {s.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Portion & Auto-estimate */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select
                label="Portion Size"
                options={PORTION_OPTIONS}
                value={formPortion}
                onChange={(e) => setFormPortion(e.target.value as PortionSize)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={autoEstimate}
              icon={<Wand2 size={14} />}
              className="shrink-0"
            >
              Estimate
            </Button>
          </div>

          {/* Auto-filled preview */}
          {(formCalories || formProtein || formCarbs || formFat) && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Cal', value: formCalories, color: 'text-brand' },
                { label: 'Prot', value: `${formProtein}g`, color: 'text-red-400' },
                { label: 'Carb', value: `${formCarbs}g`, color: 'text-yellow-400' },
                { label: 'Fat', value: `${formFat}g`, color: 'text-purple-400' },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-2 text-center">
                  <p className={cn('text-sm font-bold', m.color)}>{m.value || '0'}</p>
                  <p className="text-[10px] text-neutral-500">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Manual Override Toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {showManual ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Manual Override
          </button>

          <AnimatePresence>
            {showManual && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Calories" type="number" placeholder="0" value={formCalories} onChange={(e) => setFormCalories(e.target.value)} />
                  <Input label="Protein (g)" type="number" placeholder="0" value={formProtein} onChange={(e) => setFormProtein(e.target.value)} />
                  <Input label="Carbs (g)" type="number" placeholder="0" value={formCarbs} onChange={(e) => setFormCarbs(e.target.value)} />
                  <Input label="Fat (g)" type="number" placeholder="0" value={formFat} onChange={(e) => setFormFat(e.target.value)} />
                </div>
                <Input label="Water (ml)" type="number" placeholder="0" value={formWater} onChange={(e) => setFormWater(e.target.value)} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-amber-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formHomeCooked}
                onChange={(e) => setFormHomeCooked(e.target.checked)}
                className="rounded border-brand/30 bg-white/5 text-brand focus:ring-brand"
              />
              Home Cooked
            </label>
            <label className="flex items-center gap-2 text-sm text-amber-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formBalanced}
                onChange={(e) => setFormBalanced(e.target.checked)}
                className="rounded border-brand/30 bg-white/5 text-brand focus:ring-brand"
              />
              Balanced Meal
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddMeal}>Log Meal</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
