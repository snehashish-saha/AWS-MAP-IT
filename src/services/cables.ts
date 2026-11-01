import type {
  SubseaCableCollection,
  LandingPointCollection,
  SubseaCableFeature,
  LandingPointFeature,
} from '../types';

let cachedCables: SubseaCableCollection | null = null;
let cachedLandingPoints: LandingPointCollection | null = null;

export async function fetchSubseaCables(): Promise<SubseaCableCollection> {
  if (cachedCables) return cachedCables;
  try {
    const res = await fetch('/data/cables.geojson');
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching cables.geojson`);
    const data: SubseaCableCollection = await res.json();
    
    // Ensure every feature has a valid top-level id
    for (const f of data.features) {
      if (!f.id && f.properties?.id) {
        f.id = f.properties.id;
      }
    }

    cachedCables = data;
    return data;
  } catch (err) {
    console.error('Failed to load cables.geojson:', err);
    throw err;
  }
}

export async function fetchLandingPoints(): Promise<LandingPointCollection> {
  if (cachedLandingPoints) return cachedLandingPoints;
  try {
    const res = await fetch('/data/landing_points.geojson');
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching landing_points.geojson`);
    const data: LandingPointCollection = await res.json();

    // Ensure every landing point has a valid top-level id
    for (const f of data.features) {
      if (!f.id && f.properties?.id) {
        f.id = f.properties.id;
      }
    }

    cachedLandingPoints = data;
    return data;
  } catch (err) {
    console.error('Failed to load landing_points.geojson:', err);
    throw err;
  }
}

/**
 * Searches cables by name or landing location
 */
export function searchCables(
  cables: SubseaCableFeature[],
  query: string
): SubseaCableFeature[] {
  if (!query || !query.trim()) return cables;
  const q = query.toLowerCase().trim();
  return cables.filter((c) => {
    const nameMatch = c.properties.name?.toLowerCase().includes(q);
    const idMatch = c.properties.id?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });
}

/**
 * Filters landing points
 */
export function searchLandingPoints(
  landingPoints: LandingPointFeature[],
  query: string
): LandingPointFeature[] {
  if (!query || !query.trim()) return landingPoints;
  const q = query.toLowerCase().trim();
  return landingPoints.filter((lp) => {
    return lp.properties.name?.toLowerCase().includes(q);
  });
}
