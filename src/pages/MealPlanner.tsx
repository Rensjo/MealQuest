// ============================================================================
// MealQuest — Daily Meal Planner Page
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../services/soundManager';
import {
  CalendarDays,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Trash2,
} from 'lucide-react';
import { SectionCard, Card, Button, Input, Select, EmptyState, Badge, Modal } from '@/components/ui';
import { usePlannerStore } from '@/stores/plannerStore';
import { todayISO, formatDate } from '@/utils/date';
import { formatCalories, formatGrams } from '@/utils';
import { pageVariants, staggerContainer, staggerChild } from '@/utils/animations';
import type { MealType } from '@/types';

const MEAL_SECTIONS: { type: MealType; label: string; icon: React.ReactNode }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: <Coffee size={18} /> },
  { type: 'lunch', label: 'Lunch', icon: <Sun size={18} /> },
  { type: 'dinner', label: 'Dinner', icon: <Moon size={18} /> },
  { type: 'snack', label: 'Snack', icon: <Cookie size={18} /> },
];

export default function MealPlanner() {
  const { plannedMeals, addPlannedMeal, deletePlannedMeal, toggleCompleted, clearDay } =
    usePlannerStore();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMealType, setAddMealType] = useState<MealType>('breakfast');
  const [formName, setFormName] = useState('');
  const [formCalories, setFormCalories] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');

  const dayMeals = useMemo(
    () => plannedMeals.filter((m) => m.date === selectedDate),
    [plannedMeals, selectedDate]
  );

  const navigateDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleAdd = () => {
    addPlannedMeal({
      date: selectedDate,
      mealType: addMealType,
      name: formName || 'Planned Meal',
      calories: parseFloat(formCalories) || 0,
      protein: parseFloat(formProtein) || 0,
      carbs: parseFloat(formCarbs) || 0,
      fat: parseFloat(formFat) || 0,
    });
    setFormName('');
    setFormCalories('');
    setFormProtein('');
    setFormCarbs('');
    setFormFat('');
    setShowAddModal(false);
  };

  const openAddFor = (type: MealType) => {
    setAddMealType(type);
    setShowAddModal(true);
  };

  const totalCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
  const completedCount = dayMeals.filter((m) => m.completed).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Meal Planner</h1>
          <p className="text-sm text-neutral-400">Plan your meals ahead of time</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => { soundManager.playClick(); clearDay(selectedDate); }}>
          Clear Day
        </Button>
      </div>

      {/* Date Navigation */}
      <Card className="flex items-center justify-between">
        <button
          onClick={() => { soundManager.playClick(); navigateDay(-1); }}
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{formatDate(selectedDate, 'EEEE')}</p>
          <p className="text-sm text-neutral-400">{formatDate(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => { soundManager.playClick(); navigateDay(1); }}
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </Card>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Planned Calories</p>
          <p className="text-xl font-bold text-brand">{formatCalories(totalCalories)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Planned Meals</p>
          <p className="text-xl font-bold text-white">{dayMeals.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Completed</p>
          <p className="text-xl font-bold text-green-400">
            {completedCount}/{dayMeals.length}
          </p>
        </Card>
      </div>

      {/* Meal Sections */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {MEAL_SECTIONS.map((section) => {
          const sectionMeals = dayMeals.filter((m) => m.mealType === section.type);

          return (
            <motion.div key={section.type} variants={staggerChild}>
              <SectionCard
                title={section.label}
                subtitle={`${sectionMeals.length} planned`}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Plus size={14} />}
                    onClick={() => { soundManager.playClick(); openAddFor(section.type); }}
                  >
                    Add
                  </Button>
                }
              >
                {sectionMeals.length === 0 ? (
                  <p className="py-4 text-center text-sm text-neutral-600">No meals planned</p>
                ) : (
                  <div className="space-y-2">
                    {sectionMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center gap-3 rounded-lg border border-neutral-800/50 bg-neutral-800/20 p-3"
                      >
                        <button
                          onClick={() => { soundManager.playClick(); toggleCompleted(meal.id); }}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            meal.completed
                              ? 'border-green-500 bg-green-500/10 text-green-400'
                              : 'border-neutral-600 hover:border-brand'
                          }`}
                        >
                          {meal.completed && <Check size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${meal.completed ? 'text-neutral-500 line-through' : 'text-white'}`}>
                            {meal.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {formatCalories(meal.calories)} · {formatGrams(meal.protein)} P ·{' '}
                            {formatGrams(meal.carbs)} C · {formatGrams(meal.fat)} F
                          </p>
                        </div>
                        <button
                          onClick={() => { soundManager.playClick(); deletePlannedMeal(meal.id); }}
                          className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add Planned Meal Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Plan a Meal">
        <div className="space-y-4">
          <Input
            label="Meal Name"
            placeholder="e.g. Overnight Oats"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories"
              type="number"
              placeholder="0"
              value={formCalories}
              onChange={(e) => setFormCalories(e.target.value)}
            />
            <Input
              label="Protein (g)"
              type="number"
              placeholder="0"
              value={formProtein}
              onChange={(e) => setFormProtein(e.target.value)}
            />
            <Input
              label="Carbs (g)"
              type="number"
              placeholder="0"
              value={formCarbs}
              onChange={(e) => setFormCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              placeholder="0"
              value={formFat}
              onChange={(e) => setFormFat(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add to Plan</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
