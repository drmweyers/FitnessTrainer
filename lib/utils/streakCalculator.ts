/**
 * Workout Streak Calculator
 *
 * Calculates current and best workout streaks from workout completion dates.
 */

interface StreakData {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Calculate workout streaks from an array of workout completion dates
 *
 * @param completionDates - Array of ISO date strings when workouts were completed
 * @returns Object containing current and best streak counts
 */
export function calculateWorkoutStreaks(completionDates: string[]): StreakData {
  if (!completionDates || completionDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Convert to date strings (YYYY-MM-DD) and sort descending (newest first)
  const uniqueDates = Array.from(
    new Set(
      completionDates.map(date => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Check if there's activity today or yesterday to start current streak
  const latestDate = uniqueDates[0];
  if (latestDate === today || latestDate === yesterday) {
    currentStreak = 1;
    let expectedDate = new Date(latestDate);

    // Count consecutive days going backward
    for (let i = 1; i < uniqueDates.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate best streak by checking all consecutive sequences
  for (let i = 0; i < uniqueDates.length; i++) {
    tempStreak = 1;
    let checkDate = new Date(uniqueDates[i]);

    for (let j = i + 1; j < uniqueDates.length; j++) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      if (uniqueDates[j] === checkDateStr) {
        tempStreak++;
      } else {
        break;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak);
  }

  // Current streak should not exceed best streak
  bestStreak = Math.max(bestStreak, currentStreak);

  return { currentStreak, bestStreak };
}
