import React from 'react';
import { Radio, Search, Info, Cloud, Globe, Map as MapIcon } from 'lucide-react';
import type { ProjectionMode } from '../types';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onOpenInfo: () => void;
  isLoadingData: boolean;
  activeFeed: string;
  amazonLocationKey?: string;
  projection?: ProjectionMode;
  onToggleProjection?: (mode: ProjectionMode) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommandPalette,
  onOpenInfo,
  isLoadingData,
  activeFeed,
  amazonLocationKey,
  projection,
  onToggleProjection,
}) => {
  return (
    <header className="fixed top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* Left: Brand Identity & Live Status Chip */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <div className="glass-panel px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10">
          <div className="relative flex items-center justify-center">
            <Radio className="w-5 h-5 text-subsea-cyan" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-subsea-cyan animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-sm text-subsea-text tracking-tight font-sans">
                TerraPulse
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-subsea-cyan text-black tracking-wider uppercase">
                SUBSEA
              </span>
            </div>
          </div>
        </div>

        {/* Live Feed Status Pill */}
        <div className="hidden md:flex items-center gap-2 glass-panel px-3 py-2 rounded-2xl border border-white/10 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-subsea-muted text-[11px] font-mono">USGS {activeFeed.toUpperCase()}</span>
          {isLoadingData ? (
            <span className="text-subsea-cyan font-mono text-[10px] animate-pulse">Syncing</span>
          ) : (
            <span className="text-emerald-400 font-mono text-[10px] font-semibold">Streaming</span>
          )}

          {amazonLocationKey && amazonLocationKey.trim() && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-subsea-cyan border-l border-white/10 pl-2">
              <Cloud className="w-3 h-3" /> Amazon Location
            </span>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger (Cmd+K) */}
      <div className="pointer-events-auto">
        <button
          onClick={onOpenCommandPalette}
          className="glass-panel hover:bg-white/[0.06] transition-all px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 text-xs text-subsea-muted group"
        >
          <Search className="w-3.5 h-3.5 text-subsea-cyan group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-medium text-subsea-text/80">Search cables, AWS regions, chokepoints...</span>
          <span className="inline md:hidden font-medium text-subsea-text/80">Search...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-black/50 px-2 py-0.5 rounded-md border border-white/10 text-subsea-cyan font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Projection Switcher (2D / 3D Globe) & Info Action */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {onToggleProjection && projection && (
          <div className="glass-panel p-1 rounded-2xl border border-white/10 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => onToggleProjection('mercator')}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                projection === 'mercator'
                  ? 'bg-subsea-cyan text-black font-semibold shadow-glow-cyan'
                  : 'text-subsea-muted hover:text-subsea-text hover:bg-white/5'
              }`}
              title="Switch to 2D Planar Map"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2D</span>
            </button>
            <button
              onClick={() => onToggleProjection('globe')}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                projection === 'globe'
                  ? 'bg-subsea-cyan text-black font-semibold shadow-glow-cyan'
                  : 'text-subsea-muted hover:text-subsea-text hover:bg-white/5'
              }`}
              title="Switch to 3D Orbital Globe"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D Globe</span>
            </button>
          </div>
        )}

        <button
          onClick={onOpenInfo}
          className="glass-panel p-2.5 rounded-2xl hover:bg-white/10 text-subsea-muted hover:text-subsea-text transition-colors border border-white/10"
          title="Methodology, Architecture & Scientific Attribution"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
