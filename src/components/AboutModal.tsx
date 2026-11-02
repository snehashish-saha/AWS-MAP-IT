import React from 'react';
import { X, ExternalLink, ShieldCheck, Database, Cloud, Radio } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl glass-panel rounded-2xl shadow-2xl border border-subsea-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-subsea-border">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-subsea-cyan" />
            <div>
              <h2 className="text-base font-bold text-subsea-text tracking-tight">
                Methodology, Cloud Architecture & Attribution
              </h2>
              <p className="text-xs text-subsea-muted">
                TerraPulse SUBSEA — AWS Weekend Challenge: Map It (2026)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-subsea-muted hover:text-subsea-text hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-subsea-muted leading-relaxed">
          {/* Executive Thesis */}
          <div className="p-4 rounded-xl bg-subsea-cyan-dim border border-subsea-cyan/30 text-subsea-text">
            <div className="text-xs font-bold text-subsea-cyan uppercase tracking-wider mb-1">
              The Planetary Problem
            </div>
            <p className="text-xs leading-relaxed">
              People assume the Cloud lives in satellites or wireless towers. In reality, over <strong>95% of all global internet traffic and AWS inter-region data</strong> flows through glass fiber-optic tubes sitting on the seabed—no thicker than a garden hose. TerraPulse SUBSEA maps this physical substrate, visualizes strategic maritime chokepoints, and cross-references live seismic hazards.
            </p>
          </div>

          {/* Scientific Honesty Notice */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-subsea-text">
              <ShieldCheck className="w-4 h-4 text-subsea-amber" />
              Scientific Integrity & Proximity Disclaimers
            </div>
            <p>
              Undersea earthquake proximity calculations are strictly labeled as <strong>&ldquo;Potential Physical Exposure Observations&rdquo;</strong>, never &ldquo;Confirmed Cable Cuts&rdquo; or &ldquo;Outage Predictions&rdquo;:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Distance ≠ Damage:</strong> An offshore tremor near a cable does not automatically break the glass fiber. Cable failure depends on sediment displacement, turbidity mudslides, fault ruptures, and armored casing.
              </li>
              <li>
                <strong>Approximate Geometries:</strong> Public charted cable paths represent surveyed route corridors, not exact centimeter-grade seabed coordinates.
              </li>
              <li>
                <strong>BGP Redundancy:</strong> Global transit providers and cloud backbones maintain automated mesh rerouting; single cable impairments rarely collapse the internet unless concentrated in narrow chokepoints (e.g. the 2006 Hengchun M7.1 event).
              </li>
            </ul>
          </div>

          {/* AWS Cloud Architecture */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-subsea-text">
              <Cloud className="w-4 h-4 text-subsea-purple" />
              AWS Cloud Deployment & Infrastructure
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 font-mono text-[11px]">
              <div className="text-subsea-cyan">
                AWS Amplify (Live Hosting & Continuous Deployment)
              </div>
              <div className="text-subsea-muted">
                ├── 28 AWS Cloud Regions (Geospatial Connectivity & Landing Context)
                <br />
                ├── Client-Side Spatial Engine (MapLibre GL + Turf.js Grid Indexing)
                <br />
                └── Reference AWS SAM Template (EventBridge → Lambda → S3 in repo)
              </div>
            </div>
            <p>
              Hosted and deployed on <strong>AWS Amplify</strong> with automated CI/CD from GitHub. The repository also includes a reference <strong>AWS SAM template</strong> (<code>backend/template.yaml</code>) for an EventBridge-scheduled Lambda function caching seismic feeds to Amazon S3.
            </p>
          </div>

          {/* Authoritative Datasets & Attribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-subsea-text">
              <Database className="w-4 h-4 text-subsea-cyan" />
              Authoritative Datasets & Attribution
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="font-semibold text-subsea-text mb-0.5">Submarine Cable Map</div>
                <div className="text-[11px] text-subsea-muted mb-1.5">
                  733 international cables & 1,928 landing hubs.
                </div>
                <a
                  href="https://www.submarinecablemap.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-subsea-cyan hover:underline flex items-center gap-1 text-[11px]"
                >
                  Data © TeleGeography <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="font-semibold text-subsea-text mb-0.5">USGS Earthquake Hazards</div>
                <div className="text-[11px] text-subsea-muted mb-1.5">
                  Live real-time seismic GeoJSON feeds.
                </div>
                <a
                  href="https://earthquake.usgs.gov"
                  target="_blank"
                  rel="noreferrer"
                  className="text-subsea-cyan hover:underline flex items-center gap-1 text-[11px]"
                >
                  USGS Hazards Program <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-subsea-border bg-black/30 flex items-center justify-between text-[11px] text-subsea-muted">
          <span>MIT License · Built with React 19, TypeScript, and MapLibre GL</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-subsea-text transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
