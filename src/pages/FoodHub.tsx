// ============================================================================
// MealQuest — Food Hub (Merged: Recipes + Pantry + Grocery)
// ============================================================================
// Unified food management page with three tabs.

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Package,
  ShoppingCart,
  Plus,
  Search,
  Heart,
  HeartOff,
  Trash2,
  Clock,
  Tag,
  X,
  AlertTriangle,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Check,
  DollarSign,
  Store,
  CreditCard,
  ChefHat,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from 'lucide-react';
import {
  SectionCard,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  EmptyState,
  Tabs,
} from '@/components/ui';
import { useRecipeStore } from '@/stores/recipeStore';
import { usePantryStore } from '@/stores/pantryStore';
import { useGroceryStore } from '@/stores/groceryStore';
import { pageVariants, staggerContainer, staggerChild, cardPop } from '@/utils/animations';
import { cn, newId, formatCurrency } from '@/utils';
import { soundManager } from '@/services/soundManager';
import type { Recipe, RecipeIngredient, MealType, UnitType } from '@/types';
import { MEAL_TYPES, UNIT_TYPES } from '@/types';

const HUB_TABS = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'grocery', label: 'Grocery' },
];

// ============================================================================
// FOOD HUB — Main Page
// ============================================================================

export default function FoodHub() {
  const [activeTab, setActiveTab] = useState('recipes');

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Header */}
      <div className="rounded-2xl border border-brand/15 bg-zinc-900/50 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-transparent via-brand to-transparent" />
        <div className="flex items-center gap-3 p-4">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand/12 border border-brand/20 shadow-lg shadow-brand/10 shrink-0">
            <ChefHat size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Food Hub</h1>
            <p className="text-sm text-amber-200/40">Recipes, pantry &amp; grocery list</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl border border-zinc-700/30 bg-zinc-900/60 p-1 w-fit">
        {HUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { soundManager.playClick(); setActiveTab(t.id); }}
            onMouseEnter={() => soundManager.playHover()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              activeTab === t.id
                ? 'bg-brand text-black shadow-md shadow-brand/25'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            {t.id === 'recipes' && <BookOpen size={13} />}
            {t.id === 'pantry'  && <Package size={13} />}
            {t.id === 'grocery' && <ShoppingCart size={13} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'recipes' && <RecipesTab key="recipes" />}
        {activeTab === 'pantry' && <PantryTab key="pantry" />}
        {activeTab === 'grocery' && <GroceryTab key="grocery" />}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// RECIPES TAB
// ============================================================================

const RECIPE_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Favorites', label: 'Favorites' },
  { id: 'Quick', label: 'Quick (<30 min)' },
];

