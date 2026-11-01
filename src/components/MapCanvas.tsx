import React, { useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import type {
  SubseaCableCollection,
  LandingPointCollection,
  EarthquakeFeature,
  ExposureAlert,
  SelectedEntity,
  LayerVisibility,
  ChokepointPreset,
  StoryStep,
} from '../types';
import { AWS_REGIONS } from '../constants/awsRegions';
import { buildProximityVectorGeoJSON } from '../services/proximity';

// Ensure MapLibre 6 Web Worker loads correctly in Vite bundled / dev environment
if (typeof (maplibregl as any).setWorkerUrl === 'function') {
  (maplibregl as any).setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface MapCanvasProps {
  cablesData: SubseaCableCollection | null;
  landingPointsData: LandingPointCollection | null;
  earthquakes: EarthquakeFeature[];
  alerts: ExposureAlert[];
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity | null) => void;
  layerVisibility: LayerVisibility;
  activeChokepoint: ChokepointPreset | null;
  storyStep: StoryStep | null;
  amazonLocationKey?: string;
  amazonLocationRegion?: string;
}

// Minimalistic deep-ocean dark canvas
const BASEMAP_STYLE = {
  version: 8 as const,
  sources: {
    'ocean-base': {
      type: 'raster' as const,
      tiles: [
        'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 16,
    },
  },
  layers: [
    {
      id: 'ocean-base-layer',
      type: 'raster' as const,
      source: 'ocean-base',
      minzoom: 0,
      maxzoom: 16,
    },
  ],
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  cablesData,
  landingPointsData,
  earthquakes,
  alerts,
  selectedEntity,
  onSelectEntity,
  layerVisibility,
  activeChokepoint,
  storyStep,
  amazonLocationKey,
  amazonLocationRegion = 'us-east-1',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isMapLoaded = useRef<boolean>(false);

  // Latest props refs to solve closure stale state
  const cablesDataRef = useRef(cablesData);
  cablesDataRef.current = cablesData;

  const landingPointsDataRef = useRef(landingPointsData);
  landingPointsDataRef.current = landingPointsData;

  // GeoJSON for AWS Regions
  const awsRegionsGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: AWS_REGIONS.map((r) => ({
        type: 'Feature' as const,
        id: r.id,
        properties: { ...r },
        geometry: {
          type: 'Point' as const,
          coordinates: r.coordinates,
        },
      })),
    };
  }, []);

  // Alert Earthquake IDs for O(1) lookup
  const alertQuakeIds = useMemo(() => new Set(alerts.map((a) => a.earthquake.id)), [alerts]);

  // GeoJSON for Earthquakes
  const earthquakesGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: earthquakes.map((eq) => {
        return {
          type: 'Feature' as const,
          id: eq.id,
          properties: {
            ...eq.properties,
            isAlert: alertQuakeIds.has(eq.id),
          },
          geometry: eq.geometry,
        };
      }),
    };
  }, [earthquakes, alertQuakeIds]);

  const earthquakesGeoJSONRef = useRef(earthquakesGeoJSON);
  earthquakesGeoJSONRef.current = earthquakesGeoJSON;

  // GeoJSON for Proximity Lines
  const proximityVectorsGeoJSON = useMemo(() => {
    return buildProximityVectorGeoJSON(alerts);
  }, [alerts]);

  const proximityVectorsGeoJSONRef = useRef(proximityVectorsGeoJSON);
  proximityVectorsGeoJSONRef.current = proximityVectorsGeoJSON;

  // Selected cable ID
  const selectedCableId = selectedEntity?.type === 'cable' ? selectedEntity.data.id : null;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let styleUrl: any = BASEMAP_STYLE;
    if (amazonLocationKey && amazonLocationKey.trim()) {
      styleUrl = `https://maps.geo.${amazonLocationRegion}.amazonaws.com/v2/styles/Standard/descriptor?key=${amazonLocationKey}&color-scheme=Dark`;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [25, 18],
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 14,
      pitch: 15,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    map.on('error', (err) => {
      console.error('MapLibre error:', err);
    });

    map.on('load', () => {
      isMapLoaded.current = true;
      try {
        initDataLayers(map);
      } catch (e: any) {
        console.error('Error in initDataLayers:', e);
      }

      // Force push latest datasets from refs immediately on load
      if (cablesDataRef.current && map.getSource('subsea-cables')) {
        (map.getSource('subsea-cables') as maplibregl.GeoJSONSource).setData(cablesDataRef.current as any);
      }
      if (landingPointsDataRef.current && map.getSource('landing-points')) {
        (map.getSource('landing-points') as maplibregl.GeoJSONSource).setData(landingPointsDataRef.current as any);
      }
      if (earthquakesGeoJSONRef.current && map.getSource('earthquakes')) {
        (map.getSource('earthquakes') as maplibregl.GeoJSONSource).setData(earthquakesGeoJSONRef.current as any);
      }
      if (proximityVectorsGeoJSONRef.current && map.getSource('proximity-vectors')) {
        (map.getSource('proximity-vectors') as maplibregl.GeoJSONSource).setData(proximityVectorsGeoJSONRef.current as any);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      isMapLoaded.current = false;
    };
  }, [amazonLocationKey, amazonLocationRegion]);

  // Initialize Layers on Map
  const initDataLayers = (map: maplibregl.Map) => {
    try {
      // 1. Proximity Vectors Source & Layer
      if (!map.getSource('proximity-vectors')) {
        map.addSource('proximity-vectors', {
          type: 'geojson',
          data: proximityVectorsGeoJSONRef.current as any,
        });

        map.addLayer({
          id: 'proximity-vectors-line',
          type: 'line',
          source: 'proximity-vectors',
          paint: {
            'line-color': '#FFB020',
            'line-width': 2,
            'line-opacity': 0.9,
          },
        });
      }

      // 2. Subsea Cables Source & Layers
      if (!map.getSource('subsea-cables')) {
        map.addSource('subsea-cables', {
          type: 'geojson',
          data: (cablesDataRef.current as any) || { type: 'FeatureCollection', features: [] },
        });

        // Background glow with zoom-driven scaling
        map.addLayer({
          id: 'cables-glow',
          type: 'line',
          source: 'subsea-cables',
          paint: {
            'line-color': '#22E3FF',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              1.5, 1.2,
              4, 2.0,
              7, 4.0,
              11, 7.0
            ],
            'line-opacity': [
              'interpolate', ['linear'], ['zoom'],
              1.5, 0.12,
              4, 0.20,
              8, 0.35
            ],
            'line-blur': 1.5,
          },
        });

        // Base fiber line with razor-sharp zoom interpolation
        map.addLayer({
          id: 'cables-line',
          type: 'line',
          source: 'subsea-cables',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#22E3FF',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              1.5, 0.65,
              4, 1.1,
              7, 2.0,
              11, 3.2
            ],
            'line-opacity': 0.85,
          },
        });

        // Selected highlight layer
        map.addLayer({
          id: 'cables-selected',
          type: 'line',
          source: 'subsea-cables',
          filter: ['==', ['get', 'id'], ''],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              1.5, 1.8,
              4, 2.8,
              7, 4.5,
              11, 6.0
            ],
            'line-opacity': 1.0,
          },
        });
      }

      // 3. Landing Points Source & Layer
      if (!map.getSource('landing-points')) {
        map.addSource('landing-points', {
          type: 'geojson',
          data: (landingPointsDataRef.current as any) || { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: 'landing-points-glow',
          type: 'circle',
          source: 'landing-points',
          paint: {
            'circle-radius': 4.5,
            'circle-color': '#FFB020',
            'circle-opacity': 0.35,
            'circle-blur': 1,
          },
        });

        map.addLayer({
          id: 'landing-points-circle',
          type: 'circle',
          source: 'landing-points',
          paint: {
            'circle-radius': 2.5,
            'circle-color': '#FFB020',
            'circle-opacity': 0.9,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#070A12',
          },
        });
      }

      // 4. AWS Regions Source & Layer
      if (!map.getSource('aws-regions')) {
        map.addSource('aws-regions', {
          type: 'geojson',
          data: awsRegionsGeoJSON as any,
        });

        map.addLayer({
          id: 'aws-regions-halo',
          type: 'circle',
          source: 'aws-regions',
          paint: {
            'circle-radius': 11,
            'circle-color': '#8B5CF6',
            'circle-opacity': 0.28,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#C4B5FD',
          },
        });

        map.addLayer({
          id: 'aws-regions-core',
          type: 'circle',
          source: 'aws-regions',
          paint: {
            'circle-radius': 4.5,
            'circle-color': '#8B5CF6',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#FFFFFF',
          },
        });
      }

      // 5. Earthquakes Source & Layer
      if (!map.getSource('earthquakes')) {
        map.addSource('earthquakes', {
          type: 'geojson',
          data: earthquakesGeoJSONRef.current as any,
        });

        map.addLayer({
          id: 'earthquakes-shockwave',
          type: 'circle',
          source: 'earthquakes',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'mag'], 2],
              2, 4,
              5, 12,
              8, 28
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'isAlert'], true],
              '#FFB020',
              '#EF4444'
            ],
            'circle-opacity': 0.25,
            'circle-blur': 0.5,
          },
        });

        map.addLayer({
          id: 'earthquakes-core',
          type: 'circle',
          source: 'earthquakes',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'mag'], 2],
              2, 2.5,
              5, 5.5,
              8, 10
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'isAlert'], true],
              '#FFB020',
              '#EF4444'
            ],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#FFFFFF',
            'circle-opacity': 0.95,
          },
        });
      }

      setupMapInteractions(map);
    } catch (err) {
      console.error('Error in initDataLayers:', err);
    }
  };

  const setupMapInteractions = (map: maplibregl.Map) => {
    // Click on Cable
    map.on('click', 'cables-line', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      onSelectEntity({
        type: 'cable',
        data: {
          id: props.id,
          name: props.name,
          length: props.length,
          owners: props.owners,
          rfs: props.rfs,
          rfs_year: props.rfs_year ? Number(props.rfs_year) : undefined,
        },
      });
    });

    map.on('mouseenter', 'cables-line', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'cables-line', () => {
      map.getCanvas().style.cursor = '';
    });

    // Click on Landing Point
    map.on('click', 'landing-points-circle', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      onSelectEntity({
        type: 'landing_point',
        data: {
          id: props.id,
          name: props.name,
        },
      });
    });

    map.on('mouseenter', 'landing-points-circle', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'landing-points-circle', () => {
      map.getCanvas().style.cursor = '';
    });

    // Click on AWS Region
    map.on('click', 'aws-regions-core', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      onSelectEntity({
        type: 'aws_region',
        data: {
          id: props.id,
          code: props.code,
          name: props.name,
          coordinates: [Number(feat.geometry.type === 'Point' ? feat.geometry.coordinates[0] : 0), Number(feat.geometry.type === 'Point' ? feat.geometry.coordinates[1] : 0)],
          continent: props.continent,
          launchYear: Number(props.launchYear),
          description: props.description,
        },
      });
    });

    map.on('mouseenter', 'aws-regions-core', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'aws-regions-core', () => {
      map.getCanvas().style.cursor = '';
    });

    // Click on Earthquake
    map.on('click', 'earthquakes-core', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const eqMatch = earthquakes.find((eq) => eq.id === feat.id);
      if (eqMatch) {
        const alertMatch = alerts.find((a) => a.earthquake.id === eqMatch.id);
        if (alertMatch) {
          onSelectEntity({
            type: 'exposure_alert',
            data: alertMatch,
          });
        } else {
          onSelectEntity({
            type: 'earthquake',
            data: eqMatch,
          });
        }
      }
    });

    map.on('mouseenter', 'earthquakes-core', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'earthquakes-core', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  // Sync Dynamic Data Updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current || !cablesData) return;

    if (map.getSource('subsea-cables')) {
      (map.getSource('subsea-cables') as maplibregl.GeoJSONSource).setData(cablesData as any);
    }
  }, [cablesData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current || !landingPointsData) return;

    if (map.getSource('landing-points')) {
      (map.getSource('landing-points') as maplibregl.GeoJSONSource).setData(landingPointsData as any);
    }
  }, [landingPointsData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    if (map.getSource('earthquakes')) {
      (map.getSource('earthquakes') as maplibregl.GeoJSONSource).setData(earthquakesGeoJSON as any);
    }
    if (map.getSource('proximity-vectors')) {
      (map.getSource('proximity-vectors') as maplibregl.GeoJSONSource).setData(proximityVectorsGeoJSON as any);
    }
  }, [earthquakesGeoJSON, proximityVectorsGeoJSON]);

  // Sync Selected Cable Highlight and Dimming
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    if (map.getLayer('cables-selected')) {
      map.setFilter('cables-selected', ['==', ['get', 'id'], selectedCableId || '']);
    }

    if (map.getLayer('cables-line')) {
      map.setPaintProperty('cables-line', 'line-opacity', selectedCableId ? 0.2 : 0.8);
      map.setPaintProperty('cables-line', 'line-width', selectedCableId ? 1.0 : 1.4);
    }

    if (map.getLayer('cables-glow')) {
      map.setPaintProperty('cables-glow', 'line-opacity', selectedCableId ? 0.05 : 0.25);
    }
  }, [selectedCableId]);

  // Sync Layer Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    const toggle = (id: string, visible: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    };

    toggle('cables-glow', layerVisibility.cables);
    toggle('cables-line', layerVisibility.cables);
    toggle('cables-selected', layerVisibility.cables);
    toggle('landing-points-glow', layerVisibility.landingPoints);
    toggle('landing-points-circle', layerVisibility.landingPoints);
    toggle('aws-regions-halo', layerVisibility.awsRegions);
    toggle('aws-regions-core', layerVisibility.awsRegions);
    toggle('earthquakes-shockwave', layerVisibility.earthquakes);
    toggle('earthquakes-core', layerVisibility.earthquakes);
    toggle('proximity-vectors-line', layerVisibility.earthquakes && layerVisibility.cables);
  }, [layerVisibility]);

  // Handle Camera Movement on Chokepoint or Story Step
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    if (storyStep) {
      map.flyTo({
        center: storyStep.center,
        zoom: storyStep.zoom,
        pitch: storyStep.pitch,
        bearing: storyStep.bearing,
        essential: true,
        duration: 2200,
      });
    } else if (activeChokepoint) {
      map.flyTo({
        center: activeChokepoint.center,
        zoom: activeChokepoint.zoom,
        pitch: activeChokepoint.pitch,
        bearing: activeChokepoint.bearing,
        essential: true,
        duration: 2000,
      });
    }
  }, [activeChokepoint, storyStep]);

  // Handle Camera Movement on Entity Selection (e.g. Exposure Alert)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current || !selectedEntity) return;

    if (selectedEntity.type === 'exposure_alert') {
      const [lng, lat] = selectedEntity.data.earthquake.geometry.coordinates;
      map.flyTo({
        center: [lng, lat],
        zoom: 7.2,
        pitch: 40,
        bearing: -15,
        essential: true,
        duration: 1800,
      });
    } else if (selectedEntity.type === 'aws_region') {
      map.flyTo({
        center: selectedEntity.data.coordinates,
        zoom: 6.5,
        pitch: 30,
        bearing: 0,
        essential: true,
        duration: 1600,
      });
    } else if (selectedEntity.type === 'landing_point') {
      const hubFeat = landingPointsData?.features.find((p) => p.properties.id === selectedEntity.data.id);
      if (hubFeat && hubFeat.geometry && hubFeat.geometry.coordinates) {
        const coords = hubFeat.geometry.coordinates;
        map.flyTo({
          center: [coords[0], coords[1]],
          zoom: 7,
          pitch: 35,
          duration: 1600,
        });
      }
    } else if (selectedEntity.type === 'cable') {
      const cableFeat = cablesData?.features.find(
        (c) => c.properties.id === selectedEntity.data.id || c.properties.name === selectedEntity.data.name
      );
      if (cableFeat && cableFeat.geometry) {
        const geom = cableFeat.geometry;
        const lineCoords =
          geom.type === 'MultiLineString'
            ? (geom.coordinates as number[][][])[0]
            : (geom.coordinates as number[][]);
        if (lineCoords && lineCoords.length > 0) {
          const mid = lineCoords[Math.floor(lineCoords.length / 2)];
          map.flyTo({
            center: [mid[0], mid[1]],
            zoom: 5,
            pitch: 30,
            duration: 1800,
          });
        }
      }
    }
  }, [selectedEntity]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
