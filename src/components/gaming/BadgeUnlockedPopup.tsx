// ============================================================================
// MealQuest — Badge Unlocked Popup
// ============================================================================
// Centered spring-bounce popup shown when a badge is earned.
// Uses the same two-div centering pattern as RecipeVaultPanel.

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Badge, BadgeTier } from '@/types';

// ---------------------------------------------------------------------------
// Tier styling
// ---------------------------------------------------------------------------

const TIER_STYLE: Record<BadgeTier, { bar: string; chip: string; glow: string; label: string }> = {
  bronze:   {
    bar:   'from-amber-600 via-orange-500 to-amber-400',
    chip:  'bg-amber-500/20 text-amber-300 border-amber-500/40',
    glow:  'shadow-[0_0_60px_rgba(217,119,6,0.25)]',
    label: 'Bronze',
  },
  silver:   {
    bar:   'from-zinc-400 via-slate-300 to-zinc-200',
    chip:  'bg-zinc-400/20 text-zinc-200 border-zinc-400/40',
    glow:  'shadow-[0_0_60px_rgba(148,163,184,0.2)]',
    label: 'Silver',
  },
  gold:     {
    bar:   'from-yellow-400 via-amber-300 to-yellow-200',
    chip:  'bg-yellow-400/20 text-yellow-200 border-yellow-400/40',
    glow:  'shadow-[0_0_60px_rgba(234,179,8,0.4)]',
    label: 'Gold',
  },
  platinum: {
    bar:   'from-cyan-400 via-violet-400 to-purple-400',
    chip:  'bg-violet-500/20 text-violet-200 border-violet-400/40',
    glow:  'shadow-[0_0_70px_rgba(139,92,246,0.35)]',
    label: 'Platinum',
  },
};

// ---------------------------------------------------------------------------
// Particle — decorative sparkle dot
// ---------------------------------------------------------------------------

function Particle({ angle, distance, delay }: { angle: number; distance: number; delay: number }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], x: tx, y: ty, scale: [0, 1.4, 0] }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main popup
// ---------------------------------------------------------------------------

interface BadgeUnlockedPopupProps {
  badge: Badge | null;
  onDismiss: () => void;
}

export default function BadgeUnlockedPopup({ badge, onDismiss }: BadgeUnlockedPopupProps) {
  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!badge) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [badge, onDismiss]);

  const style = badge ? TIER_STYLE[badge.tier] : TIER_STYLE.bronze;

  return (
    <AnimatePresence>
      {badge && (
        /* Outer div: CSS centering (immune to Framer Motion transform overrides) */
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
          {/* Dim backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* Spring-bounce card */}
          <motion.div
            className={`relative pointer-events-auto w-[min(400px,90vw)] overflow-hidden rounded-3xl border border-white/10 bg-[#0d0600]/95 pb-7 pt-0 text-center ${style.glow}`}
            initial={{ opacity: 0, scale: 0.55, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', stiffness: 270, damping: 22 }}
          >
            {/* Tier gradient top bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${style.bar}`} />

            {/* Sparkle particles (positioned relative to card center) */}
            <div className="pointer-events-none absolute left-1/2 top-[80px]">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <Particle key={angle} angle={angle} distance={70 + (i % 2) * 20} delay={0.05 * i} />
              ))}
            </div>

            {/* "BADGE UNLOCKED!" label */}
            <div className="px-6 pt-6 pb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-brand/80">
                Badge Unlocked
              </p>
            </div>

            {/* Big emoji */}
            <motion.div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand/20 bg-brand/8 text-5xl"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {badge.icon}
            </motion.div>

            {/* Badge name */}
            <h2 className="mb-2 px-6 text-xl font-black text-white leading-tight">
              {badge.name}
            </h2>

            {/* Description */}
            <p className="mb-4 px-8 text-xs text-amber-200/50 leading-relaxed">
              {badge.description}
            </p>

            {/* Tier chip + XP reward row */}
            <div className="flex items-center justify-center gap-3 px-6">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${style.chip}`}>
                {style.label}
              </span>
              <span className="rounded-full border border-brand/30 bg-brand/12 px-3 py-1 text-[11px] font-black text-brand">
                +{badge.xpReward} XP
              </span>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="mx-6 mt-5 h-[3px] overflow-hidden rounded-full bg-white/6">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4.5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
