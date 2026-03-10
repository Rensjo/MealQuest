// ============================================================================
// MealQuest — Meal Log Store
// ============================================================================
// Manages all logged meals and food entries.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { MealEntry, FoodItem, MealType } from '@/types';
import { calculateMealXP } from '@/utils/gamification';
import { isLiquidLog } from '@/utils';
import { useXPStore } from './xpStore';
import { useStreakStore } from './streakStore';
import { useQuestStore } from './questStore';
import { useNotificationStore } from './notificationStore';
import { useBadgeStore } from './badgeStore';
import { useSettingsStore } from './settingsStore';
import { useNutritionStore } from './nutritionStore';

interface MealLogState {
  meals: MealEntry[];
}

interface MealLogActions {
  addMeal: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => MealEntry;
  updateMeal: (id: string, updates: Partial<MealEntry>) => void;
  deleteMeal: (id: string) => void;
  getMealsByDate: (date: string) => MealEntry[];
  getMealsByDateRange: (start: string, end: string) => MealEntry[];
  getMealsByType: (date: string, type: MealType) => MealEntry[];
  getDailyTotals: (date: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    mealsLogged: number;
  };
  reset: () => void;
}

const initialState: MealLogState = {
  meals: [],
};

export const useMealLogStore = create<MealLogState & MealLogActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addMeal: (mealData) => {
        const meal: MealEntry = {
          ...mealData,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ meals: [meal, ...state.meals] }));

        // === Gamification side-effects ===
        const dietStrategy = useSettingsStore.getState().dietStrategy;
        const allStreaks = useStreakStore.getState().getAllStreaks();
        const activeStreakCount = allStreaks.filter((s) => s.current > 0).length;

        // Check goals for bonus XP
        const goals = useNutritionStore.getState().goals;
        const dailyTotals = get().getMealsByDate(meal.date);
        const totalProtein = dailyTotals.reduce((s, m) => s + m.protein, 0);
        const totalWater = dailyTotals.reduce((s, m) => s + m.water, 0);

        const xpResult = calculateMealXP(
          meal.mealType,
          meal.isBalanced,
          meal.isHomeCooked,
          totalProtein >= goals.protein,
          totalWater >= goals.water,
          dietStrategy,
          activeStreakCount,
        );

        const { awardXP } = useXPStore.getState();
        const { leveledUp, newLevel } = awardXP(xpResult.total, 'meal-log', meal.mealType);

        // Streak – breakfast check-in counts as the daily meal streak
        if (meal.mealType === 'breakfast') {
          useStreakStore.getState().checkIn('breakfast');
        }
        if (meal.isHomeCooked) {
          useStreakStore.getState().checkIn('home-cooked');
        }
        // Hydration streak – check-in when water goal met
        if (totalWater >= goals.water && goals.water > 0) {
          useStreakStore.getState().checkIn('hydration');
        }

        // Auto-complete matching daily quests
        const triggerMap: Record<MealType, string> = {
          breakfast: 'log-breakfast',
          lunch:     'log-lunch',
          dinner:    'log-dinner',
          snack:     'log-snack',
        };
        const questStore = useQuestStore.getState();
        const questResult = questStore.autoCompleteByTrigger(triggerMap[meal.mealType]);
        if (meal.isHomeCooked) {
          questStore.autoCompleteByTrigger('log-home-cooked');
        }
        // Water quest triggers
        if (totalWater >= 500)  questStore.autoCompleteByTrigger('log-water-500ml');
        if (totalWater >= 2000) questStore.autoCompleteByTrigger('log-water-2l');

        // Push activity notification
        const mealLabel: Record<MealType, string> = {
          breakfast: 'Breakfast',
          lunch:     'Lunch',
          dinner:    'Dinner',
          snack:     'Snack',
        };
        const push = useNotificationStore.getState().push;
        push({
          message: questResult.titles.length > 0
            ? `${mealLabel[meal.mealType]} logged & quest completed!`
            : `${mealLabel[meal.mealType]} logged`,
          xp: xpResult.total,
          tone: 'meal',
        });

        if (leveledUp) {
          push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
        }

        // Badge tracking
        useBadgeStore.getState().incrementMeals(meal.isHomeCooked);

        return meal;
      },

      updateMeal: (id, updates) =>
        set((state) => ({
          meals: state.meals.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      deleteMeal: (id) =>
        set((state) => ({
          meals: state.meals.filter((m) => m.id !== id),
        })),

      getMealsByDate: (date) => get().meals.filter((m) => m.date === date),

      getMealsByDateRange: (start, end) =>
        get().meals.filter((m) => m.date >= start && m.date <= end),

      getMealsByType: (date, type) =>
        get().meals.filter((m) => m.date === date && m.mealType === type),

      getDailyTotals: (date) => {
        const meals = get().getMealsByDate(date);
        return {
          calories: meals.reduce((sum, m) => sum + m.calories, 0),
          protein: meals.reduce((sum, m) => sum + m.protein, 0),
          carbs: meals.reduce((sum, m) => sum + m.carbs, 0),
          fat: meals.reduce((sum, m) => sum + m.fat, 0),
          water: meals.reduce((sum, m) => sum + m.water, 0),
          mealsLogged: meals.filter((m) => !isLiquidLog(m)).length,
        };
      },

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-meallog',
      version: 1,
    }
  )
);
