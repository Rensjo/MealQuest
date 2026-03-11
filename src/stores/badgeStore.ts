// ============================================================================
// MealQuest — Badge Store
// ============================================================================
// Tracks lifetime counters and manages 24 badges across 6 categories.
// Badges are awarded when lifetime thresholds are crossed.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Badge, BadgeTier, BadgeCategory } from '@/types';
import { useXPStore } from './xpStore';
import { useStreakStore } from './streakStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TIER_XP: Record<BadgeTier, number> = {
  bronze: 25,
  silver: 50,
  gold: 100,
  platinum: 200,
};

type BadgeDef = Omit<Badge, 'progress' | 'unlockedAt'>;

const BADGE_DEFINITIONS: BadgeDef[] = [
  // ── Meals ──────────────────────────────────────────────────────────────
  { id: 'meals-bronze',    name: 'First Bite',         description: 'Log your very first meal',              icon: '🥗', tier: 'bronze',   category: 'meals',     xpReward: 25,  requirement: 1   },
  { id: 'meals-silver',    name: 'Consistent Logger',  description: 'Log 25 meals total',                    icon: '📓', tier: 'silver',   category: 'meals',     xpReward: 50,  requirement: 25  },
  { id: 'meals-gold',      name: 'Nutrition Devotee',  description: 'Log 100 meals total',                   icon: '🍽️', tier: 'gold',     category: 'meals',     xpReward: 100, requirement: 100 },
  { id: 'meals-platinum',  name: 'Legendary Logger',   description: 'Log 500 meals total',                   icon: '🏆', tier: 'platinum', category: 'meals',     xpReward: 200, requirement: 500 },

  // ── Home Cook ──────────────────────────────────────────────────────────
  { id: 'cook-bronze',     name: 'Kitchen Awakens',    description: 'Cook your very first home meal',        icon: '🍳', tier: 'bronze',   category: 'home-cook', xpReward: 25,  requirement: 1   },
  { id: 'cook-silver',     name: 'Kitchen Regular',    description: 'Cook 20 home-cooked meals',             icon: '👨‍🍳', tier: 'silver',   category: 'home-cook', xpReward: 50,  requirement: 20  },
  { id: 'cook-gold',       name: 'Master Chef',        description: 'Cook 75 home-cooked meals',             icon: '🥘', tier: 'gold',     category: 'home-cook', xpReward: 100, requirement: 75  },
  { id: 'cook-platinum',   name: 'Culinary Legend',    description: 'Cook 200 home-cooked meals',            icon: '🍴', tier: 'platinum', category: 'home-cook', xpReward: 200, requirement: 200 },

  // ── Recipes ────────────────────────────────────────────────────────────
  { id: 'recipe-bronze',   name: 'Recipe Collector',   description: 'Save your first recipe to the vault',  icon: '📖', tier: 'bronze',   category: 'recipes',   xpReward: 25,  requirement: 1   },
  { id: 'recipe-silver',   name: 'Vault Curator',      description: 'Save 10 recipes to your vault',        icon: '🗂️', tier: 'silver',   category: 'recipes',   xpReward: 50,  requirement: 10  },
  { id: 'recipe-gold',     name: 'Recipe Maestro',     description: 'Save 30 recipes to your vault',        icon: '📚', tier: 'gold',     category: 'recipes',   xpReward: 100, requirement: 30  },
  { id: 'recipe-platinum', name: 'Vault Overlord',     description: 'Save 75 recipes to your vault',        icon: '🔐', tier: 'platinum', category: 'recipes',   xpReward: 200, requirement: 75  },

  // ── Streak ─────────────────────────────────────────────────────────────
  { id: 'streak-bronze',   name: 'Streak Starter',     description: 'Reach a 3-day streak on any tracker',  icon: '🔥', tier: 'bronze',   category: 'streak',    xpReward: 25,  requirement: 3   },
  { id: 'streak-silver',   name: 'Streak Champion',    description: 'Reach a 7-day streak on any tracker',  icon: '⚡', tier: 'silver',   category: 'streak',    xpReward: 50,  requirement: 7   },
  { id: 'streak-gold',     name: 'Unstoppable',        description: 'Reach a 21-day streak on any tracker', icon: '🌟', tier: 'gold',     category: 'streak',    xpReward: 100, requirement: 21  },
  { id: 'streak-platinum', name: 'Streak Legend',      description: 'Reach a 60-day streak on any tracker', icon: '👑', tier: 'platinum', category: 'streak',    xpReward: 200, requirement: 60  },

  // ── Level ──────────────────────────────────────────────────────────────
  { id: 'level-bronze',    name: 'Rising Adventurer',  description: 'Reach level 5',                        icon: '🌱', tier: 'bronze',   category: 'level',     xpReward: 25,  requirement: 5   },
  { id: 'level-silver',    name: 'Seasoned Explorer',  description: 'Reach level 10',                       icon: '🗺️', tier: 'silver',   category: 'level',     xpReward: 50,  requirement: 10  },
  { id: 'level-gold',      name: 'Nutrition Master',   description: 'Reach level 20',                       icon: '🧠', tier: 'gold',     category: 'level',     xpReward: 100, requirement: 20  },
  { id: 'level-platinum',  name: 'Elite Fuelist',      description: 'Reach level 35',                       icon: '⭐', tier: 'platinum', category: 'level',     xpReward: 200, requirement: 35  },

  // ── Quests ─────────────────────────────────────────────────────────────
  { id: 'quest-bronze',    name: 'Quest Starter',      description: 'Complete 10 daily missions',           icon: '⚔️', tier: 'bronze',   category: 'quests',    xpReward: 25,  requirement: 10  },
  { id: 'quest-silver',    name: 'Daily Hero',         description: 'Complete 25 daily missions',           icon: '🗡️', tier: 'silver',   category: 'quests',    xpReward: 50,  requirement: 25  },
  { id: 'quest-gold',      name: 'Quest Champion',     description: 'Complete 75 daily missions',           icon: '🏅', tier: 'gold',     category: 'quests',    xpReward: 100, requirement: 75  },
  { id: 'quest-platinum',  name: 'Quest Overlord',     description: 'Complete 200 daily missions',          icon: '🎖️', tier: 'platinum', category: 'quests',    xpReward: 200, requirement: 200 },

  // ── Phase 3: Smart Achievements ────────────────────────────────────────
  { id: 'smart-bronze',    name: 'Data Starter',       description: 'Reach a daily nutrition score of 60+', icon: '📊', tier: 'bronze',   category: 'smart',     xpReward: 25,  requirement: 1   },
  { id: 'smart-silver',    name: 'Insight Seeker',     description: 'Achieve 7-day hydration streak',       icon: '🔍', tier: 'silver',   category: 'smart',     xpReward: 50,  requirement: 7   },
  { id: 'smart-gold',      name: 'Nutrition Analyst',  description: 'Maintain 80+ daily score for 14 days', icon: '🧪', tier: 'gold',     category: 'smart',     xpReward: 100, requirement: 14  },
  { id: 'smart-platinum',  name: 'AI Master Chef',     description: 'Log 100 meals with auto-estimation',   icon: '🤖', tier: 'platinum', category: 'smart',     xpReward: 200, requirement: 100 },
];

