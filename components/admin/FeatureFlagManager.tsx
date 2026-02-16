'use client';

import { useState, useEffect } from 'react';
import { Flag, Plus, Trash2 } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'whatsapp_messaging',
    name: 'WhatsApp Messaging',
    description: 'Enable WhatsApp integration for client communication',
    enabled: true,
  },
  {
    id: 'pwa_features',
    name: 'PWA Features',
    description: 'Progressive Web App features (offline mode, install prompt)',
    enabled: true,
  },
  {
    id: 'payment_processing',
    name: 'Payment Processing',
    description: 'Enable payment and subscription features',
    enabled: false,
  },
];

export function FeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '' });

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('feature_flags');
    if (stored) {
      setFlags(JSON.parse(stored));
    } else {
      setFlags(DEFAULT_FLAGS);
      localStorage.setItem('feature_flags', JSON.stringify(DEFAULT_FLAGS));
    }
  }, []);

  const toggleFlag = (id: string) => {
    const updated = flags.map((flag) =>
      flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
    );
    setFlags(updated);
    localStorage.setItem('feature_flags', JSON.stringify(updated));
  };

  const addFlag = () => {
    if (!newFlag.name.trim()) return;

    const flag: FeatureFlag = {
      id: newFlag.name.toLowerCase().replace(/\s+/g, '_'),
      name: newFlag.name,
      description: newFlag.description,
      enabled: false,
    };

    const updated = [...flags, flag];
    setFlags(updated);
    localStorage.setItem('feature_flags', JSON.stringify(updated));
    setNewFlag({ name: '', description: '' });
    setShowAddDialog(false);
  };

  const deleteFlag = (id: string) => {
    const updated = flags.filter((flag) => flag.id !== id);
    setFlags(updated);
    localStorage.setItem('feature_flags', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Flag size={20} />
            Feature Flags
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage feature toggles and experimental features
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Flag
        </button>
      </div>

      {/* Flags Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {flags.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                  No feature flags configured
                </td>
              </tr>
            ) : (
              flags.map((flag) => (
                <tr key={flag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {flag.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{flag.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {flag.description}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => toggleFlag(flag.id)}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${flag.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                      <span className={`ml-3 text-sm font-medium ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {flag.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => deleteFlag(flag.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete flag"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Flag Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Add Feature Flag
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  placeholder="e.g., Advanced Analytics"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  placeholder="Describe what this feature does"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewFlag({ name: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addFlag}
                  disabled={!newFlag.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Flag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
