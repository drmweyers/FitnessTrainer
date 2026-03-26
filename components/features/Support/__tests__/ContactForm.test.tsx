/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactForm from '../ContactForm';

jest.mock('lucide-react', () => ({
  Send: (props: any) => <span data-testid="icon-send" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  MessageSquare: (props: any) => <span data-testid="icon-message" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the contact form with required fields', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('shows validation error when subject is empty on submit', async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Test message content' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when message is empty on submit', async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Test subject' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/message is required/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'ticket-001', subject: 'Test', message: 'Test message', status: 'open' } }),
    });

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Payment issue' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'I was charged twice for this month.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/support/tickets',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Payment issue'),
        })
      );
    });
  });

  it('shows success message after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'ticket-001', subject: 'Test', message: 'Test msg', status: 'open' } }),
    });

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Test subject' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Test message content' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/ticket submitted/i)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Internal server error' }),
    });

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Test subject' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Test message content' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to submit/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      }), 100))
    );

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Test subject' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Test message content' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });
});
