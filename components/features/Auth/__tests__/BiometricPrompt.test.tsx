/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BiometricPrompt from '../BiometricPrompt';

jest.mock('@/lib/auth/webauthn', () => ({
  isWebAuthnSupported: jest.fn(() => true),
  hasCredentials: jest.fn(() => true),
  authenticateWithCredential: jest.fn(() => Promise.resolve(true)),
}));

import * as webauthn from '@/lib/auth/webauthn';

const mockedWebauthn = webauthn as jest.Mocked<typeof webauthn>;

describe('BiometricPrompt', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedWebauthn.isWebAuthnSupported.mockReturnValue(true);
    mockedWebauthn.hasCredentials.mockReturnValue(true);
  });

  it('renders biometric login button when supported and credentials exist', () => {
    render(<BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />);
    expect(screen.getByRole('button', { name: /biometric/i })).toBeInTheDocument();
  });

  it('renders nothing when WebAuthn is not supported', () => {
    mockedWebauthn.isWebAuthnSupported.mockReturnValue(false);
    const { container } = render(
      <BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no credentials are registered', () => {
    mockedWebauthn.hasCredentials.mockReturnValue(false);
    const { container } = render(
      <BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onSuccess when biometric auth succeeds', async () => {
    mockedWebauthn.authenticateWithCredential.mockResolvedValueOnce(true);
    render(<BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />);

    const button = screen.getByRole('button', { name: /biometric/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockedWebauthn.authenticateWithCredential).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls onError when biometric auth fails', async () => {
    mockedWebauthn.authenticateWithCredential.mockResolvedValueOnce(false);
    render(<BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />);

    const button = screen.getByRole('button', { name: /biometric/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('calls onError when biometric auth throws', async () => {
    mockedWebauthn.authenticateWithCredential.mockRejectedValueOnce(
      new Error('Auth error')
    );
    render(<BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />);

    const button = screen.getByRole('button', { name: /biometric/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('shows loading state while authenticating', async () => {
    let resolveAuth!: (value: boolean) => void;
    const pendingAuth = new Promise<boolean>((resolve) => {
      resolveAuth = resolve;
    });
    mockedWebauthn.authenticateWithCredential.mockReturnValueOnce(pendingAuth);

    render(<BiometricPrompt onSuccess={mockOnSuccess} onError={mockOnError} />);

    const button = screen.getByRole('button', { name: /biometric/i });
    await userEvent.click(button);

    expect(screen.getByRole('button')).toBeDisabled();

    resolveAuth(true);
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});
