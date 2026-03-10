// ============================================================================
// MealQuest — Tabs Component
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-neutral-800/50 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-md bg-neutral-700/80 border border-neutral-600/50"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
