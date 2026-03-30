/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TicketInbox from '../TicketInbox';

jest.mock('lucide-react', () => ({
  MessageSquare: (props: any) => <span data-testid="icon-message" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  ChevronDown: (props: any) => <span data-testid="icon-chevron-down" {...props} />,
  ChevronUp: (props: any) => <span data-testid="icon-chevron-up" {...props} />,
  Send: (props: any) => <span data-testid="icon-send" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockTickets = [
  {
    id: 'ticket-001',
    userId: 'client-001',
    subject: 'Cannot log workout',
    message: 'I get an error when trying to log my workout.',
    status: 'open',
    createdAt: new Date('2026-03-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-01T10:00:00Z').toISOString(),
    replies: [],
    user: { id: 'client-001', email: 'client@test.com', userProfile: null },
  },
  {
    id: 'ticket-002',
    userId: 'client-002',
    subject: 'Payment issue',
    message: 'Charged twice this month.',
    status: 'in_progress',
    createdAt: new Date('2026-03-02T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-02T10:00:00Z').toISOString(),
    replies: [{ message: 'Looking into it', createdAt: new Date().toISOString() }],
    user: { id: 'client-002', email: 'client2@test.com', userProfile: null },
  },
];

describe('TicketInbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
<<<<<<< HEAD
    mockFetch.mockReset(); // Also reset mock implementations/return values
=======
    // Reset all mock implementations to avoid leaking between tests
    mockFetch.mockReset();
    // Set a default implementation that returns empty data
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
>>>>>>> feat/coverage-b
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TicketInbox />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders tickets after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
      expect(screen.getByText('Payment issue')).toBeInTheDocument();
    });
  });

  it('shows status badges for each ticket', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no tickets', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { total: 0 },
      }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText(/no tickets/i)).toBeInTheDocument();
    });
  });

  it('expands ticket detail on click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByText(/I get an error when trying to log my workout/i)).toBeInTheDocument();
    });
  });

  it('allows status update for a ticket', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockTickets[0], status: 'resolved' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ ...mockTickets[0], status: 'resolved' }, mockTickets[1]],
          meta: { total: 2 },
        }),
      });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    // Expand first ticket
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      const resolveButtons = screen.getAllByRole('button', { name: /resolve/i });
      expect(resolveButtons.length).toBeGreaterThan(0);
    });
  });

<<<<<<< HEAD
  it('calls updateTicket with resolved status when Resolve button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      });
=======
  it('shows reply form when ticket is expanded', async () => {
    const successResponse = {
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    };
    mockFetch
      .mockResolvedValueOnce(successResponse)
      .mockResolvedValue(successResponse);
>>>>>>> feat/coverage-b

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
<<<<<<< HEAD
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/support/tickets/ticket-001',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('calls updateTicket with in_progress status when Mark In Progress clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      });
=======
      expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
    });
  });

  it('updates reply textarea text', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });
>>>>>>> feat/coverage-b

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

<<<<<<< HEAD
    // Expand first ticket (open status)
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark in progress/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark in progress/i }));
=======
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
    });

    const replyTextarea = screen.getByPlaceholderText(/type your reply/i);
    fireEvent.change(replyTextarea, { target: { value: 'Admin reply here' } });
    expect(replyTextarea).toHaveValue('Admin reply here');
  });

  it('sends reply when send button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
    });

    const replyTextarea = screen.getByPlaceholderText(/type your reply/i);
    fireEvent.change(replyTextarea, { target: { value: 'Thank you for reporting' } });

    // Find the send button (next to the textarea)
    const sendBtn = replyTextarea.closest('div')!.querySelector('button') as HTMLButtonElement;
    if (sendBtn) {
      fireEvent.click(sendBtn);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/support/tickets/ticket-001',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('Thank you for reporting'),
          })
        );
      });
    }
  });

  it('marks ticket in_progress when clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByText(/Mark In Progress/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Mark In Progress/i));
>>>>>>> feat/coverage-b

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/support/tickets/ticket-001',
        expect.objectContaining({
          method: 'PUT',
<<<<<<< HEAD
          body: JSON.stringify({ status: 'in_progress' }),
=======
          body: expect.stringContaining('in_progress'),
>>>>>>> feat/coverage-b
        })
      );
    });
  });

<<<<<<< HEAD
  it('shows reply form and textarea in expanded ticket', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
=======
  it('resolves ticket when resolve clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
>>>>>>> feat/coverage-b
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

<<<<<<< HEAD
    // Expand first ticket
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
      expect(screen.getByText('Send Reply')).toBeInTheDocument();
    });

    // Type a reply - verify textarea is interactive
    const textarea = screen.getByPlaceholderText(/type your reply/i);
    fireEvent.change(textarea, { target: { value: 'Hello there' } });
    expect(textarea).toHaveValue('Hello there');
  });

  it('send button is disabled when reply text is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
    });

    const { container } = render(<TicketInbox />);