function buildInitialBadges(): Badge[] {
  return BADGE_DEFINITIONS.map(def => ({ ...def, progress: 0 }));
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

interface BadgeState {
  badges: Badge[];
  lifetimeMeals: number;
  lifetimeHomeCooked: number;
  lifetimeRecipes: number;
  lifetimeQuests: number;
  lifetimeSmartActions: number; // Phase 3: auto-estimation uses, high scores, etc.
}

interface BadgeActions {
  /** Check all badges against current progress, unlock newly earned ones, return newly unlocked list */
  checkAndAwardBadges: () => Badge[];
  /** Call when a meal is logged */
  incrementMeals: (isHomeCooked: boolean) => Badge[];
  /** Call when a recipe is saved */
  incrementRecipes: () => Badge[];
  /** Call when a quest/mission is completed */
  incrementQuests: () => Badge[];
  /** Phase 3: Call when a smart action occurs (auto-estimation, high score, etc.) */
  incrementSmartActions: () => Badge[];
  reset: () => void;
}

const initialState: BadgeState = {
  badges: buildInitialBadges(),
  lifetimeMeals: 0,
  lifetimeHomeCooked: 0,
  lifetimeRecipes: 0,
  lifetimeQuests: 0,
  lifetimeSmartActions: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBadgeStore = create<BadgeState & BadgeActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      checkAndAwardBadges: () => {
        const state = get();
        const level = useXPStore.getState().level;
        const allStreaks = useStreakStore.getState().getAllStreaks();
        const longestStreak = allStreaks.reduce((max, s) => Math.max(max, s.longest), 0);

        const getProgress = (category: BadgeCategory): number => {
          switch (category) {
            case 'meals':     return state.lifetimeMeals;
            case 'home-cook': return state.lifetimeHomeCooked;
            case 'recipes':   return state.lifetimeRecipes;
            case 'quests':    return state.lifetimeQuests;
            case 'streak':    return longestStreak;
            case 'level':     return level;
            case 'smart':     return state.lifetimeSmartActions;
          }
        };

        const now = new Date().toISOString();
        const newlyUnlocked: Badge[] = [];

        const updatedBadges = state.badges.map(badge => {
          const progress = getProgress(badge.category);
          if (!badge.unlockedAt && progress >= badge.requirement) {
            const unlocked: Badge = { ...badge, progress, unlockedAt: now };
            newlyUnlocked.push(unlocked);
            return unlocked;
          }
          return { ...badge, progress };
        });

        set({ badges: updatedBadges });

        // Award XP for each newly unlocked badge (badge XP doesn't trigger more badge checks)
        newlyUnlocked.forEach(badge => {
          useXPStore.getState().awardXP(badge.xpReward, 'badge', `Earned: ${badge.name}`);
        });

        return newlyUnlocked;
      },

      incrementMeals: (isHomeCooked) => {
        set(state => ({
          lifetimeMeals: state.lifetimeMeals + 1,
          lifetimeHomeCooked: isHomeCooked ? state.lifetimeHomeCooked + 1 : state.lifetimeHomeCooked,
        }));
        return get().checkAndAwardBadges();
      },

      incrementRecipes: () => {
        set(state => ({ lifetimeRecipes: state.lifetimeRecipes + 1 }));
        return get().checkAndAwardBadges();
      },

      incrementQuests: () => {
        set(state => ({ lifetimeQuests: state.lifetimeQuests + 1 }));
        return get().checkAndAwardBadges();
      },

      incrementSmartActions: () => {
        set(state => ({ lifetimeSmartActions: state.lifetimeSmartActions + 1 }));
        return get().checkAndAwardBadges();
      },

      reset: () => set({ ...initialState, badges: buildInitialBadges() }),
    }),
    {
      name: 'mealquest-badges',
      version: 1,
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion < 1 || !persisted) return { ...initialState, badges: buildInitialBadges() };
        // Merge any new badge definitions added in future updates
        const existing = persisted as BadgeState;
        const existingIds = new Set(existing.badges.map((b: Badge) => b.id));
        const newDefs = BADGE_DEFINITIONS.filter(d => !existingIds.has(d.id)).map(d => ({ ...d, progress: 0 }));
        return { ...existing, badges: [...existing.badges, ...newDefs] };
      },
    }
  )
);
