'use client'

import { CheckCircle, Clock, ChevronRight } from 'lucide-react'
import { WorkoutCalendar } from './WorkoutCalendar'

interface WorkoutHistoryProps {
  workouts: Array<{
    id: string
    date: string
    name: string
    completed: boolean
    exercises: number
    completedExercises: number
    duration: number
  }>
  showAll?: boolean
  showCalendar?: boolean
}

export default function WorkoutHistory({ workouts, showAll = false, showCalendar = true }: WorkoutHistoryProps) {
  // If not showing all, limit to 3 most recent workouts
  const displayWorkouts = showAll ? workouts : workouts.slice(0, 3)

  // Extract completed workout dates for calendar
  const completedDates = workouts
    .filter(w => w.completed)
    .map(w => w.date.split('T')[0]) // Convert to YYYY-MM-DD format

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      {showCalendar && (
        <WorkoutCalendar
          completedDates={completedDates}
          onDateClick={(date) => {
            console.log('Date clicked:', date)
            // In real app, filter workouts by date or navigate to that day
          }}
        />
      )}

      {/* History List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800">Workout History</h2>
          {!showAll && workouts.length > 3 && (
            <button className="text-blue-600 text-sm flex items-center">
              View All
              <ChevronRight size={16} className="ml-1" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {displayWorkouts.map(workout => (
            <div key={workout.id} className="border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-gray-800">{workout.name}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {new Date(workout.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Completed
                </div>
              </div>

              <div className="mt-3 flex items-center text-sm text-gray-600">
                <div className="flex items-center mr-4">
                  <CheckCircle size={16} className="text-green-500 mr-1" />
                  <span>{workout.completedExercises}/{workout.exercises} exercises</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="text-gray-400 mr-1" />
                  <span>{workout.duration} minutes</span>
                </div>
              </div>

              <div className="mt-3">
                <button className="text-sm text-blue-600">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}