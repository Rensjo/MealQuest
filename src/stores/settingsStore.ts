// ============================================================================
// MealQuest — Settings Store
// ============================================================================
// Application settings and user preferences.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, DietStrategy, NutritionGoal } from '@/types';
import { DIET_GOAL_PRESETS } from '@/utils/gamification';
import { useNutritionStore } from './nutritionStore';

interface SettingsState extends AppSettings {}

interface SettingsActions {
  setDietStrategy: (strategy: DietStrategy) => void;
  setNutritionGoals: (goals: NutritionGoal) => void;
  toggleSound: () => void;
  toggleAnimations: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setUsername: (name: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  dietStrategy: 'balanced',
  nutritionGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    water: 2500,
  },
  soundEnabled: true,
  animationsEnabled: true,
  theme: 'dark',
  username: 'Adventurer',
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setDietStrategy: (strategy) => {
        const preset = DIET_GOAL_PRESETS[strategy];
        set({ dietStrategy: strategy, nutritionGoals: preset });
        // Sync the live nutrition tracking goals
        useNutritionStore.getState().setGoals(preset);
      },

      setNutritionGoals: (goals) => set({ nutritionGoals: goals }),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      toggleAnimations: () => set((s) => ({ animationsEnabled: !s.animationsEnabled })),

      setTheme: (theme) => set({ theme }),

      setUsername: (name) => set({ username: name }),

      exportData: () => {
        // Gather all stores' data from localStorage
        const keys = [
          'mealquest-nutrition',
          'mealquest-meallog',
          'mealquest-planner',
          'mealquest-pantry',
          'mealquest-recipes',
          'mealquest-streaks',
          'mealquest-xp',
          'mealquest-quests',
          'mealquest-analytics',
          'mealquest-settings',
          'mealquest-grocery',
        ];
        const data: Record<string, unknown> = {};
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              data[key] = JSON.parse(raw);
            } catch {
              data[key] = raw;
            }
          }
        }
        return JSON.stringify(data, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json) as Record<string, unknown>;
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
          window.location.reload();
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () => {
        const keys = [
          'mealquest-nutrition',
          'mealquest-meallog',
          'mealquest-planner',
          'mealquest-pantry',
          'mealquest-recipes',
          'mealquest-streaks',
          'mealquest-xp',
          'mealquest-quests',
          'mealquest-analytics',
          'mealquest-settings',
          'mealquest-grocery',
        ];
        for (const key of keys) {
          localStorage.removeItem(key);
        }
        window.location.reload();
      },
    }),
    {
      name: 'mealquest-settings',
      version: 1,
    }
  )
);
