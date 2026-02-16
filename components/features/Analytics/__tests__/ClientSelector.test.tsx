/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientSelector from '../ClientSelector';

// Mock the fetch API
global.fetch = jest.fn();

describe('ClientSelector', () => {
  const mockOnClientChange = jest.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
    localStorage.setItem('accessToken', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderWithProvider(
      <ClientSelector selectedClientId={null} onClientChange={mockOnClientChange} />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders client dropdown after fetching', async () => {
    const mockClients = [
      { id: 'client-1', email: 'client1@test.com', profile: { firstName: 'John', lastName: 'Doe' } },
      { id: 'client-2', email: 'client2@test.com', profile: { firstName: 'Jane', lastName: 'Smith' } },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockClients }),
    });

    renderWithProvider(
      <ClientSelector selectedClientId={null} onClientChange={mockOnClientChange} />
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    expect(screen.getByText(/my data/i)).toBeInTheDocument();
  });

  it('calls onClientChange when selecting a client', async () => {
    const mockClients = [
      { id: 'client-1', email: 'client1@test.com', profile: { firstName: 'John', lastName: 'Doe' } },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockClients }),
    });

    const user = userEvent.setup();

    renderWithProvider(
      <ClientSelector selectedClientId={null} onClientChange={mockOnClientChange} />
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'client-1');

    expect(mockOnClientChange).toHaveBeenCalledWith('client-1');
  });

  it('shows "My Data" as first option', async () => {
    const mockClients = [
      { id: 'client-1', email: 'client1@test.com', profile: { firstName: 'John', lastName: 'Doe' } },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockClients }),
    });

    renderWithProvider(
      <ClientSelector selectedClientId={null} onClientChange={mockOnClientChange} />
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent(/my data/i);
  });
});
