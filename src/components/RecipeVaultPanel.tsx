import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Heart, ChefHat, Clock, Plus, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { useRecipeStore } from '../stores/recipeStore';
import { soundManager } from '../services/soundManager';
import type { Recipe } from '@/types';

interface RecipeVaultPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecipeTheme = {
  bar: string;
  cardBg: string;
  border: string;
  badgeClass: string;
  flag: string;
  label: string;
};

function getRecipeTheme(tags: string[]): RecipeTheme {
  const t = tags.map(s => s.toLowerCase());
  if (t.some(s => ['filipino', 'sinigang', 'shanghai', 'lumpia', 'adobo', 'pork'].includes(s)))
    return {
      bar: 'from-orange-400 via-amber-300 to-yellow-300',
      cardBg: 'from-orange-950/55 via-amber-950/30 to-zinc-900/80',
      border: 'border-orange-500/20 hover:border-orange-400/45',
      badgeClass: 'bg-orange-500/12 text-orange-300 border-orange-500/25',
      flag: '\ud83c\uddf5\ud83c\udded', label: 'Filipino',
    };
  if (t.some(s => ['korean', 'bibimbap', 'kimchi'].includes(s)))
    return {
      bar: 'from-red-400 via-rose-400 to-pink-300',
      cardBg: 'from-red-950/55 via-rose-950/30 to-zinc-900/80',
      border: 'border-red-500/20 hover:border-red-400/45',
      badgeClass: 'bg-red-500/12 text-red-300 border-red-500/25',
      flag: '\ud83c\uddf0\ud83c\uddf7', label: 'Korean',
    };
  if (t.some(s => ['beef', 'steak', 'keto', 'grilled'].includes(s)))
    return {
      bar: 'from-red-600 via-red-500 to-orange-400',
      cardBg: 'from-red-950/60 via-zinc-950/40 to-zinc-900/80',
      border: 'border-red-700/25 hover:border-red-500/50',
      badgeClass: 'bg-red-700/15 text-red-300 border-red-600/30',
      flag: '\ud83e\udd69', label: 'Beef',
    };
  if (t.some(s => ['curry', 'chicken', 'spicy'].includes(s)))
    return {
      bar: 'from-yellow-500 via-amber-400 to-orange-400',
      cardBg: 'from-yellow-950/55 via-amber-950/30 to-zinc-900/80',
      border: 'border-yellow-600/20 hover:border-yellow-400/45',
      badgeClass: 'bg-yellow-500/12 text-yellow-300 border-yellow-500/25',
      flag: '\ud83c\udf5b', label: 'Curry',
    };
  if (t.some(s => ['pasta', 'seafood', 'tuna', 'cream'].includes(s)))
    return {
      bar: 'from-blue-500 via-cyan-400 to-teal-300',
      cardBg: 'from-blue-950/55 via-cyan-950/28 to-zinc-900/80',
      border: 'border-blue-500/20 hover:border-blue-400/45',
      badgeClass: 'bg-blue-500/12 text-blue-300 border-blue-500/25',
      flag: '\ud83c\udf5d', label: 'Pasta',
    };
  return {
    bar: 'from-brand via-amber-400 to-yellow-300',
    cardBg: 'from-zinc-900/80 to-zinc-800/50',
    border: 'border-zinc-700/40 hover:border-brand/40',
    badgeClass: 'bg-brand/12 text-brand border-brand/25',
    flag: '\ud83c\udf7d\ufe0f', label: 'Recipe',
  };
}

