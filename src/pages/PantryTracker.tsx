// ============================================================================
// MealQuest â€” Pantry Tracker Page
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../services/soundManager';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Trash2,
  Minus as MinusIcon,
  Plus as PlusIcon,
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
import { usePantryStore } from '@/stores/pantryStore';
import { pageVariants, staggerContainer, staggerChild, cardPop } from '@/utils/animations';
import type { UnitType } from '@/types';
import { UNIT_TYPES } from '@/types';

const PANTRY_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Low Stock', label: 'Low Stock' },
  { id: 'Expiring Soon', label: 'Expiring Soon' },
];

export default function PantryTracker() {
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
  });

  const lowStock = useMemo(() => getLowStockItems(), [items, getLowStockItems]);
  const expiring = useMemo(() => getExpiringSoon(7), [items, getExpiringSoon]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab === 'Low Stock') list = lowStock;
    if (tab === 'Expiring Soon') list = expiring;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.category ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, tab, search, lowStock, expiring]);

  const resetForm = () =>
    setForm({ name: '', quantity: 1, unit: 'piece', category: '', expiryDate: '', lowStockThreshold: 2 });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addItem({
      name: form.name.trim(),
      quantity: form.quantity,
      unit: form.unit,
      category: form.category.trim() || undefined,
      expiryDate: form.expiryDate || undefined,
      lowStockThreshold: form.lowStockThreshold,
    });
    resetForm();
    setShowAddModal(false);
  };

  const daysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pantry Tracker</h1>
          <p className="text-sm text-neutral-400">{items.length} items in your pantry</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { soundManager.playClick(); setShowAddModal(true); }}>
          Add Item
        </Button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <Package size={20} className="mx-auto mb-1 text-brand" />
          <p className="text-xs text-neutral-500">Total Items</p>
          <p className="text-xl font-bold text-white">{items.length}</p>
        </Card>
        <Card className={`text-center ${lowStock.length > 0 ? 'border-orange-500/30' : ''}`}>
          <AlertTriangle size={20} className="mx-auto mb-1 text-orange-400" />
          <p className="text-xs text-neutral-500">Low Stock</p>
          <p className="text-xl font-bold text-orange-400">{lowStock.length}</p>
        </Card>
        <Card className={`text-center ${expiring.length > 0 ? 'border-red-500/30' : ''}`}>
          <Clock size={20} className="mx-auto mb-1 text-red-400" />
          <p className="text-xs text-neutral-500">Expiring (7d)</p>
          <p className="text-xl font-bold text-red-400">{expiring.length}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input icon={<Search size={16} />} placeholder="Search pantryâ€¦" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Tabs tabs={PANTRY_TABS} activeTab={tab} onTabChange={setTab} />
      </div>

      {/* Items Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="Pantry is empty"
          description={tab === 'All' ? 'Add items to start tracking' : `No ${tab.toLowerCase()} items`}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((item) => {
            const days = daysUntilExpiry(item.expiryDate);
            const isLow = item.quantity <= (item.lowStockThreshold ?? 2);
            const isExpiring = days !== null && days <= 7;

            return (
              <motion.div key={item.id} variants={staggerChild}>
                <motion.div
                  variants={cardPop}
                  whileHover="hover"
                  className={`rounded-xl border p-4 ${
                    isExpiring
                      ? 'border-red-500/30 bg-red-500/5'
                      : isLow
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-neutral-800 bg-neutral-900/90'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                      {item.category && (
                        <p className="mt-0.5 text-xs text-neutral-500">{item.category}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { soundManager.playClick(); deleteItem(item.id); }}
                      className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Quantity */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => { soundManager.playClick(); consumeItem(item.id, 1); }}
                      className="rounded-md bg-neutral-800 p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                      disabled={item.quantity <= 0}
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span className={`min-w-[80px] text-center text-sm font-bold ${isLow ? 'text-orange-400' : 'text-white'}`}>
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => { soundManager.playClick(); restockItem(item.id, 1); }}
                      className="rounded-md bg-neutral-800 p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {isLow && <Badge variant="warning">Low Stock</Badge>}
                    {days !== null && (
                      <Badge variant={isExpiring ? 'danger' : 'default'}>
                        {days <= 0 ? 'Expired' : `${days}d left`}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Item Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Pantry Item">
        <div className="space-y-4">
          <Input label="Item Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
            />
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Unit</label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value as UnitType })}
              >
                {UNIT_TYPES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Dairy, Produce, Grains" />
          <Input
            label="Expiry Date"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            value={form.lowStockThreshold}
            onChange={(e) => setForm({ ...form, lowStockThreshold: +e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim()}>Add Item</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

