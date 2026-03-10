import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Flame, Target, CheckCircle2, Circle, TrendingUp, Pencil, Camera, Check } from 'lucide-react';
import { useXPStore } from '../../stores/xpStore';
import { useStreakStore } from '../../stores/streakStore';
import { useQuestStore } from '../../stores/questStore';
import { useMealLogStore } from '../../stores/mealLogStore';
import { soundManager } from '../../services/soundManager';

interface UserStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserStatusPanel({ isOpen, onClose }: UserStatusPanelProps) {
  const { level, totalXP, getXPToNextLevel } = useXPStore();
  const getAllStreaks = useStreakStore((s) => s.getAllStreaks);
  const { getActiveMissions, dailyMissions } = useQuestStore();
  const getDailyTotals = useMealLogStore((s) => s.getDailyTotals);

  // Username editing
  const [username, setUsername] = useState('MealQuester');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('MealQuester');

  // Profile picture
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    const trimmed = draftName.trim();
    if (trimmed) setUsername(trimmed);
    else setDraftName(username);
    setEditingName(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setProfilePic(result);
    };
    reader.readAsDataURL(file);
  };

  const xpInfo = getXPToNextLevel();
  const allStreaks = getAllStreaks();
  const topStreak = Math.max(...allStreaks.map((s) => s.current), 0);

  const today = new Date().toISOString().split('T')[0];
  const totals = getDailyTotals(today);
  const activeMissions = getActiveMissions();
  const completedToday = dailyMissions.filter(m => m.completed && m.date === today).length;
  const totalToday = dailyMissions.filter(m => m.date === today).length;

  const xpPercent = xpInfo.required > 0 ? Math.round((xpInfo.current / xpInfo.required) * 100) : 100;
  const dailyCalGoal = 2000;
  const caloriePercent = Math.min(100, Math.round((totals.calories / dailyCalGoal) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-[84px] right-[172px] z-50 w-80 rounded-2xl border border-brand/28 bg-[#1a0c02]/97 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            {/* Top accent bar */}
            <div className="h-[3px] bg-gradient-to-r from-transparent via-brand to-transparent" />

            <div className="p-5">
              {/* Avatar row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with upload overlay */}
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand/40 shadow-lg shadow-brand/15">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src="./icons/mealquest-icon2.png"
                          alt="MealQuest"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                    {/* Level badge */}
                    <div className="absolute -bottom-1.5 -right-1.5 bg-brand text-black text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-[#0b0f1a]">
                      {level}
                    </div>
                    {/* Upload overlay */}
                    <motion.button
                      className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      onClick={() => { soundManager.playClick(); fileInputRef.current?.click(); }}
                      title="Upload photo"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </motion.button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Name + edit */}
                  <div className="flex-1 min-w-0">
                    {editingName ? (
                      <div className="flex items-center gap-1 mb-0.5">
                        <input
                          autoFocus
                          value={draftName}
                          onChange={e => setDraftName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setDraftName(username); setEditingName(false); } }}
                          className="bg-[#2a1400] border border-brand/45 text-white text-sm font-bold rounded-lg px-2 py-0.5 w-full focus:outline-none focus:border-brand"
                          maxLength={20}
                        />
                        <button onClick={() => { soundManager.playClick(); handleSaveName(); }} className="p-1 text-brand hover:text-brand/80 shrink-0">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-white font-bold text-sm leading-tight truncate">{username}</p>
                        <button
                          onClick={() => { soundManager.playClick(); setDraftName(username); setEditingName(true); }}
                          className="p-0.5 text-zinc-600 hover:text-brand transition-colors shrink-0"
                          title="Edit username"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-brand/70 text-xs">Level {level} Chef</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-semibold">{totalXP.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-brand/12 text-amber-200/40 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* XP Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-amber-200/50 font-medium">XP Progress</span>
                  <span className="text-xs text-brand font-bold">{xpInfo.current} / {xpInfo.required}</span>
                </div>
                <div className="h-2 rounded-full bg-[#2a1200] overflow-hidden border border-brand/14">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ boxShadow: '0 0 8px rgba(230,183,95,0.55)' }}
                  />
                </div>
                <p className="text-[10px] text-amber-200/35 mt-1">{xpPercent}% to Level {level + 1}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: <Flame className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />, value: topStreak, label: 'Streak' },
                  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />, value: `${completedToday}/${totalToday}`, label: 'Quests' },
                  { icon: <Target className="w-3.5 h-3.5 text-brand mx-auto mb-1" />, value: totals.calories, label: 'kcal' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#2a1400]/70 rounded-xl p-2.5 text-center border border-brand/12">
                    {stat.icon}
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-amber-200/45 text-[10px]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Calorie bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-brand" />
                    <span className="text-xs text-amber-200/60 font-medium">Daily Calories</span>
                  </div>
                  <span className="text-xs text-brand font-semibold">{caloriePercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#2a1200] overflow-hidden border border-brand/14">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${caloriePercent}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    style={{ boxShadow: '0 0 6px rgba(230,183,95,0.45)' }}
                  />
                </div>
              </div>

              {/* Macro pills */}
              <div className="flex gap-2 mb-4">
                {[
                  { label: `P: ${totals.protein}g`, cls: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
                  { label: `C: ${totals.carbs}g`,   cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
                  { label: `F: ${totals.fat}g`,     cls: 'bg-red-500/15 text-red-300 border-red-500/25' },
                ].map(m => (
                  <span key={m.label} className={`flex-1 text-center text-[10px] font-semibold py-1 rounded-lg border ${m.cls}`}>
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Active missions */}
              {activeMissions.length > 0 && (
                <div>
                  <p className="text-[10px] text-amber-200/40 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Circle className="w-3 h-3" />
                    Active Missions ({activeMissions.length})
                  </p>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {activeMissions.slice(0, 3).map(mission => (
                      <div key={mission.id} className="flex items-center justify-between bg-[#2a1400]/60 rounded-lg px-3 py-1.5 border border-brand/10">
                        <span className="text-amber-100/80 text-xs truncate flex-1">{mission.title}</span>
                        <span className="text-brand text-[10px] font-bold ml-2 shrink-0">+{mission.xpReward}xp</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
