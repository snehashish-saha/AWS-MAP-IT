import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Compass,
  Radio,
  Anchor,
  Server,
  Activity,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import type {
  FeedType,
  LayerVisibility,
  ExposureAlert,
  ChokepointPreset,
  SelectedEntity,
} from '../types';
import { CHOKEPOINT_PRESETS } from '../constants/chokepoints';
import { formatGeodesicDistance, formatFocalDepth } from '../services/proximity';

interface IntelligenceConsoleProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  activeFeed: FeedType;
  onChangeFeed: (feed: FeedType) => void;
  minMagnitude: number;
  onChangeMinMagnitude: (mag: number) => void;
  alerts: ExposureAlert[];
  cablesCount: number;
  landingCount: number;
  awsRegionsCount: number;
  quakesCount: number;
  onSelectEntity: (entity: SelectedEntity) => void;
  onSelectChokepoint: (preset: ChokepointPreset | null) => void;
  activeChokepoint: ChokepointPreset | null;
  isStoryModeActive?: boolean;
}

type TabType = 'radar' | 'layers' | 'chokepoints';

export const IntelligenceConsole: React.FC<IntelligenceConsoleProps> = ({
  layerVisibility,
  onToggleLayer,
  activeFeed,
  onChangeFeed,
  minMagnitude,
  onChangeMinMagnitude,
  alerts,
  cablesCount,
  landingCount,
  awsRegionsCount,
  quakesCount,
  onSelectEntity,
  onSelectChokepoint,
  activeChokepoint,
  isStoryModeActive = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('radar');
  const [localMag, setLocalMag] = useState<number>(minMagnitude);

  useEffect(() => {
    setLocalMag(minMagnitude);
  }, [minMagnitude]);

  const handleSliderChange = (newVal: number) => {
    setLocalMag(newVal);
    onChangeMinMagnitude(newVal);
  };

  // Auto-collapse console when Story Mode guided tour begins to grant 100% screen focus
  useEffect(() => {
    if (isStoryModeActive) {
      setIsOpen(false);
    }
  }, [isStoryModeActive]);

  // Notable Transoceanic Systems for exploration
  const notableCables = [
    { id: 'marea', name: 'MAREA', length: '6,605 km', owners: 'Microsoft, Meta, Telxius', route: 'Virginia Beach (US) → Bilbao (ES)' },
    { id: 'dunant', name: 'Dunant', length: '6,400 km', owners: 'Google', route: 'Virginia Beach (US) → Saint-Hilaire-de-Riez (FR)' },
    { id: 'grace-hopper', name: 'Grace Hopper', length: '6,250 km', owners: 'Google', route: 'New York (US) → Bude (UK) / Bilbao (ES)' },
    { id: '2africa', name: '2Africa', length: '45,000 km', owners: 'Meta, China Mobile, Vodafone, Orange', route: 'Circumnavigating Africa & Mediterranean' },
  ];

  return (
    <div className="fixed top-20 left-6 z-30 select-none">
      <motion.div
        layout
        className="w-80 md:w-88 glass-panel rounded-2xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-2xl bg-[#090d16]/92"
      >
        {/* Console Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors border-b border-white/[0.06]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-subsea-cyan animate-pulse shadow-glow-cyan" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-subsea-text flex items-center gap-1.5">
                Subsea Intelligence
              </div>
              <div className="text-[10px] font-mono text-subsea-muted">
                {cablesCount} Cables · {landingCount} Hubs · {quakesCount} Quakes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-subsea-amber-dim text-subsea-amber border border-subsea-amber/40 animate-pulse">
                {alerts.length} ALERTS
              </span>
            )}
            <button className="text-subsea-muted hover:text-subsea-text transition-colors">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              {/* Segmented Navigation Tabs */}
              <div className="flex items-center p-1.5 mx-3 mt-3 rounded-xl bg-black/40 border border-white/5 text-xs font-medium text-subsea-muted">
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'radar'
                      ? 'bg-subsea-cyan text-black font-semibold shadow-glow-cyan'
                      : 'hover:text-subsea-text hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Radar</span>
                  {alerts.length > 0 && (
                    <span className={`text-[10px] font-mono px-1 rounded ${activeTab === 'radar' ? 'bg-black/30 text-black' : 'bg-subsea-amber text-black font-bold'}`}>
                      {alerts.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('layers')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'layers'
                      ? 'bg-subsea-cyan text-black font-semibold shadow-glow-cyan'
                      : 'hover:text-subsea-text hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Telemetry</span>
                </button>

                <button
                  onClick={() => setActiveTab('chokepoints')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'chokepoints'
                      ? 'bg-subsea-cyan text-black font-semibold shadow-glow-cyan'
                      : 'hover:text-subsea-text hover:bg-white/5'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Bottlenecks</span>
                </button>
              </div>

              {/* TAB 1: RADAR & LIVE THREATS */}
              {activeTab === 'radar' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-subsea-text tracking-wide">
                      Proximity screening (100 km buffer)
                    </span>
                    <span className="text-[10px] font-mono text-subsea-muted">
                      USGS {activeFeed.toUpperCase()} · M{minMagnitude.toFixed(1)}+
                    </span>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-semibold text-subsea-text">
                        Nominal Physical Clearance
                      </div>
                      <p className="text-[11px] text-subsea-muted leading-relaxed">
                        No seismic events &ge; M{minMagnitude.toFixed(1)} detected within 100km of monitored subsea cables in this timeframe.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {alerts.map((alert) => {
                        const mag = alert.earthquake.properties.mag ?? 0;
                        const depth = alert.earthquake.geometry.coordinates[2] ?? 10;
                        const isDeep = depth > 70;
                        const isSevere = mag >= 5.5 && !isDeep;

                        return (
                          <div
                            key={alert.id}
                            onClick={() =>
                              onSelectEntity({
                                type: 'exposure_alert',
                                data: alert,
                              })
                            }
                            className="p-3 rounded-xl bg-black/40 hover:bg-white/[0.06] border border-white/10 hover:border-subsea-amber/50 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isSevere
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                      : 'bg-subsea-amber-dim text-subsea-amber border border-subsea-amber/40'
                                  }`}
                                >
                                  M{mag.toFixed(1)}
                                </span>
                                <span className="text-xs font-mono font-bold text-subsea-amber">
                                  {formatGeodesicDistance(alert.distanceKm)}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase ${
                                    isDeep
                                      ? 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
                                      : alert.proximityCategory === 'critical'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      : alert.proximityCategory === 'warning'
                                      ? 'bg-subsea-amber-dim text-subsea-amber border border-subsea-amber/40'
                                      : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                  }`}
                                >
                                  {isDeep
                                    ? 'Deep Focus'
                                    : alert.proximityCategory === 'critical'
                                    ? 'High Hazard'
                                    : alert.proximityCategory === 'warning'
                                    ? 'Advisory'
                                    : 'Monitor'}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-subsea-muted">
                                {new Date(alert.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="text-xs font-medium text-subsea-text group-hover:text-subsea-cyan transition-colors leading-snug">
                              {alert.nearestCable.name}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-subsea-muted font-mono">
                              <span className="truncate max-w-[170px]">
                                {alert.earthquake.properties.place || 'Offshore Epicenter'} · {formatFocalDepth(depth)}
                              </span>
                              <span className="text-subsea-cyan flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                Inspect <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-[10px] text-subsea-muted/70 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 leading-relaxed">
                    <strong>Screening Heuristic:</strong> Highlights charted seabed fiber segments within 100 km of USGS epicenters. Shallow crustal events (&lt;70 km) with high energy pose primary turbidity current risk; deep-focus events (&gt;70 km) rarely trigger seabed rupture.
                  </div>
                </div>
              )}

              {/* TAB 2: TELEMETRY & FILTERS */}
              {activeTab === 'layers' && (
                <div className="p-4 space-y-4">
                  {/* Feed Time Window */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-subsea-muted/80 tracking-wider mb-2">
                      <span>USGS Time Horizon</span>
                      <span className="font-mono text-subsea-cyan">{activeFeed.toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
                      {(['24h', '7d', '30d'] as FeedType[]).map((feed) => (
                        <button
                          key={feed}
                          onClick={() => onChangeFeed(feed)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                            activeFeed === feed
                              ? 'bg-subsea-cyan text-black font-bold shadow-glow-cyan'
                              : 'text-subsea-muted hover:text-subsea-text hover:bg-white/5'
                          }`}
                        >
                          {feed.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Magnitude Threshold Slider */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-subsea-muted/80 tracking-wider mb-2">
                      <span>Minimum Magnitude</span>
                      <span className="font-mono text-red-400 font-bold">
                        M{localMag.toFixed(1)}+
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2.5"
                      max="6.5"
                      step="0.5"
                      value={localMag}
                      onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-subsea-cyan"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-subsea-muted/70 mt-1">
                      <span>M2.5 Minor</span>
                      <span>M4.0 Moderate</span>
                      <span>M6.0 Severe</span>
                    </div>
                  </div>

                  {/* Filter to Exposure Alerts Only */}
                  <div
                    onClick={() => onToggleLayer('alertsOnly')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 hover:bg-white/[0.04] cursor-pointer transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-subsea-text">
                      <Filter className="w-3.5 h-3.5 text-subsea-amber" />
                      <span>Exposed Cables Only</span>
                    </div>
                    <div
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                        layerVisibility.alertsOnly ? 'bg-subsea-amber/40 justify-end' : 'bg-black/50 justify-start'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full transition-transform ${
                          layerVisibility.alertsOnly ? 'bg-subsea-amber shadow-glow-amber' : 'bg-white/30'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Spatial Layer Switches */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="text-[10px] uppercase font-semibold text-subsea-muted/80 tracking-wider mb-1.5">
                      Spatial Layers
                    </div>

                    {/* Cables */}
                    <div
                      onClick={() => onToggleLayer('cables')}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-subsea-cyan" />
                        <span className="text-xs text-subsea-text font-medium">Subsea Cables</span>
                      </div>
                      <span className="text-[10px] font-mono text-subsea-muted">{cablesCount}</span>
                    </div>

                    {/* Landing Hubs */}
                    <div
                      onClick={() => onToggleLayer('landingPoints')}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Anchor className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-subsea-text font-medium">Landing Hubs</span>
                      </div>
                      <span className="text-[10px] font-mono text-subsea-muted">{landingCount}</span>
                    </div>

                    {/* AWS Regions */}
                    <div
                      onClick={() => onToggleLayer('awsRegions')}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-subsea-purple" />
                        <span className="text-xs text-subsea-text font-medium">AWS Regions</span>
                      </div>
                      <span className="text-[10px] font-mono text-subsea-muted">{awsRegionsCount}</span>
                    </div>

                    {/* USGS Quakes */}
                    <div
                      onClick={() => onToggleLayer('earthquakes')}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs text-subsea-text font-medium">USGS Quakes</span>
                      </div>
                      <span className="text-[10px] font-mono text-subsea-muted">{quakesCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CHOKEPOINTS & CABLE DIRECTORY */}
              {activeTab === 'chokepoints' && (
                <div className="p-4 space-y-3.5">
                  <div className="text-[10px] uppercase font-semibold text-subsea-muted/80 tracking-wider">
                    Maritime Chokepoints
                  </div>

                  <div className="space-y-1.5">
                    {CHOKEPOINT_PRESETS.map((preset) => {
                      const isActive = activeChokepoint?.id === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => onSelectChokepoint(preset)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-subsea-amber/15 border-subsea-amber/50 text-subsea-amber'
                              : 'bg-black/40 border-white/5 hover:border-white/20 text-subsea-text'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Anchor className="w-3.5 h-3.5 text-subsea-amber" />
                            <div>
                              <div className="text-xs font-semibold leading-tight">{preset.name}</div>
                              <div className="text-[10px] font-mono text-subsea-muted mt-0.5">
                                {preset.cableCountApprox}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-subsea-muted" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] uppercase font-semibold text-subsea-muted/80 tracking-wider pt-2 border-t border-white/5">
                    Notable Transoceanic Cables
                  </div>

                  <div className="space-y-1.5">
                    {notableCables.map((cable) => (
                      <div
                        key={cable.id}
                        onClick={() =>
                          onSelectEntity({
                            type: 'cable',
                            data: {
                              id: cable.id,
                              name: cable.name,
                              length: cable.length,
                              owners: cable.owners,
                            },
                          })
                        }
                        className="p-2.5 rounded-xl bg-black/40 hover:bg-white/[0.04] border border-white/5 hover:border-subsea-cyan/40 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Radio className="w-3 h-3 text-subsea-cyan" />
                            <span className="text-xs font-semibold text-subsea-text group-hover:text-subsea-cyan transition-colors">
                              {cable.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-subsea-muted">{cable.length}</span>
                        </div>
                        <div className="text-[10px] font-mono text-subsea-muted/80 mt-1 truncate">
                          {cable.route}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
