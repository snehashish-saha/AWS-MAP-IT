import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Radio,
  ExternalLink,
  ShieldAlert,
  Server,
  Activity,
  Anchor,
  Globe,
} from 'lucide-react';
import type { SelectedEntity } from '../types';
import { formatGeodesicDistance, formatFocalDepth } from '../services/proximity';

interface InsightCardProps {
  selectedEntity: SelectedEntity | null;
  onClose: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ selectedEntity, onClose }) => {
  if (!selectedEntity) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={selectedEntity.type + (selectedEntity.data as any).id}
        initial={{ opacity: 0, x: 24, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed top-20 right-6 z-30 w-80 md:w-96 glass-panel rounded-xl shadow-2xl p-5 border border-subsea-border overflow-hidden"
      >
        {/* Top Header / Entity Type Badge */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-subsea-border">
          <div className="flex items-center gap-2">
            {selectedEntity.type === 'cable' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-subsea-cyan-dim text-subsea-cyan border border-subsea-cyan/30 uppercase tracking-wider">
                <Radio className="w-3 h-3 animate-pulse" /> Subsea Cable
              </span>
            )}
            {selectedEntity.type === 'landing_point' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-subsea-amber-dim text-subsea-amber border border-subsea-amber/30 uppercase tracking-wider">
                <Anchor className="w-3 h-3" /> Landing Station
              </span>
            )}
            {selectedEntity.type === 'aws_region' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-subsea-purple-dim text-subsea-purple border border-subsea-purple/30 uppercase tracking-wider">
                <Server className="w-3 h-3" /> AWS Region
              </span>
            )}
            {selectedEntity.type === 'exposure_alert' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-subsea-amber-dim text-subsea-amber border border-subsea-amber/40 uppercase tracking-wider">
                <ShieldAlert className="w-3 h-3" /> Exposure Alert
              </span>
            )}
            {selectedEntity.type === 'earthquake' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wider">
                <Activity className="w-3 h-3" /> Seismic Event
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-subsea-muted hover:text-subsea-text hover:bg-white/5 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body Based on Entity Type */}
        {selectedEntity.type === 'cable' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-subsea-text leading-tight">
                {selectedEntity.data.name}
              </h3>
              <p className="text-xs text-subsea-muted mt-1 font-mono">
                System ID: {selectedEntity.data.id}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="text-subsea-muted">Reported Length</div>
                <div className="text-sm font-mono font-medium text-subsea-cyan mt-0.5">
                  {selectedEntity.data.length || 'Length unlisted'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="text-subsea-muted">Service Entry (RFS)</div>
                <div className="text-sm font-mono font-medium text-subsea-text mt-0.5">
                  {selectedEntity.data.rfs || (selectedEntity.data.rfs_year ? `Year ${selectedEntity.data.rfs_year}` : 'Operational')}
                </div>
              </div>
            </div>

            {selectedEntity.data.owners && (
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs text-subsea-muted mb-1">Owners / Consortium</div>
                <div className="text-xs text-subsea-text leading-relaxed">
                  {selectedEntity.data.owners}
                </div>
              </div>
            )}

            {selectedEntity.data.suppliers && (
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs text-subsea-muted mb-1">Optical Suppliers</div>
                <div className="text-xs text-subsea-text leading-relaxed">
                  {selectedEntity.data.suppliers}
                </div>
              </div>
            )}

            {selectedEntity.data.landing_points && (
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs text-subsea-muted mb-1">Landing Stations</div>
                <div className="text-xs text-subsea-cyan/90 leading-relaxed font-mono text-[11px]">
                  {selectedEntity.data.landing_points}
                </div>
              </div>
            )}

            {selectedEntity.data.url && (
              <div className="pt-0.5">
                <a
                  href={selectedEntity.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-subsea-cyan hover:underline font-mono"
                >
                  <Globe className="w-3.5 h-3.5" /> Official System Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="text-[11px] text-subsea-muted/80 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
              Route geometry is based on surveyed and publicly charted paths. Hover illuminates line segments; click isolates route across ocean basins.
            </div>
          </div>
        )}

        {selectedEntity.type === 'landing_point' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-subsea-text">
                {selectedEntity.data.name}
              </h3>
              <p className="text-xs text-subsea-muted mt-1 font-mono">
                Station ID: {selectedEntity.data.id}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
              <div className="text-xs text-subsea-muted">Infrastructure Role</div>
              <p className="text-xs text-subsea-text leading-relaxed">
                Coastal optical amplifier and power feed termination point where subsea cables link into terrestrial dark-fiber backbones.
              </p>
            </div>
          </div>
        )}

        {selectedEntity.type === 'aws_region' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-subsea-purple flex items-center gap-2">
                <Globe className="w-5 h-5 text-subsea-purple" />
                {selectedEntity.data.code}
              </h3>
              <p className="text-sm text-subsea-text font-medium mt-0.5">
                {selectedEntity.data.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="text-subsea-muted">Continent</div>
                <div className="text-sm font-medium text-subsea-text mt-0.5">
                  {selectedEntity.data.continent}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="text-subsea-muted">Launched</div>
                <div className="text-sm font-mono font-medium text-subsea-purple mt-0.5">
                  {selectedEntity.data.launchYear}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/5">
              <div className="text-xs text-subsea-muted mb-1">Geographic Connectivity Context</div>
              <div className="text-xs text-subsea-text leading-relaxed">
                {selectedEntity.data.description}
              </div>
            </div>

            <div className="text-[10px] text-subsea-muted/70 italic">
              * AWS Region marker depicts approximate geographic metropolitan center. Exact data-center facilities are proprietary.
            </div>
          </div>
        )}

        {selectedEntity.type === 'exposure_alert' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-subsea-amber flex items-center gap-1.5 uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5" /> Potential Physical Exposure
              </div>
              <h3 className="text-base font-semibold text-subsea-text">
                {selectedEntity.data.earthquake.properties.title || 'Offshore Seismic Tremor'}
              </h3>
            </div>

            {(() => {
              const depth = selectedEntity.data.earthquake.geometry.coordinates[2] ?? 10;
              const isDeep = depth > 70;

              return (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-subsea-amber-dim/50 border border-subsea-amber/30">
                      <div className="text-subsea-muted">Proximity Clearance</div>
                      <div className="text-base font-mono font-bold text-subsea-amber mt-0.5">
                        {formatGeodesicDistance(selectedEntity.data.distanceKm)}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase ${
                            isDeep
                              ? 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
                              : selectedEntity.data.proximityCategory === 'critical'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : selectedEntity.data.proximityCategory === 'warning'
                              ? 'bg-subsea-amber-dim text-subsea-amber border border-subsea-amber/40'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isDeep
                            ? 'Deep-Focus (Effects Unlikely)'
                            : selectedEntity.data.proximityCategory === 'critical'
                            ? 'High Physical Hazard'
                            : selectedEntity.data.proximityCategory === 'warning'
                            ? 'Moderate Advisory'
                            : 'Monitor'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <div className="text-subsea-muted">Seismic Magnitude</div>
                      <div className="text-lg font-mono font-bold text-red-400 mt-0.5">
                        M{selectedEntity.data.earthquake.properties.mag?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-[10px] text-subsea-muted mt-1 font-mono">
                        Depth: {formatFocalDepth(depth)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5">
                    <div className="text-xs text-subsea-muted">Nearest Subsea Cable</div>
                    <div className="text-sm font-semibold text-subsea-cyan">
                      {selectedEntity.data.nearestCable.name}
                    </div>
                    <div className="text-[10px] text-subsea-muted/80">
                      Geodesic clearance based on charted schematic vectors (&plusmn;10 km USGS/TeleGeography variance).
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-subsea-muted leading-relaxed">
                    <strong>Screening Context:</strong>{' '}
                    {isDeep
                      ? 'Deep-focus mantle subduction earthquake (>70 km). Primary high-frequency shear waves attenuate before the seabed; turbidity current or fault scarp rupture is highly improbable.'
                      : 'Shallow crustal seismic event (<70 km). Seafloor ground acceleration may destabilize unarmored cables or trigger submarine sediment flows.'}
                  </div>
                </>
              );
            })()}

            {selectedEntity.data.earthquake.properties.url && (
              <a
                href={selectedEntity.data.earthquake.properties.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-subsea-text border border-white/10 transition-colors"
              >
                Inspect Canonical USGS Record <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {selectedEntity.type === 'earthquake' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-subsea-text">
                {selectedEntity.data.properties.title || 'Seismic Event'}
              </h3>
              <p className="text-xs text-subsea-muted mt-1 font-mono">
                {new Date(selectedEntity.data.properties.time).toUTCString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="text-subsea-muted">Magnitude</div>
                <div className="text-base font-mono font-bold text-red-400 mt-0.5">
                  M{selectedEntity.data.properties.mag?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="text-subsea-muted">Focal Depth</div>
                <div className="text-sm font-mono font-bold text-subsea-text mt-0.5">
                  {formatFocalDepth(selectedEntity.data.geometry.coordinates[2])}
                </div>
              </div>
            </div>

            {selectedEntity.data.properties.url && (
              <a
                href={selectedEntity.data.properties.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-subsea-text border border-white/10 transition-colors"
              >
                USGS Event Telemetry <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
