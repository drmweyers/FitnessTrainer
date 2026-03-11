/** @jest-environment jsdom */

import { renderHook, act } from '@testing-library/react';
import { useBackgroundTimer } from '@/hooks/useBackgroundTimer';

// Store message handler for mock Worker
let workerOnMessage: ((e: MessageEvent) => void) | null = null;
const mockPostMessage = jest.fn();
const mockTerminate = jest.fn();

// Mock Worker class
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;

  constructor() {
    // Store reference so tests can dispatch messages
    const self = this;
    // Use a getter to capture onmessage when it's set
    Object.defineProperty(this, 'onmessage', {
      get() {
        return workerOnMessage;
      },
      set(fn) {
        workerOnMessage = fn;
      },
    });
  }

  postMessage = mockPostMessage;
  terminate = mockTerminate;
}

// Helper to simulate worker messages
function simulateWorkerMessage(data: any) {
  if (workerOnMessage) {
    workerOnMessage(new MessageEvent('message', { data }));
  }
}

describe('useBackgroundTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    workerOnMessage = null;
    (global as any).Worker = MockWorker;
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with zero remaining and not running', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    expect(result.current.remaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('start sets remaining and isRunning', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(60);
    });

    expect(result.current.remaining).toBe(60);
    expect(result.current.isRunning).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'start', duration: 60 });
  });

  it('tick message decrements remaining', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      simulateWorkerMessage({ type: 'tick', remaining: 59 });
    });

    expect(result.current.remaining).toBe(59);
    expect(result.current.isRunning).toBe(true);
  });

  it('complete message fires callback and sets isRunning false', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(5, onComplete);
    });

    act(() => {
      simulateWorkerMessage({ type: 'complete' });
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('complete triggers vibration', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(5);
    });

    act(() => {
      simulateWorkerMessage({ type: 'complete' });
    });

    expect(navigator.vibrate).toHaveBeenCalledWith(200);
  });

  it('pause stops countdown', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'pause' });
  });

  it('resume continues countdown', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      simulateWorkerMessage({ type: 'tick', remaining: 55 });
    });

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });

    expect(result.current.isRunning).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'resume' });
  });

  it('stop resets everything', () => {
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'stop' });
  });

  it('falls back to setInterval when Worker throws', () => {
    jest.useFakeTimers();
    // Make Worker constructor throw
    (global as any).Worker = jest.fn(() => {
      throw new Error('Worker not supported');
    });

    const onComplete = jest.fn();
    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(3, onComplete);
    });

    expect(result.current.remaining).toBe(3);
    expect(result.current.isRunning).toBe(true);

    // Advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(2);

    // Advance 1 more second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(1);

    // Advance final second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('fallback pause/resume works with setInterval', () => {
    jest.useFakeTimers();
    (global as any).Worker = jest.fn(() => {
      throw new Error('Worker not supported');
    });

    const { result } = renderHook(() => useBackgroundTimer());

    act(() => {
      result.current.start(10);
    });

    // Tick down 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(8);

    // Pause
    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);

    // Time should not advance while paused
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remaining).toBe(8);

    // Resume
    act(() => {
      result.current.resume();
    });
    expect(result.current.isRunning).toBe(true);

    // Tick 1 more
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(7);

    jest.useRealTimers();
  });
});
