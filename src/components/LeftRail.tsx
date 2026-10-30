import React from 'react';
import type { FeedType, LayerMode } from '../types';
import { USGS_FEEDS } from '../constants/feeds';
import { REGION_PRESETS } from '../constants/regions';
import { SlidersHorizontal, RotateCcw, MapPin, Activity, CloudSun, Compass, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeftRailProps {
  feed: FeedType;
  onFeedChange: (feed: FeedType) => void;
  minMagnitude: number;
  onMinMagnitudeChange: (mag: number) => void;
  selectedRegion: string;
  onRegionChange: (regionId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  layerMode: LayerMode;
  onLayerModeChange: (mode: LayerMode) => void;
  onResetFilters: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  feed,
  onFeedChange,
  minMagnitude,
  onMinMagnitudeChange,
  selectedRegion,
  onRegionChange,
  searchQuery,
  onSearchChange,
  layerMode,
  onLayerModeChange,
  onResetFilters,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={`fixed top-14 left-0 bottom-14 md:bottom-16 z-20 transition-all duration-300 ease-in-out flex ${
        isCollapsed ? '-translate-x-full md:translate-x-0 md:w-12' : 'w-72 sm:w-80'
      }`}
    >
      {/* Rail content */}
      <div className="w-full h-full bg-orbital-surface/95 backdrop-blur-md border-r border-orbital-border flex flex-col justify-between overflow-y-auto overflow-x-hidden p-3.5 space-y-4 shadow-xl">
        {/* Rail Header */}
        <div className="flex items-center justify-between border-b border-orbital-border pb-2.5">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal size={15} className="text-orbital-teal" />
            <span className="text-xs font-semibold uppercase tracking-wider text-orbital-text">
              Exploration Controls
            </span>
          </div>
          <button
            onClick={onResetFilters}
            className="flex items-center space-x-1 text-[11px] text-orbital-muted hover:text-orbital-teal transition px-1.5 py-0.5 rounded border border-orbital-border hover:border-orbital-teal/40"
            title="Reset filters to default"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>

        {/* Layer Mode Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-orbital-muted uppercase tracking-wider flex items-center justify-between">
            <span>Primary Focus Layer</span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-orbital-bg p-1 rounded-lg border border-orbital-border text-[11px]">
            <button
              onClick={() => onLayerModeChange('earthquakes')}
              className={`py-1.5 rounded font-medium flex items-center justify-center space-x-1 transition ${
                layerMode === 'earthquakes'
                  ? 'bg-orbital-coral/15 text-orbital-coral border border-orbital-coral/40'
                  : 'text-orbital-muted hover:text-orbital-text'
              }`}
            >
              <Activity size={12} />
              <span>Seismic</span>
            </button>
            <button
              onClick={() => onLayerModeChange('weather')}
              className={`py-1.5 rounded font-medium flex items-center justify-center space-x-1 transition ${
                layerMode === 'weather'
                  ? 'bg-orbital-weather/15 text-orbital-weather border border-orbital-weather/40'
                  : 'text-orbital-muted hover:text-orbital-text'
              }`}
            >
              <CloudSun size={12} />
              <span>Weather</span>
            </button>
            <button
              onClick={() => onLayerModeChange('both')}
              className={`py-1.5 rounded font-medium flex items-center justify-center space-x-1 transition ${
                layerMode === 'both'
                  ? 'bg-orbital-teal/15 text-orbital-teal border border-orbital-teal/40'
                  : 'text-orbital-muted hover:text-orbital-text'
              }`}
            >
              <Compass size={12} />
              <span>Dual</span>
            </button>
          </div>
        </div>

        {/* USGS Feed Time Window */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-orbital-muted uppercase tracking-wider">
              USGS Time Window
            </label>
            <span className="text-[10px] font-mono text-orbital-teal">
              {USGS_FEEDS[feed]?.label}
            </span>
          </div>
          <select
            value={feed}
            onChange={(e) => onFeedChange(e.target.value as FeedType)}
            className="w-full bg-orbital-bg border border-orbital-border text-orbital-text rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-orbital-teal font-sans transition"
          >
            {Object.values(USGS_FEEDS).map((f) => (
              <option key={f.id} value={f.id} className="bg-orbital-surface">
                {f.label} — {f.description.slice(0, 36)}...
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Magnitude Filter */}
        <div className="space-y-1.5 bg-orbital-bg/60 p-2.5 rounded-lg border border-orbital-border">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-orbital-muted uppercase tracking-wider">
              Minimum Magnitude
            </label>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              minMagnitude >= 6.0 ? 'bg-orbital-coral/20 text-orbital-coral' :
              minMagnitude >= 4.5 ? 'bg-orbital-amber/20 text-orbital-amber' :
              'bg-orbital-teal/20 text-orbital-teal'
            }`}>
              {minMagnitude === 0 ? 'All (M0+)' : `≥ M${minMagnitude.toFixed(1)}`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="7.0"
            step="0.5"
            value={minMagnitude}
            onChange={(e) => onMinMagnitudeChange(parseFloat(e.target.value))}
            className="w-full accent-orbital-teal bg-orbital-border h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-orbital-muted font-mono px-0.5">
            <span>M0</span>
            <span>M2.5</span>
            <span>M4.5</span>
            <span>M6.0</span>
            <span>M7+</span>
          </div>
        </div>

        {/* Regional Focus & Tectonic Preset */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-orbital-muted uppercase tracking-wider flex items-center space-x-1">
            <MapPin size={12} className="text-orbital-teal" />
            <span>Tectonic Zone Preset</span>
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="w-full bg-orbital-bg border border-orbital-border text-orbital-text rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-orbital-teal font-sans transition"
          >
            {REGION_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-orbital-surface">
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Text Filter Search */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-orbital-muted uppercase tracking-wider">
            Location / Place Filter
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="e.g. Tokyo, Alaska, Ridgecrest..."
            className="w-full bg-orbital-bg border border-orbital-border text-orbital-text rounded-md px-2.5 py-1.5 text-xs placeholder-orbital-muted/60 focus:outline-none focus:border-orbital-teal transition"
          />
        </div>

        {/* Map Legend */}
        <div className="mt-auto border-t border-orbital-border pt-3 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-orbital-muted">
            Cartographic Legend
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orbital-teal inline-block shadow-sm shadow-orbital-teal/50" />
              <span className="text-orbital-muted">&lt; 2.5 (Minor)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orbital-amber inline-block shadow-sm shadow-orbital-amber/50" />
              <span className="text-orbital-muted">2.5 - 4.5 (Light)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF8866] inline-block shadow-sm shadow-[#FF8866]/50" />
              <span className="text-orbital-muted">4.5 - 6.0 (Mod)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orbital-coral inline-block shadow-sm shadow-orbital-coral/50" />
              <span className="text-orbital-muted">6.0+ (Strong)</span>
            </div>
          </div>
          <div className="text-[9px] text-orbital-muted/80 leading-tight pt-1 flex items-center space-x-1">
            <ShieldAlert size={10} className="text-orbital-coral flex-shrink-0" />
            <span>Circle diameter indicates reported magnitude scale (M). Color bands denote severity, not risk prediction.</span>
          </div>
        </div>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center w-5 h-12 bg-orbital-surface border border-l-0 border-orbital-border rounded-r text-orbital-muted hover:text-orbital-teal my-auto transition shadow-md"
        title={isCollapsed ? 'Expand exploration panel' : 'Collapse exploration panel'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
};
