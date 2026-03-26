/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

describe('useHapticFeedback', () => {
  let mockVibrate: jest.Mock;

  beforeEach(() => {
    mockVibrate = jest.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns tap, success, celebration, and custom functions', () => {
    const { result } = renderHook(() => useHapticFeedback());
    expect(typeof result.current.tap).toBe('function');
    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.celebration).toBe('function');
    expect(typeof result.current.custom).toBe('function');
  });

  it('tap calls navigator.vibrate with 50ms pattern', () => {
    const { result } = renderHook(() => useHapticFeedback());
    act(() => result.current.tap());
    expect(mockVibrate).toHaveBeenCalledWith(50);
  });

  it('success calls navigator.vibrate with [100, 50, 100] pattern', () => {
    const { result } = renderHook(() => useHapticFeedback());
    act(() => result.current.success());
    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('celebration calls navigator.vibrate with PR celebration pattern', () => {
    const { result } = renderHook(() => useHapticFeedback());
    act(() => result.current.celebration());
    expect(mockVibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
  });

  it('custom calls navigator.vibrate with the provided pattern', () => {
    const { result } = renderHook(() => useHapticFeedback());
    act(() => result.current.custom([100, 50, 100, 50]));
    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100, 50]);
  });

  it('no-ops when vibration is not supported', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    // Should not throw
    act(() => {
      result.current.tap();
      result.current.success();
      result.current.celebration();
      result.current.custom([100]);
    });

    expect(mockVibrate).not.toHaveBeenCalled();
  });

  it('no-ops on server side (no window)', () => {
    // Simulate SSR environment where navigator is undefined
    const originalNavigator = global.navigator;
    // @ts-ignore
    delete global.navigator;

    const { result } = renderHook(() => useHapticFeedback());

    act(() => {
      result.current.tap();
    });

    // Restore
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('medium tap calls navigator.vibrate with 100ms', () => {
    const { result } = renderHook(() => useHapticFeedback());
    act(() => result.current.custom(100));
    expect(mockVibrate).toHaveBeenCalledWith(100);
  });
});
