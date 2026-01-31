// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, Share2, MoreHorizontal, ChevronDown, List, Grid, Plus, Filter, X } from 'lucide-react'

// Types
interface Exercise {
  id: number
  name: string
  category: string
  thumbnail: string
}

interface ExerciseConfig {
  id: number
  name: string
  sets: Set[]
  eachSide: boolean
  tempo?: string
  notes?: string
}

interface Set {
  number: number
  weight?: number
  time: string
  rest: string
}

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Exercise Card Component
const ExerciseCard = ({ 
  exercise, 
  viewMode, 
  onSelect 
}: { 
  exercise: Exercise, 
  viewMode: string, 
  onSelect: (exercise: Exercise) => void 
}) => {
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${viewMode === 'grid' ? 'flex-col' : 'flex'}`}
      onClick={() => onSelect(exercise)}
    >
      <div className={`relative ${viewMode === 'grid' ? 'h-36 w-full' : 'h-20 w-20 min-w-20'} bg-gray-200 flex items-center justify-center`}>
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="#9CA3AF"/>
          </svg>
        </div>
      </div>
      <div className={`p-3 ${viewMode === 'grid' ? '' : 'flex-1 flex items-center'}`}>
        <h3 className="font-medium text-sm">{exercise.name}</h3>
        {viewMode !== 'grid' && (
          <button className="ml-auto text-gray-400">
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

// Exercise Set Table Component
const ExerciseSetTable = ({ 
  exercise, 
  sectionFormat, 
  onAddSet,
  onToggleEachSide
}: { 
  exercise: ExerciseConfig, 
  sectionFormat: string, 
  onAddSet: (exerciseId: number) => void,
  onToggleEachSide: (exerciseId: number) => void
}) => {
  return (
    <>
      <div className="overflow-x-auto mt-4">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="text-left text-gray-500 text-sm">
              <th className="font-medium pb-2">Set</th>
              <th className="font-medium pb-2">
                {sectionFormat === 'Interval' ? 'Time' : 'Weight (kg)'}
              </th>
              <th className="font-medium pb-2">
                {sectionFormat === 'Interval' ? 'Time' : 'Reps'}
              </th>
              <th className="font-medium pb-2">Rest</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set) => (
              <tr key={set.number} className="border-t border-gray-100">
                <td className="py-3">{set.number}</td>
                <td className="py-3">{set.weight || '-'}</td>
                <td className="py-3">{set.time}</td>
                <td className="py-3">{set.rest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-wrap items-center mt-4">
        <div className="flex items-center mr-4 mb-2 sm:mb-0">
          <input 
            type="checkbox" 
            id={`eachSide-${exercise.id}`} 
            className="mr-2"
            checked={exercise.eachSide}
            onChange={() => onToggleEachSide(exercise.id)}
          />
          <label htmlFor={`eachSide-${exercise.id}`} className="text-sm">Each Side</label>
        </div>
        <button className="text-sm text-gray-400 border border-gray-200 px-3 py-1 rounded mr-2 mb-2 sm:mb-0">
          Tempo
        </button>
        <div className="ml-auto flex mt-2 sm:mt-0">
          <button 
            className="bg-gray-100 text-gray-700 px-4 py-1 rounded mr-2 text-sm"
            onClick={() => onAddSet(exercise.id)}
          >
            Add Set
          </button>
          <button className="text-gray-400">
            <Plus size={18} />
          </button>
        </div>
      </div>
    </>
  )
}

// Main WorkoutModal Component
export default function WorkoutModal({ isOpen = true, onClose = () => {} }: WorkoutModalProps) {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sectionName, setSectionName] = useState('')
  const [sectionFormat, setSectionFormat] = useState('Interval')
  const [sectionType, setSectionType] = useState('Workout')
  const [sectionDuration, setSectionDuration] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [showExercises, setShowExercises] = useState(true)
  
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])
  
  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Set initial value
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Mock data
  const exercises: Exercise[] = [
    { id: 1, name: 'Dumbbell Floor Press', category: 'Chest', thumbnail: '/dumbbell-floor-press.jpg' },
    { id: 2, name: 'Dumbbell Rear Delt Row', category: 'Back', thumbnail: '/dumbbell-rear-delt-row.jpg' },
    { id: 3, name: 'Jumping Jacks', category: 'Cardio', thumbnail: '/jumping-jacks.jpg' },
    { id: 4, name: 'Dumbbell Bicep Curl', category: 'Arms', thumbnail: '/dumbbell-bicep-curl.jpg' },
    { id: 5, name: 'Standing Biceps Stretch', category: 'Stretch', thumbnail: '/standing-biceps-stretch.jpg' },
    { id: 6, name: 'Hanging Oblique Knee Raise', category: 'Core', thumbnail: '/hanging-oblique-knee-raise.jpg' },
    { id: 7, name: 'Walking High Knees', category: 'Cardio', thumbnail: '/walking-high-knees.jpg' },
  ]

  // Current section exercises
  const [sectionExercises, setSectionExercises] = useState<ExerciseConfig[]>([
    {
      id: 3,
      name: 'Jumping Jacks',
      eachSide: false,
      sets: [{ number: 1, time: '00:00:20', rest: '00:10' }]
    },
    {
      id: 2,
      name: 'Dumbbell Rear Delt Row',
      eachSide: false,
      sets: [{ number: 1, time: '00:00:20', rest: '00:10' }]
    }
  ])

  const handleAddExercise = (exercise: Exercise) => {
    const newExerciseConfig: ExerciseConfig = {
      id: exercise.id,
      name: exercise.name,
      eachSide: false,
      sets: [{ number: 1, time: '00:00:20', rest: '00:10' }]
    }
    setSectionExercises([...sectionExercises, newExerciseConfig])
    
    // On mobile, switch to section view after adding an exercise
    if (isMobile) {
      setShowExercises(false)
    }
  }

  const handleAddSet = (exerciseId: number) => {
    setSectionExercises(sectionExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const lastSet = exercise.sets[exercise.sets.length - 1]
        const newSet = {
          number: lastSet.number + 1,
          time: lastSet.time,
          rest: lastSet.rest
        }
        return {
          ...exercise,
          sets: [...exercise.sets, newSet]
        }
      }
      return exercise
    }))
  }

  // Toggle between exercise list and section configuration on mobile
  const toggleView = () => {
    setShowExercises(!showExercises)
  }

  const toggleEachSide = (exerciseId: number) => {
    setSectionExercises(sectionExercises.map(ex => 
      ex.id === exerciseId ? {...ex, eachSide: !ex.eachSide} : ex
    ))
  }
  
  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    // Modal Backdrop
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Create Section</h2>
          <button 
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="flex flex-col md:flex-row max-h-[calc(90vh-4rem)] overflow-hidden">
          {/* Mobile Navigation */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <button 
                className="text-blue-600 font-medium"
                onClick={toggleView}
              >
                {showExercises ? 'Section' : 'Exercises'}
              </button>
              <div className="flex items-center space-x-2">
                <button className={`p-1 ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-400'}`} onClick={() => setViewMode('list')}>
                  <List size={18} />
                </button>
                <button className={`p-1 ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-400'}`} onClick={() => setViewMode('grid')}>
                  <Grid size={18} />
                </button>
              </div>
            </div>
          )}
          
          {/* Left Sidebar - Exercise Library */}
          {(!isMobile || (isMobile && showExercises)) && (
            <div className="w-full h-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search for your Exercises"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Filter size={18} />
            </button>
          </div>
        </div>
        
        {/* Exercise List Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500">MOST RECENT (2515)</div>
                {!isMobile && (
          <div className="flex items-center">
            <button className={`p-1 ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-400'}`} onClick={() => setViewMode('list')}>
              <List size={18} />
            </button>
            <button className={`p-1 ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-400'}`} onClick={() => setViewMode('grid')}>
              <Grid size={18} />
            </button>
          </div>
                )}
        </div>
        
              {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {exercises.map((exercise) => (
                    <ExerciseCard 
                key={exercise.id} 
                      exercise={exercise}
                      viewMode={viewMode}
                      onSelect={handleAddExercise}
                    />
            ))}
          </div>
        </div>
      </div>
          )}
          
          {/* Main Content - Section Configuration */}
          
            <div className="flex-1 bg-gray-50 p-4 md:p-6 overflow-y-auto">
              {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
                <input
                  type="text"
                  placeholder="Name your section"
                  className="text-xl font-medium border-none bg-transparent focus:outline-none w-full"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                />
                <div className="flex items-center">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Share2 size={20} />
              </button>
            </div>
          </div>
          
              {/* Instructions */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <h2 className="text-sm font-medium text-gray-500 mb-2">INSTRUCTIONS</h2>
                <p className="text-gray-400 italic">Add instructions</p>
          </div>
          
              {/* Section Format */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[100%] sm:min-w-[200px]">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">SECTION FORMAT</h3>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none border border-gray-300 rounded-md py-2 px-4 bg-white"
                      value={sectionFormat}
                      onChange={(e) => setSectionFormat(e.target.value)}
                    >
                      <option value="Interval">Interval</option>
                      <option value="Circuit">Circuit</option>
                      <option value="Straight Set">Straight Set</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
                </div>
                
                <div className="flex-1 min-w-[100%] sm:min-w-[200px]">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">SECTION TYPE</h3>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none border border-gray-300 rounded-md py-2 px-4 bg-white"
                      value={sectionType}
                      onChange={(e) => setSectionType(e.target.value)}
                    >
                      <option value="Workout">Workout</option>
                      <option value="Warm Up">Warm Up</option>
                      <option value="Cool Down">Cool Down</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
            
                <div className="flex-1 min-w-[100%] sm:min-w-[200px]">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">DURATION (MIN)</h3>
                  <div className="flex items-center">
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md py-2 px-4 bg-white"
                      value={sectionDuration}
                      onChange={(e) => setSectionDuration(Number(e.target.value))}
                      min={1}
                    />
                    <span className="ml-2 text-gray-400">min</span>
                  </div>
                </div>
            </div>
            
              {/* Exercises */}
              {sectionExercises.map((exercise, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5V19L19 12L8 5Z" fill="#9CA3AF"/>
                        </svg>
                      </div>
                      <h3 className="font-medium text-lg flex-grow">{exercise.name}</h3>
                      <div className="ml-auto flex items-center mt-2 sm:mt-0">
                        <button className="text-gray-500 px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 mr-2">
                          Use %
                        </button>
                  <button className="text-gray-400">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
              
                    <ExerciseSetTable 
                      exercise={exercise}
                      sectionFormat={sectionFormat}
                      onAddSet={handleAddSet}
                      onToggleEachSide={toggleEachSide}
                    />
                    
                    <div className="border border-gray-200 rounded-md p-3 mt-4 text-gray-400 italic">
                Add note for this exercise
              </div>
            </div>
                </div>
              ))}
            </div>
          
          </div>
          
        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end space-x-4">
          <button 
            className="px-4 sm:px-6 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="px-4 sm:px-6 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
              Save
            </button>
          <button className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save & Close
            </button>
        </div>
      </div>
    </div>
  )
}