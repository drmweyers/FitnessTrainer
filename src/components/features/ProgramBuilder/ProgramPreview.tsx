'use client'

import React, { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  Target, 
  Settings,
  Dumbbell,
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  Eye
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Textarea } from '@/components/shared/Textarea'
import { useProgramBuilder, programBuilderHelpers } from './ProgramBuilderContext'
import { ProgramData, WorkoutType, SetType } from '@/types/program'

interface ProgramPreviewProps {
  onNext: () => void
  onPrev: () => void
  onSave: (programData: ProgramData, saveAsTemplate: boolean) => Promise<void>
}

interface WeekSummaryProps {
  week: any
  weekIndex: number
  isExpanded: boolean
  onToggle: () => void
}

interface WorkoutSummaryProps {
  workout: any
  workoutIndex: number
  isExpanded: boolean
  onToggle: () => void
}

const WORKOUT_TYPE_LABELS = {
  [WorkoutType.STRENGTH]: 'Strength Training',
  [WorkoutType.CARDIO]: 'Cardiovascular',
  [WorkoutType.HIIT]: 'High Intensity Interval Training',
  [WorkoutType.FLEXIBILITY]: 'Flexibility & Mobility',
  [WorkoutType.MIXED]: 'Mixed Training',
  [WorkoutType.RECOVERY]: 'Active Recovery'
}

const SET_TYPE_LABELS = {
  [SetType.WORKING]: 'Working',
  [SetType.WARMUP]: 'Warm-up',
  [SetType.DROP]: 'Drop',
  [SetType.PYRAMID]: 'Pyramid',
  [SetType.AMRAP]: 'AMRAP',
  [SetType.CLUSTER]: 'Cluster',
  [SetType.REST_PAUSE]: 'Rest-Pause'
}

