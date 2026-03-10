// ============================================================================
// MealQuest - Grocery Store
// ============================================================================
// Manages the grocery list, schedule, and pantry sync on purchase.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { GroceryItem, GrocerySchedule } from '@/types';
import { todayISO } from '@/utils/date';
import { usePantryStore } from './pantryStore';
import { useXPStore } from './xpStore';
import { useQuestStore } from './questStore';
import { useNotificationStore } from './notificationStore';

interface GroceryState {
  items: GroceryItem[];
  schedule: GrocerySchedule;
}

interface GroceryActions {
  addItem: (item: Omit<GroceryItem, 'id' | 'isPurchased' | 'purchasedAt'>) => GroceryItem;
  updateItem: (id: string, updates: Partial<GroceryItem>) => void;
  deleteItem: (id: string) => void;
  togglePurchased: (id: string) => void;
  completeBulk: () => boolean;
  clearPurchased: () => void;
  getByStore: (store: string) => GroceryItem[];
  getItemsForDate: (date: string) => GroceryItem[];
  getTotalCost: () => number;
  getPurchasedCount: () => number;
  updateSchedule: (updates: Partial<GrocerySchedule>) => void;
  snoozeSchedule: (days: number) => void;
  reset: () => void;
}

const initialState: GroceryState = {
  items: [],
  schedule: {
    nextDate: todayISO(),
    cadenceDays: 7,
    label: 'Weekly grocery run',
    reminderDaysBefore: 2,
  },
};

function shiftISODate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const useGroceryStore = create<GroceryState & GroceryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (data) => {
        const item: GroceryItem = {
          ...data,
          id: nanoid(),
          isPurchased: false,
          purchasedAt: undefined,
          scheduledDate: data.scheduledDate ?? get().schedule.nextDate,
          addToPantryOnPurchase: data.addToPantryOnPurchase ?? true,
        };
        set((state) => ({ items: [...state.items, item] }));

        // Gamification
        const { leveledUp, newLevel } = useXPStore.getState().awardXP(5, 'grocery', 'add-item');
        useQuestStore.getState().autoCompleteByTrigger('add-grocery');
        useNotificationStore.getState().push({
          message: `"${item.name}" added to grocery list`,
          xp: 5,
          tone: 'grocery',
        });
        if (leveledUp) {
          useNotificationStore.getState().push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
        }

        return item;
      },

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      togglePurchased: (id) => {
        const item = get().items.find((entry) => entry.id === id);
        if (!item) return;

        const nextPurchased = !item.isPurchased;
        const updated = {
          ...item,
          isPurchased: nextPurchased,
          purchasedAt: nextPurchased ? new Date().toISOString() : undefined,
        };

        set((state) => ({
          items: state.items.map((entry) => (entry.id === id ? updated : entry)),
        }));

        if (nextPurchased && updated.addToPantryOnPurchase) {
          usePantryStore.getState().upsertFromGrocery({
            name: updated.name,
            quantity: updated.quantity,
            unit: updated.unit,
            category: updated.category,
          });
        }

        // Gamification — only when marking as purchased
        if (nextPurchased) {
          const { leveledUp, newLevel } = useXPStore.getState().awardXP(8, 'grocery', 'purchased-item');
          useQuestStore.getState().autoCompleteByTrigger('purchase-grocery');
          useNotificationStore.getState().push({
            message: `"${updated.name}" purchased`,
            xp: 8,
            tone: 'grocery',
          });
          if (leveledUp) {
            useNotificationStore.getState().push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
          }

          // Auto-check if all items now purchased → bulk bonus
          const allItems = get().items;
          if (allItems.length > 0 && allItems.every((i) => i.id === id || i.isPurchased)) {
            get().completeBulk();
          }
        }
      },

      completeBulk: () => {
        const items = get().items;
        if (items.length === 0 || !items.every((i) => i.isPurchased)) return false;

        const { leveledUp, newLevel } = useXPStore.getState().awardXP(25, 'grocery', 'complete-list');
        useQuestStore.getState().autoCompleteByTrigger('complete-grocery-list');
        useNotificationStore.getState().push({
          message: 'Entire grocery list completed!',
          xp: 25,
          tone: 'grocery',
        });
        if (leveledUp) {
          useNotificationStore.getState().push({ message: `Level Up! You reached level ${newLevel}!`, tone: 'level' });
        }
        return true;
      },

      clearPurchased: () =>
        set((state) => ({
          items: state.items.filter((item) => !item.isPurchased),
        })),

      getByStore: (store) =>
        get().items.filter((item) => item.store === store),

      getItemsForDate: (date) =>
        get().items.filter((item) => item.scheduledDate === date),

      getTotalCost: () =>
        get().items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),

      getPurchasedCount: () =>
        get().items.filter((item) => item.isPurchased).length,

      updateSchedule: (updates) =>
        set((state) => ({
          schedule: {
            ...state.schedule,
            ...updates,
          },
        })),

      snoozeSchedule: (days) =>
        set((state) => {
          const previousDate = state.schedule.nextDate;
          const nextDate = shiftISODate(previousDate, days);
          return {
            schedule: {
              ...state.schedule,
              nextDate,
            },
            items: state.items.map((item) =>
              !item.isPurchased && item.scheduledDate === previousDate
                ? { ...item, scheduledDate: nextDate }
                : item
            ),
          };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-grocery',
      version: 1,
    }
  )
);
