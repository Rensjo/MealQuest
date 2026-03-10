// ============================================================================
// MealQuest — XP Store
// ============================================================================
// Manages experience points, levels, and XP history.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { XPRecord } from '@/types';
import { todayISO } from '@/utils/date';
import { levelFromXP, xpForLevel } from '@/utils/gamification';

interface XPState {
  totalXP: number;
  level: number;
  xpHistory: XPRecord[];
}

interface XPActions {
  awardXP: (amount: number, source: string, description?: string) => {
    newXP: number;
    leveledUp: boolean;
    newLevel: number;
  };
  getXPForDate: (date: string) => number;
  getXPForRange: (start: string, end: string) => number;
  getXPToNextLevel: () => { current: number; required: number; progress: number };
  getRecentXP: (count?: number) => XPRecord[];
  reset: () => void;
}

const initialState: XPState = {
  totalXP: 0,
  level: 1,
  xpHistory: [],
};

export const useXPStore = create<XPState & XPActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      awardXP: (amount, source, description) => {
        const newTotalXP = get().totalXP + amount;
        const newLevel = levelFromXP(newTotalXP);
        const leveledUp = newLevel > get().level;

        const record: XPRecord = {
          id: nanoid(),
          date: todayISO(),
          source,
          xpAmount: amount,
          description,
        };

        set((state) => ({
          totalXP: newTotalXP,
          level: newLevel,
          xpHistory: [record, ...state.xpHistory],
        }));

        return { newXP: newTotalXP, leveledUp, newLevel };
      },

      getXPForDate: (date) =>
        get()
          .xpHistory.filter((r) => r.date === date)
          .reduce((sum, r) => sum + r.xpAmount, 0),

      getXPForRange: (start, end) =>
        get()
          .xpHistory.filter((r) => r.date >= start && r.date <= end)
          .reduce((sum, r) => sum + r.xpAmount, 0),

      getXPToNextLevel: () => {
        const { totalXP, level } = get();
        const currentLevelXP = xpForLevel(level);
        const nextLevelXP = xpForLevel(level + 1);
        const required = nextLevelXP - currentLevelXP;
        const current = totalXP - currentLevelXP;
        return {
          current: Math.max(0, current),
          required,
          progress: required > 0 ? Math.min(100, (current / required) * 100) : 0,
        };
      },

      getRecentXP: (count = 10) => get().xpHistory.slice(0, count),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-xp',
      version: 1,
    }
  )
);
