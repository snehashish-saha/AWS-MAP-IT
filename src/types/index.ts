export type EarthquakeProperties = {
  mag: number | null;
  place: string | null;
  time: number;
  updated: number;
  tz?: number | null;
  url: string;
  detail?: string;
  felt?: number | null;
  cdi?: number | null;
  mmi?: number | null;
  alert?: 'green' | 'yellow' | 'orange' | 'red' | null;
  status?: string;
  tsunami?: number | null;
  sig?: number;
  net?: string;
  code?: string;
  ids?: string;
  sources?: string;
  types?: string;
  nst?: number | null;
  dmin?: number | null;
  rms?: number | null;
  gap?: number | null;
  magType?: string | null;
  type?: string;
  title?: string;
};

export type EarthquakeFeature = {
  type: 'Feature';
  id: string | number;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth_km]
  };
  properties: EarthquakeProperties;
};

export type EarthquakeFeatureCollection = {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
  bbox?: number[];
};

export type FeedType = '1h' | '24h' | '7d' | '30d' | '4.5_week' | 'significant_week';

export type RegionPreset = {
  id: string;
  name: string;
  bounds: [number, number, number, number];
  center: [number, number];
  zoom: number;
};

export type TelemetryMetrics = {
  totalCount: number;
  filteredCount: number;
  maxMagnitude: number;
  strongestEvent: EarthquakeFeature | null;
  averageMagnitude: number;
  shallowCount: number;
  intermediateCount: number;
  deepCount: number;
  tsunamiCount: number;
  magnitudeBuckets: { range: string; count: number; color: string }[];
};

// --- Subsea Cable Types ---
export type SubseaCableProperties = {
  id: string;
  name: string;
  color?: string;
  feature_id?: string;
  coordinates?: [number, number];
  length?: string;
  owners?: string;
  rfs?: string;
  rfs_year?: number;
  is_planned?: boolean;
  landing_points?: Array<{
    id: string;
    name: string;
    country?: string;
  }>;
};

export type SubseaCableFeature = {
  type: 'Feature';
  id?: string | number;
  properties: SubseaCableProperties;
  geometry: {
    type: 'MultiLineString' | 'LineString';
    coordinates: number[][][] | number[][];
  };
};

export type SubseaCableCollection = {
  type: 'FeatureCollection';
  features: SubseaCableFeature[];
};

// --- Landing Point Types ---
export type LandingPointProperties = {
  id: string;
  name: string;
  is_tbd?: boolean;
  cables?: Array<{ id: string; name: string }>;
};

export type LandingPointFeature = {
  type: 'Feature';
  id?: string | number;
  properties: LandingPointProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type LandingPointCollection = {
  type: 'FeatureCollection';
  features: LandingPointFeature[];
};

// --- AWS Region Types ---
export type AWSRegion = {
  id: string;
  name: string;
  code: string; // e.g. 'us-east-1'
  coordinates: [number, number]; // [lng, lat]
  continent: string;
  launchYear: number;
  description: string;
};

// --- Chokepoint Preset ---
export type ChokepointPreset = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  cableCountApprox: number;
  significance: string;
};

// --- Seismic Exposure Alert ---
export type ExposureAlert = {
  id: string;
  earthquake: EarthquakeFeature;
  nearestCable: {
    id: string;
    name: string;
  };
  distanceKm: number;
  proximityCategory: 'critical' | 'warning' | 'advisory'; // <25km, 25-50km, 50-100km
  timestamp: number;
  lineGeometry?: [number, number][]; // Line from epicenter to closest point on cable
};

// --- Selected Entity Union ---
export type SelectedEntity =
  | { type: 'cable'; data: SubseaCableProperties }
  | { type: 'landing_point'; data: LandingPointProperties }
  | { type: 'aws_region'; data: AWSRegion }
  | { type: 'exposure_alert'; data: ExposureAlert }
  | { type: 'earthquake'; data: EarthquakeFeature };

// --- Story Mode Step ---
export type StoryStep = {
  id: string;
  chapter: number;
  title: string;
  subtitle: string;
  narrative: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  highlightType?: 'cable' | 'chokepoint' | 'aws' | 'alert';
  highlightId?: string;
};

// --- Layer Visibility State ---
export type LayerVisibility = {
  cables: boolean;
  landingPoints: boolean;
  awsRegions: boolean;
  earthquakes: boolean;
  alertsOnly: boolean;
};

// --- Copilot Intent ---
export type MapIntent = {
  action:
    | 'focus_chokepoint'
    | 'filter_cables'
    | 'show_alerts'
    | 'focus_aws_region'
    | 'select_cable'
    | 'reset_view';
  targetId?: string;
  query?: string;
  minMagnitude?: number;
  explanation: string;
};
