import React, { useState } from 'react';
import { X, Key, Cloud, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  region: string;
  onSaveRegion: (region: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  region,
  onSaveRegion,
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localRegion, setLocalRegion] = useState(region);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(localKey);
    onSaveRegion(localRegion);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl border border-subsea-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-subsea-border">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-subsea-cyan" />
            <h2 className="text-base font-bold text-subsea-text">
              Amazon Location Service Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-subsea-muted hover:text-subsea-text hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-subsea-muted">
          <div>
            <label className="block text-xs font-semibold text-subsea-text mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-subsea-cyan" />
              Amazon Location API Key (Optional)
            </label>
            <input
              type="text"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="v1.public.eyJraWQiOi..."
              className="w-full p-2.5 rounded-lg bg-black/50 border border-subsea-border text-subsea-text font-mono text-xs focus:outline-none focus:border-subsea-cyan/60"
            />
            <p className="text-[11px] text-subsea-muted mt-1.5 leading-relaxed">
              Enables the Amazon Location Service Maps v2 Dark Style descriptor. If blank, TerraPulse uses the high-contrast offline scientific canvas fallback.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-subsea-text mb-1.5">
              AWS Region
            </label>
            <select
              value={localRegion}
              onChange={(e) => setLocalRegion(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-black/50 border border-subsea-border text-subsea-text font-mono text-xs focus:outline-none focus:border-subsea-cyan/60"
            >
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-subsea-muted">
            Keys are saved in browser <code>localStorage</code> and are never transmitted to third-party endpoints or logged.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-subsea-border bg-black/30 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-subsea-muted hover:text-subsea-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-subsea-cyan text-black hover:bg-subsea-cyan/90 transition-colors flex items-center gap-1.5 shadow-glow-cyan"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved
              </>
            ) : (
              'Save & Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
