/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('OfflineIndicator', () => {
  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container.innerHTML).toBe('');
  });

  it('shows offline message when offline event fires', () => {
    render(<OfflineIndicator />);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('hides offline message when online event fires after offline', () => {
    render(<OfflineIndicator />);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<OfflineIndicator />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    removeSpy.mockRestore();
  });
});
