// ============================================================================
// MealQuest — useSound Hook
// ============================================================================
// Provides memoized sound-trigger callbacks that respect the soundStore.
// Components just call e.g. `playClick()` — the hook handles volume/mute.

import { useCallback, useRef } from 'react';
import { soundManager } from '@/services/soundManager';

/**
 * Primary hook consumed by every component that needs sound.
 * All returned functions are stable references (no deps on store —
 * the SoundManager reads Zustand state internally at play-time).
 */
export function useSound() {
  // Stable refs so callbacks never change identity
  const playClick         = useCallback(() => soundManager.playClick(), []);
  const playHover         = useCallback(() => soundManager.playHover(), []);
  const playLogged        = useCallback(() => soundManager.playLogged(), []);
  const playQuestComplete = useCallback(() => soundManager.playQuestComplete(), []);
  const playBadge         = useCallback(() => soundManager.playBadge(), []);
  const playLevelUp       = useCallback(() => soundManager.playLevelUp(), []);

  return { playClick, playHover, playLogged, playQuestComplete, playBadge, playLevelUp };
}

/**
 * Returns an `onMouseEnter` handler with built-in 200 ms debounce.
 * Attach to any element that should play the hover sound.
 */
export function useHoverSound() {
  const lastRef = useRef(0);

  const onHoverSound = useCallback(() => {
    const now = Date.now();
    if (now - lastRef.current < 200) return;
    lastRef.current = now;
    soundManager.playHover();
  }, []);

  return onHoverSound;
}
