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
  specificGoal: 'Lose weight to 70kg',
  targetValue: 70,
  targetDate: '2027-06-01',
  priority: 3,
  isActive: true,
  achievedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  goalProgress: [
    {
      id: 'progress1',
      goalId: 'goal1',
      currentValue: 75,
      recordedDate: '2026-02-01',
      percentageComplete: 0,
      createdAt: '2026-02-01T00:00:00Z',
    },
  ],
};

const mockCompletedGoal = {
  id: 'goal2',
  userId: 'user123',
  goalType: 'strength',
  specificGoal: 'Bench press 100kg',
  targetValue: 100,
  targetDate: '2024-01-01',
  priority: 3,
  isActive: false,
  achievedAt: '2024-01-05T00:00:00Z',
  createdAt: '2023-10-01T00:00:00Z',
  goalProgress: [
    {
      id: 'progress2',
      goalId: 'goal2',
      currentValue: 100,
      recordedDate: '2024-01-05',
      percentageComplete: 100,
      createdAt: '2024-01-05T00:00:00Z',
    },
  ],
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

    // Mock JWT token (format: header.payload.signature)
    const payload = btoa(JSON.stringify({ userId: 'user123' }));
    mockLocalStorage.getItem.mockReturnValue(`eyJhbGciOiJIUzI1NiJ9.${payload}.mockSignature`);

    // Mock window.alert to prevent jsdom errors
    window.alert = jest.fn();
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
    expect(screen.getByText('Lose weight to 70kg')).toBeInTheDocument();
    expect(screen.getByText(/Target date:/)).toBeInTheDocument();
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
    expect(screen.getByText('Bench press 100kg')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([mockActiveGoal]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Active Goals')).toBeInTheDocument();
    });

    // New format: currentValue / targetValue (no unit in display)
    expect(screen.getByText('75.0 / 70')).toBeInTheDocument();

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
    expect(screen.getByLabelText('Specific Goal (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Value (optional)')).toBeInTheDocument();
  });

  it('submits create goal form', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);
    (analyticsApi.createGoal as jest.Mock).mockResolvedValue(mockActiveGoal);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Goal'));

    await waitFor(() => {
      expect(screen.getByLabelText('Goal Type')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Goal Type'), {
      target: { value: 'weight_loss' },
    });
    fireEvent.change(screen.getByLabelText('Specific Goal (optional)'), {
      target: { value: 'Lose weight to 70kg' },
    });
    fireEvent.change(screen.getByLabelText('Target Value (optional)'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByLabelText('Target Date'), {
      target: { value: '2027-06-01' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Goal/ }));

    await waitFor(() => {
      expect(analyticsApi.createGoal).toHaveBeenCalled();
    });
  });

  it('shows cancel button when form is open', async () => {
    (analyticsApi.getGoals as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Goal'));

    await waitFor(() => {
      // The button text changes to "Cancel" when form is open
      expect(screen.getByText('Cancel')).toBeInTheDocument();
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
