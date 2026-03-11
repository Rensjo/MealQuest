// ============================================================================
// MealQuest — Insight Engine
// ============================================================================
// Analyses eating behaviour to produce weekly insights and detect habit
// patterns. Covers: consistency, macros, hydration, habits, progress.

import { nanoid } from 'nanoid';
import type {
  NutritionInsight,
  HabitPattern,
  MealEntry,
  NutritionGoal,
  DailyNutritionSummary,
} from '@/types';
import { isSweet } from '@/utils/foodDatabase';

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

/**
 * Generate nutrition insights from the last 7 days of meal data.
 */
export function generateWeeklyInsights(params: {
  meals: MealEntry[];
  goals: NutritionGoal;
  previousWeekMeals?: MealEntry[];
}): NutritionInsight[] {
  const { meals, goals, previousWeekMeals = [] } = params;
  const insights: NutritionInsight[] = [];
  const now = new Date().toISOString();

  // Group meals by date
  const byDate = groupByDate(meals);
  const prevByDate = groupByDate(previousWeekMeals);
  const daysWithMeals = Object.keys(byDate).length;

  // 1. Meal consistency
  if (daysWithMeals >= 6) {
    insights.push({
      id: nanoid(), type: 'positive', icon: '📋',
      title: 'Excellent Consistency',
      message: `You logged meals on ${daysWithMeals} out of 7 days this week. Great discipline!`,
      category: 'consistency', generatedAt: now,
    });
  } else if (daysWithMeals <= 3) {
    insights.push({
      id: nanoid(), type: 'warning', icon: '⚠️',
      title: 'Low Logging Activity',
      message: `You only logged meals on ${daysWithMeals} days this week. Try to log daily for better tracking.`,
      category: 'consistency', generatedAt: now,
    });
  }

  // 2. Breakfast consistency
  const breakfastDays = Object.values(byDate).filter(dayMeals =>
    dayMeals.some(m => m.mealType === 'breakfast')
  ).length;
  if (breakfastDays >= 5) {
    insights.push({
      id: nanoid(), type: 'positive', icon: '🌅',
      title: 'Breakfast Champion',
      message: `You logged breakfast consistently this week (${breakfastDays}/7 days).`,
      category: 'consistency', generatedAt: now,
    });
  } else if (breakfastDays <= 2 && daysWithMeals >= 4) {
    insights.push({
      id: nanoid(), type: 'warning', icon: '🌅',
      title: 'Missing Breakfasts',
      message: `You only had breakfast ${breakfastDays} times this week. A good breakfast fuels your day!`,
      category: 'habits', generatedAt: now,
    });
  }

  // 3. Protein comparison with previous week
  const avgProtein = averageMacro(meals, 'protein');
  const prevAvgProtein = averageMacro(previousWeekMeals, 'protein');
  if (prevAvgProtein > 0 && avgProtein > 0) {
    const change = ((avgProtein - prevAvgProtein) / prevAvgProtein) * 100;
    if (change >= 15) {
      insights.push({
        id: nanoid(), type: 'positive', icon: '💪',
        title: 'Protein Boost',
        message: `Protein intake increased by ${Math.round(change)}% compared to last week!`,
        category: 'macros', generatedAt: now,
      });
    } else if (change <= -15) {
      insights.push({
        id: nanoid(), type: 'warning', icon: '💪',
        title: 'Protein Drop',
        message: `Protein intake decreased by ${Math.round(Math.abs(change))}% compared to last week.`,
        category: 'macros', generatedAt: now,
      });
    }
  }

  // 4. Hydration
  const avgWater = averageMacro(meals, 'water');
  if (avgWater >= goals.water * 0.9) {
    insights.push({
      id: nanoid(), type: 'positive', icon: '💧',
      title: 'Well Hydrated',
      message: `Average daily water intake: ${Math.round(avgWater)}ml — ${avgWater >= goals.water ? 'meeting' : 'close to'} your goal!`,
      category: 'hydration', generatedAt: now,
    });
  } else if (avgWater < goals.water * 0.6 && avgWater > 0) {
    insights.push({
      id: nanoid(), type: 'warning', icon: '🚰',
      title: 'Low Hydration',
      message: `Average daily water intake: ${Math.round(avgWater)}ml — aim for ${goals.water}ml or more.`,
      category: 'hydration', generatedAt: now,
    });
  }

  // 5. Sugar / sweet tracking
  const sweetCount = meals.filter(m => m.foods.some(f => isSweet(f.name))).length;
  if (sweetCount >= 5) {
    insights.push({
      id: nanoid(), type: 'warning', icon: '🍬',
      title: 'Sweet Tooth Alert',
      message: `You consumed sugary foods ${sweetCount} times this week. Consider reducing for better nutrition.`,
      category: 'habits', generatedAt: now,
    });
  } else if (sweetCount <= 1) {
    insights.push({
      id: nanoid(), type: 'positive', icon: '🏆',
      title: 'Sugar Control',
      message: `Great job keeping sweets to a minimum this week (${sweetCount} times)!`,
      category: 'habits', generatedAt: now,
    });
  }

  // 6. Calorie adherence
  const avgCalories = averageMacro(meals, 'calories');
  const calorieDeviation = goals.calories > 0
    ? Math.abs(avgCalories - goals.calories) / goals.calories * 100
    : 0;
  if (calorieDeviation <= 10 && avgCalories > 0) {
    insights.push({
      id: nanoid(), type: 'positive', icon: '🎯',
      title: 'On Target',
      message: `Average daily calories: ${Math.round(avgCalories)} kcal — within 10% of your ${goals.calories} kcal goal!`,
      category: 'macros', generatedAt: now,
    });
  } else if (avgCalories > goals.calories * 1.2) {
    insights.push({
      id: nanoid(), type: 'warning', icon: '📊',
      title: 'Over Calorie Goal',
      message: `Average daily calories: ${Math.round(avgCalories)} kcal — ${Math.round(calorieDeviation)}% above your goal.`,
      category: 'macros', generatedAt: now,
    });
  }

  // 7. Home-cooked trend
  const homeCookedCount = meals.filter(m => m.isHomeCooked).length;
  const homeCookedRatio = meals.length > 0 ? homeCookedCount / meals.length : 0;
  if (homeCookedRatio >= 0.6 && meals.length >= 5) {
    insights.push({
      id: nanoid(), type: 'positive', icon: '🍳',
      title: 'Home Chef',
      message: `${Math.round(homeCookedRatio * 100)}% of your meals were home-cooked this week. Keep it up!`,
      category: 'progress', generatedAt: now,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Habit pattern detection
// ---------------------------------------------------------------------------

/**
 * Detect recurring patterns in meal behaviour.
 */
export function detectHabitPatterns(meals: MealEntry[], daysToAnalyse = 14): HabitPattern[] {
  const patterns: HabitPattern[] = [];
  const now = new Date().toISOString();
  const byDate = groupByDate(meals);
  const dates = Object.keys(byDate).sort();

  // 1. Skipped breakfasts
  const skippedBreakfasts = dates.filter(d =>
    byDate[d].length > 0 && !byDate[d].some(m => m.mealType === 'breakfast')
  );
  if (skippedBreakfasts.length >= 4) {
    patterns.push({
      id: nanoid(), type: 'negative',
      pattern: 'Frequently skipping breakfast',
      suggestion: 'Try a quick breakfast like oatmeal, yogurt, or a protein shake to start your day strong.',
      frequency: skippedBreakfasts.length,
      lastDetected: now,
    });
  }

  // 2. Late dinners (logged after 9 PM based on createdAt)
  const lateDinners = meals.filter(m => {
    if (m.mealType !== 'dinner') return false;
    const hour = new Date(m.createdAt).getHours();
    return hour >= 21;
  });
  if (lateDinners.length >= 3) {
    patterns.push({
      id: nanoid(), type: 'negative',
      pattern: 'Eating dinner late (after 9 PM)',
      suggestion: 'Try to finish dinner before 8 PM for better digestion and sleep quality.',
      frequency: lateDinners.length,
      lastDetected: now,
    });
  }

  // 3. Weekend sweet patterns
  const weekendSweets = meals.filter(m => {
    const day = new Date(m.date + 'T12:00:00').getDay();
    return (day === 0 || day === 6) && m.foods.some(f => isSweet(f.name));
  });
  if (weekendSweets.length >= 3) {
    patterns.push({
      id: nanoid(), type: 'neutral',
      pattern: 'Consuming sweets mostly on weekends',
      suggestion: 'It\'s okay to treat yourself, but try to balance it with healthier weekend options.',
      frequency: weekendSweets.length,
      lastDetected: now,
    });
  }

  // 4. Fast food reliance
  const fastFoodMeals = meals.filter(m => m.foodSource === 'fast-food');
  if (fastFoodMeals.length >= 5) {
    patterns.push({
      id: nanoid(), type: 'negative',
      pattern: 'Frequent fast food consumption',
      suggestion: 'Try batch-cooking meals on weekends to reduce fast food reliance during the week.',
      frequency: fastFoodMeals.length,
      lastDetected: now,
    });
  }

  // 5. Consistent hydration
  const wellHydratedDays = dates.filter(d => {
    const dayWater = byDate[d].reduce((s, m) => s + m.water, 0);
    return dayWater >= 2000;
  });
  if (wellHydratedDays.length >= Math.min(dates.length - 1, 5)) {
    patterns.push({
      id: nanoid(), type: 'positive',
      pattern: 'Consistently good hydration',
      suggestion: 'Keep up the great hydration habit — it supports energy and focus.',
      frequency: wellHydratedDays.length,
      lastDetected: now,
    });
  }

  // 6. High meal variety
  const uniqueFoods = new Set(meals.flatMap(m => m.foods.map(f => f.name.toLowerCase())));
  if (uniqueFoods.size >= 15 && meals.length >= 10) {
    patterns.push({
      id: nanoid(), type: 'positive',
      pattern: 'Great meal variety',
      suggestion: 'You\'re eating a wide range of foods — this helps ensure balanced nutrition.',
      frequency: uniqueFoods.size,
      lastDetected: now,
    });
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByDate(meals: MealEntry[]): Record<string, MealEntry[]> {
  const map: Record<string, MealEntry[]> = {};
  for (const m of meals) {
    (map[m.date] ??= []).push(m);
  }
  return map;
}

function averageMacro(meals: MealEntry[], macro: 'calories' | 'protein' | 'carbs' | 'fat' | 'water'): number {
  const byDate = groupByDate(meals);
  const days = Object.keys(byDate);
  if (days.length === 0) return 0;

  const total = days.reduce((sum, date) => {
    return sum + byDate[date].reduce((ds, m) => ds + m[macro], 0);
  }, 0);

  return total / days.length;
}
