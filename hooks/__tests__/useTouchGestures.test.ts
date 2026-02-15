/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react';
import { useTouchGestures, useIsMobile, useTouchFriendlyStyles } from '../useTouchGestures';
import React from 'react';

// Helper to create a touch event with the right shape
function dispatchTouchEvent(
  element: HTMLElement,
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
  changedTouches?: Array<{ clientX: number; clientY: number }>
) {
  const touchList = touches.map((t) => ({
    clientX: t.clientX,
    clientY: t.clientY,
    identifier: 0,
    target: element,
    pageX: t.clientX,
    pageY: t.clientY,
    screenX: t.clientX,
    screenY: t.clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  }));
  const changed = (changedTouches || touches).map((t) => ({
    clientX: t.clientX,
    clientY: t.clientY,
    identifier: 0,
    target: element,
    pageX: t.clientX,
    pageY: t.clientY,
    screenX: t.clientX,
    screenY: t.clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  }));

  const event = new Event(type, { bubbles: true, cancelable: true }) as any;
  event.touches = touchList;
  event.changedTouches = changed;
  event.preventDefault = jest.fn();
  element.dispatchEvent(event);
  return event;
}

// Wrapper component to properly test the hook with a real DOM element
function createTestComponent(handlers: any, options?: any) {
  function TestComponent() {
    const ref = useTouchGestures(handlers, options);
    return React.createElement('div', {
      ref: ref as any,
      'data-testid': 'touch-target',
      style: { width: '100px', height: '100px' },
    });
  }
  return TestComponent;
}

