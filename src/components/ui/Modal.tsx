// ============================================================================
// MealQuest — Modal Component
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { backdropVariants, modalVariants } from '@/utils/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative w-full rounded-2xl border border-brand/24 bg-[#0c0600]/98 p-6 shadow-[0_0_70px_rgba(230,183,95,0.15)] backdrop-blur-md',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-amber-200/40 hover:bg-brand/12 hover:text-brand transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(content, document.body);
}