function RecipeCard({ recipe, onToggleFavorite }: { recipe: Recipe; onToggleFavorite: (id: string) => void }) {
  const theme = getRecipeTheme(recipe.tags);
  const totalTime = recipe.prepTime + recipe.cookTime;
  return (
    <motion.div
      className={`relative group bg-gradient-to-br ${theme.cardBg} border ${theme.border} rounded-2xl overflow-hidden cursor-default transition-colors`}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      layout
    >
      {/* Cuisine gradient top bar */}
      <div className={`h-[3px] w-full bg-gradient-to-r ${theme.bar}`} />

      {/* Inner glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: 'inset 0 0 28px rgba(255,255,255,0.03)' }}
      />

      <div className="p-4">
        {/* Header: name + cuisine badge + favorite */}
        <div className="flex items-start gap-2 mb-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{recipe.name}</p>
            {recipe.description && (
              <p className="text-zinc-400 text-[11px] leading-snug mt-1 line-clamp-2">{recipe.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[10px] font-semibold border rounded-full px-2.5 py-0.5 whitespace-nowrap ${theme.badgeClass}`}>
              {theme.flag} {theme.label}
            </span>
            <button
              onClick={() => { soundManager.playClick(); onToggleFavorite(recipe.id); }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${recipe.isFavorite ? 'fill-red-400 text-red-400' : 'text-zinc-500 hover:text-red-400'}`} />
            </button>
          </div>
        </div>

        {/* Macro tiles — 4-column grid */}
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
        <div className="flex items-center gap-2">
          {totalTime > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Clock className="w-2.5 h-2.5" />
              {totalTime}m
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <ChefHat className="w-2.5 h-2.5" />
              {recipe.servings} serv
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
    </motion.div>
  );
}

export default function RecipeVaultPanel({ isOpen, onClose }: RecipeVaultPanelProps) {
  const { recipes, toggleFavorite, searchRecipes } = useRecipeStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'favorites'>('all');

  const filtered = useMemo(() => {
    let list = tab === 'favorites' ? recipes.filter(r => r.isFavorite) : recipes;
    if (query.trim()) list = searchRecipes(query);
    return list;
  }, [recipes, query, tab, searchRecipes]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Positioning shell — pure CSS centering, separated from Framer Motion transforms
               (Framer Motion's y/scale overwrite the full CSS transform, so mixing them
               with Tailwind -translate-* breaks centering. Keep them on separate elements.) */}
          <div className="fixed top-[calc(50%+40px)] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(680px,95vw)]">
          <motion.div
            className="max-h-[82vh] rounded-2xl border border-brand/30 bg-[#0c0c18]/97 backdrop-blur-xl shadow-2xl shadow-brand/15 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {/* Gold glow bar */}
            <div className="h-[3px] bg-gradient-to-r from-transparent via-brand to-transparent shrink-0" />

            {/* Header */}
            <div className="flex items-center gap-3 p-5 pb-0 shrink-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-brand/30 shadow-lg shadow-brand/20 shrink-0">
                <img src="./icons/recipe-vault-icon.png" alt="Recipe Vault" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight">Recipe Vault</h2>
                <p className="text-zinc-500 text-xs">{recipes.length} recipes saved</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search + tabs */}
            <div className="px-5 pt-4 pb-3 shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 text-white text-sm placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-brand/50 focus:bg-zinc-800/80 transition-all"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {(['all', 'favorites'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { soundManager.playClick(); setTab(t); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                      tab === t
                        ? 'bg-brand text-black shadow-lg shadow-brand/30'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-zinc-700/40'
                    }`}
                  >
                    {t === 'all' ? `All (${recipes.length})` : `❤ Favorites (${recipes.filter(r => r.isFavorite).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipes grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
              {filtered.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} onToggleFavorite={toggleFavorite} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
                    <ChefHat className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 font-medium mb-1">
                    {query ? 'No recipes found' : tab === 'favorites' ? 'No favorites yet' : 'Your vault is empty'}
                  </p>
                  <p className="text-zinc-600 text-sm">
                    {query ? `No results for "${query}"` : 'Add your first recipe below!'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-zinc-800/60 bg-zinc-900/30 shrink-0 flex items-center justify-between">
              <p className="text-zinc-500 text-xs">
                {filtered.length > 0 ? `Showing ${filtered.length} recipe${filtered.length !== 1 ? 's' : ''}` : ''}
              </p>
              <motion.button
                className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-black text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-brand/30 transition-colors"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {/* TODO open add-recipe form */}}
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
