/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';

describe('FeatureFlagManager', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render with default flags when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Messaging')).toBeInTheDocument();
      expect(screen.getByText('PWA Features')).toBeInTheDocument();
    });
  });

  it('should load flags from API on mount', async () => {
    const apiFlags = [
      { id: 'custom_flag', name: 'Custom Flag', description: 'API flag', enabled: true },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { flags: apiFlags } }),
    });

    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('Custom Flag')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/feature-flags');
  });

  it('should toggle flag on/off and call API', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API unavailable'));

    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Messaging')).toBeInTheDocument();
    });

    // Reset fetch mock for the toggle call
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    const whatsappRow = screen.getByText('WhatsApp Messaging').closest('tr');
    const toggleButton = whatsappRow!.querySelector('button[class*="bg-"]');

    fireEvent.click(toggleButton!);

    await waitFor(() => {
      const updatedFlags = JSON.parse(localStorage.getItem('feature_flags') || '[]');
      const whatsappFlag = updatedFlags.find((f: any) => f.id === 'whatsapp_messaging');
      expect(whatsappFlag?.enabled).toBe(false);
    });

    // Should have called PUT to API
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/feature-flags', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('should open add flag dialog', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API unavailable'));

    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Flag');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Feature Flag')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Advanced Analytics/i)).toBeInTheDocument();
  });

  it('should add new flag and save to API', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API unavailable'));

    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    fireEvent.click(screen.getByText('Add Flag'));

    const nameInput = screen.getByPlaceholderText(/Advanced Analytics/i);
    const descInput = screen.getByPlaceholderText(/Describe what this feature does/i);

    fireEvent.change(nameInput, { target: { value: 'New Feature' } });
    fireEvent.change(descInput, { target: { value: 'Test description' } });

    const addButton = screen.getAllByText('Add Flag')[1];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('New Feature')).toBeInTheDocument();
    });
  });

  it('should persist flags to localStorage', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API unavailable'));

    render(<FeatureFlagManager />);

    await waitFor(() => {
      const stored = localStorage.getItem('feature_flags');
      expect(stored).toBeTruthy();
      const flags = JSON.parse(stored!);
      expect(flags.length).toBeGreaterThan(0);
    });
  });

  it('should delete flag and save to API', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API unavailable'));

    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Messaging')).toBeInTheDocument();
    });

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    // Click the first delete button
    const deleteButtons = screen.getAllByTitle('Delete flag');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('WhatsApp Messaging')).not.toBeInTheDocument();
    });
  });
});
