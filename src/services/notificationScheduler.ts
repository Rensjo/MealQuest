// ============================================================================
// MealQuest — Smart Notification Scheduler
// ============================================================================
// Context-aware notifications: meal reminders, hydration prompts,
// grocery alerts, and pantry expiry warnings. Designed to be helpful,
// not spammy — each notification type has a cooldown.

import { nanoid } from 'nanoid';
import type { SmartNotification, MealEntry, PantryItem, GroceryItem } from '@/types';

// ---------------------------------------------------------------------------
// Cooldown tracking (in-memory, resets on reload)
// ---------------------------------------------------------------------------

const lastFired = new Map<string, number>();

function canFire(key: string, cooldownMs: number): boolean {
  const last = lastFired.get(key) ?? 0;
  if (Date.now() - last < cooldownMs) return false;
  lastFired.set(key, Date.now());
  return true;
}

// Cooldowns in ms
const COOLDOWNS = {
  mealReminder: 3 * 60 * 60 * 1000,    // 3 hours between meal reminders
  hydration: 2 * 60 * 60 * 1000,        // 2 hours between hydration nudges
  grocery: 24 * 60 * 60 * 1000,         // 1/day
  pantryExpiry: 12 * 60 * 60 * 1000,    // 12 hours
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check all notification conditions and return any that should fire now.
 * Called periodically (e.g. every few minutes) or on page load.
 */
export function checkSmartNotifications(params: {
  todayMeals: MealEntry[];
  waterGoal: number;
  pantryItems: PantryItem[];
  groceryItems: GroceryItem[];
  groceryNextDate: string;
}): SmartNotification[] {
  const { todayMeals, waterGoal, pantryItems, groceryItems, groceryNextDate } = params;
  const notifications: SmartNotification[] = [];
  const now = new Date();
  const hour = now.getHours();
  const nowISO = now.toISOString();

  // 1. Meal reminders
  const hasBreakfast = todayMeals.some(m => m.mealType === 'breakfast');
  const hasLunch = todayMeals.some(m => m.mealType === 'lunch');
  const hasDinner = todayMeals.some(m => m.mealType === 'dinner');

  if (!hasBreakfast && hour >= 10 && hour < 12 && canFire('breakfast-reminder', COOLDOWNS.mealReminder)) {
    notifications.push({
      id: nanoid(), type: 'meal-reminder',
      message: "Don't forget to log your breakfast! A good morning meal sets up your day.",
      dismissed: false, createdAt: nowISO,
    });
  }
  if (!hasLunch && hour >= 13 && hour < 15 && canFire('lunch-reminder', COOLDOWNS.mealReminder)) {
    notifications.push({
      id: nanoid(), type: 'meal-reminder',
      message: "Lunchtime check-in! Have you eaten lunch yet? Log it to keep your streak going.",
      dismissed: false, createdAt: nowISO,
    });
  }
  if (!hasDinner && hour >= 19 && hour < 21 && canFire('dinner-reminder', COOLDOWNS.mealReminder)) {
    notifications.push({
      id: nanoid(), type: 'meal-reminder',
      message: "Evening reminder: Log your dinner to complete today's meal tracking.",
      dismissed: false, createdAt: nowISO,
    });
  }

  // 2. Hydration reminder
  const todayWater = todayMeals.reduce((s, m) => s + m.water, 0);
  if (todayWater < waterGoal * 0.5 && hour >= 14 && canFire('hydration-reminder', COOLDOWNS.hydration)) {
    notifications.push({
      id: nanoid(), type: 'hydration',
      message: `You've only logged ${Math.round(todayWater)}ml of water today. Stay hydrated — aim for ${waterGoal}ml!`,
      dismissed: false, createdAt: nowISO,
    });
  }

  // 3. Grocery reminder (day before scheduled trip)
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const unpurchased = groceryItems.filter(i => !i.isPurchased);

  if ((groceryNextDate === todayStr || groceryNextDate === tomorrowStr) && unpurchased.length > 0 && canFire('grocery-reminder', COOLDOWNS.grocery)) {
    notifications.push({
      id: nanoid(), type: 'grocery',
      message: `Grocery trip ${groceryNextDate === todayStr ? 'today' : 'tomorrow'}! You have ${unpurchased.length} items on your list.`,
      dismissed: false, createdAt: nowISO,
    });
  }

  // 4. Pantry expiry alerts
  const threeDaysOut = new Date(now);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  const expiryThreshold = threeDaysOut.toISOString().split('T')[0];

  const expiringSoon = pantryItems.filter(p =>
    p.expiryDate && p.expiryDate <= expiryThreshold && p.quantity > 0
  );
  if (expiringSoon.length > 0 && canFire('pantry-expiry', COOLDOWNS.pantryExpiry)) {
    const names = expiringSoon.slice(0, 3).map(p => p.name).join(', ');
    const extra = expiringSoon.length > 3 ? ` and ${expiringSoon.length - 3} more` : '';
    notifications.push({
      id: nanoid(), type: 'pantry-expiry',
      message: `Heads up! ${names}${extra} in your pantry will expire soon. Consider using them up.`,
      dismissed: false, createdAt: nowISO,
    });
  }

  return notifications;
}

/**
 * Reset all cooldowns (for testing / settings).
 */
export function resetCooldowns(): void {
  lastFired.clear();
}
