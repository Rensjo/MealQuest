// ============================================================================
// MealQuest — Nutrition Estimator Service
// ============================================================================
// Intelligent meal recognition: given a meal name + portion size, estimate
// nutrition values with confidence scoring. Uses the internal food database
// with fuzzy matching and composite-meal decomposition.

import type { NutritionEstimate, PortionSize } from '@/types';
import { lookupFood, estimateNutrition, type FoodEstimate } from '@/utils/foodDatabase';

// ---------------------------------------------------------------------------
// Portion multipliers (mirrors foodDatabase but exposed for direct use)
// ---------------------------------------------------------------------------

const PORTION_MULTIPLIERS: Record<PortionSize, number> = {
  small: 0.7,
  medium: 1.0,
  large: 1.4,
  'extra-large': 1.8,
  half: 0.5,
  double: 2.0,
};

// Informal portion aliases → standardised key
const PORTION_ALIASES: Record<string, PortionSize> = {
  '1 plate': 'large',
  '1 bowl': 'medium',
  '1 cup': 'medium',
  '1 serving': 'medium',
  '2 servings': 'double',
  'half plate': 'half',
  'half bowl': 'half',
  'small plate': 'small',
  'small bowl': 'small',
  'large plate': 'large',
  'large bowl': 'large',
  'extra large': 'extra-large',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Estimate nutrition from a meal name and free-text portion descriptor.
 * Returns confidence level so the UI can prompt for correction when low.
 */
export function estimateMealNutrition(
  mealName: string,
  portion: string = 'medium',
): NutritionEstimate {
  const normalizedPortion = normalizePortion(portion);
  const multiplier = PORTION_MULTIPLIERS[normalizedPortion] ?? 1.0;

  // 1. Try direct food database lookup
  const directMatch = lookupFood(mealName);
  if (directMatch) {
    return buildEstimate(directMatch, multiplier, directMatch.name === mealName.toLowerCase().trim() ? 'high' : 'medium');
  }

  // 2. Try composite decomposition (e.g. "chicken rice bowl" → chicken + rice)
  const composite = decomposeCompositeMeal(mealName);
  if (composite) {
    return {
      calories: Math.round(composite.calories * multiplier),
      protein: Math.round(composite.protein * multiplier * 10) / 10,
      carbs: Math.round(composite.carbs * multiplier * 10) / 10,
      fat: Math.round(composite.fat * multiplier * 10) / 10,
      confidence: 'medium',
      matchedFood: composite.name,
    };
  }

  // 3. Fallback: generic meal estimate
  return {
    calories: Math.round(400 * multiplier),
    protein: Math.round(20 * multiplier),
    carbs: Math.round(45 * multiplier),
    fat: Math.round(15 * multiplier),
    confidence: 'low',
  };
}

/**
 * Batch-estimate for multiple food items (e.g. multi-food meal log).
 */
export function estimateMultipleFoods(
  foods: { name: string; portion?: string }[],
): NutritionEstimate {
  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  let worstConfidence: NutritionEstimate['confidence'] = 'high';

  for (const f of foods) {
    const est = estimateMealNutrition(f.name, f.portion);
    totalCal += est.calories;
    totalP += est.protein;
    totalC += est.carbs;
    totalF += est.fat;
    if (est.confidence === 'low') worstConfidence = 'low';
    else if (est.confidence === 'medium' && worstConfidence === 'high') worstConfidence = 'medium';
  }

  return {
    calories: Math.round(totalCal),
    protein: Math.round(totalP * 10) / 10,
    carbs: Math.round(totalC * 10) / 10,
    fat: Math.round(totalF * 10) / 10,
    confidence: worstConfidence,
  };
}

/**
 * Quick check: does the food database recognise this meal name?
 */
export function canEstimate(mealName: string): boolean {
  return lookupFood(mealName) !== null || decomposeCompositeMeal(mealName) !== null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePortion(raw: string): PortionSize {
  const lower = raw.toLowerCase().trim();
  if (lower in PORTION_ALIASES) return PORTION_ALIASES[lower];
  if (lower in PORTION_MULTIPLIERS) return lower as PortionSize;
  // Try to extract keywords
  if (lower.includes('small')) return 'small';
  if (lower.includes('large') || lower.includes('big')) return 'large';
  if (lower.includes('extra') || lower.includes('xl')) return 'extra-large';
  if (lower.includes('half')) return 'half';
  if (lower.includes('double') || lower.includes('2x')) return 'double';
  return 'medium';
}

function buildEstimate(
  food: FoodEstimate,
  multiplier: number,
  confidence: NutritionEstimate['confidence'],
): NutritionEstimate {
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    confidence,
    matchedFood: food.name,
  };
}

/** Try to split a compound meal name into recognised components and sum them. */
function decomposeCompositeMeal(mealName: string): (FoodEstimate & { name: string }) | null {
  const words = mealName.toLowerCase().trim().split(/\s+/);
  if (words.length < 2) return null;

  // Try common patterns: "X and Y", "X with Y", "X Y bowl/plate"
  const separators = ['and', 'with', '&', 'n'];
  let parts: string[] = [];

  for (const sep of separators) {
    const idx = words.indexOf(sep);
    if (idx > 0 && idx < words.length - 1) {
      parts = [
        words.slice(0, idx).join(' '),
        words.slice(idx + 1).filter(w => !['bowl', 'plate', 'cup'].includes(w)).join(' '),
      ];
      break;
    }
  }

  if (parts.length < 2) return null;

  const estimates = parts.map(p => lookupFood(p)).filter(Boolean) as FoodEstimate[];
  if (estimates.length < 2) return null;

  return {
    name: parts.join(' + '),
    calories: estimates.reduce((s, e) => s + e.calories, 0),
    protein: estimates.reduce((s, e) => s + e.protein, 0),
    carbs: estimates.reduce((s, e) => s + e.carbs, 0),
    fat: estimates.reduce((s, e) => s + e.fat, 0),
    serving: 'combined',
  };
}
