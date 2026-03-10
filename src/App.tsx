// ============================================================================
// MealQuest — App Shell
// ============================================================================
// Layout: TopBar (fixed top) → FloatingActionDock → Main Content →
//         NavPanel (slide-in) → FloatingMissions → Overlays

import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  NavPanel,
  type PageId,
} from '@/components/navigation/FloatingNav';
import { TopBar } from '@/components/TopBar';
import { FloatingMissions } from '@/components/gaming/FloatingMissions';
import { LevelUpCelebration, FloatingXP } from '@/components/gaming/GamingComponents';
import { ActivityNotifications } from '@/components/gaming/ActivityNotifications';
import BadgeUnlockedPopup from '@/components/gaming/BadgeUnlockedPopup';
import FloatingActionDock from '@/components/FloatingActionDock';
import RecipeVaultPanel from '@/components/RecipeVaultPanel';
import WeeklyBossPanel from '@/components/gaming/WeeklyBossPanel';
import UserStatusPanel from '@/components/gaming/UserStatusPanel';
import GoalsPanel from '@/components/gaming/GoalsPanel';
import { useDailyRefresh } from '@/hooks';
import { useXPStore } from '@/stores/xpStore';
import { useQuestStore } from '@/stores/questStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { soundManager } from '@/services/soundManager';
import { useSoundStore } from '@/stores/soundStore';
import type { Badge } from '@/types';

// Pages (reduced from 11 → 5)
import {
  NutritionDashboard,
  MealLog,
  NutritionGoals,
  FoodHub,
  SettingsPage,
} from '@/pages';

