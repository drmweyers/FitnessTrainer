/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import UpdateAvailable from '../UpdateAvailable';

// Mock the useServiceWorker hook
jest.mock('@/hooks/useServiceWorker');
import { useServiceWorker } from '@/hooks/useServiceWorker';

const mockUseServiceWorker = useServiceWorker as jest.MockedFunction<typeof useServiceWorker>;

describe('UpdateAvailable', () => {
  const mockSkipWaiting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when no update is available', () => {
    mockUseServiceWorker.mockReturnValue({
      registration: null,
      updateAvailable: false,
      skipWaiting: mockSkipWaiting,
    });

    render(<UpdateAvailable />);

    expect(screen.queryByText(/New version available/i)).not.toBeInTheDocument();
  });

  it('should render when update is available', () => {
    mockUseServiceWorker.mockReturnValue({
      registration: {} as ServiceWorkerRegistration,
      updateAvailable: true,
      skipWaiting: mockSkipWaiting,
    });

    render(<UpdateAvailable />);

    expect(screen.getByText(/New version available/i)).toBeInTheDocument();
    expect(screen.getByText(/A new version of EvoFit is ready to use/i)).toBeInTheDocument();
  });

  it('should show refresh button when update is available', () => {
    mockUseServiceWorker.mockReturnValue({
      registration: {} as ServiceWorkerRegistration,
      updateAvailable: true,
      skipWaiting: mockSkipWaiting,
    });

    render(<UpdateAvailable />);

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should call skipWaiting when refresh button is clicked', () => {
    mockUseServiceWorker.mockReturnValue({
      registration: {} as ServiceWorkerRegistration,
      updateAvailable: true,
      skipWaiting: mockSkipWaiting,
    });

    render(<UpdateAvailable />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockSkipWaiting).toHaveBeenCalledTimes(1);
  });

  it('should show refresh icon', () => {
    mockUseServiceWorker.mockReturnValue({
      registration: {} as ServiceWorkerRegistration,
      updateAvailable: true,
      skipWaiting: mockSkipWaiting,
    });

    const { container } = render(<UpdateAvailable />);

    // Check for svg element (lucide icon)
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    mockUseServiceWorker.mockReturnValue({
      registration: {} as ServiceWorkerRegistration,
      updateAvailable: true,
      skipWaiting: mockSkipWaiting,
    });

    const { container } = render(<UpdateAvailable />);

    const banner = container.querySelector('.bg-green-600');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveClass('text-white');
  });

  it('should toggle visibility based on update availability', () => {
    const { rerender } = render(<UpdateAvailable />);

    // No update available
    mockUseServiceWorker.mockReturnValue({
      registration: null,
      updateAvailable: false,
      skipWaiting: mockSkipWaiting,
    });
    rerender(<UpdateAvailable />);
    expect(screen.queryByText(/New version available/i)).not.toBeInTheDocument();

    // Update available
    mockUseServiceWorker.mockReturnValue({
      registration: {} as ServiceWorkerRegistration,
      updateAvailable: true,
      skipWaiting: mockSkipWaiting,
    });
    rerender(<UpdateAvailable />);
    expect(screen.getByText(/New version available/i)).toBeInTheDocument();
  });
});
