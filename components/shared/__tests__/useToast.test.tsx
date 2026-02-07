/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { useToast, ToastMessage, ToastProvider } from '../use-toast';

describe('useToast hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
  });

  it('should add toast with description', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Error', description: 'Something failed', variant: 'destructive' });
    });
    expect(result.current.toasts[0].description).toBe('Something failed');
    expect(result.current.toasts[0].variant).toBe('destructive');
  });

  it('should auto-dismiss toast after 5 seconds', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Auto dismiss' });
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      jest.advanceTimersByTime(5100);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('should dismiss toast by id', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Dismissable' });
    });
    const toastId = result.current.toasts[0].id;
    act(() => {
      result.current.dismiss(toastId);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});

describe('ToastMessage', () => {
  it('should render toast title', () => {
    const toast = { id: '1', title: 'Success', variant: 'default' as const };
    render(<ToastMessage toast={toast} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render toast description', () => {
    const toast = { id: '1', title: 'Done', description: 'Operation completed', variant: 'default' as const };
    render(<ToastMessage toast={toast} />);
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('should apply destructive styling for destructive variant', () => {
    const toast = { id: '1', title: 'Error', variant: 'destructive' as const };
    const { container } = render(<ToastMessage toast={toast} />);
    expect(container.firstChild).toHaveClass('bg-red-600');
  });

  it('should apply default styling for default variant', () => {
    const toast = { id: '1', title: 'Info', variant: 'default' as const };
    const { container } = render(<ToastMessage toast={toast} />);
    expect(container.firstChild).toHaveClass('bg-white');
  });
});

describe('ToastProvider', () => {
  it('should render children', () => {
    render(
      <ToastProvider>
        <div>App Content</div>
      </ToastProvider>
    );
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });
});
