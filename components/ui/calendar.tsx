'use client'

import React from 'react'

export interface CalendarProps {
  mode?: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  initialFocus?: boolean
}

export const Calendar = ({ mode = 'single', selected, onSelect, className = '' }: CalendarProps) => {
  return (
    <div className={`p-3 ${className}`}>
      <div>Calendar placeholder</div>
      {selected && <div>Selected: {selected.toISOString()}</div>}
    </div>
  )
}

export default Calendar
