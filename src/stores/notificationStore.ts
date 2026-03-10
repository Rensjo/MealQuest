// ============================================================================
// MealQuest — Activity Notification Store
// ============================================================================
// Ephemeral queue for top-left floating activity toasts.
// Not persisted — cleared on reload.

import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type NotificationTone =
  | 'xp'
  | 'quest'
  | 'streak'
  | 'grocery'
  | 'pantry'
  | 'recipe'
  | 'water'
  | 'meal'
  | 'level'
  | 'boss';

export interface ActivityNotification {
  id: string;
  message: string;
  xp?: number;
  tone: NotificationTone;
  createdAt: number;
}

interface NotificationState {
  notifications: ActivityNotification[];
}

interface NotificationActions {
  push: (n: Omit<ActivityNotification, 'id' | 'createdAt'>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()((set) => ({
  notifications: [],

  push: (n) =>
    set((state) => ({
      // Max 5 visible at once; newest first
      notifications: [
        { ...n, id: nanoid(), createdAt: Date.now() },
        ...state.notifications.slice(0, 4),
      ],
    })),

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clear: () => set({ notifications: [] }),
}));
