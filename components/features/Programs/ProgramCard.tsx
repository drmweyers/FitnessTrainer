'use client'

import React, { useState } from 'react'
import { 
  Edit2, 
  Copy, 
  Trash2, 
  UserPlus, 
  Clock, 
  Calendar,
  Users,
  Target,
  Dumbbell,
  MoreVertical,
  Star
} from 'lucide-react'
import { Program, ProgramType, DifficultyLevel } from '@/types/program'

interface ProgramCardProps {
  program: Program
  viewMode?: 'grid' | 'list'
  onEdit: (program: Program) => void
  onDuplicate: (program: Program) => void
  onDelete: (program: Program) => void
  onAssign: (program: Program) => void
}

const programTypeColors: Record<ProgramType, string> = {
  [ProgramType.STRENGTH]: 'bg-red-100 text-red-700',
  [ProgramType.HYPERTROPHY]: 'bg-purple-100 text-purple-700',
  [ProgramType.ENDURANCE]: 'bg-green-100 text-green-700',
  [ProgramType.POWERLIFTING]: 'bg-red-100 text-red-700',
  [ProgramType.OLYMPIC_WEIGHTLIFTING]: 'bg-yellow-100 text-yellow-700',
  [ProgramType.CROSSFIT]: 'bg-orange-100 text-orange-700',
  [ProgramType.CALISTHENICS]: 'bg-blue-100 text-blue-700',
  [ProgramType.CARDIO]: 'bg-green-100 text-green-700',
  [ProgramType.FLEXIBILITY]: 'bg-teal-100 text-teal-700',
  [ProgramType.REHABILITATION]: 'bg-gray-100 text-gray-700',
  [ProgramType.SPORT_SPECIFIC]: 'bg-indigo-100 text-indigo-700',
  [ProgramType.GENERAL_FITNESS]: 'bg-cyan-100 text-cyan-700',
  [ProgramType.WEIGHT_LOSS]: 'bg-pink-100 text-pink-700',
  [ProgramType.MUSCLE_GAIN]: 'bg-violet-100 text-violet-700',
  [ProgramType.HYBRID]: 'bg-amber-100 text-amber-700',
}

const difficultyColors: Record<DifficultyLevel, string> = {
  [DifficultyLevel.BEGINNER]: 'bg-green-100 text-green-700',
  [DifficultyLevel.INTERMEDIATE]: 'bg-yellow-100 text-yellow-700',
  [DifficultyLevel.ADVANCED]: 'bg-red-100 text-red-700'
}

const formatProgramType = (type: ProgramType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const formatDifficulty = (difficulty: DifficultyLevel): string => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
}

export default function ProgramCard({
  program,
  viewMode = 'grid',
  onEdit,
  onDuplicate,
  onDelete,
  onAssign
}: ProgramCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleActionClick = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    setShowDropdown(false)
    action()
  }

  const workoutCount = program.weeks?.reduce((total, week) => total + week.workouts.length, 0) || 0
  const assignmentCount = program.assignments?.filter(a => a.isActive).length || 0

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          {/* Left Section - Main Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Dumbbell size={24} className="text-primary-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{program.name}</h3>
                  {program.description && (
                    <p className="text-gray-600 text-sm mt-1 overflow-hidden text-ellipsis">{program.description}</p>
                  )}
                </div>
                
                {program.isTemplate && (
                  <Star size={16} className="text-yellow-500 flex-shrink-0 mt-1" />
                )}
              </div>

              {/* Badges Row */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  programTypeColors[program.programType]
                }`}>
                  {formatProgramType(program.programType)}
                </span>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  difficultyColors[program.difficultyLevel]
                }`}>
                  {formatDifficulty(program.difficultyLevel)}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Section - Stats */}
          <div className="hidden md:flex items-center gap-6 px-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{program.durationWeeks}</div>
              <div className="text-xs text-gray-500">Weeks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{workoutCount}</div>
              <div className="text-xs text-gray-500">Workouts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{assignmentCount}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleActionClick(() => onAssign(program), e)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <UserPlus size={14} />
              Assign
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={(e) => handleActionClick(() => onEdit(program), e)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 size={14} />
                    Edit Program
                  </button>
                  
                  <button
                    onClick={(e) => handleActionClick(() => onDuplicate(program), e)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy size={14} />
                    Duplicate
                  </button>
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={(e) => handleActionClick(() => onDelete(program), e)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid View
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{program.name}</h3>
              {program.isTemplate && (
                <Star size={16} className="text-yellow-500 flex-shrink-0" />
              )}
            </div>
            
            {program.description && (
              <p className="text-gray-600 text-sm mb-3 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{program.description}</p>
            )}
          </div>

          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={(e) => handleActionClick(() => onEdit(program), e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 size={14} />
                  Edit Program
                </button>
                
                <button
                  onClick={(e) => handleActionClick(() => onDuplicate(program), e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={(e) => handleActionClick(() => onDelete(program), e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            programTypeColors[program.programType]
          }`}>
            {formatProgramType(program.programType)}
          </span>
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            difficultyColors[program.difficultyLevel]
          }`}>
            {formatDifficulty(program.difficultyLevel)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar size={14} className="text-gray-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{program.durationWeeks}</div>
            <div className="text-xs text-gray-500">Weeks</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dumbbell size={14} className="text-gray-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{workoutCount}</div>
            <div className="text-xs text-gray-500">Workouts</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={14} className="text-primary-500" />
            </div>
            <div className="text-lg font-bold text-primary-600">{assignmentCount}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>

        {/* Goals */}
        {program.goals && program.goals.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <Target size={14} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Goals</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {program.goals.slice(0, 3).map((goal, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-50 text-primary-700"
                >
                  {goal}
                </span>
              ))}
              {program.goals.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  +{program.goals.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Equipment */}
        {program.equipmentNeeded && program.equipmentNeeded.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <Dumbbell size={14} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Equipment</span>
            </div>
            <p className="text-xs text-gray-600 truncate">
              {program.equipmentNeeded.slice(0, 3).join(', ')}
              {program.equipmentNeeded.length > 3 && ` +${program.equipmentNeeded.length - 3} more`}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-white">
        <button
          onClick={(e) => handleActionClick(() => onAssign(program), e)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-target"
        >
          <UserPlus size={16} />
          Assign to Client
        </button>
      </div>
    </div>
  )
}