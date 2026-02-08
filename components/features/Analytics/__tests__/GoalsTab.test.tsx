/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GoalsTab from '../GoalsTab';
import { analyticsApi } from '@/lib/api/analytics';

jest.mock('@/lib/api/analytics');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/analytics',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockActiveGoal = {
  id: 'goal1',
  userId: 'user123',
  goalType: 'weight_loss',
  targetValue: 70,
  currentValue: 75,
  unit: 'kg',
  startDate: '2026-01-01',
  targetDate: '2027-06-01',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockCompletedGoal = {
  id: 'goal2',
  userId: 'user123',
  goalType: 'strength',
  targetValue: 100,
  currentValue: 100,
  unit: 'kg',
  startDate: '2023-10-01',
  targetDate: '2024-01-01',
  status: 'completed',
  createdAt: '2023-10-01T00:00:00Z',
  updatedAt: '2024-01-05T00:00:00Z',
};

describe('GoalsTab', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();

    // Mock JWT token
    const mockToken = btoa(JSON.stringify({
      header: {},
      payload: { userId: 'user123' },
      signature: 'mock',
    }));
    mockLocalStorage.getItem.mockReturnValue(`header.${btoa(JSON.stringify({ userId: 'user123' }))}.signature`);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <GoalsTab />
      </QueryClientProvider>
    );

  it('shows loading state initially', () => {
    (analyticsApi.getGoals as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    renderComponent();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('shows empty state when no goals', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No goals yet')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Set your first fitness goal to start tracking your progress.')
    ).toBeInTheDocument();
  });

  it('renders active goals', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([mockActiveGoal]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Active Goals')).toBeInTheDocument();
    });

    expect(screen.getByText('Weight Loss')).toBeInTheDocument();
    expect(screen.getByText(/Target: 70 kg/)).toBeInTheDocument();
  });

  it('renders completed goals', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([
      mockActiveGoal,
      mockCompletedGoal,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Completed Goals')).toBeInTheDocument();
    });

    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText(/Achieved: 100 kg/)).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([mockActiveGoal]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('75 / 70 kg')).toBeInTheDocument();
    });

    // Progress is (75/70)*100 = 107.14%
    expect(screen.getByText(/107.1% complete/)).toBeInTheDocument();
  });

  it('shows create goal button', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });
  });

  it('opens create goal form when button clicked', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create New Goal'));
    });

    expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Goal Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Value')).toBeInTheDocument();
  });

  it('submits create goal form', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);
    (analyticsApi.createGoal as jest.Mock).mockResolvedValue(mockActiveGoal);

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create New Goal'));
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Goal Type'), {
      target: { value: 'weight_loss' },
    });
    fireEvent.change(screen.getByLabelText('Target Value'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByLabelText('Target Date'), {
      target: { value: '2024-06-01' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Goal/ }));

    await waitFor(() => {
      expect(analyticsApi.createGoal).toHaveBeenCalled();
    });
  });

  it('closes form after successful submission', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);
    (analyticsApi.createGoal as jest.Mock).mockResolvedValue(mockActiveGoal);

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create New Goal'));
    });

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Goal Type'), {
      target: { value: 'weight_loss' },
    });
    fireEvent.change(screen.getByLabelText('Target Value'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByLabelText('Target Date'), {
      target: { value: '2024-06-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Goal/ }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Goal Type')).not.toBeInTheDocument();
    });
  });

  it('shows days remaining badge', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([mockActiveGoal]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/days left/)).toBeInTheDocument();
    });
  });

  it('displays no active goals message when all completed', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([
      mockCompletedGoal,
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Active Goals')).toBeInTheDocument();
    });

    expect(screen.getByText('No active goals')).toBeInTheDocument();
  });
});
