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
export type BadgeCategory = 'meals' | 'home-cook' | 'recipes' | 'streak' | 'level' | 'quests' | 'smart';

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

// ---------------------------------------------------------------------------
// Phase 3 — Intelligent Systems
// ---------------------------------------------------------------------------

/** Result of auto-estimating nutrition from a meal name + portion */
export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
  matchedFood?: string;
}

/** Portion descriptor used for meal recognition */
export type PortionSize = 'small' | 'medium' | 'large' | 'extra-large' | 'half' | 'double';

/** A smart meal suggestion */
export interface MealSuggestion {
  id: string;
  name: string;
  reason: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  score: number; // relevance score 0-100
}

/** A predicted grocery item */
export interface GroceryPrediction {
  name: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  estimatedDaysUntilOut: number;
  category?: string;
}

/** A nutrition insight generated from user data */
export interface NutritionInsight {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  icon: string;
  title: string;
  message: string;
  category: 'consistency' | 'macros' | 'hydration' | 'habits' | 'progress';
  generatedAt: string;
}

/** A detected habit pattern */
export interface HabitPattern {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  pattern: string;
  suggestion?: string;
  frequency: number; // how many times detected
  lastDetected: string;
}

/** Smart notification (scheduled/contextual) */
export interface SmartNotification {
  id: string;
  type: 'meal-reminder' | 'hydration' | 'grocery' | 'pantry-expiry' | 'insight';
  message: string;
  scheduledFor?: string; // ISO datetime
  dismissed: boolean;
  createdAt: string;
}

/** Daily nutrition score summary */
export interface DailyNutritionScore {
  date: string;
  score: number; // 0-100
  breakdown: {
    mealConsistency: number;   // 0-25
    nutritionBalance: number;  // 0-30
    hydration: number;         // 0-20
    sugarControl: number;      // 0-15
    homeCooked: number;        // 0-10
  };
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

/** Long-term trend data point */
export interface TrendDataPoint {
  date: string;
  value: number;
}

/** Monthly nutrition trend summary */
export interface MonthlyTrend {
  month: string; // YYYY-MM
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgWater: number;
  avgScore: number;
  totalMeals: number;
  consistency: number; // % of days with meals logged
}
