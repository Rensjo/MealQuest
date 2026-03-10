// ============================================================================
// MealQuest — General Utilities
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';
import type { MealEntry } from '@/types';

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a unique ID */
export function newId(): string {
  return nanoid();
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Format a number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** Format calories for display */
export function formatCalories(n: number): string {
  return `${Math.round(n).toLocaleString()} kcal`;
}

/** Format grams */
export function formatGrams(n: number): string {
  return `${Math.round(n)}g`;
}

/** Format milliliters */
export function formatML(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}L`;
  return `${Math.round(n)}ml`;
}

/** Format currency */
export function formatCurrency(n: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

/** Percentage with bounds */
export function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

/** Capitalize first letter */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Truncate text with ellipsis */
export function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}
/**
 * Returns true when a MealEntry was logged by the drink/water tracker,
 * not an actual food meal. Uses the explicit flag first; falls back to
 * checking for the "Label (NNNml)" food-name pattern for legacy entries.
 */
export function isLiquidLog(meal: MealEntry): boolean {
  if (meal.isLiquidLog === true) return true;
  return meal.foods.length === 1 && /\(\d+ml\)$/.test(meal.foods[0].name);
}