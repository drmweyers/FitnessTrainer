'use client';

import React, { useState } from 'react';

/** Configuration shape for deload weeks */
export interface DeloadConfigData {
  enabled: boolean;
  /** How often a deload occurs, in weeks (e.g. 4 = every 4 weeks) */
  frequencyWeeks: number;
  /** Percentage reduction in intensity during deload (30–60) */
  intensityReduction: number;
  /** Percentage reduction in volume during deload (30–60) */
  volumeReduction: number;
}

interface DeloadConfigProps {
  onConfigChange: (config: DeloadConfigData) => void;
  initialConfig?: Partial<DeloadConfigData>;
}

const FREQUENCY_OPTIONS = [3, 4, 5, 6] as const;

const DEFAULT_CONFIG: DeloadConfigData = {
  enabled: false,
  frequencyWeeks: 4,
  intensityReduction: 40,
  volumeReduction: 50,
};

/**
 * DeloadConfig lets a trainer configure automatic deload weeks within a program.
 * Renders a toggle and, when enabled, sliders for intensity and volume reduction.
 */
const DeloadConfig: React.FC<DeloadConfigProps> = ({ onConfigChange, initialConfig }) => {
  const [config, setConfig] = useState<DeloadConfigData>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const updateConfig = (updates: Partial<DeloadConfigData>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    onConfigChange(next);
  };

  return (
    <div data-testid="deload-config" className="space-y-4">
      {/* Toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          aria-label="Enable automatic deload"
          checked={config.enabled}
          onChange={e => updateConfig({ enabled: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
        />
        <span className="text-sm font-medium text-gray-700">Enable automatic deload</span>
      </label>

      {/* Configuration — only shown when enabled */}
      {config.enabled && (
        <div className="space-y-4 pl-7">
          {/* Frequency */}
          <div>
            <label htmlFor="deload-frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              id="deload-frequency"
              aria-label="Frequency"
              value={config.frequencyWeeks}
              onChange={e => updateConfig({ frequencyWeeks: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {FREQUENCY_OPTIONS.map(n => (
                <option key={n} value={n}>
                  Every {n} weeks
                </option>
              ))}
            </select>
          </div>

          {/* Intensity slider */}
          <div>
            <label htmlFor="deload-intensity" className="block text-sm font-medium text-gray-700 mb-1">
              Deload intensity reduction: {config.intensityReduction}%
            </label>
            <input
              id="deload-intensity"
              aria-label="Deload intensity"
              type="range"
              min="30"
              max="60"
              step="5"
              value={config.intensityReduction}
              onChange={e => updateConfig({ intensityReduction: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30%</span>
              <span>60%</span>
            </div>
          </div>

          {/* Volume slider */}
          <div>
            <label htmlFor="deload-volume" className="block text-sm font-medium text-gray-700 mb-1">
              Deload volume reduction: {config.volumeReduction}%
            </label>
            <input
              id="deload-volume"
              aria-label="Deload volume"
              type="range"
              min="30"
              max="60"
              step="5"
              value={config.volumeReduction}
              onChange={e => updateConfig({ volumeReduction: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30%</span>
              <span>60%</span>
            </div>
          </div>

          {/* Preview text */}
          <div
            data-testid="deload-preview"
            className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800"
          >
            Week {config.frequencyWeeks} will be a deload:{' '}
            <strong>{config.intensityReduction}% intensity</strong>,{' '}
            <strong>{config.volumeReduction}% volume</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeloadConfig;
