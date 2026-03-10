// ============================================================================
// MealQuest — Button Component
// ============================================================================

import React from 'react';
import { cn } from '@/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-neutral-900 hover:bg-brand-200 shadow-neon active:scale-[0.98]',
  secondary:
    'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98]',
  ghost:
    'text-neutral-400 hover:text-white hover:bg-neutral-800/50',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  success:
    'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-neutral-950',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
