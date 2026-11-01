import React from 'react';

interface BottomMetaStripProps {
  cablesCount?: number;
  landingCount?: number;
  awsRegionsCount?: number;
  quakesCount?: number;
  alertsCount?: number;
}

export const BottomMetaStrip: React.FC<BottomMetaStripProps> = () => {
  return (
    <footer className="fixed bottom-4 right-6 z-20 pointer-events-auto select-none">
      <div className="glass-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-[10px] font-mono text-subsea-muted shadow-lg">
        <span className="text-white/40">Data:</span>
        <a
          href="https://www.submarinecablemap.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-subsea-cyan text-subsea-text/80 transition-colors"
        >
          © TeleGeography
        </a>
        <span className="text-white/30">·</span>
        <a
          href="https://earthquake.usgs.gov"
          target="_blank"
          rel="noreferrer"
          className="hover:text-subsea-cyan text-subsea-text/80 transition-colors"
        >
          USGS
        </a>
        <span className="text-white/30">·</span>
        <span className="text-subsea-text/80">Amazon Location</span>
      </div>
    </footer>
  );
};
