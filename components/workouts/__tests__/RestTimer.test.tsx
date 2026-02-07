/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { RestTimer } from '../RestTimer';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon" />,
  Pause: () => <span data-testid="pause-icon" />,
  RotateCw: () => <span data-testid="reset-icon" />,
  X: () => <span data-testid="close-icon" />,
  Bell: () => <span data-testid="bell-icon" />,
}));

describe('RestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<RestTimer />);
    expect(screen.getByText('Rest Timer')).toBeInTheDocument();
  });

  it('displays initial time in MM:SS format', () => {
    render(<RestTimer initialSeconds={90} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('displays custom initial time', () => {
    render(<RestTimer initialSeconds={120} />);
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('shows Start button initially', () => {
    render(<RestTimer />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('shows Pause button after starting', () => {
    render(<RestTimer />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('shows Resume button after pausing', () => {
    render(<RestTimer />);
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByText('Pause'));
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('shows Reset button when running', () => {
    render(<RestTimer />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('renders preset time buttons', () => {
    render(<RestTimer />);
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
    expect(screen.getByText('90s')).toBeInTheDocument();
    expect(screen.getByText('120s')).toBeInTheDocument();
    expect(screen.getByText('180s')).toBeInTheDocument();
  });

  it('changes time when preset is clicked', () => {
    render(<RestTimer initialSeconds={90} />);
    fireEvent.click(screen.getByText('60s'));
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('disables presets while running', () => {
    render(<RestTimer />);
    fireEvent.click(screen.getByText('Start'));
    const presetBtn = screen.getByText('30s');
    expect(presetBtn).toBeDisabled();
  });

  it('renders quick adjust time buttons when not running', () => {
    render(<RestTimer />);
    expect(screen.getByText('-15s')).toBeInTheDocument();
    expect(screen.getByText('-10s')).toBeInTheDocument();
    expect(screen.getByText('-5s')).toBeInTheDocument();
    expect(screen.getByText('+5s')).toBeInTheDocument();
    expect(screen.getByText('+10s')).toBeInTheDocument();
    expect(screen.getByText('+15s')).toBeInTheDocument();
  });

  it('adjusts time with quick buttons', () => {
    render(<RestTimer initialSeconds={90} />);
    fireEvent.click(screen.getByText('+10s'));
    expect(screen.getByText('01:40')).toBeInTheDocument();
  });

  it('does not go below 0 with negative adjustments', () => {
    render(<RestTimer initialSeconds={5} />);
    fireEvent.click(screen.getByText('-10s'));
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<RestTimer onClose={handleClose} />);

    // The close button uses a ghost variant with X icon
    const closeButtons = screen.getAllByRole('button');
    // Close is the first button in the header
    const closeButton = closeButtons[0];
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });

  it('toggles audio notification', () => {
    render(<RestTimer />);
    const soundBtn = screen.getByText('Sound Off');
    fireEvent.click(soundBtn);
    expect(screen.getByText('Sound On')).toBeInTheDocument();
  });

  it('counts down when started', () => {
    render(<RestTimer initialSeconds={5} />);

    fireEvent.click(screen.getByText('Start'));

    // Advance timer by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:03')).toBeInTheDocument();
  });

  it('calls onComplete when timer reaches 0', () => {
    const handleComplete = jest.fn();
    render(<RestTimer initialSeconds={2} onComplete={handleComplete} />);

    fireEvent.click(screen.getByText('Start'));

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(handleComplete).toHaveBeenCalled();
  });

  it('resets timer when reset is clicked', () => {
    render(<RestTimer initialSeconds={60} />);

    fireEvent.click(screen.getByText('Start'));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('auto-starts when autoStart prop is true', () => {
    render(<RestTimer initialSeconds={60} autoStart />);
    // Should show Pause instead of Start
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });
});
