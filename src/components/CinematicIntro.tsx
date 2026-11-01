import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  onDismiss: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onDismiss }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 text-center select-none"
      >
        <div className="max-w-xl space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <Radio className="w-16 h-16 text-subsea-cyan" />
              <span className="absolute inset-0 rounded-full bg-subsea-cyan/30 animate-ping" />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {stage === 0 && (
              <motion.div
                key="stage-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg md:text-xl font-light text-subsea-muted tracking-wide"
              >
                Connecting to the global physical substrate...
              </motion.div>
            )}

            {stage >= 1 && (
              <motion.div
                key="stage-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="text-2xl md:text-4xl font-extrabold text-subsea-text tracking-tight font-sans">
                  The Cloud is Grounded in the Ocean.
                </div>
                <p className="text-sm md:text-base text-subsea-muted max-w-md mx-auto leading-relaxed">
                  Over 95% of all global data and inter-region cloud traffic flows through 1.4 million kilometers of fiber-optic glass cables resting on the seabed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-4 flex items-center justify-center gap-3"
            >
              <button
                onClick={onDismiss}
                className="px-6 py-2.5 rounded-full bg-subsea-cyan text-black font-semibold text-sm flex items-center gap-2 hover:bg-subsea-cyan/90 transition-all shadow-glow-cyan"
              >
                <span>Enter Mission Control</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <div className="pt-8">
            <button
              onClick={onDismiss}
              className="text-xs text-subsea-muted/60 hover:text-subsea-muted transition-colors font-mono"
            >
              Skip Intro (ESC)
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
