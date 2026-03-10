// ============================================================================
// MealQuest — useDailyRefresh Hook
// ============================================================================
// Refreshes daily missions and checks streaks on app load / day change.

import { useEffect, useRef } from 'react';
import { useQuestStore } from '@/stores/questStore';
import { todayISO } from '@/utils/date';

export function useDailyRefresh() {
  const refreshDailyMissions = useQuestStore((s) => s.refreshDailyMissions);
  const refreshWeeklyBoss = useQuestStore((s) => s.refreshWeeklyBoss);
  const refreshGroceryQuests = useQuestStore((s) => s.refreshGroceryQuests);
  const lastChecked = useRef(todayISO());

  useEffect(() => {
    // Initial refresh
    refreshDailyMissions();
    refreshWeeklyBoss();
    refreshGroceryQuests();

    // Check every minute if the day has changed
    const interval = setInterval(() => {
      const today = todayISO();
      if (today !== lastChecked.current) {
        lastChecked.current = today;
        refreshDailyMissions();
        refreshWeeklyBoss();
        refreshGroceryQuests();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [refreshDailyMissions, refreshWeeklyBoss, refreshGroceryQuests]);
}
