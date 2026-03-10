// ============================================================================
// MealQuest — Recipe Store
// ============================================================================
// Manages the recipe vault with search, favorites, and tags.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Recipe } from '@/types';
import { useXPStore } from './xpStore';
import { useQuestStore } from './questStore';
import { useNotificationStore } from './notificationStore';
import { useBadgeStore } from './badgeStore';

interface RecipeState {
  recipes: Recipe[];
}

interface RecipeActions {
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'isFavorite'>) => Recipe;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getById: (id: string) => Recipe | undefined;
  getFavorites: () => Recipe[];
  searchRecipes: (query: string) => Recipe[];
  getByTag: (tag: string) => Recipe[];
  reset: () => void;
}

const SEED_RECIPES: Recipe[] = [
  {
    id: 'seed-sinigang',
    name: 'Sinigang na Baboy',
    description: 'Savory Filipino pork sour soup with vegetables simmered in tangy tamarind broth.',
    ingredients: [
      { id: 'si-1', name: 'Pork ribs', quantity: 500, unit: 'g' },
      { id: 'si-2', name: 'Tamarind broth mix', quantity: 1, unit: 'piece' },
      { id: 'si-3', name: 'String beans (sitaw)', quantity: 100, unit: 'g' },
      { id: 'si-4', name: 'Taro root (gabi)', quantity: 150, unit: 'g' },
      { id: 'si-5', name: 'Kangkong leaves', quantity: 80, unit: 'g' },
      { id: 'si-6', name: 'Roma tomatoes', quantity: 2, unit: 'piece' },
      { id: 'si-7', name: 'White onion', quantity: 1, unit: 'piece' },
    ],
    instructions: [
      'Boil pork ribs in water until tender, skimming foam.',
      'Add onion and tomatoes; simmer 10 minutes.',
      'Stir in tamarind broth mix and adjust sourness to taste.',
      'Add taro and cook until softened, about 10 minutes.',
      'Add string beans and kangkong; cook 3–5 minutes.',
      'Season with fish sauce and serve hot with steamed rice.',
    ],
    calories: 320, protein: 28, carbs: 15, fat: 12,
    servings: 4, prepTime: 20, cookTime: 45,
    tags: ['filipino', 'soup', 'sour', 'pork'],
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-shanghai',
    name: 'Lumpiang Shanghai',
    description: 'Crispy Filipino pork spring rolls — perfect as an appetizer or party finger food.',
    ingredients: [
      { id: 'sh-1', name: 'Ground pork', quantity: 300, unit: 'g' },
      { id: 'sh-2', name: 'Lumpia wrappers', quantity: 20, unit: 'piece' },
      { id: 'sh-3', name: 'Carrots (grated)', quantity: 100, unit: 'g' },
      { id: 'sh-4', name: 'Onion (minced)', quantity: 1, unit: 'piece' },
      { id: 'sh-5', name: 'Garlic (minced)', quantity: 4, unit: 'piece' },
      { id: 'sh-6', name: 'Egg', quantity: 1, unit: 'piece' },
    ],
    instructions: [
      'Mix ground pork with carrot, onion, garlic, and egg.',
      'Season with soy sauce, salt, and pepper.',
      'Place a spoonful of filling on lumpia wrapper and roll tightly.',
      'Deep-fry at 350°F until golden and crispy, about 4–5 minutes.',
      'Drain on paper towels and serve with sweet chili dipping sauce.',
    ],
    calories: 280, protein: 18, carbs: 22, fat: 12,
    servings: 6, prepTime: 30, cookTime: 20,
    tags: ['filipino', 'fried', 'appetizer', 'pork'],
    isFavorite: false,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'seed-steak',
    name: 'Pan-Seared Ribeye Steak',
    description: 'Juicy restaurant-quality ribeye with herb butter, seared to perfection in a cast-iron pan.',
    ingredients: [
      { id: 'st-1', name: 'Ribeye steak (1-inch thick)', quantity: 300, unit: 'g' },
      { id: 'st-2', name: 'Unsalted butter', quantity: 2, unit: 'tbsp' },
      { id: 'st-3', name: 'Garlic cloves', quantity: 3, unit: 'piece' },
      { id: 'st-4', name: 'Fresh rosemary', quantity: 2, unit: 'piece' },
      { id: 'st-5', name: 'Fresh thyme', quantity: 3, unit: 'piece' },
    ],
    instructions: [
      'Pat steak dry and season generously with kosher salt and black pepper.',
      'Heat cast-iron pan over high heat until smoking hot.',
      'Sear steak 3–4 minutes per side for medium-rare.',
      'Add butter, smashed garlic, and herbs; baste steak continuously 1 minute.',
      'Rest on a cutting board 5 minutes before slicing against the grain.',
    ],
    calories: 450, protein: 45, carbs: 2, fat: 28,
    servings: 1, prepTime: 10, cookTime: 15,
    tags: ['beef', 'steak', 'keto', 'high-protein', 'grilled'],
    isFavorite: false,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'seed-tuna-pasta',
    name: 'Creamy Tuna Pasta',
    description: 'Rich and comforting pasta tossed in a creamy garlic-parmesan sauce with flaked tuna.',
    ingredients: [
      { id: 'tp-1', name: 'Penne pasta', quantity: 200, unit: 'g' },
      { id: 'tp-2', name: 'Canned tuna in oil', quantity: 2, unit: 'piece' },
      { id: 'tp-3', name: 'Heavy cream', quantity: 120, unit: 'ml' },
      { id: 'tp-4', name: 'Garlic (minced)', quantity: 4, unit: 'piece' },
      { id: 'tp-5', name: 'Parmesan (grated)', quantity: 40, unit: 'g' },
      { id: 'tp-6', name: 'Olive oil', quantity: 2, unit: 'tbsp' },
    ],
    instructions: [
      'Cook pasta according to package directions; reserve ½ cup pasta water before draining.',
      'Sauté garlic in olive oil over medium heat until fragrant.',
      'Add drained tuna and stir 1 minute.',
      'Pour in cream and simmer until slightly thickened, about 3 minutes.',
      'Toss in cooked pasta, adding pasta water gradually to loosen sauce.',
      'Remove from heat, fold in parmesan, and season with salt and black pepper.',
    ],
    calories: 520, protein: 32, carbs: 58, fat: 18,
    servings: 2, prepTime: 10, cookTime: 20,
    tags: ['pasta', 'seafood', 'tuna', 'cream', 'quick'],
    isFavorite: false,
    createdAt: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'seed-chicken-curry',
    name: 'Chicken Coconut Curry',
    description: 'Fragrant Thai-style chicken curry simmered in rich coconut milk with warm aromatic spices.',
    ingredients: [
      { id: 'cc-1', name: 'Chicken thighs (boneless)', quantity: 400, unit: 'g' },
      { id: 'cc-2', name: 'Coconut milk', quantity: 400, unit: 'ml' },
      { id: 'cc-3', name: 'Curry powder', quantity: 2, unit: 'tbsp' },
      { id: 'cc-4', name: 'Garlic (minced)', quantity: 4, unit: 'piece' },
      { id: 'cc-5', name: 'Fresh ginger (grated)', quantity: 1, unit: 'tbsp' },
      { id: 'cc-6', name: 'Onion (diced)', quantity: 1, unit: 'piece' },
      { id: 'cc-7', name: 'Potato (cubed)', quantity: 2, unit: 'piece' },
    ],
    instructions: [
      'Sauté onion, garlic, and ginger in oil until softened.',
      'Add curry powder and toast 1 minute, stirring constantly.',
      'Add chicken pieces and brown on all sides.',
      'Pour in coconut milk and add potato cubes.',
      'Simmer 25–30 minutes until potatoes are tender and sauce thickens.',
      'Season with salt, fish sauce, and a squeeze of lime juice.',
    ],
    calories: 380, protein: 35, carbs: 18, fat: 16,
    servings: 4, prepTime: 15, cookTime: 35,
    tags: ['curry', 'chicken', 'spicy'],
    isFavorite: false,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'seed-bibimbap',
    name: 'Bibimbap',
    description: 'Classic Korean mixed rice bowl layered with seasoned vegetables, beef, and a sunny-side up egg. Served with gochujang.',
    ingredients: [
      { id: 'bb-1', name: 'Cooked white rice', quantity: 1, unit: 'cup' },
      { id: 'bb-2', name: 'Ground beef', quantity: 150, unit: 'g' },
      { id: 'bb-3', name: 'Spinach (blanched)', quantity: 80, unit: 'g' },
      { id: 'bb-4', name: 'Bean sprouts', quantity: 60, unit: 'g' },
      { id: 'bb-5', name: 'Carrots (julienned)', quantity: 60, unit: 'g' },
      { id: 'bb-6', name: 'Egg', quantity: 1, unit: 'piece' },
      { id: 'bb-7', name: 'Gochujang paste', quantity: 1, unit: 'tbsp' },
      { id: 'bb-8', name: 'Sesame oil', quantity: 1, unit: 'tsp' },
    ],
    instructions: [
      'Season beef with soy sauce, garlic, sesame oil; cook until browned.',
      'Blanch spinach; squeeze dry and season with sesame oil and garlic.',
      'Blanch bean sprouts; season lightly with salt.',
      'Sauté julienned carrots with a pinch of salt until tender.',
      'Fry egg sunny-side up in a lightly oiled pan.',
      'Add rice to a hot stone bowl or regular bowl; fan toppings around the edge.',
      'Place egg on top and serve with gochujang sauce on the side.',
    ],
    calories: 490, protein: 22, carbs: 65, fat: 14,
    servings: 2, prepTime: 25, cookTime: 20,
    tags: ['korean', 'bibimbap', 'rice', 'healthy'],
    isFavorite: false,
    createdAt: '2026-01-06T00:00:00.000Z',
  },
  {
    id: 'seed-kimchi-fried-rice',
    name: 'Kimchi Fried Rice',
    description: 'Bold and smoky Korean fried rice packed with tangy kimchi and topped with a crispy fried egg.',
    ingredients: [
      { id: 'kf-1', name: 'Day-old cooked rice', quantity: 2, unit: 'cup' },
      { id: 'kf-2', name: 'Kimchi (chopped)', quantity: 150, unit: 'g' },
      { id: 'kf-3', name: 'Pork belly (sliced)', quantity: 100, unit: 'g' },
      { id: 'kf-4', name: 'Egg', quantity: 2, unit: 'piece' },
      { id: 'kf-5', name: 'Sesame oil', quantity: 1, unit: 'tsp' },
      { id: 'kf-6', name: 'Gochugaru (chili flakes)', quantity: 1, unit: 'tsp' },
      { id: 'kf-7', name: 'Green onions', quantity: 2, unit: 'piece' },
    ],
    instructions: [
      'Cook pork belly in a hot wok until crispy; set aside.',
      'In the same wok, stir-fry kimchi 3–4 minutes until slightly caramelized.',
      'Push to the side; add rice and press into wok to crisp up grains.',
      'Mix everything together; season with soy sauce and gochugaru.',
      'Drizzle sesame oil and garnish with sliced green onions.',
      'Fry eggs separately until edges are crispy; place on top of rice.',
    ],
    calories: 420, protein: 15, carbs: 62, fat: 14,
    servings: 2, prepTime: 10, cookTime: 15,
    tags: ['korean', 'kimchi', 'rice', 'spicy', 'quick'],
    isFavorite: false,
    createdAt: '2026-01-07T00:00:00.000Z',
  },
];

