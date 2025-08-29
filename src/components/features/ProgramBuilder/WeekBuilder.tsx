'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  Copy, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  GripVertical,
  Edit2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Textarea } from '@/components/shared/Textarea'
import { useProgramBuilder } from './ProgramBuilderContext'
import { ProgramWeekData } from '@/types/program'

interface WeekBuilderProps {
  onNext: () => void
  onPrev: () => void
}

interface WeekCardProps {
  week: ProgramWeekData
  weekIndex: number
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (week: ProgramWeekData) => void
  onDuplicate: () => void
  onDelete: () => void
  canDelete: boolean
}

function WeekCard({
  week,
  weekIndex,
  isExpanded,
  onToggle,
  onUpdate,
  onDuplicate,
  onDelete,
  canDelete
}: WeekCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingWeek, setEditingWeek] = useState<ProgramWeekData>(week)

  const handleSave = () => {
    // Validate required fields
    if (!editingWeek.name.trim()) {
      return
    }
    
    onUpdate(editingWeek)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditingWeek(week)
    setIsEditing(false)
  }

  const workoutCount = week.workouts?.length || 0
  const restDays = week.workouts?.filter(w => w.isRestDay).length || 0
  const trainingDays = workoutCount - restDays

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${
      week.isDeload ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
    }`}>
      {/* Week Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={!isEditing ? onToggle : undefined}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-gray-400">
            <GripVertical size={20} />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              week.isDeload 
                ? 'bg-yellow-200 text-yellow-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {week.isDeload ? 'D' : week.weekNumber}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">{week.name}</h3>
              {week.description && (
                <p className="text-sm text-gray-600 truncate max-w-xs">
                  {week.description}
                </p>
              )}
            </div>
          </div>
          
          {week.isDeload && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Deload Week
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Week Stats */}
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{trainingDays} training</span>
            </span>
            {restDays > 0 && (
              <span>{restDays} rest</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit week"
            >
              <Edit2 size={16} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Duplicate week"
            >
              <Copy size={16} />
            </button>
            
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete week"
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
                  label="Week Name"
                  value={editingWeek.name}
                  onChange={(e) => setEditingWeek({ ...editingWeek, name: e.target.value })}
                  placeholder="e.g., Week 1, Deload Week"
                />
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                    Week Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={!editingWeek.isDeload}
                        onChange={() => setEditingWeek({ ...editingWeek, isDeload: false })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Regular</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={editingWeek.isDeload}
                        onChange={() => setEditingWeek({ ...editingWeek, isDeload: true })}
                        className="text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="text-sm">Deload</span>
                    </label>
                  </div>
                </div>
              </div>

              <Textarea
                label="Description (Optional)"
                value={editingWeek.description || ''}
                onChange={(e) => setEditingWeek({ ...editingWeek, description: e.target.value })}
                placeholder="Notes about this week's focus or modifications"
                rows={3}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!editingWeek.name.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Week Description */}
              {week.description && (
                <p className="text-gray-700">{week.description}</p>
              )}

              {/* Workout Summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Week Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{workoutCount}</div>
                    <div className="text-gray-600">Total Days</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">{trainingDays}</div>
                    <div className="text-gray-600">Training</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">{restDays}</div>
                    <div className="text-gray-600">Rest</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">
                      {trainingDays > 0 ? Math.round((trainingDays / 7) * 100) : 0}%
                    </div>
                    <div className="text-gray-600">Active</div>
                  </div>
                </div>
              </div>

              {/* Workouts List */}
              {workoutCount > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Workouts</h4>
                  <div className="space-y-2">
                    {week.workouts?.map((workout, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded border ${
                          workout.isRestDay 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            workout.isRestDay 
                              ? 'bg-gray-200 text-gray-600' 
                              : 'bg-blue-200 text-blue-700'
                          }`}>
                            {workout.dayNumber}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{workout.name}</div>
                            {workout.description && (
                              <div className="text-sm text-gray-600">{workout.description}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {workout.workoutType && !workout.isRestDay && (
                            <span className="capitalize">{workout.workoutType}</span>
                          )}
                          {workout.estimatedDuration && !workout.isRestDay && (
                            <span>{workout.estimatedDuration}min</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No workouts added to this week yet</p>
                  <p className="text-sm">You'll add workouts in the next step</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WeekBuilder({ onNext, onPrev }: WeekBuilderProps) {
  const { state, dispatch } = useProgramBuilder()
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]))
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null)

  const handleToggleExpand = (weekIndex: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekIndex)) {
      newExpanded.delete(weekIndex)
    } else {
      newExpanded.add(weekIndex)
    }
    setExpandedWeeks(newExpanded)
  }

  const handleUpdateWeek = (weekIndex: number, updatedWeek: ProgramWeekData) => {
    dispatch({
      type: 'UPDATE_WEEK',
      payload: { index: weekIndex, week: updatedWeek }
    })
  }

  const handleDuplicateWeek = (weekIndex: number) => {
    dispatch({ type: 'DUPLICATE_WEEK', payload: weekIndex })
    // Expand the new week
    setExpandedWeeks(new Set([...expandedWeeks, state.weeks.length]))
  }

  const handleDeleteWeek = (weekIndex: number) => {
    dispatch({ type: 'REMOVE_WEEK', payload: weekIndex })
    setShowConfirmDelete(null)
    
    // Update expanded weeks after deletion
    const newExpanded = new Set<number>()
    expandedWeeks.forEach(index => {
      if (index < weekIndex) {
        newExpanded.add(index)
      } else if (index > weekIndex) {
        newExpanded.add(index - 1)
      }
    })
    setExpandedWeeks(newExpanded)
  }

  const handleAddWeek = () => {
    dispatch({ type: 'ADD_WEEK' })
    // Expand the new week
    setExpandedWeeks(new Set([...expandedWeeks, state.weeks.length]))
  }

  const validateAndNext = () => {
    if (state.weeks.length === 0) {
      alert('Please add at least one week to your program')
      return
    }
    onNext()
  }

  const canDelete = state.weeks.length > 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Week Structure</h2>
        <p className="text-gray-600 mt-2">
          Design the weekly structure of your {state.durationWeeks}-week program
        </p>
      </div>

      {/* Program Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">{state.name}</h3>
            <p className="text-sm text-blue-700">
              {state.programType} • {state.difficultyLevel} • {state.durationWeeks} weeks
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-blue-700">
            <span>{state.weeks.length} weeks configured</span>
            <div className="flex items-center space-x-1">
              <CheckCircle size={16} />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weeks List */}
      <div className="space-y-4">
        {state.weeks.map((week, index) => (
          <WeekCard
            key={`week-${week.weekNumber}-${index}`}
            week={week}
            weekIndex={index}
            isExpanded={expandedWeeks.has(index)}
            onToggle={() => handleToggleExpand(index)}
            onUpdate={(updatedWeek) => handleUpdateWeek(index, updatedWeek)}
            onDuplicate={() => handleDuplicateWeek(index)}
            onDelete={() => setShowConfirmDelete(index)}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Add Week Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleAddWeek}
          leftIcon={<Plus size={16} />}
          size="lg"
        >
          Add Another Week
        </Button>
      </div>

      {/* Week Structure Tips */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Week Structure Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Deload weeks</strong> are lighter training weeks for recovery</li>
              <li>• <strong>Copy weeks</strong> when you want similar training patterns</li>
              <li>• <strong>Week names</strong> can be customized (e.g., "Base Building", "Peak Week")</li>
              <li>• You'll add specific workouts to each week in the next step</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrev}>
          Back to Program Info
        </Button>
        
        <Button onClick={validateAndNext} disabled={state.weeks.length === 0}>
          Continue to Workouts
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Week</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{state.weeks[showConfirmDelete]?.name}"? 
              This action cannot be undone.
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
                onClick={() => handleDeleteWeek(showConfirmDelete)}
              >
                Delete Week
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}