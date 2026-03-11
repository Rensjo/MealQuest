# MealQuest

> A gamified nutrition tracking and meal planning desktop app. Log meals, plan nutrition, manage your pantry, complete quests, earn XP, and level up your healthy eating habits — all offline and private.

---

## 1. Project Overview

**MealQuest** is a cross-platform desktop application that turns nutrition tracking into an RPG-style adventure. Users track meals, manage recipes and pantry inventory, set nutrition goals, and earn experience points — all while completing daily quests, weekly boss battles, and unlocking tiered badges.

| Aspect | Detail |
|---|---|
| **Target Users** | Health-conscious individuals, fitness enthusiasts, meal planners |
| **Core Concept** | Meal logging with auto-nutrition estimation, grocery/pantry management, recipe vault, and diet strategy presets |
| **Gamification** | XP, levels, daily missions, weekly boss battles, streaks, badges, and activity notifications |
| **Privacy Model** | Fully offline — all data lives in browser `localStorage` (via Zustand persist). No server, no telemetry |

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | React + TypeScript | React 18.3, TS 5.5 |
| **Desktop Shell** | Tauri v2 (Rust backend) | 2.x |
| **Build Tool** | Vite | 5.4 |
| **Styling** | Tailwind CSS + PostCSS | 3.4 |
| **State Management** | Zustand (with `persist` middleware) | 4.5 |
| **Animations** | Framer Motion | 11.x |
| **Charts** | Recharts | 3.2 |
| **Icons** | Lucide React | 0.447 |
| **Date Utilities** | date-fns | 4.1 |
| **ID Generation** | nanoid | 5.x |
| **Storage** | localStorage (Zustand persist) |
| **Audio** | HTML5 Audio API (custom sound manager) |
| **CI/CD** | GitHub Actions (per-platform build workflows + multi-platform release) |

---

## 3. Folder Structure

