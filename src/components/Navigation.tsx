// ============================================================================
// MealQuest — Navigation Component
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  Target,
  ShoppingCart,
  BarChart3,
  Flame,
  BookOpen,
  ClipboardList,
  Package,
  Settings,
  Swords,
  Trophy,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/utils';
import { useXPStore } from '@/stores/xpStore';
import { XPBar } from '@/components/ui/ProgressBar';

export type PageId =
  | 'dashboard'
  | 'meal-log'
  | 'planner'
  | 'goals'
  | 'grocery'
  | 'analytics'
  | 'streaks'
  | 'recipes'
  | 'weekly-review'
  | 'pantry'
  | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  category: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, category: 'Core' },
  { id: 'meal-log', label: 'Meal Log', icon: <UtensilsCrossed size={18} />, category: 'Core' },
  { id: 'planner', label: 'Meal Planner', icon: <CalendarDays size={18} />, category: 'Core' },
  { id: 'goals', label: 'Nutrition Goals', icon: <Target size={18} />, category: 'Core' },
  { id: 'recipes', label: 'Recipe Vault', icon: <BookOpen size={18} />, category: 'Food' },
  { id: 'pantry', label: 'Pantry Tracker', icon: <Package size={18} />, category: 'Food' },
  { id: 'grocery', label: 'Grocery Planner', icon: <ShoppingCart size={18} />, category: 'Food' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} />, category: 'Progress' },
  { id: 'streaks', label: 'Streak Tracker', icon: <Flame size={18} />, category: 'Progress' },
  { id: 'weekly-review', label: 'Weekly Review', icon: <ClipboardList size={18} />, category: 'Progress' },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} />, category: 'System' },
];

// ---------------------------------------------------------------------------
// Sidebar Navigation (Desktop)
// ---------------------------------------------------------------------------

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { level, totalXP } = useXPStore();
  const xpInfo = useXPStore((s) => s.getXPToNextLevel());
  const categories = [...new Set(NAV_ITEMS.map((n) => n.category))];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <UtensilsCrossed size={20} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">MealQuest</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">QuestlyKai</p>
        </div>
      </div>

      {/* XP Bar */}
      <div className="border-b border-neutral-800 px-4 py-3">
        <XPBar current={xpInfo.current} required={xpInfo.required} level={level} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-track-transparent">
        {categories.map((cat) => (
          <div key={cat} className="mb-3">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
              {cat}
            </p>
            {NAV_ITEMS.filter((n) => n.category === cat).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                  activePage === item.id
                    ? 'bg-brand/10 text-brand font-medium shadow-neon border border-brand/20'
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {activePage === item.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-brand"
                  />
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-800 px-4 py-3">
        <p className="text-[10px] text-neutral-600 text-center">MealQuest v1.0.0</p>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile Header
// ---------------------------------------------------------------------------

interface MobileHeaderProps {
  activePage: PageId;
  onToggleMenu: () => void;
  menuOpen: boolean;
}

export function MobileHeader({ activePage, onToggleMenu, menuOpen }: MobileHeaderProps) {
  const activeItem = NAV_ITEMS.find((n) => n.id === activePage);

  return (
    <header className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-neutral-800 bg-neutral-950/95 px-4 backdrop-blur-sm lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <UtensilsCrossed size={16} />
        </div>
        <span className="text-sm font-semibold text-white">{activeItem?.label ?? 'MealQuest'}</span>
      </div>
      <button
        onClick={onToggleMenu}
        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Mobile Menu Overlay
// ---------------------------------------------------------------------------

interface MobileMenuProps {
  isOpen: boolean;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onClose: () => void;
}

export function MobileMenu({ isOpen, activePage, onNavigate, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 lg:hidden"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.nav
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        exit={{ x: -240 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="absolute left-0 top-14 bottom-0 w-60 overflow-y-auto border-r border-neutral-800 bg-neutral-950/95 p-3 backdrop-blur-sm"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              onClose();
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
              activePage === item.id
                ? 'bg-brand/10 text-brand font-medium'
                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </motion.nav>
    </motion.div>
  );
}
