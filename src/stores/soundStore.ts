// ============================================================================
// MealQuest — Sound Store
// ============================================================================
// Dedicated Zustand store for all sound/music settings.
// Persisted to localStorage so preferences survive across sessions.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundState {
  masterEnabled: boolean;
  effectsEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;   // 0–1
  effectsVolume: number;  // 0–1
  musicVolume: number;    // 0–1
}

interface SoundActions {
  toggleMaster: () => void;
  toggleEffects: () => void;
  toggleMusic: () => void;
  setMasterVolume: (v: number) => void;
  setEffectsVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const DEFAULT_SOUND: SoundState = {
  masterEnabled: true,
  effectsEnabled: true,
  musicEnabled: true,
  masterVolume: 0.7,
  effectsVolume: 0.25,
  musicVolume: 0.25,
};

export const useSoundStore = create<SoundState & SoundActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SOUND,

      toggleMaster: () => set((s) => ({ masterEnabled: !s.masterEnabled })),
      toggleEffects: () => set((s) => ({ effectsEnabled: !s.effectsEnabled })),
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      setMasterVolume: (v) => set({ masterVolume: clamp01(v) }),
      setEffectsVolume: (v) => set({ effectsVolume: clamp01(v) }),
      setMusicVolume: (v) => set({ musicVolume: clamp01(v) }),
    }),
    { name: 'mealquest-sound' }
  )
);
