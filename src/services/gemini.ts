import type { MapIntent, EarthquakeFeature, LocationWeather } from '../types';
import { REGION_PRESETS } from '../constants/regions';

export interface CopilotContext {
  activeFeed: string;
  minMagnitude: number;
  filteredCount: number;
  totalCount: number;
  strongestEvent: EarthquakeFeature | null;
  selectedEvent: EarthquakeFeature | null;
  selectedLocationWeather: LocationWeather | null;
  selectedRegion: string;
}

const SYSTEM_PROMPT = `You are TerraPulse Copilot, a scientific AI assistant for a geospatial intelligence command center.
Your task is to interpret user natural-language questions and commands about earthquakes and atmospheric weather, and emit a strictly structured JSON response.

You MUST respond with ONLY a valid JSON object conforming to this schema (no markdown fences, no extra text):
{
  "action": "filter_earthquakes" | "focus_region" | "show_top_events" | "select_layer" | "inspect_weather" | "explain_selected_event" | "clear_filters",
  "timeRange": "1h" | "24h" | "7d" | "30d" (optional),
  "minMagnitude": number (optional, e.g. 4.0),
  "region": string (optional, e.g. "japan", "california", "indonesia", "chile", "mediterranean", "alaska", "new_zealand", "hawaii", "iceland", "global"),
  "topN": number (optional, e.g. 5),
  "layer": "earthquakes" | "weather" | "both" (optional),
  "explanation": "A concise 1-2 sentence evidence-based scientific answer. Do NOT hallucinate numbers. Do NOT predict future earthquakes. State 'not available in retrieved data' if unknown."
}

Available supported regions:
global, japan, california, indonesia, chile, mediterranean, alaska, new_zealand, hawaii, iceland.

Rules:
1. Never invent or hallucinate earthquake counts or magnitudes; the client application computes all stats deterministically.
2. Never claim that weather causes earthquakes or predict earthquake timing.
3. If the user asks about the selected event, reference the provided selected event data.
4. If the user asks about weather, reference the provided weather data.
5. Keep explanations objective, scientific, and concise.`;

export async function askGeminiCopilot(
  userQuery: string,
  context: CopilotContext,
  apiKey?: string,
  proxyUrl?: string
): Promise<{ intent: MapIntent; rawResponse: string }> {
  if (apiKey || proxyUrl) {
    try {
      const url = proxyUrl
        ? proxyUrl
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const compactContext = {
        activeFeed: context.activeFeed,
        minMagFilter: context.minMagnitude,
        currentRecordCount: context.filteredCount,
        maxMagRecorded: context.strongestEvent?.properties.mag ?? null,
        selectedEvent: context.selectedEvent
          ? {
              place: context.selectedEvent.properties.place,
              mag: context.selectedEvent.properties.mag,
              depth: context.selectedEvent.geometry.coordinates[2],
              time: new Date(context.selectedEvent.properties.time).toISOString(),
              url: context.selectedEvent.properties.url,
            }
          : null,
        selectedWeather: context.selectedLocationWeather
          ? {
              temp: `${context.selectedLocationWeather.current.temperature}°C`,
              wind: `${context.selectedLocationWeather.current.wind_speed} km/h`,
              humidity: `${context.selectedLocationWeather.current.relative_humidity}%`,
            }
          : null,
      };

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nCurrent App Context: ${JSON.stringify(compactContext)}\n\nUser Question: ${userQuery}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = validateAndSanitizeIntent(candidateText);
          return { intent: parsed, rawResponse: candidateText };
        }
      } else if (res.status === 429) {
        console.warn('Gemini quota reached (429). Falling back to deterministic local interpreter.');
      }
    } catch (err) {
      console.warn('Gemini network/proxy error. Falling back to deterministic local interpreter.', err);
    }
  }

  // Resilient deterministic offline fallback parser
  const fallbackIntent = parseQueryDeterministically(userQuery, context);
  return {
    intent: fallbackIntent,
    rawResponse: JSON.stringify(fallbackIntent),
  };
}

function validateAndSanitizeIntent(rawJson: string): MapIntent {
  try {
    const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const obj = JSON.parse(cleaned);

    const validActions = [
      'filter_earthquakes',
      'focus_region',
      'show_top_events',
      'select_layer',
      'inspect_weather',
      'explain_selected_event',
      'clear_filters',
    ];

    const action = validActions.includes(obj.action) ? obj.action : 'filter_earthquakes';

    let timeRange = obj.timeRange;
    if (timeRange && !['1h', '24h', '7d', '30d'].includes(timeRange)) {
      timeRange = undefined;
    }

    let minMagnitude = typeof obj.minMagnitude === 'number' ? Math.max(0, Math.min(9.5, obj.minMagnitude)) : undefined;
    let topN = typeof obj.topN === 'number' ? Math.max(1, Math.min(25, obj.topN)) : undefined;

    let region = typeof obj.region === 'string' ? obj.region.toLowerCase().trim() : undefined;
    const knownRegion = REGION_PRESETS.find(r => r.id === region || r.name.toLowerCase().includes(region || ''));
    if (knownRegion) {
      region = knownRegion.id;
    }

    let layer = obj.layer;
    if (layer && !['earthquakes', 'weather', 'both'].includes(layer)) {
      layer = undefined;
    }

    return {
      action,
      timeRange,
      minMagnitude,
      region,
      topN,
      layer,
      explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
    };
  } catch (_err) {
    return {
      action: 'filter_earthquakes',
      explanation: 'Parsed query using local deterministic filters.',
    };
  }
}

