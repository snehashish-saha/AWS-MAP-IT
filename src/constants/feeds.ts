import type { FeedType } from '../types';

export interface FeedConfig {
  id: FeedType;
  label: string;
  description: string;
  url: string;
  refreshIntervalMs: number;
}

export const USGS_FEEDS: Record<FeedType, FeedConfig> = {
  '1h': {
    id: '1h',
    label: 'Past 1 Hour',
    description: 'Real-time seismic activity updated every minute',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    refreshIntervalMs: 60 * 1000,
  },
  '24h': {
    id: '24h',
    label: 'Past 24 Hours',
    description: 'Recommended default: all worldwide earthquakes recorded today',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    refreshIntervalMs: 60 * 1000,
  },
  '7d': {
    id: '7d',
    label: 'Past 7 Days',
    description: 'Regional exploration and weekly trend observation',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
    refreshIntervalMs: 5 * 60 * 1000,
  },
  '30d': {
    id: '30d',
    label: 'Past 30 Days',
    description: 'Monthly macro-seismic activity patterns (~10,000+ events)',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
    refreshIntervalMs: 15 * 60 * 1000,
  },
  '4.5_week': {
    id: '4.5_week',
    label: 'M4.5+ (7 Days)',
    description: 'Moderate to severe global earthquakes',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
    refreshIntervalMs: 5 * 60 * 1000,
  },
  'significant_week': {
    id: 'significant_week',
    label: 'Significant (7 Days)',
    description: 'High impact or widely felt events evaluated by USGS PAGER/DYFI',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson',
    refreshIntervalMs: 5 * 60 * 1000,
  },
};
