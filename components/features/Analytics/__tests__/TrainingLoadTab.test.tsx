/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrainingLoadTab from '../TrainingLoadTab';
import { analyticsApi } from '@/lib/api/analytics';

jest.mock('@/lib/api/analytics');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/analytics',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  LineElement: jest.fn(),
  PointElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="mock-line-chart">Line Chart</div>,
}));

const mockTrainingLoad = [
  {
    id: '1',
    userId: 'user123',
    weekStartDate: '2024-01-01',
    totalVolume: 5000,
    totalSets: 50,
    totalReps: 300,
    trainingDays: 5,
    averageIntensity: 75,
    acuteLoad: 4800,
    chronicLoad: 4500,
    loadRatio: 1.07,
    calculatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user123',
    weekStartDate: '2024-01-08',
    totalVolume: 5200,
    totalSets: 52,
    totalReps: 310,
    trainingDays: 4,
    averageIntensity: 78,
    acuteLoad: 5000,
    chronicLoad: 4600,
    loadRatio: 1.09,
    calculatedAt: '2024-01-15T00:00:00Z',
  },
];

describe('TrainingLoadTab', () => {
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
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <TrainingLoadTab />
      </QueryClientProvider>
    );

  it('shows loading state initially', () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    renderComponent();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No training load data yet')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Complete workouts to track your training load over time.')
    ).toBeInTheDocument();
  });

  it('renders training load data', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Volume')).toBeInTheDocument();
    });

    expect(screen.getByText('5200 kg')).toBeInTheDocument();
    expect(screen.getByText('Training Days')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders load ratio with status', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Load Ratio')).toBeInTheDocument();
    });

    expect(screen.getByText('1.09')).toBeInTheDocument();
    expect(screen.getByText('Optimal')).toBeInTheDocument();
  });

  it('renders time range selector', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('4 Weeks')).toBeInTheDocument();
    });

    expect(screen.getByText('8 Weeks')).toBeInTheDocument();
    expect(screen.getByText('12 Weeks')).toBeInTheDocument();
    expect(screen.getByText('26 Weeks')).toBeInTheDocument();
  });

  it('changes time range when button clicked', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('4 Weeks')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('8 Weeks'));

    await waitFor(() => {
      expect(analyticsApi.getTrainingLoad).toHaveBeenCalledWith(8);
    });
  });

  it('renders volume chart', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
    });
  });

  it('renders load ratio chart', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
  });

  it('calculates average volume correctly', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Avg Volume')).toBeInTheDocument();
    });

    // Average of 5000 and 5200 = 5100
    expect(screen.getByText('5100 kg')).toBeInTheDocument();
  });

  it('shows load ratio guide information', async () => {
    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      mockTrainingLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Load Ratio Guide/)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/optimal ratio is between 0.8-1.3/)
    ).toBeInTheDocument();
  });

  it('shows high risk status for high load ratio', async () => {
    const highRiskLoad = [
      {
        ...mockTrainingLoad[0],
        loadRatio: 1.6,
      },
    ];

    (analyticsApi.getTrainingLoad as jest.Mock).mockResolvedValue(
      highRiskLoad
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });
  });
});
