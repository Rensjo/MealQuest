// ============================================================================
// MealQuest — Nutrition Store
// ============================================================================
// Manages daily nutrition tracking, goals, and daily summaries.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NutritionGoal, DailyNutritionSummary } from '@/types';

interface NutritionState {
  goals: NutritionGoal;
  dailySummaries: Record<string, DailyNutritionSummary>;
}

interface NutritionActions {
  setGoals: (goals: NutritionGoal) => void;
  updateDailySummary: (date: string, summary: Partial<DailyNutritionSummary>) => void;
  getDailySummary: (date: string) => DailyNutritionSummary;
  getGoalProgress: (date: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  reset: () => void;
}

const DEFAULT_GOALS: NutritionGoal = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  water: 2500,
};

const EMPTY_SUMMARY: DailyNutritionSummary = {
  date: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  water: 0,
  mealsLogged: 0,
  xpEarned: 0,
};

const initialState: NutritionState = {
  goals: DEFAULT_GOALS,
  dailySummaries: {},
};

export const useNutritionStore = create<NutritionState & NutritionActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGoals: (goals) => set({ goals }),

      updateDailySummary: (date, partial) =>
        set((state) => ({
          dailySummaries: {
            ...state.dailySummaries,
            [date]: {
              ...EMPTY_SUMMARY,
              ...state.dailySummaries[date],
              ...partial,
              date,
            },
          },
        })),

      getDailySummary: (date) => {
        const summary = get().dailySummaries[date];
        return summary ?? { ...EMPTY_SUMMARY, date };
      },

      getGoalProgress: (date) => {
        const summary = get().getDailySummary(date);
        const goals = get().goals;
        return {
          calories: goals.calories > 0 ? (summary.calories / goals.calories) * 100 : 0,
          protein: goals.protein > 0 ? (summary.protein / goals.protein) * 100 : 0,
          carbs: goals.carbs > 0 ? (summary.carbs / goals.carbs) * 100 : 0,
          fat: goals.fat > 0 ? (summary.fat / goals.fat) * 100 : 0,
          water: goals.water > 0 ? (summary.water / goals.water) * 100 : 0,
        };
      },

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-nutrition',
      version: 1,
    }
  )
);
