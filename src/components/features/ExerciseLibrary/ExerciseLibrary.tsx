'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Video } from 'lucide-react'
import { Exercise } from '@/types/exercise'

interface ExerciseLibraryProps {
  onAddExercise: (exercise: Exercise) => void
}

export default function ExerciseLibrary({ onAddExercise }: ExerciseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  
  // Mock exercise data
  const exercises: Exercise[] = [
    {
      id: '1',
      name: 'Barbell Bench Press',
      thumbnail: 'https://picsum.photos/id/237/200/200',
      hasVideo: true,
      muscleGroup: 'chest',
      equipment: 'barbell',
      difficulty: 'intermediate'
    },
    {
      id: '2',
      name: 'Pull-ups',
      thumbnail: 'https://picsum.photos/id/238/200/200',
      hasVideo: true,
      muscleGroup: 'back',
      equipment: 'bodyweight',
      difficulty: 'advanced'
    },
    {
      id: '3',
      name: 'Squats',
      thumbnail: 'https://picsum.photos/id/239/200/200',
      hasVideo: true,
      muscleGroup: 'legs',
      equipment: 'bodyweight',
      difficulty: 'beginner'
    },
    {
      id: '4',
      name: 'Dumbbell Shoulder Press',
      thumbnail: 'https://picsum.photos/id/240/200/200',
      hasVideo: false,
      muscleGroup: 'shoulders',
      equipment: 'dumbbell',
      difficulty: 'intermediate'
    },
    {
      id: '5',
      name: 'Bicep Curls',
      thumbnail: 'https://picsum.photos/id/241/200/200',
      hasVideo: true,
      muscleGroup: 'arms',
      equipment: 'dumbbell',
      difficulty: 'beginner'
    },
    {
      id: '6',
      name: 'Tricep Dips',
      thumbnail: 'https://picsum.photos/id/242/200/200',
      hasVideo: false,
      muscleGroup: 'arms',
      equipment: 'bodyweight',
      difficulty: 'intermediate'
    },
    {
      id: '7',
      name: 'Deadlift',
      thumbnail: 'https://picsum.photos/id/243/200/200',
      hasVideo: true,
      muscleGroup: 'back',
      equipment: 'barbell',
      difficulty: 'advanced'
    },
    {
      id: '8',
      name: 'Plank',
      thumbnail: 'https://picsum.photos/id/244/200/200',
      hasVideo: false,
      muscleGroup: 'core',
      equipment: 'bodyweight',
      difficulty: 'beginner'
    }
  ]
  
  useEffect(() => {
    // Filter exercises based on search term and filters
    let filtered = exercises
    
    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(ex => ex.muscleGroup === selectedMuscleGroup)
    }
    
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => ex.equipment === selectedEquipment)
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty)
    }
    
    setFilteredExercises(filtered)
  }, [searchTerm, selectedMuscleGroup, selectedEquipment, selectedDifficulty])
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">Exercise Library</h2>
        <p className="text-sm text-gray-500">2488 exercises available</p>
        
        <div className="mt-3 relative">
          <div className="flex">
            <div className="relative flex-grow">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            <button 
              className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Group</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              >
                <option value="all">All Muscle Groups</option>
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="legs">Legs</option>
                <option value="shoulders">Shoulders</option>
                <option value="arms">Arms</option>
                <option value="core">Core</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
              >
                <option value="all">All Equipment</option>
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="kettlebell">Kettlebell</option>
                <option value="machine">Machine</option>
                <option value="cable">Cable</option>
                <option value="bodyweight">Bodyweight</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {filteredExercises.map(exercise => (
            <div 
              key={exercise.id} 
              className="border border-gray-200 rounded-md overflow-hidden hover:border-blue-500 cursor-pointer transition-all"
              onClick={() => onAddExercise(exercise)}
            >
              <div className="relative h-32">
                <img 
                  src={exercise.thumbnail} 
                  alt={exercise.name} 
                  className="w-full h-full object-cover"
                />
                {exercise.hasVideo && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                    <Video size={14} />
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-800 truncate">{exercise.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{exercise.muscleGroup} • {exercise.equipment}</p>
              </div>
            </div>
          ))}
        </div>
        
        {filteredExercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No exercises found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}