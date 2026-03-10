// ============================================================================
// MealQuest — Floating Navigation
// ============================================================================
// Bottom-left floating nav button + slide-in overlay panel.
// Replaces the always-visible sidebar for a cleaner dashboard-centric layout.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  LayoutDashboard,
  NotebookPen,
  Package,
  Target,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/utils';
import { soundManager } from '@/services/soundManager';

// ---------------------------------------------------------------------------
// Reduced Page IDs — dashboard-centric architecture
// ---------------------------------------------------------------------------

export type PageId = 'dashboard' | 'meal-log' | 'food-hub' | 'goals' | 'settings';

export const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, desc: 'Main hub' },
  { id: 'meal-log', label: 'Meal Log', icon: <NotebookPen size={20} />, desc: 'Log meals' },
  { id: 'food-hub', label: 'Food Hub', icon: <Package size={20} />, desc: 'Recipes, pantry & groceries' },
  { id: 'goals', label: 'Goals', icon: <Target size={20} />, desc: 'Nutrition targets' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, desc: 'Preferences' },
];

// ---------------------------------------------------------------------------
// Floating Nav Button (bottom-left)
// ---------------------------------------------------------------------------

interface FloatingNavButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function FloatingNavButton({ isOpen, onToggle }: FloatingNavButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        'fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center',
        'rounded-full border border-brand/40 bg-neutral-900/95 text-brand',
        'shadow-neon-strong backdrop-blur-sm transition-all duration-300',
        'hover:scale-105 hover:border-brand/60 hover:shadow-neon-strong',
        'active:scale-95',
        isOpen && 'border-brand bg-brand/20'
      )}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
      transition={{ duration: 0.2 }}
    >
      {isOpen ? <X size={22} /> : <UtensilsCrossed size={22} />}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Slide-in Navigation Panel
// ---------------------------------------------------------------------------

interface NavPanelProps {
  isOpen: boolean;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onClose: () => void;
}

export function NavPanel({ isOpen, activePage, onNavigate, onClose }: NavPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.nav
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
            className={cn(
              'fixed left-0 top-0 bottom-0 z-40 w-72 overflow-y-auto',
              'border-r border-brand/12 bg-[#0c0600]/98 backdrop-blur-md',
              'p-6 pt-8'
            )}
          >
            {/* Brand */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand shadow-neon">
                <img
                  src="./icons/mealquest-icon.png"
                  alt="MealQuest"
                  className="h-6 w-6"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget.nextElementSibling as HTMLSpanElement).style.display = 'block';
                  }}
                />
                <span style={{ display: 'none' }}>
                  <UtensilsCrossed size={20} />
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">MealQuest</h2>
                <p className="text-[10px] text-amber-200/35">Gamified Nutrition</p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1.5">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    soundManager.playClick();
                    onNavigate(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200',
                    activePage === item.id
                      ? 'bg-brand/10 text-brand shadow-neon border border-brand/22'
                      : 'text-amber-200/50 hover:bg-brand/6 hover:text-amber-100 border border-transparent'
                  )}
                >
                  <span className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    activePage === item.id
                      ? 'bg-brand/15 text-brand'
                      : 'bg-white/4 text-amber-200/40'
                  )}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className={cn('text-[10px]', activePage === item.id ? 'text-brand/60' : 'text-amber-200/28')}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="border-t border-brand/10 pt-4">
                <p className="text-[10px] text-amber-200/25 text-center">
                  MealQuest v1.0.0 · QuestlyKai Ecosystem
                </p>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
