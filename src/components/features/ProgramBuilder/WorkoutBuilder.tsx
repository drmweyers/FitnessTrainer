'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Coffee,
  Activity
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Textarea } from '@/components/shared/Textarea'
import { useProgramBuilder } from './ProgramBuilderContext'
import { ProgramWorkoutData, WorkoutType } from '@/types/program'

interface WorkoutBuilderProps {
  onNext: () => void
  onPrev: () => void
}

interface WorkoutCardProps {
  workout: ProgramWorkoutData
  workoutIndex: number
  weekIndex: number
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (workout: ProgramWorkoutData) => void
  onDelete: () => void
  canDelete: boolean
}

const WORKOUT_TYPES = [
  { value: WorkoutType.STRENGTH, label: 'Strength Training', icon: <Dumbbell size={16} /> },
  { value: WorkoutType.CARDIO, label: 'Cardiovascular', icon: <Activity size={16} /> },
  { value: WorkoutType.HIIT, label: 'High Intensity Interval Training', icon: <Activity size={16} /> },
  { value: WorkoutType.FLEXIBILITY, label: 'Flexibility & Mobility', icon: <Activity size={16} /> },
  { value: WorkoutType.MIXED, label: 'Mixed Training', icon: <Activity size={16} /> },
  { value: WorkoutType.RECOVERY, label: 'Active Recovery', icon: <Coffee size={16} /> }
]

const DAY_OPTIONS = [
  { value: 1, label: 'Monday (Day 1)' },
  { value: 2, label: 'Tuesday (Day 2)' },
  { value: 3, label: 'Wednesday (Day 3)' },
  { value: 4, label: 'Thursday (Day 4)' },
  { value: 5, label: 'Friday (Day 5)' },
  { value: 6, label: 'Saturday (Day 6)' },
  { value: 7, label: 'Sunday (Day 7)' }
]

