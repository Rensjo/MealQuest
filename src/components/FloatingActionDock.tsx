import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { soundManager } from '@/services/soundManager';

interface FloatingActionDockProps {
  onDailyQuests: () => void;
  onRecipeVault: () => void;
  onWeeklyBoss: () => void;
  questsBadge?: number;
}

interface IconButtonProps {
  src: string;
  label: string;
  onClick: () => void;
  badge?: number;
  delay: number;
}

function IconButton({ src, label, onClick, badge, delay }: IconButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 22 }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[#1a0c02]/96 border border-brand/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap backdrop-blur-md z-10"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
          >
            {label}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#1a0c02]/96 border-r border-t border-brand/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pure image button — glow via whileHover on the img itself */}
      <motion.button
        className="relative focus:outline-none cursor-pointer block"
        style={{ background: 'none', border: 'none', padding: 0 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => { setHovered(true); soundManager.playHover(); }}
        onHoverEnd={() => setHovered(false)}
        onClick={() => { soundManager.playClick(); onClick(); }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      >
        <motion.img
          src={src}
          alt={label}
          className="w-[70px] h-[70px] object-contain select-none block"
          draggable={false}
          initial={{ filter: 'drop-shadow(0 0 0px rgba(230,183,95,0))' }}
          whileHover={{ filter: 'drop-shadow(0 0 14px rgba(230,183,95,0.9)) drop-shadow(0 0 6px rgba(230,183,95,0.6))' }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>

      {/* Badge counter */}
      {badge !== undefined && badge > 0 && (
        <motion.div
          className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-brand text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg z-10 border-2 border-[#0f0700]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16 }}
        >
          {badge > 9 ? '9+' : badge}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function FloatingActionDock({ onDailyQuests, onRecipeVault, onWeeklyBoss, questsBadge }: FloatingActionDockProps) {
  return (
    <div className="fixed top-[88px] right-2 z-30 flex flex-col items-center gap-1">
      <IconButton
        src="./icons/mealquest-dailyquest-icon.png"
        label="Daily Quests"
        onClick={onDailyQuests}
        badge={questsBadge}
        delay={0}
      />
      <IconButton
        src="./icons/recipe-vault-icon.png"
        label="Recipe Vault"
        onClick={onRecipeVault}
        delay={0.06}
      />
      <IconButton
        src="./icons/weekly-boss-battle-icon.png"
        label="Weekly Boss"
        onClick={onWeeklyBoss}
        delay={0.12}
      />
    </div>
  );
}

