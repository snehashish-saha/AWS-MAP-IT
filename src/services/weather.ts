import type { LocationWeather } from '../types';

const weatherCache = new Map<string, { data: LocationWeather; timestamp: number }>();
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache

// WMO Weather interpretation codes (WW)
export function getWeatherDescription(code: number): { label: string; icon: string } {
  switch (code) {
    case 0:
      return { label: 'Clear sky', icon: 'Sun' };
    case 1:
      return { label: 'Mainly clear', icon: 'SunMedium' };
    case 2:
      return { label: 'Partly cloudy', icon: 'CloudSun' };
    case 3:
      return { label: 'Overcast', icon: 'Cloud' };
    case 45:
    case 48:
      return { label: 'Fog / Depositing rime fog', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle: light to dense', icon: 'CloudDrizzle' };
    case 56:
    case 57:
      return { label: 'Freezing drizzle', icon: 'CloudSnow' };
    case 61:
    case 63:
    case 65:
      return { label: 'Rain: slight to heavy', icon: 'CloudRain' };
    case 66:
    case 67:
      return { label: 'Freezing rain', icon: 'CloudSnow' };
    case 71:
    case 73:
    case 75:
      return { label: 'Snow fall: slight to heavy', icon: 'Snowflake' };
    case 77:
      return { label: 'Snow grains', icon: 'Snowflake' };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain showers: slight to violent', icon: 'CloudRain' };
    case 85:
    case 86:
      return { label: 'Snow showers: slight to heavy', icon: 'CloudSnow' };
    case 95:
      return { label: 'Thunderstorm: slight or moderate', icon: 'CloudLightning' };
    case 96:
    case 99:
      return { label: 'Thunderstorm with heavy hail', icon: 'CloudLightning' };
    default:
      return { label: 'Variable atmospheric conditions', icon: 'Cloud' };
  }
}

export async function fetchLocationWeather(
  lat: number,
  lng: number,
  locationName?: string,
  signal?: AbortSignal
): Promise<LocationWeather> {
  const roundedLat = Number(lat.toFixed(2));
  const roundedLng = Number(lng.toFixed(2));
  const cacheKey = `${roundedLat},${roundedLng}`;

  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS)) {
    return { ...cached.data, locationName: locationName || cached.data.locationName };
  }

  const params = new URLSearchParams({
    latitude: roundedLat.toString(),
    longitude: roundedLng.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'showers',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'precipitation',
      'relative_humidity_2m',
      'wind_speed_10m',
      'weather_code',
    ].join(','),
    forecast_days: '7',
    timezone: 'auto',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo API response ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();

  const weatherData: LocationWeather = {
    latitude: json.latitude ?? roundedLat,
    longitude: json.longitude ?? roundedLng,
    locationName,
    timezone: json.timezone ?? 'UTC',
    elevation: json.elevation ?? 0,
    current: {
      time: json.current?.time ?? new Date().toISOString(),
      temperature: json.current?.temperature_2m ?? 0,
      apparent_temperature: json.current?.apparent_temperature ?? 0,
      relative_humidity: json.current?.relative_humidity_2m ?? 0,
      precipitation: json.current?.precipitation ?? 0,
      weather_code: json.current?.weather_code ?? 0,
      cloud_cover: json.current?.cloud_cover ?? 0,
      wind_speed: json.current?.wind_speed_10m ?? 0,
      wind_direction: json.current?.wind_direction_10m ?? 0,
      wind_gusts: json.current?.wind_gusts_10m ?? 0,
    },
    hourly: {
      times: json.hourly?.time?.slice(0, 24) ?? [],
      temperatures: json.hourly?.temperature_2m?.slice(0, 24) ?? [],
      precipitation_probabilities: json.hourly?.precipitation_probability?.slice(0, 24) ?? [],
      precipitations: json.hourly?.precipitation?.slice(0, 24) ?? [],
      weather_codes: json.hourly?.weather_code?.slice(0, 24) ?? [],
      wind_speeds: json.hourly?.wind_speed_10m?.slice(0, 24) ?? [],
    },
    fetchedAt: Date.now(),
  };

  weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
  return weatherData;
}
