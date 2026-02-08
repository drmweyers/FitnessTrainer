/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { renderHook, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  AlertTriangle: () => <span data-testid="icon-warning" />,
  Info: () => <span data-testid="icon-info" />,
}));

import { useToast } from '../Toast';

describe('useToast hook from Toast.tsx', () => {
  it('starts with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('addToast adds a toast and returns id', () => {
    const { result } = renderHook(() => useToast());
    let id: string;
    act(() => {
      id = result.current.addToast({ type: 'success', title: 'Added' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Added');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('removeToast removes a toast by id', () => {
    const { result } = renderHook(() => useToast());
    let id: string;
    act(() => {
      id = result.current.addToast({ type: 'info', title: 'Removable' });
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      result.current.removeToast(result.current.toasts[0].id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('success() helper creates success toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('It worked', 'Details here');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].title).toBe('It worked');
    expect(result.current.toasts[0].message).toBe('Details here');
  });

  it('error() helper creates error toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.error('Failed', 'Error details');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('error');
    expect(result.current.toasts[0].title).toBe('Failed');
  });

  it('warning() helper creates warning toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.warning('Careful');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('info() helper creates info toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.info('FYI', 'Some info', 3000);
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].duration).toBe(3000);
  });

  it('adds multiple toasts', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('First');
      result.current.error('Second');
      result.current.info('Third');
    });
    expect(result.current.toasts).toHaveLength(3);
  });
});
