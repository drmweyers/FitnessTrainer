'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  isWebAuthnSupported,
  getStoredCredentials,
  registerCredential,
  removeCredential,
  WebAuthnCredential,
} from '@/lib/auth/webauthn';

interface BiometricSettingsProps {
  userId: string;
  userEmail: string;
}

/**
 * BiometricSettings — manage passkeys (WebAuthn credentials) for the current device.
 */
export default function BiometricSettings({ userId, userEmail }: BiometricSettingsProps) {
  const [supported] = useState(() => isWebAuthnSupported());
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setCredentials(getStoredCredentials());
  }, []);

  const handleRegister = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const credential = await registerCredential(userId, userEmail);
      if (credential) {
        setCredentials(getStoredCredentials());
        setStatus({ type: 'success', message: 'Device registered successfully!' });
      } else {
        setStatus({ type: 'error', message: 'Registration failed. Please try again.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (credentialId: string) => {
    removeCredential(credentialId);
    setCredentials(getStoredCredentials());
  };

  if (!supported) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Fingerprint className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Biometric Login</h2>
        </div>
        <p className="text-sm text-gray-500">
          Biometric authentication is not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <Fingerprint className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Biometric Login</h2>
      </div>

      <p className="text-sm text-gray-500">
        Use your device fingerprint or face recognition to log in without a password.
      </p>

      {/* Status message */}
      {status && (
        <div
          className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {status.message}
        </div>
      )}

      {/* Registered credentials */}
      {credentials.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Registered devices</p>
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {credentials.map((cred) => (
              <li key={cred.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{cred.name}</p>
                  <p className="text-xs text-gray-500">
                    Added {new Date(cred.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(cred.id)}
                  aria-label="Remove device"
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Register button */}
      <button
        type="button"
        onClick={handleRegister}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-4 w-4" />
        {loading ? 'Registering...' : 'Register this device'}
      </button>
    </div>
  );
}
