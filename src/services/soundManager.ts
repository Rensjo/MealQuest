// ============================================================================
// MealQuest — Sound Manager Service
// ============================================================================
// Centralized audio engine. Preloads sounds, manages playback, respects the
// soundStore settings, and exposes a simple function-based API.
//
// Architecture: singleton class instantiated once, reads Zustand state via
// useSoundStore.getState() so it works both inside and outside React.

import { useSoundStore } from '@/stores/soundStore';

// ---------------------------------------------------------------------------
// Sound registry — maps logical names to public-folder paths
// ---------------------------------------------------------------------------

type SfxName = 'click' | 'hover' | 'logged' | 'quest-complete' | 'badge' | 'level-up';

const SFX_FILES: Record<SfxName, string> = {
  click:           '/button-click-sound.mp3',
  hover:           '/hover-button-sound.mp3',
  logged:          '/logged-sound.wav',
  'quest-complete': '/quest-complete-sound.mp3',
  badge:           '/badge-sound.mp3',
  'level-up':      '/level-up-sound.mp3',
};

const MUSIC_FILE = '/Lonely-by-purrple-cat-background-music.mp3';

// ---------------------------------------------------------------------------
// SoundManager class
// ---------------------------------------------------------------------------

class SoundManager {
  // Audio element pools (one per SFX so we can overlap different sounds)
  private sfxCache = new Map<string, HTMLAudioElement>();

  // Background music — dedicated Audio element
  private music: HTMLAudioElement | null = null;
  private musicStarted = false;

  // Debounce timestamps to prevent spam
  private lastPlayTime = new Map<string, number>();

  // Minimum ms between repeated plays of the same sound
  private static DEBOUNCE_MS: Record<string, number> = {
    hover: 200,
    click: 80,
  };

  // ------ helpers ------

  /** Read the current sound settings snapshot (non-reactive). */
  private get settings() {
    return useSoundStore.getState();
  }

  /** Compute effective effects volume (master × effects). */
  private get effectsVol(): number {
    const s = this.settings;
    if (!s.masterEnabled || !s.effectsEnabled) return 0;
    return s.masterVolume * s.effectsVolume;
  }

  /** Compute effective music volume (master × music). */
  private get musicVol(): number {
    const s = this.settings;
    if (!s.masterEnabled || !s.musicEnabled) return 0;
    return s.masterVolume * s.musicVolume;
  }

  // ------ preloading ------

  /** Call once at app start to warm browser audio cache. */
  preloadAll(): void {
    // Preload SFX
    for (const src of Object.values(SFX_FILES)) {
      if (!this.sfxCache.has(src)) {
        const a = new Audio();
        a.preload = 'auto';
        a.src = src;
        this.sfxCache.set(src, a);
      }
    }
    // Preload background music early so it is fully buffered by the time the
    // user first clicks. Creating the Audio element here (outside the click
    // handler) ensures WebView2's user-gesture context is not needed for the
    // network fetch — only for the final .play() call.
    if (!this.music) {
      this.music = new Audio(MUSIC_FILE);
      this.music.loop = true;
      this.music.preload = 'auto';
      this.music.volume = 0; // silent until user clicks
    }
  }

  // ------ SFX playback ------

  private playSfx(name: SfxName): void {
    const vol = this.effectsVol;
    if (vol === 0) return;

    // Debounce
    const now = Date.now();
    const debounce = SoundManager.DEBOUNCE_MS[name] ?? 50;
    const lastTime = this.lastPlayTime.get(name) ?? 0;
    if (now - lastTime < debounce) return;
    this.lastPlayTime.set(name, now);

    const src = SFX_FILES[name];
    if (!src) return;

    try {
      // Clone from cache or create fresh
      let audio = this.sfxCache.get(src);
      if (!audio) {
        audio = new Audio(src);
        this.sfxCache.set(src, audio);
      }

      // For rapid replay, clone the node so overlapping is avoided per-sound
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = vol;
      clone.play().catch(() => { /* autoplay restriction — silent fail */ });
    } catch {
      // Graceful failure
    }
  }

  // ------ public SFX API ------

  playClick = (): void => this.playSfx('click');
  playHover = (): void => this.playSfx('hover');
  playLogged = (): void => this.playSfx('logged');
  playQuestComplete = (): void => this.playSfx('quest-complete');
  playBadge = (): void => this.playSfx('badge');
  playLevelUp = (): void => this.playSfx('level-up');

  // ------ background music ------

  playBackgroundMusic(): void {
    const vol = this.musicVol;

    // Element should already exist from preloadAll(); create as fallback.
    if (!this.music) {
      this.music = new Audio(MUSIC_FILE);
      this.music.loop = true;
      this.music.preload = 'auto';
    }

    this.music.volume = vol;

    if (vol === 0) {
      this.music.pause();
      return;
    }

    if (!this.musicStarted || this.music.paused) {
      const promise = this.music.play();
      if (promise !== undefined) {
        promise.catch((err: unknown) => {
          // Autoplay was blocked — retry once after a short delay.
          // This covers WebView2 edge cases where the gesture context
          // expires before the initial buffer is ready.
          if ((err as { name?: string })?.name === 'NotAllowedError') {
            setTimeout(() => {
              this.music?.play().catch(() => {});
            }, 300);
          }
        });
      }
      this.musicStarted = true;
    }
  }

  stopBackgroundMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
      this.musicStarted = false;
    }
  }

  /** Sync volume live (called from settings UI or Zustand subscriber). */
  syncMusicVolume(): void {
    if (!this.music) return;
    const vol = this.musicVol;
    this.music.volume = vol;
    if (vol === 0 && !this.music.paused) {
      this.music.pause();
    } else if (vol > 0 && this.music.paused && this.musicStarted) {
      this.music.play().catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const soundManager = new SoundManager();