```
MealQuest/
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite config (Tauri base path, terser, chunk splitting)
├── tailwind.config.ts            # Tailwind theme configuration
├── postcss.config.js             # PostCSS pipeline
├── tsconfig.json                 # TypeScript strict config (ES2020 target)
│
├── public/                       # Static assets (sounds, music)
│   └── icons/                    # UI graphics and food icons
│
├── icons/                        # Platform-specific app icons (ICO, ICNS, PNG)
│
├── src/
│   ├── main.tsx                  # React root mount
│   ├── App.tsx                   # Root component — layout, sound, navigation, overlays
│   ├── index.css                 # Global styles (Tailwind directives)
│   ├── vite-env.d.ts             # Vite client type augmentation
│   │
│   ├── components/               # UI components
│   │   ├── TopBar.tsx                # Header with page title, status panel toggles
│   │   ├── FloatingActionDock.tsx    # Quick access: Quests, Recipe Vault, Weekly Boss
│   │   ├── RecipeVaultPanel.tsx      # Slide-in recipe vault panel
│   │   ├── Navigation.tsx            # Page navigation
│   │   ├── navigation/              # Navigation components (FloatingNav)
│   │   ├── dashboard/               # Dashboard widgets (heatmap, charts, trackers, SmartWidgets)
│   │   ├── gaming/                  # Gamification components
│   │   │   ├── FloatingMissions.tsx      # Daily missions panel
│   │   │   ├── WeeklyBossPanel.tsx       # Weekly boss battle UI
│   │   │   ├── UserStatusPanel.tsx       # Profile, level, XP, stats
│   │   │   ├── GoalsPanel.tsx            # Diet strategy selector
│   │   │   ├── BadgeUnlockedPopup.tsx    # Badge unlock celebration
│   │   │   ├── ActivityNotifications.tsx # Color-coded activity toasts
│   │   │   ├── GamingComponents.tsx      # Level-up celebration, floating XP
│   │   │   └── StatusPanel.tsx           # Compact status display
│   │   └── ui/                      # Reusable UI primitives (Button, ProgressBar)
│   │
│   ├── pages/                    # App pages
│   │   ├── NutritionDashboard.tsx    # Main dashboard with widgets
│   │   ├── MealLog.tsx               # Meal logging with auto-nutrition
│   │   ├── FoodHub.tsx               # Recipes, pantry, grocery management
│   │   ├── NutritionGoals.tsx        # Daily targets and diet strategies
│   │   ├── SettingsPage.tsx          # Preferences, sound, data, badges, changelog
│   │   ├── StreakTracker.tsx         # Streak statistics (embedded)
│   │   ├── WeeklyReview.tsx          # Weekly grade and analysis (embedded)
│   │   ├── NutritionAnalytics.tsx    # Analytics charts (embedded)
│   │   └── index.ts                  # Page exports
│   │
│   ├── stores/                   # Zustand state management (16 stores)
│   │   ├── mealLogStore.ts           # Meal logging state
│   │   ├── nutritionStore.ts         # Nutrition targets & tracking
│   │   ├── groceryStore.ts           # Grocery list management
│   │   ├── pantryStore.ts            # Pantry inventory
│   │   ├── recipeStore.ts            # Recipe vault
│   │   ├── plannerStore.ts           # Meal planner
│   │   ├── xpStore.ts                # XP and leveling system
│   │   ├── questStore.ts             # Daily missions & weekly boss
│   │   ├── streakStore.ts            # Streak tracking
│   │   ├── badgeStore.ts             # Badge progress & unlocks
│   │   ├── analyticsStore.ts         # Analytics cache
│   │   ├── settingsStore.ts          # User preferences
│   │   ├── soundStore.ts             # Audio settings
│   │   ├── notificationStore.ts      # Activity notifications
│   │   ├── intelligenceStore.ts      # Smart Intelligence state (Phase 3)
│   │   └── index.ts                  # Store exports
│   │
│   ├── services/                 # Service layer
│   │   ├── soundManager.ts          # Audio playback, preloading, volume control
│   │   ├── nutritionScore.ts        # Daily nutrition score (0–100) calculation
│   │   ├── insightEngine.ts         # Weekly insight detection engine
│   │   ├── habitDetector.ts         # Positive/negative habit pattern analysis
│   │   ├── mealSuggestionEngine.ts  # Personalized meal recommendation scoring
│   │   ├── groceryPredictor.ts      # Predictive grocery forecasting
│   │   └── notificationScheduler.ts # Context-aware smart notification rules
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useDailyRefresh.ts        # Daily mission/boss/quest refresh
│   │   ├── useNutritionTracker.ts    # Nutrition calculation hook
│   │   ├── useSound.ts               # Sound playback hook
│   │   └── index.ts                  # Hook exports
│   │
│   ├── utils/                    # Utility modules
│   │   ├── animations.ts            # Shared animation variants
│   │   ├── date.ts                   # Date formatting helpers
│   │   ├── foodDatabase.ts           # Built-in food nutrition database
│   │   ├── gamification.ts           # XP formulas, skill tiers
│   │   └── index.ts                  # Utility exports (cn, clamp, etc.)
│   │
│   └── types/                    # TypeScript type definitions
│       └── index.ts                  # All interfaces and types
│
├── src-tauri/                    # Tauri (Rust) backend
│   ├── tauri.conf.json              # Tauri config (window, bundle, security)
│   ├── Cargo.toml                   # Rust dependencies
│   ├── build.rs                     # Tauri build script
│   └── src/
│       └── main.rs                  # Rust entry point
│
└── .github/workflows/            # CI/CD
    ├── build-windows.yml            # Windows build & package
    ├── build-linux.yml              # Linux build & package
    ├── build-macos.yml              # macOS universal build & package
    └── release.yml                  # Multi-platform release creation
```

---

## 4. Features

### Nutrition Tracking
- **Meal logging** with four categories: breakfast, lunch, dinner, snack
- **Auto-nutrition estimation** from a built-in food database based on portion size
- **Manual override** for calories, protein, carbs, fat, and water
- **Portion size presets**: Small, Medium, Large, Extra Large
- **Quick food suggestions** with auto-complete dropdown
- **Date navigation** with week view and per-day meal counts

### Nutrition Dashboard
- Daily meal breakdown across four slots with calorie totals
- Health indicator with 7-day and 30-day balance analysis
- Food-source pie chart (home-cooked vs fast-food)
- Water tracker and sweet tracker widgets
- Meal heatmap calendar (7-day / 30-day)
- Calorie trend line chart and macro balance pie chart
- Pantry and grocery quick-access widgets
- **Smart Intelligence section** (bento-grid layout): Nutrition Score, Insights, Habit Patterns, Monthly Trends, Grocery Predictions, and Meal Suggestions — all in uniform-height CSS Grid rows

