/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RescheduleButton } from '@/components/schedule/RescheduleButton';
import { tokenUtils } from '@/lib/api/auth';

jest.mock('@/lib/api/auth', () => ({
  tokenUtils: {
    getTokens: jest.fn(() => ({ accessToken: 'mock-token' })),
  },
}));

global.fetch = jest.fn();

describe('RescheduleButton', () => {
  const mockProps = {
    appointmentId: 'appt-1',
    currentStart: '2026-02-20T10:00:00Z',
    currentEnd: '2026-02-20T11:00:00Z',
    onReschedule: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render reschedule button', () => {
    render(<RescheduleButton {...mockProps} />);
    expect(screen.getByText('Reschedule')).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', () => {
    render(<RescheduleButton {...mockProps} />);

    fireEvent.click(screen.getByText('Reschedule'));

    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Start Date & Time')).toBeInTheDocument();
    expect(screen.getByText('End Date & Time')).toBeInTheDocument();
  });

  it('should submit reschedule request', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: {} }),
    });

    render(<RescheduleButton {...mockProps} />);

    fireEvent.click(screen.getByText('Reschedule'));

    const submitButton = screen.getAllByText('Reschedule')[1];
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/schedule/appointments/appt-1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('should display error message on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: false, error: 'Time slot conflicts' }),
    });

    render(<RescheduleButton {...mockProps} />);

    fireEvent.click(screen.getByText('Reschedule'));

    const submitButton = screen.getAllByText('Reschedule')[1];
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Time slot conflicts')).toBeInTheDocument();
    });
  });

  it('should close dialog on cancel', () => {
    render(<RescheduleButton {...mockProps} />);

    fireEvent.click(screen.getByText('Reschedule'));
    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Reschedule Appointment')).not.toBeInTheDocument();
  });
});
