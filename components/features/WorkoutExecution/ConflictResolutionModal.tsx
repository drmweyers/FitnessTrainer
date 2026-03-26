'use client';

import React from 'react';
import { GitMerge, Server, Smartphone, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/shared/Button';

type ConflictChoice = 'local' | 'server';

interface ConflictResolutionModalProps {
  /** The conflicting data versions */
  conflict: {
    local: Record<string, unknown>;
    server: Record<string, unknown>;
  };
  /** Called with the user's choice — 'local' or 'server'. Not called on cancel. */
  onResolve: (choice: ConflictChoice) => void;
}

/**
 * Renders a JSON-like snapshot of data for comparison.
 * Keeps it human-readable by showing key-value pairs.
 */
function DataSnapshot({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 font-mono space-y-1 overflow-auto max-h-48">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex space-x-2">
          <span className="text-blue-600 font-semibold">{key}:</span>
          <span className="break-all">{JSON.stringify(value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * ConflictResolutionModal.
 * Shows a side-by-side (or stacked on mobile) comparison between the server
 * and local versions of conflicting workout data, and lets the user choose which to keep.
 */
const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onResolve,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sync conflict resolution"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center space-x-2 p-4 border-b border-gray-200 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Sync Conflict Detected</h2>
        </div>

        {/* Explanation */}
        <div className="px-4 pt-3 pb-1 text-sm text-gray-600">
          <p>
            We found different versions of your workout data. Choose which version to keep.
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Server version */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
              <Server className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Server version</span>
            </div>
            <div className="p-3">
              <DataSnapshot data={conflict.server} />
            </div>
          </div>

          {/* Local (your) version */}
          <div className="border border-blue-200 rounded-xl overflow-hidden">
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border-b border-blue-200">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Your version</span>
            </div>
            <div className="p-3">
              <DataSnapshot data={conflict.local} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-gray-200">
          <Button
            className="flex-1"
            onClick={() => onResolve('local')}
            aria-label="Keep Mine"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Keep Mine
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onResolve('server')}
            aria-label="Keep Server"
          >
            <Server className="h-4 w-4 mr-2" />
            Keep Server
          </Button>

          <Button
            variant="outline"
            className="flex-1 text-gray-600"
            onClick={() => {/* no-op cancel */}}
            aria-label="Cancel"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;
