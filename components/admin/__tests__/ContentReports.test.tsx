/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentReports from '../ContentReports';

jest.mock('lucide-react', () => ({
  Flag: (props: any) => <span data-testid="icon-flag" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
  Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockReports = [
  {
    id: 'report-001',
    reporterId: 'client-001',
    contentType: 'exercise',
    contentId: 'exercise-001',
    reason: 'inappropriate',
    notes: 'This is offensive content.',
    status: 'pending',
    createdAt: new Date('2026-03-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-01T10:00:00Z').toISOString(),
    reporter: { id: 'client-001', email: 'client@test.com' },
  },
  {
    id: 'report-002',
    reporterId: 'client-002',
    contentType: 'program',
    contentId: 'program-001',
    reason: 'incorrect',
    notes: null,
    status: 'resolved',
    createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-02T12:00:00Z').toISOString(),
    reporter: { id: 'client-002', email: 'client2@test.com' },
  },
];

describe('ContentReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<ContentReports />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders reports table after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReports,
        meta: { total: 2 },
      }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('inappropriate')).toBeInTheDocument();
      expect(screen.getByText('incorrect')).toBeInTheDocument();
    });
  });

  it('shows reporter email for each report', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReports,
        meta: { total: 2 },
      }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('client@test.com')).toBeInTheDocument();
      expect(screen.getByText('client2@test.com')).toBeInTheDocument();
    });
  });

  it('shows content type badges', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReports,
        meta: { total: 2 },
      }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('exercise')).toBeInTheDocument();
      expect(screen.getByText('program')).toBeInTheDocument();
    });
  });

  it('shows resolve button for pending reports', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReports,
        meta: { total: 2 },
      }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });
  });

  it('resolves a report when resolve button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReports,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockReports[0], status: 'resolved' },
        }),
      });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reports/report-001',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('resolved'),
        })
      );
    });
  });

  it('shows empty state when no reports', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { total: 0 },
      }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText(/no reports/i)).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows error when resolve API call fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockReports }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to resolve report/i)).toBeInTheDocument();
    });
  });

  it('shows reviewing status badge correctly', async () => {
    const reviewingReport = {
      ...mockReports[0],
      id: 'report-003',
      status: 'reviewing' as const,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [reviewingReport] }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('reviewing')).toBeInTheDocument();
    });
  });

  it('shows dismissed status text for dismissed reports', async () => {
    const dismissedReport = {
      ...mockReports[0],
      id: 'report-004',
      status: 'dismissed' as const,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [dismissedReport] }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('Dismissed')).toBeInTheDocument();
    });
  });

  it('shows Resolved text for resolved reports', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [mockReports[1]] }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });
  });

  it('shows note view button when notes exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [mockReports[0]] }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
    });
  });

  it('does not show note view button when notes are null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [mockReports[1]] }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.queryByTestId('icon-eye')).not.toBeInTheDocument();
    });
  });

  it('shows report count in header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockReports }),
    });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });
  });

  it('retries on error when retry button clicked', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockReports }),
      });

    render(<ContentReports />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load reports/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('inappropriate')).toBeInTheDocument();
    });
  });
});
