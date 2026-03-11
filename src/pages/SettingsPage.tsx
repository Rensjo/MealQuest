// ============================================================================
// MealQuest — Settings Page
// ============================================================================

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Target,
  Shield,
  Info,
  Bell,
  BellOff,
  Palette,
  Database,
  Trophy,
  Lock,
  Music,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSoundStore } from '@/stores/soundStore';
import { soundManager } from '@/services/soundManager';
import { useXPStore } from '@/stores/xpStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { pageVariants } from '@/utils/animations';
import { cn } from '@/utils';
import type { Badge, BadgeTier } from '@/types';

const WHATS_NEW: { version: string; date: string; entries: string[] }[] = [
  {
    version: 'v1.3 — Smart Intelligence Update',
    date: 'Mar 2026',
    entries: [
      'Smart Nutrition Score: daily 0–100 score with S–F grade and 5-category breakdown (meal consistency, macros, hydration, sugar control, home-cooked)',
      'Weekly Insights engine: auto-detects meal consistency, protein trends, hydration levels, and home-cooking ratios',
      'Habit Pattern Detection: identifies positive and negative eating habits across 14 days of data',
      'Meal Suggestion Engine: personalized recommendations scored by diet strategy, pantry ingredient match, and variety',
      'Predictive Grocery System: forecasts what you need to buy based on meal frequency and pantry stock levels',
      'Smart Notifications: context-aware meal reminders, hydration alerts, grocery trip reminders, and pantry expiry warnings',
      'Monthly Trend Charts: 12-month area chart of nutrition score and consistency',
      'Pantry Auto-Deduction: cooking a recipe now automatically deducts matched ingredients from pantry inventory',
      'Adaptive Quest Difficulty: daily missions scale up to 5 tiers as your completion streak grows',
      'Smart Badges: 4 new achievements — Data Starter, Insight Seeker, Nutrition Analyst, AI Master Chef',
      'Smart Intelligence Dashboard: bento-grid layout with uniform row heights and fluid card sizing',
    ],
  },
  {
    version: 'v1.2 — Full Experience Update',
    date: 'Mar 2025',
    entries: [
      'Nutrition Dashboard redesigned: health indicator, food-source pie chart, calorie trend & macro balance widgets',
      'Water tracker and sweet tracker widgets on the dashboard',
      'Meal heatmap showing 7-day and 30-day logging patterns',
      'Floating Action Dock for quick access to Quests, Recipe Vault, and Weekly Boss',
      'User Status Panel with editable username, custom avatar upload, and daily stats',
      'Goals Panel with instant diet strategy switching and auto-synced nutrition targets',
      'Weekly Review page with S–F grading, macro averages, trend analysis, and streak summary',
      'Badge unlock popup with spring-bounce animation and tier-styled confetti',
      'Activity notifications now color-coded by type (meal, XP, quest, streak, boss, etc.)',
      'Pantry widget and grocery widget integrated into the dashboard',
      'Sound manager: debounced effects, preload system, and per-channel volume sliders',
      'Analytics store with cached chart data and review history',
    ],
  },
  {
    version: 'v1.1 — Gamification Update',
    date: 'Jan 2025',
    entries: [
      'Centralized XP system: earn XP for every meaningful action',
      '25-quest daily pool — 5 unique quests selected every day',
      '10 rotating Weekly Bosses with 3 challenge conditions each',
      'Floating activity notifications in the top-left corner',
      'Diet strategy presets now sync nutrition targets automatically',
      'Streak milestones award bonus XP with animated notifications',
      'Level-up celebration redesigned with XP progress display',
    ],
  },
  {
    version: 'v1.0 — Launch',
    date: 'Dec 2024',
    entries: [
      'Meal logging with breakfast, lunch, dinner and snack tracking',
      'Grocery list with pantry auto-sync on purchase',
      'Pantry inventory with expiry and low-stock tracking',
      'Recipe vault with search, tags and favorites',
      'Nutrition goals dashboard with daily progress rings',
      'Streak system for breakfast, hydration and home-cooked meals',
      'Weekly Boss challenges and daily mission system',
    ],
  },
];

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

