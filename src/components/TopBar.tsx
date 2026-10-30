import React from 'react';
import { OrbitalLogo } from './Icons';
import { Bot, HelpCircle, Settings, RefreshCw } from 'lucide-react';
import type { LayerMode } from '../types';

interface TopBarProps {
  isLoading: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
  activeLayer: LayerMode;
  onLayerChange: (mode: LayerMode) => void;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
  onOpenInfo: () => void;
  onOpenSettings: () => void;
  filteredCount: number;
  totalCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  isLoading,
  lastUpdated,
  onRefresh,
  activeLayer,
  onLayerChange,
  isCopilotOpen,
  onToggleCopilot,
  onOpenInfo,
  onOpenSettings,
  filteredCount,
  totalCount,
}) => {
  const formatTime = (ts: number | null) => {
    if (!ts) return 'Connecting...';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <header className="h-14 bg-orbital-surface border-b border-orbital-border px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* Brand & Mission */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={onOpenInfo} title="TerraPulse Architecture & Documentation">
          <OrbitalLogo size={28} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-orbital-text text-base">TERRAPULSE</span>
              <span className="text-[10px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-orbital-border text-orbital-teal font-medium border border-orbital-teal/30">
                AWS MAP IT
              </span>
            </div>
            <div className="text-[10px] tracking-wider text-orbital-muted font-medium flex items-center space-x-1.5">
              <span>GLOBAL EARTH INTELLIGENCE</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1 animate-pulse"></span>
                S3 HOSTED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Feed Telemetry & Layer Switcher */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Layer Mode Pills */}
        <div className="flex items-center bg-orbital-bg border border-orbital-border rounded-lg p-0.5 text-xs">
          <button
            onClick={() => onLayerChange('earthquakes')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeLayer === 'earthquakes'
                ? 'bg-orbital-elevated text-orbital-coral shadow-sm border border-orbital-coral/30'
                : 'text-orbital-muted hover:text-orbital-text'
            }`}
          >
            Seismic (USGS)
          </button>
          <button
            onClick={() => onLayerChange('weather')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeLayer === 'weather'
                ? 'bg-orbital-elevated text-orbital-weather shadow-sm border border-orbital-weather/30'
                : 'text-orbital-muted hover:text-orbital-text'
            }`}
          >
            Weather (Open-Meteo)
          </button>
          <button
            onClick={() => onLayerChange('both')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeLayer === 'both'
                ? 'bg-orbital-elevated text-orbital-teal shadow-sm border border-orbital-teal/30'
                : 'text-orbital-muted hover:text-orbital-text'
            }`}
          >
            Dual Layer
          </button>
        </div>

        {/* Live sync pill */}
        <div className="flex items-center space-x-2 text-xs bg-orbital-bg px-3 py-1 rounded-lg border border-orbital-border text-orbital-muted font-mono">
          <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orbital-amber animate-ping' : 'bg-orbital-teal'}`} />
          <span className="text-orbital-text font-semibold">{filteredCount}</span>
          <span>/</span>
          <span>{totalCount} events</span>
          <span className="text-orbital-border">|</span>
          <span className="text-[11px]">{formatTime(lastUpdated)}</span>
          <button
            onClick={onRefresh}
            title="Refresh feeds"
            className="text-orbital-muted hover:text-orbital-teal transition ml-1"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Copilot Drawer Toggle Button */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            isCopilotOpen
              ? 'bg-orbital-teal/15 border-orbital-teal text-orbital-teal shadow-sm'
              : 'bg-orbital-surface border-orbital-border text-orbital-text hover:border-orbital-teal/50'
          }`}
          title="Toggle Gemini 3.1 Flash-Lite Copilot"
        >
          <Bot size={15} className={isCopilotOpen ? 'text-orbital-teal animate-pulse' : 'text-orbital-muted'} />
          <span className="font-medium hidden sm:inline">AI Copilot</span>
          <span className="text-[10px] font-mono px-1 py-0.2 bg-orbital-bg rounded border border-orbital-border text-orbital-muted">
            Gemini
          </span>
        </button>

        {/* Documentation / Project Info */}
        <button
          onClick={onOpenInfo}
          className="p-1.5 text-orbital-muted hover:text-orbital-text hover:bg-orbital-elevated rounded-lg transition border border-transparent hover:border-orbital-border"
          title="Project Specification, AWS Architecture & Data Provenance"
        >
          <HelpCircle size={18} />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-orbital-muted hover:text-orbital-text hover:bg-orbital-elevated rounded-lg transition border border-transparent hover:border-orbital-border"
          title="Settings & Gemini API Setup"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
