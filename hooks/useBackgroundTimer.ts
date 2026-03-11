'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseBackgroundTimerReturn {
  remaining: number;
  isRunning: boolean;
  start: (seconds: number, onComplete?: () => void) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useBackgroundTimer(): UseBackgroundTimerReturn {
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const useWorkerRef = useRef(true);
  const remainingRef = useRef(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, []);

  const initWorker = useCallback((): boolean => {
    if (workerRef.current) return true;

    try {
      const worker = new Worker('/timer-worker.js');
      worker.onmessage = (e: MessageEvent) => {
        const { type, remaining: r } = e.data;
        if (type === 'tick') {
          setRemaining(r);
          remainingRef.current = r;
        } else if (type === 'complete') {
          setRemaining(0);
          setIsRunning(false);
          remainingRef.current = 0;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
          }
          onCompleteRef.current?.();
        } else if (type === 'paused') {
          setRemaining(r);
          remainingRef.current = r;
          setIsRunning(false);
        }
      };
      workerRef.current = worker;
      return true;
    } catch {
      useWorkerRef.current = false;
      return false;
    }
  }, []);

  const clearFallbackInterval = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const startFallbackTimer = useCallback((seconds: number) => {
    clearFallbackInterval();
    remainingRef.current = seconds;
    setRemaining(seconds);
    setIsRunning(true);

    fallbackIntervalRef.current = setInterval(() => {
      remainingRef.current--;
      if (remainingRef.current <= 0) {
        clearFallbackInterval();
        setRemaining(0);
        setIsRunning(false);
        remainingRef.current = 0;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(200);
        }
        onCompleteRef.current?.();
      } else {
        setRemaining(remainingRef.current);
      }
    }, 1000);
  }, [clearFallbackInterval]);

  const start = useCallback((seconds: number, onComplete?: () => void) => {
    onCompleteRef.current = onComplete || null;
    setRemaining(seconds);
    remainingRef.current = seconds;
    setIsRunning(true);

    if (useWorkerRef.current && initWorker()) {
      workerRef.current!.postMessage({ type: 'start', duration: seconds });
    } else {
      startFallbackTimer(seconds);
    }
  }, [initWorker, startFallbackTimer]);

  const pause = useCallback(() => {
    setIsRunning(false);

    if (useWorkerRef.current && workerRef.current) {
      workerRef.current.postMessage({ type: 'pause' });
    } else {
      clearFallbackInterval();
    }
  }, [clearFallbackInterval]);

  const resume = useCallback(() => {
    setIsRunning(true);

    if (useWorkerRef.current && workerRef.current) {
      workerRef.current.postMessage({ type: 'resume' });
    } else {
      startFallbackTimer(remainingRef.current);
    }
  }, [startFallbackTimer]);

  const stop = useCallback(() => {
    setRemaining(0);
    setIsRunning(false);
    remainingRef.current = 0;

    if (useWorkerRef.current && workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    } else {
      clearFallbackInterval();
    }
  }, [clearFallbackInterval]);

  return { remaining, isRunning, start, pause, resume, stop };
}
