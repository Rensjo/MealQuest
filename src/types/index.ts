// ============================================================================
// MealQuest — Core Type Definitions
// ============================================================================

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type FoodSource =
  | 'home-cooked'
  | 'fast-food'
  | 'dine-out'
  | 'street-food'
  | 'processed';
export const FOOD_SOURCES: FoodSource[] = ['home-cooked', 'fast-food', 'dine-out', 'street-food', 'processed'];

export type DietStrategy =
  | 'balanced'
  | 'high-protein'
  | 'keto'
  | 'plant-based'
  | 'performance';
export const DIET_STRATEGIES: DietStrategy[] = ['balanced', 'high-protein', 'keto', 'plant-based', 'performance'];

export type SkillTier =
  | 'novice-eater'
  | 'healthy-eater'
  | 'meal-planner'
  | 'nutrition-strategist'
  | 'elite-fuel-master';

export type StreakType = 'breakfast' | 'hydration' | 'home-cooked';

export type MissionStatus = 'active' | 'completed' | 'expired';

export type EnergySource = 'balanced' | 'fast-food' | 'skipped';

export type BossStatus = 'active' | 'victory' | 'defeat';

export type UnitType = 'g' | 'kg' | 'ml' | 'L' | 'oz' | 'lb' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'serving';
export const UNIT_TYPES: UnitType[] = ['g', 'kg', 'ml', 'L', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'piece', 'serving'];

// ---------------------------------------------------------------------------
// Core Data Models
// ---------------------------------------------------------------------------

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity: number;
}

export interface MealEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: MealType;
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // in ml
  foodSource: FoodSource; // replaces boolean isHomeCooked
  isHomeCooked: boolean; // kept for backwards compat
  isBalanced: boolean;
  isLiquidLog?: boolean; // true for water-tracker / drink entries
  notes?: string;
  createdAt: string; // ISO datetime
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
}

export type PantryItemSource = 'manual' | 'grocery-sync' | 'meal-sync';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  category?: string;
  expiryDate?: string;
  shelfLifeDays?: number;
  lowStockThreshold?: number;
  source?: PantryItemSource;
  lastUpdatedAt?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  store?: string;
  price?: number;
  isPurchased: boolean;
  purchasedAt?: string;
  category?: string;
  scheduledDate?: string; // ISO date string for scheduled grocery trip
  priority?: 'low' | 'medium' | 'high';
  addToPantryOnPurchase?: boolean;
}

export interface GrocerySchedule {
  nextDate: string;
  cadenceDays: number;
  label?: string;
  reminderDaysBefore: number;
}

export interface NutritionGoal {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  water: number; // ml
}

// ---------------------------------------------------------------------------
// Gamification Models
// ---------------------------------------------------------------------------

export interface XPRecord {
  id: string;
  date: string;
  source: string;
  xpAmount: number;
  description?: string;
}

export interface StreakRecord {
  type: StreakType;
  current: number;
  longest: number;
  lastDate: string; // last date the streak was maintained
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  category: string;
  date: string;
  /** Trigger key for auto-completion when a matching store action fires */
  triggerType?: string;
}

export interface WeeklyBoss {
  id: string;
  name: string;
  description: string;
  weekStart: string;
  status: BossStatus;
  conditions: BossCondition[];
  xpReward: number;
  badgeReward?: string;
}

export interface BossCondition {
  id: string;
  label: string;
  met: boolean;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BadgeCategory = 'meals' | 'home-cook' | 'recipes' | 'streak' | 'level' | 'quests';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  category: BadgeCategory;
  xpReward: number;
  requirement: number;
  progress: number;
  unlockedAt?: string;
}

export interface CharacterEnergy {
  current: number;
  max: number;
  history: EnergyEntry[];
}

export interface EnergyEntry {
  date: string;
  source: EnergySource;
  delta: number;
}

export interface SkillTreeNode {
  id: string;
  tier: SkillTier;
  name: string;
  description: string;
  xpRequired: number;
  isUnlocked: boolean;
  perks: string[];
}

export interface MealPrepSession {
  id: string;
  date: string; // Sunday date
  mealsPrepped: number;
  xpEarned: number;
  recipes: string[]; // recipe IDs
}

// ---------------------------------------------------------------------------
// Planner Models
// ---------------------------------------------------------------------------

export interface PlannedMeal {
  id: string;
  date: string;
  mealType: MealType;
  recipeId?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Analytics Models
// ---------------------------------------------------------------------------

export interface DailyNutritionSummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  mealsLogged: number;
  xpEarned: number;
}

export interface WeeklyReviewData {
  weekStart: string;
  weekEnd: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgWater: number;
  totalXP: number;
  streaksActive: number;
  missionsCompleted: number;
  bossDefeated: boolean;
  grade: string; // A, B, C, D, F
}

// ---------------------------------------------------------------------------
// Grocery Quest
// ---------------------------------------------------------------------------

export interface GroceryQuest {
  id: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  completed: boolean;
  weekStart: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AppSettings {
  dietStrategy: DietStrategy;
  nutritionGoals: NutritionGoal;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  username: string;
}

// ---------------------------------------------------------------------------
// Gamification State
// ---------------------------------------------------------------------------

export interface GameState {
  xp: number;
  level: number;
  totalXP: number;
  streaks: StreakRecord[];
  badges: Badge[];
  energy: CharacterEnergy;
  skillTree: SkillTreeNode[];
  currentTier: SkillTier;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  type: 'xp' | 'level-up' | 'badge' | 'streak' | 'boss' | 'mission' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
