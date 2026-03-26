'use client';

import { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';
import {
  isWebAuthnSupported,
  hasCredentials,
  authenticateWithCredential,
} from '@/lib/auth/webauthn';

interface BiometricPromptProps {
  /** Called when biometric authentication succeeds */
  onSuccess: () => void;
  /** Called when biometric authentication fails */
  onError: (error?: string) => void;
}

/**
 * BiometricPrompt — displayed on the login page when the user has a registered
 * WebAuthn credential on the device. Allows fingerprint/face login.
 */
export default function BiometricPrompt({ onSuccess, onError }: BiometricPromptProps) {
  const [supported, setSupported] = useState(false);
  const [hasStored, setHasStored] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(isWebAuthnSupported());
    setHasStored(hasCredentials());
  }, []);

  if (!supported || !hasStored) return null;

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const success = await authenticateWithCredential();
      if (success) {
        onSuccess();
      } else {
        onError('Biometric authentication failed. Please try again.');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBiometricLogin}
      disabled={loading}
      aria-label="Biometric login"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Fingerprint className="h-5 w-5 text-blue-600" />
      {loading ? 'Authenticating...' : 'Use fingerprint / face'}
    </button>
  );
}
