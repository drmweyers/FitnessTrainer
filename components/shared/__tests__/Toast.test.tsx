/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  AlertTriangle: () => <span data-testid="icon-warning" />,
  Info: () => <span data-testid="icon-info" />,
}));

import Toast, { ToastContainer } from '../Toast';

describe('Toast', () => {
  const defaultProps = {
    id: 'toast-1',
    type: 'success' as const,
    title: 'Success!',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the toast title', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should render the toast message when provided', () => {
    render(<Toast {...defaultProps} message="Operation completed" />);
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('should render success icon for success type', () => {
    render(<Toast {...defaultProps} type="success" />);
    expect(screen.getByTestId('icon-check')).toBeInTheDocument();
  });

  it('should render error icon for error type', () => {
    render(<Toast {...defaultProps} type="error" title="Error!" />);
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
  });

  it('should render warning icon for warning type', () => {
    render(<Toast {...defaultProps} type="warning" title="Warning!" />);
    expect(screen.getByTestId('icon-warning')).toBeInTheDocument();
  });

  it('should render info icon for info type', () => {
    render(<Toast {...defaultProps} type="info" title="Info" />);
    expect(screen.getByTestId('icon-info')).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<Toast {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    // Wait for animation delay
    act(() => { jest.advanceTimersByTime(300); });
    expect(defaultProps.onClose).toHaveBeenCalledWith('toast-1');
  });
});

describe('ToastContainer', () => {
  it('should render multiple toasts', () => {
    const onClose = jest.fn();
    const toasts = [
      { id: '1', type: 'success' as const, title: 'Toast 1', onClose },
      { id: '2', type: 'error' as const, title: 'Toast 2', onClose },
    ];

    render(<ToastContainer toasts={toasts} onClose={onClose} />);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('should render empty when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={jest.fn()} />);
    const toastWrapper = container.firstChild as HTMLElement;
    // The container exists but has no toast children
    expect(toastWrapper.querySelector('.max-w-sm')).toBeNull();
  });
});
