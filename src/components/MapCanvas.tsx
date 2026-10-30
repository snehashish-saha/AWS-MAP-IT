import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { EarthquakeFeature, EarthquakeFeatureCollection, LayerMode, LocationWeather } from '../types';
import { REGION_PRESETS } from '../constants/regions';
import { getWeatherDescription } from '../services/weather';

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

const OPENFREEMAP_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';

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

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OPENFREEMAP_DARK_STYLE,
      center: [15, 20],
      zoom: 1.8,
      minZoom: 1,
      maxZoom: 16,
      attributionControl: false,
    });

    // Custom attribution
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> | © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://earthquake.usgs.gov" target="_blank">USGS</a> | <a href="https://open-meteo.com" target="_blank">Open-Meteo</a>',
      }),
      'bottom-right'
    );

    // Standard navigation controls (zoom, pitch)
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      // 1. Add USGS GeoJSON source with clustering enabled
      map.addSource('earthquakes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 45,
      });

      // 2. Add Top-N / highlighted source for glowing emphasis
      map.addSource('highlighted-events', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Layer: Clustered circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#122B3A',
            10,
            '#1B3E52',
            50,
            '#2C5369',
            200,
            '#42293F',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            10,
            20,
            50,
            26,
            200,
            32,
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#62E8D0',
          'circle-stroke-opacity': 0.7,
        },
      });

      // Layer: Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 11,
        },
        paint: {
          'text-color': '#EDF4F7',
        },
      });

      // Layer: Highlighted halo / pulse ring for Top-N or selected events
      map.addLayer({
        id: 'highlighted-glow',
        type: 'circle',
        source: 'highlighted-events',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'mag'], 2],
            0, 10,
            3, 14,
            5, 22,
            7, 34
          ],
          'circle-color': '#FF6D6D',
          'circle-opacity': 0.25,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFB45C',
          'circle-stroke-opacity': 0.9,
        },
      });

      // Layer: Unclustered individual earthquake points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'earthquakes',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'step',
            ['coalesce', ['get', 'mag'], 0],
            '#62E8D0',
            2.5,
            '#FFB45C',
            4.5,
            '#FF8866',
            6.0,
            '#FF6D6D',
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'mag'], 2],
            0, 3.5,
            2.5, 6,
            4.5, 10,
            6.5, 17,
            8.0, 25,
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#EDF4F7',
          'circle-stroke-opacity': 0.7,
          'circle-opacity': 0.85,
        },
      });

      // Click on cluster -> zoom in
      map.on('click', 'clusters', (e: maplibregl.MapGeoJSONFeature & any) => {
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

      // Click on unclustered earthquake marker
      map.on('click', 'unclustered-point', (e: maplibregl.MapGeoJSONFeature & any) => {
        if (!e.features || !e.features[0]) return;
        const feat = e.features[0];
        const coordinates = (feat.geometry as { type: 'Point'; coordinates: [number, number, number] }).coordinates.slice() as [number, number, number];
        
        const matched = filteredFeatures.find((f) => String(f.id) === String(feat.id || feat.properties?.id));
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

      // Click anywhere on map canvas
      map.on('click', (e: any) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters', 'unclustered-point'],
        });
        if (features.length === 0) {
          onMapClickCoordinates(e.lngLat.lat, e.lngLat.lng);
        }
      });

      // Cursor changes on hover
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update GeoJSON source when filtered features change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
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
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('highlighted-events') as maplibregl.GeoJSONSource;
    if (source) {
      const highlights: EarthquakeFeature[] = [];
      if (selectedEvent) {
        highlights.push(selectedEvent);
      }
      if (topNEvents.length > 0) {
        for (const ev of topNEvents) {
          if (!highlights.some(h => String(h.id) === String(ev.id))) {
            highlights.push(ev);
          }
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
    if (!mapRef.current || !mapLoaded) return;
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
        <div class="relative flex items-center bg-[#0D1420]/95 text-[#75B9FF] border border-[#75B9FF]/60 px-2 py-1 rounded-full shadow-lg shadow-black/80 font-mono text-[11px] backdrop-blur cursor-pointer hover:border-[#62E8D0] transition">
          <span class="w-2 h-2 rounded-full bg-[#75B9FF] inline-block mr-1.5 animate-pulse"></span>
          <span class="font-bold text-[#EDF4F7]">${selectedWeather.current.temperature.toFixed(1)}°C</span>
          <span class="text-[10px] text-[#92A3B3] ml-1.5 hidden sm:inline">${desc.label.slice(0, 12)}</span>
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
