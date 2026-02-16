'use client'

import { useState, useEffect } from 'react'
import { Wand2, Loader2, Plus, Trash2, Check } from 'lucide-react'
import { Exercise } from '@/types/exercise'

interface WorkoutPreferences {
  focusArea: string // 'upper body', 'lower body', 'full body', 'core', 'cardio'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in minutes
  equipmentAvailable: string[]
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'mixed'
}

interface GeneratedWorkout {
  id: string
  name: string
  exercises: {
    exercise: Exercise
    sets: number
    reps: string
    rest: number // seconds
  }[]
  estimatedDuration: number
  focusArea: string
  difficulty: string
}

export default function AIWorkoutBuilder() {
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    focusArea: 'full body',
    difficulty: 'intermediate',
    duration: 45,
    equipmentAvailable: ['body weight'],
    workoutType: 'strength'
  })

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null)
  const [savedWorkouts, setSavedWorkouts] = useState<GeneratedWorkout[]>([])

  // Load exercises on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
        const params = new URLSearchParams({
          page: '1',
          limit: '100',
          sortBy: 'name',
          sortOrder: 'asc'
        })
        const response = await fetch(`${API_BASE_URL}/exercises?${params.toString()}`)

        if (response.ok) {
          const data = await response.json()
          if (data.exercises) {
            setExercises(data.exercises)
          }
        }
      } catch (error) {
        console.error('Failed to load exercises:', error)
      }
    }

    loadExercises()
  }, [])

  // AI Workout Generation Algorithm
  const generateWorkout = () => {
    setGenerating(true)

    // Simulate AI thinking delay
    setTimeout(() => {
      const workout = aiGenerateWorkout(preferences, exercises)
      setGeneratedWorkout(workout)
      setGenerating(false)
    }, 1500)
  }

  const aiGenerateWorkout = (prefs: WorkoutPreferences, availableExercises: Exercise[]): GeneratedWorkout => {
    // Filter exercises based on preferences
    let filtered = [...availableExercises]

    // Filter by equipment availability
    if (prefs.equipmentAvailable.length > 0 && !prefs.equipmentAvailable.includes('any')) {
      filtered = filtered.filter(ex =>
        prefs.equipmentAvailable.includes(ex.equipment || '')
      )
    }

    // Filter by difficulty - if no matches, relax this filter
    let filteredByDifficulty = filtered.filter(ex => ex.difficulty === prefs.difficulty)
    if (filteredByDifficulty.length === 0) {
      // Relax difficulty filter if no exercises match
      filteredByDifficulty = filtered
    }

    // Filter by focus area
    if (prefs.focusArea === 'upper body') {
      filtered = filteredByDifficulty.filter(ex =>
        ex.bodyParts?.some(bp => ['upper arms', 'shoulders', 'chest', 'back'].includes(bp))
      )
    } else if (prefs.focusArea === 'lower body') {
      filtered = filteredByDifficulty.filter(ex =>
        ex.bodyParts?.some(bp => ['upper legs', 'lower legs', 'waist'].includes(bp))
      )
    } else if (prefs.focusArea === 'core') {
      filtered = filteredByDifficulty.filter(ex =>
        ex.bodyParts?.some(bp => ['waist'].includes(bp)) ||
        ex.targetMuscles?.includes('abs')
      )
    } else if (prefs.focusArea === 'cardio') {
      filtered = filteredByDifficulty.filter(ex => ex.bodyParts?.includes('cardio'))
    } else {
      // Full body - use all difficulty-filtered exercises
      filtered = filteredByDifficulty
    }

    // If still no exercises, use all available exercises
    if (filtered.length === 0) {
      filtered = availableExercises
    }

    // Shuffle exercises for variety
    const shuffled = filtered.sort(() => Math.random() - 0.5)

    // Select exercises based on workout type and duration
    const exerciseCount = Math.max(3, Math.min(10, Math.floor(prefs.duration / 5)))
    const selectedExercises = shuffled.slice(0, Math.min(exerciseCount, filtered.length))

    // Calculate sets, reps, and rest based on goals
    const workoutExercises = selectedExercises.map(exercise => {
      let sets: number
      let reps: string
      let rest: number

      if (prefs.workoutType === 'strength') {
        sets = 3
        reps = prefs.difficulty === 'beginner' ? '8-10' : prefs.difficulty === 'intermediate' ? '10-12' : '12-15'
        rest = 90
      } else if (prefs.workoutType === 'cardio') {
        sets = 3
        reps = '30-60 sec'
        rest = 30
      } else if (prefs.workoutType === 'flexibility') {
        sets = 2
        reps = '30 sec hold'
        rest = 15
      } else {
        // Mixed
        sets = exercise.equipment === 'body weight' ? 3 : 4
        reps = '10-12'
        rest = 60
      }

      return {
        exercise,
        sets,
        reps,
        rest
      }
    })

    const workout: GeneratedWorkout = {
      id: `workout-${Date.now()}`,
      name: `${prefs.focusArea.charAt(0).toUpperCase() + prefs.focusArea.slice(1)} ${prefs.workoutType.charAt(0).toUpperCase() + prefs.workoutType.slice(1)} Workout`,
      exercises: workoutExercises,
      estimatedDuration: prefs.duration,
      focusArea: prefs.focusArea,
      difficulty: prefs.difficulty
    }

    return workout
  }

  const saveWorkout = () => {
    if (generatedWorkout) {
      setSavedWorkouts([...savedWorkouts, generatedWorkout])
      setGeneratedWorkout(null)
    }
  }

  const discardWorkout = () => {
    setGeneratedWorkout(null)
  }

  const equipmentOptions = [
    'body weight',
    'dumbbell',
    'barbell',
    'cable',
    'kettlebell',
    'machine',
    'resistance band',
    'any'
  ]

  const focusAreaOptions = [
    'upper body',
    'lower body',
    'full body',
    'core',
    'cardio'
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Wand2 className="text-blue-500 mr-2" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">AI Workout Generator</h2>
        </div>
        <p className="text-gray-600">Generate personalized workouts based on your goals and available equipment</p>
      </div>

      {/* Preferences Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Focus Area</label>
          <select
            value={preferences.focusArea}
            onChange={(e) => setPreferences({ ...preferences, focusArea: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {focusAreaOptions.map(area => (
              <option key={area} value={area}>{area.charAt(0).toUpperCase() + area.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
          <select
            value={preferences.difficulty}
            onChange={(e) => setPreferences({ ...preferences, difficulty: e.target.value as any })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
          <input
            type="number"
            value={preferences.duration}
            onChange={(e) => setPreferences({ ...preferences, duration: parseInt(e.target.value) || 30 })}
            min={15}
            max={120}
            step={15}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workout Type</label>
          <select
            value={preferences.workoutType}
            onChange={(e) => setPreferences({ ...preferences, workoutType: e.target.value as any })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="flexibility">Flexibility</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Equipment</label>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map(eq => (
              <button
                key={eq}
                onClick={() => {
                  if (eq === 'any') {
                    setPreferences({ ...preferences, equipmentAvailable: ['any'] })
                  } else {
                    const current = preferences.equipmentAvailable.includes('any')
                      ? []
                      : preferences.equipmentAvailable
                    const updated = current.includes(eq)
                      ? current.filter(e => e !== eq)
                      : [...current, eq]
                    setPreferences({ ...preferences, equipmentAvailable: updated.length > 0 ? updated : ['any'] })
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm capitalize ${
                  preferences.equipmentAvailable.includes(eq)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateWorkout}
        disabled={generating || exercises.length === 0}
        className="w-full bg-blue-500 text-white py-3 rounded-md font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {generating ? (
          <>
            <Loader2 size={20} className="animate-spin mr-2" />
            Generating Workout...
          </>
        ) : (
          <>
            <Wand2 size={20} className="mr-2" />
            Generate AI Workout
          </>
        )}
      </button>

      {/* Generated Workout */}
      {generatedWorkout && (
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{generatedWorkout.name}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-4">~{generatedWorkout.estimatedDuration} min</span>
              <span className="capitalize">{generatedWorkout.difficulty}</span>
            </div>
          </div>

          <div className="space-y-4">
            {generatedWorkout.exercises.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="h-16 w-16 rounded-md overflow-hidden mr-4 bg-gray-200">
                    <img
                      src={item.exercise.gifUrl}
                      alt={item.exercise.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.exercise.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {item.exercise.targetMuscles?.[0]} • {item.exercise.equipment}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-800">{item.sets} sets</div>
                  <div className="text-sm text-gray-600">{item.reps}</div>
                  <div className="text-xs text-gray-500">{item.rest}s rest</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveWorkout}
              className="flex-1 bg-green-500 text-white py-2 rounded-md font-medium hover:bg-green-600 flex items-center justify-center"
            >
              <Check size={20} className="mr-2" />
              Save Workout
            </button>
            <button
              onClick={discardWorkout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Saved Workouts */}
      {savedWorkouts.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Saved Workouts ({savedWorkouts.length})</h3>
          <div className="space-y-3">
            {savedWorkouts.map((workout, index) => (
              <div key={workout.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800">{workout.name}</h4>
                    <p className="text-sm text-gray-600">{workout.exercises.length} exercises • ~{workout.estimatedDuration} min</p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = savedWorkouts.filter((_, i) => i !== index)
                      setSavedWorkouts(updated)
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
