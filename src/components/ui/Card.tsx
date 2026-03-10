// ============================================================================
// MealQuest — Card Components
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { cardPop } from '@/utils/animations';

// ---------------------------------------------------------------------------
// Neon glow color map (applied via CSS classes defined in index.css)
// ---------------------------------------------------------------------------

const GLOW_COLOR_MAP: Record<string, string> = {
  brand:  'neon-card-brand',
  blue:   'neon-card-blue',
  green:  'neon-card-green',
  purple: 'neon-card-purple',
  orange: 'neon-card-orange',
  pink:   'neon-card-pink',
};

// ---------------------------------------------------------------------------
// Base Card
// ---------------------------------------------------------------------------

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: 'brand' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  noPadding?: boolean;
  hover?: boolean;
}

export function Card({ children, className, glow, glowColor, noPadding, hover = true }: CardProps) {
  const glowClass = glowColor ? GLOW_COLOR_MAP[glowColor] : undefined;
  return (
    <motion.div
      variants={cardPop}
      initial="initial"
      animate="animate"
      className={cn(
        'rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm',
        'transition-all duration-300',
        !noPadding && 'p-5',
        glow && !glowColor && 'shadow-neon border-brand/30',
        glowClass,
        hover && 'hover:-translate-y-1 hover:shadow-lg',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stats Card — for dashboard metrics
// ---------------------------------------------------------------------------

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  progress?: number; // 0-100
  target?: string;
  color?: string;
  glowColor?: 'brand' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon,
  progress,
  target,
  color = 'bg-brand',
  glowColor,
  className,
}: StatsCardProps) {
  return (
    <Card glowColor={glowColor} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">{label}</span>
        <span className="text-brand">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {progress !== undefined && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', color)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {target && (
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{Math.round(progress)}%</span>
              <span>{target}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section Card — page section wrapper
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glowColor?: 'brand' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

export function SectionCard({ title, subtitle, action, children, className, glowColor }: SectionCardProps) {
  return (
    <Card glowColor={glowColor} className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

