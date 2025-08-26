'use client'

import { useState } from 'react'
import { Workout } from '@/types/workout'
import { Clock, ChevronDown, ChevronUp, CheckCircle, AlertCircle, MoreVertical } from 'lucide-react'

interface WorkoutCardProps {
  workout: Workout
  isActive: boolean
}

export default function WorkoutCard({ workout, isActive }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Determine background color based on workout type
  const getBgColor = () => {
    switch (workout.type) {
      case 'strength':
        return 'bg-blue-100 border-blue-200'
      case 'cardio':
        return 'bg-green-100 border-green-200'
      case 'flexibility':
        return 'bg-purple-100 border-purple-200'
      case 'hiit':
        return 'bg-orange-100 border-orange-200'
      case 'rest':
        return 'bg-gray-100 border-gray-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }
  
  // Determine text color based on workout type
  const getTextColor = () => {
    switch (workout.type) {
      case 'strength':
        return 'text-blue-800'
      case 'cardio':
        return 'text-green-800'
      case 'flexibility':
        return 'text-purple-800'
      case 'hiit':
        return 'text-orange-800'
      case 'rest':
        return 'text-gray-800'
      default:
        return 'text-gray-800'
    }
  }
  
  return (
    <div 
      className={`rounded-md border ${getBgColor()} overflow-hidden transition-all ${
        isExpanded ? 'shadow-md' : ''
      } ${
        !isActive ? 'opacity-75' : ''
      }`}
    >
      <div 
        className="p-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`text-sm font-medium ${getTextColor()}`}>{workout.title}</h3>
            
            <div className="flex items-center mt-1 text-xs text-gray-600">
              <Clock size={12} className="mr-1" />
              <span>{workout.duration} min</span>
              
              {workout.exercises.length > 0 && (
                <span className="ml-2">• {workout.exercises.length} exercises</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {workout.completed && (
              <CheckCircle size={14} className="text-green-500 mr-1" />
            )}
            
            {!workout.synced && (
              <AlertCircle size={14} className="text-amber-500 mr-1" />
            )}
            
            {isExpanded ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white p-2">
          {workout.exercises.length > 0 ? (
            <div className="space-y-2">
              {workout.exercises.map(exercise => (
                <div key={exercise.id} className="text-xs">
                  <div className="font-medium text-gray-800">{exercise.name}</div>
                  <div className="text-gray-500">
                    {exercise.sets} sets × {exercise.reps ? `${exercise.reps} reps` : `${formatTime(exercise.duration || 0)}`}
                    {exercise.weight && ` • ${exercise.weight}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-1">No exercises for this day</div>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
            <button className="text-xs text-blue-600 font-medium">Edit</button>
            
            <button className="text-gray-500">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format seconds into MM:SS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}