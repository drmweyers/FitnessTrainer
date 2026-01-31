'use client'

import { useState, useEffect } from 'react'
import WeekRow from './WeekRow'
import { DayPlan, Workout } from '@/types/workout'
import { Plus } from 'lucide-react'

interface CalendarGridProps {
  startDate: Date
}

// Mock workout data
const mockWorkouts: Record<string, Workout[]> = {
  // First week
  '0': [
    {
      id: 'w1',
      title: 'Upper Body Strength',
      type: 'strength',
      duration: 45,
      exercises: [
        { id: 'e1', name: 'Bench Press', sets: 3, reps: 10, weight: '135 lbs' },
        { id: 'e2', name: 'Shoulder Press', sets: 3, reps: 10, weight: '95 lbs' },
        { id: 'e3', name: 'Lat Pulldown', sets: 3, reps: 12, weight: '120 lbs' },
        { id: 'e4', name: 'Bicep Curls', sets: 3, reps: 12, weight: '25 lbs' }
      ],
      completed: true,
      synced: true
    }
  ],
  '1': [
    {
      id: 'w2',
      title: 'Lower Body Strength',
      type: 'strength',
      duration: 50,
      exercises: [
        { id: 'e5', name: 'Squats', sets: 4, reps: 8, weight: '185 lbs' },
        { id: 'e6', name: 'Deadlifts', sets: 3, reps: 8, weight: '205 lbs' },
        { id: 'e7', name: 'Leg Press', sets: 3, reps: 12, weight: '250 lbs' },
        { id: 'e8', name: 'Calf Raises', sets: 3, reps: 15, weight: '100 lbs' }
      ],
      completed: true,
      synced: true
    }
  ],
  '2': [
    {
      id: 'w3',
      title: 'HIIT Cardio',
      type: 'hiit',
      duration: 30,
      exercises: [
        { id: 'e9', name: 'Burpees', sets: 3, reps: 15 },
        { id: 'e10', name: 'Mountain Climbers', sets: 3, reps: 20 },
        { id: 'e11', name: 'Jump Squats', sets: 3, reps: 15 },
        {
          id: 'e12', name: 'High Knees', sets: 3, duration: 30,
          reps: 0
        }
      ],
      completed: true,
      synced: true
    }
  ],
  '3': [
    {
      id: 'w4',
      title: 'Upper Body Hypertrophy',
      type: 'strength',
      duration: 55,
      exercises: [
        { id: 'e13', name: 'Incline Bench Press', sets: 4, reps: 12, weight: '115 lbs' },
        { id: 'e14', name: 'Cable Flyes', sets: 3, reps: 15, weight: '25 lbs' },
        { id: 'e15', name: 'Tricep Pushdowns', sets: 3, reps: 12, weight: '50 lbs' },
        { id: 'e16', name: 'Pull-ups', sets: 3, reps: 8 }
      ],
      completed: true,
      synced: false
    }
  ],
  '4': [
    {
      id: 'w5',
      title: 'Lower Body Hypertrophy',
      type: 'strength',
      duration: 60,
      exercises: [
        { id: 'e17', name: 'Front Squats', sets: 4, reps: 10, weight: '135 lbs' },
        { id: 'e18', name: 'Romanian Deadlifts', sets: 3, reps: 12, weight: '155 lbs' },
        { id: 'e19', name: 'Leg Extensions', sets: 3, reps: 15, weight: '90 lbs' },
        { id: 'e20', name: 'Hamstring Curls', sets: 3, reps: 12, weight: '80 lbs' }
      ],
      completed: false,
      synced: false
    }
  ],
  '5': [
    {
      id: 'w6',
      title: 'Steady State Cardio',
      type: 'cardio',
      duration: 40,
      exercises: [
        {
          id: 'e21', name: 'Treadmill Run', sets: 1, duration: 2400,
          reps: 0
        }
      ],
      completed: false,
      synced: false
    }
  ],
  '6': [
    {
      id: 'w7',
      title: 'Rest Day',
      type: 'rest',
      duration: 0,
      exercises: [],
      completed: true,
      synced: true
    }
  ],
  
  // Second week
  '7': [
    {
      id: 'w8',
      title: 'Push Workout',
      type: 'strength',
      duration: 50,
      exercises: [
        { id: 'e22', name: 'Bench Press', sets: 4, reps: 8, weight: '145 lbs' },
        { id: 'e23', name: 'Overhead Press', sets: 3, reps: 10, weight: '95 lbs' },
        { id: 'e24', name: 'Incline Dumbbell Press', sets: 3, reps: 12, weight: '40 lbs' },
        { id: 'e25', name: 'Tricep Dips', sets: 3, reps: 12 }
      ],
      completed: false,
      synced: false
    }
  ],
  '8': [
    {
      id: 'w9',
      title: 'Pull Workout',
      type: 'strength',
      duration: 50,
      exercises: [
        { id: 'e26', name: 'Barbell Rows', sets: 4, reps: 8, weight: '135 lbs' },
        { id: 'e27', name: 'Pull-ups', sets: 3, reps: 8 },
        { id: 'e28', name: 'Face Pulls', sets: 3, reps: 15, weight: '50 lbs' },
        { id: 'e29', name: 'Bicep Curls', sets: 3, reps: 12, weight: '25 lbs' }
      ],
      completed: false,
      synced: false
    }
  ],
  '9': [
    {
      id: 'w10',
      title: 'Leg Workout',
      type: 'strength',
      duration: 55,
      exercises: [
        { id: 'e30', name: 'Back Squats', sets: 4, reps: 8, weight: '185 lbs' },
        { id: 'e31', name: 'Romanian Deadlifts', sets: 3, reps: 10, weight: '165 lbs' },
        { id: 'e32', name: 'Walking Lunges', sets: 3, reps: 20, weight: '20 lbs' },
        { id: 'e33', name: 'Calf Raises', sets: 4, reps: 15, weight: '100 lbs' }
      ],
      completed: false,
      synced: false
    }
  ],
  '10': [
    {
      id: 'w11',
      title: 'HIIT Session',
      type: 'hiit',
      duration: 25,
      exercises: [
        { id: 'e34', name: 'Kettlebell Swings', sets: 3, reps: 15, weight: '35 lbs' },
        { id: 'e35', name: 'Box Jumps', sets: 3, reps: 12 },
        {
          id: 'e36', name: 'Battle Ropes', sets: 3, duration: 30,
          reps: 0
        },
        { id: 'e37', name: 'Medicine Ball Slams', sets: 3, reps: 15, weight: '15 lbs' }
      ],
      completed: false,
      synced: false
    }
  ],
  '11': [
    {
      id: 'w12',
      title: 'Upper Body Focus',
      type: 'strength',
      duration: 45,
      exercises: [
        { id: 'e38', name: 'Push-ups', sets: 4, reps: 15 },
        { id: 'e39', name: 'Dumbbell Rows', sets: 3, reps: 12, weight: '35 lbs' },
        { id: 'e40', name: 'Lateral Raises', sets: 3, reps: 15, weight: '15 lbs' },
        { id: 'e41', name: 'Skull Crushers', sets: 3, reps: 12, weight: '30 lbs' }
      ],
      completed: false,
      synced: false
    }
  ],
  '12': [
    {
      id: 'w13',
      title: 'Flexibility & Mobility',
      type: 'flexibility',
      duration: 30,
      exercises: [
        {
          id: 'e42', name: 'Dynamic Stretching', sets: 1, duration: 600,
          reps: 0
        },
        {
          id: 'e43', name: 'Foam Rolling', sets: 1, duration: 600,
          reps: 0
        },
        {
          id: 'e44', name: 'Yoga Flow', sets: 1, duration: 600,
          reps: 0
        }
      ],
      completed: false,
      synced: false
    }
  ],
  '13': [
    {
      id: 'w14',
      title: 'Rest Day',
      type: 'rest',
      duration: 0,
      exercises: [],
      completed: false,
      synced: false
    }
  ]
};

export default function CalendarGrid({ startDate }: CalendarGridProps) {
  const [days, setDays] = useState<DayPlan[]>([])
  
  useEffect(() => {
    // Generate 14 days starting from the startDate
    const newDays: DayPlan[] = []
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      newDays.push({
        date,
        workouts: mockWorkouts[i.toString()] || [],
        isActive: i < 5 // First 5 days are active (for demo purposes)
      })
    }
    
    setDays(newDays)
  }, [startDate])
  
  // Split days into two weeks
  const firstWeek = days.slice(0, 7)
  const secondWeek = days.slice(7, 14)
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <WeekRow days={firstWeek} />
      <WeekRow days={secondWeek} />
      
      <div className="p-4 border-t border-gray-200 flex justify-center">
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
          <Plus size={16} className="mr-1" />
          Add Week
        </button>
      </div>
    </div>
  )
}