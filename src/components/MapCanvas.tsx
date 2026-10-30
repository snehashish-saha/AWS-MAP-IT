import React, { useEffect, useRef, useState } from 'react';
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

// Built-in style specifications with guaranteed high-reliability tile servers
export const BASEMAP_STYLES = {
  cartoDark: {
    name: 'Carto Dark Matter',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a> | <a href="https://earthquake.usgs.gov" target="_blank">USGS</a> | <a href="https://open-meteo.com" target="_blank">Open-Meteo</a>',
    spec: {
      version: 8 as const,
      sources: {
        'carto-dark': {
          type: 'raster' as const,
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster' as const,
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  openFreeMapDark: {
    name: 'OpenFreeMap Dark',
    attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://earthquake.usgs.gov" target="_blank">USGS</a>',
    spec: 'https://tiles.openfreemap.org/styles/dark',
  },
  openFreeMapLiberty: {
    name: 'OpenFreeMap Liberty',
    attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://earthquake.usgs.gov" target="_blank">USGS</a>',
    spec: 'https://tiles.openfreemap.org/styles/liberty',
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const weatherMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [activeStyleKey, setActiveStyleKey] = useState<keyof typeof BASEMAP_STYLES>('cartoDark');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Storing latest props in refs to avoid stale closures during map lifecycle
  const filteredFeaturesRef = useRef(filteredFeatures);
  filteredFeaturesRef.current = filteredFeatures;

  const topNEventsRef = useRef(topNEvents);
  topNEventsRef.current = topNEvents;

  const selectedEventRef = useRef(selectedEvent);
  selectedEventRef.current = selectedEvent;

  // Add all seismic and highlight layers safely
  const setupLayers = (map: maplibregl.Map) => {
    // 1. Earthquakes source
    if (!map.getSource('earthquakes')) {
      map.addSource('earthquakes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: filteredFeaturesRef.current as any,
        },
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });
    } else {
      const src = map.getSource('earthquakes') as maplibregl.GeoJSONSource;
      src.setData({
        type: 'FeatureCollection',
        features: filteredFeaturesRef.current as any,
      });
    }

    // 2. Highlighted events source
    if (!map.getSource('highlighted-events')) {
      const highlights: EarthquakeFeature[] = [];
      if (selectedEventRef.current) highlights.push(selectedEventRef.current);
      for (const ev of topNEventsRef.current) {
        if (!highlights.some(h => String(h.id) === String(ev.id))) {
          highlights.push(ev);
        }
      }

      map.addSource('highlighted-events', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: highlights as any,
        },
      });
    }

    // 3. Cluster Circles
    if (!map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#1B3E52',
            10,
            '#2C5369',
            50,
            '#3B6978',
            200,
            '#FF6D6D',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            10,
            24,
            50,
            30,
            200,
            38,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#62E8D0',
          'circle-stroke-opacity': 0.9,
        },
      });
    }

    // 4. Cluster Count Numbers
    if (!map.getLayer('cluster-count')) {
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
        paint: {
          'text-color': '#FFFFFF',
        },
      });
    }

    // 5. Highlight Ring Layer
    if (!map.getLayer('highlighted-glow')) {
      map.addLayer({
        id: 'highlighted-glow',
        type: 'circle',
        source: 'highlighted-events',
        paint: {
          'circle-radius': [
            'step',
            ['to-number', ['get', 'mag'], 0],
            12,
            2.5,
            18,
            4.5,
            26,
            6.0,
            38,
          ],
          'circle-color': '#FF6D6D',
          'circle-opacity': 0.35,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#FFB45C',
          'circle-stroke-opacity': 0.9,
        },
      });
    }

    // 6. Individual Earthquake Points
    if (!map.getLayer('unclustered-point')) {
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'earthquakes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'step',
            ['to-number', ['get', 'mag'], 0],
            '#62E8D0', // < 2.5 Minor
            2.5,
            '#FFB45C', // 2.5 - 4.5 Light
            4.5,
            '#FF8866', // 4.5 - 6.0 Moderate
            6.0,
            '#FF6D6D', // >= 6.0 Severe
          ],
          'circle-radius': [
            'step',
            ['to-number', ['get', 'mag'], 0],
            5.5,
            2.5,
            8.5,
            4.5,
            14,
            6.0,
            22,
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.85,
          'circle-opacity': 0.9,
        },
      });
    }

    setMapLoaded(true);
  };

  // Initialize MapLibre
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
      setupLayers(map);
    });

    // Handle cluster click
    map.on('click', 'clusters', (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features[0]) return;
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource('earthquakes') as maplibregl.GeoJSONSource;
      
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const geom = features[0].geometry as { type: 'Point'; coordinates: [number, number] };
        map.easeTo({
          center: geom.coordinates,
          zoom: zoom,
          duration: 500,
        });
      });
    });

    // Handle unclustered marker click
    map.on('click', 'unclustered-point', (e: any) => {
      if (!e.features || !e.features[0]) return;
      const feat = e.features[0];
      const coordinates = (feat.geometry as { type: 'Point'; coordinates: [number, number, number] }).coordinates.slice() as [number, number, number];
      
      const matched = filteredFeaturesRef.current.find((f) => String(f.id) === String(feat.id || feat.properties?.id));
      if (matched) {
        onSelectEvent(matched);
      } else {
        onSelectEvent({
          type: 'Feature',
          id: feat.id || feat.properties?.id || 'event',
          geometry: {
            type: 'Point',
            coordinates,
          },
          properties: feat.properties as any,
        });
      }
      
      onMapClickCoordinates(coordinates[1], coordinates[0]);
    });

    // Click anywhere else on map
    map.on('click', (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters', 'unclustered-point'],
      });
      if (features.length === 0) {
        onMapClickCoordinates(e.lngLat.lat, e.lngLat.lng);
      }
    });

    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [activeStyleKey]);

  // Update GeoJSON source whenever filtered features update
  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource('earthquakes') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: layerMode === 'weather' ? [] : (filteredFeatures as any),
      });
    }
  }, [filteredFeatures, mapLoaded, layerMode]);

  // Update Highlighted Top-N or selected events
  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource('highlighted-events') as maplibregl.GeoJSONSource;
    if (source) {
      const highlights: EarthquakeFeature[] = [];
      if (selectedEvent) {
        highlights.push(selectedEvent);
      }
      for (const ev of topNEvents) {
        if (!highlights.some(h => String(h.id) === String(ev.id))) {
          highlights.push(ev);
        }
      }
      source.setData({
        type: 'FeatureCollection',
        features: layerMode === 'weather' ? [] : (highlights as any),
      });
    }
  }, [selectedEvent, topNEvents, mapLoaded, layerMode]);

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
  }, [selectedRegion, mapLoaded]);

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

  return (
    <div className="relative w-full h-full flex-1 bg-orbital-bg">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Basemap Style Switcher Pill - placed top-right next to zoom controls */}
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
            <div className="absolute top-9 right-0 bg-orbital-surface border border-orbital-border rounded-lg shadow-2xl p-1 w-48 space-y-0.5 text-xs font-mono z-30">
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