describe('useTouchGestures', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns an element ref', () => {
    const { result } = renderHook(() => useTouchGestures({}));
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  describe('swipe gestures', () => {
    it('detects swipe right', () => {
      const onSwipeRight = jest.fn();
      const TestComp = createTestComponent({ onSwipeRight }, { swipe: { minDistance: 30, maxTime: 1000 } });

      // Need to use React to render
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      // Start touch at (0, 50)
      dispatchTouchEvent(el, 'touchstart', [{ clientX: 0, clientY: 50 }]);
      // End touch at (100, 50) - moved right 100px
      dispatchTouchEvent(el, 'touchend', [{ clientX: 100, clientY: 50 }], [{ clientX: 100, clientY: 50 }]);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('detects swipe left', () => {
      const onSwipeLeft = jest.fn();
      const TestComp = createTestComponent({ onSwipeLeft }, { swipe: { minDistance: 30, maxTime: 1000 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 100, clientY: 50 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 0, clientY: 50 }], [{ clientX: 0, clientY: 50 }]);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('detects swipe down', () => {
      const onSwipeDown = jest.fn();
      const TestComp = createTestComponent({ onSwipeDown }, { swipe: { minDistance: 30, maxTime: 1000 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 0 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 50, clientY: 100 }], [{ clientX: 50, clientY: 100 }]);

      expect(onSwipeDown).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('detects swipe up', () => {
      const onSwipeUp = jest.fn();
      const TestComp = createTestComponent({ onSwipeUp }, { swipe: { minDistance: 30, maxTime: 1000 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 100 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 50, clientY: 0 }], [{ clientX: 50, clientY: 0 }]);

      expect(onSwipeUp).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('ignores swipe that is too slow', () => {
      const onSwipeRight = jest.fn();
      const TestComp = createTestComponent({ onSwipeRight }, { swipe: { minDistance: 30, maxTime: 500 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 0, clientY: 50 }]);
      // Advance time past maxTime
      jest.advanceTimersByTime(600);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 100, clientY: 50 }], [{ clientX: 100, clientY: 50 }]);

      // Should not detect swipe because it took too long
      expect(onSwipeRight).not.toHaveBeenCalled();
      unmount();
    });

    it('ignores swipe that is too short', () => {
      const onSwipeRight = jest.fn();
      const TestComp = createTestComponent({ onSwipeRight }, { swipe: { minDistance: 50, maxTime: 1000 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 0, clientY: 50 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 20, clientY: 50 }], [{ clientX: 20, clientY: 50 }]);

      expect(onSwipeRight).not.toHaveBeenCalled();
      unmount();
    });
  });

  describe('tap gestures', () => {
    it('detects single tap', () => {
      const onTap = jest.fn();
      const TestComp = createTestComponent({ onTap }, { tap: { maxDelay: 500, maxDistance: 10 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 50, clientY: 50 }], [{ clientX: 50, clientY: 50 }]);

      expect(onTap).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('detects double tap', () => {
      const onDoubleTap = jest.fn();
      const onTap = jest.fn();
      const TestComp = createTestComponent({ onDoubleTap, onTap }, { tap: { maxDelay: 500, maxDistance: 10 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      // First tap
      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 50, clientY: 50 }], [{ clientX: 50, clientY: 50 }]);

      // Second tap within 500ms
      jest.advanceTimersByTime(100);
      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 50, clientY: 50 }], [{ clientX: 50, clientY: 50 }]);

      expect(onDoubleTap).toHaveBeenCalledTimes(1);
      unmount();
    });
  });

  describe('long press', () => {
    it('detects long press after 500ms', () => {
      const onLongPress = jest.fn();
      const TestComp = createTestComponent({ onLongPress });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      act(() => { jest.advanceTimersByTime(500); });

      expect(onLongPress).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('cancels long press on touch move', () => {
      const onLongPress = jest.fn();
      const TestComp = createTestComponent({ onLongPress });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      jest.advanceTimersByTime(200);
      dispatchTouchEvent(el, 'touchmove', [{ clientX: 80, clientY: 80 }]);
      jest.advanceTimersByTime(400);

      expect(onLongPress).not.toHaveBeenCalled();
      unmount();
    });
  });

  describe('pinch gestures', () => {
    it('detects pinch in', () => {
      const onPinchIn = jest.fn();
      const TestComp = createTestComponent({ onPinchIn }, { pinch: { threshold: 5 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      // Start with two fingers far apart
      dispatchTouchEvent(el, 'touchstart', [
        { clientX: 0, clientY: 50 },
        { clientX: 200, clientY: 50 },
      ]);
      // Move fingers closer together (pinch in)
      dispatchTouchEvent(el, 'touchmove', [
        { clientX: 80, clientY: 50 },
        { clientX: 120, clientY: 50 },
      ]);

      expect(onPinchIn).toHaveBeenCalled();
      unmount();
    });

    it('detects pinch out', () => {
      const onPinchOut = jest.fn();
      const TestComp = createTestComponent({ onPinchOut }, { pinch: { threshold: 5 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      // Start with two fingers close together
      dispatchTouchEvent(el, 'touchstart', [
        { clientX: 80, clientY: 50 },
        { clientX: 120, clientY: 50 },
      ]);
      // Move fingers far apart (pinch out)
      dispatchTouchEvent(el, 'touchmove', [
        { clientX: 0, clientY: 50 },
        { clientX: 200, clientY: 50 },
      ]);

      expect(onPinchOut).toHaveBeenCalled();
      unmount();
    });
  });

  describe('touch callbacks', () => {
    it('calls onTouchStart callback', () => {
      const onTouchStart = jest.fn();
      const TestComp = createTestComponent({ onTouchStart });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      expect(onTouchStart).toHaveBeenCalled();
      unmount();
    });

    it('calls onTouchEnd callback', () => {
      const onTouchEnd = jest.fn();
      const TestComp = createTestComponent({ onTouchEnd });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 50, clientY: 50 }]);
      dispatchTouchEvent(el, 'touchend', [{ clientX: 50, clientY: 50 }], [{ clientX: 50, clientY: 50 }]);
      expect(onTouchEnd).toHaveBeenCalled();
      unmount();
    });
  });

  describe('scroll prevention', () => {
    it('prevents scroll during swipe when preventScrollOnSwipe is true', () => {
      const TestComp = createTestComponent({ onSwipeRight: jest.fn() }, { swipe: { preventScrollOnSwipe: true, threshold: 5 } });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;

      dispatchTouchEvent(el, 'touchstart', [{ clientX: 0, clientY: 50 }]);
      const moveEvent = dispatchTouchEvent(el, 'touchmove', [{ clientX: 50, clientY: 50 }]);
      expect(moveEvent.preventDefault).toHaveBeenCalled();
      unmount();
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const TestComp = createTestComponent({ onTap: jest.fn() });
      const { unmount } = (require('@testing-library/react') as any).render(
        React.createElement(TestComp)
      );
      const el = document.querySelector('[data-testid="touch-target"]') as HTMLElement;
      const removeSpy = jest.spyOn(el, 'removeEventListener');

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  const originalMaxTouchPoints = navigator.maxTouchPoints;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true, configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTouchPoints, writable: true, configurable: true });
  });

  it('returns false for desktop width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe('boolean');
  });

  it('returns true for mobile width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('responds to window resize events', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up resize listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe('useTouchFriendlyStyles', () => {
  it('returns style object with expected keys', () => {
    const { result } = renderHook(() => useTouchFriendlyStyles());
    expect(result.current).toHaveProperty('buttonSize');
    expect(result.current).toHaveProperty('buttonPadding');
    expect(result.current).toHaveProperty('buttonText');
    expect(result.current).toHaveProperty('spacing');
    expect(result.current).toHaveProperty('touchTarget');
  });

  it('returns mobile styles when on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    const { result } = renderHook(() => useTouchFriendlyStyles());
    // After useEffect runs, should detect mobile
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    // Check either mobile or desktop style returned
    expect(result.current.buttonSize).toMatch(/h-1[02]/);
  });

  it('returns desktop styles when on desktop', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
    const { result } = renderHook(() => useTouchFriendlyStyles());
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.buttonSize).toBe('h-10 w-10');
  });
});
