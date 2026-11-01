import type { EarthquakeFeature, EarthquakeFeatureCollection, FeedType, TelemetryMetrics } from '../types';
import { USGS_FEEDS } from '../constants/feeds';

// Short in-memory cache to prevent excessive requests
const feedCache = new Map<string, { data: EarthquakeFeatureCollection; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<EarthquakeFeatureCollection>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in-memory cache

export async function fetchEarthquakeFeed(feedType: FeedType, signal?: AbortSignal): Promise<EarthquakeFeatureCollection> {
  const config = USGS_FEEDS[feedType] || USGS_FEEDS['24h'];
  const cacheKey = config.id;
  
  const cached = feedCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // Deduplicate in-flight requests to eliminate network thrashing
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    let rawData: EarthquakeFeatureCollection;

    try {
      const response = await fetch(config.url, { signal });
      if (!response.ok) {
        throw new Error(`USGS feed error: ${response.status} ${response.statusText}`);
      }
      rawData = await response.json();
    } catch (netErr) {
      console.warn(`Primary USGS feed failed (${config.id}). Attempting snapshot fixture fallback...`, netErr);
      const fallbackRes = await fetch('/data/usgs_snapshot.geojson', { signal });
      if (!fallbackRes.ok) {
        throw netErr;
      }
      rawData = await fallbackRes.json();
    }
    
    // Validate and deduplicate features
    const seenIds = new Set<string | number>();
    const validFeatures: EarthquakeFeature[] = [];

    for (const feature of rawData.features) {
      if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) {
        continue;
      }

      const [lng, lat, depth] = feature.geometry.coordinates;
      // Validate coordinate boundaries
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
        continue;
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        continue;
      }

      const id = feature.id ?? `${lat},${lng},${feature.properties?.time}`;
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);

      // Sanitize properties: ensure mag is number or null, not NaN or undefined
      const rawMag = feature.properties?.mag;
      const mag = (typeof rawMag === 'number' && !isNaN(rawMag)) ? rawMag : null;

      validFeatures.push({
        ...feature,
        id,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat, typeof depth === 'number' && !isNaN(depth) ? depth : 0],
        },
        properties: {
          ...feature.properties,
          mag,
          place: feature.properties?.place || 'Unspecified location',
          time: feature.properties?.time || Date.now(),
          updated: feature.properties?.updated || Date.now(),
          url: feature.properties?.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
        },
      });
    }

    const cleanedData: EarthquakeFeatureCollection = {
      ...rawData,
      features: validFeatures,
    };

    feedCache.set(cacheKey, { data: cleanedData, timestamp: Date.now() });
    return cleanedData;
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function filterEarthquakes(
  features: EarthquakeFeature[],
  minMagnitude: number,
  searchQuery: string,
  bounds?: [number, number, number, number] | null
): EarthquakeFeature[] {
  const query = searchQuery.trim().toLowerCase();

  return features.filter((feat) => {
    const mag = feat.properties.mag;
    
    // If minMagnitude is > 0, exclude missing mag or smaller mag
    if (minMagnitude > 0) {
      if (mag === null || mag < minMagnitude) {
        return false;
      }
    }

    // Text search in place or magType
    if (query) {
      const placeMatch = feat.properties.place?.toLowerCase().includes(query);
      const idMatch = String(feat.id).toLowerCase().includes(query);
      if (!placeMatch && !idMatch) {
        return false;
      }
    }

    // Spatial bounding box filter [minLng, minLat, maxLng, maxLat]
    if (bounds) {
      const [minLng, minLat, maxLng, maxLat] = bounds;
      const [lng, lat] = feat.geometry.coordinates;

      if (lat < minLat || lat > maxLat) {
        return false;
      }

      // Handle antimeridian crossing if minLng > maxLng
      if (minLng <= maxLng) {
        if (lng < minLng || lng > maxLng) {
          return false;
        }
      } else {
        // Crosses the 180th meridian
        if (lng < minLng && lng > maxLng) {
          return false;
        }
      }
    }

    return true;
  });
}

export function computeTelemetryMetrics(
  totalCount: number,
  filteredFeatures: EarthquakeFeature[]
): TelemetryMetrics {
  const filteredCount = filteredFeatures.length;
  
  if (filteredCount === 0) {
    return {
      totalCount,
      filteredCount: 0,
      maxMagnitude: 0,
      strongestEvent: null,
      averageMagnitude: 0,
      shallowCount: 0,
      intermediateCount: 0,
      deepCount: 0,
      tsunamiCount: 0,
      magnitudeBuckets: [
        { range: '< 2.5', count: 0, color: '#62E8D0' },
        { range: '2.5 - 4.5', count: 0, color: '#FFB45C' },
        { range: '4.5 - 6.0', count: 0, color: '#FF8866' },
        { range: '6.0+', count: 0, color: '#FF6D6D' },
      ],
    };
  }

  let sumMag = 0;
  let validMagCount = 0;
  let maxMag = -Infinity;
  let strongestEvent: EarthquakeFeature | null = null;
  let shallowCount = 0;
  let intermediateCount = 0;
  let deepCount = 0;
  let tsunamiCount = 0;

  let b1 = 0; // < 2.5
  let b2 = 0; // 2.5 - 4.5
  let b3 = 0; // 4.5 - 6.0
  let b4 = 0; // 6.0+

  for (const feat of filteredFeatures) {
    const mag = feat.properties.mag;
    const depth = feat.geometry.coordinates[2];

    if (mag !== null && !isNaN(mag)) {
      sumMag += mag;
      validMagCount++;
      if (mag > maxMag) {
        maxMag = mag;
        strongestEvent = feat;
      }

      if (mag < 2.5) b1++;
      else if (mag < 4.5) b2++;
      else if (mag < 6.0) b3++;
      else b4++;
    }

    if (depth <= 70) shallowCount++;
    else if (depth <= 300) intermediateCount++;
    else deepCount++;

    if (feat.properties.tsunami === 1) {
      tsunamiCount++;
    }
  }

  const averageMagnitude = validMagCount > 0 ? Number((sumMag / validMagCount).toFixed(2)) : 0;
  const recordedMaxMag = maxMag > -Infinity ? Number(maxMag.toFixed(1)) : 0;

  return {
    totalCount,
    filteredCount,
    maxMagnitude: recordedMaxMag,
    strongestEvent,
    averageMagnitude,
    shallowCount,
    intermediateCount,
    deepCount,
    tsunamiCount,
    magnitudeBuckets: [
      { range: '< 2.5', count: b1, color: '#62E8D0' },
      { range: '2.5 - 4.5', count: b2, color: '#FFB45C' },
      { range: '4.5 - 6.0', count: b3, color: '#FF8866' },
      { range: '6.0+', count: b4, color: '#FF6D6D' },
    ],
  };
}
