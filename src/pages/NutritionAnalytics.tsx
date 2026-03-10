// ============================================================================
// MealQuest — Nutrition Analytics Page (Recharts)
// ============================================================================

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Droplets, PieChart as PieIcon, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { SectionCard, Card, Tabs } from '@/components/ui';
import { useMealLogStore } from '@/stores/mealLogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { pageVariants, staggerContainer, staggerChild } from '@/utils/animations';
import { getLast7Days, getLast30Days, formatDate } from '@/utils/date';

const RANGE_TABS = [
  { id: '7 Days', label: '7 Days' },
  { id: '30 Days', label: '30 Days' },
];

const COLORS = {
  calories: '#E6B75F',
  protein: '#60A5FA',
  carbs: '#34D399',
  fat: '#FB923C',
  water: '#38BDF8',
};

const PIE_COLORS = ['#60A5FA', '#34D399', '#FB923C'];

export default function NutritionAnalytics() {
  const getMealsByDateRange = useMealLogStore((s) => s.getMealsByDateRange);
  const goals = useSettingsStore((s) => s.nutritionGoals);
  const [range, setRange] = useState('7 Days');

  const dates = useMemo(() => (range === '7 Days' ? getLast7Days() : getLast30Days()), [range]);

  // Build chart data
  const chartData = useMemo(() => {
    const allMeals = getMealsByDateRange(dates[0], dates[dates.length - 1]);
    return dates.map((date) => {
      const meals = allMeals.filter((m) => m.date === date);
      const cals = meals.reduce((s: number, m) => s + m.calories, 0);
      const protein = meals.reduce((s: number, m) => s + m.protein, 0);
      const carbs = meals.reduce((s: number, m) => s + m.carbs, 0);
      const fat = meals.reduce((s: number, m) => s + m.fat, 0);
      const water = meals.reduce((s: number, m) => s + (m.water ?? 0), 0);
      return {
        date: formatDate(date, 'short'),
        calories: cals,
        protein,
        carbs,
        fat,
        water,
      };
    });
  }, [dates, getMealsByDateRange]);

  // Averages
  const avg = useMemo(() => {
    const len = chartData.length || 1;
    return {
      calories: Math.round(chartData.reduce((s, d) => s + d.calories, 0) / len),
      protein: Math.round(chartData.reduce((s, d) => s + d.protein, 0) / len),
      carbs: Math.round(chartData.reduce((s, d) => s + d.carbs, 0) / len),
      fat: Math.round(chartData.reduce((s, d) => s + d.fat, 0) / len),
      water: Math.round(chartData.reduce((s, d) => s + d.water, 0) / len),
    };
  }, [chartData]);

  // Macro distribution for pie
  const macroDistribution = useMemo(
    () => [
      { name: 'Protein', value: avg.protein, color: PIE_COLORS[0] },
      { name: 'Carbs', value: avg.carbs, color: PIE_COLORS[1] },
      { name: 'Fat', value: avg.fat, color: PIE_COLORS[2] },
    ],
    [avg]
  );

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#1E1E1E',
      border: '1px solid #333',
      borderRadius: '8px',
      fontSize: '12px',
    },
    labelStyle: { color: '#E6B75F' },
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Nutrition Analytics</h1>
          <p className="text-sm text-neutral-400">Track trends and optimize your nutrition</p>
        </div>
        <Tabs tabs={RANGE_TABS} activeTab={range} onTabChange={setRange} />
      </div>

      {/* Averages */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Avg Calories', value: `${avg.calories} kcal`, color: 'text-brand', icon: BarChart3 },
          { label: 'Avg Protein', value: `${avg.protein}g`, color: 'text-blue-400', icon: TrendingUp },
          { label: 'Avg Carbs', value: `${avg.carbs}g`, color: 'text-green-400', icon: TrendingUp },
          { label: 'Avg Fat', value: `${avg.fat}g`, color: 'text-orange-400', icon: TrendingUp },
          { label: 'Avg Water', value: `${avg.water} ml`, color: 'text-sky-400', icon: Droplets },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerChild}>
            <Card className="text-center">
              <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
              <p className="text-xs text-neutral-500">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calorie Trend */}
        <SectionCard title="Calorie Trend" subtitle="Daily caloric intake">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.calories} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.calories} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke={COLORS.calories}
                  fill="url(#calGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Protein Trend */}
        <SectionCard title="Protein Trend" subtitle="Daily protein intake (g)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="protein"
                  stroke={COLORS.protein}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.protein }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Macro Distribution Pie */}
        <SectionCard title="Macro Distribution" subtitle="Average macro split">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {macroDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Water Intake */}
        <SectionCard title="Water Intake" subtitle="Daily water consumption (ml)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="water" fill={COLORS.water} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}
