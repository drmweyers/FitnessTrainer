/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportButton from '../ReportButton';

jest.mock('lucide-react', () => ({
  Flag: (props: any) => <span data-testid="icon-flag" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Send: (props: any) => <span data-testid="icon-send" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ReportButton', () => {
  const defaultProps = {
    contentType: 'exercise' as const,
    contentId: 'exercise-uuid-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the report flag button', () => {
    render(<ReportButton {...defaultProps} />);

    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
  });

  it('opens modal when report button is clicked', () => {
    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    expect(screen.getByText(/report content/i)).toBeInTheDocument();
  });

  it('renders reason dropdown with options', () => {
    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    const select = screen.getByLabelText(/reason/i);
    expect(select).toBeInTheDocument();
  });

  it('renders notes textarea in modal', () => {
    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));
    expect(screen.getByText(/report content/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText(/report content/i)).not.toBeInTheDocument();
  });

  it('submits report with selected reason', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'report-001' } }),
    });

    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    const select = screen.getByLabelText(/reason/i);
    fireEvent.change(select, { target: { value: 'inappropriate' } });

    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reports',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('inappropriate'),
        })
      );
    });
  });

  it('shows success feedback after report submitted', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'report-001' } }),
    });

    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    const select = screen.getByLabelText(/reason/i);
    fireEvent.change(select, { target: { value: 'incorrect' } });

    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
    });
  });

  it('shows error when submission fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Server error' }),
    });

    render(<ReportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /report/i }));

    const select = screen.getByLabelText(/reason/i);
    fireEvent.change(select, { target: { value: 'broken' } });

    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to submit/i)).toBeInTheDocument();
    });
  });

  it('handles program content type', () => {
    render(<ReportButton contentType="program" contentId="program-uuid-456" />);

    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
  });
});
