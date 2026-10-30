import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  EarthquakeFeature,
  EarthquakeFeatureCollection,
  FeedType,
  LayerMode,
  LocationWeather,
  MapIntent,
  ChatMessage,
} from './types';
import { USGS_FEEDS } from './constants/feeds';
import { REGION_PRESETS } from './constants/regions';
import { fetchEarthquakeFeed, filterEarthquakes, computeTelemetryMetrics } from './services/usgs';
import { fetchLocationWeather } from './services/weather';
import { askGeminiCopilot, type CopilotContext } from './services/gemini';

import { TopBar } from './components/TopBar';
import { LeftRail } from './components/LeftRail';
import { MapCanvas } from './components/MapCanvas';
import { BottomTelemetryRail } from './components/BottomTelemetryRail';
import { CopilotDrawer } from './components/CopilotDrawer';
import { EventDetailPanel } from './components/EventDetailPanel';
import { WeatherDetailPanel } from './components/WeatherDetailPanel';
import { InfoModal } from './components/InfoModal';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  // Feed & Filter State
  const [activeFeed, setActiveFeed] = useState<FeedType>('24h');
  const [minMagnitude, setMinMagnitude] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('global');
  const [layerMode, setLayerMode] = useState<LayerMode>('both');

  // Raw & Processed Data State
  const [rawData, setRawData] = useState<EarthquakeFeatureCollection | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [_feedError, setFeedError] = useState<string | null>(null);

  // Selection & Details State
  const [selectedEvent, setSelectedEvent] = useState<EarthquakeFeature | null>(null);
  const [topNEvents, setTopNEvents] = useState<EarthquakeFeature[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<LocationWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [showWeatherDetail, setShowWeatherDetail] = useState<boolean>(false);

  // UI Drawer / Modal State
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Settings State (persisted in localStorage)
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('TERRAPULSE_GEMINI_KEY') || '');
  const [proxyUrl, setProxyUrl] = useState<string>(() => localStorage.getItem('TERRAPULSE_PROXY_URL') || '');

  // Copilot Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Welcome to TerraPulse Global Earth Intelligence. I am your geospatial copilot. Ask me to navigate tectonic boundaries, filter seismic intensity, or inspect atmospheric conditions.',
      timestamp: Date.now(),
    },
  ]);
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);

  // Load USGS Data Feed
  const loadFeed = useCallback(async (feedType: FeedType) => {
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const data = await fetchEarthquakeFeed(feedType);
      setRawData(data);
      setLastUpdated(Date.now());
    } catch (err: any) {
      console.error('Failed to load USGS feed:', err);
      setFeedError(err.message || 'Error contacting USGS feeds');
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(activeFeed);
  }, [activeFeed, loadFeed]);

  // Periodic feed refresh
  useEffect(() => {
    const config = USGS_FEEDS[activeFeed];
    const timer = setInterval(() => {
      loadFeed(activeFeed);
    }, config.refreshIntervalMs);

    return () => clearInterval(timer);
  }, [activeFeed, loadFeed]);

  // Compute Filtered Features
  const filteredFeatures = useMemo(() => {
    if (!rawData) return [];

    let bounds: [number, number, number, number] | null = null;
    if (selectedRegion !== 'global') {
      const preset = REGION_PRESETS.find((r) => r.id === selectedRegion);
      if (preset) {
        bounds = preset.bounds;
      }
    }

    return filterEarthquakes(rawData.features, minMagnitude, searchQuery, bounds);
  }, [rawData, minMagnitude, searchQuery, selectedRegion]);

  // Deterministic Telemetry Metrics
  const metrics = useMemo(() => {
    const total = rawData?.features?.length || 0;
    return computeTelemetryMetrics(total, filteredFeatures);
  }, [rawData, filteredFeatures]);

  // Fetch Weather at Coordinate
  const handleMapClickCoordinates = useCallback(async (lat: number, lng: number, locationName?: string) => {
    setIsLoadingWeather(true);
    try {
      const weather = await fetchLocationWeather(lat, lng, locationName);
      setSelectedWeather(weather);
      setShowWeatherDetail(true);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Handle Event Selection
  const handleSelectEvent = useCallback((event: EarthquakeFeature | null) => {
    setSelectedEvent(event);
    if (event) {
      const [lng, lat] = event.geometry.coordinates;
      handleMapClickCoordinates(lat, lng, event.properties.place || undefined);
    }
  }, [handleMapClickCoordinates]);

  // Reset Filters to default
  const handleResetFilters = useCallback(() => {
    setActiveFeed('24h');
    setMinMagnitude(0);
    setSearchQuery('');
    setSelectedRegion('global');
    setTopNEvents([]);
    setSelectedEvent(null);
  }, []);

  // Execute Map Intent returned by Gemini Copilot
  const handleApplyIntent = useCallback((intent: MapIntent) => {
    if (intent.timeRange) {
      setActiveFeed(intent.timeRange);
    }
    if (intent.minMagnitude !== undefined) {
      setMinMagnitude(intent.minMagnitude);
    }
    if (intent.region) {
      setSelectedRegion(intent.region);
    }
    if (intent.layer) {
      setLayerMode(intent.layer);
    }

    if (intent.action === 'clear_filters') {
      handleResetFilters();
    } else if (intent.action === 'show_top_events') {
      const n = intent.topN || 5;
      const sorted = [...filteredFeatures]
        .filter((f) => f.properties.mag !== null)
        .sort((a, b) => (b.properties.mag ?? 0) - (a.properties.mag ?? 0))
        .slice(0, n);
      setTopNEvents(sorted);
      if (sorted[0]) {
        setSelectedEvent(sorted[0]);
      }
    } else if (intent.action === 'inspect_weather') {
      if (selectedEvent) {
        const [lng, lat] = selectedEvent.geometry.coordinates;
        handleMapClickCoordinates(lat, lng, selectedEvent.properties.place || undefined);
      } else if (selectedWeather) {
        setShowWeatherDetail(true);
      }
    }
  }, [filteredFeatures, handleResetFilters, selectedEvent, selectedWeather, handleMapClickCoordinates]);

  // Send Message to Copilot
  const handleSendMessage = useCallback(async (query: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsCopilotLoading(true);

    const context: CopilotContext = {
      activeFeed,
      minMagnitude,
      filteredCount: filteredFeatures.length,
      totalCount: rawData?.features?.length || 0,
      strongestEvent: metrics.strongestEvent,
      selectedEvent,
      selectedLocationWeather: selectedWeather,
      selectedRegion,
    };

    try {
      const { intent } = await askGeminiCopilot(query, context, apiKey, proxyUrl);
      
      // Automatically apply intent to the map
      handleApplyIntent(intent);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: intent.explanation || 'Analyzed spatial query and updated map parameters.',
        timestamp: Date.now(),
        intent,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (_err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Encountered an issue processing query. Map controls remain fully operational.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsCopilotLoading(false);
    }
  }, [activeFeed, minMagnitude, filteredFeatures.length, rawData?.features?.length, metrics.strongestEvent, selectedEvent, selectedWeather, selectedRegion, apiKey, proxyUrl, handleApplyIntent]);

  // Save Settings Handlers
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (newKey) localStorage.setItem('TERRAPULSE_GEMINI_KEY', newKey);
    else localStorage.removeItem('TERRAPULSE_GEMINI_KEY');
  };

  const handleSaveProxyUrl = (newUrl: string) => {
    setProxyUrl(newUrl);
    if (newUrl) localStorage.setItem('TERRAPULSE_PROXY_URL', newUrl);
    else localStorage.removeItem('TERRAPULSE_PROXY_URL');
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    loadFeed(activeFeed);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-orbital-bg text-orbital-text font-sans">
      {/* Top Header Bar */}
      <TopBar
        isLoading={isLoadingFeed}
        lastUpdated={lastUpdated}
        onRefresh={() => loadFeed(activeFeed)}
        activeLayer={layerMode}
        onLayerChange={setLayerMode}
        isCopilotOpen={isCopilotOpen}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        filteredCount={filteredFeatures.length}
        totalCount={rawData?.features?.length || 0}
      />

      {/* Main Workspace Canvas */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Exploration Rail */}
        <LeftRail
          feed={activeFeed}
          onFeedChange={setActiveFeed}
          minMagnitude={minMagnitude}
          onMinMagnitudeChange={setMinMagnitude}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          layerMode={layerMode}
          onLayerModeChange={setLayerMode}
          onResetFilters={handleResetFilters}
          isCollapsed={isLeftRailCollapsed}
          onToggleCollapse={() => setIsLeftRailCollapsed((prev) => !prev)}
        />

        {/* Central Map Canvas */}
        <MapCanvas
          data={rawData}
          filteredFeatures={filteredFeatures}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          selectedWeather={selectedWeather}
          onMapClickCoordinates={handleMapClickCoordinates}
          selectedRegion={selectedRegion}
          topNEvents={topNEvents}
          layerMode={layerMode}
          isLoadingWeather={isLoadingWeather}
        />

        {/* Floating Detail Panels */}
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onFetchWeather={(lat, lng) => handleMapClickCoordinates(lat, lng)}
        />

        {showWeatherDetail && selectedWeather && (
          <WeatherDetailPanel
            weather={selectedWeather}
            onClose={() => setShowWeatherDetail(false)}
          />
        )}

        {/* Right Gemini Copilot Drawer */}
        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isCopilotLoading}
          onApplyIntent={handleApplyIntent}
          isCustomKeySet={Boolean(apiKey || proxyUrl)}
        />
      </div>

      {/* Bottom Telemetry Strip */}
      <BottomTelemetryRail
        metrics={metrics}
        selectedWeather={selectedWeather}
        onSelectEvent={handleSelectEvent}
        feedLabel={USGS_FEEDS[activeFeed]?.label || activeFeed}
        minMag={minMagnitude}
      />

      {/* Modals */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        proxyUrl={proxyUrl}
        onSaveProxyUrl={handleSaveProxyUrl}
        onClearCache={handleClearCache}
      />
    </div>
  );
}

export default App;
