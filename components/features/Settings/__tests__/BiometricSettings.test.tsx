/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BiometricSettings from '../BiometricSettings';

jest.mock('@/lib/auth/webauthn', () => ({
  isWebAuthnSupported: jest.fn(() => true),
  getStoredCredentials: jest.fn(() => []),
  registerCredential: jest.fn(() => Promise.resolve({ id: 'cred-1', name: 'test@example.com', createdAt: Date.now() })),
  removeCredential: jest.fn(),
}));

import * as webauthn from '@/lib/auth/webauthn';

const mockedWebauthn = webauthn as jest.Mocked<typeof webauthn>;

describe('BiometricSettings', () => {
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedWebauthn.isWebAuthnSupported.mockReturnValue(true);
    mockedWebauthn.getStoredCredentials.mockReturnValue([]);
  });

  it('renders the biometric settings panel', () => {
    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);
    expect(screen.getByText(/biometric login/i)).toBeInTheDocument();
  });

  it('shows register device button', () => {
    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);
    expect(screen.getByRole('button', { name: /register this device/i })).toBeInTheDocument();
  });

  it('shows unsupported message when WebAuthn is not supported', () => {
    mockedWebauthn.isWebAuthnSupported.mockReturnValue(false);
    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
  });

  it('calls registerCredential when register button is clicked', async () => {
    mockedWebauthn.registerCredential.mockResolvedValueOnce({
      id: 'new-cred-id',
      name: mockUserEmail,
      createdAt: Date.now(),
    });

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    const registerBtn = screen.getByRole('button', { name: /register this device/i });
    await userEvent.click(registerBtn);

    await waitFor(() => {
      expect(mockedWebauthn.registerCredential).toHaveBeenCalledWith(mockUserId, mockUserEmail);
    });
  });

  it('shows registered device in list', () => {
    const credentials = [
      { id: 'cred-1', name: 'test@example.com', createdAt: Date.now() },
    ];
    mockedWebauthn.getStoredCredentials.mockReturnValue(credentials);

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls removeCredential when remove button is clicked', async () => {
    const credentials = [
      { id: 'cred-1', name: 'test@example.com', createdAt: Date.now() },
    ];
    mockedWebauthn.getStoredCredentials.mockReturnValue(credentials);

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    const removeBtn = screen.getByRole('button', { name: /remove/i });
    await userEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockedWebauthn.removeCredential).toHaveBeenCalledWith('cred-1');
    });
  });

  it('shows success message after successful registration', async () => {
    mockedWebauthn.registerCredential.mockResolvedValueOnce({
      id: 'new-cred',
      name: mockUserEmail,
      createdAt: Date.now(),
    });

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    const registerBtn = screen.getByRole('button', { name: /register this device/i });
    await userEvent.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByText(/device registered/i)).toBeInTheDocument();
    });
  });

  it('shows error message when registration fails', async () => {
    mockedWebauthn.registerCredential.mockResolvedValueOnce(null);

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    const registerBtn = screen.getByRole('button', { name: /register this device/i });
    await userEvent.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('shows error message when registration throws an error', async () => {
    mockedWebauthn.registerCredential.mockRejectedValueOnce(new Error('User cancelled'));

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    const registerBtn = screen.getByRole('button', { name: /register this device/i });
    await userEvent.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while registering', async () => {
    mockedWebauthn.registerCredential.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'cred-x', name: 'x', createdAt: 0 }), 200))
    );

    render(<BiometricSettings userId={mockUserId} userEmail={mockUserEmail} />);

    const registerBtn = screen.getByRole('button', { name: /register this device/i });
    await userEvent.click(registerBtn);

    // During loading
    expect(registerBtn).toBeDisabled();

    await waitFor(() => {
      expect(registerBtn).not.toBeDisabled();
    });
  });
});