// Deterministic intent parser for instant, offline, and quota-exhausted resilience
export function parseQueryDeterministically(query: string, context: CopilotContext): MapIntent {
  const q = query.toLowerCase();

  // Reset or clear filters
  if (q.includes('reset') || q.includes('clear') || q.includes('show all') || q.includes('default')) {
    return {
      action: 'clear_filters',
      timeRange: '24h',
      minMagnitude: 0,
      region: 'global',
      explanation: 'Resetting all seismic filters to the 24-hour global overview.',
    };
  }

  // Top events
  if (q.includes('top') || q.includes('strongest') || q.includes('biggest') || q.includes('largest')) {
    const match = q.match(/top\s*(\d+)/) || q.match(/(\d+)\s*(strongest|biggest|largest)/);
    const n = match ? parseInt(match[1], 10) : 5;
    return {
      action: 'show_top_events',
      topN: Math.min(n, 20),
      explanation: `Highlighting the ${Math.min(n, 20)} strongest seismic events in current records.`,
    };
  }

  // Weather query
  if (q.includes('weather') || q.includes('temperature') || q.includes('rain') || q.includes('forecast')) {
    return {
      action: 'inspect_weather',
      layer: 'weather',
      explanation: context.selectedLocationWeather
        ? `Atmospheric reading: ${context.selectedLocationWeather.current.temperature}°C, wind ${context.selectedLocationWeather.current.wind_speed} km/h (Open-Meteo CC BY 4.0).`
        : 'Displaying atmospheric weather layer. Click any point or earthquake epicenter to inspect forecasts.',
    };
  }

  // Explain selected event
  if (q.includes('explain') || q.includes('this event') || q.includes('selected event') || q.includes('details')) {
    if (context.selectedEvent) {
      const p = context.selectedEvent.properties;
      const [lng, lat, depth] = context.selectedEvent.geometry.coordinates;
      return {
        action: 'explain_selected_event',
        explanation: `M${p.mag ?? 'N/A'} earthquake near ${p.place}. Focal depth: ${depth.toFixed(1)} km at [${lat.toFixed(2)}°, ${lng.toFixed(2)}°]. Reported by USGS.`,
      };
    } else {
      return {
        action: 'explain_selected_event',
        explanation: 'No specific earthquake is currently selected. Select an event marker on the map to inspect its focal depth and USGS record.',
      };
    }
  }

  // Regional navigation & filtering
  let detectedRegion: string | undefined = undefined;
  for (const preset of REGION_PRESETS) {
    if (q.includes(preset.id) || q.includes(preset.name.toLowerCase()) || (preset.id === 'japan' && q.includes('tokyo')) || (preset.id === 'california' && (q.includes('san francisco') || q.includes('los angeles')))) {
      detectedRegion = preset.id;
      break;
    }
  }

  // Time window detection
  let timeRange: '1h' | '24h' | '7d' | '30d' | undefined = undefined;
  if (q.includes('hour') || q.includes('1h')) timeRange = '1h';
  else if (q.includes('7 day') || q.includes('week') || q.includes('7d')) timeRange = '7d';
  else if (q.includes('30 day') || q.includes('month') || q.includes('30d')) timeRange = '30d';
  else if (q.includes('24 hour') || q.includes('day') || q.includes('today') || q.includes('24h')) timeRange = '24h';

  // Magnitude detection
  let minMagnitude: number | undefined = undefined;
  const magMatch = q.match(/m(\d+(\.\d+)?)\+?/) || q.match(/mag(?:nitude)?\s*(?:>=?|>|\+)?\s*(\d+(\.\d+)?)/) || q.match(/(\d+(\.\d+)?)\s*\+/);
  if (magMatch) {
    minMagnitude = parseFloat(magMatch[1]);
  }

  // If region detected without other filters
  if (detectedRegion && minMagnitude === undefined && timeRange === undefined) {
    return {
      action: 'focus_region',
      region: detectedRegion,
      explanation: `Navigating map camera to ${detectedRegion.toUpperCase()} seismic zone.`,
    };
  }

  return {
    action: 'filter_earthquakes',
    region: detectedRegion,
    timeRange,
    minMagnitude,
    explanation: `Applying seismic filters: ${timeRange ? `Time window: ${timeRange}. ` : ''}${minMagnitude !== undefined ? `Min Magnitude: M${minMagnitude}. ` : ''}${detectedRegion ? `Region: ${detectedRegion}.` : ''}`,
  };
}
