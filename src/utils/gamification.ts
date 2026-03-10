// ============================================================================
// MealQuest — Gamification Utilities
// ============================================================================

import type { MealType, DietStrategy, SkillTier, NutritionGoal } from '@/types';

// ---------------------------------------------------------------------------
// XP Calculation
// ---------------------------------------------------------------------------

/** XP curve: each level requires 100 * 1.5^(level-1) cumulative XP */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(100 * Math.pow(1.5, i - 1));
  }
  return total;
}

/** Determine level from total XP */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

// ---------------------------------------------------------------------------
// Meal XP Rules
// ---------------------------------------------------------------------------

const BASE_MEAL_XP: Record<MealType, number> = {
  breakfast: 10,
  lunch: 15,
  dinner: 15,
  snack: 5,
};

const BONUS_XP = {
  balanced: 10,
  homeCooked: 5,
  proteinGoalHit: 10,
  waterGoalHit: 10,
};

export interface MealXPResult {
  base: number;
  bonuses: { label: string; xp: number }[];
  total: number;
}

/** Calculate XP for logging a meal */
export function calculateMealXP(
  mealType: MealType,
  isBalanced: boolean,
  isHomeCooked: boolean,
  proteinGoalMet: boolean,
  waterGoalMet: boolean,
  dietStrategy: DietStrategy = 'balanced',
  activeStreakCount: number = 0,
): MealXPResult {
  const base = BASE_MEAL_XP[mealType];
  const bonuses: { label: string; xp: number }[] = [];

  if (isBalanced) bonuses.push({ label: 'Balanced Meal', xp: BONUS_XP.balanced });
  if (isHomeCooked) bonuses.push({ label: 'Home Cooked', xp: BONUS_XP.homeCooked });
  if (proteinGoalMet) bonuses.push({ label: 'Protein Goal', xp: BONUS_XP.proteinGoalHit });
  if (waterGoalMet) bonuses.push({ label: 'Water Goal', xp: BONUS_XP.waterGoalHit });

  // Diet strategy multiplier
  const stratMultiplier = getDietStrategyMultiplier(dietStrategy, mealType, isHomeCooked);
  // Streak bonus: 5% per active streak (capped at 3 streaks = 15%)
  const streakMultiplier = 1 + Math.min(activeStreakCount, 3) * 0.05;
  const subtotal = base + bonuses.reduce((s, b) => s + b.xp, 0);
  const total = Math.round(subtotal * stratMultiplier * streakMultiplier);

  return { base, bonuses, total };
}

/** Diet strategy modifies XP scoring */
function getDietStrategyMultiplier(
  strategy: DietStrategy,
  mealType: MealType,
  isHomeCooked: boolean
): number {
  switch (strategy) {
    case 'high-protein':
      return 1.1; // 10% bonus for all meals
    case 'keto':
      return mealType === 'snack' ? 0.8 : 1.05;
    case 'plant-based':
      return isHomeCooked ? 1.15 : 1.0;
    case 'performance':
      return 1.1;
    case 'balanced':
    default:
      return 1.0;
  }
}

// ---------------------------------------------------------------------------
// Energy System
// ---------------------------------------------------------------------------

export function calculateEnergyDelta(
  source: 'balanced' | 'fast-food' | 'skipped'
): number {
  switch (source) {
    case 'balanced':
      return 30;
    case 'fast-food':
      return 10;
    case 'skipped':
      return -20;
    default:
      return 0;
  }
}

export const MAX_ENERGY = 100;

export function clampEnergy(value: number): number {
  return Math.max(0, Math.min(MAX_ENERGY, value));
}

// ---------------------------------------------------------------------------
// Skill Tree
// ---------------------------------------------------------------------------

