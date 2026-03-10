// ============================================================================
// MealQuest — Input Component
// ============================================================================

import React from 'react';
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-amber-200/60">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-brand/18 bg-[#140900]/90 px-3 py-2 text-sm text-white',
            'placeholder:text-amber-200/22',
            'hover:border-brand/30',
            'focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30',
            'transition-colors duration-200',
            icon && 'pl-10',
            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white',
          'focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30',
          'transition-colors duration-200',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white',
          'placeholder:text-neutral-500',
          'focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30',
          'transition-colors duration-200 resize-none',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
