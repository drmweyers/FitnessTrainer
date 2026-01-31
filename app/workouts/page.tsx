'use client'

import { useState } from 'react'
import { ExerciseLibrary } from '@/components/features/ExerciseLibrary/ExerciseLibrary'
import WorkoutBuilder from '@/components/features/WorkoutBuilder/WorkoutBuilder'
import Layout from '@/components/layout/Layout'
import { Exercise } from '@/types/exercise'
import WorkoutModal from '@/components/features/WorkoutModal/WorkoutModal'

export default function WorkoutBuilderPage() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const handleAddExercise = (exercise: Exercise) => {
    setSelectedExercises([...selectedExercises, { ...exercise, id: `${exercise.id}-${Date.now()}` }])
  }
  
  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== id))
  }
  
  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)
  
  return (
    <Layout breadcrumbItems={[{ label: "Workouts", href: "/workouts" }]}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Workout Builder</h1>
          <button 
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Section
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WorkoutBuilder 
              exercises={selectedExercises} 
              onRemoveExercise={handleRemoveExercise} 
            />
          </div>
          <div>
            <ExerciseLibrary
              exercises={[]}
              viewMode="grid"
              isLoading={false}
              currentPage={1}
              totalPages={1}
              hasNextPage={false}
              onPageChange={() => {}}
              onAddExercise={handleAddExercise}
            />
          </div>
        </div>
      </div>
      
      {/* Workout Section Modal */}
      <WorkoutModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </Layout>
  )
}