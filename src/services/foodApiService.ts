// ============================================================================
// MealQuest — Food API Service (USDA FoodData Central)
// ============================================================================
// Searches the USDA FoodData Central database for foods not found locally.
// Uses the public DEMO_KEY which allows ~1000 requests/hour — more than
// enough for personal desktop use. Results are cached in memory for the
// session so the same query never hits the network twice.

import type { FoodEstimate } from '@/utils/foodDatabase';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = 'DEMO_KEY'; // public demo key; no registration required

// Nutrient IDs in the USDA database
const NID = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 } as const;

// Session-scoped in-memory cache (cleared on app restart)
const cache = new Map<string, FoodEstimate[]>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNutrient(nutrients: NutrientEntry[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

interface NutrientEntry {
  nutrientId: number;
  value: number;
}

interface UsdaFood {
  description: string;
  servingSize?: number;       // grams (or ml for liquids) per serving
  servingSizeUnit?: string;
  foodNutrients: NutrientEntry[];
}

function normalizeFood(food: UsdaFood): FoodEstimate | null {
  const calPer100 = getNutrient(food.foodNutrients, NID.calories);
  const protPer100 = getNutrient(food.foodNutrients, NID.protein);
  const carbPer100 = getNutrient(food.foodNutrients, NID.carbs);
  const fatPer100 = getNutrient(food.foodNutrients, NID.fat);

  // Skip entries with no meaningful nutrient data
  if (calPer100 === 0 && protPer100 === 0) return null;

  // USDA values are always per 100 g/ml. Scale to serving size if available.
  const servingG = food.servingSize ?? 100;
  const servingUnit = food.servingSizeUnit ?? 'g';
  const multiplier = servingG / 100;

  const name = food.description
    .toLowerCase()
    .replace(/[,;()[\]]/g, '')   // strip punctuation
    .replace(/\s{2,}/g, ' ')      // collapse spaces
    .trim();

  return {
    name,
    calories: Math.round(calPer100 * multiplier),
    protein: Math.round(protPer100 * multiplier * 10) / 10,
    carbs: Math.round(carbPer100 * multiplier * 10) / 10,
    fat: Math.round(fatPer100 * multiplier * 10) / 10,
    serving: `${Math.round(servingG)}${servingUnit === 'ml' ? ' ml' : 'g'}`,
    fromApi: true,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search USDA FoodData Central for foods matching the query.
 * Returns up to 6 normalized FoodEstimate results.
 * Returns empty array on network error or timeout (graceful offline fallback).
 *
 * @param query  Food name to search for
 * @param signal AbortSignal to cancel an in-flight request when the user
 *               types more characters (prevents stale results)
 */
export async function searchFoodOnline(
  query: string,
  signal?: AbortSignal,
): Promise<FoodEstimate[]> {
  const key = query.toLowerCase().trim();
  if (!key || key.length < 2) return [];

  if (cache.has(key)) return cache.get(key)!;

  try {
    const params = new URLSearchParams({
      query,
      api_key: API_KEY,
      pageSize: '8',
      // Branded foods have serving sizes; Foundation/SR Legacy have per-100g values
      dataType: 'Branded,Foundation,SR Legacy',
    });

    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      cache.set(key, []);
      return [];
    }

    const data = await res.json() as { foods?: UsdaFood[] };
    const results: FoodEstimate[] = (data.foods ?? [])
      .slice(0, 8)
      .map(normalizeFood)
      .filter((f): f is FoodEstimate => f !== null)
      .slice(0, 6);

    cache.set(key, results);
    return results;
  } catch {
    // Network error, timeout, or AbortError — silently fall back to local DB
    return [];
  }
}
