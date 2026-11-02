import React from 'react';

interface BottomMetaStripProps {
  onOpenInfo?: () => void;
}

export const BottomMetaStrip: React.FC<BottomMetaStripProps> = ({ onOpenInfo }) => {
  return (
    <footer className="fixed bottom-4 right-6 z-20 pointer-events-auto select-none">
      <button
        onClick={onOpenInfo}
        className="glass-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-[10px] font-mono text-subsea-muted shadow-lg hover:border-white/25 hover:text-subsea-text hover:bg-white/[0.04] transition-all cursor-pointer"
        title="View Data Sources & System Architecture"
      >
        <span className="text-white/40">Data:</span>
        <span className="text-subsea-text/80 font-medium">© TeleGeography</span>
        <span className="text-white/30">·</span>
        <span className="text-subsea-text/80 font-medium">USGS</span>
        <span className="text-white/30">·</span>
        <span className="text-subsea-text/80 font-medium">MapLibre</span>
      </button>
    </footer>
  );
};