const PAGE_MAP: Record<PageId, React.FC> = {
  dashboard: NutritionDashboard,
  'meal-log': MealLog,
  'food-hub': FoodHub,
  goals: NutritionGoals,
  settings: SettingsPage,
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [recipeVaultOpen, setRecipeVaultOpen] = useState(false);
  const [weeklyBossOpen, setWeeklyBossOpen] = useState(false);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [goalsPanelOpen, setGoalsPanelOpen] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(1);
  const [floatingXP, setFloatingXP] = useState<{ id: string; amount: number } | null>(null);

  const level = useXPStore((s) => s.level);
  const xpHistory = useXPStore((s) => s.xpHistory);
  const activeMissions = useQuestStore((s) => s.getActiveMissions());
  const badges = useBadgeStore((s) => s.badges);

  // Badge popup queue
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const prevUnlockedRef = React.useRef(
    new Set(badges.filter(b => b.unlockedAt).map(b => b.id))
  );

  // Initialize daily refresh (missions, boss, grocery quests)
  useDailyRefresh();

  // ── Sound system: preload + background music on first interaction ──
  const musicInitRef = React.useRef(false);
  React.useEffect(() => {
    soundManager.preloadAll();
  }, []);

  // Subscribe to soundStore changes and sync music volume live
  React.useEffect(() => {
    const unsub = useSoundStore.subscribe(() => soundManager.syncMusicVolume());
    return unsub;
  }, []);

  // Start background music on first user click/key (browser autoplay policy)
  React.useEffect(() => {
    const start = () => {
      if (!musicInitRef.current) {
        musicInitRef.current = true;
        soundManager.playBackgroundMusic();
      }
    };
    window.addEventListener('click', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('click', start);
      window.removeEventListener('keydown', start);
    };
  }, []);

  // Listen for level-up events
  const prevLevelRef = React.useRef(level);
  React.useEffect(() => {
    if (level > prevLevelRef.current) {
      setLevelUpLevel(level);
      setShowLevelUp(true);
      soundManager.playLevelUp();
    }
    prevLevelRef.current = level;
  }, [level]);

  // Auto-show FloatingXP whenever a new XP record is added
  const prevXPLenRef = React.useRef(xpHistory.length);
  React.useEffect(() => {
    if (xpHistory.length > prevXPLenRef.current && xpHistory.length > 0) {
      const latest = xpHistory[0];
      setFloatingXP({ id: latest.id, amount: latest.xpAmount });
    }
    prevXPLenRef.current = xpHistory.length;
  }, [xpHistory]);

  // Listen for newly unlocked badges and queue popups
  React.useEffect(() => {
    const newlyUnlocked = badges.filter(b => b.unlockedAt && !prevUnlockedRef.current.has(b.id));
    if (newlyUnlocked.length > 0) {
      setBadgeQueue(q => [...q, ...newlyUnlocked]);
      newlyUnlocked.forEach(b => prevUnlockedRef.current.add(b.id));
      soundManager.playBadge();
    }
  }, [badges]);

  // Navigation handler
  const handleNavigate = useCallback((page: PageId) => {
    setActivePage(page);
    setNavOpen(false);
  }, []);

  const ActivePage = PAGE_MAP[activePage] ?? NutritionDashboard;

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0700] text-white" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,130,30,0.18) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(160,80,10,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 10% 70%, rgba(120,50,5,0.10) 0%, transparent 60%), #0f0700' }}>
      {/* ── Fixed Top Bar ── */}
      <TopBar
        navOpen={navOpen}
        onToggleNav={() => setNavOpen(!navOpen)}
        onNavigate={handleNavigate}
        onToggleMissions={() => setMissionsOpen(!missionsOpen)}
        onToggleStatus={() => setStatusPanelOpen(!statusPanelOpen)}
        statusOpen={statusPanelOpen}
        onToggleGoals={() => setGoalsPanelOpen(!goalsPanelOpen)}
        goalsOpen={goalsPanelOpen}
      />

      {/* ── Floating Action Dock (3 icon buttons, right side) ── */}
      <FloatingActionDock
        onDailyQuests={() => setMissionsOpen(true)}
        onRecipeVault={() => setRecipeVaultOpen(true)}
        onWeeklyBoss={() => setWeeklyBossOpen(true)}
        questsBadge={activeMissions.length}
      />

      {/* ── Main Content — pt-20 to clear fixed header (h-20) ── */}
      <main className="flex-1 overflow-y-auto pt-20">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <ActivePage key={activePage} />
          </AnimatePresence>
        </div>
      </main>

      {/* ── Nav Panel — slide-in from left ── */}
      <NavPanel
        isOpen={navOpen}
        activePage={activePage}
        onNavigate={handleNavigate}
        onClose={() => setNavOpen(false)}
      />

      {/* ── Missions Panel — externally controlled from TopBar / dock ── */}
      <FloatingMissions
        isOpen={missionsOpen}
        onClose={() => setMissionsOpen(false)}
      />

      {/* ── Recipe Vault Modal ── */}
      <RecipeVaultPanel
        isOpen={recipeVaultOpen}
        onClose={() => setRecipeVaultOpen(false)}
      />

      {/* ── Weekly Boss Panel ── */}
      <WeeklyBossPanel
        isOpen={weeklyBossOpen}
        onClose={() => setWeeklyBossOpen(false)}
      />

      {/* ── User Status Panel ── */}
      <UserStatusPanel
        isOpen={statusPanelOpen}
        onClose={() => setStatusPanelOpen(false)}
      />

      {/* ── Goals Panel ── */}
      <GoalsPanel
        isOpen={goalsPanelOpen}
        onClose={() => setGoalsPanelOpen(false)}
      />

      {/* ── Level-Up Celebration Overlay ── */}
      <LevelUpCelebration
        level={levelUpLevel}
        show={showLevelUp}
        onDismiss={() => setShowLevelUp(false)}
      />

      {/* ── Floating XP Notification ── */}
      <FloatingXP
        amount={floatingXP?.amount ?? 0}
        show={floatingXP !== null}
        onComplete={() => setFloatingXP(null)}
      />

      {/* ── Activity Notifications (top-left toasts) ── */}
      <ActivityNotifications />

      {/* ── Badge Unlocked Popup ── */}
      <BadgeUnlockedPopup
        badge={badgeQueue[0] ?? null}
        onDismiss={() => setBadgeQueue(q => q.slice(1))}
      />
    </div>
  );
}

