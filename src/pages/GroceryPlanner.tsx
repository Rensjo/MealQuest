// ============================================================================
// MealQuest — Grocery Planner Page
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../services/soundManager';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  DollarSign,
  Store,
  Package,
  CreditCard,
} from 'lucide-react';
import { SectionCard, Card, Button, Input, EmptyState, Badge, Modal } from '@/components/ui';
import { useGroceryStore } from '@/stores/groceryStore';
import { useQuestStore } from '@/stores/questStore';
import { MissionCard } from '@/components/gaming/GamingComponents';
import { formatCurrency } from '@/utils';
import { pageVariants, staggerContainer, staggerChild } from '@/utils/animations';
import type { UnitType } from '@/types';

export default function GroceryPlanner() {
  const { items, addItem, deleteItem, togglePurchased, clearPurchased, getTotalCost, getPurchasedCount } =
    useGroceryStore();
  const groceryQuests = useQuestStore((s) => s.groceryQuests);
  const completeGroceryQuest = useQuestStore((s) => s.completeGroceryQuest);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState<UnitType>('piece');
  const [formStore, setFormStore] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');

  const handleAdd = () => {
    addItem({
      name: formName || 'Item',
      quantity: parseFloat(formQuantity) || 1,
      unit: formUnit,
      store: formStore || undefined,
      price: parseFloat(formPrice) || undefined,
      category: formCategory || undefined,
    });
    setFormName('');
    setFormQuantity('1');
    setFormStore('');
    setFormPrice('');
    setFormCategory('');
    setShowAddModal(false);
  };

  const unpurchased = items.filter((i) => !i.isPurchased);
  const purchased = items.filter((i) => i.isPurchased);

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
          <h1 className="text-2xl font-bold text-white">Grocery Planner</h1>
          <p className="text-sm text-neutral-400">Plan your grocery shopping</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { soundManager.playClick(); setShowAddModal(true); }}>
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Total Items</p>
          <p className="text-xl font-bold text-white">{items.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Purchased</p>
          <p className="text-xl font-bold text-green-400">{getPurchasedCount()}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Remaining</p>
          <p className="text-xl font-bold text-yellow-400">{unpurchased.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-neutral-500">Estimated Cost</p>
          <p className="text-xl font-bold text-brand">{formatCurrency(getTotalCost())}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grocery List */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Shopping List" subtitle={`${unpurchased.length} items remaining`}>
            {unpurchased.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart size={48} />}
                title="Shopping list is empty"
                description="Add items to your grocery list"
                action={
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => { soundManager.playClick(); setShowAddModal(true); }}>
                    Add Item
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {unpurchased.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-neutral-800/50 bg-neutral-800/20 p-3"
                  >
                    <button
                      onClick={() => { soundManager.playClick(); togglePurchased(item.id); }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-600 hover:border-brand transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        {item.quantity} {item.unit}
                        {item.store && ` · ${item.store}`}
                      </p>
                    </div>
                    {item.price && (
                      <span className="text-sm text-brand">{formatCurrency(item.price * item.quantity)}</span>
                    )}
                    <button
                      onClick={() => { soundManager.playClick(); deleteItem(item.id); }}
                      className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Purchased */}
          {purchased.length > 0 && (
            <SectionCard
              title="Purchased"
              subtitle={`${purchased.length} items`}
              action={
                <Button size="sm" variant="ghost" onClick={() => { soundManager.playClick(); clearPurchased(); }}>
                  Clear
                </Button>
              }
            >
              <div className="space-y-2">
                {purchased.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-green-500/10 bg-green-500/5 p-3"
                  >
                    <button
                      onClick={() => { soundManager.playClick(); togglePurchased(item.id); }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-green-500 bg-green-500/10 text-green-400"
                    >
                      <Check size={14} />
                    </button>
                    <p className="text-sm text-neutral-500 line-through">{item.name}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Grocery Quests */}
        <div>
          <SectionCard title="Grocery Quests" subtitle="Weekly shopping missions">
            <div className="space-y-2">
              {groceryQuests.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-600">No quests this week</p>
              ) : (
                groceryQuests.map((quest) => (
                  <MissionCard
                    key={quest.id}
                    mission={{
                      id: quest.id,
                      title: quest.title,
                      description: quest.description,
                      xpReward: quest.xpReward,
                      completed: quest.completed,
                      category: quest.category,
                      date: quest.weekStart,
                    }}
                    onComplete={(id) => completeGroceryQuest(id)}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Add Grocery Item Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Grocery Item">
        <div className="space-y-4">
          <Input
            label="Item Name"
            placeholder="e.g. Chicken Breast"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={formQuantity}
              onChange={(e) => setFormQuantity(e.target.value)}
            />
            <Input
              label="Unit"
              placeholder="piece, kg, lb..."
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value as UnitType)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Store (optional)"
              placeholder="e.g. Walmart"
              value={formStore}
              onChange={(e) => setFormStore(e.target.value)}
              icon={<Store size={16} />}
            />
            <Input
              label="Price per unit"
              type="number"
              placeholder="0.00"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              icon={<DollarSign size={16} />}
            />
          </div>
          <Input
            label="Category (optional)"
            placeholder="e.g. Produce, Dairy"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Item</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
