import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, BookOpen, MapPin } from 'lucide-react';
import { STORY_STEPS } from '../constants/chokepoints';
import type { StoryStep } from '../types';

interface StoryModeOverlayProps {
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSelectStepIndex: (index: number) => void;
  onExitStoryMode: () => void;
}

export const StoryModeOverlay: React.FC<StoryModeOverlayProps> = ({
  currentStepIndex,
  onNextStep,
  onPrevStep,
  onSelectStepIndex,
  onExitStoryMode,
}) => {
  const step: StoryStep = STORY_STEPS[currentStepIndex];

  return (
    <AnimatePresence>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-xl">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="glass-panel p-6 rounded-2xl shadow-2xl border border-subsea-cyan/30 overflow-hidden relative"
        >
          {/* Top Progress & Close Button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-subsea-purple-dim text-subsea-purple border border-subsea-purple/30 uppercase tracking-wider">
                <BookOpen className="w-3 h-3" /> Chapter {step.chapter} of {STORY_STEPS.length}
              </span>
              <span className="text-xs font-medium text-subsea-muted">
                Guided Investigation
              </span>
            </div>

            <button
              onClick={onExitStoryMode}
              className="p-1 rounded-md text-subsea-muted hover:text-subsea-text hover:bg-white/5 transition-colors"
              title="Exit Story Mode (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Titles & Narrative */}
          <div className="space-y-2 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-subsea-text tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-subsea-cyan flex-shrink-0" />
              {step.title}
            </h2>
            <div className="text-xs font-mono text-subsea-cyan">
              {step.subtitle}
            </div>
            <p className="text-sm text-subsea-muted leading-relaxed pt-1">
              {step.narrative}
            </p>
          </div>

          {/* Navigation Controls & Progress Dots */}
          <div className="flex items-center justify-between pt-4 border-t border-subsea-border">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {STORY_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => onSelectStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-6 bg-subsea-cyan'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Chapter ${s.chapter}: ${s.title}`}
                />
              ))}
            </div>

            {/* Next / Prev Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevStep}
                disabled={currentStepIndex === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-subsea-muted hover:text-subsea-text disabled:opacity-30 disabled:hover:text-subsea-muted transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <button
                onClick={onNextStep}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-subsea-cyan text-black hover:bg-subsea-cyan/90 transition-colors flex items-center gap-1 shadow-glow-cyan"
              >
                {currentStepIndex === STORY_STEPS.length - 1 ? 'Finish Tour' : 'Next Chapter'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