### Nutrition Goals
- Editable daily targets for calories, protein, carbs, fat, and water
- Real-time progress rings for each goal
- **5 diet strategy presets**: Balanced, High Protein, Keto, Plant-Based, Performance
- One-click preset application with auto-synced targets
- 7-day rolling averages and goal completion tracking

### Food Hub
- **Recipes**: Create, search, filter (all / favorites / quick), with prep/cook time, servings, and instructions
- **Pantry**: Inventory tracking with expiry dates, low-stock alerts, and quantity adjustments
- **Grocery**: Shopping list with quantities, estimated costs, and auto-sync to pantry on purchase

### Gamification
- **XP system**: Earn XP for logging meals, hitting goals, completing quests, and maintaining streaks
- **Leveling**: Progressive curve (100 × 1.5^(level-1) XP per level)
- **Diet strategy multipliers**: 1.05x–1.15x XP based on selected strategy
- **Streak bonus**: Up to +15% XP (5% per active streak)
- **Daily missions**: 5 quests drawn from a 25-quest pool, refreshed daily, with **adaptive difficulty** scaling up to 5 tiers as the player levels up
- **Weekly boss battles**: 10 rotating bosses with 3 challenge conditions each
- **Badges**: 28 badges across 6 categories (meals, recipes, streaks, quests, levels, home-cook, + 4 Smart Intelligence badges) with Bronze/Silver/Gold/Platinum tiers
- **Streaks**: Breakfast, hydration, and home-cooked streaks with milestone XP rewards
- **Level-up celebrations** and **badge unlock popups** with animations

### Smart Intelligence (Phase 3)
- **Nutrition Score**: Daily 0–100 score with S–F letter grade across 5 weighted categories (goal completion, meal timing, macro balance, variety, hydration)
- **Weekly Insights**: Auto-detected patterns — meal consistency, protein trends, missed targets, calorie streaks — with actionable tips
- **Habit Pattern Detection**: Identifies positive and negative eating habits from historical data
- **Meal Suggestion Engine**: Personalized recommendations scored by diet strategy alignment, pantry availability, and past meal diversity
- **Predictive Grocery System**: Forecasts what ingredients to buy based on consumption frequency and current pantry stock
- **Smart Notifications**: Context-aware reminders — meal time alerts, hydration nudges, streak risk warnings, positive reinforcement
- **Monthly Trend Charts**: 12-month area chart of nutrition score and meal consistency via Recharts
- **Pantry Auto-Deduction**: Cooking a recipe automatically deducts matched pantry ingredients

### UI & Panels
- **Floating Action Dock**: Quick buttons for Quests, Recipe Vault, Weekly Boss
- **User Status Panel**: Editable username, avatar upload, level, XP, daily stats
- **Goals Panel**: Instant diet strategy switching
- **Activity Notifications**: Color-coded floating toasts for every meaningful action
- **Weekly Review**: S–F grading, macro averages, trend analysis, and streak summary

### Settings & Data
- Animation toggle, sound/music volume sliders, per-channel toggles
- Export/import data as JSON backup
- Reset all data with confirmation
- Full badge gallery with tier styling and progress tracking
- Version changelog

---

## 5. Getting Started

### Prerequisites
- **Node.js** 20+
- **Rust** (stable toolchain) — for Tauri desktop builds
- **npm** (ships with Node.js)

### Development

```bash
# Install dependencies
npm install

# Start Vite dev server (web only)
npm run dev

# Start Tauri dev (desktop app with hot reload)
npm run tauri:dev
```

### Production Build

```bash
# Build web assets
npm run build

# Build Tauri desktop app (bundles for current platform)
npm run tauri:build
```

---

## 6. Build Outputs

After running `npm run tauri:build`, platform-specific installers are generated in `src-tauri/target/release/bundle/`:

| Platform | Output |
|---|---|
| **Windows** | `.msi` installer + `.exe` (NSIS) |
| **macOS** | `.dmg` disk image |
| **Linux** | `.AppImage` + `.deb` package |

---

## 7. CI/CD

GitHub Actions workflows automatically build the app for all platforms on push to `main`:

