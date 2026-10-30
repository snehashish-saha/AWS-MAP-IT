import React from 'react';
import { X, Cloud, Activity, Database, Cpu, ExternalLink } from 'lucide-react';
import { OrbitalLogo } from './Icons';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-orbital-surface border border-orbital-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-orbital-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <OrbitalLogo size={32} />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-orbital-text">TerraPulse: Global Earth Intelligence</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orbital-bg text-orbital-teal border border-orbital-teal/40 uppercase">
                  AWS Map It 2026
                </span>
              </div>
              <p className="text-xs text-orbital-muted">
                Map-first spatial platform combining seismic feeds, weather context, and Gemini AI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-orbital-muted hover:text-orbital-text p-1.5 rounded-lg hover:bg-orbital-elevated transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs font-sans text-orbital-muted leading-relaxed">
          {/* Section: AWS Integration */}
          <div className="space-y-2 bg-orbital-bg/80 border border-orbital-border p-3.5 rounded-xl">
            <div className="flex items-center space-x-2 text-orbital-teal font-semibold text-xs uppercase tracking-wider">
              <Database size={15} />
              <span>AWS Cloud Architecture & S3 Integration</span>
            </div>
            <p>
              Built to strictly conform to the <strong>AWS Academy Learner Lab</strong> constraints ($50 budget guardrail). TerraPulse is packaged as a high-performance single page application hosted directly via <strong>Amazon S3 Static Website Hosting</strong>.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-orbital-elevated p-2 rounded border border-orbital-border">
                <span className="text-orbital-text font-bold block">Amazon S3</span>
                <span>Static SPA hosting + GeoJSON fixture cache</span>
              </div>
              <div className="bg-orbital-elevated p-2 rounded border border-orbital-border">
                <span className="text-orbital-text font-bold block">Zero Compute Leaks</span>
                <span>No VPC, NAT Gateway, or runaway DB charges</span>
              </div>
            </div>
          </div>

          {/* Section: Data Sources */}
          <div className="space-y-3">
            <h3 className="font-semibold text-orbital-text uppercase tracking-wider text-[11px]">
              Authoritative Data Sources
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-orbital-elevated border border-orbital-border p-3 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-orbital-coral font-semibold">
                  <Activity size={14} />
                  <span>USGS Earthquake Hazards</span>
                </div>
                <p className="text-[11px]">
                  Real-time seismic feeds (Hour, 24-Hour, 7-Day, 30-Day, and Significant) delivered via GeoJSON API.
                </p>
                <a
                  href="https://earthquake.usgs.gov/earthquakes/feed/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orbital-coral hover:underline inline-flex items-center space-x-1 text-[10px] font-mono pt-1"
                >
                  <span>earthquake.usgs.gov</span>
                  <ExternalLink size={9} />
                </a>
              </div>

              <div className="bg-orbital-elevated border border-orbital-border p-3 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-orbital-weather font-semibold">
                  <Cloud size={14} />
                  <span>Open-Meteo Forecast API</span>
                </div>
                <p className="text-[11px]">
                  Point atmospheric observations, relative humidity, wind speed, and 7-day model forecasts under CC BY 4.0.
                </p>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orbital-weather hover:underline inline-flex items-center space-x-1 text-[10px] font-mono pt-1"
                >
                  <span>open-meteo.com (CC BY 4.0)</span>
                  <ExternalLink size={9} />
                </a>
              </div>
            </div>
          </div>

          {/* Section: AI Copilot Guardrails */}
          <div className="space-y-2 bg-orbital-elevated/40 border border-orbital-border p-3.5 rounded-xl">
            <div className="flex items-center space-x-2 text-orbital-text font-semibold text-xs uppercase tracking-wider">
              <Cpu size={15} className="text-orbital-teal" />
              <span>Gemini 3.1 Flash-Lite Copilot Guardrails</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li><strong>Map-Centric Actions:</strong> Natural language queries are parsed into structured JSON intents that directly adjust map bounds, filters, and layer visibility.</li>
              <li><strong>Deterministic Integrity:</strong> Gemini never fabricates earthquake counts or magnitudes; every statistical metric is computed client-side in TypeScript.</li>
              <li><strong>Scientific Responsibility:</strong> The application explicitly rejects pseudo-science, does not claim weather causes earthquakes, and does not claim to predict earthquakes.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-orbital-border bg-orbital-bg/60 flex items-center justify-between text-[11px] font-mono">
          <span className="text-orbital-muted">Weekend Challenge: Map It (Oct 30 – Nov 2, 2026)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-orbital-teal text-[#070B12] font-semibold hover:brightness-110 transition"
          >
            Explore Map
          </button>
        </div>
      </div>
    </div>
  );
};
