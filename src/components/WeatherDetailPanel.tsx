import React from 'react';
import type { LocationWeather } from '../types';
import { getWeatherDescription } from '../services/weather';
import { X, Cloud, Wind, Thermometer, ExternalLink, Calendar } from 'lucide-react';

interface WeatherDetailPanelProps {
  weather: LocationWeather | null;
  onClose: () => void;
}

export const WeatherDetailPanel: React.FC<WeatherDetailPanelProps> = ({
  weather,
  onClose,
}) => {
  if (!weather) return null;

  const desc = getWeatherDescription(weather.current.weather_code);

  return (
    <div className="fixed top-18 left-4 sm:left-6 md:left-8 z-30 w-80 sm:w-96 bg-orbital-surface/95 backdrop-blur-md border border-orbital-border rounded-xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-orbital-border pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-orbital-weather/15 border border-orbital-weather/40 text-orbital-weather">
            <Cloud size={24} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-orbital-weather flex items-center space-x-1.5 font-semibold">
              <span>Atmospheric Profile</span>
              <span>•</span>
              <span className="text-orbital-muted font-normal">{weather.timezone}</span>
            </div>
            <h3 className="text-xs font-semibold text-orbital-text">
              {weather.locationName || `${weather.latitude.toFixed(2)}°, ${weather.longitude.toFixed(2)}°`}
            </h3>
            <div className="text-[11px] text-orbital-muted mt-0.5">
              {desc.label}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-orbital-muted hover:text-orbital-text p-1 rounded-lg hover:bg-orbital-elevated transition"
          aria-label="Close weather panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Current Conditions Highlights */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-orbital-bg/80 p-2.5 rounded-lg border border-orbital-border space-y-0.5">
          <div className="text-[10px] text-orbital-muted flex items-center space-x-1">
            <Thermometer size={12} className="text-orbital-weather" />
            <span>Temperature</span>
          </div>
          <div className="text-lg font-bold text-orbital-text">
            {weather.current.temperature.toFixed(1)}°C
          </div>
          <div className="text-[9px] text-orbital-muted">
            Feels like {weather.current.apparent_temperature.toFixed(1)}°C
          </div>
        </div>

        <div className="bg-orbital-bg/80 p-2.5 rounded-lg border border-orbital-border space-y-0.5">
          <div className="text-[10px] text-orbital-muted flex items-center space-x-1">
            <Wind size={12} className="text-orbital-weather" />
            <span>Wind & Gusts</span>
          </div>
          <div className="text-sm font-bold text-orbital-text">
            {weather.current.wind_speed.toFixed(1)} <span className="text-[10px] text-orbital-muted font-normal">km/h</span>
          </div>
          <div className="text-[9px] text-orbital-muted">
            Direction: {weather.current.wind_direction}° • Gusts: {weather.current.wind_gusts ?? weather.current.wind_speed} km/h
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
        <div className="bg-orbital-bg/50 p-2 rounded-lg border border-orbital-border">
          <div className="text-[9px] text-orbital-muted uppercase">Humidity</div>
          <div className="text-orbital-text font-bold mt-0.5">{weather.current.relative_humidity}%</div>
        </div>
        <div className="bg-orbital-bg/50 p-2 rounded-lg border border-orbital-border">
          <div className="text-[9px] text-orbital-muted uppercase">Precipitation</div>
          <div className="text-orbital-text font-bold mt-0.5">{weather.current.precipitation} mm</div>
        </div>
        <div className="bg-orbital-bg/50 p-2 rounded-lg border border-orbital-border">
          <div className="text-[9px] text-orbital-muted uppercase">Cloud Cover</div>
          <div className="text-orbital-text font-bold mt-0.5">{weather.current.cloud_cover}%</div>
        </div>
      </div>

      {/* 24-Hour Horizon Forecast Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-orbital-muted uppercase">
          <span className="flex items-center space-x-1">
            <Calendar size={11} className="text-orbital-weather" />
            <span>24-Hour Horizon Trend</span>
          </span>
          <span className="text-orbital-weather font-semibold">Open-Meteo Model</span>
        </div>
        <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          {weather.hourly.times.slice(0, 12).map((timeStr, idx) => {
            const timeObj = new Date(timeStr);
            const hourLabel = timeObj.getHours().toString().padStart(2, '0') + ':00';
            const temp = weather.hourly.temperatures[idx];
            const prob = weather.hourly.precipitation_probabilities[idx];
            return (
              <div
                key={idx}
                className="bg-orbital-bg/70 border border-orbital-border p-1.5 rounded-md flex flex-col items-center min-w-[50px] space-y-1 text-center"
              >
                <span className="text-[9px] text-orbital-muted">{hourLabel}</span>
                <span className="text-[11px] font-bold text-orbital-text">{temp !== undefined ? `${temp.toFixed(0)}°` : '-'}</span>
                {prob > 0 && (
                  <span className="text-[8px] text-orbital-weather font-semibold">{prob}% rain</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Provenance & Disclaimer */}
      <div className="text-[9px] text-orbital-muted/80 leading-relaxed border-t border-orbital-border pt-2.5 flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <span>Source: Open-Meteo Forecast API</span>
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orbital-weather hover:underline flex items-center space-x-0.5"
          >
            <span>CC BY 4.0</span>
            <ExternalLink size={9} />
          </a>
        </div>
        <div className="italic text-orbital-muted/60">
          Model-derived forecast via global numerical weather models (ECMWF/GFS). Not a direct ground-sensor measurement.
        </div>
      </div>
    </div>
  );
};
