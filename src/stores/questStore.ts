// ============================================================================
// MealQuest — Quest Store
// ============================================================================
// Manages daily missions, weekly boss battles, and grocery quests.
// Phase 2: 25 daily quest pool (5 per day), 10 rotating weekly bosses,
//          auto-completion by triggerType.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Mission, WeeklyBoss, GroceryQuest, BossCondition } from '@/types';
import { todayISO, startOfWeekISO } from '@/utils/date';
import { soundManager } from '@/services/soundManager';
import { useBadgeStore } from './badgeStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestState {
  dailyMissions: Mission[];
  weeklyBoss: WeeklyBoss | null;
  groceryQuests: GroceryQuest[];
  lastMissionRefresh: string;
  lastBossRefresh: string;
}

interface QuestActions {
  refreshDailyMissions: (date?: string) => void;
  completeMission: (id: string) => number;
  autoCompleteByTrigger: (triggerType: string) => { xp: number; titles: string[] };
  refreshWeeklyBoss: () => void;
  updateBossCondition: (conditionId: string, met: boolean) => void;
  checkBossVictory: () => boolean;
  refreshGroceryQuests: () => void;
  completeGroceryQuest: (id: string) => number;
  getActiveMissions: () => Mission[];
  getCompletedMissions: () => Mission[];
  reset: () => void;
}

// ---------------------------------------------------------------------------
// 25 Daily Quest Templates
// ---------------------------------------------------------------------------

interface MissionTemplate {
  title: string;
  description: string;
  xpReward: number;
  category: string;
  triggerType?: string;
}

const ALL_DAILY_QUESTS: MissionTemplate[] = [
  { title: 'Balanced Breakfast',   description: 'Log a balanced breakfast today',               xpReward: 15, category: 'nutrition',   triggerType: 'log-breakfast'      },
  { title: 'Hydration Hero',       description: 'Log at least 2000 ml of water today',          xpReward: 15, category: 'hydration',   triggerType: 'log-water-2l'       },
  { title: 'Fruit Power',          description: 'Eat at least one fruit serving today',         xpReward: 10, category: 'nutrition'                                       },
  { title: 'Veggie Boost',         description: 'Include vegetables in a meal today',           xpReward: 10, category: 'nutrition'                                       },
  { title: 'Clean Eating',         description: 'Avoid junk food and fast food today',          xpReward: 20, category: 'discipline'                                      },
  { title: 'Protein Target',       description: 'Hit your daily protein goal',                  xpReward: 15, category: 'nutrition'                                       },
  { title: 'Home Chef',            description: 'Cook at least one meal at home today',         xpReward: 15, category: 'cooking',     triggerType: 'log-home-cooked'    },
  { title: 'Calorie Control',      description: 'Stay within your daily calorie goal',          xpReward: 15, category: 'discipline'                                      },
  { title: 'Log All Meals',        description: 'Log breakfast, lunch, and dinner today',       xpReward: 20, category: 'logging'                                         },
  { title: 'Snack Smart',          description: 'Log a healthy snack today',                    xpReward: 10, category: 'nutrition',   triggerType: 'log-snack'          },
  { title: 'Water Warrior',        description: 'Stay hydrated with 2.5 L of water today',     xpReward: 15, category: 'hydration',   triggerType: 'log-water-2l'       },
  { title: 'Pantry Audit',         description: 'Review and update your pantry inventory',      xpReward: 10, category: 'management',  triggerType: 'add-pantry'         },
  { title: 'Recipe Saver',         description: 'Add a new recipe to your vault',               xpReward: 10, category: 'discovery',   triggerType: 'add-recipe'         },
  { title: 'No Sugary Drinks',     description: 'Skip sugary beverages all day',                xpReward: 15, category: 'discipline'                                      },
  { title: 'Macro Master',         description: 'Hit at least three macro targets today',       xpReward: 25, category: 'nutrition'                                       },
  { title: 'Grocery Planner',      description: 'Add an item to your grocery list',             xpReward: 10, category: 'management',  triggerType: 'add-grocery'        },
  { title: 'Morning Fuel',         description: 'Log a nutritious breakfast with protein',      xpReward: 10, category: 'morning',     triggerType: 'log-breakfast'      },
  { title: 'Perfect Dinner',       description: 'Log a balanced dinner this evening',           xpReward: 10, category: 'evening',     triggerType: 'log-dinner'         },
  { title: 'Streak Defender',      description: 'Maintain at least one active streak today',    xpReward: 15, category: 'streak'                                          },
  { title: 'Hydration Rush',       description: 'Log 500 ml of water in one session',           xpReward: 10, category: 'hydration',   triggerType: 'log-water-500ml'    },
  { title: 'Fresh Ingredients',    description: 'Cook with fresh, whole ingredients today',     xpReward: 15, category: 'cooking',     triggerType: 'log-home-cooked'    },
  { title: 'Variety Day',          description: 'Log meals covering at least 3 food groups',    xpReward: 20, category: 'nutrition'                                       },
  { title: 'Pantry Builder',       description: 'Add a new item to your pantry stock',          xpReward: 10, category: 'management',  triggerType: 'add-pantry'         },
  { title: 'Light Dinner',         description: 'Keep your dinner under 700 calories',          xpReward: 15, category: 'discipline',  triggerType: 'log-dinner'         },
  { title: 'Full Day Tracker',     description: 'Log every meal slot — no gaps today',          xpReward: 25, category: 'logging',     triggerType: 'log-dinner'         },
];

