// ============================================================================
// MealQuest — Phase 3 Smart Dashboard Widgets
// ============================================================================
// NutritionScoreCard, InsightPanel, HabitPatternCard,
// MealSuggestionPanel, GroceryPredictionPanel, SmartNotificationBanner,
// MonthlyTrendChart

import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Bell,
  BellOff,
  X,
  Leaf,
  Droplets,
  Flame,
  Target,
  ChefHat,
  Clock,
  ArrowRight,
  BarChart3,
  Activity,
  Zap,
  CircleDot,
  RefreshCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { cn } from '@/utils';
import { useIntelligenceStore } from '@/stores/intelligenceStore';
import { soundManager } from '@/services/soundManager';
import type {
  DailyNutritionScore,
  NutritionInsight,
  HabitPattern,
  MealSuggestion,
  GroceryPrediction,
  SmartNotification,
  MonthlyTrend,
} from '@/types';

// ---------------------------------------------------------------------------
// Shared warm card wrapper (matches existing dashboard style)
// ---------------------------------------------------------------------------

function WarmCard({ children, className, glow, onClick }: { children: React.ReactNode; className?: string; glow?: boolean; onClick?: () => void }) {
  const Tag = onClick ? motion.button : motion.div as React.ElementType;
  return (
    <Tag
      onClick={() => { if (onClick) { soundManager.playClick(); onClick(); } }}
      onMouseEnter={() => soundManager.playHover()}
      className={cn(
        'rounded-2xl border bg-[#1a0d00]/85 backdrop-blur-sm transition-all duration-300 text-left w-full',
        glow
          ? 'border-brand/55 shadow-[0_0_42px_rgba(230,183,95,0.38)]'
          : 'border-brand/20 hover:border-brand/52 hover:shadow-[0_0_44px_rgba(230,183,95,0.40)]',
        onClick && 'cursor-pointer',
        className,
      )}
      whileHover={{ y: onClick ? -4 : -2, scale: onClick ? 1.02 : 1.005, boxShadow: onClick ? '0 0 44px rgba(230,183,95,0.40)' : '0 0 28px rgba(230,183,95,0.18)' }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// GRADE helpers
// ---------------------------------------------------------------------------

const GRADE_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  S: { color: 'text-brand',       bg: 'bg-brand/15',       border: 'border-brand/40',       glow: 'shadow-[0_0_20px_rgba(230,183,95,0.5)]' },
  A: { color: 'text-green-400',   bg: 'bg-green-500/12',   border: 'border-green-500/30',   glow: 'shadow-[0_0_16px_rgba(74,222,128,0.3)]' },
  B: { color: 'text-blue-400',    bg: 'bg-blue-500/12',    border: 'border-blue-500/30',    glow: 'shadow-[0_0_16px_rgba(96,165,250,0.3)]' },
  C: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/25',  glow: '' },
  D: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  glow: '' },
  F: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',     glow: '' },
};

// ============================================================================
// 1. NUTRITION SCORE CARD
// ============================================================================

export function NutritionScoreCard() {
  const refreshDailyScore = useIntelligenceStore((s) => s.refreshDailyScore);
  const getWeekScores = useIntelligenceStore((s) => s.getWeekScores);
  const dailyScores = useIntelligenceStore((s) => s.dailyScores);

  useEffect(() => { refreshDailyScore(); }, [refreshDailyScore]);

  const todayScore = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyScores[today];
  }, [dailyScores]);

  const weekScores = useMemo(() => getWeekScores(), [getWeekScores, dailyScores]);
  const weekAvg = weekScores.length > 0
    ? Math.round(weekScores.reduce((s, sc) => s + sc.score, 0) / weekScores.length)
    : 0;

  if (!todayScore) {
    return (
      <WarmCard className="p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-brand" />
          <span className="text-sm font-bold text-white/85">Nutrition Score</span>
        </div>
        <p className="flex-1 text-xs text-amber-200/35 flex items-center">Log meals today to see your score</p>
      </WarmCard>
    );
  }

  const g = GRADE_CONFIG[todayScore.grade] ?? GRADE_CONFIG.F;
  const { breakdown } = todayScore;

  const BREAKDOWN_ROWS = [
    { label: 'Meal Consistency', value: breakdown.mealConsistency, max: 25, color: 'bg-amber-400' },
    { label: 'Nutrition Balance', value: breakdown.nutritionBalance, max: 30, color: 'bg-green-400' },
    { label: 'Hydration',         value: breakdown.hydration, max: 20, color: 'bg-blue-400' },
    { label: 'Sugar Control',     value: breakdown.sugarControl, max: 15, color: 'bg-purple-400' },
    { label: 'Home Cooked',       value: breakdown.homeCooked, max: 10, color: 'bg-emerald-400' },
  ];

  return (
    <WarmCard className="p-5 h-full flex flex-col" glow={todayScore.grade === 'S'}>
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-brand" />
        <span className="text-sm font-bold text-white/85">Nutrition Score</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-amber-200/35">Week avg</span>
          <span className="text-xs font-black text-brand">{weekAvg}</span>
        </div>
      </div>

      {/* Big score + grade */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="34" fill="none"
              stroke="currentColor" strokeWidth="6" strokeLinecap="round"
              className={g.color}
              strokeDasharray={`${2 * Math.PI * 34}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - todayScore.score / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-black leading-none', g.color)}>{todayScore.score}</span>
            <span className="text-[10px] text-amber-200/35">/100</span>
          </div>
        </div>
        <div>
          <div className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1', g.bg, g.border, g.glow, 'border')}>
            <span className={cn('text-lg font-black', g.color)}>{todayScore.grade}</span>
            <span className="text-xs text-amber-200/45">Grade</span>
          </div>
          <p className="text-xs text-amber-200/35 mt-2">
            {todayScore.score >= 80 ? 'Excellent nutrition today!' : todayScore.score >= 60 ? 'Good job, keep improving!' : 'Room for improvement'}
          </p>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {BREAKDOWN_ROWS.map(({ label, value, max, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-amber-200/45">{label}</span>
              <span className="text-xs font-bold text-white/60">{value}/{max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', color)}
                initial={{ width: 0 }}
                animate={{ width: `${(value / max) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </WarmCard>
  );
}

// ============================================================================
// 2. INSIGHT PANEL
// ============================================================================

const INSIGHT_ICON: Record<string, React.ReactNode> = {
  consistency: <Target size={14} className="text-amber-400" />,
  macros:      <Flame size={14} className="text-orange-400" />,
  hydration:   <Droplets size={14} className="text-blue-400" />,
  habits:      <Activity size={14} className="text-purple-400" />,
  progress:    <TrendingUp size={14} className="text-green-400" />,
};

const INSIGHT_TYPE_STYLE: Record<string, { border: string; icon: React.ReactNode }> = {
  positive: { border: 'border-green-500/20', icon: <CheckCircle2 size={12} className="text-green-400" /> },
  warning:  { border: 'border-orange-500/20', icon: <AlertTriangle size={12} className="text-orange-400" /> },
  neutral:  { border: 'border-brand/15', icon: <Lightbulb size={12} className="text-brand" /> },
};

export function InsightPanel() {
  const insights = useIntelligenceStore((s) => s.insights);
  const refreshInsights = useIntelligenceStore((s) => s.refreshInsights);

  useEffect(() => { refreshInsights(); }, [refreshInsights]);

  return (
    <WarmCard className="p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} className="text-brand" />
        <span className="text-sm font-bold text-white/85">Weekly Insights</span>
        <button
          onClick={() => { soundManager.playClick(); refreshInsights(); }}
          onMouseEnter={() => soundManager.playHover()}
          className="ml-auto text-amber-200/30 hover:text-brand transition-colors"
        >
          <RefreshCcw size={13} />
        </button>
      </div>

      {insights.length === 0 ? (
        <p className="flex-1 text-xs text-amber-200/30 italic flex items-center">Log meals this week to unlock insights</p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
          {insights.slice(0, 5).map((insight) => {
            const style = INSIGHT_TYPE_STYLE[insight.type] ?? INSIGHT_TYPE_STYLE.neutral;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn('rounded-xl border bg-white/[0.02] px-3 py-2.5', style.border)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {INSIGHT_ICON[insight.category] ?? INSIGHT_ICON.progress}
                  <span className="text-xs font-bold text-white/80">{insight.title}</span>
                  <span className="ml-auto">{style.icon}</span>
                </div>
                <p className="text-xs text-amber-200/45 leading-relaxed">{insight.message}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </WarmCard>
  );
}

// ============================================================================
// 3. HABIT PATTERN CARD
// ============================================================================

export function HabitPatternCard() {
  const patterns = useIntelligenceStore((s) => s.habitPatterns);
  const refreshHabitPatterns = useIntelligenceStore((s) => s.refreshHabitPatterns);

  useEffect(() => { refreshHabitPatterns(); }, [refreshHabitPatterns]);

  const PATTERN_STYLE: Record<string, { icon: React.ReactNode; color: string }> = {
    positive: { icon: <CheckCircle2 size={13} />, color: 'text-green-400' },
    negative: { icon: <AlertTriangle size={13} />, color: 'text-orange-400' },
    neutral:  { icon: <CircleDot size={13} />, color: 'text-blue-400' },
  };

  return (
    <WarmCard className="p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-purple-400" />
        <span className="text-sm font-bold text-white/85">Habit Patterns</span>
        <span className="ml-auto text-xs text-amber-200/30">{patterns.length} detected</span>
      </div>

      {patterns.length === 0 ? (
        <p className="flex-1 text-xs text-amber-200/30 italic flex items-center">Need more data to detect patterns</p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
          {patterns.slice(0, 4).map((p) => {
            const style = PATTERN_STYLE[p.type] ?? PATTERN_STYLE.neutral;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={style.color}>{style.icon}</span>
                  <span className="text-xs font-bold text-white/80">{p.pattern}</span>
                  <span className="ml-auto text-[10px] text-amber-200/25">{p.frequency}×</span>
                </div>
                {p.suggestion && (
                  <p className="text-xs text-amber-200/40 leading-relaxed pl-5">{p.suggestion}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </WarmCard>
  );
}

// ============================================================================
// 4. MEAL SUGGESTION PANEL
// ============================================================================

export function MealSuggestionPanel() {
  const suggestions = useIntelligenceStore((s) => s.mealSuggestions);
  const refreshMealSuggestions = useIntelligenceStore((s) => s.refreshMealSuggestions);

  useEffect(() => { refreshMealSuggestions(); }, [refreshMealSuggestions]);

  return (
    <WarmCard className="p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-brand" />
        <span className="text-sm font-bold text-white/85">Meal Suggestions</span>
        <button
          onClick={() => { soundManager.playClick(); refreshMealSuggestions(); }}
          onMouseEnter={() => soundManager.playHover()}
          className="ml-auto text-amber-200/30 hover:text-brand transition-colors"
        >
          <RefreshCcw size={13} />
        </button>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-xs text-amber-200/30 italic">Set your diet strategy in Settings to get suggestions</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.slice(0, 6).map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onMouseEnter={() => soundManager.playHover()}
              whileHover={{ y: -2, boxShadow: '0 0 18px rgba(230,183,95,0.22)' }}
              className="rounded-xl border border-brand/15 bg-brand/5 px-3 py-2.5 cursor-default"
            >
              <div className="flex items-center gap-2 mb-1">
                <ChefHat size={12} className="text-brand" />
                <span className="text-xs font-bold text-white/85 truncate flex-1">{s.name}</span>
                <span className="text-[10px] font-bold text-brand/70">{s.score}%</span>
              </div>
              <p className="text-[11px] text-amber-200/40 mb-1.5 line-clamp-1">{s.reason}</p>
              <div className="flex items-center gap-2 text-[10px] text-amber-200/30">
                <span>{s.calories} kcal</span>
                <span>P:{s.protein}g</span>
                <span>C:{s.carbs}g</span>
                <span>F:{s.fat}g</span>
              </div>
              {s.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {s.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-amber-200/30">{t}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </WarmCard>
  );
}

// ============================================================================
// 5. GROCERY PREDICTION PANEL
// ============================================================================

const URGENCY_STYLE: Record<string, { color: string; label: string; bg: string }> = {
  high:   { color: 'text-red-400',    label: 'Urgent',  bg: 'bg-red-500/10' },
  medium: { color: 'text-yellow-400', label: 'Soon',    bg: 'bg-yellow-500/10' },
  low:    { color: 'text-green-400',  label: 'Later',   bg: 'bg-green-500/10' },
};

export function GroceryPredictionPanel() {
  const predictions = useIntelligenceStore((s) => s.groceryPredictions);
  const refreshGroceryPredictions = useIntelligenceStore((s) => s.refreshGroceryPredictions);

  useEffect(() => { refreshGroceryPredictions(); }, [refreshGroceryPredictions]);

  return (
    <WarmCard className="p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart size={16} className="text-emerald-400" />
        <span className="text-sm font-bold text-white/85">Grocery Predictions</span>
        <button
          onClick={() => { soundManager.playClick(); refreshGroceryPredictions(); }}
          onMouseEnter={() => soundManager.playHover()}
          className="ml-auto text-amber-200/30 hover:text-brand transition-colors"
        >
          <RefreshCcw size={13} />
        </button>
      </div>

      {predictions.length === 0 ? (
        <p className="flex-1 text-xs text-amber-200/30 italic flex items-center">Log more meals to predict grocery needs</p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
          {predictions.slice(0, 6).map((p, i) => {
            const u = URGENCY_STYLE[p.urgency] ?? URGENCY_STYLE.low;
            return (
              <motion.div
                key={`${p.name}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <div className={cn('rounded-lg px-2 py-0.5 text-[10px] font-bold', u.bg, u.color)}>
                  {u.label}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white/80 truncate block">{p.name}</span>
                  <span className="text-[10px] text-amber-200/35">{p.reason}</span>
                </div>
                {p.estimatedDaysUntilOut > 0 && (
                  <span className="text-[10px] text-amber-200/30 flex-shrink-0">
                    ~{p.estimatedDaysUntilOut}d
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </WarmCard>
  );
}

// ============================================================================
// 6. SMART NOTIFICATION BANNER
// ============================================================================

export function SmartNotificationBanner() {
  const notifications = useIntelligenceStore((s) => s.smartNotifications);
  const checkNotifications = useIntelligenceStore((s) => s.checkNotifications);
  const dismissSmartNotification = useIntelligenceStore((s) => s.dismissSmartNotification);

  useEffect(() => { checkNotifications(); }, [checkNotifications]);

  const active = useMemo(
    () => notifications.filter((n) => !n.dismissed).slice(0, 3),
    [notifications],
  );

  if (active.length === 0) return null;

  const TYPE_ICON: Record<string, React.ReactNode> = {
    'meal-reminder':  <ChefHat size={14} className="text-amber-400" />,
    'hydration':      <Droplets size={14} className="text-blue-400" />,
    'grocery':        <ShoppingCart size={14} className="text-green-400" />,
    'pantry-expiry':  <AlertTriangle size={14} className="text-orange-400" />,
    'insight':        <Lightbulb size={14} className="text-brand" />,
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {active.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/8 px-4 py-2.5"
          >
            {TYPE_ICON[n.type] ?? <Bell size={14} className="text-brand" />}
            <p className="flex-1 text-xs text-amber-100/70">{n.message}</p>
            <button
              onClick={() => { soundManager.playClick(); dismissSmartNotification(n.id); }}
              className="text-amber-200/30 hover:text-white/70 transition-colors"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 7. MONTHLY TREND CHART
// ============================================================================

export function MonthlyTrendChart() {
  const trends = useIntelligenceStore((s) => s.monthlyTrends);
  const refreshMonthlyTrends = useIntelligenceStore((s) => s.refreshMonthlyTrends);

  useEffect(() => { refreshMonthlyTrends(); }, [refreshMonthlyTrends]);

  const chartData = useMemo(
    () => [...trends].reverse().slice(-12).map((t) => ({
      month: t.month.substring(5), // MM only
      calories: t.avgCalories,
      protein: t.avgProtein,
      score: t.avgScore,
      consistency: t.consistency,
      meals: t.totalMeals,
    })),
    [trends],
  );

  return (
    <WarmCard className="p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-brand" />
        <span className="text-sm font-bold text-white/85">Monthly Trends</span>
        <button
          onClick={() => { soundManager.playClick(); refreshMonthlyTrends(); }}
          onMouseEnter={() => soundManager.playHover()}
          className="ml-auto text-amber-200/30 hover:text-brand transition-colors"
        >
          <RefreshCcw size={13} />
        </button>
      </div>

      {chartData.length === 0 ? (
        <p className="text-xs text-amber-200/30 italic">Log meals across multiple months to see trends</p>
      ) : (
        <>
          {/* Summary strip */}
          {trends.length > 0 && (
            <div className="flex gap-2 mb-4">
              {[
                { label: 'Avg Cal', value: trends[0].avgCalories, color: 'text-orange-400' },
                { label: 'Avg Score', value: trends[0].avgScore, color: 'text-brand' },
                { label: 'Consistency', value: `${trends[0].consistency}%`, color: 'text-green-400' },
                { label: 'Total Meals', value: trends[0].totalMeals, color: 'text-blue-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 rounded-lg border border-white/6 bg-white/3 px-2 py-1.5 text-center">
                  <span className={cn('text-sm font-black block', color)}>{value}</span>
                  <span className="text-[10px] text-amber-200/30">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chart — grows to fill remaining card height */}
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e6b75f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e6b75f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1a0d00', border: '1px solid rgba(230,183,95,0.3)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#e6b75f' }}
                />
                <Area type="monotone" dataKey="score" stroke="#e6b75f" fill="url(#scoreGrad)" strokeWidth={2} name="Score" />
                <Area type="monotone" dataKey="consistency" stroke="#4ade80" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Consistency %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </WarmCard>
  );
}
