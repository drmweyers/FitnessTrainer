/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InstallPrompt from '../InstallPrompt';

describe('InstallPrompt', () => {
  let mockPromptEvent: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock beforeinstallprompt event
    mockPromptEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render initially', () => {
    render(<InstallPrompt />);
    expect(screen.queryByText(/Add EvoFit to Home Screen/i)).not.toBeInTheDocument();
  });

  it('should render when beforeinstallprompt event fires', async () => {
    render(<InstallPrompt />);

    fireEvent(window, new Event('beforeinstallprompt'));

    // Wait for state update
    await waitFor(() => {
      expect(screen.queryByText(/Add EvoFit to Home Screen/i)).toBeInTheDocument();
    });
  });

  it('should show prompt when beforeinstallprompt fires', async () => {
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    Object.assign(event, mockPromptEvent);

    fireEvent(window, event);

    await waitFor(() => {
      expect(screen.getByText(/Add EvoFit to Home Screen/i)).toBeInTheDocument();
      expect(screen.getByText(/Install our app for quick access/i)).toBeInTheDocument();
    });
  });

  it('should call prompt when Install button is clicked', async () => {
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    Object.assign(event, mockPromptEvent);

    fireEvent(window, event);

    await waitFor(() => {
      expect(screen.getByText('Install')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(mockPromptEvent.prompt).toHaveBeenCalled();
    });
  });

  it('should hide prompt after installation', async () => {
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    Object.assign(event, mockPromptEvent);

    fireEvent(window, event);

    await waitFor(() => {
      expect(screen.getByText('Install')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(screen.queryByText(/Add EvoFit to Home Screen/i)).not.toBeInTheDocument();
    });
  });

  it('should set localStorage and hide when dismissed', async () => {
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    Object.assign(event, mockPromptEvent);

    fireEvent(window, event);

    await waitFor(() => {
      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Dismiss'));

    await waitFor(() => {
      expect(localStorage.getItem('installPromptDismissed')).toBe('true');
      expect(screen.queryByText(/Add EvoFit to Home Screen/i)).not.toBeInTheDocument();
    });
  });

  it('should not render if previously dismissed', () => {
    localStorage.setItem('installPromptDismissed', 'true');

    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    Object.assign(event, mockPromptEvent);

    fireEvent(window, event);

    expect(screen.queryByText(/Add EvoFit to Home Screen/i)).not.toBeInTheDocument();
  });

  it('should handle user rejecting the install prompt', async () => {
    const rejectedPromptEvent = {
      ...mockPromptEvent,
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };

    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    Object.assign(event, rejectedPromptEvent);

    fireEvent(window, event);

    await waitFor(() => {
      expect(screen.getByText('Install')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Install'));

    await waitFor(() => {
      expect(screen.queryByText(/Add EvoFit to Home Screen/i)).not.toBeInTheDocument();
    });
  });
});
