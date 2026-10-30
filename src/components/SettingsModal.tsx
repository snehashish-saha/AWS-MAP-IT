import React, { useState } from 'react';
import { X, Key, Shield, RefreshCw, Check, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  proxyUrl: string;
  onSaveProxyUrl: (url: string) => void;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  proxyUrl,
  onSaveProxyUrl,
  onClearCache,
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localProxy, setLocalProxy] = useState(proxyUrl);
  const [savedStatus, setSavedStatus] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(localKey.trim());
    onSaveProxyUrl(localProxy.trim());
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-orbital-surface border border-orbital-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-orbital-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key size={18} className="text-orbital-teal" />
            <h2 className="text-sm font-bold text-orbital-text">AI Copilot & Environment Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-orbital-muted hover:text-orbital-text p-1 rounded-lg hover:bg-orbital-elevated transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 text-xs font-sans">
          {/* API Key Safety Note */}
          <div className="bg-orbital-bg/80 border border-orbital-border p-3 rounded-xl flex items-start space-x-2.5">
            <Shield size={16} className="text-orbital-teal flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-orbital-muted leading-relaxed text-[11px]">
              <span className="font-semibold text-orbital-text block">Strict Key Security Compliance</span>
              <span>
                Your Gemini key is stored only in your browser's private local storage. It is never included in the production build bundle, S3 upload, or Git repository.
              </span>
            </div>
          </div>

          {/* Gemini API Key Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-orbital-text uppercase tracking-wider flex items-center justify-between">
              <span>Google Gemini API Key (Optional)</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orbital-teal hover:underline inline-flex items-center space-x-0.5 text-[10px] font-mono"
              >
                <span>Get Free Key</span>
                <ExternalLink size={9} />
              </a>
            </label>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-orbital-bg border border-orbital-border rounded-lg px-3 py-2 text-orbital-text font-mono text-xs focus:outline-none focus:border-orbital-teal"
            />
            <p className="text-[10px] text-orbital-muted">
              If left blank, TerraPulse uses its built-in deterministic action parser which mirrors the exact Gemini MapIntent schema offline.
            </p>
          </div>

          {/* Protected Proxy URL Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-orbital-text uppercase tracking-wider">
              Protected Proxy URL (Optional Lambda / Cloudflare Worker)
            </label>
            <input
              type="url"
              value={localProxy}
              onChange={(e) => setLocalProxy(e.target.value)}
              placeholder="https://my-proxy.workers.dev/gemini"
              className="w-full bg-orbital-bg border border-orbital-border rounded-lg px-3 py-2 text-orbital-text font-mono text-xs focus:outline-none focus:border-orbital-teal"
            />
          </div>

          {/* Clear Cache Button */}
          <div className="pt-2 border-t border-orbital-border flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-orbital-text">Reset Local Data Cache</div>
              <div className="text-[10px] text-orbital-muted">Clears cached USGS feeds and Open-Meteo forecasts</div>
            </div>
            <button
              type="button"
              onClick={onClearCache}
              className="px-3 py-1.5 rounded-lg border border-orbital-border hover:border-orbital-coral/40 text-orbital-muted hover:text-orbital-coral text-xs transition flex items-center space-x-1"
            >
              <RefreshCw size={12} />
              <span>Clear Cache</span>
            </button>
          </div>

          {/* Submit / Save */}
          <div className="pt-3 border-t border-orbital-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-orbital-border text-orbital-muted hover:text-orbital-text text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-orbital-teal text-[#070B12] font-semibold text-xs hover:brightness-110 transition flex items-center space-x-1"
            >
              {savedStatus ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
