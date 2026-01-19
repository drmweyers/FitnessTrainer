'use client'

import { Activity, CheckCircle, Clock } from 'lucide-react'

interface TrainingOverviewProps {
  client: {
    workouts: Array<{
      id: string
      date: string
      name: string
      completed: boolean
      exercises: number
      completedExercises: number
      duration: number
    }>
    upcomingWorkouts: Array<{
      id: string
      date: string
      name: string
      scheduled: boolean
    }>
  }
}

export default function TrainingOverview({ client }: TrainingOverviewProps) {
  // Calculate stats
  const totalWorkouts = client.workouts.length
  const completedWorkouts = client.workouts.filter(w => w.completed).length
  const totalExercises = client.workouts.reduce((sum, w) => sum + w.exercises, 0)
  const completedExercises = client.workouts.reduce((sum, w) => sum + w.completedExercises, 0)
  const totalDuration = client.workouts.reduce((sum, w) => sum + w.duration, 0)
  const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0
  
  // Get most recent workout
  const lastWorkout = client.workouts[0]
  
  // Get next scheduled workout
  const nextWorkout = client.upcomingWorkouts[0]
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Training Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <CheckCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Completion Rate</div>
              <div className="text-xl font-semibold text-gray-800">
                {totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {completedExercises}/{totalExercises} exercises completed
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <Activity size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Workouts Completed</div>
              <div className="text-xl font-semibold text-gray-800">
                {completedWorkouts}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            In the last 30 days
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-2 mr-3">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg. Workout Duration</div>
              <div className="text-xl font-semibold text-gray-800">
                {averageDuration} min
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Based on {totalWorkouts} sessions
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Last Completed Workout</h3>
          {lastWorkout ? (
            <div>
              <div className="text-base font-medium text-gray-800">{lastWorkout.name}</div>
              <div className="mt-1 text-sm text-gray-500">
                {new Date(lastWorkout.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <div className="flex items-center mr-3">
                  <CheckCircle size={14} className="text-green-500 mr-1" />
                  <span>{lastWorkout.completedExercises}/{lastWorkout.exercises} exercises</span>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="text-gray-400 mr-1" />
                  <span>{lastWorkout.duration} minutes</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No workouts completed yet</div>
          )}
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Next Scheduled Workout</h3>
          {nextWorkout ? (
            <div>
              <div className="text-base font-medium text-gray-800">{nextWorkout.name}</div>
              <div className="mt-1 text-sm text-gray-500">
                {new Date(nextWorkout.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="mt-2">
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">
                  View Workout
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No upcoming workouts scheduled</div>
          )}
        </div>
      </div>
    </div>
  )
}