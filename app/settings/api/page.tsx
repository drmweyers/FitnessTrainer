'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTier } from '@/hooks/useTier';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface CreateKeyResponse {
  id: string;
  name: string;
  permissions: string[];
  expiresAt: string | null;
  createdAt: string;
  token: string;
}

/** Format an ISO date string for display. */
function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * API Keys settings page — Enterprise tier only.
 * Allows trainers to create, view, and revoke API keys for programmatic access.
 */
export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { isEnterprise, isLoading: tierLoading } = useTier();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Newly created token — shown once
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? json?.error ?? 'Failed to load API keys');
        return;
      }
      setKeys(json.data ?? []);
    } catch {
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.id && isEnterprise) {
      loadKeys();
    } else if (user?.id && !tierLoading) {
      setIsLoading(false);
    }
  }, [user?.id, isEnterprise, tierLoading, loadKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      setCreateError('Name is required');
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const body: Record<string, unknown> = { name: newKeyName.trim() };
      if (newKeyExpiry) body.expiresAt = new Date(newKeyExpiry).toISOString();

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json?.error ?? 'Failed to create API key');
        return;
      }
      const created: CreateKeyResponse = json.data;
      setCreatedToken(created.token);
      setShowCreateModal(false);
      setNewKeyName('');
      setNewKeyExpiry('');
      await loadKeys();
    } catch {
      setCreateError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    if (!confirm(`Revoke API key "${keyName}"? This cannot be undone.`)) return;
    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json?.error ?? 'Failed to revoke key');
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch {
      alert('Failed to revoke key');
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout title="API Keys">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tierLoading && !isEnterprise) {
    return (
      <DashboardLayout title="API Keys">
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-white rounded-2xl shadow p-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              API Access is Enterprise-Only
            </h1>
            <p className="text-gray-500 mb-6">
              Upgrade to Enterprise to create and manage API keys for programmatic access to EvoFit Trainer.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Upgrade to Enterprise
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="API Keys">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage API keys for programmatic access to EvoFit Trainer.
            </p>
          </div>
          <Button
            onClick={() => { setShowCreateModal(true); setCreateError(null); }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            data-testid="create-api-key-btn"
          >
            Create New Key
          </Button>
        </div>

        {/* One-time token display */}
        {createdToken && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg" data-testid="new-key-banner">
            <p className="text-amber-800 font-semibold mb-1">
              Save this key now — it will not be shown again.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code
                className="flex-1 bg-white border border-amber-200 rounded px-3 py-2 text-sm font-mono break-all"
                data-testid="new-key-value"
              >
                {createdToken}
              </code>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="shrink-0"
                data-testid="copy-key-btn"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <button
              className="mt-3 text-sm text-amber-700 underline"
              onClick={() => setCreatedToken(null)}
            >
              I have saved my key — dismiss
            </button>
          </div>
        )}

        {/* Keys list */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : keys.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center" data-testid="no-keys-message">
                No API keys yet. Create one to get started.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between py-4"
                    data-testid={`key-row-${k.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{k.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Created: {formatDate(k.createdAt)}
                        {' · '}
                        Last used: {formatDate(k.lastUsedAt)}
                        {k.expiresAt && (
                          <>
                            {' · '}
                            Expires: {formatDate(k.expiresAt)}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="ml-4 shrink-0 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleRevoke(k.id, k.name)}
                      disabled={revokingId === k.id}
                      data-testid={`revoke-key-${k.id}`}
                    >
                      {revokingId === k.id ? 'Revoking...' : 'Revoke'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create key modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            data-testid="create-key-modal"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Create API Key</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My Integration"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    data-testid="key-name-input"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    data-testid="key-expiry-input"
                  />
                </div>

                {createError && (
                  <p className="text-red-500 text-sm" data-testid="create-key-error">
                    {createError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  data-testid="confirm-create-key-btn"
                >
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowCreateModal(false); setCreateError(null); setNewKeyName(''); setNewKeyExpiry(''); }}
                  disabled={isCreating}
                  data-testid="cancel-create-key-btn"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
