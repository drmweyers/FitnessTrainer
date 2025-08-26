'use client'

import { useState } from 'react'
import WorkoutCard from './WorkoutCard'
import { DayPlan } from '@/types/workout'
import { Plus } from 'lucide-react'

interface DayCellProps {
  day: DayPlan
}

export default function DayCell({ day }: DayCellProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const isToday = isSameDay(new Date(), day.date)
  const isPast = day.date < new Date() && !isToday
  
  return (
    <div 
      className={`min-h-[150px] p-2 border-r border-gray-200 last:border-r-0 ${
        isToday ? 'bg-blue-50' : ''
      } ${
        !day.isActive ? 'bg-gray-50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
          {day.date.getDate()}
        </div>
        
        {(isHovered || day.workouts.length === 0) && day.isActive && (
          <button className="text-gray-400 hover:text-gray-600">
            <Plus size={16} />
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {day.workouts.map(workout => (
          <WorkoutCard key={workout.id} workout={workout} isActive={day.isActive} />
        ))}
        
        {day.workouts.length === 0 && !isHovered && (
          <div className="h-16 flex items-center justify-center text-xs text-gray-400">
            {day.isActive ? 'No workouts' : 'Inactive'}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}