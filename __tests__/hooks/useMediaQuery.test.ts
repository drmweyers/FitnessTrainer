/**
 * @jest-environment jsdom
 */

/**
 * Tests for useMediaQuery hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Mock matchMedia
function createMockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches,
    media: '',
    addEventListener: jest.fn((event: string, listener: () => void) => {
      listeners.push(listener);
    }),
    removeEventListener: jest.fn((event: string, listener: () => void) => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchChange: (newMatches: boolean) => {
      mql.matches = newMatches;
      listeners.forEach(fn => fn());
    },
  };
  return mql;
}

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns false initially when query does not match', () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });

  it('returns true initially when query matches', () => {
    const mql = createMockMatchMedia(true);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    act(() => {
      mql.dispatchChange(true);
    });

    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const mql = createMockMatchMedia(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('re-registers listener when query string changes', () => {
    const mql1 = createMockMatchMedia(false);
    const mql2 = createMockMatchMedia(true);

    window.matchMedia = jest.fn()
      .mockReturnValueOnce(mql1)
      .mockReturnValueOnce(mql2);

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    );

    expect(result.current).toBe(false);

    rerender({ query: '(min-width: 1024px)' });

    expect(result.current).toBe(true);
    expect(mql1.removeEventListener).toHaveBeenCalled();
    expect(mql2.addEventListener).toHaveBeenCalled();
  });

  it('handles transition from true to false', () => {
    const mql = createMockMatchMedia(true);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);

    act(() => {
      mql.dispatchChange(false);
    });

    expect(result.current).toBe(false);
  });
});