function WorkoutSummary({ workout, workoutIndex, isExpanded, onToggle }: WorkoutSummaryProps) {
  const exercises = workout.exercises || []
  const totalSets = exercises.reduce((sum: number, exercise: any) => {
    return sum + (exercise.configurations?.length || 0)
  }, 0)

  const getDayName = (dayNumber: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[dayNumber - 1] || `Day ${dayNumber}`
  }

  return (
    <div className={`border rounded-lg ${
      workout.isRestDay ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'
    }`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-80"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            workout.isRestDay 
              ? 'bg-gray-200 text-gray-600' 
              : 'bg-blue-200 text-blue-800'
          }`}>
            {workout.dayNumber}
          </div>
          
          <div>
            <h4 className={`font-medium ${
              workout.isRestDay ? 'text-gray-700' : 'text-blue-900'
            }`}>
              {workout.name}
            </h4>
            <div className={`flex items-center space-x-2 text-sm ${
              workout.isRestDay ? 'text-gray-600' : 'text-blue-700'
            }`}>
              <span>{getDayName(workout.dayNumber)}</span>
              {!workout.isRestDay && workout.workoutType && (
                <>
                  <span>•</span>
                  <span>{WORKOUT_TYPE_LABELS[workout.workoutType] || workout.workoutType}</span>
                </>
              )}
              {workout.estimatedDuration && !workout.isRestDay && (
                <>
                  <span>•</span>
                  <span>{workout.estimatedDuration}min</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!workout.isRestDay && (
            <div className={`text-sm ${
              workout.isRestDay ? 'text-gray-600' : 'text-blue-700'
            }`}>
              <span>{exercises.length} exercises • {totalSets} sets</span>
            </div>
          )}
          
          <div className={workout.isRestDay ? 'text-gray-400' : 'text-blue-400'}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 bg-white">
          {workout.description && (
            <p className="text-gray-700 mb-4">{workout.description}</p>
          )}

          {workout.isRestDay ? (
            <div className="text-center py-6 text-gray-500">
              <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Complete rest day</p>
              <p className="text-sm">No exercises scheduled</p>
            </div>
          ) : exercises.length > 0 ? (
            <div className="space-y-4">
              {exercises.map((exercise: any, exerciseIndex: number) => (
                <div key={exerciseIndex} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium flex items-center justify-center">
                      {exercise.orderIndex + 1}
                    </span>
                    <h5 className="font-medium text-gray-900">
                      Exercise {exercise.orderIndex + 1}
                    </h5>
                  </div>

                  {exercise.notes && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-900">
                      {exercise.notes}
                    </div>
                  )}

                  {exercise.configurations && exercise.configurations.length > 0 ? (
                    <div className="space-y-2">
                      <h6 className="text-sm font-medium text-gray-700">Set Configuration:</h6>
                      {exercise.configurations.map((config: any, setIndex: number) => (
                        <div key={setIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">Set {config.setNumber}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {SET_TYPE_LABELS[config.setType] || config.setType}
                            </span>
                            <span>{config.reps} reps</span>
                            {config.weightGuidance && <span>{config.weightGuidance}</span>}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            {config.restSeconds && <span>{config.restSeconds}s rest</span>}
                            {config.rpe && <span>RPE {config.rpe}</span>}
                            {config.rir && <span>RIR {config.rir}</span>}
                            {config.tempo && <span>Tempo: {config.tempo}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500 text-sm">
                      No set configuration defined
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Dumbbell size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No exercises added</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WeekSummary({ week, weekIndex, isExpanded, onToggle }: WeekSummaryProps) {
  const workouts = week.workouts || []
  const trainingDays = workouts.filter((w: any) => !w.isRestDay).length
  const restDays = workouts.filter((w: any) => w.isRestDay).length
  const totalExercises = workouts.reduce((sum: number, workout: any) => {
    return sum + (workout.exercises?.length || 0)
  }, 0)

  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<number>>(new Set())

  const toggleWorkout = (workoutIndex: number) => {
    const newExpanded = new Set(expandedWorkouts)
    if (newExpanded.has(workoutIndex)) {
      newExpanded.delete(workoutIndex)
    } else {
      newExpanded.add(workoutIndex)
    }
    setExpandedWorkouts(newExpanded)
  }

  return (
    <div className={`border rounded-lg shadow-sm ${
      week.isDeload ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
    }`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
            week.isDeload 
              ? 'bg-yellow-200 text-yellow-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {week.isDeload ? 'D' : week.weekNumber}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">
              {week.name}
              {week.isDeload && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Deload
                </span>
              )}
            </h3>
            {week.description && (
              <p className="text-sm text-gray-600">{week.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{trainingDays} training</span>
            </div>
            <div className="flex items-center space-x-1">
              <Dumbbell size={14} />
              <span>{totalExercises} exercises</span>
            </div>
            {restDays > 0 && <span>{restDays} rest</span>}
          </div>
          
          <div className="text-gray-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="space-y-3">
            {workouts.length > 0 ? (
              workouts.map((workout: any, workoutIndex: number) => (
                <WorkoutSummary
                  key={workoutIndex}
                  workout={workout}
                  workoutIndex={workoutIndex}
                  isExpanded={expandedWorkouts.has(workoutIndex)}
                  onToggle={() => toggleWorkout(workoutIndex)}
                />
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No workouts in this week</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProgramPreview({ onNext, onPrev, onSave }: ProgramPreviewProps) {
  const { state } = useProgramBuilder()
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]))
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate program statistics
  const totalWeeks = state.weeks.length
  const totalWorkouts = state.weeks.reduce((sum, week) => sum + (week.workouts?.length || 0), 0)
  const totalExercises = state.weeks.reduce((sum, week) => {
    return sum + (week.workouts?.reduce((workoutSum, workout) => {
      return workoutSum + (workout.exercises?.length || 0)
    }, 0) || 0)
  }, 0)
  const totalTrainingDays = state.weeks.reduce((sum, week) => {
    return sum + (week.workouts?.filter(workout => !workout.isRestDay).length || 0)
  }, 0)
  const deloadWeeks = state.weeks.filter(week => week.isDeload).length

  const toggleWeek = (weekIndex: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekIndex)) {
      newExpanded.delete(weekIndex)
    } else {
      newExpanded.add(weekIndex)
    }
    setExpandedWeeks(newExpanded)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const programData = programBuilderHelpers.toApiFormat(state)
      await onSave(programData, saveAsTemplate)
    } catch (error) {
      console.error('Failed to save program:', error)
      alert('Failed to save program. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Validation checks
  const hasValidName = Boolean(state.name.trim())
  const hasWeeks = state.weeks.length > 0
  const hasWorkouts = totalWorkouts > 0
  const hasExercises = totalExercises > 0
  const hasValidType = Boolean(state.programType)
  const hasValidDifficulty = Boolean(state.difficultyLevel)

  const validationIssues = [
    !hasValidName && 'Program name is required',
    !hasValidType && 'Program type must be selected',
    !hasValidDifficulty && 'Difficulty level must be selected',
    !hasWeeks && 'At least one week is required',
    !hasWorkouts && 'At least one workout is required',
    !hasExercises && 'At least one exercise is required'
  ].filter(Boolean)

  const isReadyToSave = validationIssues.length === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Program Preview</h2>
        <p className="text-gray-600 mt-2">
          Review your complete program before saving
        </p>
      </div>

      {/* Program Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{state.name}</h1>
            {state.description && (
              <p className="text-gray-700 mt-1">{state.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                {state.programType}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">
                {state.difficultyLevel}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {totalWeeks} weeks
              </span>
              {deloadWeeks > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {deloadWeeks} deload weeks
                </span>
              )}
            </div>
          </div>

          <div className={`p-3 rounded-full ${
            isReadyToSave 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {isReadyToSave ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
        </div>

        {/* Goals and Equipment */}
        {(state.goals.length > 0 || state.equipmentNeeded.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {state.goals.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Goals</h4>
                <div className="flex flex-wrap gap-1">
                  {state.goals.map((goal, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {state.equipmentNeeded.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Equipment Needed</h4>
                <div className="flex flex-wrap gap-1">
                  {state.equipmentNeeded.map((equipment, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {equipment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Program Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalWeeks}</div>
            <div className="text-sm text-gray-600">Total Weeks</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="text-green-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalWorkouts}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Dumbbell className="text-purple-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalExercises}</div>
            <div className="text-sm text-gray-600">Total Exercises</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalTrainingDays}</div>
            <div className="text-sm text-gray-600">Training Days</div>
          </div>
        </div>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">Issues to Fix</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {validationIssues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Week Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Week Breakdown</h3>
        
        {state.weeks.length > 0 ? (
          state.weeks.map((week, index) => (
            <WeekSummary
              key={`week-${week.weekNumber}-${index}`}
              week={week}
              weekIndex={index}
              isExpanded={expandedWeeks.has(index)}
              onToggle={() => toggleWeek(index)}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No weeks configured</h3>
            <p className="text-gray-600">Go back to add weeks to your program</p>
          </div>
        )}
      </div>

      {/* Save Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Save Options</h3>
        
        <div className="flex items-start space-x-3 mb-4">
          <input
            type="checkbox"
            id="saveAsTemplate"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <label htmlFor="saveAsTemplate" className="font-medium text-gray-900 cursor-pointer">
              Save as Template
            </label>
            <p className="text-sm text-gray-600 mt-1">
              Make this program available for reuse with future clients. Templates can be customized before assigning.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrev}>
          Back to Exercises
        </Button>
        
        <div className="space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              // Expand all weeks for better preview
              setExpandedWeeks(new Set(state.weeks.map((_, index) => index)))
            }}
            leftIcon={<Eye size={16} />}
          >
            Expand All
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!isReadyToSave || isSaving}
            leftIcon={isSaving ? undefined : <Save size={16} />}
            size="lg"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Saving...</span>
              </div>
            ) : (
              'Save Program'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}