function RecipesTab() {
  const recipes = useRecipeStore((s) => s.recipes);
  const addRecipe = useRecipeStore((s) => s.addRecipe);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite);
  const searchRecipes = useRecipeStore((s) => s.searchRecipes);

  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      name: '', description: '', prepTime: 15, cookTime: 15,
      tags: '', instructions: '', servings: 1, calories: 0, protein: 0, carbs: 0, fat: 0,
    });
    setIngredients([]);
    setNewIngredient({ name: '', qty: 1, unit: 'g' });
  };

  const handleAddRecipe = () => {
    if (!form.name.trim()) return;
    addRecipe({
      name: form.name,
      description: form.description || undefined,
      ingredients,
      instructions: form.instructions.split('\n').filter(Boolean),
      prepTime: form.prepTime,
      cookTime: form.cookTime,
      servings: form.servings,
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    soundManager.playLogged();
    resetForm();
    setShowAddModal(false);
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    setIngredients((prev) => [
      ...prev,
      { id: newId(), name: newIngredient.name, quantity: newIngredient.qty, unit: newIngredient.unit },
    ]);
    setNewIngredient({ name: '', qty: 1, unit: 'g' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Search & Filter */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 text-white text-sm placeholder-zinc-500 rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:border-brand/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={13} />
            </button>
          )}
        </div>
        <motion.button
          className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-black text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand/20 transition-colors whitespace-nowrap"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { soundManager.playClick(); setShowAddModal(true); }}
        >
          <Plus size={15} />
          New Recipe
        </motion.button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {RECIPE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-brand text-black shadow-lg shadow-brand/30'
                : 'bg-zinc-800/70 text-zinc-400 border border-zinc-700/40 hover:text-white hover:border-brand/25'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-semibold mb-1">No recipes found</p>
          <p className="text-zinc-600 text-sm">{search ? `No results for "${search}"` : 'Add your first recipe above!'}</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3 sm:grid-cols-2">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              expanded={expandedId === recipe.id}
              onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
              onFavorite={() => toggleFavorite(recipe.id)}
              onDelete={() => deleteRecipe(recipe.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Add Recipe Modal */}
      <Modal isOpen={showAddModal} onClose={() => { resetForm(); setShowAddModal(false); }} title="New Recipe" size="lg">
        <div className="space-y-4">
          <Input label="Recipe Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Stir-fry" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prep Time (min)" type="number" value={String(form.prepTime)} onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })} />
            <Input label="Cook Time (min)" type="number" value={String(form.cookTime)} onChange={(e) => setForm({ ...form, cookTime: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Servings" type="number" value={String(form.servings)} onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })} />
            <Input label="Calories" type="number" value={String(form.calories)} onChange={(e) => setForm({ ...form, calories: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Protein (g)" type="number" value={String(form.protein)} onChange={(e) => setForm({ ...form, protein: Number(e.target.value) })} />
            <Input label="Carbs (g)" type="number" value={String(form.carbs)} onChange={(e) => setForm({ ...form, carbs: Number(e.target.value) })} />
            <Input label="Fat (g)" type="number" value={String(form.fat)} onChange={(e) => setForm({ ...form, fat: Number(e.target.value) })} />
          </div>
          <Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma,separated,tags" />

          {/* Ingredients */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-neutral-300">Ingredients</p>
            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="flex items-center gap-2 text-sm text-neutral-300">
                <span className="flex-1">{ing.quantity} {ing.unit} {ing.name}</span>
                <button onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300"><X size={14} /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="Name" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} />
              <Input className="w-16" type="number" value={String(newIngredient.qty)} onChange={(e) => setNewIngredient({ ...newIngredient, qty: Number(e.target.value) })} />
              <Button variant="ghost" size="sm" onClick={addIngredient}><PlusIcon size={14} /></Button>
            </div>
          </div>

          <textarea
            placeholder="Instructions..."
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-brand/50 focus:outline-none"
            rows={3}
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { resetForm(); setShowAddModal(false); }}>Cancel</Button>
            <Button onClick={handleAddRecipe}>Add Recipe</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cuisine theme helper (mirrors RecipeVaultPanel)
// ─────────────────────────────────────────────────────────────────────────────
type RecipeTheme = { bar: string; cardBg: string; border: string; badgeClass: string; flag: string; label: string };

function getRecipeTheme(tags: string[]): RecipeTheme {
  const t = tags.map((s) => s.toLowerCase());
  if (t.some((s) => ['filipino', 'sinigang', 'shanghai', 'lumpia', 'adobo', 'pork'].includes(s)))
    return { bar: 'from-orange-400 via-amber-300 to-yellow-300', cardBg: 'from-orange-950/55 via-amber-950/30 to-zinc-900/80', border: 'border-orange-500/20 hover:border-orange-400/45', badgeClass: 'bg-orange-500/12 text-orange-300 border-orange-500/25', flag: '\ud83c\uddf5\ud83c\udded', label: 'Filipino' };
  if (t.some((s) => ['korean', 'bibimbap', 'kimchi'].includes(s)))
    return { bar: 'from-red-400 via-rose-400 to-pink-300', cardBg: 'from-red-950/55 via-rose-950/30 to-zinc-900/80', border: 'border-red-500/20 hover:border-red-400/45', badgeClass: 'bg-red-500/12 text-red-300 border-red-500/25', flag: '\ud83c\uddf0\ud83c\uddf7', label: 'Korean' };
  if (t.some((s) => ['beef', 'steak', 'keto', 'grilled'].includes(s)))
    return { bar: 'from-red-600 via-red-500 to-orange-400', cardBg: 'from-red-950/60 via-zinc-950/40 to-zinc-900/80', border: 'border-red-700/25 hover:border-red-500/50', badgeClass: 'bg-red-700/15 text-red-300 border-red-600/30', flag: '\ud83e\udd69', label: 'Beef' };
  if (t.some((s) => ['curry', 'chicken', 'spicy'].includes(s)))
    return { bar: 'from-yellow-500 via-amber-400 to-orange-400', cardBg: 'from-yellow-950/55 via-amber-950/30 to-zinc-900/80', border: 'border-yellow-600/20 hover:border-yellow-400/45', badgeClass: 'bg-yellow-500/12 text-yellow-300 border-yellow-500/25', flag: '\ud83c\udf5b', label: 'Curry' };
  if (t.some((s) => ['pasta', 'seafood', 'tuna', 'cream'].includes(s)))
    return { bar: 'from-blue-500 via-cyan-400 to-teal-300', cardBg: 'from-blue-950/55 via-cyan-950/28 to-zinc-900/80', border: 'border-blue-500/20 hover:border-blue-400/45', badgeClass: 'bg-blue-500/12 text-blue-300 border-blue-500/25', flag: '\ud83c\udf5d', label: 'Pasta' };
  return { bar: 'from-brand via-amber-400 to-yellow-300', cardBg: 'from-zinc-900/80 to-zinc-800/50', border: 'border-zinc-700/40 hover:border-brand/40', badgeClass: 'bg-brand/12 text-brand border-brand/25', flag: '\ud83c\udf7d\ufe0f', label: 'Recipe' };
}

// Recipe Card sub-component
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
  const theme = getRecipeTheme(recipe.tags);
  const totalTime = recipe.prepTime + recipe.cookTime;
  return (
    <motion.div variants={staggerChild}>
      <div
        className={cn(
          'relative group bg-gradient-to-br rounded-2xl border overflow-hidden transition-colors cursor-pointer',
          theme.cardBg, theme.border
        )}
        onClick={onToggle}
        onMouseEnter={() => soundManager.playHover()}
      >
        {/* Cuisine gradient top bar */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${theme.bar}`} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{recipe.name}</p>
              {recipe.description && (
                <p className="text-zinc-400 text-[11px] leading-snug mt-1 line-clamp-2">{recipe.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-[10px] font-semibold border rounded-full px-2.5 py-0.5 whitespace-nowrap ${theme.badgeClass}`}>
                {theme.flag} {theme.label}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 transition-colors ${recipe.isFavorite ? 'fill-red-400 text-red-400' : 'text-zinc-500 hover:text-red-400'}`} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 rounded-full hover:bg-red-500/15 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Macro tiles — 4 col */}
          <div className="grid grid-cols-4 gap-1.5 my-3">
            {([
              { Icon: Flame,    val: recipe.calories, unit: 'kcal', cls: 'text-orange-300 bg-orange-500/10 border-orange-500/15' },
              { Icon: Beef,     val: recipe.protein,  unit: 'g P',  cls: 'text-blue-300   bg-blue-500/10   border-blue-500/15'   },
              { Icon: Wheat,    val: recipe.carbs,    unit: 'g C',  cls: 'text-amber-300  bg-amber-500/10  border-amber-500/15'  },
              { Icon: Droplets, val: recipe.fat,      unit: 'g F',  cls: 'text-rose-300   bg-rose-500/10   border-rose-500/15'   },
            ] as { Icon: React.ElementType; val: number; unit: string; cls: string }[]).map(({ Icon, val, unit, cls }) =>
              val > 0 ? (
                <div key={unit} className={`flex flex-col items-center justify-center rounded-xl border py-1.5 px-1 ${cls}`}>
                  <Icon className="w-2.5 h-2.5 mb-0.5 opacity-75" />
                  <span className="text-[11px] font-bold leading-none tabular-nums">{val}</span>
                  <span className="text-[9px] opacity-55 mt-0.5">{unit}</span>
                </div>
              ) : null
            )}
          </div>

          {/* Footer: timing + ingredient chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {totalTime > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Clock size={10} /> {totalTime}m
              </span>
            )}
            {recipe.servings > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <ChefHat size={10} /> {recipe.servings} serv
              </span>
            )}
            {recipe.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-auto">
                {recipe.ingredients.slice(0, 3).map((ing) => (
                  <span key={ing.id} className="text-[10px] bg-white/5 border border-white/8 text-zinc-400 rounded-md px-1.5 py-0.5">
                    {ing.name}
                  </span>
                ))}
                {recipe.ingredients.length > 3 && (
                  <span className="text-[10px] text-zinc-500 py-0.5">+{recipe.ingredients.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded: ingredients + instructions */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/8 mx-4 pt-3 pb-4 space-y-3">
                {recipe.ingredients.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Ingredients</p>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ing) => (
                        <li key={ing.id} className="flex items-center gap-2 text-xs text-zinc-300">
                          <span className="w-1 h-1 rounded-full bg-brand/60 shrink-0" />
                          {ing.quantity} {ing.unit} — {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Instructions</p>
                    <ol className="space-y-1.5">
                      {recipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-2 text-xs text-zinc-300 leading-snug">
                          <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-brand/15 border border-brand/25 text-brand text-[9px] font-bold mt-0.5">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================================
// PANTRY TAB
// ============================================================================

const PANTRY_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Low Stock', label: 'Low Stock' },
  { id: 'Expiring', label: 'Expiring Soon' },
];

function PantryTab() {
  const items = usePantryStore((s) => s.items);
  const addItem = usePantryStore((s) => s.addItem);
  const deleteItem = usePantryStore((s) => s.deleteItem);
  const consumeItem = usePantryStore((s) => s.consumeItem);
  const restockItem = usePantryStore((s) => s.restockItem);
  const getLowStockItems = usePantryStore((s) => s.getLowStockItems);
  const getExpiringSoon = usePantryStore((s) => s.getExpiringSoon);

  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    unit: 'piece' as UnitType,
    category: '',
    expiryDate: '',
    lowStockThreshold: 2,
    shelfLifeDays: 0,
  });

  const lowStock = useMemo(() => getLowStockItems(), [items, getLowStockItems]);
  const expiring = useMemo(() => getExpiringSoon(7), [items, getExpiringSoon]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab === 'Low Stock') list = lowStock;
    if (tab === 'Expiring') list = expiring;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.category ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, tab, search, lowStock, expiring]);

  const resetForm = () => setForm({ name: '', quantity: 1, unit: 'piece', category: '', expiryDate: '', lowStockThreshold: 2, shelfLifeDays: 0 });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addItem({
      name: form.name,
      quantity: form.quantity,
      unit: form.unit,
      category: form.category || undefined,
      expiryDate: form.expiryDate || undefined,
      lowStockThreshold: form.lowStockThreshold,
      shelfLifeDays: form.shelfLifeDays > 0 ? form.shelfLifeDays : undefined,
    });
    soundManager.playLogged();
    resetForm();
    setShowAddModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Search & Add */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search pantry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 text-white text-sm placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-brand/50 transition-all"
          />
        </div>
        <motion.button
          className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-black text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand/20 transition-colors whitespace-nowrap"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { soundManager.playClick(); setShowAddModal(true); }}
        >
          <Plus size={15} />
          Add Item
        </motion.button>
      </div>

      {/* Alert indicators */}
      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-yellow-400 bg-yellow-500/8 border border-yellow-500/20 rounded-full px-3 py-1">
              <AlertTriangle size={11} />
              {lowStock.length} low stock
            </div>
          )}
          {expiring.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 bg-red-500/8 border border-red-500/20 rounded-full px-3 py-1">
              <Clock size={11} />
              {expiring.length} expiring soon
            </div>
          )}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {PANTRY_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-brand text-black shadow-lg shadow-brand/30'
                : 'bg-zinc-800/70 text-zinc-400 border border-zinc-700/40 hover:text-white hover:border-brand/25'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-semibold mb-1">Pantry empty</p>
          <p className="text-zinc-600 text-sm">Add items to track your stock</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <motion.div key={item.id} variants={staggerChild}>
              <div className="rounded-2xl border border-zinc-700/40 bg-zinc-800/40 overflow-hidden hover:border-brand/25 transition-colors"
                onMouseEnter={() => soundManager.playHover()}>
                <div className={cn(
                  'h-[3px] w-full bg-gradient-to-r',
                  item.quantity <= (item.lowStockThreshold ?? 2)
                    ? 'from-yellow-500 via-orange-400 to-red-400'
                    : 'from-brand/50 via-amber-400/30 to-transparent'
                )} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      {item.category && (
                        <span className="text-[10px] font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-600/30 rounded-full px-2 py-0.5 mt-1 inline-block">{item.category}</span>
                      )}
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="p-1 rounded-full hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <button onClick={() => consumeItem(item.id, 1)} className="flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-700/50 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-brand/40 transition-colors">
                      <MinusIcon size={12} />
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-white">
                      {item.quantity} <span className="text-zinc-500 font-normal text-xs">{item.unit}</span>
                    </span>
                    <button onClick={() => restockItem(item.id, 1)} className="flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-700/50 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-brand/40 transition-colors">
                      <PlusIcon size={12} />
                    </button>
                  </div>
                  {item.quantity <= (item.lowStockThreshold ?? 2) && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-yellow-400 bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-2.5 py-1">
                      <AlertTriangle size={10} /> Low stock — reorder soon
                    </div>
                  )}
                  {item.expiryDate && (
                    <p className="mt-1.5 text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock size={9} /> Expires {item.expiryDate}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { resetForm(); setShowAddModal(false); }} title="Add Pantry Item">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Breast" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={String(form.quantity)} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as UnitType })} className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-brand/50 focus:outline-none">
                {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Protein" />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <Input label="Low Stock Threshold" type="number" value={String(form.lowStockThreshold)} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} />
          <Input label="Shelf Life (days)" type="number" value={String(form.shelfLifeDays)} onChange={(e) => setForm({ ...form, shelfLifeDays: Number(e.target.value) })} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { resetForm(); setShowAddModal(false); }}>Cancel</Button>
            <Button onClick={handleAdd}>Add Item</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// ============================================================================
// GROCERY TAB
// ============================================================================

function GroceryTab() {
  const { items, addItem, deleteItem, togglePurchased, clearPurchased, getTotalCost, getPurchasedCount, schedule } =
    useGroceryStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState<UnitType>('piece');
  const [formStore, setFormStore] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState(schedule.nextDate);
  const [formAddToPantryOnPurchase, setFormAddToPantryOnPurchase] = useState(true);

  const handleAdd = () => {
    addItem({
      name: formName || 'Item',
      quantity: parseFloat(formQuantity) || 1,
      unit: formUnit,
      store: formStore || undefined,
      price: parseFloat(formPrice) || undefined,
      category: formCategory || undefined,
      scheduledDate: formScheduledDate || schedule.nextDate,
      addToPantryOnPurchase: formAddToPantryOnPurchase,
    });
    soundManager.playLogged();
    setFormName('');
    setFormQuantity('1');
    setFormStore('');
    setFormPrice('');
    setFormCategory('');
    setFormScheduledDate(schedule.nextDate);
    setFormAddToPantryOnPurchase(true);
    setShowAddModal(false);
  };

  const unpurchased = items.filter((i) => !i.isPurchased);
  const purchased = items.filter((i) => i.isPurchased);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-brand/20 bg-brand/8 p-4 text-center shadow-[0_0_20px_rgba(230,183,95,0.06)]">
          <p className="text-xl font-black text-brand">{items.length}</p>
          <p className="text-[11px] text-amber-200/45 mt-0.5">Total</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-center">
          <p className="text-xl font-black text-emerald-300">{getPurchasedCount()}</p>
          <p className="text-[11px] text-amber-200/45 mt-0.5">Done</p>
        </div>
        <div className="rounded-2xl border border-zinc-600/30 bg-zinc-800/40 p-4 text-center">
          <p className="text-xl font-black text-white/85">{formatCurrency(getTotalCost())}</p>
          <p className="text-[11px] text-amber-200/45 mt-0.5">Est. Cost</p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <motion.button
          className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-black text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand/20 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { soundManager.playClick(); setShowAddModal(true); }}
        >
          <Plus size={15} />
          Add Item
        </motion.button>
        {purchased.length > 0 && (
          <button
            onClick={clearPurchased}
            className="px-4 py-2.5 rounded-xl border border-zinc-700/50 text-zinc-400 text-sm font-medium hover:text-white hover:border-zinc-600 transition-colors"
          >
            Clear Purchased
          </button>
        )}
      </div>

      {/* Unpurchased */}
      {unpurchased.length === 0 && purchased.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
            <ShoppingCart className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-semibold mb-1">List empty</p>
          <p className="text-zinc-600 text-sm">Add items to your grocery list</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unpurchased.length > 0 && (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
              {unpurchased.map((item) => (
                <motion.div key={item.id} variants={staggerChild}>
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-700/40 bg-zinc-800/40 px-4 py-3 hover:border-brand/25 transition-colors"
                    onMouseEnter={() => soundManager.playHover()}>
                    <button
                      onClick={() => togglePurchased(item.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-600 text-transparent hover:border-brand/60 hover:bg-brand/10 hover:text-brand transition-all"
                    >
                      <Check size={11} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {item.quantity} {item.unit}
                        {item.store && <span className="text-zinc-600"> · {item.store}</span>}
                        {item.price && <span className="text-brand/60"> · {formatCurrency(item.price)}</span>}
                      </p>
                    </div>
                    {item.category && (
                      <span className="text-[10px] bg-zinc-700/50 text-zinc-400 border border-zinc-600/30 rounded-full px-2 py-0.5 shrink-0 hidden sm:inline">{item.category}</span>
                    )}
                    <button onClick={() => deleteItem(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"><Trash2 size={13} /></button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {purchased.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                <span className="flex-1 h-px bg-zinc-800" />
                Purchased ({purchased.length})
                <span className="flex-1 h-px bg-zinc-800" />
              </p>
              {purchased.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-2.5 opacity-50">
                  <button
                    onClick={() => togglePurchased(item.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  >
                    <Check size={11} />
                  </button>
                  <p className="flex-1 text-sm text-zinc-500 line-through truncate">{item.name}</p>
                  <span className="text-[10px] text-zinc-700">{item.quantity} {item.unit}</span>
                  <button onClick={() => deleteItem(item.id)} className="text-zinc-700 hover:text-red-400 transition-colors shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Grocery Item">
        <div className="space-y-3">
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Avocados" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400">Unit</label>
              <select value={formUnit} onChange={(e) => setFormUnit(e.target.value as UnitType)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white focus:border-brand/50 focus:outline-none">
                {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Input label="Store" value={formStore} onChange={(e) => setFormStore(e.target.value)} placeholder="Optional" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" />
            <Input label="Category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Optional" />
          </div>
          <Input label="Trip Date" type="date" value={formScheduledDate} onChange={(e) => setFormScheduledDate(e.target.value)} />
          <label className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm text-green-300">
            <input type="checkbox" checked={formAddToPantryOnPurchase} onChange={(e) => setFormAddToPantryOnPurchase(e.target.checked)} />
            Auto-add to pantry when purchased
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
