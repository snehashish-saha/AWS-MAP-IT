import React from 'react';
import { motion } from 'motion/react';
import { Compass, BookOpen, Anchor } from 'lucide-react';
import { CHOKEPOINT_PRESETS } from '../constants/chokepoints';
import type { ChokepointPreset } from '../types';

interface ChokepointBarProps {
  activeChokepoint: ChokepointPreset | null;
  onSelectChokepoint: (preset: ChokepointPreset | null) => void;
  onStartStoryMode: () => void;
  isStoryModeActive: boolean;
}

export const ChokepointBar: React.FC<ChokepointBarProps> = ({
  activeChokepoint,
  onSelectChokepoint,
  onStartStoryMode,
  isStoryModeActive,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center pointer-events-auto max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="glass-panel p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 border border-white/10 shrink-0"
      >
        {/* Global Reset */}
        <button
          onClick={() => onSelectChokepoint(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            activeChokepoint === null && !isStoryModeActive
              ? 'bg-subsea-cyan text-black font-semibold shadow-glow-cyan'
              : 'text-subsea-muted hover:text-subsea-text hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Global View</span>
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Chokepoint Preset Buttons */}
        {CHOKEPOINT_PRESETS.map((preset) => {
          const isActive = activeChokepoint?.id === preset.id && !isStoryModeActive;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectChokepoint(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-subsea-amber text-black font-semibold shadow-glow-amber'
                  : 'text-subsea-muted hover:text-subsea-text hover:bg-white/5'
              }`}
            >
              <Anchor className="w-3.5 h-3.5 text-subsea-amber" />
              <span>{preset.name.split('(')[0].split('&')[0].trim()}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-black/40 text-subsea-muted">
                {preset.cableCountApprox}
              </span>
            </button>
          );
        })}

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Story Mode Trigger Button */}
        <button
          onClick={onStartStoryMode}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            isStoryModeActive
              ? 'bg-subsea-purple text-white shadow-glow-purple'
              : 'bg-white/5 text-subsea-text hover:bg-subsea-purple/20 hover:text-subsea-purple border border-white/10'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Story Mode</span>
        </button>
      </motion.div>
    </div>
  );
};
