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

  it('handles download failure gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Download .ics'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to download ICS:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('sets feed URL from server response when subscribe fetch succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'server-feed-token-123' }),
    });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Subscribe to Calendar Feed')).toBeInTheDocument();
    });

    // Feed URL should contain the server token
    const input = screen.getByDisplayValue(/server-feed-token-123/);
    expect(input).toBeInTheDocument();
  });

  it('uses fallback URL when subscribe fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Subscribe to Calendar Feed')).toBeInTheDocument();
    });

    // Should use fallback URL
    const input = screen.getByDisplayValue(/your-feed-token/);
    expect(input).toBeInTheDocument();
  });

  it('uses clipboard fallback when clipboard API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    // Make clipboard.writeText fail
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard denied'));

    // Mock document.querySelector to return an input element
    const mockInput = {
      select: jest.fn(),
      value: 'http://localhost/api/schedule/feed/your-feed-token',
    };
    const querySelectorSpy = jest.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '[data-feed-url]') return mockInput as any;
      return null;
    });

    // Mock execCommand
    Object.defineProperty(document, 'execCommand', { value: jest.fn(() => true), writable: true, configurable: true });

    render(<CalendarExport />);

    fireEvent.click(screen.getByText('Export to Calendar'));
    fireEvent.click(screen.getByText('Subscribe to Feed'));

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(mockInput.select).toHaveBeenCalled();
    });

    querySelectorSpy.mockRestore();
  });
});