export const SKILL_TIERS: { tier: SkillTier; name: string; xpRequired: number; perks: string[] }[] = [
  {
    tier: 'novice-eater',
    name: 'Novice Eater',
    xpRequired: 0,
    perks: ['Basic meal logging', 'Daily missions'],
  },
  {
    tier: 'healthy-eater',
    name: 'Healthy Eater',
    xpRequired: 500,
    perks: ['Streak tracking', 'Recipe vault access'],
  },
  {
    tier: 'meal-planner',
    name: 'Meal Planner',
    xpRequired: 2000,
    perks: ['Meal prep mode', 'Grocery quests'],
  },
  {
    tier: 'nutrition-strategist',
    name: 'Nutrition Strategist',
    xpRequired: 5000,
    perks: ['Diet strategy modes', 'Advanced analytics'],
  },
  {
    tier: 'elite-fuel-master',
    name: 'Elite Fuel Master',
    xpRequired: 10000,
    perks: ['All features unlocked', 'Boss battle rewards x2'],
  },
];

export function getTierFromXP(totalXP: number): SkillTier {
  for (let i = SKILL_TIERS.length - 1; i >= 0; i--) {
    if (totalXP >= SKILL_TIERS[i].xpRequired) {
      return SKILL_TIERS[i].tier;
    }
  }
  return 'novice-eater';
}

// ---------------------------------------------------------------------------
// Meal Prep Mode
// ---------------------------------------------------------------------------

export function calculateMealPrepXP(mealsPrepped: number): number {
  if (mealsPrepped >= 7) return 100;
  if (mealsPrepped >= 5) return 60;
  if (mealsPrepped >= 3) return 30;
  return 0;
}

// ---------------------------------------------------------------------------
// Weekly Grade
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Centralized XP Reward Constants
// ---------------------------------------------------------------------------

export const XP_REWARDS = {
  // Meal logging
  LOG_MEAL_BREAKFAST:     10,
  LOG_MEAL_LUNCH:         15,
  LOG_MEAL_DINNER:        15,
  LOG_MEAL_SNACK:          5,
  MEAL_BALANCED_BONUS:    10,
  MEAL_HOME_COOKED_BONUS:  5,

  // Hydration
  LOG_WATER_500ML:         3,
  LOG_WATER_GOAL:         10,

  // Grocery
  ADD_GROCERY_ITEM:        5,
  PURCHASE_GROCERY_ITEM:   8,
  COMPLETE_GROCERY_LIST:  25,

  // Pantry
  ADD_PANTRY_ITEM:         5,
  RESTOCK_PANTRY_ITEM:     3,

  // Recipe
  ADD_RECIPE:             20,
  FAVORITE_RECIPE:         5,

  // Streak milestones (also defined in streakStore — kept here for reference)
  STREAK_3_DAYS:          20,
  STREAK_7_DAYS:          50,
  STREAK_14_DAYS:        100,
  STREAK_30_DAYS:        200,

  // Quest completion
  COMPLETE_DAILY_QUEST:   15, // average; actual from quest template
  COMPLETE_WEEKLY_BOSS:  200,
} as const;

// ---------------------------------------------------------------------------
// Diet Strategy Goal Presets
// ---------------------------------------------------------------------------

export const DIET_GOAL_PRESETS: Record<DietStrategy, NutritionGoal> = {
  balanced:      { calories: 2000, protein: 150, carbs: 250, fat:  65, water: 2500 },
  'high-protein':{ calories: 2200, protein: 200, carbs: 180, fat:  65, water: 3000 },
  keto:          { calories: 2000, protein: 155, carbs:  50, fat: 155, water: 2500 },
  'plant-based': { calories: 1900, protein: 120, carbs: 270, fat:  55, water: 2500 },
  performance:   { calories: 2800, protein: 220, carbs: 350, fat:  75, water: 3500 },
};

// ---------------------------------------------------------------------------
// Weekly Grade
// ---------------------------------------------------------------------------

export function calculateWeeklyGrade(
  avgCalorieDeviation: number, // percentage deviation from goal
  streaksActive: number,
  missionsCompleted: number,
  totalMissions: number
): string {
  let score = 0;

  // Calorie adherence (40 points max)
  if (avgCalorieDeviation <= 5) score += 40;
  else if (avgCalorieDeviation <= 10) score += 30;
  else if (avgCalorieDeviation <= 20) score += 20;
  else if (avgCalorieDeviation <= 30) score += 10;

  // Streaks (30 points max)
  score += Math.min(30, streaksActive * 10);

  // Missions (30 points max)
  const missionRate = totalMissions > 0 ? missionsCompleted / totalMissions : 0;
  score += Math.round(missionRate * 30);

  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
