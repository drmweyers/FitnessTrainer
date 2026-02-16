'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface WorkoutStreakProps {
  currentStreak: number;
  bestStreak: number;
}

/**
 * WorkoutStreak Component
 *
 * Displays current and best workout streaks with visual indicators.
 * Streaks are calculated from consecutive days with completed workouts.
 */
export default function WorkoutStreak({ currentStreak, bestStreak }: WorkoutStreakProps) {
  const isStreakActive = currentStreak > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
          Workout Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Current Streak */}
          <div className="text-center">
            <div className={`text-3xl font-bold ${isStreakActive ? 'text-orange-600' : 'text-gray-400'}`}>
              {currentStreak}
              {isStreakActive && currentStreak > 0 && (
                <span className="ml-1 text-orange-500">🔥</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Current Streak</p>
            <p className="text-xs text-gray-400">
              {currentStreak === 0 ? 'Start your streak today!' : `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
            </p>
          </div>

          {/* Best Streak */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {bestStreak}
              {bestStreak > 7 && (
                <span className="ml-1">🏆</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Best Streak</p>
            <p className="text-xs text-gray-400">
              {bestStreak === 0 ? 'Complete workouts daily' : `${bestStreak} ${bestStreak === 1 ? 'day' : 'days'}`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {bestStreak > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentStreak / bestStreak) * 100, 100)}%` }}
              />
            </div>
            {currentStreak < bestStreak && currentStreak > 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {bestStreak - currentStreak} {bestStreak - currentStreak === 1 ? 'day' : 'days'} to beat your record!
              </p>
            )}
            {currentStreak === bestStreak && currentStreak > 0 && (
              <p className="text-xs text-orange-600 font-medium text-center mt-2">
                New personal best! Keep it up! 🎉
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
