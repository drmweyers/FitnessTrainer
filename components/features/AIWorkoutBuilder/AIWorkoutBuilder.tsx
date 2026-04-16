'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2, Loader2, Check, ExternalLink, ChevronDown, ChevronUp, X, Plus, Target, Dumbbell } from 'lucide-react'
import { Exercise } from '@/types/exercise'
import { createProgram } from '@/lib/api/programs'
import { ProgramType, DifficultyLevel, WorkoutType, SetType } from '@/types/program'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkoutPreferences {
  requirements: string                          // free-text textbox
  programType: ProgramType | ''
  focusArea: string
  difficulty: DifficultyLevel
  sessionDuration: number                       // minutes per session
  durationWeeks: number                         // 1-12
  daysPerWeek: number                           // 1-7
  equipmentAvailable: string[]
  workoutType: WorkoutType
  goals: string[]
}

interface WorkoutExerciseEntry {
  exercise: Exercise
  sets: number
  reps: string
  rest: number  // seconds
  week?: number // for progressive overload tracking
}

interface DayWorkout {
  dayNumber: number
  name: string
  exercises: WorkoutExerciseEntry[]
  estimatedDuration: number
  muscleGroups: string[]
}

interface GeneratedProgram {
  id: string
  name: string
  programType: ProgramType
  difficulty: DifficultyLevel
  durationWeeks: number
  daysPerWeek: number
  weeks: DayWorkout[][]  // [weekIndex][dayIndex]
  goals: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FOCUS_AREA_OPTIONS = [
  'upper body',
  'lower body',
  'full body',
  'core',
  'push',
  'pull',
  'legs',
  'cardio',
]

const EQUIPMENT_OPTIONS = [
  'body weight',
  'dumbbell',
  'barbell',
  'cable',
  'kettlebell',
  'machine',
  'resistance band',
  'any',
]

const PROGRAM_TYPES: { value: ProgramType; label: string }[] = [
  { value: ProgramType.STRENGTH, label: 'Strength Training' },
  { value: ProgramType.HYPERTROPHY, label: 'Muscle Building (Hypertrophy)' },
  { value: ProgramType.ENDURANCE, label: 'Endurance' },
  { value: ProgramType.POWERLIFTING, label: 'Powerlifting' },
  { value: ProgramType.GENERAL_FITNESS, label: 'General Fitness' },
  { value: ProgramType.WEIGHT_LOSS, label: 'Weight Loss' },
  { value: ProgramType.MUSCLE_GAIN, label: 'Muscle Gain' },
  { value: ProgramType.REHABILITATION, label: 'Rehabilitation' },
  { value: ProgramType.CARDIO, label: 'Cardio' },
  { value: ProgramType.FLEXIBILITY, label: 'Flexibility & Mobility' },
]

const COMMON_GOALS = [
  'Build Strength',
  'Gain Muscle',
  'Lose Weight',
  'Improve Endurance',
  'Increase Power',
  'Enhance Athletic Performance',
  'Better Health',
  'Establish Routine',
  'Rehabilitation',
  'General Fitness',
]

// Body-part groupings for muscle balance logic
const PUSH_PARTS = ['chest', 'shoulders', 'upper arms', 'triceps']
const PULL_PARTS = ['back', 'upper arms', 'biceps', 'lats']
const LEG_PARTS = ['upper legs', 'lower legs', 'glutes', 'hamstrings', 'quadriceps', 'calves']
const CORE_PARTS = ['waist', 'core', 'abs']

// Day-name templates per daysPerWeek
const DAY_NAME_SPLITS: Record<number, string[]> = {
  1: ['Full Body'],
  2: ['Upper Body', 'Lower Body'],
  3: ['Push', 'Pull', 'Legs'],
  4: ['Upper Body A', 'Lower Body A', 'Upper Body B', 'Lower Body B'],
  5: ['Push', 'Pull', 'Legs', 'Upper Body', 'Full Body'],
  6: ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'],
  7: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Full Body', 'Active Recovery'],
}

// Focus-area → body parts mapping for exercise filtering
const FOCUS_TO_BODY_PARTS: Record<string, string[]> = {
  'upper body': ['chest', 'back', 'shoulders', 'upper arms'],
  'lower body': ['upper legs', 'lower legs'],
  'full body': [],  // no filter
  'core': ['waist'],
  'push': ['chest', 'shoulders', 'upper arms'],
  'pull': ['back', 'upper arms'],
  'legs': ['upper legs', 'lower legs'],
  'cardio': ['cardio'],
}

// Sets/reps/rest presets per workout type
const WORKOUT_PRESETS: Record<WorkoutType | string, { sets: number; reps: string; rest: number }> = {
  [WorkoutType.STRENGTH]:   { sets: 5, reps: '3-5',    rest: 180 },
  [WorkoutType.HIIT]:       { sets: 4, reps: '8-12',   rest: 90  },
  [WorkoutType.CARDIO]:     { sets: 3, reps: '30-60s', rest: 30  },
  [WorkoutType.FLEXIBILITY]:{ sets: 2, reps: '30s hold',rest: 15 },
  [WorkoutType.MIXED]:      { sets: 3, reps: '10-12',  rest: 60  },
  [WorkoutType.RECOVERY]:   { sets: 2, reps: '15-20',  rest: 30  },
  'hypertrophy':            { sets: 4, reps: '8-12',   rest: 90  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRequirementsText(text: string): {
  bodyParts: string[]
  equipment: string[]
  goals: string[]
  daysHint: number | null
  durationHint: number | null
} {
  const lower = text.toLowerCase()

  // Body parts
  const bodyPartKeywords: Record<string, string[]> = {
    chest: ['chest', 'pectoral', 'pec'],
    shoulders: ['shoulder', 'delt'],
    back: ['back', 'lat', 'rhomboid', 'trapezius', 'trap'],
    'upper arms': ['bicep', 'tricep', 'arm'],
    'upper legs': ['quad', 'hamstring', 'leg', 'glute', 'thigh'],
    'lower legs': ['calf', 'calves', 'shin'],
    waist: ['core', 'abs', 'abdominal', 'oblique', 'waist'],
    cardio: ['cardio', 'aerobic', 'hiit', 'interval'],
  }
  const foundBodyParts: string[] = []
  for (const [part, keywords] of Object.entries(bodyPartKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      foundBodyParts.push(part)
    }
  }

  // Equipment
  const equipKeywords: Record<string, string[]> = {
    dumbbell: ['dumbbell', 'db', 'dumbbells'],
    barbell: ['barbell', 'bb', 'bar'],
    cable: ['cable', 'cables'],
    kettlebell: ['kettlebell', 'kb'],
    machine: ['machine'],
    'resistance band': ['band', 'resistance band'],
    'body weight': ['bodyweight', 'body weight', 'no equipment', 'calisthenics'],
  }
  const foundEquipment: string[] = []
  for (const [eq, keywords] of Object.entries(equipKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      foundEquipment.push(eq)
    }
  }

  // Days hint
  const daysMatch = lower.match(/(\d)\s*days?\s*(per|a)\s*week/)
  const daysHint = daysMatch ? parseInt(daysMatch[1]) : null

  // Duration hint
  const durationMatch = lower.match(/(\d+)\s*min/)
  const durationHint = durationMatch ? parseInt(durationMatch[1]) : null

  // Goals
  const goalKeywords: Record<string, string[]> = {
    'Build Strength': ['strength', 'strong'],
    'Gain Muscle': ['muscle', 'hypertrophy', 'mass'],
    'Lose Weight': ['weight loss', 'fat loss', 'cut', 'lean'],
    'Improve Endurance': ['endurance', 'cardio', 'aerobic'],
    'Better Health': ['health', 'wellness'],
  }
  const foundGoals: string[] = []
  for (const [goal, keywords] of Object.entries(goalKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      foundGoals.push(goal)
    }
  }

  return { bodyParts: foundBodyParts, equipment: foundEquipment, goals: foundGoals, daysHint, durationHint }
}

function getBodyPartsForDay(dayName: string, focusArea: string, requirements: ReturnType<typeof parseRequirementsText>): string[] {
  const lowerDay = dayName.toLowerCase()

  // Explicit day-type targeting
  if (lowerDay.includes('push'))       return PUSH_PARTS
  if (lowerDay.includes('pull'))       return PULL_PARTS
  if (lowerDay.includes('leg'))        return LEG_PARTS
  if (lowerDay.includes('chest'))      return ['chest']
  if (lowerDay.includes('back'))       return ['back']
  if (lowerDay.includes('shoulder'))   return ['shoulders']
  if (lowerDay.includes('arm'))        return ['upper arms']
  if (lowerDay.includes('core'))       return CORE_PARTS
  if (lowerDay.includes('upper'))      return [...PUSH_PARTS, ...PULL_PARTS]
  if (lowerDay.includes('lower'))      return LEG_PARTS
  if (lowerDay.includes('recovery'))   return []  // will grab light/flexibility

  // Parsed requirements body parts take priority
  if (requirements.bodyParts.length > 0) return requirements.bodyParts

  // Fall back to focus area
  return FOCUS_TO_BODY_PARTS[focusArea] ?? []
}

function filterExercisesForDay(
  exercises: Exercise[],
  bodyParts: string[],
  equipment: string[],
  difficulty: DifficultyLevel,
  usedIds: Set<string>
): Exercise[] {
  let filtered = exercises.filter(ex => !usedIds.has(ex.id))

  // Equipment filter (skip if 'any' is selected)
  if (equipment.length > 0 && !equipment.includes('any')) {
    const normalized = equipment.map(e => e.toLowerCase())
    const withEquip = filtered.filter(ex => {
      const exEquip = (ex.equipment || '').toLowerCase()
      const exEquips = (ex.equipments || []).map(e => e.toLowerCase())
      return normalized.some(eq => exEquip.includes(eq) || exEquips.some(e => e.includes(eq)))
    })
    if (withEquip.length >= 3) filtered = withEquip
  }

  // Body part filter
  if (bodyParts.length > 0) {
    const normalized = bodyParts.map(bp => bp.toLowerCase())
    const withParts = filtered.filter(ex => {
      const parts = (ex.bodyParts || []).map(bp => bp.toLowerCase())
      const muscles = (ex.targetMuscles || []).map(m => m.toLowerCase())
      return normalized.some(bp =>
        parts.some(p => p.includes(bp) || bp.includes(p)) ||
        muscles.some(m => m.includes(bp) || bp.includes(m))
      )
    })
    if (withParts.length >= 3) filtered = withParts
  }

  // Difficulty filter (soft — only apply if enough exercises remain)
  const withDifficulty = filtered.filter(ex => !ex.difficulty || ex.difficulty === difficulty)
  if (withDifficulty.length >= 3) filtered = withDifficulty

  return filtered
}

function selectExercisesForDay(
  pool: Exercise[],
  count: number,
  weekIndex: number,
  dayIndex: number,
  allWeekUsedIds: Set<string>
): Exercise[] {
  // Prefer exercises not used this week, then fall back
  const preferredPool = pool.filter(ex => !allWeekUsedIds.has(ex.id))
  const sourcePool = preferredPool.length >= count ? preferredPool : pool

  // Deterministic but varied shuffle (seed by week+day)
  const seed = (weekIndex * 31 + dayIndex * 17) % 100
  const shuffled = [...sourcePool].sort((a, b) => {
    const hashA = (a.id.charCodeAt(0) + seed) % 100
    const hashB = (b.id.charCodeAt(0) + seed) % 100
    return hashA - hashB
  })

  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function getSetRepConfig(
  workoutType: WorkoutType,
  programType: ProgramType | '',
  weekIndex: number,
  totalWeeks: number
): { sets: number; reps: string; rest: number } {
  const baseKey = programType === ProgramType.HYPERTROPHY ? 'hypertrophy' : workoutType
  const base = WORKOUT_PRESETS[baseKey] ?? WORKOUT_PRESETS[WorkoutType.MIXED]

  // Progressive overload: increase reps by ~1-2 per 3 weeks
  const progressionPhase = Math.floor(weekIndex / 3)
  let adjustedReps = base.reps

  // Only adjust numeric rep ranges
  const rangeMatch = base.reps.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1]) + progressionPhase
    const high = parseInt(rangeMatch[2]) + progressionPhase
    adjustedReps = `${low}-${high}`
  }

  return { sets: base.sets, reps: adjustedReps, rest: base.rest }
}

function generateProgram(prefs: WorkoutPreferences, exercises: Exercise[]): GeneratedProgram {
  const parsed = parseRequirementsText(prefs.requirements)

  // Merge requirements-parsed with structured inputs
  const resolvedDays = Math.min(7, Math.max(1, prefs.daysPerWeek))
  const resolvedWeeks = Math.min(12, Math.max(1, prefs.durationWeeks))
  const resolvedEquipment = prefs.equipmentAvailable.length > 0 ? prefs.equipmentAvailable : parsed.equipment
  const exercisesPerDay = Math.max(4, Math.min(10, Math.floor(prefs.sessionDuration / 6)))

  const dayNames = DAY_NAME_SPLITS[resolvedDays] ?? Array.from({ length: resolvedDays }, (_, i) => `Day ${i + 1}`)

  const resolvedProgramType = prefs.programType !== '' ? prefs.programType : ProgramType.GENERAL_FITNESS
  const mergedGoals = Array.from(new Set([...prefs.goals, ...parsed.goals]))

  const allWeeks: DayWorkout[][] = []

  for (let w = 0; w < resolvedWeeks; w++) {
    const weekDays: DayWorkout[] = []
    const weekUsedIds = new Set<string>()

    for (let d = 0; d < resolvedDays; d++) {
      const dayName = dayNames[d] ?? `Day ${d + 1}`
      const bodyParts = getBodyPartsForDay(dayName, prefs.focusArea, parsed)
      const pool = filterExercisesForDay(exercises, bodyParts, resolvedEquipment, prefs.difficulty, new Set())
      const selected = selectExercisesForDay(pool, exercisesPerDay, w, d, weekUsedIds)

      // Track used IDs so next day in the same week avoids repeats
      selected.forEach(ex => weekUsedIds.add(ex.id))

      const { sets, reps, rest } = getSetRepConfig(prefs.workoutType, prefs.programType, w, resolvedWeeks)

      const workoutExercises: WorkoutExerciseEntry[] = selected.map(ex => ({
        exercise: ex,
        sets,
        reps,
        rest,
        week: w + 1,
      }))

      weekDays.push({
        dayNumber: d + 1,
        name: `${dayName}`,
        exercises: workoutExercises,
        estimatedDuration: prefs.sessionDuration,
        muscleGroups: bodyParts,
      })
    }

    allWeeks.push(weekDays)
  }

  // Build a human-readable program name
  const focusLabel = prefs.focusArea.charAt(0).toUpperCase() + prefs.focusArea.slice(1)
  const typeLabel = PROGRAM_TYPES.find(pt => pt.value === prefs.programType)?.label ?? 'General Fitness'
  const programName = `${resolvedWeeks}-Week ${focusLabel} ${typeLabel}`

  return {
    id: `ai-program-${Date.now()}`,
    name: programName,
    programType: resolvedProgramType,
    difficulty: prefs.difficulty,
    durationWeeks: resolvedWeeks,
    daysPerWeek: resolvedDays,
    weeks: allWeeks,
    goals: mergedGoals,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIWorkoutBuilder() {
  const router = useRouter()

  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    requirements: '',
    programType: '',
    focusArea: 'full body',
    difficulty: DifficultyLevel.INTERMEDIATE,
    sessionDuration: 45,
    durationWeeks: 4,
    daysPerWeek: 3,
    equipmentAvailable: ['body weight'],
    workoutType: WorkoutType.MIXED,
    goals: [],
  })

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exercisesLoaded, setExercisesLoaded] = useState(false)
  const [exercisesLoading, setExercisesLoading] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedProgramId, setSavedProgramId] = useState<string | null>(null)
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgram | null>(null)

  // Tabs for generated results
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [selectedDay, setSelectedDay] = useState(0)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // ── Load exercises on first generate click (lazy load) ─────────────────────
  const ensureExercisesLoaded = async (): Promise<Exercise[]> => {
    if (exercisesLoaded) return exercises

    setExercisesLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '2000', sortBy: 'name', sortOrder: 'asc' })
      const response = await fetch(`/api/exercises?${params}`)
      if (response.ok) {
        const data = await response.json()
        const loaded: Exercise[] = data.exercises ?? []
        setExercises(loaded)
        setExercisesLoaded(true)
        return loaded
      }
    } catch (err) {
      console.error('Failed to load exercises:', err)
    } finally {
      setExercisesLoading(false)
    }
    return []
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true)
    setSaveError(null)
    setSavedProgramId(null)

    const loaded = await ensureExercisesLoaded()
    if (loaded.length === 0) {
      setGenerating(false)
      setSaveError('Failed to load exercise library. Please try again.')
      return
    }

    // Brief artificial delay for UX feedback
    await new Promise(r => setTimeout(r, 600))

    const program = generateProgram(preferences, loaded)
    setGeneratedProgram(program)
    setSelectedWeek(0)
    setSelectedDay(0)
    setExpandedDays(new Set())
    setGenerating(false)
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!generatedProgram) return

    setSaving(true)
    setSaveError(null)

    try {
      const mapDifficulty = (d: DifficultyLevel): DifficultyLevel => d
      const mapWorkoutType = (wt: WorkoutType): WorkoutType => wt

      const programData = {
        name: generatedProgram.name,
        description: `AI-generated ${generatedProgram.durationWeeks}-week ${preferences.focusArea} program. Goals: ${generatedProgram.goals.join(', ') || 'General Fitness'}.`,
        programType: generatedProgram.programType,
        difficultyLevel: mapDifficulty(generatedProgram.difficulty),
        durationWeeks: generatedProgram.durationWeeks,
        goals: generatedProgram.goals,
        equipmentNeeded: preferences.equipmentAvailable,
        weeks: generatedProgram.weeks.map((weekDays, wIdx) => ({
          weekNumber: wIdx + 1,
          name: `Week ${wIdx + 1}`,
          isDeload: false,
          workouts: weekDays.map(day => ({
            dayNumber: day.dayNumber,
            name: day.name,
            workoutType: mapWorkoutType(preferences.workoutType),
            estimatedDuration: day.estimatedDuration,
            isRestDay: false,
            exercises: day.exercises.map((item, idx) => ({
              exerciseId: item.exercise.id,
              orderIndex: idx,
              setsConfig: { sets: item.sets, reps: item.reps, rest: item.rest },
              configurations: Array.from({ length: item.sets }, (_, setIdx) => ({
                setNumber: setIdx + 1,
                setType: SetType.WORKING,
                reps: item.reps,
                restSeconds: item.rest,
              })),
            })),
          })),
        })),
      }

      let created: { id: string } | null = null
      let lastError: unknown = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          created = await createProgram(programData)
          break
        } catch (err) {
          lastError = err
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000))
        }
      }

      if (!created) throw lastError ?? new Error('Failed to save after retries')

      setSavedProgramId(created.id)
      setGeneratedProgram(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const toggleGoal = (goal: string) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const toggleEquipment = (eq: string) => {
    setPreferences(prev => {
      if (eq === 'any') return { ...prev, equipmentAvailable: ['any'] }
      const current = prev.equipmentAvailable.includes('any') ? [] : prev.equipmentAvailable
      const updated = current.includes(eq) ? current.filter(e => e !== eq) : [...current, eq]
      return { ...prev, equipmentAvailable: updated.length > 0 ? updated : ['any'] }
    })
  }

  const toggleDayExpanded = (key: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center mb-1">
          <Wand2 className="text-blue-500 mr-2" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">AI Workout Generator</h2>
        </div>
        <p className="text-gray-600">Describe your goals in plain English, tune the settings, and generate a multi-week program.</p>
      </div>

      {/* ── Enhancement 1: Requirements textbox ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Describe Your Workout Goals
          <span className="ml-1 text-xs font-normal text-gray-400">(primary input — be as detailed as you like)</span>
        </label>
        <textarea
          rows={5}
          value={preferences.requirements}
          onChange={e => setPreferences(prev => ({ ...prev, requirements: e.target.value }))}
          placeholder="e.g., Upper body hypertrophy focusing on chest and shoulders, 4 days per week, using dumbbells and cables only, intermediate level, 45 minutes per session, goal is to build visible muscle mass"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">
          Mentioning equipment, body parts, days/week, or goals here will automatically influence exercise selection.
        </p>
      </div>

      {/* ── Enhancement 2: Structured options grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Program Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
          <select
            value={preferences.programType}
            onChange={e => setPreferences(prev => ({ ...prev, programType: e.target.value as ProgramType | '' }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Auto-detect from goals</option>
            {PROGRAM_TYPES.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Focus Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Focus Area</label>
          <select
            value={preferences.focusArea}
            onChange={e => setPreferences(prev => ({ ...prev, focusArea: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {FOCUS_AREA_OPTIONS.map(area => (
              <option key={area} value={area}>{area.charAt(0).toUpperCase() + area.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
          <select
            value={preferences.difficulty}
            onChange={e => setPreferences(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value={DifficultyLevel.BEGINNER}>Beginner</option>
            <option value={DifficultyLevel.INTERMEDIATE}>Intermediate</option>
            <option value={DifficultyLevel.ADVANCED}>Advanced</option>
          </select>
        </div>

        {/* Workout Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout Style</label>
          <select
            value={preferences.workoutType}
            onChange={e => setPreferences(prev => ({ ...prev, workoutType: e.target.value as WorkoutType }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value={WorkoutType.STRENGTH}>Strength (5×3-5, long rest)</option>
            <option value={WorkoutType.MIXED}>Hypertrophy (4×8-12, 90s rest)</option>
            <option value={WorkoutType.CARDIO}>Endurance (3×15-20, short rest)</option>
            <option value={WorkoutType.HIIT}>HIIT</option>
            <option value={WorkoutType.FLEXIBILITY}>Flexibility</option>
            <option value={WorkoutType.RECOVERY}>Recovery</option>
          </select>
        </div>

        {/* Session duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Duration — {preferences.sessionDuration} min
          </label>
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={preferences.sessionDuration}
            onChange={e => setPreferences(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>15 min</span><span>120 min</span>
          </div>
        </div>

        {/* Duration weeks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Program Duration — {preferences.durationWeeks} week{preferences.durationWeeks !== 1 ? 's' : ''}
          </label>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={preferences.durationWeeks}
            onChange={e => setPreferences(prev => ({ ...prev, durationWeeks: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1 wk</span><span>12 wks</span>
          </div>
        </div>

        {/* Days per week */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Days Per Week</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button
                key={d}
                onClick={() => setPreferences(prev => ({ ...prev, daysPerWeek: d }))}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                  preferences.daysPerWeek === d
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment chips */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Dumbbell className="inline h-4 w-4 mr-1" />
            Available Equipment
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(eq => (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  preferences.equipmentAvailable.includes(eq)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Goals chip selector */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="inline h-4 w-4 mr-1" />
            Goals
            <span className="ml-1 text-xs font-normal text-gray-400">(select all that apply)</span>
          </label>

          {/* Selected goals */}
          {preferences.goals.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {preferences.goals.map(goal => (
                <span
                  key={goal}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500 text-white"
                >
                  {goal}
                  <button
                    onClick={() => toggleGoal(goal)}
                    className="ml-1.5 hover:bg-blue-600 rounded-full"
                    aria-label={`Remove ${goal}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {COMMON_GOALS.filter(g => !preferences.goals.includes(g)).map(goal => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Plus size={11} className="inline mr-0.5" />{goal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Generate button ── */}
      <button
        onClick={handleGenerate}
        disabled={generating || exercisesLoading}
        className="w-full bg-blue-500 text-white py-3 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
      >
        {generating || exercisesLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {exercisesLoading ? 'Loading exercise library…' : `Generating ${preferences.durationWeeks}-week program…`}
          </>
        ) : (
          <>
            <Wand2 size={20} />
            Generate AI Program ({preferences.durationWeeks} week{preferences.durationWeeks > 1 ? 's' : ''} × {preferences.daysPerWeek} day{preferences.daysPerWeek > 1 ? 's' : ''})
          </>
        )}
      </button>

      {/* ── Enhancement 3/4: Multi-week results ── */}
      {generatedProgram && (
        <div className="border-t pt-6 space-y-5">
          {/* Program header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{generatedProgram.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {generatedProgram.durationWeeks} weeks · {generatedProgram.daysPerWeek} days/week · {preferences.sessionDuration} min/session · {generatedProgram.difficulty}
              </p>
              {generatedProgram.goals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {generatedProgram.goals.map(g => (
                    <span key={g} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Week tabs */}
          {generatedProgram.durationWeeks > 1 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Week</div>
              <div className="flex flex-wrap gap-2">
                {generatedProgram.weeks.map((_, wIdx) => (
                  <button
                    key={wIdx}
                    onClick={() => { setSelectedWeek(wIdx); setSelectedDay(0) }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedWeek === wIdx
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Week {wIdx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day tabs */}
          {generatedProgram.daysPerWeek > 1 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Day</div>
              <div className="flex flex-wrap gap-2">
                {(generatedProgram.weeks[selectedWeek] ?? []).map((day, dIdx) => (
                  <button
                    key={dIdx}
                    onClick={() => setSelectedDay(dIdx)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedDay === dIdx
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exercise list for selected week/day */}
          {(() => {
            const day = generatedProgram.weeks[selectedWeek]?.[selectedDay]
            if (!day) return null
            return (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  Week {selectedWeek + 1} · {day.name}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {day.exercises.length} exercises · ~{day.estimatedDuration} min
                  </span>
                </h4>
                <div className="space-y-3">
                  {day.exercises.map((item, idx) => (
                    <div
                      key={`${item.exercise.id}-${idx}`}
                      className="bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start flex-1 gap-3">
                        <div className="h-14 w-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                          <img
                            src={item.exercise.gifUrl?.startsWith('/') ? item.exercise.gifUrl : `/exerciseGifs/${item.exercise.gifUrl}`}
                            alt={item.exercise.name}
                            className="h-full w-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{item.exercise.name}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">
                            {item.exercise.targetMuscles?.[0]} · {item.exercise.equipment}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-gray-800">{item.sets} sets</div>
                        <div className="text-xs text-gray-600">{item.reps}</div>
                        <div className="text-xs text-gray-400">{item.rest}s rest</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Progressive overload note */}
          {generatedProgram.durationWeeks > 1 && (
            <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-2.5 text-sm text-blue-700">
              Progressive overload applied: rep targets increase by 1-2 reps every 3 weeks. Sets and rest periods remain consistent within each training block.
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}

          {/* Save / Discard */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-500 text-white py-2.5 rounded-md font-medium hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Saving Program…</>
              ) : (
                <><Check size={18} /> Save to My Programs</>
              )}
            </button>
            <button
              onClick={() => { setGeneratedProgram(null); setSaveError(null) }}
              disabled={saving}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── Success banner ── */}
      {savedProgramId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-green-800">Program saved to My Programs!</p>
            <p className="text-sm text-green-600 mt-0.5">You can assign it to clients or start training.</p>
          </div>
          <button
            onClick={() => router.push('/programs')}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex-shrink-0"
          >
            View Programs <ExternalLink size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
