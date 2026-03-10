// ============================================================================
// MealQuest â€” Recipe Vault Page
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Heart,
  HeartOff,
  Trash2,
  Clock,
  Tag,
  X,
} from 'lucide-react';
import { SectionCard, Card, Badge, Button, Input, Modal, EmptyState, Tabs } from '@/components/ui';
import { useRecipeStore } from '@/stores/recipeStore';
import { pageVariants, staggerContainer, staggerChild, cardPop } from '@/utils/animations';
import { newId } from '@/utils';
import type { Recipe, RecipeIngredient, MealType, UnitType } from '@/types';
import { MEAL_TYPES, UNIT_TYPES } from '@/types';

const RECIPE_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Favorites', label: 'Favorites' },
  { id: 'Quick', label: 'Quick (<30 min)' },
];

export default function RecipeVault() {
  const recipes = useRecipeStore((s) => s.recipes);
  const addRecipe = useRecipeStore((s) => s.addRecipe);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite);
  const searchRecipes = useRecipeStore((s) => s.searchRecipes);

  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    prepTime: 15,
    cookTime: 15,
    tags: '',
    instructions: '',
    servings: 1,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({ name: '', qty: 1, unit: 'g' as UnitType });

  const filtered = useMemo(() => {
    let list = search ? searchRecipes(search) : recipes;
    if (tab === 'Favorites') list = list.filter((r) => r.isFavorite);
    if (tab === 'Quick') list = list.filter((r) => (r.prepTime ?? 0) < 30);
    return list;
  }, [recipes, search, tab, searchRecipes]);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      prepTime: 15,
      cookTime: 15,
      tags: '',
      instructions: '',
      servings: 1,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    setIngredients([]);
    setNewIngredient({ name: '', qty: 1, unit: 'g' });
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) return;
    setIngredients((prev) => [
      ...prev,
      { id: newId(), name: newIngredient.name.trim(), quantity: newIngredient.qty, unit: newIngredient.unit },
    ]);
    setNewIngredient({ name: '', qty: 1, unit: 'g' });
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    addRecipe({
      name: form.name.trim(),
      description: form.description.trim(),
      prepTime: form.prepTime,
      cookTime: form.cookTime,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      instructions: form.instructions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      ingredients,
      servings: form.servings,
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
    });
    resetForm();
    setShowAddModal(false);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recipe Vault</h1>
          <p className="text-sm text-neutral-400">{recipes.length} recipes saved</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Recipe
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input icon={<Search size={16} />} placeholder="Search recipesâ€¦" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Tabs tabs={RECIPE_TABS} activeTab={tab} onTabChange={setTab} />
      </div>

      {/* Recipe Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen size={40} />} title="No recipes yet" description="Add your first recipe to get started" />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((recipe) => (
            <motion.div key={recipe.id} variants={staggerChild}>
              <RecipeCard
                recipe={recipe}
                expanded={expandedId === recipe.id}
                onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                onFavorite={() => toggleFavorite(recipe.id)}
                onDelete={() => deleteRecipe(recipe.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Recipe Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="New Recipe" size="lg">
        <div className="space-y-4">
          <Input label="Recipe Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prep Time (min)"
              type="number"
              value={form.prepTime}
              onChange={(e) => setForm({ ...form, prepTime: +e.target.value })}
            />
            <Input
              label="Cook Time (min)"
              type="number"
              value={form.cookTime}
              onChange={(e) => setForm({ ...form, cookTime: +e.target.value })}
            />
          </div>

          <Input
            label="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="e.g. high-protein, quick, vegetarian"
          />

          {/* Macros */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input label="Calories" type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: +e.target.value })} />
            <Input label="Protein (g)" type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: +e.target.value })} />
            <Input label="Carbs (g)" type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: +e.target.value })} />
            <Input label="Fat (g)" type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: +e.target.value })} />
          </div>

          {/* Ingredients */}
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-300">Ingredients</p>
            <div className="flex gap-2">
              <Input
                placeholder="Name"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={newIngredient.qty}
                onChange={(e) => setNewIngredient({ ...newIngredient, qty: +e.target.value })}
                className="w-20"
              />
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-sm text-white focus:border-brand focus:outline-none"
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value as UnitType })}
              >
                {UNIT_TYPES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleAddIngredient}>+</Button>
            </div>
            {ingredients.length > 0 && (
              <ul className="mt-2 space-y-1">
                {ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-center justify-between rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                    <span>{ing.quantity} {ing.unit} {ing.name}</span>
                    <button onClick={() => handleRemoveIngredient(ing.id)} className="text-red-400 hover:text-red-300">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Instructions (one step per line)</label>
            <textarea
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none"
              rows={4}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder={"1. Preheat oven to 350Â°F\n2. Mix ingredientsâ€¦"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>Save Recipe</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// â”€â”€â”€ Recipe Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RecipeCard({
  recipe,
  expanded,
  onToggle,
  onFavorite,
  onDelete,
}: {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      variants={cardPop}
      whileHover="hover"
      className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 transition-colors backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <button onClick={onToggle} className="text-left flex-1">
          <h3 className="text-sm font-semibold text-white">{recipe.name}</h3>
          {recipe.description && (
            <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{recipe.description}</p>
          )}
        </button>
        <div className="ml-2 flex gap-1">
          <button onClick={onFavorite} className="p-1 text-neutral-500 hover:text-red-400 transition-colors">
            {recipe.isFavorite ? <Heart size={16} className="fill-red-400 text-red-400" /> : <HeartOff size={16} />}
          </button>
          <button onClick={onDelete} className="p-1 text-neutral-500 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-2">
        {recipe.prepTime > 0 && (
          <Badge variant="default">
            <Clock size={10} className="mr-1" />
            {recipe.prepTime} min prep
          </Badge>
        )}
        {recipe.tags?.map((tag) => (
          <Badge key={tag} variant="info">
            <Tag size={10} className="mr-1" />
            {tag}
          </Badge>
        ))}
      </div>

      {/* Macros */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs text-neutral-500">Cal</p>
          <p className="text-sm font-bold text-brand">{recipe.calories}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Protein</p>
          <p className="text-sm font-bold text-blue-400">{recipe.protein}g</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Carbs</p>
          <p className="text-sm font-bold text-green-400">{recipe.carbs}g</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Fat</p>
          <p className="text-sm font-bold text-orange-400">{recipe.fat}g</p>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {recipe.ingredients.length > 0 && (
              <div className="mt-3 border-t border-neutral-800 pt-3">
                <p className="mb-1.5 text-xs font-medium text-neutral-400">Ingredients</p>
                <ul className="space-y-0.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={ing.id ?? i} className="text-xs text-neutral-300">
                      â€¢ {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="mt-3 border-t border-neutral-800 pt-3">
                <p className="mb-1.5 text-xs font-medium text-neutral-400">Instructions</p>
                <ol className="list-inside list-decimal space-y-0.5">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="text-xs text-neutral-300">{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
