'use client';

import { useCallback } from 'react';

/** Vibration patterns in milliseconds */
const PATTERNS = {
  /** Light tap — 50ms */
  tap: 50 as VibratePattern,
  /** Success feedback — two pulses */
  success: [100, 50, 100] as VibratePattern,
  /** PR celebration — five pulses */
  celebration: [200, 100, 200, 100, 200] as VibratePattern,
} as const;

interface HapticFeedback {
  /** Light tap — 50ms (button press, selection) */
  tap: () => void;
  /** Success pattern — 100-50-100ms */
  success: () => void;
  /** PR celebration — 200-100-200-100-200ms */
  celebration: () => void;
  /** Custom vibration pattern */
  custom: (pattern: VibratePattern) => void;
}

/**
 * Hook for haptic feedback via the Vibration API.
 * Feature-detects vibration support and no-ops on unsupported devices.
 */
export function useHapticFeedback(): HapticFeedback {
  const vibrate = useCallback((pattern: VibratePattern): void => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }, []);

  const tap = useCallback(() => vibrate(PATTERNS.tap), [vibrate]);
  const success = useCallback(() => vibrate(PATTERNS.success), [vibrate]);
  const celebration = useCallback(() => vibrate(PATTERNS.celebration), [vibrate]);
  const custom = useCallback((pattern: VibratePattern) => vibrate(pattern), [vibrate]);

  return { tap, success, celebration, custom };
}
