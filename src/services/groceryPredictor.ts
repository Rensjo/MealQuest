// ============================================================================
// MealQuest — Predictive Grocery System
// ============================================================================
// Analyses meal history and pantry usage to predict which groceries the user
// will need soon and auto-recommends items for the grocery list.

import { nanoid } from 'nanoid';
import type { GroceryPrediction, MealEntry, PantryItem, Recipe } from '@/types';

// ---------------------------------------------------------------------------
// Common ingredient → category mapping
// ---------------------------------------------------------------------------

const INGREDIENT_CATEGORIES: Record<string, string> = {
  chicken: 'Protein', beef: 'Protein', pork: 'Protein', fish: 'Protein',
  salmon: 'Protein', tuna: 'Protein', shrimp: 'Protein', turkey: 'Protein',
  tofu: 'Protein', egg: 'Protein', eggs: 'Protein',
  rice: 'Grains', pasta: 'Grains', bread: 'Grains', noodles: 'Grains',
  oats: 'Grains', tortilla: 'Grains', flour: 'Grains',
  broccoli: 'Vegetables', spinach: 'Vegetables', carrots: 'Vegetables',
  onion: 'Vegetables', garlic: 'Vegetables', tomato: 'Vegetables',
  potato: 'Vegetables', lettuce: 'Vegetables', 'bell pepper': 'Vegetables',
  banana: 'Fruits', apple: 'Fruits', orange: 'Fruits', mango: 'Fruits',
  berries: 'Fruits', lemon: 'Fruits',
  milk: 'Dairy', cheese: 'Dairy', yogurt: 'Dairy', butter: 'Dairy',
  oil: 'Pantry Staples', 'soy sauce': 'Pantry Staples', vinegar: 'Pantry Staples',
  salt: 'Pantry Staples', sugar: 'Pantry Staples', pepper: 'Pantry Staples',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Predict grocery needs based on meal history, pantry state, and recipes.
 */
export function predictGroceryNeeds(params: {
  meals: MealEntry[];
  pantryItems: PantryItem[];
  recipes: Recipe[];
  daysToAnalyse?: number;
  limit?: number;
}): GroceryPrediction[] {
  const { meals, pantryItems, recipes, daysToAnalyse = 14, limit = 10 } = params;

  // 1. Build ingredient frequency map from recent meals
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToAnalyse);
  const cutoffISO = cutoff.toISOString().split('T')[0];

  const recentMeals = meals.filter(m => m.date >= cutoffISO);
  const ingredientFreq = new Map<string, number>();

  for (const meal of recentMeals) {
    for (const food of meal.foods) {
      const name = food.name.toLowerCase().trim();
      ingredientFreq.set(name, (ingredientFreq.get(name) ?? 0) + 1);
    }
  }

  // 2. Also count recipe ingredients the user has saved
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const name = ing.name.toLowerCase().trim();
      ingredientFreq.set(name, (ingredientFreq.get(name) ?? 0) + 0.5);
    }
  }

  // 3. Check pantry levels & predict depletion
  const predictions: GroceryPrediction[] = [];
  const addedNames = new Set<string>();

  // Low-stock pantry items that are frequently used
  for (const item of pantryItems) {
    const name = item.name.toLowerCase().trim();
    const freq = ingredientFreq.get(name) ?? 0;
    const threshold = item.lowStockThreshold ?? 2;

    if (item.quantity <= threshold && freq > 0) {
      predictions.push({
        name: item.name,
        reason: `Low stock (${item.quantity} ${item.unit}) — used ${Math.round(freq)} times recently`,
        urgency: item.quantity === 0 ? 'high' : item.quantity <= 1 ? 'medium' : 'low',
        estimatedDaysUntilOut: estimateDaysUntilOut(item.quantity, freq, daysToAnalyse),
        category: item.category ?? INGREDIENT_CATEGORIES[name],
      });
      addedNames.add(name);
    }
  }

  // Frequently used items NOT in pantry
  const pantryNames = new Set(pantryItems.map(i => i.name.toLowerCase().trim()));
  const sorted = [...ingredientFreq.entries()]
    .filter(([name]) => !pantryNames.has(name) && !addedNames.has(name))
    .sort((a, b) => b[1] - a[1]);

  for (const [name, freq] of sorted) {
    if (predictions.length >= limit) break;
    if (freq < 1.5) continue; // Only suggest if used at least twice

    predictions.push({
      name: capitalize(name),
      reason: `Used ${Math.round(freq)} times in the last ${daysToAnalyse} days but not in pantry`,
      urgency: freq >= 4 ? 'high' : freq >= 2 ? 'medium' : 'low',
      estimatedDaysUntilOut: 0,
      category: INGREDIENT_CATEGORIES[name],
    });
  }

  // Sort by urgency then frequency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  predictions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return predictions.slice(0, limit);
}

/**
 * Get commonly purchased items based on meal patterns (for quick-add).
 */
export function getFrequentIngredients(meals: MealEntry[], topN = 8): string[] {
  const freq = new Map<string, number>();
  for (const meal of meals) {
    for (const food of meal.foods) {
      const name = food.name.toLowerCase().trim();
      freq.set(name, (freq.get(name) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name]) => capitalize(name));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estimateDaysUntilOut(currentQty: number, usageInPeriod: number, periodDays: number): number {
  if (usageInPeriod === 0) return 999;
  const dailyUsage = usageInPeriod / periodDays;
  return Math.max(0, Math.round(currentQty / dailyUsage));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
