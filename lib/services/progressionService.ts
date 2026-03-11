/**
 * Progression Service
 *
 * RPE-based auto-progression engine that analyzes recent workout data
 * and suggests weight/rep adjustments for the next session.
 *
 * Rules:
 * 1. >50% failed sets -> reduce weight
 * 2. All sets at RPE 10 -> reduce weight
 * 3. RPE 6-7 and hitting reps -> increase weight (linear progression)
 * 4. RPE 8+ but hitting reps -> increase reps first
 * 5. RPE <6 -> bigger weight jump (double increment)
 * 6. Plateau detection -> suggest variation change or deload
 */

export interface ProgressionInput {
  exerciseId: string
  recentSets: Array<{
    weight: number
    reps: number
    rpe: number | null
    targetReps?: number
    failed?: boolean
    createdAt: Date | string
  }>
  bodyPart?: string
}

export interface ProgressionSuggestion {
  suggestedWeight: number
  suggestedReps: number
  strategy: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload' | 'reduce'
  reason: string
  confidence: 'high' | 'medium' | 'low'
  dataPoints: number
}

export function calculateProgression(input: ProgressionInput): ProgressionSuggestion {
  const { recentSets, bodyPart } = input
  const dataPoints = recentSets.length

  // Insufficient data
  if (dataPoints < 3) {
    const lastSet = recentSets[recentSets.length - 1]
    return {
      suggestedWeight: lastSet?.weight || 0,
      suggestedReps: lastSet?.reps || 8,
      strategy: 'maintain',
      reason: 'Insufficient data (need 3+ sets). Keep current weight and reps.',
      confidence: 'low',
      dataPoints,
    }
  }

  // Calculate averages
  const rpeValues = recentSets.map(s => s.rpe ?? 7) // default null RPE to 7
  const avgRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
  const nullRPECount = recentSets.filter(s => s.rpe === null).length
  const hasReliableRPE = nullRPECount < dataPoints * 0.5

  const lastWeight = recentSets[recentSets.length - 1].weight
  const lastReps = recentSets[recentSets.length - 1].reps

  // Failed set ratio
  const failedSets = recentSets.filter(s => s.failed).length
  const failedRatio = failedSets / dataPoints

  // Confidence based on data points and RPE reliability
  let confidence: 'high' | 'medium' | 'low'
  if (dataPoints >= 10 && hasReliableRPE) confidence = 'high'
  else if (dataPoints >= 5) confidence = 'medium'
  else confidence = 'low'

  if (!hasReliableRPE) confidence = 'low'

  // Increment size based on body part
  const increment = getIncrement(bodyPart)

  // Rule 1: >50% failed sets -> reduce weight
  if (failedRatio > 0.5) {
    return {
      suggestedWeight: Math.max(0, lastWeight - 5),
      suggestedReps: lastReps,
      strategy: 'reduce',
      reason: `${Math.round(failedRatio * 100)}% of sets failed. Reduce weight by 5 lbs to build consistency.`,
      confidence,
      dataPoints,
    }
  }

  // Rule 2: All sets at RPE 10 -> reduce
  if (avgRPE >= 9.5) {
    return {
      suggestedWeight: Math.max(0, lastWeight - 5),
      suggestedReps: lastReps,
      strategy: 'reduce',
      reason: 'Average RPE is 9.5+. Weight is too heavy. Reduce by 5 lbs.',
      confidence,
      dataPoints,
    }
  }

  // Rule 3: RPE 6-7 and hitting reps -> increase weight (linear progression)
  if (avgRPE >= 6 && avgRPE <= 7) {
    // Check if hitting target reps
    const hittingReps = recentSets.every(s => !s.targetReps || s.reps >= s.targetReps)
    if (hittingReps) {
      return {
        suggestedWeight: lastWeight + increment,
        suggestedReps: lastReps,
        strategy: 'increase_weight',
        reason: `Average RPE ${avgRPE.toFixed(1)} with all reps hit. Ready to add ${increment} lbs.`,
        confidence,
        dataPoints,
      }
    }
  }

  // Rule 4: RPE 8+ but hitting reps -> increase reps
  if (avgRPE >= 8 && avgRPE < 9.5) {
    const hittingReps = recentSets.filter(s => !s.targetReps || s.reps >= s.targetReps).length
    if (hittingReps >= dataPoints * 0.7) {
      return {
        suggestedWeight: lastWeight,
        suggestedReps: lastReps + 1,
        strategy: 'increase_reps',
        reason: `Average RPE ${avgRPE.toFixed(1)} — add 1 rep before increasing weight.`,
        confidence,
        dataPoints,
      }
    }
  }

  // Rule 5: RPE too low (<6) -> bigger jump
  if (avgRPE < 6) {
    return {
      suggestedWeight: lastWeight + increment * 2,
      suggestedReps: lastReps,
      strategy: 'increase_weight',
      reason: `Average RPE ${avgRPE.toFixed(1)} — weight is too easy. Add ${increment * 2} lbs.`,
      confidence,
      dataPoints,
    }
  }

  // Plateau detection: check if weight hasn't changed in recent sets
  const uniqueWeights = new Set(recentSets.map(s => s.weight))
  if (uniqueWeights.size === 1 && dataPoints >= 6) {
    return {
      suggestedWeight: lastWeight,
      suggestedReps: lastReps,
      strategy: 'maintain',
      reason: 'Plateau detected — same weight for 6+ sets. Consider a variation change or deload week.',
      confidence,
      dataPoints,
    }
  }

  // Default: maintain
  return {
    suggestedWeight: lastWeight,
    suggestedReps: lastReps,
    strategy: 'maintain',
    reason: `Mixed signals (RPE ${avgRPE.toFixed(1)}). Maintain current prescription and reassess next session.`,
    confidence,
    dataPoints,
  }
}

function getIncrement(bodyPart?: string): number {
  if (!bodyPart) return 5
  const lower = ['legs', 'glutes', 'quadriceps', 'hamstrings', 'calves']
  const upperCompound = ['chest', 'back', 'lats']
  const upperIsolation = ['biceps', 'triceps', 'shoulders', 'forearms', 'neck']

  const bp = bodyPart.toLowerCase()
  if (lower.some(l => bp.includes(l))) return 5
  if (upperCompound.some(u => bp.includes(u))) return 5
  if (upperIsolation.some(u => bp.includes(u))) return 2.5
  return 5
}
