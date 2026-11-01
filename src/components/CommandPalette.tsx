import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Radio,
  Server,
  Anchor,
  Compass,
  BookOpen,
  Filter,
  Sparkles,
  X,
} from 'lucide-react';
import { CHOKEPOINT_PRESETS } from '../constants/chokepoints';
import { AWS_REGIONS } from '../constants/awsRegions';
import type {
  SubseaCableFeature,
  SelectedEntity,
  ChokepointPreset,
} from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  cables: SubseaCableFeature[];
  onSelectEntity: (entity: SelectedEntity | null) => void;
  onSelectChokepoint: (chokepoint: ChokepointPreset | null) => void;
  onStartStoryMode: () => void;
  onFilterAlerts: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  cables,
  onSelectEntity,
  onSelectChokepoint,
  onStartStoryMode,
  onFilterAlerts,
}) => {
  const [search, setSearch] = useState('');

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSearch('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Deduplicate cables and extract unique entries with rich metadata
  const uniqueCables = React.useMemo(() => {
    const map = new Map<string, SubseaCableFeature>();
    for (const c of cables) {
      const id = c.properties?.id;
      if (id && !map.has(id)) {
        map.set(id, c);
      }
    }
    return Array.from(map.values());
  }, [cables]);

  const q = search.toLowerCase().trim();

  const filteredCables = React.useMemo(() => {
    if (!q) return uniqueCables.slice(0, 8);
    return uniqueCables.filter((c) => {
      const p = c.properties;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.owners?.toLowerCase().includes(q) ||
        p.suppliers?.toLowerCase().includes(q) ||
        p.landing_points?.toLowerCase().includes(q)
      );
    }).slice(0, 30);
  }, [uniqueCables, q]);

  const filteredRegions = React.useMemo(() => {
    if (!q) return AWS_REGIONS.slice(0, 6);
    return AWS_REGIONS.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.continent.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [q]);

  const filteredChokepoints = React.useMemo(() => {
    if (!q) return CHOKEPOINT_PRESETS;
    return CHOKEPOINT_PRESETS.filter(
      (cp) =>
        cp.name.toLowerCase().includes(q) ||
        cp.id.toLowerCase().includes(q) ||
        cp.description.toLowerCase().includes(q)
    );
  }, [q]);

  const handleSelectCable = (cable: SubseaCableFeature) => {
    onSelectEntity({
      type: 'cable',
      data: cable.properties,
    });
    onClose();
  };

  const handleSelectRegion = (region: (typeof AWS_REGIONS)[0]) => {
    onSelectEntity({
      type: 'aws_region',
      data: region,
    });
    onClose();
  };

  const handleSelectChokepoint = (chokepoint: ChokepointPreset) => {
    onSelectChokepoint(chokepoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-subsea-cyan/30 overflow-hidden">
        <Command label="Global Command Palette" shouldFilter={false}>
          {/* Search Input Bar */}
          <div className="flex items-center px-4 border-b border-subsea-border">
            <Search className="w-4 h-4 text-subsea-cyan mr-3 flex-shrink-0" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search cables, owners, AWS regions, chokepoints..."
              className="w-full py-4 bg-transparent text-sm text-subsea-text placeholder-subsea-muted focus:outline-none font-sans"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-md text-subsea-muted hover:text-subsea-text hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-2">
            <Command.Empty className="py-8 text-center text-xs text-subsea-muted">
              No matching cables or infrastructure found.
            </Command.Empty>

            {/* Quick Actions / Copilot Shortcuts (only show when not searching) */}
            {!q && (
              <Command.Group heading="Navigation & Modes" className="text-[10px] font-semibold text-subsea-muted uppercase tracking-wider px-2 py-1">
                <Command.Item
                  onSelect={() => {
                    onStartStoryMode();
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-subsea-text hover:bg-subsea-purple/20 hover:text-subsea-purple cursor-pointer transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-subsea-purple" />
                  <span className="font-medium">Launch Story Mode Tour (5 Chapters)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onFilterAlerts();
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-subsea-text hover:bg-subsea-amber/20 hover:text-subsea-amber cursor-pointer transition-colors"
                >
                  <Filter className="w-4 h-4 text-subsea-amber" />
                  <span className="font-medium">Filter to Potential Seismic Exposure Alerts</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onSelectChokepoint(null);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-subsea-text hover:bg-subsea-cyan/20 hover:text-subsea-cyan cursor-pointer transition-colors"
                >
                  <Compass className="w-4 h-4 text-subsea-cyan" />
                  <span className="font-medium">Reset Camera to Global Perspective</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Chokepoints */}
            {filteredChokepoints.length > 0 && (
              <Command.Group heading="Strategic Chokepoints" className="text-[10px] font-semibold text-subsea-muted uppercase tracking-wider px-2 py-1 pt-2 border-t border-white/5">
                {filteredChokepoints.map((preset) => (
                  <Command.Item
                    key={preset.id}
                    onSelect={() => handleSelectChokepoint(preset)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-subsea-text hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Anchor className="w-4 h-4 text-subsea-amber" />
                      <span>{preset.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-subsea-muted">
                      ~{preset.cableCountApprox} cables
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* AWS Regions */}
            {filteredRegions.length > 0 && (
              <Command.Group heading="AWS Cloud Regions" className="text-[10px] font-semibold text-subsea-muted uppercase tracking-wider px-2 py-1 pt-2 border-t border-white/5">
                {filteredRegions.map((region) => (
                  <Command.Item
                    key={region.id}
                    onSelect={() => handleSelectRegion(region)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-subsea-text hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-subsea-purple" />
                      <span className="font-mono text-subsea-purple font-semibold">{region.code}</span>
                      <span className="text-subsea-muted">{region.name}</span>
                    </div>
                    <span className="text-[10px] text-subsea-muted">
                      {region.continent}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Subsea Cables */}
            {filteredCables.length > 0 && (
              <Command.Group heading="Subsea Cables (TeleGeography)" className="text-[10px] font-semibold text-subsea-muted uppercase tracking-wider px-2 py-1 pt-2 border-t border-white/5">
                {filteredCables.map((cable) => (
                  <Command.Item
                    key={cable.properties.id}
                    value={cable.properties.id}
                    onSelect={() => handleSelectCable(cable)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-subsea-text hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      <Radio className="w-4 h-4 text-subsea-cyan shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-subsea-cyan truncate">{cable.properties.name}</div>
                        {(cable.properties.owners || cable.properties.suppliers) && (
                          <div className="text-[10px] text-subsea-muted truncate">
                            {cable.properties.owners || cable.properties.suppliers}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-subsea-muted shrink-0">
                      {cable.properties.length || 'Length unlisted'}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2 bg-black/40 border-t border-subsea-border flex items-center justify-between text-[11px] text-subsea-muted">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-subsea-cyan" /> Deterministic Geospatial Index
            </span>
            <span className="font-mono text-[10px]">ESC to close · ↵ to select</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
