// ============================================================================
// MealQuest — Activity Notifications
// ============================================================================
// Top-left floating toast notifications for real-time activity feedback.
// Auto-dismisses after 3.5 s. Click to dismiss early.

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  ShoppingCart,
  Package,
  BookOpen,
  Droplets,
  Flame,
  Star,
  Target,
  Zap,
  Trophy,
  Swords,
} from 'lucide-react';
import {
  useNotificationStore,
  type ActivityNotification,
  type NotificationTone,
} from '@/stores/notificationStore';
import { cn } from '@/utils';

// ---------------------------------------------------------------------------
// Tone → visual config
// ---------------------------------------------------------------------------

const TONE_CONFIG: Record<
  NotificationTone,
  { icon: React.ReactNode; border: string; bg: string; iconColor: string; xpColor: string }
> = {
  meal:    { icon: <UtensilsCrossed size={13} />, border: 'border-brand/28',     bg: 'bg-brand/8',        iconColor: 'text-brand',       xpColor: 'text-brand'       },
  xp:      { icon: <Zap size={13} />,             border: 'border-brand/28',     bg: 'bg-brand/8',        iconColor: 'text-brand',       xpColor: 'text-brand'       },
  quest:   { icon: <Target size={13} />,          border: 'border-green-400/28', bg: 'bg-green-500/8',    iconColor: 'text-green-400',   xpColor: 'text-green-300'   },
  streak:  { icon: <Flame size={13} />,           border: 'border-orange-400/28',bg: 'bg-orange-500/8',   iconColor: 'text-orange-400',  xpColor: 'text-orange-300'  },
  grocery: { icon: <ShoppingCart size={13} />,    border: 'border-emerald-400/28',bg:'bg-emerald-500/8',  iconColor: 'text-emerald-400', xpColor: 'text-emerald-300' },
  pantry:  { icon: <Package size={13} />,         border: 'border-purple-400/28',bg: 'bg-purple-500/8',   iconColor: 'text-purple-400',  xpColor: 'text-purple-300'  },
  recipe:  { icon: <BookOpen size={13} />,        border: 'border-blue-400/28',  bg: 'bg-blue-500/8',     iconColor: 'text-blue-400',    xpColor: 'text-blue-300'    },
  water:   { icon: <Droplets size={13} />,        border: 'border-cyan-400/28',  bg: 'bg-cyan-500/8',     iconColor: 'text-cyan-400',    xpColor: 'text-cyan-300'    },
  level:   { icon: <Star size={13} />,            border: 'border-brand/55',     bg: 'bg-brand/14',       iconColor: 'text-brand',       xpColor: 'text-amber-300'   },
  boss:    { icon: <Swords size={13} />,          border: 'border-red-400/28',   bg: 'bg-red-500/8',      iconColor: 'text-red-400',     xpColor: 'text-red-300'     },
};

const AUTO_DISMISS_MS = 3500;

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function NotificationItem({ n }: { n: ActivityNotification }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const cfg = TONE_CONFIG[n.tone];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [n.id, dismiss]);

  return (
    <motion.button
      layout
      initial={{ x: -300, opacity: 0, scale: 0.88 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -300, opacity: 0, scale: 0.84 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      whileHover={{ x: 4, scale: 1.02 }}
      onClick={() => dismiss(n.id)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5',
        'shadow-lg backdrop-blur-md text-left cursor-pointer',
        cfg.border,
        cfg.bg,
      )}
    >
      {/* icon */}
      <div className={cn('flex-shrink-0', cfg.iconColor)}>{cfg.icon}</div>

      {/* message */}
      <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-white/85 truncate">
        {n.message}
      </p>

      {/* XP badge */}
      {n.xp != null && n.xp > 0 && (
        <span className={cn('flex-shrink-0 text-xs font-black', cfg.xpColor)}>
          +{n.xp} XP
        </span>
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Container (renders in App root)
// ---------------------------------------------------------------------------

export function ActivityNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);

  return (
    <div className="pointer-events-none fixed left-4 top-[84px] z-[55] flex w-72 flex-col gap-2">
      <AnimatePresence mode="sync" initial={false}>
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <NotificationItem n={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
