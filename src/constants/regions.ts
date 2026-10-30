import type { RegionPreset } from '../types';

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: 'global',
    name: 'Global Overview',
    bounds: [-180, -70, 180, 80],
    center: [0, 20],
    zoom: 1.8,
  },
  {
    id: 'japan',
    name: 'Japan & Kuril Trench',
    bounds: [128.0, 30.0, 146.0, 46.0],
    center: [138.5, 36.8],
    zoom: 4.8,
  },
  {
    id: 'california',
    name: 'California (San Andreas)',
    bounds: [-125.0, 32.0, -114.0, 42.0],
    center: [-119.5, 36.5],
    zoom: 5.2,
  },
  {
    id: 'indonesia',
    name: 'Indonesia (Sunda Arc)',
    bounds: [94.0, -11.0, 141.0, 6.0],
    center: [118.0, -2.5],
    zoom: 4.2,
  },
  {
    id: 'chile',
    name: 'Chile & Peru Trench',
    bounds: [-76.0, -56.0, -66.0, -18.0],
    center: [-71.0, -35.0],
    zoom: 4.2,
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean & Aegean',
    bounds: [-10.0, 30.0, 38.0, 46.0],
    center: [18.0, 38.0],
    zoom: 4.2,
  },
  {
    id: 'alaska',
    name: 'Alaska & Aleutian Arc',
    bounds: [-180.0, 50.0, -130.0, 72.0],
    center: [-152.0, 61.0],
    zoom: 3.8,
  },
  {
    id: 'new_zealand',
    name: 'New Zealand',
    bounds: [165.0, -48.0, 179.0, -34.0],
    center: [173.0, -41.0],
    zoom: 4.8,
  },
  {
    id: 'hawaii',
    name: 'Hawaii Hotspot',
    bounds: [-161.0, 18.5, -154.0, 22.5],
    center: [-156.5, 20.5],
    zoom: 6.5,
  },
  {
    id: 'iceland',
    name: 'Iceland (Mid-Atlantic)',
    bounds: [-25.0, 63.0, -13.0, 67.0],
    center: [-18.5, 64.9],
    zoom: 5.8,
  },
];
