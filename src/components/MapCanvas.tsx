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
  minMagnitude?: number;
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
  minMagnitude = 4.0,
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

  const earthquakesRef = useRef(earthquakes);
  earthquakesRef.current = earthquakes;
  (window as any).__earthquakes = earthquakes;

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  (window as any).__alerts = alerts;

  const onSelectEntityRef = useRef(onSelectEntity);
  onSelectEntityRef.current = onSelectEntity;

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
            id: eq.id,
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
    (window as any).__mapInstance = map;

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

        // Transparent generous hitbox layer (16-24px) for effortless mouse targeting & clicking
        map.addLayer({
          id: 'cables-hitbox',
          type: 'line',
          source: 'subsea-cables',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              1.5, 14,
              5, 18,
              10, 24
            ],
            'line-opacity': 0.001,
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
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              2, 1.5,
              5, 4.0,
              9, 6.5
            ],
            'circle-color': '#94A3B8',
            'circle-opacity': [
              'interpolate', ['linear'], ['zoom'],
              2, 0.0,
              4, 0.15,
              7, 0.35
            ],
            'circle-blur': 1,
          },
        });

        map.addLayer({
          id: 'landing-points-circle',
          type: 'circle',
          source: 'landing-points',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              2, 0.8,
              4, 1.8,
              7, 3.0,
              11, 4.5
            ],
            'circle-color': '#CBD5E1',
            'circle-opacity': [
              'interpolate', ['linear'], ['zoom'],
              2, 0.15,
              3.5, 0.45,
              6, 0.95
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#0F172A',
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
          id: 'aws-regions-core',
          type: 'circle',
          source: 'aws-regions',
          paint: {
            'circle-radius': 4.0,
            'circle-color': '#A855F7',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#FFFFFF',
            'circle-opacity': 1.0,
          },
        });
      }

      // 5. Earthquakes Source & Layer
      if (!map.getSource('earthquakes')) {
        map.addSource('earthquakes', {
          type: 'geojson',
          data: earthquakesGeoJSONRef.current as any,
          promoteId: 'id',
        });

        // Shockwave aura ONLY on active cable exposure alerts
        map.addLayer({
          id: 'earthquakes-shockwave',
          type: 'circle',
          source: 'earthquakes',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'mag'], 2],
              2, 8,
              5, 18,
              8, 36
            ],
            'circle-color': '#FFB020',
            'circle-opacity': [
              'case',
              ['==', ['get', 'isAlert'], true],
              0.4,
              0
            ],
            'circle-blur': 0.4,
          },
        });

        // Earthquake Core: Vivid amber for coastal/cable alerts; quiet slate for inland quakes
        map.addLayer({
          id: 'earthquakes-core',
          type: 'circle',
          source: 'earthquakes',
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'isAlert'], true],
              [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'mag'], 2],
                2, 4.0,
                5, 7.5,
                8, 12.0
              ],
              2.5 // Quiet dot for non-alert/inland tremors
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'isAlert'], true],
              '#FFB020', // Alert: Vivid Amber
              '#64748B'  // Inland/Non-alert: Quiet slate gray
            ],
            'circle-stroke-width': [
              'case',
              ['==', ['get', 'isAlert'], true],
              2.0,
              0.5
            ],
            'circle-stroke-color': [
              'case',
              ['==', ['get', 'isAlert'], true],
              '#FFFFFF',
              '#0F172A'
            ],
            'circle-opacity': [
              'case',
              ['==', ['get', 'isAlert'], true],
              1.0,
              0.4
            ],
          },
        });

        // Generous transparent circular hitbox (22px) for effortless clicking on quake points
        map.addLayer({
          id: 'earthquakes-hitbox',
          type: 'circle',
          source: 'earthquakes',
          paint: {
            'circle-radius': 22,
            'circle-color': '#FFFFFF',
            'circle-opacity': 0.001,
          },
        });
      }

      setupMapInteractions(map);
    } catch (err) {
      console.error('Error in initDataLayers:', err);
    }
  };

  const setupMapInteractions = (map: maplibregl.Map) => {
    // Click on Cable (bound to both generous hitbox and visual line for 100% reliable clicks)
    const handleCableClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      onSelectEntityRef.current({
        type: 'cable',
        data: {
          id: props.id,
          name: props.name,
          length: props.length,
          owners: props.owners,
          suppliers: props.suppliers,
          rfs: props.rfs,
          rfs_year: props.rfs_year ? Number(props.rfs_year) : undefined,
          url: props.url,
          landing_points: props.landing_points,
        },
      });
    };

    map.on('click', 'cables-hitbox', handleCableClick);
    map.on('click', 'cables-line', handleCableClick);

    // Click on Landing Point
    map.on('click', 'landing-points-circle', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      onSelectEntityRef.current({
        type: 'landing_point',
        data: {
          id: props.id,
          name: props.name,
        },
      });
    });

    // Click on AWS Region
    map.on('click', 'aws-regions-core', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      onSelectEntityRef.current({
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

    // Click on Earthquake or Proximity Vector
    const handleQuakeClick = (e: maplibregl.MapLayerMouseEvent | { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const qId = feat.id || (feat.properties as any)?.id;
      const currentQuakes = earthquakesRef.current;
      const currentAlerts = alertsRef.current;

      // 1. Direct match on active exposure alert
      const alertMatch = currentAlerts.find(
        (a) =>
          a.earthquake.id === qId ||
          String(a.earthquake.id) === String(qId) ||
          a.id === qId ||
          String(a.id) === String(qId)
      );

      if (alertMatch) {
        onSelectEntityRef.current({
          type: 'exposure_alert',
          data: alertMatch,
        });
        return;
      }

      // 2. Clicked on proximity vector line
      if (feat.properties?.cableName || feat.properties?.distanceKm) {
        const lineAlert = currentAlerts.find(
          (a) =>
            a.id === qId ||
            String(a.id) === String(qId) ||
            a.distanceKm === feat.properties?.distanceKm ||
            a.nearestCable.name === feat.properties?.cableName
        );
        if (lineAlert) {
          onSelectEntityRef.current({
            type: 'exposure_alert',
            data: lineAlert,
          });
          return;
        }
      }

      // 3. Match in latest earthquakes list
      const eqMatch = currentQuakes.find(
        (eq) => eq.id === qId || String(eq.id) === String(qId)
      );

      if (eqMatch) {
        onSelectEntityRef.current({
          type: 'earthquake',
          data: eqMatch,
        });
        return;
      }

      // 4. Reliable fallback from MapLibre feature data if point
      if (feat.geometry.type === 'Point') {
        const coords = feat.geometry.coordinates as [number, number];
        const props = (feat.properties || {}) as any;
        onSelectEntityRef.current({
          type: 'earthquake',
          data: {
            type: 'Feature',
            id: qId || `quake-${Date.now()}`,
            geometry: {
              type: 'Point',
              coordinates: [coords[0], coords[1], props.depth ?? 10],
            },
            properties: props,
          },
        });
      }
    };

    map.on('click', 'earthquakes-hitbox', handleQuakeClick as any);
    map.on('click', 'earthquakes-core', handleQuakeClick as any);
    map.on('click', 'earthquakes-shockwave', handleQuakeClick as any);
    map.on('click', 'proximity-vectors-line', handleQuakeClick as any);

    // Generous bounding-box map click (18px radius) guarantees instant capture even on fast or slightly off-center clicks
    map.on('click', (e) => {
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 18, e.point.y - 18],
        [e.point.x + 18, e.point.y + 18],
      ];

      const quakeFeatures = map.queryRenderedFeatures(bbox, {
        layers: [
          'earthquakes-hitbox',
          'earthquakes-core',
          'earthquakes-shockwave',
          'proximity-vectors-line',
        ].filter((id) => !!map.getLayer(id)),
      });

      if (quakeFeatures && quakeFeatures.length > 0) {
        handleQuakeClick({ ...e, features: quakeFeatures } as any);
        return;
      }

      const cableFeatures = map.queryRenderedFeatures(bbox, {
        layers: ['cables-hitbox', 'cables-line'].filter((id) => !!map.getLayer(id)),
      });

      if (cableFeatures && cableFeatures.length > 0) {
        handleCableClick({ ...e, features: cableFeatures } as any);
      }
    });

    // Unified cursor handling for all interactive elements
    map.on('mousemove', (e) => {
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 12, e.point.y - 12],
        [e.point.x + 12, e.point.y + 12],
      ];
      const interactiveFeatures = map.queryRenderedFeatures(bbox, {
        layers: [
          'earthquakes-hitbox',
          'earthquakes-core',
          'earthquakes-shockwave',
          'proximity-vectors-line',
          'cables-hitbox',
          'cables-line',
          'landing-points-circle',
          'aws-regions-core',
        ].filter((id) => !!map.getLayer(id)),
      });
      map.getCanvas().style.cursor = interactiveFeatures.length > 0 ? 'pointer' : '';
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

    toggle('cables-hitbox', layerVisibility.cables);
    toggle('cables-glow', layerVisibility.cables);
    toggle('cables-line', layerVisibility.cables);
    toggle('cables-selected', layerVisibility.cables);
    toggle('landing-points-glow', layerVisibility.landingPoints);
    toggle('landing-points-circle', layerVisibility.landingPoints);
    toggle('aws-regions-core', layerVisibility.awsRegions);
    toggle('earthquakes-hitbox', layerVisibility.earthquakes);
    toggle('earthquakes-shockwave', layerVisibility.earthquakes);
    toggle('earthquakes-core', layerVisibility.earthquakes);
    toggle('proximity-vectors-line', layerVisibility.earthquakes && layerVisibility.cables);
  }, [layerVisibility]);

  // Real-time GPU shader filter for magnitude & alerts-only (Instant 0ms, zero Web Worker serialization)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    const magVal = minMagnitude;
    const magExpr: any = ['>=', ['coalesce', ['get', 'mag'], 0], magVal];

    if (map.getLayer('earthquakes-hitbox')) {
      if (layerVisibility.alertsOnly) {
        map.setFilter('earthquakes-hitbox', ['all', ['==', ['get', 'isAlert'], true], magExpr] as any);
      } else {
        map.setFilter('earthquakes-hitbox', magExpr as any);
      }
    }

    if (map.getLayer('earthquakes-core')) {
      if (layerVisibility.alertsOnly) {
        map.setFilter('earthquakes-core', ['all', ['==', ['get', 'isAlert'], true], magExpr] as any);
      } else {
        map.setFilter('earthquakes-core', magExpr as any);
      }
    }

    if (map.getLayer('earthquakes-shockwave')) {
      map.setFilter('earthquakes-shockwave', ['all', ['==', ['get', 'isAlert'], true], magExpr] as any);
    }
  }, [minMagnitude, layerVisibility.alertsOnly]);

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
    } else if (selectedEntity.type === 'earthquake') {
      const [lng, lat] = selectedEntity.data.geometry.coordinates;
      map.flyTo({
        center: [lng, lat],
        zoom: 7.0,
        pitch: 35,
        bearing: -10,
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
