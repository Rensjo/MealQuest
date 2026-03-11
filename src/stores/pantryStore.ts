// ============================================================================
// MealQuest - Pantry Store
// ============================================================================
// Manages pantry inventory with low-stock tracking and grocery sync.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { GroceryItem, PantryItem, RecipeIngredient } from '@/types';
import { todayISO } from '@/utils/date';
import { useXPStore } from './xpStore';
import { useQuestStore } from './questStore';
import { useNotificationStore } from './notificationStore';

interface PantryState {
  items: PantryItem[];
}

interface PantryActions {
  addItem: (item: Omit<PantryItem, 'id'>) => PantryItem;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  deleteItem: (id: string) => void;
  consumeItem: (id: string, quantity: number) => void;
  consumeRecipeIngredients: (ingredients: RecipeIngredient[]) => { matched: number; total: number };
  restockItem: (id: string, quantity: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  upsertFromGrocery: (item: Pick<GroceryItem, 'name' | 'quantity' | 'unit' | 'category'>) => PantryItem;
  getLowStockItems: () => PantryItem[];
  getExpiringSoon: (withinDays?: number) => PantryItem[];
  getByCategory: (category: string) => PantryItem[];
  reset: () => void;
}

const initialState: PantryState = {
  items: [],
};

function computeExpiryDate(expiryDate?: string, shelfLifeDays?: number): string | undefined {
  if (expiryDate) return expiryDate;
  if (!shelfLifeDays || shelfLifeDays <= 0) return undefined;
  const d = new Date(`${todayISO()}T12:00:00`);
  d.setDate(d.getDate() + shelfLifeDays);
  return d.toISOString().split('T')[0];
}

function mergePantryItem(base: PantryItem, updates: Partial<PantryItem>): PantryItem {
  const merged = {
    ...base,
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
  };

  return {
    ...merged,
    expiryDate: computeExpiryDate(merged.expiryDate, merged.shelfLifeDays),
  };
}

export const usePantryStore = create<PantryState & PantryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (data) => {
        const item: PantryItem = {
          ...data,
          id: nanoid(),
          expiryDate: computeExpiryDate(data.expiryDate, data.shelfLifeDays),
          source: data.source ?? 'manual',
          lastUpdatedAt: new Date().toISOString(),
        };
        set((state) => ({ items: [...state.items, item] }));

        // Gamification — only manual additions (not grocery syncs)
        if ((data.source ?? 'manual') === 'manual') {
          const { leveledUp, newLevel } = useXPStore.getState().awardXP(5, 'pantry', 'add-item');
          useQuestStore.getState().autoCompleteByTrigger('add-pantry');
          useNotificationStore.getState().push({
            message: `"${item.name}" added to pantry`,
            xp: 5,
            tone: 'pantry',
          });
          if (leveledUp) {
            useNotificationStore.getState().push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
          }
        }

        return item;
      },

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? mergePantryItem(item, updates) : item
          ),
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      consumeItem: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.max(0, item.quantity - quantity),
                  lastUpdatedAt: new Date().toISOString(),
                }
              : item
          ),
        })),

      consumeRecipeIngredients: (ingredients) => {
        let matched = 0;
        const items = get().items;
        for (const ing of ingredients) {
          const norm = ing.name.trim().toLowerCase();
          const match = items.find(
            (p) => p.name.trim().toLowerCase() === norm || p.name.trim().toLowerCase().includes(norm) || norm.includes(p.name.trim().toLowerCase()),
          );
          if (match && match.quantity > 0) {
            get().consumeItem(match.id, ing.quantity);
            matched++;
          }
        }
        return { matched, total: ingredients.length };
      },

      restockItem: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  lastUpdatedAt: new Date().toISOString(),
                }
              : item
          ),
        })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.max(0, quantity),
                  lastUpdatedAt: new Date().toISOString(),
                }
              : item
          ),
        })),

      upsertFromGrocery: (groceryItem) => {
        const normalized = groceryItem.name.trim().toLowerCase();
        const existing = get().items.find(
          (item) => item.name.trim().toLowerCase() === normalized && item.unit === groceryItem.unit
        );

        if (existing) {
          const updated: PantryItem = {
            ...existing,
            quantity: existing.quantity + groceryItem.quantity,
            category: existing.category ?? groceryItem.category,
            source: 'grocery-sync',
            lastUpdatedAt: new Date().toISOString(),
          };
          set((state) => ({
            items: state.items.map((item) => (item.id === existing.id ? updated : item)),
          }));
          return updated;
        }

        const pantryItem: PantryItem = {
          id: nanoid(),
          name: groceryItem.name,
          quantity: groceryItem.quantity,
          unit: groceryItem.unit,
          category: groceryItem.category,
          lowStockThreshold: groceryItem.quantity > 1 ? Math.max(1, Math.round(groceryItem.quantity * 0.25)) : 1,
          source: 'grocery-sync',
          lastUpdatedAt: new Date().toISOString(),
        };
        set((state) => ({ items: [...state.items, pantryItem] }));
        return pantryItem;
      },

      getLowStockItems: () =>
        get().items.filter((item) => {
          const threshold = item.lowStockThreshold ?? 2;
          return item.quantity <= threshold;
        }),

      getExpiringSoon: (withinDays = 3) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + withinDays);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        return get().items.filter((item) => item.expiryDate && item.expiryDate <= cutoffStr);
      },

      getByCategory: (category) =>
        get().items.filter((item) => item.category === category),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-pantry',
      version: 1,
    }
  )
);
