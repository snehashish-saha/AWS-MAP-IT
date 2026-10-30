import React from 'react';
import type { EarthquakeFeature } from '../types';
import { X, ExternalLink, Calendar, MapPin, Waves, Compass, CloudSun, Eye } from 'lucide-react';

interface EventDetailPanelProps {
  event: EarthquakeFeature | null;
  onClose: () => void;
  onFetchWeather: (lat: number, lng: number) => void;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  event,
  onClose,
  onFetchWeather,
}) => {
  if (!event) return null;

  const [lng, lat, depth] = event.geometry.coordinates;
  const p = event.properties;
  const mag = p.mag;

  const getMagBadgeColor = (val: number | null) => {
    if (val === null) return 'bg-orbital-border text-orbital-muted';
    if (val >= 6.0) return 'bg-orbital-coral/20 text-orbital-coral border border-orbital-coral/50';
    if (val >= 4.5) return 'bg-orbital-amber/20 text-orbital-amber border border-orbital-amber/50';
    if (val >= 2.5) return 'bg-[#FF8866]/20 text-[#FF8866] border border-[#FF8866]/50';
    return 'bg-orbital-teal/20 text-orbital-teal border border-orbital-teal/50';
  };

  const eventDate = new Date(p.time);

  return (
    <div className="fixed top-18 right-4 sm:right-6 md:right-8 z-30 w-80 sm:w-96 bg-orbital-surface/95 backdrop-blur-md border border-orbital-border rounded-xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-orbital-border pb-3">
        <div className="flex items-center space-x-3">
          <div className={`px-2.5 py-1 rounded-lg text-lg font-mono font-bold ${getMagBadgeColor(mag)}`}>
            {mag !== null ? `M ${mag.toFixed(1)}` : 'M ?'}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-orbital-muted flex items-center space-x-1.5">
              <span>USGS Event</span>
              <span>•</span>
              <span className="text-orbital-teal font-semibold">{p.magType || 'seismic'}</span>
            </div>
            <h3 className="text-xs font-semibold text-orbital-text leading-tight line-clamp-2">
              {p.place || 'Unknown Location'}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-orbital-muted hover:text-orbital-text p-1 rounded-lg hover:bg-orbital-elevated transition"
          aria-label="Close detail panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-orbital-bg/80 p-2.5 rounded-lg border border-orbital-border space-y-0.5">
          <div className="text-[10px] text-orbital-muted flex items-center space-x-1">
            <Compass size={11} className="text-orbital-teal" />
            <span>Focal Depth</span>
          </div>
          <div className="text-sm font-bold text-orbital-text">
            {depth.toFixed(1)} <span className="text-[10px] text-orbital-muted font-normal">km</span>
          </div>
          <div className="text-[9px] text-orbital-muted">
            {depth <= 70 ? 'Shallow Crustal' : depth <= 300 ? 'Intermediate Zone' : 'Deep Mantle'}
          </div>
        </div>

        <div className="bg-orbital-bg/80 p-2.5 rounded-lg border border-orbital-border space-y-0.5">
          <div className="text-[10px] text-orbital-muted flex items-center space-x-1">
            <MapPin size={11} className="text-orbital-teal" />
            <span>Coordinates</span>
          </div>
          <div className="text-xs font-bold text-orbital-text">
            {lat.toFixed(2)}°, {lng.toFixed(2)}°
          </div>
          <div className="text-[9px] text-orbital-muted truncate">
            Network: {p.net || 'Global'}
          </div>
        </div>
      </div>

      {/* Date & Time display */}
      <div className="space-y-1 text-[11px] font-mono bg-orbital-bg/50 p-2 rounded-lg border border-orbital-border">
        <div className="flex items-center justify-between text-orbital-muted">
          <span className="flex items-center space-x-1">
            <Calendar size={12} className="text-orbital-teal" />
            <span>Origin Time (UTC):</span>
          </span>
          <span className="text-orbital-text font-semibold">{eventDate.toUTCString().slice(5, 25)}</span>
        </div>
        <div className="flex items-center justify-between text-orbital-muted">
          <span>Local Time:</span>
          <span className="text-orbital-text">{eventDate.toLocaleString()}</span>
        </div>
      </div>

      {/* Impact Indicators (Tsunami, Alert Level, Felt reports) */}
      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
        {p.tsunami === 1 && (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-orbital-coral/20 text-orbital-coral border border-orbital-coral/50">
            <Waves size={11} />
            <span>Tsunami Flag Issued</span>
          </span>
        )}
        {p.alert && (
          <span className={`px-2 py-0.5 rounded uppercase font-semibold ${
            p.alert === 'green' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
            p.alert === 'yellow' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            PAGER: {p.alert}
          </span>
        )}
        {typeof p.felt === 'number' && p.felt > 0 && (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-orbital-elevated border border-orbital-border text-orbital-muted">
            <Eye size={10} />
            <span>{p.felt} Felt Reports</span>
          </span>
        )}
        {p.sig && (
          <span className="px-2 py-0.5 rounded bg-orbital-elevated border border-orbital-border text-orbital-muted">
            Significance: {p.sig}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-1">
        <button
          onClick={() => onFetchWeather(lat, lng)}
          className="flex-1 bg-orbital-weather/15 hover:bg-orbital-weather/25 text-orbital-weather border border-orbital-weather/40 rounded-lg py-2 px-3 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
        >
          <CloudSun size={14} />
          <span>Weather Context</span>
        </button>

        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-orbital-elevated hover:bg-orbital-border border border-orbital-border text-orbital-text rounded-lg py-2 px-3 text-xs transition flex items-center space-x-1.5"
          title="Open official USGS Event Detail Page"
        >
          <span>USGS Page</span>
          <ExternalLink size={13} className="text-orbital-muted" />
        </a>
      </div>
    </div>
  );
};
