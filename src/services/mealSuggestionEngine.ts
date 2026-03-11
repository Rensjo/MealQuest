// ============================================================================
// MealQuest — Smart Meal Suggestion Engine
// ============================================================================
// Generates meal recommendations based on diet strategy, user history,
// pantry inventory, and frequently eaten meals.

import { nanoid } from 'nanoid';
import type { MealSuggestion, DietStrategy, MealEntry, PantryItem, Recipe } from '@/types';
import { getAllFoodNames, lookupFood, type FoodEstimate } from '@/utils/foodDatabase';

// ---------------------------------------------------------------------------
// Suggestion database — curated meals tagged by diet strategy
// ---------------------------------------------------------------------------

interface SuggestionTemplate {
  name: string;
  tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  strategies: DietStrategy[];
  ingredients: string[]; // pantry ingredient keywords
}

const SUGGESTION_POOL: SuggestionTemplate[] = [
  // High Protein
  { name: 'Grilled Chicken Breast with Brown Rice', tags: ['high-protein', 'home-cooked'], calories: 420, protein: 40, carbs: 48, fat: 6, strategies: ['high-protein', 'balanced', 'performance'], ingredients: ['chicken', 'rice'] },
  { name: 'Protein Shake with Banana', tags: ['high-protein', 'quick'], calories: 320, protein: 30, carbs: 40, fat: 5, strategies: ['high-protein', 'performance'], ingredients: ['protein', 'banana'] },
  { name: 'Egg & Spinach Omelette', tags: ['high-protein', 'breakfast'], calories: 250, protein: 22, carbs: 4, fat: 16, strategies: ['high-protein', 'keto', 'balanced'], ingredients: ['egg', 'spinach'] },
  { name: 'Salmon with Mixed Vegetables', tags: ['high-protein', 'balanced'], calories: 380, protein: 32, carbs: 18, fat: 18, strategies: ['high-protein', 'balanced', 'performance'], ingredients: ['salmon', 'vegetables'] },
  { name: 'Chicken Stir Fry', tags: ['high-protein', 'home-cooked'], calories: 380, protein: 30, carbs: 28, fat: 14, strategies: ['high-protein', 'balanced', 'performance'], ingredients: ['chicken', 'vegetables', 'soy sauce'] },
  { name: 'Greek Yogurt with Almonds', tags: ['high-protein', 'snack'], calories: 264, protein: 23, carbs: 12, fat: 14, strategies: ['high-protein', 'balanced'], ingredients: ['yogurt', 'almonds'] },
  { name: 'Turkey Lettuce Wraps', tags: ['high-protein', 'low-carb'], calories: 280, protein: 32, carbs: 8, fat: 14, strategies: ['high-protein', 'keto'], ingredients: ['turkey', 'lettuce'] },
  { name: 'Tuna Salad Bowl', tags: ['high-protein', 'balanced'], calories: 320, protein: 34, carbs: 14, fat: 14, strategies: ['high-protein', 'balanced'], ingredients: ['tuna', 'vegetables'] },

  // Keto
  { name: 'Avocado & Bacon Plate', tags: ['keto', 'high-fat'], calories: 450, protein: 18, carbs: 6, fat: 40, strategies: ['keto'], ingredients: ['avocado', 'bacon'] },
  { name: 'Cheese Omelette', tags: ['keto', 'breakfast'], calories: 380, protein: 24, carbs: 3, fat: 30, strategies: ['keto'], ingredients: ['egg', 'cheese'] },
  { name: 'Steak with Butter Broccoli', tags: ['keto', 'high-protein'], calories: 520, protein: 42, carbs: 8, fat: 36, strategies: ['keto', 'performance'], ingredients: ['steak', 'broccoli', 'butter'] },
  { name: 'Cauliflower Fried Rice', tags: ['keto', 'low-carb'], calories: 280, protein: 14, carbs: 12, fat: 20, strategies: ['keto'], ingredients: ['cauliflower', 'egg', 'soy sauce'] },

  // Plant-Based
  { name: 'Tofu Veggie Bowl', tags: ['plant-based', 'balanced'], calories: 350, protein: 20, carbs: 40, fat: 12, strategies: ['plant-based', 'balanced'], ingredients: ['tofu', 'rice', 'vegetables'] },
  { name: 'Lentil Soup', tags: ['plant-based', 'high-protein'], calories: 280, protein: 18, carbs: 42, fat: 4, strategies: ['plant-based', 'balanced'], ingredients: ['lentils', 'vegetables'] },
  { name: 'Chickpea Salad', tags: ['plant-based', 'balanced'], calories: 320, protein: 14, carbs: 40, fat: 12, strategies: ['plant-based', 'balanced'], ingredients: ['chickpeas', 'vegetables'] },
  { name: 'Overnight Oats with Berries', tags: ['plant-based', 'breakfast'], calories: 280, protein: 10, carbs: 44, fat: 8, strategies: ['plant-based', 'balanced'], ingredients: ['oats', 'berries'] },

  // Performance
  { name: 'Double Chicken Rice Bowl', tags: ['performance', 'high-protein'], calories: 680, protein: 52, carbs: 68, fat: 14, strategies: ['performance'], ingredients: ['chicken', 'rice'] },
  { name: 'Pasta with Ground Beef', tags: ['performance', 'high-carb'], calories: 580, protein: 34, carbs: 62, fat: 18, strategies: ['performance', 'balanced'], ingredients: ['pasta', 'beef'] },
  { name: 'Banana Peanut Butter Smoothie', tags: ['performance', 'quick'], calories: 420, protein: 16, carbs: 52, fat: 18, strategies: ['performance', 'balanced'], ingredients: ['banana', 'peanut butter', 'milk'] },

  // Balanced
  { name: 'Chicken Rice Bowl', tags: ['balanced', 'home-cooked'], calories: 450, protein: 32, carbs: 50, fat: 10, strategies: ['balanced', 'high-protein', 'performance'], ingredients: ['chicken', 'rice'] },
  { name: 'Egg Fried Rice', tags: ['balanced', 'quick'], calories: 380, protein: 14, carbs: 52, fat: 14, strategies: ['balanced'], ingredients: ['egg', 'rice', 'soy sauce'] },
  { name: 'Grilled Fish with Salad', tags: ['balanced', 'light'], calories: 320, protein: 28, carbs: 14, fat: 16, strategies: ['balanced', 'high-protein'], ingredients: ['fish', 'vegetables'] },
  { name: 'Oatmeal with Fresh Fruit', tags: ['balanced', 'breakfast'], calories: 280, protein: 8, carbs: 48, fat: 6, strategies: ['balanced', 'plant-based'], ingredients: ['oats', 'fruit'] },
  { name: 'Mixed Vegetable Stir Fry with Rice', tags: ['balanced', 'home-cooked'], calories: 360, protein: 12, carbs: 52, fat: 10, strategies: ['balanced', 'plant-based'], ingredients: ['vegetables', 'rice', 'soy sauce'] },

  // Filipino meals
  { name: 'Chicken Adobo with Rice', tags: ['home-cooked', 'filipino'], calories: 540, protein: 34, carbs: 52, fat: 20, strategies: ['balanced', 'high-protein'], ingredients: ['chicken', 'rice', 'soy sauce', 'vinegar'] },
  { name: 'Sinigang na Baboy', tags: ['home-cooked', 'filipino'], calories: 310, protein: 20, carbs: 18, fat: 16, strategies: ['balanced'], ingredients: ['pork', 'vegetables', 'tamarind'] },
  { name: 'Tinola with Rice', tags: ['home-cooked', 'filipino', 'light'], calories: 380, protein: 26, carbs: 46, fat: 10, strategies: ['balanced', 'high-protein'], ingredients: ['chicken', 'rice', 'ginger'] },
  { name: 'Pinakbet with Rice', tags: ['home-cooked', 'filipino', 'vegetables'], calories: 360, protein: 16, carbs: 48, fat: 10, strategies: ['balanced', 'plant-based'], ingredients: ['vegetables', 'rice', 'shrimp paste'] },
  { name: 'Pancit Canton', tags: ['filipino', 'quick'], calories: 360, protein: 16, carbs: 48, fat: 12, strategies: ['balanced'], ingredients: ['noodles', 'vegetables', 'soy sauce'] },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate meal suggestions based on user context.
 */
export function generateMealSuggestions(params: {
  dietStrategy: DietStrategy;
  recentMeals?: MealEntry[];
  pantryItems?: PantryItem[];
  recipes?: Recipe[];
  limit?: number;
}): MealSuggestion[] {
  const { dietStrategy, recentMeals = [], pantryItems = [], recipes = [], limit = 6 } = params;

  // Score each suggestion
  const scored = SUGGESTION_POOL.map(template => {
    let score = 0;

    // Diet strategy match (highest weight)
    if (template.strategies.includes(dietStrategy)) score += 40;

    // Pantry ingredient match
    const pantryNames = pantryItems.map(p => p.name.toLowerCase());
    const ingredientMatches = template.ingredients.filter(ing =>
      pantryNames.some(pn => pn.includes(ing) || ing.includes(pn))
    ).length;
    score += Math.min(30, ingredientMatches * 10);

    // Variety bonus: penalise if recently eaten
    const recentNames = recentMeals.slice(0, 14).map(m =>
      m.foods.map(f => f.name.toLowerCase()).join(' ')
    );
    const recentlyEaten = recentNames.some(rn =>
      template.name.toLowerCase().split(' ').some(w => w.length > 3 && rn.includes(w))
    );
    if (!recentlyEaten) score += 15;

    // Recipe match bonus
    const hasRecipe = recipes.some(r =>
      r.name.toLowerCase().includes(template.name.toLowerCase().split(' ')[0])
    );
    if (hasRecipe) score += 10;

    // Small random factor for variety
    score += Math.floor(Math.random() * 5);

    return {
      ...template,
      score: Math.min(100, score),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(s => ({
    id: nanoid(),
    name: s.name,
    reason: buildReason(s, dietStrategy),
    calories: s.calories,
    protein: s.protein,
    carbs: s.carbs,
    fat: s.fat,
    tags: s.tags,
    score: s.score,
  }));
}

/**
 * Quick suggestion based only on pantry contents.
 */
export function suggestFromPantry(pantryItems: PantryItem[], limit = 4): MealSuggestion[] {
  const pantryNames = pantryItems.map(p => p.name.toLowerCase());

  const matches = SUGGESTION_POOL
    .map(template => {
      const matchCount = template.ingredients.filter(ing =>
        pantryNames.some(pn => pn.includes(ing) || ing.includes(pn))
      ).length;
      return { ...template, matchCount, score: Math.round((matchCount / template.ingredients.length) * 100) };
    })
    .filter(m => m.matchCount >= 2)
    .sort((a, b) => b.matchCount - a.matchCount);

  return matches.slice(0, limit).map(m => ({
    id: nanoid(),
    name: m.name,
    reason: `Uses ${m.matchCount} items from your pantry`,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    tags: m.tags,
    score: m.score,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReason(template: SuggestionTemplate, strategy: DietStrategy): string {
  if (template.strategies.includes(strategy)) {
    const strategyLabel: Record<DietStrategy, string> = {
      balanced: 'Balanced Diet',
      'high-protein': 'High Protein',
      keto: 'Keto Diet',
      'plant-based': 'Plant-Based',
      performance: 'Performance',
    };
    return `Great for your ${strategyLabel[strategy]} strategy`;
  }
  return 'Based on your preferences';
}
