/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useMediaSession } from '@/hooks/useMediaSession';

// Mock Media Session API
const mockSetActionHandler = jest.fn();
const mockMetadataSetter = jest.fn();

const mockMediaSession = {
  metadata: null as any,
  setActionHandler: mockSetActionHandler,
};

beforeEach(() => {
  jest.clearAllMocks();

  // Set up mock mediaSession
  Object.defineProperty(navigator, 'mediaSession', {
    value: mockMediaSession,
    writable: true,
    configurable: true,
  });

  // Mock MediaMetadata
  (global as any).MediaMetadata = jest.fn().mockImplementation((data: any) => ({
    ...data,
    _type: 'MediaMetadata',
  }));
});

afterEach(() => {
  delete (global as any).MediaMetadata;
});

describe('useMediaSession', () => {
  const mockHandlers = {
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onNextTrack: jest.fn(),
  };

  it('sets mediaSession metadata on mount', () => {
    renderHook(() =>
      useMediaSession('Test Workout', mockHandlers)
    );

    expect(mockMediaSession.metadata).toBeDefined();
    expect((global as any).MediaMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Workout',
        artist: 'EvoFit',
      })
    );
  });

  it('registers play action handler', () => {
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    expect(mockSetActionHandler).toHaveBeenCalledWith(
      'play',
      expect.any(Function)
    );
  });

  it('registers pause action handler', () => {
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    expect(mockSetActionHandler).toHaveBeenCalledWith(
      'pause',
      expect.any(Function)
    );
  });

  it('registers nexttrack action handler', () => {
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    expect(mockSetActionHandler).toHaveBeenCalledWith(
      'nexttrack',
      expect.any(Function)
    );
  });

  it('invokes onPlay handler when play action fires', () => {
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    // Get the play handler that was registered
    const playCall = mockSetActionHandler.mock.calls.find(
      (call) => call[0] === 'play'
    );
    expect(playCall).toBeDefined();
    playCall![1]();

    expect(mockHandlers.onPlay).toHaveBeenCalled();
  });

  it('invokes onPause handler when pause action fires', () => {
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    const pauseCall = mockSetActionHandler.mock.calls.find(
      (call) => call[0] === 'pause'
    );
    pauseCall![1]();

    expect(mockHandlers.onPause).toHaveBeenCalled();
  });

  it('invokes onNextTrack handler when nexttrack action fires', () => {
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    const nextCall = mockSetActionHandler.mock.calls.find(
      (call) => call[0] === 'nexttrack'
    );
    nextCall![1]();

    expect(mockHandlers.onNextTrack).toHaveBeenCalled();
  });

  it('cleans up handlers on unmount', () => {
    const { unmount } = renderHook(() =>
      useMediaSession('My Workout', mockHandlers)
    );

    jest.clearAllMocks();
    unmount();

    // Should have set handlers to null on cleanup
    expect(mockSetActionHandler).toHaveBeenCalledWith('play', null);
    expect(mockSetActionHandler).toHaveBeenCalledWith('pause', null);
    expect(mockSetActionHandler).toHaveBeenCalledWith('nexttrack', null);
  });

  it('no-ops when mediaSession is not supported', () => {
    // Remove mediaSession from navigator entirely
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaSession');
    Object.defineProperty(navigator, 'mediaSession', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    jest.clearAllMocks();

    // Should not throw
    renderHook(() => useMediaSession('My Workout', mockHandlers));

    expect(mockSetActionHandler).not.toHaveBeenCalled();

    // Restore
    if (originalDescriptor) {
      Object.defineProperty(navigator, 'mediaSession', originalDescriptor);
    }
  });

  it('updates metadata when workout title changes', () => {
    const { rerender } = renderHook(
      ({ title }) => useMediaSession(title, mockHandlers),
      { initialProps: { title: 'Workout A' } }
    );

    jest.clearAllMocks();

    rerender({ title: 'Workout B' });

    expect((global as any).MediaMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Workout B' })
    );
  });
});
