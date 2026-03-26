'use client';

import { useEffect } from 'react';

interface MediaSessionHandlers {
  /** Resume workout timer */
  onPlay?: () => void;
  /** Pause workout timer */
  onPause?: () => void;
  /** Skip to next exercise */
  onNextTrack?: () => void;
}

/**
 * Hook to set up the Media Session API for lock screen controls during workouts.
 *
 * When a workout is active, this exposes playback controls on the device lock screen
 * and notification area so users can control their workout without unlocking.
 *
 * @param workoutTitle - The name of the current workout (shown on lock screen)
 * @param handlers - Callbacks for lock screen actions (play, pause, next exercise)
 */
export function useMediaSession(
  workoutTitle: string,
  handlers: MediaSessionHandlers
): void {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession) {
      return;
    }

    // Set lock screen metadata
    if (typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: workoutTitle,
        artist: 'EvoFit',
        album: 'Active Workout',
      });
    }

    // Register action handlers
    if (handlers.onPlay) {
      navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    }
    if (handlers.onPause) {
      navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    }
    if (handlers.onNextTrack) {
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNextTrack);
    }

    // Cleanup on unmount
    return () => {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession) {
        return;
      }
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      } catch {
        // Some browsers may throw when clearing handlers — safe to ignore
      }
    };
  }, [workoutTitle, handlers.onPlay, handlers.onPause, handlers.onNextTrack]);
}
