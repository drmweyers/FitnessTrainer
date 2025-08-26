'use client'

import { useState } from 'react'
import CalendarGrid from '@/components/features/Calender/CalenderGrid'
import Layout from '@/components/layout/Layout'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function ProgramsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 14)
    setCurrentDate(newDate)
  }
  
  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 14)
    setCurrentDate(newDate)
  }
  
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Workout Schedule</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <button 
                className="p-1 rounded-md hover:bg-gray-200"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="mx-2 text-gray-700">
                {new Date(currentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              
              <button 
                className="p-1 rounded-md hover:bg-gray-200"
                onClick={goToNextWeek}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Plus size={16} className="mr-1" />
              Add Program
            </button>
          </div>
        </div>
        
        <CalendarGrid startDate={getStartOfTwoWeeks(currentDate)} />
      </div>
    </Layout>
  )
}

// Helper function to get the start date of the two-week period
function getStartOfTwoWeeks(date: Date): Date {
  const startDate = new Date(date)
  const day = startDate.getDay()
  
  // Set to previous Sunday
  startDate.setDate(startDate.getDate() - day)
  
  return startDate
}