function WorkoutCard({
  workout,
  workoutIndex,
  weekIndex,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  canDelete
}: WorkoutCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<ProgramWorkoutData>(workout)

  const handleSave = () => {
    if (!editingWorkout.name.trim()) {
      return
    }
    onUpdate(editingWorkout)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditingWorkout(workout)
    setIsEditing(false)
  }

  const selectedWorkoutType = WORKOUT_TYPES.find(type => type.value === workout.workoutType)
  const selectedDay = DAY_OPTIONS.find(day => day.value === workout.dayNumber)
  const exerciseCount = workout.exercises?.length || 0

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${
      workout.isRestDay ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
    }`}>
      {/* Workout Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={!isEditing ? onToggle : undefined}
      >
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            workout.isRestDay 
              ? 'bg-gray-200 text-gray-600' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {workout.dayNumber}
          </div>
          
          <div>
            <h3 className={`font-medium ${
              workout.isRestDay ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {workout.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{selectedDay?.label.split(' ')[0]}</span>
              {!workout.isRestDay && selectedWorkoutType && (
                <>
                  <span>•</span>
                  <span>{selectedWorkoutType.label}</span>
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
          
          {workout.isRestDay && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Rest Day
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Exercise Count */}
          {!workout.isRestDay && (
            <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
              <Dumbbell size={14} />
              <span>{exerciseCount} exercises</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit workout"
            >
              <Edit2 size={16} />
            </button>
            
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete workout"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          {!isEditing && (
            <div className="text-gray-400">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content or Edit Form */}
      {(isExpanded || isEditing) && (
        <div className="border-t border-gray-200 p-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Workout Name"
                  value={editingWorkout.name}
                  onChange={(e) => setEditingWorkout({ ...editingWorkout, name: e.target.value })}
                  placeholder="e.g., Push Day, Cardio Session"
                />
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Day of Week
                  </label>
                  <select
                    value={editingWorkout.dayNumber}
                    onChange={(e) => setEditingWorkout({ 
                      ...editingWorkout, 
                      dayNumber: parseInt(e.target.value) 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DAY_OPTIONS.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Workout Type
                  </label>
                  <select
                    value={editingWorkout.workoutType || ''}
                    onChange={(e) => setEditingWorkout({ 
                      ...editingWorkout, 
                      workoutType: e.target.value as WorkoutType 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={editingWorkout.isRestDay}
                  >
                    <option value="">Select type...</option>
                    {WORKOUT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={editingWorkout.estimatedDuration || ''}
                    onChange={(e) => setEditingWorkout({ 
                      ...editingWorkout, 
                      estimatedDuration: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="60"
                    disabled={editingWorkout.isRestDay}
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                  Workout Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!editingWorkout.isRestDay}
                      onChange={() => setEditingWorkout({ 
                        ...editingWorkout, 
                        isRestDay: false 
                      })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Training Day</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={editingWorkout.isRestDay}
                      onChange={() => setEditingWorkout({ 
                        ...editingWorkout, 
                        isRestDay: true,
                        workoutType: undefined,
                        estimatedDuration: undefined
                      })}
                      className="text-gray-600 focus:ring-gray-500"
                    />
                    <span className="text-sm">Rest Day</span>
                  </label>
                </div>
              </div>

              <Textarea
                label="Description (Optional)"
                value={editingWorkout.description || ''}
                onChange={(e) => setEditingWorkout({ 
                  ...editingWorkout, 
                  description: e.target.value 
                })}
                placeholder="Additional notes about this workout"
                rows={3}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel} leftIcon={<X size={16} />}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!editingWorkout.name.trim()} leftIcon={<Save size={16} />}>
                  Save Workout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Workout Description */}
              {workout.description && (
                <p className="text-gray-700">{workout.description}</p>
              )}

              {/* Workout Details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Workout Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{selectedDay?.label.split(' ')[0]}</div>
                    <div className="text-gray-600">Day</div>
                  </div>
                  {!workout.isRestDay && (
                    <>
                      <div>
                        <div className="font-medium text-blue-600">
                          {selectedWorkoutType?.label || 'Not set'}
                        </div>
                        <div className="text-gray-600">Type</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">
                          {workout.estimatedDuration || 'Not set'}
                          {workout.estimatedDuration && 'min'}
                        </div>
                        <div className="text-gray-600">Duration</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-600">{exerciseCount}</div>
                        <div className="text-gray-600">Exercises</div>
                      </div>
                    </>
                  )}
                  {workout.isRestDay && (
                    <div>
                      <div className="font-medium text-gray-600">Complete Rest</div>
                      <div className="text-gray-600">Activity</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exercise List Preview */}
              {!workout.isRestDay && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Exercises</h4>
                  {exerciseCount > 0 ? (
                    <div className="space-y-2">
                      {workout.exercises?.slice(0, 3).map((exercise, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-medium">
                              {exercise.orderIndex + 1}
                            </div>
                            <div className="font-medium text-gray-900">Exercise #{exercise.orderIndex + 1}</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {exercise.configurations?.length || 0} sets
                          </div>
                        </div>
                      ))}
                      {exerciseCount > 3 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          ... and {exerciseCount - 3} more exercises
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Dumbbell size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No exercises added yet</p>
                      <p className="text-sm">You'll add exercises in the next step</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkoutBuilder({ onNext, onPrev }: WorkoutBuilderProps) {
  const { state, dispatch } = useProgramBuilder()
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())
  const [showConfirmDelete, setShowConfirmDelete] = useState<{weekIndex: number, workoutIndex: number} | null>(null)

  const currentWeek = state.weeks[state.currentWeekIndex]
  const workouts = currentWeek?.workouts || []

  const handleToggleExpand = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts)
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId)
    } else {
      newExpanded.add(workoutId)
    }
    setExpandedWorkouts(newExpanded)
  }

  const handleUpdateWorkout = (workoutIndex: number, updatedWorkout: ProgramWorkoutData) => {
    dispatch({
      type: 'UPDATE_WORKOUT',
      payload: { 
        weekIndex: state.currentWeekIndex, 
        workoutIndex, 
        workout: updatedWorkout 
      }
    })
  }

  const handleDeleteWorkout = (workoutIndex: number) => {
    dispatch({
      type: 'REMOVE_WORKOUT',
      payload: { 
        weekIndex: state.currentWeekIndex, 
        workoutIndex 
      }
    })
    setShowConfirmDelete(null)
  }

  const handleAddWorkout = () => {
    // Find next available day
    const usedDays = workouts.map(w => w.dayNumber)
    const nextDay = DAY_OPTIONS.find(day => !usedDays.includes(day.value))?.value || 1
    
    dispatch({
      type: 'ADD_WORKOUT',
      payload: { 
        weekIndex: state.currentWeekIndex,
        workout: {
          dayNumber: nextDay,
          name: 'New Workout',
          description: '',
          workoutType: WorkoutType.STRENGTH,
          estimatedDuration: 60,
          isRestDay: false,
          exercises: []
        }
      }
    })
  }

  const handleWeekChange = (weekIndex: number) => {
    dispatch({ type: 'SET_CURRENT_WEEK', payload: weekIndex })
    setExpandedWorkouts(new Set()) // Collapse all when switching weeks
  }

  const validateAndNext = () => {
    const hasWorkouts = state.weeks.some(week => week.workouts && week.workouts.length > 0)
    if (!hasWorkouts) {
      alert('Please add at least one workout to your program')
      return
    }
    onNext()
  }

  if (!currentWeek) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Weeks Available</h2>
        <p className="text-gray-600 mb-6">You need to create weeks before adding workouts.</p>
        <Button onClick={onPrev}>Go Back to Week Structure</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Workout Planning</h2>
        <p className="text-gray-600 mt-2">
          Add and configure workouts for each week of your program
        </p>
      </div>

      {/* Week Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Select Week to Edit</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Week {currentWeek.weekNumber} of {state.weeks.length}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {state.weeks.map((week, index) => (
            <button
              key={index}
              onClick={() => handleWeekChange(index)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                index === state.currentWeekIndex
                  ? week.isDeload 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {week.name}
              {week.workouts && week.workouts.length > 0 && (
                <span className="ml-1 text-xs opacity-75">
                  ({week.workouts.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Week Info */}
      <div className={`rounded-lg p-4 border ${
        currentWeek.isDeload 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-medium ${
              currentWeek.isDeload ? 'text-yellow-900' : 'text-blue-900'
            }`}>
              {currentWeek.name}
              {currentWeek.isDeload && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Deload Week
                </span>
              )}
            </h3>
            {currentWeek.description && (
              <p className={`text-sm mt-1 ${
                currentWeek.isDeload ? 'text-yellow-700' : 'text-blue-700'
              }`}>
                {currentWeek.description}
              </p>
            )}
          </div>
          <div className={`flex items-center space-x-4 text-sm ${
            currentWeek.isDeload ? 'text-yellow-700' : 'text-blue-700'
          }`}>
            <span>{workouts.length} workouts</span>
            <span>{workouts.filter(w => !w.isRestDay).length} training days</span>
            <span>{workouts.filter(w => w.isRestDay).length} rest days</span>
          </div>
        </div>
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        {workouts.length > 0 ? (
          workouts.map((workout, index) => (
            <WorkoutCard
              key={`workout-${state.currentWeekIndex}-${index}`}
              workout={workout}
              workoutIndex={index}
              weekIndex={state.currentWeekIndex}
              isExpanded={expandedWorkouts.has(`workout-${state.currentWeekIndex}-${index}`)}
              onToggle={() => handleToggleExpand(`workout-${state.currentWeekIndex}-${index}`)}
              onUpdate={(updatedWorkout) => handleUpdateWorkout(index, updatedWorkout)}
              onDelete={() => setShowConfirmDelete({weekIndex: state.currentWeekIndex, workoutIndex: index})}
              canDelete={workouts.length > 1}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts in this week</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first workout to this week</p>
            <Button onClick={handleAddWorkout} leftIcon={<Plus size={16} />}>
              Add First Workout
            </Button>
          </div>
        )}
      </div>

      {/* Add Workout Button */}
      {workouts.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleAddWorkout}
            leftIcon={<Plus size={16} />}
            size="lg"
            disabled={workouts.length >= 7} // Max 7 days per week
          >
            Add Another Workout
            {workouts.length >= 7 && <span className="ml-2 text-xs">(Week Full)</span>}
          </Button>
        </div>
      )}

      {/* Workout Tips */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Workout Planning Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Day numbers</strong> represent the sequence (1=Monday, 7=Sunday)</li>
              <li>• <strong>Rest days</strong> are important for recovery - don't skip them</li>
              <li>• <strong>Workout types</strong> help organize your training focus</li>
              <li>• <strong>Duration estimates</strong> help clients plan their schedule</li>
              <li>• You can have multiple workouts per day or skip days entirely</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrev}>
          Back to Week Structure
        </Button>
        
        <Button 
          onClick={validateAndNext} 
          disabled={!state.weeks.some(week => week.workouts && week.workouts.length > 0)}
        >
          Continue to Exercises
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Workout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteWorkout(showConfirmDelete.workoutIndex)}
              >
                Delete Workout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}