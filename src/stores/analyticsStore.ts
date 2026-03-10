// ============================================================================
// MealQuest — Analytics Store
// ============================================================================
// Aggregates data across stores for analytics and weekly review.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeeklyReviewData } from '@/types';

interface AnalyticsState {
  weeklyReviews: WeeklyReviewData[];
  cachedChartData: {
    dailyCalories: { date: string; value: number }[];
    dailyProtein: { date: string; value: number }[];
    dailyWater: { date: string; value: number }[];
    macroDistribution: { name: string; value: number }[];
  };
}

interface AnalyticsActions {
  addWeeklyReview: (review: WeeklyReviewData) => void;
  updateChartData: (data: Partial<AnalyticsState['cachedChartData']>) => void;
  getWeeklyReview: (weekStart: string) => WeeklyReviewData | undefined;
  getRecentReviews: (count?: number) => WeeklyReviewData[];
  reset: () => void;
}

const initialState: AnalyticsState = {
  weeklyReviews: [],
  cachedChartData: {
    dailyCalories: [],
    dailyProtein: [],
    dailyWater: [],
    macroDistribution: [],
  },
};

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addWeeklyReview: (review) =>
        set((state) => ({
          weeklyReviews: [review, ...state.weeklyReviews],
        })),

      updateChartData: (data) =>
        set((state) => ({
          cachedChartData: { ...state.cachedChartData, ...data },
        })),

      getWeeklyReview: (weekStart) =>
        get().weeklyReviews.find((r) => r.weekStart === weekStart),

      getRecentReviews: (count = 4) => get().weeklyReviews.slice(0, count),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-analytics',
      version: 1,
    }
  )
);
