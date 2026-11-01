import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  SubseaCableCollection,
  LandingPointCollection,
  EarthquakeFeatureCollection,
  FeedType,
  LayerVisibility,
  SelectedEntity,
  ChokepointPreset,
} from './types';

import { fetchEarthquakeFeed } from './services/usgs';
import { fetchSubseaCables, fetchLandingPoints } from './services/cables';
import { computeCableExposureAlerts } from './services/proximity';
import { STORY_STEPS } from './constants/chokepoints';
import { AWS_REGIONS } from './constants/awsRegions';

import { MapCanvas } from './components/MapCanvas';
import { TopBar } from './components/TopBar';
import { IntelligenceConsole } from './components/IntelligenceConsole';
import { InsightCard } from './components/InsightCard';
import { ChokepointBar } from './components/ChokepointBar';
import { StoryModeOverlay } from './components/StoryModeOverlay';
import { CommandPalette } from './components/CommandPalette';
import { AboutModal } from './components/AboutModal';
import { SettingsModal } from './components/SettingsModal';
import { CinematicIntro } from './components/CinematicIntro';
import { BottomMetaStrip } from './components/BottomMetaStrip';

export function App() {
  // Data Sources State
  const [cablesData, setCablesData] = useState<SubseaCableCollection | null>(null);
  const [landingPointsData, setLandingPointsData] = useState<LandingPointCollection | null>(null);
  const [earthquakesData, setEarthquakesData] = useState<EarthquakeFeatureCollection | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Filters & Controls State
  const [activeFeed, setActiveFeed] = useState<FeedType>('24h');
  const [minMagnitude, setMinMagnitude] = useState<number>(4.0);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    cables: true,
    landingPoints: true,
    awsRegions: true,
    earthquakes: true,
    alertsOnly: false,
  });

  // Selection & Navigation State
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [activeChokepoint, setActiveChokepoint] = useState<ChokepointPreset | null>(null);
  const [storyStepIndex, setStoryStepIndex] = useState<number | null>(null);

  // Modals & Panels State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return !sessionStorage.getItem('terrapulse_intro_seen');
  });

  // Amazon Location Settings (Persisted in localStorage)
  const [amazonLocationKey, setAmazonLocationKey] = useState<string>(() => {
    return localStorage.getItem('TERRAPULSE_AWS_LOCATION_KEY') || '';
  });
  const [amazonLocationRegion, setAmazonLocationRegion] = useState<string>(() => {
    return localStorage.getItem('TERRAPULSE_AWS_LOCATION_REGION') || 'us-east-1';
  });

  // Load Subsea Infrastructure Datasets on Mount
  useEffect(() => {
    async function loadInfrastructure() {
      try {
        const [cables, landings] = await Promise.all([
          fetchSubseaCables(),
          fetchLandingPoints(),
        ]);
        setCablesData(cables);
        setLandingPointsData(landings);
      } catch (err) {
        console.error('Failed loading infrastructure data:', err);
      }
    }
    loadInfrastructure();
  }, []);

  // Load USGS Live Feeds
  const loadFeed = useCallback(async (feed: FeedType, force = false, showSpinner = true) => {
    if (showSpinner) setIsLoadingData(true);
    try {
      const quakes = await fetchEarthquakeFeed(feed, undefined, force);
      setEarthquakesData(quakes);
    } catch (err) {
      console.error('Failed loading USGS feed:', err);
    } finally {
      if (showSpinner) setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(activeFeed);
    // Auto-refresh: Poll for new USGS earthquakes every 60 seconds seamlessly without interrupting UI
    const interval = setInterval(() => loadFeed(activeFeed, true, false), 60000);
    return () => clearInterval(interval);
  }, [activeFeed, loadFeed]);

  // Pre-load 7d and 30d feeds in background cache during idle time for 0ms instantaneous tab switching
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      fetchEarthquakeFeed('7d').catch(() => {});
      fetchEarthquakeFeed('30d').catch(() => {});
    }, 2000);
    return () => clearTimeout(idleTimer);
  }, []);

  // Pre-calculate proximity alerts once per feed for all quakes >= M2.5
  const allFeedExposureAlerts = useMemo(() => {
    if (!cablesData || !earthquakesData?.features.length) return [];
    return computeCableExposureAlerts(
      earthquakesData.features,
      cablesData.features,
      100, // 100 km physical buffer
      2.5  // Pre-compute down to M2.5
    );
  }, [cablesData, earthquakesData]);

  // Instant in-memory magnitude filter for exposure alerts (0ms lag when dragging slider)
  const exposureAlerts = useMemo(() => {
    return allFeedExposureAlerts.filter(
      (a) => (a.earthquake.properties.mag ?? 0) >= minMagnitude
    );
  }, [allFeedExposureAlerts, minMagnitude]);

  // Filtered Earthquakes (instant 0ms filter)
  const filteredEarthquakes = useMemo(() => {
    if (!earthquakesData) return [];
    return earthquakesData.features.filter((eq) => {
      const mag = eq.properties.mag ?? 0;
      return mag >= minMagnitude;
    });
  }, [earthquakesData, minMagnitude]);

  // Final visible earthquakes (filtered if "alertsOnly" is checked)
  const visibleEarthquakes = useMemo(() => {
    if (!layerVisibility.alertsOnly) return filteredEarthquakes;
    const alertQuakeIds = new Set(exposureAlerts.map((a) => a.earthquake.id));
    return filteredEarthquakes.filter((eq) => alertQuakeIds.has(eq.id));
  }, [filteredEarthquakes, exposureAlerts, layerVisibility.alertsOnly]);

  // Handle Layer Toggle
  const handleToggleLayer = (layer: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Handle Chokepoint Selection
  const handleSelectChokepoint = (preset: ChokepointPreset | null) => {
    setActiveChokepoint(preset);
    setStoryStepIndex(null);
  };

  // Story Mode Handlers
  const handleStartStoryMode = () => {
    setStoryStepIndex(0);
    setActiveChokepoint(null);
    setSelectedEntity(null);
    // Guarantee that key layers are enabled so Story Mode never runs on a blank map
    setLayerVisibility({
      cables: true,
      landingPoints: true,
      awsRegions: true,
      earthquakes: true,
      alertsOnly: false,
    });
  };

  const handleNextStoryStep = () => {
    if (storyStepIndex === null) return;
    if (storyStepIndex < STORY_STEPS.length - 1) {
      setStoryStepIndex(storyStepIndex + 1);
    } else {
      setStoryStepIndex(null); // Finish
    }
  };

  const handlePrevStoryStep = () => {
    if (storyStepIndex === null || storyStepIndex === 0) return;
    setStoryStepIndex(storyStepIndex - 1);
  };

  const handleDismissIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem('terrapulse_intro_seen', 'true');
  };

  // Save Settings Handlers
  const handleSaveApiKey = (key: string) => {
    setAmazonLocationKey(key);
    localStorage.setItem('TERRAPULSE_AWS_LOCATION_KEY', key);
  };

  const handleSaveRegion = (reg: string) => {
    setAmazonLocationRegion(reg);
    localStorage.setItem('TERRAPULSE_AWS_LOCATION_REGION', reg);
  };

  // Keyboard Shortcuts (Esc to close/clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showIntro) handleDismissIntro();
        else if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isInfoOpen) setIsInfoOpen(false);
        else if (storyStepIndex !== null) setStoryStepIndex(null);
        else if (selectedEntity) setSelectedEntity(null);
        else if (activeChokepoint) setActiveChokepoint(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showIntro,
    isCommandPaletteOpen,
    isSettingsOpen,
    isInfoOpen,
    storyStepIndex,
    selectedEntity,
    activeChokepoint,
  ]);

  return (
    <div className="relative w-screen h-screen bg-subsea-bg overflow-hidden flex flex-col font-sans select-none">
      {/* 1. Full Bleed Map Canvas (The Hero) */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          cablesData={cablesData}
          landingPointsData={landingPointsData}
          earthquakes={earthquakesData?.features || []}
          alerts={exposureAlerts}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
          layerVisibility={layerVisibility}
          activeChokepoint={activeChokepoint}
          storyStep={storyStepIndex !== null ? STORY_STEPS[storyStepIndex] : null}
          minMagnitude={minMagnitude}
          amazonLocationKey={amazonLocationKey}
          amazonLocationRegion={amazonLocationRegion}
        />
      </div>

      {/* Cinematic Orbital Vignette (Depth of field overlay) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,10,18,0.75)_100%)] z-10" />

      {/* 2. Slim Floating Top Bar */}
      <TopBar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        isLoadingData={isLoadingData}
        activeFeed={activeFeed}
        amazonLocationKey={amazonLocationKey}
      />

      {/* 3. Subsea Intelligence Console (Collapsible Mission Control Drawer) */}
      <IntelligenceConsole
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        activeFeed={activeFeed}
        onChangeFeed={setActiveFeed}
        minMagnitude={minMagnitude}
        onChangeMinMagnitude={setMinMagnitude}
        alerts={exposureAlerts}
        cablesCount={cablesData?.features.length || 733}
        landingCount={landingPointsData?.features.length || 1928}
        awsRegionsCount={AWS_REGIONS.length}
        quakesCount={visibleEarthquakes.length}
        onSelectEntity={setSelectedEntity}
        onSelectChokepoint={handleSelectChokepoint}
        activeChokepoint={activeChokepoint}
        isStoryModeActive={storyStepIndex !== null}
      />

      {/* 4. Floating Insight Card (Right - Entity Details) */}
      <InsightCard
        selectedEntity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />

      {/* 5. Bottom Chokepoints & Story Mode Pill Bar (Center) */}
      <ChokepointBar
        activeChokepoint={activeChokepoint}
        onSelectChokepoint={handleSelectChokepoint}
        onStartStoryMode={handleStartStoryMode}
        isStoryModeActive={storyStepIndex !== null}
      />

      {/* 6. Story Mode Guided Tour Overlay */}
      {storyStepIndex !== null && (
        <StoryModeOverlay
          currentStepIndex={storyStepIndex}
          onNextStep={handleNextStoryStep}
          onPrevStep={handlePrevStoryStep}
          onSelectStepIndex={setStoryStepIndex}
          onExitStoryMode={() => setStoryStepIndex(null)}
        />
      )}

      {/* 7. Bottom Micro Telemetry & Attribution */}
      <BottomMetaStrip
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      {/* 8. Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        cables={cablesData?.features || []}
        onSelectEntity={setSelectedEntity}
        onSelectChokepoint={handleSelectChokepoint}
        onStartStoryMode={handleStartStoryMode}
        onFilterAlerts={() => setLayerVisibility((p) => ({ ...p, alertsOnly: true }))}
      />

      {/* 9. Methodology & Attribution Modal */}
      <AboutModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* 10. Settings Modal (Amazon Location Key) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={amazonLocationKey}
        onSaveApiKey={handleSaveApiKey}
        region={amazonLocationRegion}
        onSaveRegion={handleSaveRegion}
      />

      {/* 11. Cinematic Intro (Skippable, Once per session) */}
      {showIntro && <CinematicIntro onDismiss={handleDismissIntro} />}
    </div>
  );
}

export default App;