const TIER_META: Record<BadgeTier, { label: string; bar: string; glow: string; chip: string; icon: string }> = {
  bronze:   { label: 'Bronze',   bar: 'from-amber-600 via-orange-500 to-amber-400',   glow: 'shadow-[0_0_12px_rgba(217,119,6,0.35)]',  chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',  icon: '🥉' },
  silver:   { label: 'Silver',   bar: 'from-zinc-400 via-slate-300 to-zinc-200',      glow: 'shadow-[0_0_12px_rgba(148,163,184,0.35)]', chip: 'bg-zinc-400/15 text-zinc-200 border-zinc-400/30',     icon: '🥈' },
  gold:     { label: 'Gold',     bar: 'from-yellow-400 via-amber-300 to-yellow-200',  glow: 'shadow-[0_0_12px_rgba(234,179,8,0.5)]',   chip: 'bg-yellow-500/15 text-yellow-200 border-yellow-400/30', icon: '🥇' },
  platinum: { label: 'Platinum', bar: 'from-cyan-400 via-violet-400 to-purple-400',   glow: 'shadow-[0_0_14px_rgba(139,92,246,0.45)]', chip: 'bg-violet-500/15 text-violet-200 border-violet-400/30', icon: '💎' },
};

function BadgeCard({ badge }: { badge: Badge }) {
  const earned = !!badge.unlockedAt;
  const meta = TIER_META[badge.tier];
  const pct = Math.min(100, Math.round((badge.progress / badge.requirement) * 100));

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border transition-all duration-200',
      earned
        ? `border-white/10 bg-zinc-900/70 ${meta.glow}`
        : 'border-white/5 bg-zinc-900/40'
    )}>
      {/* Tier gradient top bar */}
      <div className={cn('h-[3px] w-full bg-gradient-to-r', meta.bar, !earned && 'opacity-20')} />

      {/* Lock overlay */}
      {!earned && (
        <div className="absolute inset-0 top-[3px] flex items-center justify-center bg-zinc-950/40 rounded-b-xl z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 border border-white/8">
            <Lock size={14} className="text-white/25" />
          </div>
        </div>
      )}

      <div className={cn('p-4', !earned && 'opacity-30')}>
        {/* Icon */}
        <div className="mb-3 text-3xl text-center">{badge.icon}</div>

        {/* Name + tier chip */}
        <div className="mb-1 text-center">
          <p className="text-xs font-bold text-white/90 leading-tight">{badge.name}</p>
        </div>
        <p className="mb-3 text-[10px] text-amber-200/40 text-center leading-tight">{badge.description}</p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all', meta.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Progress label */}
        <p className="mt-1.5 text-[10px] text-amber-200/35 text-center">
          {earned
            ? `Earned ${new Date(badge.unlockedAt!).toLocaleDateString()}`
            : `${badge.progress.toLocaleString()} / ${badge.requirement.toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}

function SettingToggle({ icon, label, description, enabled, onToggle }: { icon: React.ReactNode; label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3.5 hover:border-brand/16 hover:bg-brand/4 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', enabled ? 'bg-brand/12 text-brand' : 'bg-white/5 text-amber-200/30')}>
          {icon}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-white/85">{label}</p>
          <p className="text-xs text-amber-200/30">{description}</p>
        </div>
      </div>
      <div className={cn('h-6 w-11 rounded-full transition-colors', enabled ? 'bg-brand' : 'bg-white/10')}>
        <div className={cn('h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform shadow-sm', enabled ? 'translate-x-5' : 'translate-x-0.5')} />
      </div>
    </button>
  );
}

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-200/50">{label}</span>
        <span className="text-[10px] font-bold text-brand/80">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/8 accent-brand [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(230,183,95,0.5)]"
      />
    </div>
  );
}

export default function SettingsPage() {
  const settings = useSettingsStore();
  const sound = useSoundStore();
  const totalXP = useXPStore((s) => s.totalXP);
  const level = useXPStore((s) => s.level);
  const badges = useBadgeStore((s) => s.badges);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = settings.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mealquest-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        settings.importData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    settings.resetAll();
    setShowResetConfirm(false);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12">
          <SettingsIcon size={22} className="text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-amber-200/40">Customize your MealQuest experience</p>
        </div>
      </div>

      {/* Account Summary */}
      <div className="flex items-center gap-4 rounded-2xl border border-brand/16 bg-brand/6 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/12 text-brand shadow-neon">
          <Shield size={28} />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-white">Level {level} Adventurer</p>
          <p className="text-sm text-amber-200/40">{totalXP.toLocaleString()} total XP earned</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-amber-200/30">Lifetime Stats</p>
          <p className="text-sm font-black text-brand">{totalXP.toLocaleString()} XP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          {/* App Preferences */}
          <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={15} className="text-brand" />
              <span className="text-sm font-bold text-white/90">App Preferences</span>
            </div>
            <div className="space-y-2">
              <SettingToggle
                icon={<Sparkles size={16} />}
                label="Animations"
                description="Smooth transitions and motion effects"
                enabled={settings.animationsEnabled}
                onToggle={() => settings.toggleAnimations()}
              />
            </div>
          </div>

          {/* ── Sound Settings ── */}
          <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Headphones size={15} className="text-brand" />
              <span className="text-sm font-bold text-white/90">Sound &amp; Music</span>
            </div>
            <div className="space-y-3">
              {/* Toggles */}
              <SettingToggle
                icon={sound.masterEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                label="Master Sound"
                description="Enable or disable all audio"
                enabled={sound.masterEnabled}
                onToggle={() => { sound.toggleMaster(); soundManager.syncMusicVolume(); }}
              />
              <SettingToggle
                icon={sound.effectsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                label="Sound Effects"
                description="Click, hover, and action sounds"
                enabled={sound.effectsEnabled}
                onToggle={() => sound.toggleEffects()}
              />
              <SettingToggle
                icon={<Music size={16} />}
                label="Background Music"
                description="Ambient loop while using the app"
                enabled={sound.musicEnabled}
                onToggle={() => {
                  sound.toggleMusic();
                  // Start or stop music immediately
                  const next = !sound.musicEnabled;
                  if (next) soundManager.playBackgroundMusic();
                  else soundManager.stopBackgroundMusic();
                }}
              />

              {/* Volume sliders */}
              <div className="space-y-3 pt-2">
                <VolumeSlider label="Master Volume" value={sound.masterVolume} onChange={(v) => { sound.setMasterVolume(v); soundManager.syncMusicVolume(); }} />
                <VolumeSlider label="Effects Volume" value={sound.effectsVolume} onChange={sound.setEffectsVolume} />
                <VolumeSlider label="Music Volume" value={sound.musicVolume} onChange={(v) => { sound.setMusicVolume(v); soundManager.syncMusicVolume(); }} />
              </div>
            </div>
          </div>

          {/* Notification Preferences (UI placeholder) */}
          <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={15} className="text-brand" />
              <span className="text-sm font-bold text-white/90">Notifications</span>
              <span className="rounded-full border border-brand/18 bg-brand/8 px-2 py-0.5 text-[10px] text-brand">Coming Soon</span>
            </div>
            <div className="space-y-2 opacity-50 pointer-events-none">
              <SettingToggle
                icon={<Bell size={16} />}
                label="Meal Reminders"
                description="Get reminded to log meals at scheduled times"
                enabled={false}
                onToggle={() => {}}
              />
              <SettingToggle
                icon={<Target size={16} />}
                label="Goal Alerts"
                description="Notifications when you're close to daily targets"
                enabled={false}
                onToggle={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Data Management */}
          <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={15} className="text-brand" />
              <span className="text-sm font-bold text-white/90">Data Management</span>
            </div>
            <div className="space-y-3">
              <button onClick={() => { soundManager.playClick(); handleExport(); }} onMouseEnter={() => soundManager.playHover()} className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5 hover:border-brand/16 hover:bg-brand/4 transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                  <Download size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white/85">Export Data</p>
                  <p className="text-xs text-amber-200/30">Download all data as JSON backup</p>
                </div>
              </button>

              <button onClick={() => { soundManager.playClick(); fileInputRef.current?.click(); }} onMouseEnter={() => soundManager.playHover()} className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5 hover:border-brand/16 hover:bg-brand/4 transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10 text-blue-400">
                  <Upload size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white/85">Import Data</p>
                  <p className="text-xs text-amber-200/30">Restore from a JSON backup file</p>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

              {showResetConfirm ? (
                <div className="rounded-xl border border-red-500/22 bg-red-500/8 p-4">
                  <p className="mb-3 text-sm text-red-300">
                    This will permanently delete ALL your data. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" onClick={handleReset}>
                      Yes, Reset Everything
                    </Button>
                    <button onClick={() => setShowResetConfirm(false)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { soundManager.playClick(); setShowResetConfirm(true); }} onMouseEnter={() => soundManager.playHover()} className="flex w-full items-center gap-3 rounded-xl border border-red-500/14 bg-red-500/4 p-3.5 hover:border-red-500/25 hover:bg-red-500/8 transition-all">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10 text-red-400">
                    <Trash2 size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-red-300">Reset All Data</p>
                    <p className="text-xs text-red-300/40">Permanently delete all stored data</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Badges ── */}
      {(() => {
        const earned = badges.filter(b => b.unlockedAt);
        const tiers: BadgeTier[] = ['platinum', 'gold', 'silver', 'bronze'];
        const tierCounts = tiers.reduce((acc, t) => {
          acc[t] = badges.filter(b => b.tier === t && b.unlockedAt).length;
          return acc;
        }, {} as Record<BadgeTier, number>);
        return (
          <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-brand" />
                <span className="text-sm font-bold text-white/90">Badges</span>
                <span className="rounded-full border border-brand/18 bg-brand/8 px-2 py-0.5 text-[10px] text-brand font-bold">
                  {earned.length} / {badges.length}
                </span>
              </div>
              {/* Tier breakdown */}
              <div className="flex items-center gap-1.5">
                {tiers.map(t => (
                  <span key={t} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', TIER_META[t].chip)}>
                    {TIER_META[t].icon} {tierCounts[t]}
                  </span>
                ))}
              </div>
            </div>

            {/* Tier groups */}
            <div className="space-y-6">
              {tiers.map(tier => {
                const tierBadges = badges.filter(b => b.tier === tier);
                const meta = TIER_META[tier];
                return (
                  <div key={tier}>
                    {/* Tier header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn('h-[2px] w-4 rounded-full bg-gradient-to-r', meta.bar)} />
                      <span className={cn('text-[11px] font-black uppercase tracking-widest', meta.chip.split(' ')[1])}>
                        {meta.icon} {meta.label}
                      </span>
                      <div className={cn('h-[2px] flex-1 rounded-full bg-gradient-to-r opacity-20', meta.bar)} />
                    </div>
                    {/* Badge cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {tierBadges.map(badge => (
                        <BadgeCard key={badge.id} badge={badge} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* What's New */}
      <div className="rounded-2xl border border-brand/12 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-brand" />
          <span className="text-sm font-bold text-white/90">What's New</span>
        </div>
        <div className="space-y-4">
          {WHATS_NEW.map((release) => (
            <div key={release.version} className="border-l-2 border-brand/25 pl-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-brand">{release.version}</span>
                <span className="text-xs text-amber-200/30">{release.date}</span>
              </div>
              <ul className="space-y-1">
                {release.entries.map((entry, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-200/60">
                    <span className="mt-0.5 shrink-0 text-brand/60">•</span>
                    {entry}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="flex items-center gap-3 rounded-2xl border border-brand/8 bg-white/[0.01] p-4">
        <Info size={14} className="text-amber-200/25" />
        <p className="text-xs text-amber-200/30">
          MealQuest v1.3.0 · Part of the QuestlyKai Ecosystem · Built with React, TypeScript & Tauri
        </p>
      </div>
    </motion.div>
  );
}
