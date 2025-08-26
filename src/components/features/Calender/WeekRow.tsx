'use client'

import DayCell from './DayCell'
import { DayPlan } from '@/types/workout'

interface WeekRowProps {
  days: DayPlan[]
}

export default function WeekRow({ days }: WeekRowProps) {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {days.map((day, index) => (
        <DayCell key={index} day={day} />
      ))}
    </div>
  )
}