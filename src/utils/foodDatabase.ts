// ============================================================================
// MealQuest — Food Database (Auto-Nutrition Estimation)
// ============================================================================
// Static lookup for common foods. Returns estimated macros per portion.

export interface FoodEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

/**
 * A curated database of common foods with nutrition per standard serving.
 * Grouped by category for easy lookup.
 */
const FOOD_DB: FoodEstimate[] = [
  // ── Proteins ──
  { name: 'grilled chicken breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { name: 'chicken breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { name: 'chicken thigh', calories: 209, protein: 26, carbs: 0, fat: 11, serving: '100g' },
  { name: 'salmon', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g' },
  { name: 'grilled salmon', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g' },
  { name: 'tuna', calories: 130, protein: 29, carbs: 0, fat: 1, serving: '100g' },
  { name: 'shrimp', calories: 85, protein: 20, carbs: 0, fat: 0.5, serving: '100g' },
  { name: 'ground beef', calories: 250, protein: 26, carbs: 0, fat: 15, serving: '100g' },
  { name: 'steak', calories: 271, protein: 26, carbs: 0, fat: 18, serving: '100g' },
  { name: 'turkey breast', calories: 135, protein: 30, carbs: 0, fat: 1, serving: '100g' },
  { name: 'pork chop', calories: 231, protein: 25, carbs: 0, fat: 14, serving: '100g' },
  { name: 'tofu', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, serving: '100g' },
  { name: 'tempeh', calories: 192, protein: 20, carbs: 8, fat: 11, serving: '100g' },
  { name: 'eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: '2 eggs' },
  { name: 'egg', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: '1 egg' },
  { name: 'scrambled eggs', calories: 182, protein: 12, carbs: 2, fat: 14, serving: '2 eggs' },
  { name: 'boiled egg', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: '1 egg' },

  // ── Grains & Carbs ──
  { name: 'rice', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, serving: '1 cup cooked' },
  { name: 'white rice', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, serving: '1 cup cooked' },
  { name: 'brown rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, serving: '1 cup cooked' },
  { name: 'pasta', calories: 220, protein: 8, carbs: 43, fat: 1.3, serving: '1 cup cooked' },
  { name: 'spaghetti', calories: 220, protein: 8, carbs: 43, fat: 1.3, serving: '1 cup cooked' },
  { name: 'bread', calories: 79, protein: 2.7, carbs: 15, fat: 1, serving: '1 slice' },
  { name: 'toast', calories: 79, protein: 2.7, carbs: 15, fat: 1, serving: '1 slice' },
  { name: 'oatmeal', calories: 154, protein: 5.4, carbs: 27, fat: 2.6, serving: '1 cup cooked' },
  { name: 'overnight oats', calories: 210, protein: 7, carbs: 36, fat: 5, serving: '1 cup' },
  { name: 'quinoa', calories: 222, protein: 8.1, carbs: 39, fat: 3.5, serving: '1 cup cooked' },
  { name: 'tortilla', calories: 120, protein: 3, carbs: 20, fat: 3, serving: '1 medium' },
  { name: 'bagel', calories: 270, protein: 10, carbs: 53, fat: 1.5, serving: '1 bagel' },
  { name: 'cereal', calories: 150, protein: 3, carbs: 33, fat: 1, serving: '1 cup' },
  { name: 'granola', calories: 210, protein: 5, carbs: 30, fat: 8, serving: '½ cup' },
  { name: 'pancakes', calories: 227, protein: 6, carbs: 28, fat: 10, serving: '2 medium' },
  { name: 'waffle', calories: 218, protein: 6, carbs: 25, fat: 11, serving: '1 waffle' },
  { name: 'potato', calories: 163, protein: 4.3, carbs: 37, fat: 0.2, serving: '1 medium' },
  { name: 'sweet potato', calories: 112, protein: 2, carbs: 26, fat: 0.1, serving: '1 medium' },

  // ── Salads & Vegetables ──
  { name: 'salad', calories: 120, protein: 3, carbs: 12, fat: 7, serving: '1 bowl' },
  { name: 'caesar salad', calories: 200, protein: 8, carbs: 10, fat: 14, serving: '1 bowl' },
  { name: 'greek salad', calories: 180, protein: 6, carbs: 12, fat: 13, serving: '1 bowl' },
  { name: 'grilled chicken salad', calories: 280, protein: 30, carbs: 12, fat: 13, serving: '1 bowl' },
  { name: 'broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving: '1 cup' },
  { name: 'spinach', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, serving: '1 cup raw' },
  { name: 'avocado', calories: 240, protein: 3, carbs: 13, fat: 22, serving: '1 whole' },
  { name: 'mixed vegetables', calories: 80, protein: 3, carbs: 15, fat: 0.5, serving: '1 cup' },

  // ── Fruits ──
  { name: 'apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 medium' },
  { name: 'banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 medium' },
  { name: 'orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, serving: '1 medium' },
  { name: 'strawberries', calories: 49, protein: 1, carbs: 12, fat: 0.5, serving: '1 cup' },
  { name: 'blueberries', calories: 85, protein: 1.1, carbs: 21, fat: 0.5, serving: '1 cup' },
  { name: 'grapes', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, serving: '1 cup' },
  { name: 'mango', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, serving: '1 cup sliced' },
  { name: 'watermelon', calories: 86, protein: 1.7, carbs: 22, fat: 0.4, serving: '2 cups cubed' },

  // ── Dairy ──
  { name: 'milk', calories: 149, protein: 8, carbs: 12, fat: 8, serving: '1 cup' },
  { name: 'yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: '1 cup greek' },
  { name: 'greek yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: '1 cup' },
  { name: 'cheese', calories: 113, protein: 7, carbs: 0.4, fat: 9, serving: '1 oz' },
  { name: 'cottage cheese', calories: 206, protein: 28, carbs: 6.1, fat: 9, serving: '1 cup' },
  { name: 'protein shake', calories: 200, protein: 25, carbs: 15, fat: 3, serving: '1 shake' },
  { name: 'whey protein', calories: 120, protein: 24, carbs: 3, fat: 1, serving: '1 scoop' },
  { name: 'smoothie', calories: 250, protein: 8, carbs: 45, fat: 5, serving: '1 large' },

  // ── Common Meals ──
  { name: 'burrito', calories: 500, protein: 22, carbs: 55, fat: 20, serving: '1 burrito' },
  { name: 'chicken burrito', calories: 520, protein: 28, carbs: 55, fat: 18, serving: '1 burrito' },
  { name: 'burger', calories: 540, protein: 28, carbs: 40, fat: 30, serving: '1 burger' },
  { name: 'cheeseburger', calories: 590, protein: 30, carbs: 42, fat: 33, serving: '1 burger' },
  { name: 'pizza', calories: 285, protein: 12, carbs: 36, fat: 10, serving: '1 slice' },
  { name: 'sandwich', calories: 350, protein: 18, carbs: 35, fat: 15, serving: '1 sandwich' },
  { name: 'chicken sandwich', calories: 400, protein: 28, carbs: 35, fat: 16, serving: '1 sandwich' },
  { name: 'wrap', calories: 320, protein: 16, carbs: 38, fat: 12, serving: '1 wrap' },
  { name: 'tacos', calories: 340, protein: 15, carbs: 30, fat: 18, serving: '2 tacos' },
  { name: 'sushi', calories: 350, protein: 14, carbs: 50, fat: 8, serving: '8 pieces' },
  { name: 'stir fry', calories: 350, protein: 22, carbs: 30, fat: 15, serving: '1 plate' },
  { name: 'chicken stir fry', calories: 380, protein: 30, carbs: 28, fat: 14, serving: '1 plate' },
  { name: 'soup', calories: 150, protein: 8, carbs: 18, fat: 5, serving: '1 bowl' },
  { name: 'chicken soup', calories: 180, protein: 12, carbs: 15, fat: 6, serving: '1 bowl' },
  { name: 'fried rice', calories: 340, protein: 10, carbs: 48, fat: 12, serving: '1 cup' },
  { name: 'ramen', calories: 450, protein: 18, carbs: 55, fat: 16, serving: '1 bowl' },
  { name: 'mac and cheese', calories: 380, protein: 15, carbs: 42, fat: 17, serving: '1 cup' },
  { name: 'grilled cheese', calories: 366, protein: 13, carbs: 28, fat: 23, serving: '1 sandwich' },
  { name: 'hot dog', calories: 290, protein: 11, carbs: 24, fat: 17, serving: '1 hot dog' },
  { name: 'fish and chips', calories: 550, protein: 22, carbs: 50, fat: 28, serving: '1 plate' },
  { name: 'noodles', calories: 380, protein: 14, carbs: 55, fat: 10, serving: '1 bowl' },
  { name: 'udon', calories: 400, protein: 15, carbs: 60, fat: 9, serving: '1 bowl' },
  { name: 'pad thai', calories: 450, protein: 20, carbs: 50, fat: 18, serving: '1 plate' },
  { name: 'dumplings', calories: 310, protein: 16, carbs: 35, fat: 12, serving: '6 pieces' },
  { name: 'spring rolls', calories: 260, protein: 8, carbs: 30, fat: 12, serving: '2 rolls' },
  { name: 'nachos', calories: 490, protein: 12, carbs: 52, fat: 28, serving: '1 serving' },
  { name: 'quesadilla', calories: 430, protein: 20, carbs: 38, fat: 22, serving: '1 quesadilla' },
  { name: 'chili', calories: 330, protein: 20, carbs: 30, fat: 14, serving: '1 bowl' },
  { name: 'lasagna', calories: 400, protein: 22, carbs: 42, fat: 16, serving: '1 piece' },
  { name: 'fried chicken', calories: 400, protein: 31, carbs: 14, fat: 24, serving: '2 pieces' },
  { name: 'chicken wings', calories: 360, protein: 30, carbs: 12, fat: 22, serving: '6 wings' },
  { name: 'pho', calories: 420, protein: 24, carbs: 50, fat: 12, serving: '1 bowl' },
  { name: 'bibimbap', calories: 490, protein: 24, carbs: 60, fat: 14, serving: '1 bowl' },

  // ── Filipino Dishes ──
  { name: 'adobo', calories: 370, protein: 28, carbs: 8, fat: 24, serving: '1 cup' },
  { name: 'chicken adobo', calories: 340, protein: 30, carbs: 7, fat: 21, serving: '1 cup' },
  { name: 'pork adobo', calories: 420, protein: 26, carbs: 8, fat: 30, serving: '1 cup' },
  { name: 'sinigang', calories: 280, protein: 22, carbs: 18, fat: 12, serving: '1 bowl' },
  { name: 'sinigang na baboy', calories: 310, protein: 20, carbs: 18, fat: 16, serving: '1 bowl' },
  { name: 'sinigang na hipon', calories: 220, protein: 24, carbs: 16, fat: 8, serving: '1 bowl' },
  { name: 'kare kare', calories: 450, protein: 30, carbs: 20, fat: 28, serving: '1 bowl' },
  { name: 'lechon', calories: 480, protein: 32, carbs: 5, fat: 36, serving: '100g' },
  { name: 'lechon kawali', calories: 510, protein: 28, carbs: 12, fat: 38, serving: '1 serving' },
  { name: 'sisig', calories: 420, protein: 28, carbs: 10, fat: 30, serving: '1 sizzling plate' },
  { name: 'tinola', calories: 240, protein: 22, carbs: 12, fat: 10, serving: '1 bowl' },
  { name: 'bulalo', calories: 520, protein: 34, carbs: 14, fat: 34, serving: '1 bowl' },
  { name: 'menudo', calories: 380, protein: 26, carbs: 22, fat: 20, serving: '1 cup' },
  { name: 'caldereta', calories: 410, protein: 28, carbs: 22, fat: 24, serving: '1 cup' },
  { name: 'bistek', calories: 320, protein: 28, carbs: 10, fat: 18, serving: '1 serving' },
  { name: 'paksiw', calories: 260, protein: 24, carbs: 8, fat: 14, serving: '1 cup' },
  { name: 'dinuguan', calories: 380, protein: 26, carbs: 10, fat: 26, serving: '1 cup' },
  { name: 'pinakbet', calories: 200, protein: 12, carbs: 18, fat: 10, serving: '1 cup' },
  { name: 'chopsuey', calories: 220, protein: 14, carbs: 20, fat: 10, serving: '1 cup' },
  { name: 'pancit', calories: 340, protein: 16, carbs: 46, fat: 10, serving: '1 cup' },
  { name: 'pancit canton', calories: 360, protein: 16, carbs: 48, fat: 12, serving: '1 cup' },
  { name: 'pancit bihon', calories: 300, protein: 14, carbs: 46, fat: 8, serving: '1 cup' },
  { name: 'lumpia', calories: 260, protein: 12, carbs: 28, fat: 12, serving: '2 pieces' },
  { name: 'lumpiang shanghai', calories: 220, protein: 10, carbs: 24, fat: 10, serving: '3 pieces' },
  { name: 'tokwa at baboy', calories: 320, protein: 22, carbs: 8, fat: 22, serving: '1 serving' },
  { name: 'tapa', calories: 290, protein: 28, carbs: 6, fat: 16, serving: '100g' },
  { name: 'longganisa', calories: 340, protein: 16, carbs: 12, fat: 26, serving: '2 pieces' },
  { name: 'tocino', calories: 310, protein: 18, carbs: 16, fat: 20, serving: '100g' },
  { name: 'daing na bangus', calories: 270, protein: 28, carbs: 2, fat: 16, serving: '1 fillet' },
  { name: 'bangus', calories: 180, protein: 22, carbs: 0, fat: 10, serving: '100g' },
  { name: 'tilapia', calories: 128, protein: 26, carbs: 0, fat: 2.7, serving: '100g' },
  { name: 'pork sinigang', calories: 310, protein: 20, carbs: 18, fat: 16, serving: '1 bowl' },
  { name: 'arroz caldo', calories: 290, protein: 16, carbs: 40, fat: 8, serving: '1 bowl' },
  { name: 'goto', calories: 310, protein: 18, carbs: 42, fat: 8, serving: '1 bowl' },
  { name: 'champorado', calories: 280, protein: 5, carbs: 52, fat: 6, serving: '1 bowl' },
  { name: 'sinangag', calories: 240, protein: 5, carbs: 44, fat: 6, serving: '1 cup' },
  { name: 'ensaladang talong', calories: 120, protein: 4, carbs: 14, fat: 6, serving: '1 cup' },
  { name: 'monggos', calories: 260, protein: 16, carbs: 36, fat: 6, serving: '1 cup' },
  { name: 'nilaga', calories: 300, protein: 24, carbs: 20, fat: 14, serving: '1 bowl' },

  // ── Filipino Snacks & Desserts ──
  { name: 'halo halo', calories: 380, protein: 6, carbs: 70, fat: 10, serving: '1 large' },
  { name: 'leche flan', calories: 290, protein: 8, carbs: 42, fat: 10, serving: '1 slice' },
  { name: 'biko', calories: 320, protein: 4, carbs: 60, fat: 8, serving: '1 piece' },
  { name: 'suman', calories: 220, protein: 3, carbs: 44, fat: 4, serving: '1 piece' },
  { name: 'kakanin', calories: 250, protein: 4, carbs: 50, fat: 5, serving: '1 piece' },
  { name: 'puto', calories: 150, protein: 3, carbs: 30, fat: 2.5, serving: '2 pieces' },
  { name: 'bibingka', calories: 310, protein: 6, carbs: 55, fat: 8, serving: '1 piece' },
  { name: 'palitaw', calories: 160, protein: 2, carbs: 32, fat: 3, serving: '2 pieces' },
  { name: 'turon', calories: 200, protein: 2, carbs: 38, fat: 5, serving: '1 piece' },
  { name: 'banana cue', calories: 190, protein: 1.5, carbs: 38, fat: 4, serving: '1 piece' },
  { name: 'camote cue', calories: 180, protein: 2, carbs: 38, fat: 3, serving: '1 piece' },
  { name: 'polvoron', calories: 140, protein: 2, carbs: 20, fat: 6, serving: '1 piece' },
  { name: 'sans rival', calories: 380, protein: 6, carbs: 42, fat: 22, serving: '1 slice' },
  { name: 'ube halaya', calories: 260, protein: 4, carbs: 52, fat: 5, serving: '½ cup' },
  { name: 'maja blanca', calories: 240, protein: 3, carbs: 46, fat: 6, serving: '1 square' },
  { name: 'sapin sapin', calories: 280, protein: 3, carbs: 58, fat: 5, serving: '1 piece' },

  // ── Snacks & Sweets ──
  { name: 'protein bar', calories: 200, protein: 20, carbs: 22, fat: 7, serving: '1 bar' },
  { name: 'granola bar', calories: 130, protein: 3, carbs: 20, fat: 5, serving: '1 bar' },
  { name: 'trail mix', calories: 283, protein: 8, carbs: 25, fat: 18, serving: '½ cup' },
  { name: 'nuts', calories: 170, protein: 5, carbs: 6, fat: 15, serving: '1 oz' },
  { name: 'almonds', calories: 164, protein: 6, carbs: 6, fat: 14, serving: '1 oz' },
  { name: 'peanut butter', calories: 190, protein: 7, carbs: 7, fat: 16, serving: '2 tbsp' },
  { name: 'chips', calories: 152, protein: 2, carbs: 15, fat: 10, serving: '1 oz' },
  { name: 'popcorn', calories: 106, protein: 3, carbs: 19, fat: 1.2, serving: '3 cups' },
  { name: 'chocolate', calories: 155, protein: 1.5, carbs: 17, fat: 9, serving: '1 oz' },
  { name: 'ice cream', calories: 267, protein: 4.6, carbs: 32, fat: 14, serving: '1 cup' },
  { name: 'cookie', calories: 160, protein: 2, carbs: 22, fat: 7, serving: '2 cookies' },
  { name: 'brownie', calories: 230, protein: 3, carbs: 30, fat: 11, serving: '1 piece' },
  { name: 'cake', calories: 350, protein: 4, carbs: 50, fat: 15, serving: '1 slice' },
  { name: 'donut', calories: 260, protein: 3, carbs: 30, fat: 14, serving: '1 donut' },
  { name: 'muffin', calories: 340, protein: 5, carbs: 48, fat: 14, serving: '1 muffin' },
  { name: 'candy', calories: 120, protein: 1, carbs: 24, fat: 3, serving: '1 serving' },
  { name: 'pie', calories: 300, protein: 3, carbs: 40, fat: 14, serving: '1 slice' },

  // ── Beverages ──
  { name: 'coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, serving: '1 cup black' },
  { name: 'latte', calories: 190, protein: 10, carbs: 18, fat: 7, serving: '16 oz' },
  { name: 'cappuccino', calories: 120, protein: 8, carbs: 10, fat: 4, serving: '12 oz' },
  { name: 'orange juice', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, serving: '1 cup' },
  { name: 'soda', calories: 140, protein: 0, carbs: 39, fat: 0, serving: '12 oz can' },
  { name: 'beer', calories: 153, protein: 1.6, carbs: 13, fat: 0, serving: '12 oz' },
  { name: 'wine', calories: 125, protein: 0.1, carbs: 4, fat: 0, serving: '5 oz glass' },
  { name: 'tea', calories: 2, protein: 0, carbs: 0.5, fat: 0, serving: '1 cup' },
];

/** Sweet/dessert category keywords */
const SWEET_KEYWORDS = [
  // English sweets & desserts
  'ice cream', 'cookie', 'brownie', 'cake', 'donut', 'muffin',
  'candy', 'pie', 'chocolate', 'dessert', 'pastry', 'sweet',
  'cupcake', 'fudge', 'cheesecake', 'pudding', 'gelato',
  'waffle', 'pancakes', 'syrup', 'sugar', 'tart',
  'sorbet', 'popsicle', 'lollipop', 'gummy', 'caramel',
  'marshmallow', 'truffle', 'eclair', 'crepe', 'parfait',
  'tiramisu', 'mousse', 'churros', 'funnel cake',
  // Filipino sweets & desserts
  'halo halo', 'leche flan', 'biko', 'suman', 'kakanin',
  'puto', 'bibingka', 'palitaw', 'turon', 'banana cue',
  'camote cue', 'polvoron', 'sans rival', 'ube halaya',
  'maja blanca', 'sapin sapin', 'champorado', 'espasol',
  'kutsinta', 'binignit', 'ginataan', 'yema', 'silvanas',
];

/** Portion multipliers */
const PORTION_MAP: Record<string, number> = {
  small: 0.7,
  medium: 1.0,
  large: 1.4,
  'extra large': 1.8,
  half: 0.5,
  double: 2.0,
};

/**
 * Search the food database for a food name.
 * Returns the closest match or null.
 */
export function lookupFood(query: string): FoodEstimate | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Exact match
  const exact = FOOD_DB.find((f) => f.name === q);
  if (exact) return exact;

  // Contains match
  const contains = FOOD_DB.find((f) => q.includes(f.name) || f.name.includes(q));
  if (contains) return contains;

  // Word overlap scoring
  const queryWords = q.split(/\s+/);
  let best: FoodEstimate | null = null;
  let bestScore = 0;

  for (const food of FOOD_DB) {
    const foodWords = food.name.split(/\s+/);
    const overlap = queryWords.filter((w) =>
      foodWords.some((fw) => fw.includes(w) || w.includes(fw))
    ).length;
    const score = overlap / Math.max(queryWords.length, foodWords.length);
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      best = food;
    }
  }

  return best;
}

/**
 * Estimate nutrition from a food name and optional portion size.
 * Applies portion multiplier if recognized.
 */
export function estimateNutrition(
  foodName: string,
  portion: string = 'medium'
): FoodEstimate | null {
  const food = lookupFood(foodName);
  if (!food) return null;

  const portionLower = portion.toLowerCase().trim();
  const multiplier = PORTION_MAP[portionLower] ?? 1.0;

  return {
    name: food.name,
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    serving: `${portion} (${food.serving})`,
  };
}

/**
 * Check if a food name is a sweet/dessert.
 */
export function isSweet(foodName: string): boolean {
  const q = foodName.toLowerCase();
  return SWEET_KEYWORDS.some((kw) => q.includes(kw));
}

/**
 * Get food suggestions based on a partial query (for autocomplete).
 */
export function suggestFoods(query: string, limit: number = 8): FoodEstimate[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return FOOD_DB
    .filter((f) => f.name.includes(q))
    .slice(0, limit);
}

/**
 * Get all available food names for reference.
 */
export function getAllFoodNames(): string[] {
  return [...new Set(FOOD_DB.map((f) => f.name))];
}
