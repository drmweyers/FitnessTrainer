/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

let mockAuthState: { user: { role: string } | null; isAuthenticated: boolean } = {
  user: { role: 'client' },
  isAuthenticated: true,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

let mockFetchResponse: any = null;

beforeEach(() => {
  mockAuthState = { user: { role: 'client' }, isAuthenticated: true };
  mockFetchResponse = null;
  Object.defineProperty(window, 'localStorage', {
    value: { getItem: jest.fn(() => 'test-token') },
    writable: true,
  });
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockFetchResponse),
    })
  ) as jest.Mock;
});

import ClientWhatsAppFloat from '../ClientWhatsAppFloat';

describe('ClientWhatsAppFloat', () => {
  it('renders nothing when user is not a client', async () => {
    mockAuthState = { user: { role: 'trainer' }, isAuthenticated: true };
    const { container } = render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders nothing when user is not authenticated', async () => {
    mockAuthState = { user: null, isAuthenticated: false };
    const { container } = render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders nothing when trainer has no WhatsApp configured', async () => {
    mockFetchResponse = {
      success: true,
      data: { name: 'Coach', whatsappNumber: null, whatsappLink: null },
    };
    const { container } = render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders direct chat button when trainer has only phone number', async () => {
    mockFetchResponse = {
      success: true,
      data: { name: 'Coach Sarah', whatsappNumber: '+1234567890', whatsappLink: null },
    };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      const link = screen.getByLabelText('Chat with Coach Sarah');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', expect.stringContaining('wa.me/1234567890'));
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('renders community button when trainer has only community link', async () => {
    mockFetchResponse = {
      success: true,
      data: { name: 'Coach', whatsappNumber: null, whatsappLink: 'https://chat.whatsapp.com/ABC123' },
    };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      const link = screen.getByLabelText('Join Community');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://chat.whatsapp.com/ABC123');
    });
  });

  it('renders expandable menu when trainer has both number and community', async () => {
    mockFetchResponse = {
      success: true,
      data: {
        name: 'Coach Sarah',
        whatsappNumber: '+1234567890',
        whatsappLink: 'https://chat.whatsapp.com/ABC123',
      },
    };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      const button = screen.getByLabelText('WhatsApp options');
      expect(button).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('WhatsApp options'));

    expect(screen.getByText('Direct Message')).toBeInTheDocument();
    expect(screen.getByText('Join Community')).toBeInTheDocument();
    expect(screen.getByText('Contact Coach Sarah')).toBeInTheDocument();
  });

  it('closes menu when clicking outside', async () => {
    mockFetchResponse = {
      success: true,
      data: {
        name: 'Coach',
        whatsappNumber: '+1234567890',
        whatsappLink: 'https://chat.whatsapp.com/ABC123',
      },
    };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      screen.getByLabelText('WhatsApp options');
    });

    fireEvent.click(screen.getByLabelText('WhatsApp options'));
    expect(screen.getByText('Direct Message')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Direct Message')).not.toBeInTheDocument();
    });
  });

  it('prefixes https:// to community links without protocol', async () => {
    mockFetchResponse = {
      success: true,
      data: { name: 'Coach', whatsappNumber: null, whatsappLink: 'chat.whatsapp.com/ABC123' },
    };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      const link = screen.getByLabelText('Join Community');
      expect(link).toHaveAttribute('href', 'https://chat.whatsapp.com/ABC123');
    });
  });

  it('includes pre-filled message in direct chat URL', async () => {
    mockFetchResponse = {
      success: true,
      data: { name: 'Coach Sarah', whatsappNumber: '+1234567890', whatsappLink: null },
    };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      const link = screen.getByLabelText('Chat with Coach Sarah');
      expect(link).toHaveAttribute('href', expect.stringContaining('text='));
      expect(link).toHaveAttribute('href', expect.stringContaining('Coach%20Sarah'));
    });
  });

  it('sends auth token when fetching trainer info', async () => {
    mockFetchResponse = { success: true, data: null };
    render(<ClientWhatsAppFloat />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/clients/trainer', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
    });
  });
});
