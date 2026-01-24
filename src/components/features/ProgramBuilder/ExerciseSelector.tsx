'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Trash2,
  GripVertical,
  Target,
  Settings,
  Save,
  X,
  Dumbbell,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Link
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Textarea } from '@/components/shared/Textarea'
import { useProgramBuilder } from './ProgramBuilderContext'
import SupersetBuilder from './SupersetBuilder'
import RPEIntegration from './RPEIntegration'
import { WorkoutExerciseData, ExerciseConfigurationData, SetType } from '@/types/program'
import { ExerciseWithUserData, ExerciseFilters, FilterOptions } from '@/types/exercise'
import { searchExercises, getFilterOptions } from '@/services/exerciseService'

interface ExerciseSelectorProps {
  onNext: () => void
  onPrev: () => void
}

interface ExerciseCardProps {
  exercise: ExerciseWithUserData
  onAdd: (exercise: ExerciseWithUserData) => void
  isAdded: boolean
}

interface SelectedExerciseProps {
  exercise: WorkoutExerciseData
  exerciseData?: ExerciseWithUserData
  index: number
  onUpdate: (exercise: WorkoutExerciseData) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

const SET_TYPES = [
  { value: SetType.WORKING, label: 'Working Set', description: 'Main training sets' },
  { value: SetType.WARMUP, label: 'Warm-up Set', description: 'Lighter preparation sets' },
  { value: SetType.DROP, label: 'Drop Set', description: 'Reduce weight after failure' },
  { value: SetType.PYRAMID, label: 'Pyramid Set', description: 'Increase/decrease weight' },
  { value: SetType.AMRAP, label: 'AMRAP', description: 'As many reps as possible' },
  { value: SetType.CLUSTER, label: 'Cluster Set', description: 'Rest within the set' },
  { value: SetType.REST_PAUSE, label: 'Rest-Pause', description: 'Brief rest then continue' }
]

function ExerciseCard({ exercise, onAdd, isAdded }: ExerciseCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start space-x-3">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
          {exercise.gifUrl && (
            <img
              src={exercise.gifUrl.startsWith('http') ? exercise.gifUrl : `/exerciseDB/gifs/${exercise.gifUrl}`}
              alt={exercise.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          )}
          {!exercise.gifUrl && (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell size={24} className="text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{exercise.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {exercise.bodyParts.map(part => (
              <span
                key={part}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {part}
              </span>
            ))}
            {exercise.equipments.filter(eq => eq !== 'body weight').map(equipment => (
              <span
                key={equipment}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                {equipment}
              </span>
            ))}
          </div>
          {exercise.targetMuscles.length > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              Target: {exercise.targetMuscles.join(', ')}
            </div>
          )}
        </div>
        
        <Button
          size="sm"
          variant={isAdded ? "outline" : "default"}
          onClick={() => onAdd(exercise)}
          disabled={isAdded}
          leftIcon={isAdded ? <Star size={14} /> : <Plus size={14} />}
        >
          {isAdded ? 'Added' : 'Add'}
        </Button>
      </div>
    </div>
  )
}

