// ============================================================================
// MealQuest — Progress Bar Component
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: string;
  glowing?: boolean;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  color = 'bg-brand',
  glowing = false,
  showLabel = false,
  label,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
          {label && <span>{label}</span>}
          {showLabel && <span>{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={cn('rounded-full bg-neutral-800 overflow-hidden', sizeMap[size])}>
        <motion.div
          className={cn(
            'h-full rounded-full',
            color,
            glowing && 'shadow-neon'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// XP Bar — styled specifically for gamification
// ---------------------------------------------------------------------------

interface XPBarProps {
  current: number;
  required: number;
  level: number;
  className?: string;
}

export function XPBar({ current, required, level, className }: XPBarProps) {
  const percent = required > 0 ? (current / required) * 100 : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-brand">Level {level}</span>
        <span className="text-neutral-400">
          {current} / {required} XP
        </span>
      </div>
      <div className="h-3 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand to-neon-gold shadow-neon"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percent)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
