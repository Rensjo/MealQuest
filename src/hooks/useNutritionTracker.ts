// ============================================================================
// MealQuest — useNutritionTracker Hook
// ============================================================================
// Convenience hook that combines meal logging with nutrition summary updates.
// XP awards, streaks, quest triggers, and notifications are handled inside
// mealLogStore.addMeal() to avoid double-counting.

import { useCallback } from 'react';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { MealEntry } from '@/types';

export function useNutritionTracker() {
  const addMeal = useMealLogStore((s) => s.addMeal);
  const getDailyTotals = useMealLogStore((s) => s.getDailyTotals);
  const updateDailySummary = useNutritionStore((s) => s.updateDailySummary);

  const logMeal = useCallback(
    (mealData: Omit<MealEntry, 'id' | 'createdAt'>) => {
      // 1. Add the meal (XP, streaks, quests handled inside addMeal)
      const meal = addMeal(mealData);

      // 2. Recalculate daily totals for the nutrition summary
      const totals = getDailyTotals(meal.date);
      updateDailySummary(meal.date, {
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        water: totals.water,
        mealsLogged: totals.mealsLogged,
      });

      return { meal };
    },
    [addMeal, getDailyTotals, updateDailySummary]
  );

  return { logMeal };
}
