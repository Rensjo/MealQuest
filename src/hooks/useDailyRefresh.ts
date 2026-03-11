// ============================================================================
// MealQuest — useDailyRefresh Hook
// ============================================================================
// Refreshes daily missions, intelligence systems, and checks streaks
// on app load / day change.

import { useEffect, useRef } from 'react';
import { useQuestStore } from '@/stores/questStore';
import { useIntelligenceStore } from '@/stores/intelligenceStore';
import { todayISO } from '@/utils/date';

export function useDailyRefresh() {
  const refreshDailyMissions = useQuestStore((s) => s.refreshDailyMissions);
  const refreshWeeklyBoss = useQuestStore((s) => s.refreshWeeklyBoss);
  const refreshGroceryQuests = useQuestStore((s) => s.refreshGroceryQuests);
  const refreshDailyScore = useIntelligenceStore((s) => s.refreshDailyScore);
  const refreshInsights = useIntelligenceStore((s) => s.refreshInsights);
  const refreshHabitPatterns = useIntelligenceStore((s) => s.refreshHabitPatterns);
  const checkNotifications = useIntelligenceStore((s) => s.checkNotifications);
  const lastChecked = useRef(todayISO());

  useEffect(() => {
    // Initial refresh
    refreshDailyMissions();
    refreshWeeklyBoss();
    refreshGroceryQuests();

    // Intelligence refreshes (non-blocking)
    refreshDailyScore();
    refreshInsights();
    refreshHabitPatterns();

    // Check every minute if the day has changed; also check smart notifications
    const interval = setInterval(() => {
      const today = todayISO();

      // Smart notification check every interval
      checkNotifications();

      if (today !== lastChecked.current) {
        lastChecked.current = today;
        refreshDailyMissions();
        refreshWeeklyBoss();
        refreshGroceryQuests();
        refreshDailyScore();
        refreshInsights();
        refreshHabitPatterns();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [refreshDailyMissions, refreshWeeklyBoss, refreshGroceryQuests, refreshDailyScore, refreshInsights, refreshHabitPatterns, checkNotifications]);
}
