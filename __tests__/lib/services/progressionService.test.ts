/**
 * @jest-environment node
 */

import { calculateProgression, ProgressionInput, ProgressionSuggestion } from '@/lib/services/progressionService'

function makeSets(
  count: number,
  overrides: Partial<ProgressionInput['recentSets'][0]> = {}
): ProgressionInput['recentSets'] {
  return Array.from({ length: count }, (_, i) => ({
    weight: 100,
    reps: 10,
    rpe: 7 as number | null,
    createdAt: new Date(Date.now() - (count - i) * 86400000),
    ...overrides,
  }))
}

describe('calculateProgression', () => {
  // Test 1: RPE 6-7 with all reps hit -> increase_weight
  it('suggests increase_weight when RPE 6-7 and all reps hit', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 }),
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(105) // +5 default increment
  })

  // Test 2: RPE 6-7 with all reps hit, lower body -> +5 lbs
  it('suggests +5 lbs for lower body exercises', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 }),
      bodyPart: 'quadriceps',
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(105)
  })

  // Test 3: RPE 6-7 with all reps hit, upper isolation (biceps) -> +2.5 lbs
  it('suggests +2.5 lbs for upper isolation exercises', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 }),
      bodyPart: 'biceps',
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(102.5)
  })

  // Test 4: RPE 8+ with reps hit -> increase_reps (+1)
  it('suggests increase_reps when RPE 8-9 and reps hit', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 8.5, targetReps: 10, reps: 10 }),
    })
    expect(result.strategy).toBe('increase_reps')
    expect(result.suggestedReps).toBe(11)
    expect(result.suggestedWeight).toBe(100) // weight unchanged
  })

  // Test 5: >50% failed sets -> reduce (-5 lbs)
  it('suggests reduce when >50% of sets failed', () => {
    const sets = makeSets(4, { rpe: 8, failed: true })
    // Make one set not failed
    sets[0].failed = false
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: sets,
    })
    expect(result.strategy).toBe('reduce')
    expect(result.suggestedWeight).toBe(95) // -5
    expect(result.reason).toContain('failed')
  })

  // Test 6: RPE 8-9 mixed hits -> maintain
  it('suggests maintain when RPE 8-9 but not enough reps hit', () => {
    const sets = makeSets(5, { rpe: 8.5, targetReps: 10 })
    // Make more than 30% miss their target
    sets[0].reps = 7
    sets[1].reps = 7
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: sets,
    })
    // Not enough hits for increase_reps, falls to default maintain
    expect(result.strategy).toBe('maintain')
  })

  // Test 7: NULL RPE treated as 7, low confidence
  it('treats null RPE as 7 and sets low confidence', () => {
    const sets = makeSets(5, { rpe: null, targetReps: 10, reps: 10 })
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: sets,
    })
    // All null RPE -> treated as 7 -> RPE 6-7 range -> increase_weight
    expect(result.strategy).toBe('increase_weight')
    expect(result.confidence).toBe('low') // >50% null RPE
  })

  // Test 8: <3 sets -> maintain with low confidence "Insufficient data"
  it('returns maintain with low confidence for <3 sets', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(2, { rpe: 7 }),
    })
    expect(result.strategy).toBe('maintain')
    expect(result.confidence).toBe('low')
    expect(result.reason).toContain('Insufficient data')
    expect(result.suggestedWeight).toBe(100)
    expect(result.suggestedReps).toBe(10)
  })

  // Test 9: 0 sets -> maintain with low confidence
  it('returns maintain with low confidence for 0 sets', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: [],
    })
    expect(result.strategy).toBe('maintain')
    expect(result.confidence).toBe('low')
    expect(result.suggestedWeight).toBe(0)
    expect(result.suggestedReps).toBe(8)
    expect(result.dataPoints).toBe(0)
  })

  // Test 10: Plateau: same weight for 6+ sets -> mention variation change
  it('detects plateau when same weight for 6+ sets', () => {
    // Need RPE that doesn't trigger other rules first
    // RPE 7.5 doesn't match 6-7 range, doesn't match 8+, doesn't match <6
    const sets = makeSets(6, { rpe: 7.5, weight: 100 })
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: sets,
    })
    expect(result.strategy).toBe('maintain')
    expect(result.reason).toContain('Plateau')
    expect(result.reason).toContain('variation change')
  })

  // Test 11: High confidence with 10+ data points
  it('returns high confidence with 10+ data points and reliable RPE', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(10, { rpe: 6.5, targetReps: 10, reps: 10 }),
    })
    expect(result.confidence).toBe('high')
  })

  // Test 12: Medium confidence with 5-9 data points
  it('returns medium confidence with 5-9 data points', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(7, { rpe: 6.5, targetReps: 10, reps: 10 }),
    })
    expect(result.confidence).toBe('medium')
  })

  // Test 13: Low confidence with 3-4 data points
  it('returns low confidence with 3-4 data points', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(3, { rpe: 6.5, targetReps: 10, reps: 10 }),
    })
    expect(result.confidence).toBe('low')
  })

  // Test 14: Low confidence when >50% null RPE
  it('returns low confidence when >50% of RPE values are null', () => {
    const sets = makeSets(10, { targetReps: 10, reps: 10 })
    // Set 6 out of 10 to null RPE (>50%)
    for (let i = 0; i < 6; i++) {
      sets[i].rpe = null
    }
    // Rest have RPE 7, null defaults to 7 too, so avg ~7
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: sets,
    })
    expect(result.confidence).toBe('low')
  })

  // Test 15: RPE <6 -> increase_weight with double increment
  it('suggests double increment when RPE <6', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 4, targetReps: 10, reps: 10 }),
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(110) // +5*2 = +10
    expect(result.reason).toContain('too easy')
  })

  // Test 16: RPE 10 -> reduce
  it('suggests reduce when average RPE is 9.5+', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 10 }),
    })
    expect(result.strategy).toBe('reduce')
    expect(result.suggestedWeight).toBe(95)
    expect(result.reason).toContain('9.5+')
  })

  // Test 17: Default body part -> +5 lbs
  it('uses +5 lbs increment for unknown body part', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 }),
      bodyPart: 'other',
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(105)
  })

  // Test 18: Returns correct dataPoints count
  it('returns correct dataPoints count', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(7, { rpe: 7 }),
    })
    expect(result.dataPoints).toBe(7)
  })

  // Test 19: Uses last set weight for suggestion base
  it('uses last set weight for suggestion base', () => {
    const sets = makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 })
    sets[4].weight = 120 // last set has different weight
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: sets,
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(125) // 120 + 5
  })

  // Test 20: Handles zero weight gracefully
  it('handles zero weight gracefully', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 10, weight: 0 }),
    })
    expect(result.strategy).toBe('reduce')
    expect(result.suggestedWeight).toBe(0) // Math.max(0, 0 - 5) = 0
  })

  // Test 21: Upper compound body part uses +5
  it('uses +5 lbs for upper compound (chest)', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 }),
      bodyPart: 'chest',
    })
    expect(result.suggestedWeight).toBe(105)
  })

  // Test 22: Shoulders (isolation) uses +2.5
  it('uses +2.5 lbs for shoulders (isolation)', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 6.5, targetReps: 10, reps: 10 }),
      bodyPart: 'shoulders',
    })
    expect(result.suggestedWeight).toBe(102.5)
  })

  // Test 23: Double increment for isolation when RPE <6
  it('uses double isolation increment (5 lbs) when RPE <6 for biceps', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 4, targetReps: 10, reps: 10 }),
      bodyPart: 'biceps',
    })
    expect(result.strategy).toBe('increase_weight')
    expect(result.suggestedWeight).toBe(105) // 100 + 2.5*2 = 105
  })

  // Test 24: Reduce never goes below zero
  it('never suggests negative weight', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: makeSets(5, { rpe: 10, weight: 3 }),
    })
    expect(result.suggestedWeight).toBeGreaterThanOrEqual(0)
  })

  // Test 25: 1 set -> insufficient data, uses that set's values
  it('uses single set values for insufficient data', () => {
    const result = calculateProgression({
      exerciseId: 'ex-1',
      recentSets: [{ weight: 45, reps: 12, rpe: 6, createdAt: new Date() }],
    })
    expect(result.strategy).toBe('maintain')
    expect(result.suggestedWeight).toBe(45)
    expect(result.suggestedReps).toBe(12)
    expect(result.reason).toContain('Insufficient data')
  })
})
