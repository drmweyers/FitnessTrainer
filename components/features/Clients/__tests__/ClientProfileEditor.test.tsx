/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientProfileEditor from '../ClientProfileEditor';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const defaultClient = {
  clientId: 'client-123',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0100',
  goals: 'Lose 10kg, improve cardio fitness',
  limitations: 'Lower back pain',
  notes: 'Prefers morning sessions',
};

describe('ClientProfileEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    clientId: defaultClient.clientId,
    initialData: {
      emergencyContactName: defaultClient.emergencyContactName,
      emergencyContactPhone: defaultClient.emergencyContactPhone,
      goals: defaultClient.goals,
      limitations: defaultClient.limitations,
      notes: defaultClient.notes,
    },
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('renders edit form with pre-filled values', () => {
    render(<ClientProfileEditor {...defaultProps} />);
    expect(screen.getByDisplayValue(defaultClient.emergencyContactName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(defaultClient.emergencyContactPhone)).toBeInTheDocument();
    expect(screen.getByDisplayValue(defaultClient.goals)).toBeInTheDocument();
    expect(screen.getByDisplayValue(defaultClient.limitations)).toBeInTheDocument();
    expect(screen.getByDisplayValue(defaultClient.notes)).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    render(<ClientProfileEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<ClientProfileEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('renders form field labels', () => {
    render(<ClientProfileEditor {...defaultProps} />);
    expect(screen.getByLabelText(/emergency contact name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/emergency contact phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/limitations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('updates field values when user types', () => {
    render(<ClientProfileEditor {...defaultProps} />);
    const goalsField = screen.getByLabelText(/goals/i);
    fireEvent.change(goalsField, { target: { value: 'Build muscle mass' } });
    expect(goalsField).toHaveValue('Build muscle mass');
  });

  it('calls onSave after successful API call', async () => {
    render(<ClientProfileEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('submits correct data to the API', async () => {
    render(<ClientProfileEditor {...defaultProps} />);

    const goalsField = screen.getByLabelText(/goals/i);
    fireEvent.change(goalsField, { target: { value: 'Run a marathon' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/clients/${defaultClient.clientId}/profile`,
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: expect.stringContaining('Run a marathon'),
        })
      );
    });
  });

  it('shows a saving indicator while the request is in flight', async () => {
    // Delay the fetch response
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({ success: true }) }), 200))
    );

    render(<ClientProfileEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows an error message when the API call fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    render(<ClientProfileEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('renders with empty initial data', () => {
    render(
      <ClientProfileEditor
        clientId="client-456"
        initialData={{}}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
