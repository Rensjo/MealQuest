// ============================================================================
// MealQuest — Date Utilities
// ============================================================================

import { format, startOfWeek, endOfWeek, addDays, subDays, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';

/** Returns today's date as YYYY-MM-DD */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Returns the ISO date string for the start of the current week (Monday) */
export function startOfWeekISO(date?: Date): string {
  const d = date ?? new Date();
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/** Returns the ISO date string for the end of the current week (Sunday) */
export function endOfWeekISO(date?: Date): string {
  const d = date ?? new Date();
  return format(endOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/** Get an array of date strings for the current week */
export function getWeekDates(date?: Date): string[] {
  const start = startOfWeek(date ?? new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

/** Format a date string for display */
export function formatDate(dateStr: string, fmt: string = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

/** Format date as short day name */
export function formatDayShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE');
  } catch {
    return dateStr;
  }
}

/** Check if a date string is today */
export function isDateToday(dateStr: string): boolean {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

/** Check if a date string is yesterday */
export function isDateYesterday(dateStr: string): boolean {
  try {
    return isYesterday(parseISO(dateStr));
  } catch {
    return false;
  }
}

/** Get days between two date strings */
export function daysBetween(dateA: string, dateB: string): number {
  try {
    return Math.abs(differenceInDays(parseISO(dateA), parseISO(dateB)));
  } catch {
    return 0;
  }
}

/** Get yesterday's date as YYYY-MM-DD */
export function yesterdayISO(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

/** Get date N days ago as YYYY-MM-DD */
export function daysAgoISO(n: number): string {
  return format(subDays(new Date(), n), 'yyyy-MM-dd');
}

/** Get last 7 days as array of YYYY-MM-DD */
export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
}

/** Get last 30 days as array of YYYY-MM-DD */
export function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
}