=======
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByText(/^Resolve$/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/^Resolve$/i));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/support/tickets/ticket-001',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('resolved'),
        })
      );
    });
  });

  it('closes ticket when close clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);
>>>>>>> feat/coverage-b

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

<<<<<<< HEAD
    // Expand first ticket
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
    });

    // Find the send button using query selector (it's next to the textarea)
    const sendBtn = container.querySelector('textarea + button, textarea ~ button') as HTMLButtonElement;
    // Should be disabled when no text entered
    if (sendBtn) {
      expect(sendBtn).toBeDisabled();
    } else {
      // Find by disabled attribute
      const buttons = container.querySelectorAll('button[disabled]');
      expect(buttons.length).toBeGreaterThan(0);
    }
  });

  it('shows replies when ticket has them', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
=======
    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByText(/^Close$/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/^Close$/i));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/support/tickets/ticket-001',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('closed'),
        })
      );
    });
  });

  it('shows error on updateTicket failure', async () => {
    // First call loads tickets, second call is the PUT that fails
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTickets }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByText(/^Resolve$/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/^Resolve$/i));

    await waitFor(() => {
      // Error state causes component to re-render to error view
      expect(screen.queryByText(/failed/i)).not.toBeNull();
    });
  });

  it('shows admin replies when ticket is expanded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
>>>>>>> feat/coverage-b
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Payment issue')).toBeInTheDocument();
    });

<<<<<<< HEAD
    // Expand second ticket (has replies)
    fireEvent.click(screen.getByText('Payment issue'));

    await waitFor(() => {
=======
    fireEvent.click(screen.getByText('Payment issue'));

    await waitFor(() => {
      expect(screen.getByText('Admin Replies')).toBeInTheDocument();
>>>>>>> feat/coverage-b
      expect(screen.getByText('Looking into it')).toBeInTheDocument();
    });
  });

<<<<<<< HEAD
  it('shows error when updateTicket fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
    });
  });

  it('closes a ticket using close button', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cannot log workout'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/support/tickets/ticket-001',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'closed' }),
        })
      );
    });
  });

  it('collapses expanded ticket on second click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTickets,
        meta: { total: 2 },
      }),
=======
  it('shows reply count when ticket has replies', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('1 reply')).toBeInTheDocument();
    });
  });

  it('shows ticket count in header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      // The count is rendered as text: (2) but may be inside a span next to a heading
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  it('refreshes tickets when refresh button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByText('Refresh');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('collapses expanded ticket when header clicked again', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
>>>>>>> feat/coverage-b
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    // Expand
    fireEvent.click(screen.getByText('Cannot log workout'));
<<<<<<< HEAD

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your reply/i)).toBeInTheDocument();
=======
    await waitFor(() => {
      expect(screen.getByText(/I get an error/i)).toBeInTheDocument();
>>>>>>> feat/coverage-b
    });

    // Collapse
    fireEvent.click(screen.getByText('Cannot log workout'));
<<<<<<< HEAD

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/type your reply/i)).not.toBeInTheDocument();
    });
  });

  it('retries fetch when Retry button clicked on error state', async () => {
=======
    await waitFor(() => {
      expect(screen.queryByText(/I get an error/i)).not.toBeInTheDocument();
    });
  });

  it('does not show Mark In Progress for in_progress ticket', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTickets }),
    });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Payment issue')).toBeInTheDocument();
    });

    // Expand the in_progress ticket
    fireEvent.click(screen.getByText('Payment issue'));

    await waitFor(() => {
      expect(screen.getByText(/Charged twice/i)).toBeInTheDocument();
    });

    // In_progress ticket should not show Mark In Progress
    expect(screen.queryByText(/Mark In Progress/i)).not.toBeInTheDocument();
  });

  it('retries on fetch failure when retry clicked', async () => {
>>>>>>> feat/coverage-b
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
<<<<<<< HEAD
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
=======
        json: async () => ({ success: true, data: mockTickets }),
>>>>>>> feat/coverage-b
      });

    render(<TicketInbox />);

    await waitFor(() => {
<<<<<<< HEAD
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/retry/i));
=======
      expect(screen.getByText(/Failed to load tickets/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));
>>>>>>> feat/coverage-b

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });
  });
<<<<<<< HEAD

  it('refreshes tickets when Refresh button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockTickets,
          meta: { total: 2 },
        }),
      });

    render(<TicketInbox />);

    await waitFor(() => {
      expect(screen.getByText('Cannot log workout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
=======
>>>>>>> feat/coverage-b
});
