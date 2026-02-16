'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface WorkoutCalendarProps {
  completedDates: string[] // Array of date strings in ISO format (YYYY-MM-DD)
  onDateClick?: (date: string) => void
  className?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function WorkoutCalendar({
  completedDates,
  onDateClick,
  className = ''
}: WorkoutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Get days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const isCompletedDate = (date: Date): boolean => {
    const dateString = formatDateString(date)
    return completedDates.includes(dateString)
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(formatDateString(date))
    }
  }

  // Build calendar grid
  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = []

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i)
    calendarDays.push({ date, isCurrentMonth: false })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    calendarDays.push({ date, isCurrentMonth: true })
  }

  // Next month days to fill the grid (6 rows of 7 days = 42)
  const remainingDays = 42 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    calendarDays.push({ date, isCurrentMonth: false })
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">Workout Calendar</h2>
        <button
          onClick={goToToday}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Today
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <h3 className="text-base font-semibold text-gray-900">
          {MONTHS[month]} {year}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          const completed = isCompletedDate(item.date)
          const today = isToday(item.date)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(item.date)}
              disabled={!item.isCurrentMonth}
              className={`
                aspect-square p-1 rounded-lg text-sm font-medium transition-colors relative
                ${!item.isCurrentMonth ? 'text-gray-300 cursor-default' : ''}
                ${item.isCurrentMonth && !completed && !today ? 'text-gray-700 hover:bg-gray-100' : ''}
                ${today && !completed ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-200' : ''}
                ${completed && !today ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                ${completed && today ? 'bg-green-500 text-white ring-2 ring-blue-400' : ''}
              `}
            >
              <span className="flex items-center justify-center h-full">
                {item.date.getDate()}
              </span>

              {/* Workout completed indicator */}
              {completed && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-green-500 mr-2" />
          <span>Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-blue-50 ring-2 ring-blue-200 mr-2" />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