function SelectedExercise({ 
  exercise, 
  exerciseData,
  index, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown, 
  canMoveUp, 
  canMoveDown 
}: SelectedExerciseProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingExercise, setEditingExercise] = useState<WorkoutExerciseData>(exercise)

  const handleSave = () => {
    onUpdate(editingExercise)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditingExercise(exercise)
    setIsEditing(false)
  }

  const addConfiguration = () => {
    const newConfig: ExerciseConfigurationData = {
      setNumber: (editingExercise.configurations?.length || 0) + 1,
      setType: SetType.WORKING,
      reps: '8-12',
      weightGuidance: '',
      restSeconds: 60,
      tempo: '',
      rpe: undefined,
      rir: undefined,
      notes: ''
    }
    
    setEditingExercise({
      ...editingExercise,
      configurations: [...(editingExercise.configurations || []), newConfig]
    })
  }

  const removeConfiguration = (configIndex: number) => {
    const configs = editingExercise.configurations || []
    setEditingExercise({
      ...editingExercise,
      configurations: configs.filter((_, i) => i !== configIndex)
    })
  }

  const updateConfiguration = (configIndex: number, config: ExerciseConfigurationData) => {
    const configs = [...(editingExercise.configurations || [])]
    configs[configIndex] = config
    setEditingExercise({
      ...editingExercise,
      configurations: configs
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Exercise Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col space-y-1">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <ChevronUp size={14} />
            </button>
            <GripVertical size={16} className="text-gray-400" />
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {exerciseData?.gifUrl && (
              <img
                src={exerciseData.gifUrl.startsWith('http') ? exerciseData.gifUrl : `/exerciseDB/gifs/${exerciseData.gifUrl}`}
                alt={exerciseData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <h3 className="font-medium text-gray-900">
                {exerciseData?.name || `Exercise ${index + 1}`}
              </h3>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {exercise.configurations?.length || 0} sets configured
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            leftIcon={<Settings size={14} />}
          >
            Configure
          </Button>
          
          <button
            onClick={onRemove}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Remove exercise"
          >
            <Trash2 size={16} />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Configuration */}
      {(isExpanded || isEditing) && (
        <div className="border-t border-gray-200 p-4">
          {isEditing ? (
            <div className="space-y-6">
              {/* Exercise Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Notes (Optional)
                </label>
                <Textarea
                  value={editingExercise.notes || ''}
                  onChange={(e) => setEditingExercise({
                    ...editingExercise,
                    notes: e.target.value
                  })}
                  placeholder="Special instructions or modifications for this exercise"
                  rows={2}
                />
              </div>

              {/* Set Configurations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Set Configuration</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addConfiguration}
                    leftIcon={<Plus size={14} />}
                  >
                    Add Set
                  </Button>
                </div>

                {editingExercise.configurations?.map((config, configIndex) => (
                  <div key={configIndex} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-700">Set {configIndex + 1}</h5>
                      <button
                        onClick={() => removeConfiguration(configIndex)}
                        className="text-red-400 hover:text-red-600"
                        disabled={editingExercise.configurations?.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Set Type
                        </label>
                        <select
                          value={config.setType}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            setType: e.target.value as SetType
                          })}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          {SET_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Reps
                        </label>
                        <Input
                          value={config.reps}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            reps: e.target.value
                          })}
                          placeholder="8-12"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Rest (sec)
                        </label>
                        <Input
                          type="number"
                          value={config.restSeconds?.toString() || ''}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            restSeconds: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                          placeholder="60"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Weight
                        </label>
                        <Input
                          value={config.weightGuidance || ''}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            weightGuidance: e.target.value
                          })}
                          placeholder="70% 1RM"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          RPE (1-10)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={config.rpe?.toString() || ''}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            rpe: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                          placeholder="7"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          RIR
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={config.rir?.toString() || ''}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            rir: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                          placeholder="2"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Tempo
                        </label>
                        <Input
                          value={config.tempo || ''}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            tempo: e.target.value
                          })}
                          placeholder="3-1-2-0"
                        />
                      </div>
                    </div>

                    {config.notes && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Set Notes
                        </label>
                        <Textarea
                          value={config.notes}
                          onChange={(e) => updateConfiguration(configIndex, {
                            ...config,
                            notes: e.target.value
                          })}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel} leftIcon={<X size={16} />}>
                  Cancel
                </Button>
                <Button onClick={handleSave} leftIcon={<Save size={16} />}>
                  Save Configuration
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Exercise Notes */}
              {exercise.notes && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-900">{exercise.notes}</p>
                </div>
              )}

              {/* Set Summary */}
              {exercise.configurations && exercise.configurations.length > 0 ? (
                <div className="space-y-2">
                  {exercise.configurations.map((config, configIndex) => (
                    <div key={configIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium">Set {configIndex + 1}</span>
                        <span className="text-blue-600">{config.setType}</span>
                        <span>{config.reps} reps</span>
                        {config.weightGuidance && <span>{config.weightGuidance}</span>}
                        {config.restSeconds && <span>{config.restSeconds}s rest</span>}
                      </div>
                      {(config.rpe || config.rir) && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          {config.rpe && <span>RPE {config.rpe}</span>}
                          {config.rir && <span>RIR {config.rir}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Settings size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>No sets configured yet</p>
                  <p className="text-sm">Click Configure to add sets</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExerciseSelector({ onNext, onPrev }: ExerciseSelectorProps) {
  const { state, dispatch } = useProgramBuilder()
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ExerciseFilters>({
    search: '',
    bodyParts: [],
    equipments: [],
    targetMuscles: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showSupersetBuilder, setShowSupersetBuilder] = useState(false)
  const [showRPEIntegration, setShowRPEIntegration] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    bodyParts: [],
    equipments: [],
    targetMuscles: [],
    secondaryMuscles: []
  })
  
  // Exercise Data
  const [exercises, setExercises] = useState<ExerciseWithUserData[]>([])
  const [exerciseData, setExerciseData] = useState<Record<string, ExerciseWithUserData>>({})
  
  // Current workout context
  const currentWeek = state.weeks[state.currentWeekIndex]
  const currentWorkout = currentWeek?.workouts?.[state.currentWorkoutIndex]
  const selectedExercises = currentWorkout?.exercises || []

  // Load filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      const options = await getFilterOptions()
      setFilterOptions(options)
    }
    loadFilters()
  }, [])

  // Search exercises
  const performSearch = async () => {
    setIsLoading(true)
    try {
      const searchFilters = {
        ...filters,
        search: searchTerm
      }
      const result = await searchExercises(searchFilters, 1, 20)
      setExercises(result.exercises)
      
      // Store exercise data for quick lookup
      const newExerciseData = { ...exerciseData }
      result.exercises.forEach(exercise => {
        newExerciseData[exercise.id] = exercise
      })
      setExerciseData(newExerciseData)
    } catch (error) {
      console.error('Search failed:', error)
      setExercises([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-search on term or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, filters])

  const handleAddExercise = (exercise: ExerciseWithUserData) => {
    // Check if already added
    const isAlreadyAdded = selectedExercises.some(selected => selected.exerciseId === exercise.id)
    if (isAlreadyAdded) return

    const newExercise: WorkoutExerciseData = {
      exerciseId: exercise.id,
      orderIndex: selectedExercises.length,
      supersetGroup: undefined,
      setsConfig: {},
      notes: '',
      configurations: [{
        setNumber: 1,
        setType: SetType.WORKING,
        reps: '8-12',
        weightGuidance: '',
        restSeconds: 60,
        tempo: '',
        rpe: undefined,
        rir: undefined,
        notes: ''
      }]
    }

    // Update the current workout with the new exercise
    if (currentWorkout) {
      const updatedWorkout = {
        ...currentWorkout,
        exercises: [...selectedExercises, newExercise]
      }
      
      dispatch({
        type: 'UPDATE_WORKOUT',
        payload: {
          weekIndex: state.currentWeekIndex,
          workoutIndex: state.currentWorkoutIndex,
          workout: updatedWorkout
        }
      })
    }

    // Store exercise data for later use
    setExerciseData(prev => ({ ...prev, [exercise.id]: exercise }))
  }

  const handleUpdateExercise = (index: number, updatedExercise: WorkoutExerciseData) => {
    if (!currentWorkout) return

    const updatedExercises = [...selectedExercises]
    updatedExercises[index] = updatedExercise
    
    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises
    }
    
    dispatch({
      type: 'UPDATE_WORKOUT',
      payload: {
        weekIndex: state.currentWeekIndex,
        workoutIndex: state.currentWorkoutIndex,
        workout: updatedWorkout
      }
    })
  }

  const handleRemoveExercise = (index: number) => {
    if (!currentWorkout) return

    const updatedExercises = selectedExercises
      .filter((_, i) => i !== index)
      .map((exercise, newIndex) => ({
        ...exercise,
        orderIndex: newIndex
      }))
    
    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises
    }
    
    dispatch({
      type: 'UPDATE_WORKOUT',
      payload: {
        weekIndex: state.currentWeekIndex,
        workoutIndex: state.currentWorkoutIndex,
        workout: updatedWorkout
      }
    })
  }

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (!currentWorkout) return

    const updatedExercises = [...selectedExercises]
    const [movedExercise] = updatedExercises.splice(fromIndex, 1)
    updatedExercises.splice(toIndex, 0, movedExercise)
    
    // Update order indices
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      orderIndex: index
    }))
    
    const updatedWorkout = {
      ...currentWorkout,
      exercises: reorderedExercises
    }
    
    dispatch({
      type: 'UPDATE_WORKOUT',
      payload: {
        weekIndex: state.currentWeekIndex,
        workoutIndex: state.currentWorkoutIndex,
        workout: updatedWorkout
      }
    })
  }

  const handleUpdateExercisesFromSuperset = (updatedExercises: WorkoutExerciseData[]) => {
    if (!currentWorkout) return

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises.map((exercise, index) => ({
        ...exercise,
        orderIndex: index
      }))
    }
    
    dispatch({
      type: 'UPDATE_WORKOUT',
      payload: {
        weekIndex: state.currentWeekIndex,
        workoutIndex: state.currentWorkoutIndex,
        workout: updatedWorkout
      }
    })
  }

  const validateAndNext = () => {
    const hasExercises = state.weeks.some(week => 
      week.workouts?.some(workout => 
        workout.exercises && workout.exercises.length > 0
      )
    )
    
    if (!hasExercises) {
      alert('Please add at least one exercise to your program')
      return
    }
    
    onNext()
  }

  if (!currentWorkout) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Workout Selected</h2>
        <p className="text-gray-600 mb-6">You need to select a workout to add exercises.</p>
        <Button onClick={onPrev}>Go Back to Workouts</Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Exercise Selection</h2>
        <p className="text-gray-600 mt-2">
          Search and configure exercises for your workouts
        </p>
      </div>

      {/* Current Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">
              {currentWeek.name} → {currentWorkout.name}
            </h3>
            <p className="text-sm text-blue-700">
              Day {currentWorkout.dayNumber} • {currentWorkout.workoutType || 'No type set'}
            </p>
          </div>
          <div className="text-sm text-blue-700">
            {selectedExercises.length} exercises selected
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Library */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Exercise Library</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter size={16} />}
            >
              Filters
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Part
                </label>
                <select
                  value={filters.bodyParts[0] || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    bodyParts: e.target.value ? [e.target.value] : []
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All body parts</option>
                  {filterOptions.bodyParts.map(part => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment
                </label>
                <select
                  value={filters.equipments[0] || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    equipments: e.target.value ? [e.target.value] : []
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All equipment</option>
                  {filterOptions.equipments.map(equipment => (
                    <option key={equipment} value={equipment}>{equipment}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Exercise List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Searching exercises...</p>
              </div>
            ) : exercises.length > 0 ? (
              exercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onAdd={handleAddExercise}
                  isAdded={selectedExercises.some(selected => selected.exerciseId === exercise.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Dumbbell size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No exercises found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Exercises */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Exercises ({selectedExercises.length})
            </h3>
            <div className="flex space-x-2">
              {selectedExercises.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSupersetBuilder(true)}
                  leftIcon={<Link size={16} />}
                  className="text-sm"
                >
                  Create Supersets
                </Button>
              )}
              {selectedExercises.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRPEIntegration(true)}
                  leftIcon={<Target size={16} />}
                  className="text-sm"
                >
                  Set RPE/RIR
                </Button>
              )}
            </div>
          </div>

          {selectedExercises.length > 0 ? (
            <div className="space-y-3">
              {selectedExercises.map((exercise, index) => (
                <SelectedExercise
                  key={`${exercise.exerciseId}-${index}`}
                  exercise={exercise}
                  exerciseData={exerciseData[exercise.exerciseId]}
                  index={index}
                  onUpdate={(updated) => handleUpdateExercise(index, updated)}
                  onRemove={() => handleRemoveExercise(index)}
                  onMoveUp={() => handleMoveExercise(index, index - 1)}
                  onMoveDown={() => handleMoveExercise(index, index + 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < selectedExercises.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Target size={48} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises selected</h3>
              <p className="text-gray-600">Search for exercises and click "Add" to build your workout</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrev}>
          Back to Workouts
        </Button>
        
        <Button 
          onClick={validateAndNext}
          disabled={!state.weeks.some(week => 
            week.workouts?.some(workout => 
              workout.exercises && workout.exercises.length > 0
            )
          )}
        >
          Continue to Preview
        </Button>
      </div>

      {/* Superset Builder Modal */}
      {showSupersetBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SupersetBuilder
                exercises={selectedExercises}
                onUpdateExercises={handleUpdateExercisesFromSuperset}
                onClose={() => setShowSupersetBuilder(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* RPE Integration Modal */}
      {showRPEIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <RPEIntegration
                exercises={selectedExercises}
                onUpdateExercises={handleUpdateExercisesFromSuperset}
                onClose={() => setShowRPEIntegration(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}