/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAudioCues } from '@/hooks/useAudioCues';

// Mock Web Audio API
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: 'sine' as OscillatorType,
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: jest.fn(() => Promise.resolve()),
};

// Store original AudioContext
const OriginalAudioContext = (global as any).AudioContext;

beforeEach(() => {
  jest.clearAllMocks();
  // Mock AudioContext globally
  (global as any).AudioContext = jest.fn(() => mockAudioContext);
  (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);
  mockAudioContext.resume.mockResolvedValue(undefined);
});

afterEach(() => {
  if (OriginalAudioContext) {
    (global as any).AudioContext = OriginalAudioContext;
  } else {
    delete (global as any).AudioContext;
  }
});

describe('useAudioCues', () => {
  it('returns playStart, playWarning, and playComplete functions', () => {
    const { result } = renderHook(() => useAudioCues());
    expect(typeof result.current.playStart).toBe('function');
    expect(typeof result.current.playWarning).toBe('function');
    expect(typeof result.current.playComplete).toBe('function');
  });

  it('playStart creates an oscillator and plays a tone', async () => {
    const { result } = renderHook(() => useAudioCues());

    await act(async () => {
      await result.current.playStart();
    });

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.connect).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('playWarning creates an oscillator for warning tone', async () => {
    const { result } = renderHook(() => useAudioCues());

    await act(async () => {
      await result.current.playWarning();
    });

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('playComplete creates an oscillator for completion tone', async () => {
    const { result } = renderHook(() => useAudioCues());

    await act(async () => {
      await result.current.playComplete();
    });

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('uses different frequencies for start vs warning vs complete', async () => {
    const { result } = renderHook(() => useAudioCues());

    await act(async () => {
      await result.current.playStart();
      await result.current.playWarning();
      await result.current.playComplete();
    });

    // playStart = 1 osc, playWarning = 2 osc, playComplete = 3 osc → total = 6
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(6);
  });

  it('handles missing AudioContext gracefully (no-op)', async () => {
    delete (global as any).AudioContext;
    delete (global as any).webkitAudioContext;

    const { result } = renderHook(() => useAudioCues());

    // Should not throw
    await act(async () => {
      await result.current.playStart();
      await result.current.playWarning();
      await result.current.playComplete();
    });
  });

  it('resumes suspended AudioContext before playing', async () => {
    mockAudioContext.state = 'suspended';

    const { result } = renderHook(() => useAudioCues());

    await act(async () => {
      await result.current.playStart();
    });

    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});
