// ============================================================================
// MealQuest — Top Bar  (Warm Amber/Gold Edition)
// ============================================================================
// Brand button (merged nav toggle) · status pills · level/XP/streak ·
// Profile + Goals icon buttons  — NO separate hamburger

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Zap,
  Star,
  Calendar,
  User,
  Target,
  ChevronDown,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/utils';
import { useXPStore } from '@/stores/xpStore';
import { useStreakStore } from '@/stores/streakStore';
import { useQuestStore } from '@/stores/questStore';
import { soundManager } from '@/services/soundManager';
import type { PageId } from '@/components/navigation/FloatingNav';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopBarProps {
  navOpen: boolean;
  onToggleNav: () => void;
  onNavigate: (page: PageId) => void;
  onToggleMissions: () => void;
  onToggleStatus: () => void;
  statusOpen: boolean;
  onToggleGoals: () => void;
  goalsOpen: boolean;
}

// ---------------------------------------------------------------------------
// Top Bar
// ---------------------------------------------------------------------------

export function TopBar({
  navOpen,
  onToggleNav,
  onNavigate,
  onToggleMissions,
  onToggleStatus,
  statusOpen,
  onToggleGoals,
  goalsOpen,
}: TopBarProps) {
  const level = useXPStore((s) => s.level);
  const xpInfo = useXPStore((s) => s.getXPToNextLevel());
  const allStreaks = useStreakStore((s) => s.getAllStreaks());
  const activeMissions = useQuestStore((s) => s.getActiveMissions());

  const topStreak = useMemo(
    () => Math.max(...allStreaks.map((s) => s.current), 0),
    [allStreaks]
  );

  const pendingCount = activeMissions.length;

  // ── Online / offline status ──
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-brand/15 bg-[#0e0700]/96 backdrop-blur-lg">
      {/* Brand accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand/70 to-transparent" />
      {/* Subtle inner shadow */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/12 to-transparent" />

      <div className="flex h-full items-center gap-3 px-4 sm:px-5">

        {/* ── Brand button (merged nav toggle — borderless) ── */}
        <motion.button
          onClick={() => { soundManager.playClick(); onToggleNav(); }}
          className="flex items-center gap-3 flex-shrink-0 group cursor-pointer bg-transparent p-0 border-0 outline-none"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Toggle navigation"
        >
          <motion.img
            src="./icons/mealquest-icon2.png"
            alt="MealQuest"
            className="h-12 w-12 object-contain flex-shrink-0"
            animate={{
              filter: navOpen
                ? 'drop-shadow(0 0 12px rgba(230,183,95,0.95))'
                : 'drop-shadow(0 0 4px rgba(230,183,95,0.4))',
            }}
            transition={{ duration: 0.28 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-wide text-white/90 group-hover:text-brand transition-colors duration-200">
                MealQuest
              </span>
              <motion.div
                animate={{ rotate: navOpen ? 180 : 0 }}
                transition={{ duration: 0.22, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-colors duration-200',
                    navOpen ? 'text-brand' : 'text-amber-300/50'
                  )}
                />
              </motion.div>
            </div>
            <span className="hidden text-[11px] font-medium text-amber-200/40 md:block">
              Gamified Nutrition
            </span>
          </div>
        </motion.button>

        {/* ── Status Pills ── */}
        <div className="ml-2 hidden items-center gap-2 lg:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/22 bg-brand/6 px-3 py-1.5 text-xs font-semibold text-amber-200/65">
            <Calendar size={11} />
            {today}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-500',
            isOnline
              ? 'border-green-500/32 bg-green-500/10 text-green-400'
              : 'border-red-500/32 bg-red-500/10 text-red-400',
          )}>
            {isOnline ? (
              <>
                <Wifi size={11} className="animate-none" />
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </>
            ) : (
              <>
                <WifiOff size={11} />
                Offline
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/32 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
            <Zap size={11} />
            Gamified
          </span>
        </div>

        {/* ── Flex spacer ── */}
        <div className="flex-1" />

        {/* ── Level · XP · Streak · Buttons ── */}
        <div className="flex items-center gap-2 md:gap-2.5">

          {/* Level badge */}
          <motion.div
            className="flex items-center gap-2 rounded-xl border border-brand/38 bg-brand/12 px-3 py-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            <Star size={13} className="fill-brand text-brand flex-shrink-0" />
            <span className="text-sm font-bold text-brand">Lv.{level}</span>
          </motion.div>

          {/* XP progress bar */}
          <div className="hidden w-36 flex-col gap-1 lg:flex">
            <div className="flex justify-between text-[10px] text-amber-200/45 font-semibold">
              <span>XP</span>
              <span>{xpInfo.current}/{xpInfo.required}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#2a1200] border border-brand/18">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-neon-gold"
                initial={{ width: 0 }}
                animate={{ width: `${xpInfo.progress}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 8px rgba(230,183,95,0.6)' }}
              />
            </div>
          </div>

          {/* Streak chip */}
          {topStreak > 0 && (
            <motion.div
              className="hidden items-center gap-2 rounded-xl border border-orange-500/28 bg-orange-500/10 px-3 py-2 md:flex"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              <Flame size={13} className="text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{topStreak}</span>
            </motion.div>
          )}

          {/* Divider */}
          <div className="hidden h-5 w-px bg-brand/14 md:block" />

          {/* ── Profile button ── */}
          <motion.button
            onClick={() => { soundManager.playClick(); onToggleStatus(); }}
            onMouseEnter={() => soundManager.playHover()}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200',
              statusOpen
                ? 'border-brand/62 bg-brand/15 text-brand shadow-[0_0_14px_rgba(230,183,95,0.28)]'
                : 'border-brand/22 bg-brand/7 text-amber-200/70 hover:border-brand/44 hover:bg-brand/13 hover:text-brand'
            )}
          >
            <User size={15} />
            <span className="hidden lg:inline">Profile</span>
            <motion.div
              animate={{ rotate: statusOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={12} />
            </motion.div>
          </motion.button>

          {/* ── Goals button ── */}
          <motion.button
            onClick={() => { soundManager.playClick(); onToggleGoals(); }}
            onMouseEnter={() => soundManager.playHover()}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200',
              goalsOpen
                ? 'border-brand/62 bg-brand/15 text-brand shadow-[0_0_14px_rgba(230,183,95,0.28)]'
                : 'border-brand/22 bg-brand/7 text-amber-200/70 hover:border-brand/44 hover:bg-brand/13 hover:text-brand'
            )}
          >
            <Target size={15} />
            <span className="hidden lg:inline">Goals</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
