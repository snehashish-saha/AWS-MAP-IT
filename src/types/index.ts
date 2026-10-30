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

export type LayerMode = 'earthquakes' | 'weather' | 'both';

export type RegionPreset = {
  id: string;
  name: string;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  center: [number, number];
  zoom: number;
};

export type FilterState = {
  feed: FeedType;
  minMagnitude: number;
  maxMagnitude: number;
  searchQuery: string;
  selectedRegion: string; // 'global' or region id
  layerMode: LayerMode;
};

export type TelemetryMetrics = {
  totalCount: number;
  filteredCount: number;
  maxMagnitude: number;
  strongestEvent: EarthquakeFeature | null;
  averageMagnitude: number;
  shallowCount: number; // depth <= 70km
  intermediateCount: number; // 70 < depth <= 300km
  deepCount: number; // depth > 300km
  tsunamiCount: number;
  magnitudeBuckets: { range: string; count: number; color: string }[];
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed: number;
  wind_direction: number;
  wind_gusts?: number;
};

export type HourlyForecast = {
  times: string[];
  temperatures: number[];
  precipitation_probabilities: number[];
  precipitations: number[];
  weather_codes: number[];
  wind_speeds: number[];
};

export type LocationWeather = {
  latitude: number;
  longitude: number;
  locationName?: string;
  timezone: string;
  elevation: number;
  current: CurrentWeather;
  hourly: HourlyForecast;
  fetchedAt: number;
};

export type MapIntent = {
  action:
    | 'filter_earthquakes'
    | 'focus_region'
    | 'show_top_events'
    | 'select_layer'
    | 'inspect_weather'
    | 'explain_selected_event'
    | 'clear_filters';
  timeRange?: '1h' | '24h' | '7d' | '30d';
  minMagnitude?: number;
  region?: string;
  topN?: number;
  layer?: LayerMode;
  explanation?: string;
  suggestedCoordinates?: [number, number];
};

export type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  intent?: MapIntent;
  evidence?: {
    matchedEventsCount?: number;
    strongestMag?: number;
    targetRegion?: string;
  };
};
