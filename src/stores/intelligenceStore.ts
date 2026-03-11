// ============================================================================
// MealQuest — Intelligence Store (Phase 3)
// ============================================================================
// Central Zustand store for all Phase 3 intelligent systems state:
// insights, habit patterns, nutrition scores, meal suggestions,
// grocery predictions, and smart notifications.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  NutritionInsight,
  HabitPattern,
  DailyNutritionScore,
  MealSuggestion,
  GroceryPrediction,
  SmartNotification,
  MonthlyTrend,
} from '@/types';
import { generateWeeklyInsights, detectHabitPatterns } from '@/services/insightEngine';
import { generateMealSuggestions, suggestFromPantry } from '@/services/mealSuggestionEngine';
import { predictGroceryNeeds } from '@/services/groceryPredictor';
import { calculateDailyScore, calculateAverageScore } from '@/services/nutritionScore';
import { checkSmartNotifications } from '@/services/notificationScheduler';
import { useMealLogStore } from './mealLogStore';
import { useNutritionStore } from './nutritionStore';
import { useSettingsStore } from './settingsStore';
import { usePantryStore } from './pantryStore';
import { useRecipeStore } from './recipeStore';
import { useGroceryStore } from './groceryStore';
import { todayISO, getLast7Days, getLast30Days, daysAgoISO } from '@/utils/date';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface IntelligenceState {
  // Weekly insights
  insights: NutritionInsight[];
  lastInsightRefresh: string;

  // Habit patterns
  habitPatterns: HabitPattern[];
  lastPatternRefresh: string;

  // Daily nutrition scores
  dailyScores: Record<string, DailyNutritionScore>;

  // Suggestions cache
  mealSuggestions: MealSuggestion[];
  lastSuggestionRefresh: string;

  // Grocery predictions cache
  groceryPredictions: GroceryPrediction[];
  lastGroceryPredictionRefresh: string;

  // Smart notifications (dismissed state persisted)
  smartNotifications: SmartNotification[];

  // Monthly trends
  monthlyTrends: MonthlyTrend[];

  // Adaptive quest tracking
  questCompletionHistory: Record<string, number>; // questCategory → completion count
}

interface IntelligenceActions {
  refreshInsights: () => NutritionInsight[];
  refreshHabitPatterns: () => HabitPattern[];
  refreshDailyScore: (date?: string) => DailyNutritionScore;
  refreshMealSuggestions: () => MealSuggestion[];
  refreshGroceryPredictions: () => GroceryPrediction[];
  checkNotifications: () => SmartNotification[];
  dismissSmartNotification: (id: string) => void;
  refreshMonthlyTrends: () => void;
  trackQuestCompletion: (category: string) => void;
  getQuestCompletionRate: (category: string) => number;
  getWeekScores: () => DailyNutritionScore[];
  reset: () => void;
}