| Workflow | Trigger | Output |
|---|---|---|
| `build-windows.yml` | Push to main / tags | Windows complete package (MSI + NSIS + Portable) |
| `build-macos.yml` | Push to main / tags | macOS universal DMG package |
| `build-linux.yml` | Push to main / tags | Linux package (AppImage + DEB + Portable) |
| `release.yml` | Tag push (`v*`) | Multi-platform GitHub Release with all installers |

---

## 8. Privacy & Storage

All data is stored locally in the browser's `localStorage` via Zustand persist middleware. No data is ever sent to any server. There is no telemetry, no analytics, and no external API calls.

| Storage Key | Contents |
|---|---|
| `mealquest-meals` | Meal log entries |
| `mealquest-nutrition` | Nutrition targets |
| `mealquest-pantry` | Pantry inventory |
| `mealquest-grocery` | Grocery list |
| `mealquest-recipes` | Recipe vault |
| `mealquest-xp` | XP, level, history |
| `mealquest-quests` | Daily missions, weekly boss |
| `mealquest-streaks` | Streak tracking |
| `mealquest-badges` | Badge progress |
| `mealquest-settings` | User preferences |
| `mealquest-sound` | Audio settings |
| `mealquest-intelligence` | Smart Intelligence state (scores, insights, habits, suggestions, predictions) |

---

## 9. Version History

### v1.3 — Smart Intelligence Update (Mar 2026)
- Smart Nutrition Score: daily 0–100 score with S–F grade and 5-category breakdown
- Weekly Insights engine: auto-detects meal consistency, protein trends, and missed targets with tips
- Habit Pattern Detection: identifies positive and negative eating habits from historical logs
- Meal Suggestion Engine: personalized recommendations scored by diet strategy and pantry stock
- Predictive Grocery System: forecasts ingredients to buy based on consumption frequency
- Smart Notifications: context-aware meal reminders, hydration alerts, and streak warnings
- Monthly Trend Charts: 12-month area chart of nutrition score and meal consistency
- Pantry Auto-Deduction: cooking a recipe now automatically deducts matched pantry ingredients
- Adaptive Quest Difficulty: daily missions scale up to 5 tiers as player level increases
- Smart Badges: 4 new achievements — Data Starter, Insight Seeker, Nutrition Analyst, AI Master Chef
- Smart Intelligence Dashboard: bento-grid layout with 4-column CSS Grid and uniform row heights

### v1.2 — Full Experience Update (Mar 2025)
- Nutrition Dashboard redesigned with health indicator, food-source charts, calorie trends, and macro balance widgets
- Water tracker and sweet tracker dashboard widgets
- Meal heatmap showing 7-day and 30-day logging patterns
- Floating Action Dock for quick access to Quests, Recipe Vault, and Weekly Boss
- User Status Panel with editable username, custom avatar upload, and daily stats
- Goals Panel with instant diet strategy switching and auto-synced nutrition targets
- Weekly Review page with S–F grading, macro averages, trend analysis, and streak summary
- Badge unlock popup with spring-bounce animation and tier-styled confetti
- Activity notifications color-coded by type (meal, XP, quest, streak, boss, etc.)
- Sound manager with debounced effects, preload system, and per-channel volume sliders
- Analytics store with cached chart data and review history

### v1.1 — Gamification Update (Jan 2025)
- Centralized XP system: earn XP for every meaningful action
- 25-quest daily pool with 5 unique quests selected each day
- 10 rotating Weekly Bosses with 3 challenge conditions each
- Floating activity notifications in the top-left corner
- Diet strategy presets auto-sync nutrition targets
- Streak milestones award bonus XP with animated notifications
- Level-up celebration redesigned with XP progress display

### v1.0 — Launch (Dec 2024)
- Meal logging with breakfast, lunch, dinner, and snack tracking
- Grocery list with pantry auto-sync on purchase
- Pantry inventory with expiry and low-stock tracking
- Recipe vault with search, tags, and favorites
- Nutrition goals dashboard with daily progress rings
- Streak system for breakfast, hydration, and home-cooked meals
- Weekly Boss challenges and daily mission system

---

## 10. License

Copyright © 2026 Renkai Studios. All rights reserved.

---

*Part of the QuestlyKai Ecosystem — Built with React, TypeScript & Tauri*
