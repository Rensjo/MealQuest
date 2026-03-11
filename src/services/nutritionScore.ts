// ============================================================================
// MealQuest — Daily Nutrition Score
// ============================================================================
// Calculates a 0-100 daily score based on meal consistency, nutrition
// balance, hydration, sugar control, and home-cooking.

import type { DailyNutritionScore, MealEntry, NutritionGoal } from '@/types';
import { isSweet } from '@/utils/foodDatabase';

// ---------------------------------------------------------------------------
// Score weights (must sum to 100)
// ---------------------------------------------------------------------------
// mealConsistency:  25  (did you log b/l/d?)
// nutritionBalance: 30  (how close to macro goals?)
// hydration:        20  (water goal %)
// sugarControl:     15  (fewer sweets = better)
// homeCooked:       10  (home-cooked ratio)

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the daily nutrition score for a given date.
 */
export function calculateDailyScore(
  meals: MealEntry[],
  goals: NutritionGoal,
  date: string,
): DailyNutritionScore {
  const dayMeals = meals.filter(m => m.date === date && !m.isLiquidLog);
  const allDayEntries = meals.filter(m => m.date === date);

  const breakdown = {
    mealConsistency: scoreMealConsistency(dayMeals),
    nutritionBalance: scoreNutritionBalance(allDayEntries, goals),
    hydration: scoreHydration(allDayEntries, goals.water),
    sugarControl: scoreSugarControl(dayMeals),
    homeCooked: scoreHomeCooked(dayMeals),
  };

  const score = breakdown.mealConsistency
    + breakdown.nutritionBalance
    + breakdown.hydration
    + breakdown.sugarControl
    + breakdown.homeCooked;

  return {
    date,
    score: Math.round(score),
    breakdown,
    grade: scoreToGrade(score),
  };
}

/**
 * Calculate average score over a date range.
 */
export function calculateAverageScore(
  meals: MealEntry[],
  goals: NutritionGoal,
  dates: string[],
): number {
  if (dates.length === 0) return 0;
  const scores = dates.map(d => calculateDailyScore(meals, goals, d).score);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ---------------------------------------------------------------------------
// Sub-scores
// ---------------------------------------------------------------------------

/** 0-25: Did the user log breakfast, lunch, and dinner? */
function scoreMealConsistency(meals: MealEntry[]): number {
  const types = new Set(meals.map(m => m.mealType));
  let score = 0;
  if (types.has('breakfast')) score += 8;
  if (types.has('lunch')) score += 8;
  if (types.has('dinner')) score += 8;
  // Bonus for logging 3+ meals
  if (meals.length >= 3) score += 1;
  return Math.min(25, score);
}

/** 0-30: How close to calorie/protein/carb/fat goals? */
function scoreNutritionBalance(meals: MealEntry[], goals: NutritionGoal): number {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const m of meals) {
    totals.calories += m.calories;
    totals.protein += m.protein;
    totals.carbs += m.carbs;
    totals.fat += m.fat;
  }

  const closeness = (actual: number, goal: number) => {
    if (goal === 0) return 1;
    const ratio = actual / goal;
    // Perfect = 1.0 → score 1; >1.3 or <0.5 → score 0
    if (ratio >= 0.85 && ratio <= 1.15) return 1;
    if (ratio >= 0.7 && ratio <= 1.3) return 0.6;
    if (ratio >= 0.5 && ratio <= 1.5) return 0.3;
    return 0;
  };

  const calScore = closeness(totals.calories, goals.calories) * 10;
  const proteinScore = closeness(totals.protein, goals.protein) * 8;
  const carbScore = closeness(totals.carbs, goals.carbs) * 6;
  const fatScore = closeness(totals.fat, goals.fat) * 6;

  return Math.min(30, Math.round(calScore + proteinScore + carbScore + fatScore));
}

/** 0-20: Hydration percentage */
function scoreHydration(meals: MealEntry[], waterGoal: number): number {
  const totalWater = meals.reduce((s, m) => s + m.water, 0);
  if (waterGoal === 0) return 20;
  const ratio = Math.min(1, totalWater / waterGoal);
  return Math.round(ratio * 20);
}

/** 0-15: Fewer sweets = higher score */
function scoreSugarControl(meals: MealEntry[]): number {
  const sweetMeals = meals.filter(m => m.foods.some(f => isSweet(f.name))).length;
  if (sweetMeals === 0) return 15;
  if (sweetMeals === 1) return 10;
  if (sweetMeals === 2) return 5;
  return 0;
}

/** 0-10: Home-cooked ratio bonus */
function scoreHomeCooked(meals: MealEntry[]): number {
  if (meals.length === 0) return 0;
  const ratio = meals.filter(m => m.isHomeCooked).length / meals.length;
  return Math.round(ratio * 10);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreToGrade(score: number): DailyNutritionScore['grade'] {
  if (score >= 95) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}