const initialState: IntelligenceState = {
  insights: [],
  lastInsightRefresh: '',
  habitPatterns: [],
  lastPatternRefresh: '',
  dailyScores: {},
  mealSuggestions: [],
  lastSuggestionRefresh: '',
  groceryPredictions: [],
  lastGroceryPredictionRefresh: '',
  smartNotifications: [],
  monthlyTrends: [],
  questCompletionHistory: {},
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useIntelligenceStore = create<IntelligenceState & IntelligenceActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      refreshInsights: () => {
        const meals = useMealLogStore.getState().meals;
        const goals = useNutritionStore.getState().goals;
        const today = todayISO();
        const last7 = getLast7Days();
        const prev7Start = daysAgoISO(14);

        const thisWeekMeals = meals.filter(m => last7.includes(m.date));
        const prevWeekMeals = meals.filter(m => m.date >= prev7Start && !last7.includes(m.date));

        const insights = generateWeeklyInsights({
          meals: thisWeekMeals,
          goals,
          previousWeekMeals: prevWeekMeals,
        });

        set({ insights, lastInsightRefresh: today });
        return insights;
      },

      refreshHabitPatterns: () => {
        const meals = useMealLogStore.getState().meals;
        const today = todayISO();
        const cutoff = daysAgoISO(14);
        const recentMeals = meals.filter(m => m.date >= cutoff);

        const patterns = detectHabitPatterns(recentMeals, 14);
        set({ habitPatterns: patterns, lastPatternRefresh: today });
        return patterns;
      },

      refreshDailyScore: (date?: string) => {
        const d = date ?? todayISO();
        const meals = useMealLogStore.getState().meals;
        const goals = useNutritionStore.getState().goals;
        const score = calculateDailyScore(meals, goals, d);

        set(state => ({
          dailyScores: { ...state.dailyScores, [d]: score },
        }));
        return score;
      },

      refreshMealSuggestions: () => {
        const settings = useSettingsStore.getState();
        const meals = useMealLogStore.getState().meals;
        const pantryItems = usePantryStore.getState().items;
        const recipes = useRecipeStore.getState().recipes;

        const suggestions = generateMealSuggestions({
          dietStrategy: settings.dietStrategy,
          recentMeals: meals.slice(0, 30),
          pantryItems,
          recipes,
          limit: 6,
        });

        set({ mealSuggestions: suggestions, lastSuggestionRefresh: todayISO() });
        return suggestions;
      },

      refreshGroceryPredictions: () => {
        const meals = useMealLogStore.getState().meals;
        const pantryItems = usePantryStore.getState().items;
        const recipes = useRecipeStore.getState().recipes;

        const predictions = predictGroceryNeeds({
          meals,
          pantryItems,
          recipes,
          daysToAnalyse: 14,
          limit: 10,
        });

        set({ groceryPredictions: predictions, lastGroceryPredictionRefresh: todayISO() });
        return predictions;
      },

      checkNotifications: () => {
        const meals = useMealLogStore.getState().meals;
        const goals = useNutritionStore.getState().goals;
        const pantryItems = usePantryStore.getState().items;
        const grocery = useGroceryStore.getState();
        const today = todayISO();
        const todayMeals = meals.filter(m => m.date === today);

        const notifications = checkSmartNotifications({
          todayMeals,
          waterGoal: goals.water,
          pantryItems,
          groceryItems: grocery.items,
          groceryNextDate: grocery.schedule.nextDate,
        });

        if (notifications.length > 0) {
          set(state => ({
            smartNotifications: [
              ...notifications,
              ...state.smartNotifications.slice(0, 20),
            ],
          }));
        }

        return notifications;
      },

      dismissSmartNotification: (id) => {
        set(state => ({
          smartNotifications: state.smartNotifications.map(n =>
            n.id === id ? { ...n, dismissed: true } : n
          ),
        }));
      },

      refreshMonthlyTrends: () => {
        const meals = useMealLogStore.getState().meals;
        const goals = useNutritionStore.getState().goals;

        // Group meals by month
        const byMonth = new Map<string, typeof meals>();
        for (const m of meals) {
          const month = m.date.substring(0, 7); // YYYY-MM
          const arr = byMonth.get(month) ?? [];
          arr.push(m);
          byMonth.set(month, arr);
        }

        const trends: MonthlyTrend[] = [];
        for (const [month, monthMeals] of byMonth) {
          const byDate = new Map<string, typeof meals>();
          for (const m of monthMeals) {
            (byDate.get(m.date) ?? (() => { const a: typeof meals = []; byDate.set(m.date, a); return a; })()).push(m);
          }
          const days = byDate.size;
          const daysInMonth = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate();

          const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
          for (const [, dayMeals] of byDate) {
            for (const m of dayMeals) {
              totals.calories += m.calories;
              totals.protein += m.protein;
              totals.carbs += m.carbs;
              totals.fat += m.fat;
              totals.water += m.water;
            }
          }

          const avgScore = calculateAverageScore(monthMeals, goals, [...byDate.keys()]);

          trends.push({
            month,
            avgCalories: days > 0 ? Math.round(totals.calories / days) : 0,
            avgProtein: days > 0 ? Math.round(totals.protein / days) : 0,
            avgCarbs: days > 0 ? Math.round(totals.carbs / days) : 0,
            avgFat: days > 0 ? Math.round(totals.fat / days) : 0,
            avgWater: days > 0 ? Math.round(totals.water / days) : 0,
            avgScore,
            totalMeals: monthMeals.length,
            consistency: Math.round((days / daysInMonth) * 100),
          });
        }

        // Sort newest first
        trends.sort((a, b) => b.month.localeCompare(a.month));
        set({ monthlyTrends: trends });
      },

      trackQuestCompletion: (category) => {
        set(state => ({
          questCompletionHistory: {
            ...state.questCompletionHistory,
            [category]: (state.questCompletionHistory[category] ?? 0) + 1,
          },
        }));
      },

      getQuestCompletionRate: (category) => {
        return get().questCompletionHistory[category] ?? 0;
      },

      getWeekScores: () => {
        const scores = get().dailyScores;
        const last7 = getLast7Days();
        return last7
          .map(d => scores[d])
          .filter(Boolean);
      },

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-intelligence',
      version: 1,
    },
  ),
);
