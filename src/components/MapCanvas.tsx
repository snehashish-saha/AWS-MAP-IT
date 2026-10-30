import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { EarthquakeFeature, EarthquakeFeatureCollection, LayerMode, LocationWeather } from '../types';
import { REGION_PRESETS } from '../constants/regions';
import { getWeatherDescription } from '../services/weather';
import { Layers } from 'lucide-react';

interface MapCanvasProps {
  data: EarthquakeFeatureCollection | null;
  filteredFeatures: EarthquakeFeature[];
  selectedEvent: EarthquakeFeature | null;
  onSelectEvent: (event: EarthquakeFeature | null) => void;
  selectedWeather: LocationWeather | null;
  onMapClickCoordinates: (lat: number, lng: number) => void;
  selectedRegion: string;
  topNEvents: EarthquakeFeature[];
  layerMode: LayerMode;
  isLoadingWeather: boolean;
}

export const BASEMAP_STYLES = {
  esriDark: {
    name: 'Scientific Dark Canvas',
    attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank">Esri</a> &mdash; USGS, NOAA | <a href="https://earthquake.usgs.gov" target="_blank">USGS Hazards</a> | <a href="https://open-meteo.com" target="_blank">Open-Meteo</a>',
    spec: {
      version: 8 as const,
      sources: {
        'esri-dark-base': {
          type: 'raster' as const,
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 16,
        },
        'esri-dark-labels': {
          type: 'raster' as const,
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 16,
        },
      },
      layers: [
        {
          id: 'esri-dark-base-layer',
          type: 'raster' as const,
          source: 'esri-dark-base',
          minzoom: 0,
          maxzoom: 16,
        },
        {
          id: 'esri-dark-labels-layer',
          type: 'raster' as const,
          source: 'esri-dark-labels',
          minzoom: 0,
          maxzoom: 16,
        },
      ],
    },
  },
  openFreeMapLiberty: {
    name: 'OpenFreeMap Liberty',
    attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://earthquake.usgs.gov" target="_blank">USGS</a>',
    spec: 'https://tiles.openfreemap.org/styles/liberty',
  },
  openFreeMapDark: {
    name: 'OpenFreeMap Dark',
    attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://earthquake.usgs.gov" target="_blank">USGS</a>',
    spec: 'https://tiles.openfreemap.org/styles/dark',
  },
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  filteredFeatures,
  selectedEvent,
  onSelectEvent,
  selectedWeather,
  onMapClickCoordinates,
  selectedRegion,
  topNEvents,
  layerMode,
  isLoadingWeather,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [_mapLoaded, setMapLoaded] = useState(false);
  const weatherMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [activeStyleKey, setActiveStyleKey] = useState<keyof typeof BASEMAP_STYLES>('esriDark');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [_mapMoveTick, setMapMoveTick] = useState(0);

  // Initialize MapLibre instance
  useEffect(() => {
    if (!mapContainer.current) return;

    const currentStyle = BASEMAP_STYLES[activeStyleKey];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: currentStyle.spec as any,
      center: [15, 20],
      zoom: 1.8,
      minZoom: 1,
      maxZoom: 16,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: currentStyle.attribution,
      }),
      'bottom-right'
    );

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);
      setMapMoveTick((t) => t + 1);
    });

    // Re-render projected points on every camera move/zoom
    map.on('move', () => {
      setMapMoveTick((t) => t + 1);
    });

    map.on('zoom', () => {
      setMapMoveTick((t) => t + 1);
    });

    // Click anywhere on map canvas to query weather
    map.on('click', (e: any) => {
      onMapClickCoordinates(e.lngLat.lat, e.lngLat.lng);
    });

    const handleResize = () => {
      map.resize();
      setMapMoveTick((t) => t + 1);
    };
    window.addEventListener('resize', handleResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [activeStyleKey]);

  // Handle region presets camera navigation
  useEffect(() => {
    if (!mapRef.current) return;
    const preset = REGION_PRESETS.find((r) => r.id === selectedRegion);
    if (preset) {
      if (preset.id === 'global') {
        mapRef.current.flyTo({
          center: preset.center,
          zoom: preset.zoom,
          duration: 1200,
        });
      } else {
        mapRef.current.fitBounds(preset.bounds, {
          padding: { top: 60, bottom: 80, left: 100, right: 100 },
          duration: 1400,
          maxZoom: 7,
        });
      }
    }
  }, [selectedRegion]);

  // Handle weather pinpoint marker on map
  useEffect(() => {
    if (!mapRef.current) return;

    if (weatherMarkerRef.current) {
      weatherMarkerRef.current.remove();
      weatherMarkerRef.current = null;
    }

    if (selectedWeather) {
      const el = document.createElement('div');
      el.className = 'weather-pin-pulse flex items-center justify-center';
      
      const desc = getWeatherDescription(selectedWeather.current.weather_code);
      
      el.innerHTML = `
        <div class="relative flex items-center bg-[#0D1420]/95 text-[#75B9FF] border border-[#75B9FF]/60 px-2.5 py-1 rounded-full shadow-xl shadow-black/80 font-mono text-[11px] backdrop-blur cursor-pointer hover:border-[#62E8D0] transition">
          <span class="w-2 h-2 rounded-full bg-[#75B9FF] inline-block mr-1.5 animate-pulse"></span>
          <span class="font-bold text-[#EDF4F7]">${selectedWeather.current.temperature.toFixed(1)}°C</span>
          <span class="text-[10px] text-[#92A3B3] ml-1.5 hidden sm:inline">${desc.label.slice(0, 14)}</span>
        </div>
      `;

      weatherMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedWeather.longitude, selectedWeather.latitude])
        .addTo(mapRef.current);
    }
  }, [selectedWeather]);

  // Compute projected screen coordinates for all filtered earthquake features
  const projectedEarthquakes = useMemo(() => {
    if (!mapRef.current || layerMode === 'weather') return [];

    const map = mapRef.current;
    const width = mapContainer.current?.clientWidth || window.innerWidth;
    const height = mapContainer.current?.clientHeight || window.innerHeight;

    const visible: Array<{
      feature: EarthquakeFeature;
      x: number;
      y: number;
      radius: number;
      color: string;
      isHighlighted: boolean;
      isSelected: boolean;
    }> = [];

    const topIds = new Set(topNEvents.map((e) => String(e.id)));
    const selectedId = selectedEvent ? String(selectedEvent.id) : null;

    for (const feat of filteredFeatures) {
      const [lng, lat] = feat.geometry.coordinates;
      const pt = map.project([lng, lat]);

      // Viewport culling buffer (skip points far outside the canvas)
      if (pt.x < -60 || pt.x > width + 60 || pt.y < -60 || pt.y > height + 60) {
        continue;
      }

      const mag = feat.properties.mag ?? 0;
      let radius = 5.5;
      let color = '#62E8D0'; // < 2.5 (Minor)

      if (mag >= 6.0) {
        radius = 16;
        color = '#FF6D6D'; // Severe (Coral)
      } else if (mag >= 4.5) {
        radius = 11;
        color = '#FF8866'; // Moderate (Orange)
      } else if (mag >= 2.5) {
        radius = 8;
        color = '#FFB45C'; // Light (Amber)
      }

      const fid = String(feat.id);
      const isSelected = selectedId === fid;
      const isHighlighted = topIds.has(fid);

      visible.push({
        feature: feat,
        x: pt.x,
        y: pt.y,
        radius,
        color,
        isHighlighted,
        isSelected,
      });
    }

    return visible;
  }, [filteredFeatures, layerMode, _mapMoveTick, selectedEvent, topNEvents]);

  return (
    <div className="relative w-full h-full flex-1 bg-orbital-bg overflow-hidden">
      {/* MapLibre Canvas Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* High-Performance SVG Epicenter Overlay */}
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full z-[5]"
        style={{ overflow: 'hidden' }}
      >
        <defs>
          <radialGradient id="halo-coral" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6D6D" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF6D6D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF8866" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF8866" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo-amber" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB45C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFB45C" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo-teal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#62E8D0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#62E8D0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {projectedEarthquakes.map((item) => {
          const fid = String(item.feature.id);
          const mag = item.feature.properties.mag ?? 0;
          const haloGrad =
            mag >= 6.0
              ? 'url(#halo-coral)'
              : mag >= 4.5
              ? 'url(#halo-orange)'
              : mag >= 2.5
              ? 'url(#halo-amber)'
              : 'url(#halo-teal)';

          return (
            <g
              key={fid}
              className="cursor-pointer pointer-events-auto transition-transform hover:scale-125 origin-center"
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent(item.feature);
                const [lng, lat] = item.feature.geometry.coordinates;
                onMapClickCoordinates(lat, lng);
              }}
            >
              {/* Soft atmospheric glow halo */}
              <circle
                cx={item.x}
                cy={item.y}
                r={item.radius * 2.2}
                fill={haloGrad}
              />

              {/* Glowing Pulse Ring for Selected or Top-N events */}
              {(item.isSelected || item.isHighlighted) && (
                <circle
                  cx={item.x}
                  cy={item.y}
                  r={item.radius + 7}
                  fill="none"
                  stroke={item.isSelected ? '#62E8D0' : '#FFB45C'}
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className="animate-spin origin-center"
                  style={{ transformOrigin: `${item.x}px ${item.y}px` }}
                />
              )}

              {/* Main Epicenter Core Circle */}
              <circle
                cx={item.x}
                cy={item.y}
                r={item.radius}
                fill={item.color}
                stroke="#FFFFFF"
                strokeWidth={item.radius >= 11 ? 2 : 1.5}
                strokeOpacity={0.9}
                className="transition-all duration-150 drop-shadow-md"
              />
            </g>
          );
        })}
      </svg>

      {/* Basemap Style Switcher Pill */}
      <div className="absolute top-3.5 right-14 z-10 hidden sm:block">
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="flex items-center space-x-1.5 bg-orbital-surface/90 hover:bg-orbital-elevated border border-orbital-border text-orbital-text px-2.5 py-1.5 rounded-lg text-xs font-mono shadow-lg backdrop-blur transition"
            title="Change Basemap Style"
          >
            <Layers size={13} className="text-orbital-teal" />
            <span>{BASEMAP_STYLES[activeStyleKey].name}</span>
          </button>

          {showStyleMenu && (
            <div className="absolute top-9 right-0 bg-orbital-surface border border-orbital-border rounded-lg shadow-2xl p-1 w-52 space-y-0.5 text-xs font-mono z-30">
              {Object.entries(BASEMAP_STYLES).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveStyleKey(key as keyof typeof BASEMAP_STYLES);
                    setShowStyleMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition ${
                    activeStyleKey === key
                      ? 'bg-orbital-teal/20 text-orbital-teal font-semibold'
                      : 'text-orbital-muted hover:text-orbital-text hover:bg-orbital-elevated'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weather Pin Loading Indicator Pill */}
      {isLoadingWeather && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-orbital-surface/90 border border-orbital-weather/60 text-orbital-weather px-3 py-1.5 rounded-full text-xs font-mono flex items-center space-x-2 shadow-lg backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-orbital-weather animate-ping" />
          <span>Fetching Open-Meteo atmospheric forecast...</span>
        </div>
      )}
    </div>
  );
};