// ---------------------------------------------------------------------------
// Seeded shuffle for deterministic daily selection
// ---------------------------------------------------------------------------

function seededRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function dateSeed(dateStr: string): number {
  return dateStr.split('-').reduce((acc, p) => acc * 100 + Number(p), 0);
}

function pickDailyQuests(date: string, count = 5): MissionTemplate[] {
  const rng = seededRNG(dateSeed(date));
  const pool = [...ALL_DAILY_QUESTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ---------------------------------------------------------------------------
// 10 Weekly Boss Pool
// ---------------------------------------------------------------------------

interface BossTemplate {
  name: string;
  description: string;
  conditionLabels: string[];
  xpReward: number;
  badgeReward: string;
}

const WEEKLY_BOSS_POOL: BossTemplate[] = [
  {
    name: '🍔 The Junk Food Monster',
    description: 'Defeat the Junk Food Monster by choosing wholesome foods all week!',
    conditionLabels: ['Avoid fast food or processed meals for 5 days', 'Log a home-cooked meal at least 4 times', 'Complete 3 daily discipline quests'],
    xpReward: 200, badgeReward: 'junk-food-slayer',
  },
  {
    name: '🍬 The Sugar Baron',
    description: 'Resist the Sugar Baron and reclaim your health this week!',
    conditionLabels: ['Avoid sugary drinks for 7 consecutive days', 'Log water intake every day this week', 'Complete 4 hydration daily quests'],
    xpReward: 200, badgeReward: 'sugar-free-warrior',
  },
  {
    name: '🏜️ The Hydration Drought',
    description: 'End the Hydration Drought by keeping your body fueled with water!',
    conditionLabels: ['Drink 2 L+ of water for 5 consecutive days', 'Log water intake at least 6 days this week', 'Complete 5 hydration-related daily quests'],
    xpReward: 200, badgeReward: 'hydration-champion',
  },
  {
    name: '🔥 The Calorie Chaos',
    description: 'Tame the Calorie Chaos by hitting your daily goals consistently!',
    conditionLabels: ['Stay within your calorie goal for 5 of 7 days', 'Log all 3 main meals for at least 4 days', 'Complete 3 discipline quests this week'],
    xpReward: 200, badgeReward: 'calorie-tamer',
  },
  {
    name: '🌅 The Breakfast Bandit',
    description: "Catch the Breakfast Bandit by never skipping the most important meal!",
    conditionLabels: ['Log breakfast every single day this week (7/7)', 'Maintain your breakfast streak throughout the week', 'Log breakfast with protein at least 5 times'],
    xpReward: 200, badgeReward: 'breakfast-champion',
  },
  {
    name: '📚 The Recipe Hoarder',
    description: 'Defeat the Recipe Hoarder by building your culinary knowledge!',
    conditionLabels: ['Add at least 3 new recipes to your vault', 'Cook home-made meals at least 4 times this week', 'Try meals from 2 different food categories'],
    xpReward: 200, badgeReward: 'culinary-master',
  },
  {
    name: '👻 The Pantry Phantom',
    description: 'Exorcise the Pantry Phantom by keeping your inventory in order!',
    conditionLabels: ['Add at least 5 new items to your pantry', 'Restock 3 low-stock pantry items this week', 'Keep pantry inventory above 8 items all week'],
    xpReward: 200, badgeReward: 'pantry-keeper',
  },
  {
    name: '⚖️ The Macro Menace',
    description: 'Defeat the Macro Menace by achieving perfect nutritional balance!',
    conditionLabels: ['Hit your protein goal at least 4 days this week', 'Hit your carb goal at least 3 days this week', 'Log macros consistently for 5 days'],
    xpReward: 200, badgeReward: 'macro-master',
  },
  {
    name: '😴 The Meal Slacker',
    description: 'Wake up the Meal Slacker within you and log every meal this week!',
    conditionLabels: ['Log all 3 main meals (B/L/D) for at least 5 days', 'Log a total of 20 or more meal entries this week', 'Complete 5 meal-logging daily quests'],
    xpReward: 200, badgeReward: 'dedicated-logger',
  },
  {
    name: '🛒 The Grocery Goblin',
    description: 'Outsmart the Grocery Goblin by mastering your shopping game!',
    conditionLabels: ['Add at least 8 items to your grocery list', 'Mark at least 5 grocery items as purchased', 'Complete all grocery quests this week'],
    xpReward: 200, badgeReward: 'grocery-master',
  },
];

// Deterministic boss selection: ISO week number mod pool size
function getISOWeekNumber(date?: Date): number {
  const d = date ?? new Date();
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getBossForWeek(): BossTemplate {
  return WEEKLY_BOSS_POOL[getISOWeekNumber() % WEEKLY_BOSS_POOL.length];
}

// ---------------------------------------------------------------------------
// Grocery Quest Templates
// ---------------------------------------------------------------------------

const GROCERY_QUEST_TEMPLATES = [
  { title: 'Stock Up on Vegetables', description: 'Purchase fresh vegetables on your grocery run to fuel healthy meals', category: 'produce',  xpReward: 50 },
  { title: 'Protein Haul',           description: 'Buy quality protein sources (chicken, fish, eggs, legumes, or tofu)',  category: 'protein',  xpReward: 50 },
  { title: 'Fruit Basket Run',       description: 'Pick up a variety of fresh fruits to hit your daily nutrition goals',  category: 'produce',  xpReward: 50 },
  { title: 'Pantry Staples Restock', description: 'Restock pantry staples like grains, oils, or canned goods',           category: 'staples',  xpReward: 40 },
  { title: 'Dairy or Alternatives',  description: 'Purchase dairy products or plant-based alternatives',                  category: 'dairy',    xpReward: 35 },
];

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: QuestState = {
  dailyMissions: [],
  weeklyBoss: null,
  groceryQuests: [],
  lastMissionRefresh: '',
  lastBossRefresh: '',
};

export const useQuestStore = create<QuestState & QuestActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Daily missions ─────────────────────────────────────────────────────

      refreshDailyMissions: (date) => {
        const today = date ?? todayISO();
        if (get().lastMissionRefresh === today) return;

        const selected = pickDailyQuests(today, 5);
        const missions: Mission[] = selected.map((t) => ({
          id: nanoid(),
          title: t.title,
          description: t.description,
          xpReward: t.xpReward,
          completed: false,
          category: t.category,
          triggerType: t.triggerType,
          date: today,
        }));

        set({ dailyMissions: missions, lastMissionRefresh: today });
      },

      completeMission: (id) => {
        const mission = get().dailyMissions.find((m) => m.id === id);
        if (!mission || mission.completed) return 0;
        set((state) => ({
          dailyMissions: state.dailyMissions.map((m) =>
            m.id === id ? { ...m, completed: true } : m
          ),
        }));
        soundManager.playQuestComplete();
        return mission.xpReward;
      },

      // Auto-complete any active missions whose triggerType matches
      autoCompleteByTrigger: (triggerType) => {
        const today = todayISO();
        const matching = get().dailyMissions.filter(
          (m) =>
            !m.completed &&
            m.date === today &&
            (m as Mission & { triggerType?: string }).triggerType === triggerType
        );

        if (matching.length === 0) return { xp: 0, titles: [] };

        set((state) => ({
          dailyMissions: state.dailyMissions.map((m) =>
            matching.some((mm) => mm.id === m.id) ? { ...m, completed: true } : m
          ),
        }));

        soundManager.playQuestComplete();

        // Badge tracking — count each completed mission
        matching.forEach(() => useBadgeStore.getState().incrementQuests());

        return {
          xp: matching.reduce((sum, m) => sum + m.xpReward, 0),
          titles: matching.map((m) => m.title),
        };
      },

      // ── Weekly Boss ────────────────────────────────────────────────────────

      refreshWeeklyBoss: () => {
        const weekStart = startOfWeekISO();
        if (get().lastBossRefresh === weekStart) return;

        const template = getBossForWeek();
        const conditions: BossCondition[] = template.conditionLabels.map((label) => ({
          id: nanoid(),
          label,
          met: false,
        }));

        const boss: WeeklyBoss = {
          id: nanoid(),
          name: template.name,
          description: template.description,
          weekStart,
          status: 'active',
          conditions,
          xpReward: template.xpReward,
          badgeReward: template.badgeReward,
        };

        set({ weeklyBoss: boss, lastBossRefresh: weekStart });
      },

      updateBossCondition: (conditionId, met) =>
        set((state) => {
          if (!state.weeklyBoss) return state;
          return {
            weeklyBoss: {
              ...state.weeklyBoss,
              conditions: state.weeklyBoss.conditions.map((c) =>
                c.id === conditionId ? { ...c, met } : c
              ),
            },
          };
        }),

      checkBossVictory: () => {
        const boss = get().weeklyBoss;
        if (!boss || boss.status !== 'active') return false;
        const allMet = boss.conditions.every((c) => c.met);
        if (allMet) {
          set((state) => ({
            weeklyBoss: state.weeklyBoss
              ? { ...state.weeklyBoss, status: 'victory' }
              : null,
          }));
        }
        return allMet;
      },

      // ── Grocery Quests ─────────────────────────────────────────────────────

      refreshGroceryQuests: () => {
        const weekStart = startOfWeekISO();
        const existing = get().groceryQuests;
        if (existing.length > 0 && existing[0].weekStart === weekStart) return;

        const quests: GroceryQuest[] = GROCERY_QUEST_TEMPLATES.map((t) => ({
          id: nanoid(),
          title: t.title,
          description: t.description,
          category: t.category,
          xpReward: t.xpReward,
          completed: false,
          weekStart,
        }));

        set({ groceryQuests: quests });
      },

      completeGroceryQuest: (id) => {
        const quest = get().groceryQuests.find((q) => q.id === id);
        if (!quest || quest.completed) return 0;
        set((state) => ({
          groceryQuests: state.groceryQuests.map((q) =>
            q.id === id ? { ...q, completed: true } : q
          ),
        }));
        soundManager.playQuestComplete();
        return quest.xpReward;
      },

      // ── Getters ────────────────────────────────────────────────────────────

      getActiveMissions: () => get().dailyMissions.filter((m) => !m.completed),
      getCompletedMissions: () => get().dailyMissions.filter((m) => m.completed),

      reset: () => set(initialState),
    }),
    {
      name: 'mealquest-quests',
      version: 2, // bump version to reset stale 8-quest payloads
    }
  )
);
