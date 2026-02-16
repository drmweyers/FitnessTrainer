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

    // Find toggle buttons - they have the rounded toggle switch styling
    const allButtons = screen.getAllByRole('button');

    // The toggle buttons have the bg-blue-600 or bg-gray-200 classes
    // But we need to test that clicking causes a change in localStorage
    const initialFlags = JSON.parse(localStorage.getItem('feature_flags') || '[]');
    const whatsappFlagIndex = initialFlags.findIndex((f: any) => f.id === 'whatsapp_messaging');
    const initialEnabled = initialFlags[whatsappFlagIndex]?.enabled;

    // Find the toggle switch for WhatsApp (it's in the row with "WhatsApp Messaging")
    const whatsappRow = screen.getByText('WhatsApp Messaging').closest('tr');
    const toggleButton = whatsappRow!.querySelector('button[class*="bg-"]');

    fireEvent.click(toggleButton!);

    // After toggle, localStorage should be updated
    await waitFor(() => {
      const updatedFlags = JSON.parse(localStorage.getItem('feature_flags') || '[]');
      const updatedEnabled = updatedFlags[whatsappFlagIndex]?.enabled;
      expect(updatedEnabled).toBe(!initialEnabled);
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
