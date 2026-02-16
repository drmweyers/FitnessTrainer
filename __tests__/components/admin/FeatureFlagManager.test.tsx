/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';

describe('FeatureFlagManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render with default flags', async () => {
    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Messaging')).toBeInTheDocument();
      expect(screen.getByText('PWA Features')).toBeInTheDocument();
      expect(screen.getByText('Payment Processing')).toBeInTheDocument();
    });
  });

  it('should toggle flag on/off', async () => {
    render(<FeatureFlagManager />);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Messaging')).toBeInTheDocument();
    });

    const toggles = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('bg-blue-600') || btn.classList.contains('bg-gray-200')
    );

    const firstToggle = toggles[0];
    const initialClass = firstToggle.className;

    fireEvent.click(firstToggle);

    await waitFor(() => {
      expect(firstToggle.className).not.toBe(initialClass);
    });
  });

  it('should open add flag dialog', async () => {
    render(<FeatureFlagManager />);

    const addButton = screen.getByText('Add Flag');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Feature Flag')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Advanced Analytics/i)).toBeInTheDocument();
  });

  it('should add new flag', async () => {
    render(<FeatureFlagManager />);

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
    render(<FeatureFlagManager />);

    await waitFor(() => {
      const stored = localStorage.getItem('feature_flags');
      expect(stored).toBeTruthy();
      const flags = JSON.parse(stored!);
      expect(flags.length).toBeGreaterThan(0);
    });
  });
});
