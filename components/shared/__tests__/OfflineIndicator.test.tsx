/** @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react';
import OfflineIndicator from '../OfflineIndicator';

// Mock the useNetworkStatus hook
jest.mock('@/hooks/useNetworkStatus');
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when online', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    render(<OfflineIndicator />);

    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();
  });

  it('should render when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    render(<OfflineIndicator />);

    expect(screen.getByText(/You're offline - some features may be unavailable/i)).toBeInTheDocument();
  });

  it('should show wifi off icon when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const { container } = render(<OfflineIndicator />);

    // Check for svg element (lucide icon)
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('should have correct styling when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const { container } = render(<OfflineIndicator />);

    const banner = container.querySelector('.bg-amber-500');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveClass('text-white');
  });

  it('should toggle visibility based on online status', () => {
    const { rerender } = render(<OfflineIndicator />);

    // Start offline
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    rerender(<OfflineIndicator />);
    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();

    // Go online
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    rerender(<OfflineIndicator />);
    expect(screen.queryByText(/You're offline/i)).not.toBeInTheDocument();

    // Go offline again
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    rerender(<OfflineIndicator />);
    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });
});
