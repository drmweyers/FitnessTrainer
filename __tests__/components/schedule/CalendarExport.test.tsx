/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarExport } from '@/components/schedule/CalendarExport';

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@test.com', role: 'trainer' },
    isAuthenticated: true,
  }),
}));

jest.mock('@/lib/api/auth', () => ({
  tokenUtils: {
    getTokens: jest.fn(() => ({ accessToken: 'mock-token', refreshToken: null })),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-blob');
global.URL.revokeObjectURL = jest.fn();

describe('CalendarExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Export to Calendar" button', () => {
    render(<CalendarExport />);
    expect(screen.getByText('Export to Calendar')).toBeInTheDocument();
  });

  it('opens dropdown with both options when clicked', () => {
    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));

    expect(screen.getByText('Download .ics')).toBeInTheDocument();
    expect(screen.getByText('Subscribe to Feed')).toBeInTheDocument();
  });

  it('triggers fetch when "Download .ics" is clicked', async () => {
    const mockBlob = new Blob(['VCALENDAR'], { type: 'text/calendar' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Download .ics'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/schedule/export/ics', {
        headers: { Authorization: 'Bearer mock-token' },
      });
    });
  });

  it('opens modal when "Subscribe to Feed" is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Subscribe to Calendar Feed')).toBeInTheDocument();
    });
  });

  it('copy button copies URL to clipboard', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('modal close button works', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Subscribe to Calendar Feed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Close'));

    expect(screen.queryByText('Subscribe to Calendar Feed')).not.toBeInTheDocument();
  });

  it('shows instructions for Google Calendar, Apple Calendar, and Outlook', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Google Calendar:')).toBeInTheDocument();
      expect(screen.getByText('Apple Calendar:')).toBeInTheDocument();
      expect(screen.getByText('Outlook:')).toBeInTheDocument();
    });
  });
});
