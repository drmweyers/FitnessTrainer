'use client';

import { useRef, useCallback } from 'react';

interface AudioCues {
  /** Plays a single beep — rest timer start */
  playStart: () => Promise<void>;
  /** Plays a double beep — 10s warning */
  playWarning: () => Promise<void>;
  /** Plays a triple beep — rest period over */
  playComplete: () => Promise<void>;
}

/** Frequencies used for each tone (Hz) */
const FREQ_START = 440;    // A4 — single beep
const FREQ_WARNING = 880;  // A5 — double beep (higher pitch, more urgent)
const FREQ_COMPLETE = 660; // E5 — triple beep (celebratory)

/**
 * Returns an AudioContext instance, or null if not supported.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

/**
 * Plays a sine-wave tone of the given frequency for the specified duration.
 *
 * @param ctx - AudioContext
 * @param frequency - Frequency in Hz
 * @param startTime - AudioContext time to start (seconds)
 * @param duration - Duration in seconds
 */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.3, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/**
 * Hook for playing audio cues during workout rest timers.
 * Uses the Web Audio API to generate tones programmatically — no audio files needed.
 *
 * Sounds:
 * - Start: single beep at 440Hz
 * - Warning (10s left): double beep at 880Hz
 * - Complete: triple beep at 660Hz
 */
export function useAudioCues(): AudioCues {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback(async (): Promise<AudioContext | null> => {
    if (!ctxRef.current) {
      ctxRef.current = getAudioContext();
    }
    if (!ctxRef.current) return null;

    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume();
    }

    return ctxRef.current;
  }, []);

  const playStart = useCallback(async (): Promise<void> => {
    const ctx = await ensureContext();
    if (!ctx) return;
    playTone(ctx, FREQ_START, ctx.currentTime, 0.15);
  }, [ensureContext]);

  const playWarning = useCallback(async (): Promise<void> => {
    const ctx = await ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(ctx, FREQ_WARNING, t, 0.12);
    playTone(ctx, FREQ_WARNING, t + 0.2, 0.12);
  }, [ensureContext]);

  const playComplete = useCallback(async (): Promise<void> => {
    const ctx = await ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(ctx, FREQ_COMPLETE, t, 0.12);
    playTone(ctx, FREQ_COMPLETE, t + 0.2, 0.12);
    playTone(ctx, FREQ_COMPLETE, t + 0.4, 0.2);
  }, [ensureContext]);

  return { playStart, playWarning, playComplete };
}
