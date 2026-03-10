// ============================================================================
// MealQuest — Planner Store
// ============================================================================
// Manages daily meal planning with drag-and-drop reorder support.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { PlannedMeal, MealType } from '@/types';

interface PlannerState {
  plannedMeals: PlannedMeal[];
}

interface PlannerActions {
  addPlannedMeal: (meal: Omit<PlannedMeal, 'id' | 'completed'>) => PlannedMeal;
  updatePlannedMeal: (id: string, updates: Partial<PlannedMeal>) => void;
  deletePlannedMeal: (id: string) => void;
  toggleCompleted: (id: string) => void;
  getPlannedMealsByDate: (date: string) => PlannedMeal[];
  getPlannedMealsByType: (date: string, type: MealType) => PlannedMeal[];
  reorderMeals: (date: string, type: MealType, orderedIds: string[]) => void;
  clearDay: (date: string) => void;
  reset: () => void;
}

const initialState: PlannerState = {
  plannedMeals: [],
};

export const usePlannerStore = create<PlannerState & PlannerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addPlannedMeal: (data) => {
        const meal: PlannedMeal = { ...data, id: nanoid(), completed: false };
        set((state) => ({ plannedMeals: [...state.plannedMeals, meal] }));
        return meal;
      },

      updatePlannedMeal: (id, updates) =>
        set((state) => ({
          plannedMeals: state.plannedMeals.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deletePlannedMeal: (id) =>
        set((state) => ({
          plannedMeals: state.plannedMeals.filter((m) => m.id !== id),
        })),

      toggleCompleted: (id) =>
        set((state) => ({
          plannedMeals: state.plannedMeals.map((m) =>
            m.id === id ? { ...m, completed: !m.completed } : m
          ),
        })),

      getPlannedMealsByDate: (date) =>
        get().plannedMeals.filter((m) => m.date === date),

      getPlannedMealsByType: (date, type) =>
        get().plannedMeals.filter((m) => m.date === date && m.mealType === type),

      reorderMeals: (date, type, orderedIds) =>
        set((state) => {
          const otherMeals = state.plannedMeals.filter(
            (m) => m.date !== date || m.mealType !== type
          );
          const targetMeals = state.plannedMeals.filter(
            (m) => m.date === date && m.mealType === type
          );
          const reordered = orderedIds
            .map((id) => targetMeals.find((m) => m.id === id))
            .filter(Boolean) as PlannedMeal[];
          return { plannedMeals: [...otherMeals, ...reordered] };
        }),

      clearDay: (date) =>
        set((state) => ({
          plannedMeals: state.plannedMeals.filter((m) => m.date !== date),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-planner',
      version: 1,
    }
  )
);
