/**
 * RestTimer Component
 *
 * Countdown timer for rest periods between sets.
 * Supports background execution and audio notifications.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCw, X, Bell } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onClose?: () => void;
  autoStart?: boolean;
}

const PRESETS = [30, 60, 90, 120, 180];

export function RestTimer({
  initialSeconds = 90,
  onComplete,
  onClose,
  autoStart = false,
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [customTime, setCustomTime] = useState(initialSeconds);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef(initialSeconds);

  // Countdown logic
  useEffect(() => {
    remainingRef.current = seconds;

    if (isRunning && !isPaused && seconds > 0) {
      intervalRef.current = setInterval(() => {
        remainingRef.current -= 1;

        if (remainingRef.current <= 0) {
          // Timer complete
          clearInterval(intervalRef.current!);
          setSeconds(0);
          setIsRunning(false);
          playSound();
          onComplete?.();
        } else {
          setSeconds(remainingRef.current);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, isPaused, seconds, onComplete]);

  const playSound = useCallback(() => {
    if (!audioEnabled) return;

    // Play beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(
      0.00001,
      audioContext.currentTime + 0.5
    );

    setTimeout(() => oscillator.stop(), 500);
  }, [audioEnabled]);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setSeconds(customTime);
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleAddTime = (amount: number) => {
    const newTime = Math.max(0, seconds + amount);
    setSeconds(newTime);
    setCustomTime(newTime);
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((customTime - seconds) / customTime) * 100;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rest Timer</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold font-mono mb-2">
            {formatTime(seconds)}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progress}%`,
                backgroundColor: isRunning
                  ? seconds > 10
                    ? 'rgb(239, 68, 68)'
                    : 'rgb(34, 197, 94)'
                  : 'rgb(203, 213, 225)',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Main Controls */}
          <div className="flex justify-center gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button onClick={handlePause} size="lg">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset} size="lg">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Quick Add Time */}
          {!isRunning && (
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTime(-15)}
              >
                -15s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTime(-10)}
              >
                -10s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTime(-5)}
              >
                -5s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTime(5)}
              >
                +5s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTime(10)}
              >
                +10s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTime(15)}
              >
                +15s
              </Button>
            </div>
          )}

          {/* Presets */}
          <div className="flex justify-center gap-2 flex-wrap">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={seconds === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSeconds(preset);
                  setCustomTime(preset);
                }}
                disabled={isRunning}
              >
                {preset}s
              </Button>
            ))}
          </div>

          {/* Audio Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              <Bell className={`h-4 w-4 mr-2 ${audioEnabled ? 'text-yellow-600' : ''}`} />
              {audioEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </div>
        </div>

        {/* Custom Time Input */}
        {!isRunning && (
          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              placeholder="Custom time (seconds)"
              value={customTime !== initialSeconds ? customTime : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value) || initialSeconds;
                setCustomTime(val);
                setSeconds(val);
              }}
              className="w-32"
              min="0"
            />
            <Button
              size="sm"
              onClick={() => {
                setSeconds(customTime);
              }}
            >
              Set
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
