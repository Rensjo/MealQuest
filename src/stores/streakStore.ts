// ============================================================================
// MealQuest — Streak Store
// ============================================================================
// Manages meal streaks: breakfast, hydration, home-cooked.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StreakRecord, StreakType } from '@/types';
import { todayISO } from '@/utils/date';
import { useXPStore } from './xpStore';
import { useNotificationStore } from './notificationStore';

interface StreakState {
  streaks: StreakRecord[];
}

interface StreakActions {
  checkIn: (type: StreakType, date?: string) => { xpAwarded: number; milestoneReached?: number };
  getStreak: (type: StreakType) => StreakRecord;
  resetStreak: (type: StreakType) => void;
  getAllStreaks: () => StreakRecord[];
  reset: () => void;
}

const DEFAULT_STREAKS: StreakRecord[] = [
  { type: 'breakfast', current: 0, longest: 0, lastDate: '' },
  { type: 'hydration', current: 0, longest: 0, lastDate: '' },
  { type: 'home-cooked', current: 0, longest: 0, lastDate: '' },
];

const STREAK_MILESTONES: Record<number, number> = {
  3: 20,
  7: 50,
  14: 100,
  30: 200,
};

const initialState: StreakState = {
  streaks: DEFAULT_STREAKS,
};

export const useStreakStore = create<StreakState & StreakActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      checkIn: (type, date) => {
        const today = date ?? todayISO();
        const streak = get().getStreak(type);
        let xpAwarded = 0;
        let milestoneReached: number | undefined;

        // Already checked in today
        if (streak.lastDate === today) {
          return { xpAwarded: 0 };
        }

        // Check if yesterday was the last streak day
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const newCurrent = streak.lastDate === yesterdayStr ? streak.current + 1 : 1;
        const newLongest = Math.max(streak.longest, newCurrent);

        // Check milestones
        for (const [days, xp] of Object.entries(STREAK_MILESTONES)) {
          if (newCurrent === Number(days)) {
            xpAwarded = xp;
            milestoneReached = Number(days);
            break;
          }
        }

        set((state) => ({
          streaks: state.streaks.map((s) =>
            s.type === type
              ? { ...s, current: newCurrent, longest: newLongest, lastDate: today }
              : s
          ),
        }));

        // Award any streak milestone XP and notify
        if (xpAwarded > 0) {
          useXPStore.getState().awardXP(xpAwarded, 'streak', `${type}-${newCurrent}-day`);
          useNotificationStore.getState().push({
            message: `🔥 ${newCurrent}-Day ${type.replace('-', ' ')} streak!`,
            xp: xpAwarded,
            tone: 'streak',
          });
        }

        return { xpAwarded, milestoneReached };
      },

      getStreak: (type) =>
        get().streaks.find((s) => s.type === type) ?? {
          type,
          current: 0,
          longest: 0,
          lastDate: '',
        },

      resetStreak: (type) =>
        set((state) => ({
          streaks: state.streaks.map((s) =>
            s.type === type ? { ...s, current: 0, lastDate: '' } : s
          ),
        })),

      getAllStreaks: () => get().streaks,

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-streaks',
      version: 1,
    }
  )
);
