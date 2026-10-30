import React from 'react';
import type { TelemetryMetrics, LocationWeather, EarthquakeFeature } from '../types';
import { Activity, Thermometer, Wind, Droplets, Gauge, ArrowUpRight } from 'lucide-react';

interface BottomTelemetryRailProps {
  metrics: TelemetryMetrics;
  selectedWeather: LocationWeather | null;
  onSelectEvent: (event: EarthquakeFeature) => void;
  feedLabel: string;
  minMag: number;
}

export const BottomTelemetryRail: React.FC<BottomTelemetryRailProps> = ({
  metrics,
  selectedWeather,
  onSelectEvent,
  feedLabel,
  minMag,
}) => {
  return (
    <div className="h-16 md:h-18 bg-orbital-surface/95 backdrop-blur-md border-t border-orbital-border px-4 py-2 z-20 flex items-center justify-between text-xs font-mono select-none overflow-x-auto gap-4 shadow-2xl">
      {/* 1. Filter Scope & Count */}
      <div className="flex items-center space-x-3 min-w-max border-r border-orbital-border/60 pr-4">
        <div className="p-1.5 rounded-md bg-orbital-teal/10 border border-orbital-teal/30 text-orbital-teal">
          <Activity size={18} />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 text-[10px] text-orbital-muted uppercase">
            <span>Scope: {feedLabel}</span>
            <span>•</span>
            <span className="text-orbital-teal">≥ M{minMag.toFixed(1)}</span>
          </div>
          <div className="text-sm font-bold text-orbital-text flex items-baseline space-x-1">
            <span className="text-orbital-teal text-base">{metrics.filteredCount}</span>
            <span className="text-[11px] text-orbital-muted font-normal">
              / {metrics.totalCount} active events
            </span>
          </div>
        </div>
      </div>

      {/* 2. Strongest Event */}
      <div className="flex items-center space-x-3 min-w-max border-r border-orbital-border/60 pr-4">
        <div>
          <div className="text-[10px] text-orbital-muted uppercase flex items-center space-x-1">
            <Gauge size={12} className="text-orbital-coral" />
            <span>Peak Magnitude</span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-bold ${
                metrics.maxMagnitude >= 6.0
                  ? 'text-orbital-coral font-extrabold'
                  : metrics.maxMagnitude >= 4.5
                  ? 'text-orbital-amber font-semibold'
                  : 'text-orbital-teal'
              }`}
            >
              {metrics.maxMagnitude > 0 ? `M ${metrics.maxMagnitude.toFixed(1)}` : 'None'}
            </span>
            {metrics.strongestEvent && (
              <button
                onClick={() => onSelectEvent(metrics.strongestEvent!)}
                className="text-[10px] text-orbital-muted hover:text-orbital-coral transition truncate max-w-[140px] underline underline-offset-2 flex items-center"
                title={`Focus on ${metrics.strongestEvent.properties.place}`}
              >
                <span>{metrics.strongestEvent.properties.place?.slice(0, 20)}...</span>
                <ArrowUpRight size={10} className="ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Average Magnitude & Depth Breakdown */}
      <div className="hidden lg:flex items-center space-x-3 min-w-max border-r border-orbital-border/60 pr-4">
        <div>
          <div className="text-[10px] text-orbital-muted uppercase">Mean Mag / Depth</div>
          <div className="flex items-center space-x-2 text-orbital-text">
            <span className="font-semibold text-orbital-text">Ø M {metrics.averageMagnitude}</span>
            <span className="text-orbital-border">|</span>
            <span className="text-[10px] text-orbital-muted" title="Shallow (≤70km) / Intermediate (71-300km) / Deep (>300km)">
              Shallow: <span className="text-orbital-teal">{metrics.shallowCount}</span> • Deep: <span className="text-orbital-amber">{metrics.deepCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Magnitude Histogram Distribution */}
      <div className="hidden sm:flex items-center space-x-2 min-w-max border-r border-orbital-border/60 pr-4">
        <div className="space-y-1">
          <div className="text-[10px] text-orbital-muted uppercase">Distribution</div>
          <div className="flex items-center space-x-1.5 h-4">
            {metrics.magnitudeBuckets.map((bucket, idx) => {
              const heightPct = metrics.filteredCount > 0 ? Math.max(15, (bucket.count / metrics.filteredCount) * 100) : 10;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full w-6 group relative"
                >
                  <div
                    style={{ height: `${heightPct}%`, backgroundColor: bucket.color }}
                    className="w-full rounded-t transition-all duration-300 group-hover:brightness-125"
                  />
                  <div className="absolute -top-7 hidden group-hover:flex bg-orbital-elevated border border-orbital-border px-1.5 py-0.5 rounded text-[9px] text-orbital-text shadow-lg whitespace-nowrap z-30">
                    {bucket.range}: {bucket.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Selected Coordinate Weather context */}
      <div className="flex items-center space-x-3 min-w-max pl-1">
        {selectedWeather ? (
          <div className="flex items-center space-x-2.5 bg-orbital-bg/80 border border-orbital-weather/40 px-3 py-1 rounded-lg">
            <div className="p-1 rounded bg-orbital-weather/10 text-orbital-weather">
              <Thermometer size={15} />
            </div>
            <div>
              <div className="text-[9px] text-orbital-weather font-semibold uppercase flex items-center space-x-1">
                <span>Weather</span>
                <span className="text-orbital-muted">({selectedWeather.latitude.toFixed(1)}°, {selectedWeather.longitude.toFixed(1)}°)</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-orbital-text">
                <span className="font-bold">{selectedWeather.current.temperature.toFixed(1)}°C</span>
                <span className="text-orbital-muted flex items-center">
                  <Wind size={10} className="mr-0.5 text-orbital-weather" />
                  {selectedWeather.current.wind_speed.toFixed(0)} km/h
                </span>
                <span className="text-orbital-muted flex items-center">
                  <Droplets size={10} className="mr-0.5 text-orbital-weather" />
                  {selectedWeather.current.relative_humidity}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-orbital-muted/70 italic flex items-center space-x-1">
            <span>Click any map coordinate to fetch Open-Meteo atmospheric forecast</span>
          </div>
        )}
      </div>
    </div>
  );
};
