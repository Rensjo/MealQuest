// ============================================================================
// MealQuest — Animations Utility
// ============================================================================
// Shared Framer Motion variants for consistent animations across pages.

import type { Variants } from 'framer-motion';

/** Page fade — no x-shift to avoid overflow-y scroll container clipping */
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.1 } },
};

/** Fade in */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Staggered children */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/** Child for staggered lists */
export const staggerChild: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** Scale pop for cards */
export const cardPop: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

/** Float animation for XP notifications */
export const floatUp: Variants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 0, y: -60, transition: { duration: 1.5, ease: 'easeOut' } },
};

/** Glow pulse for progress bars */
export const glowPulse: Variants = {
  animate: {
    boxShadow: [
      '0 0 5px rgba(230, 183, 95, 0.3)',
      '0 0 20px rgba(230, 183, 95, 0.6)',
      '0 0 5px rgba(230, 183, 95, 0.3)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

/** Modal backdrop */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Modal content */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};