const initialState: RecipeState = {
  recipes: SEED_RECIPES,
};

export const useRecipeStore = create<RecipeState & RecipeActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addRecipe: (data) => {
        const recipe: Recipe = {
          ...data,
          id: nanoid(),
          isFavorite: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ recipes: [...state.recipes, recipe] }));

        // Gamification
        const { leveledUp, newLevel } = useXPStore.getState().awardXP(20, 'recipe', 'add-recipe');
        useQuestStore.getState().autoCompleteByTrigger('add-recipe');
        useNotificationStore.getState().push({
          message: `Recipe "${recipe.name}" saved to vault!`,
          xp: 20,
          tone: 'recipe',
        });
        if (leveledUp) {
          useNotificationStore.getState().push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
        }

        // Badge tracking
        useBadgeStore.getState().incrementRecipes();

        return recipe;
      },

      updateRecipe: (id, updates) =>
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),

      toggleFavorite: (id) => {
        const recipe = get().recipes.find((r) => r.id === id);
        if (!recipe) return;
        const nowFavorite = !recipe.isFavorite;
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, isFavorite: nowFavorite } : r
          ),
        }));
        if (nowFavorite) {
          useXPStore.getState().awardXP(5, 'recipe', 'favorite');
          useNotificationStore.getState().push({
            message: `"${recipe.name}" added to favorites!`,
            xp: 5,
            tone: 'recipe',
          });
        }
      },

      getById: (id) => get().recipes.find((r) => r.id === id),

      getFavorites: () => get().recipes.filter((r) => r.isFavorite),

      searchRecipes: (query) => {
        const lower = query.toLowerCase();
        return get().recipes.filter(
          (r) =>
            r.name.toLowerCase().includes(lower) ||
            r.tags.some((t) => t.toLowerCase().includes(lower)) ||
            r.ingredients.some((i) => i.name.toLowerCase().includes(lower))
        );
      },

      getByTag: (tag) =>
        get().recipes.filter((r) =>
          r.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        ),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-recipes',
      version: 2,
      migrate: (persisted: any, fromVersion: number) => {
        // Seed empty vaults that were created before seed data existed
        if (fromVersion < 2 && (!persisted?.recipes?.length)) {
          return { ...persisted, recipes: SEED_RECIPES };
        }
        return persisted;
      },
    }
  )
);
