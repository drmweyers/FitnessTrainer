'use client'

import { useState } from 'react'
import { Exercise } from '@/types/exercise'
import { Plus, Trash2, GripVertical, Video } from 'lucide-react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface WorkoutBuilderProps {
  exercises: Exercise[]
  onRemoveExercise: (id: string) => void
}

interface WorkoutSection {
  id: string
  title: string
  exercises: Exercise[]
}

// Sortable exercise item component
function SortableExerciseItem({ exercise, onRemove }: { exercise: Exercise, onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: exercise.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center bg-gray-50 rounded-md p-2 mb-2"
      {...attributes}
    >
      <div className="mr-2 text-gray-400 cursor-grab" {...listeners}>
        <GripVertical size={16} />
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-md overflow-hidden mr-3">
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h4 className="text-sm font-medium">{exercise.name}</h4>
            <p className="text-xs text-gray-500 capitalize">{exercise.targetMuscles[0]} • {exercise.equipments[0]}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="text-blue-500">
          <Video size={16} />
        </button>
        <button 
          className="text-gray-500 hover:text-red-500"
          onClick={() => onRemove(exercise.id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function WorkoutBuilder({ exercises, onRemoveExercise }: WorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [sections, setSections] = useState<WorkoutSection[]>([
    { id: 'section-1', title: 'Warm-up', exercises: [] },
    { id: 'section-2', title: 'Main Workout', exercises: [] }
  ])
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleAddSection = () => {
    setSections([
      ...sections,
      { id: `section-${Date.now()}`, title: 'New Section', exercises: [] }
    ])
  }
  
  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId))
  }
  
  const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, title: newTitle } : section
    ))
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    if (active.id !== over.id) {
      // Find which section contains the dragged exercise
      const sourceSectionIndex = sections.findIndex(section => 
        section.exercises.some(ex => ex.id === active.id)
      )
      
      if (sourceSectionIndex === -1) return
      
      const sourceSection = sections[sourceSectionIndex]
      const sourceExercises = [...sourceSection.exercises]
      
      // Find the index of the dragged exercise
      const oldIndex = sourceExercises.findIndex(ex => ex.id === active.id)
      
      // Find the index of the target position
      const newIndex = sourceExercises.findIndex(ex => ex.id === over.id)
      
      // Update the order
      const newExercises = arrayMove(sourceExercises, oldIndex, newIndex)
      
      // Update the sections state
      const newSections = [...sections]
      newSections[sourceSectionIndex].exercises = newExercises
      setSections(newSections)
    }
  }
  
  // Add an exercise to a section
  const addExerciseToSection = (sectionId: string, exercise: Exercise) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, exercises: [...section.exercises, exercise] } 
        : section
    ))
  }
  
  // Remove an exercise from a section
  const removeExerciseFromSection = (exerciseId: string) => {
    setSections(sections.map(section => ({
      ...section,
      exercises: section.exercises.filter(ex => ex.id !== exerciseId)
    })))
    
    onRemoveExercise(exerciseId)
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">Build Your Workout</h2>
        
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Name your workout..."
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
        </div>
        
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a description..."
            rows={3}
            value={workoutDescription}
            onChange={(e) => setWorkoutDescription(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto">
        {sections.map((section, index) => (
          <div key={section.id} className="mb-4 border border-gray-200 rounded-md">
            <div className="bg-gray-50 p-3 flex items-center justify-between">
              <input
                type="text"
                className="bg-transparent border-none focus:outline-none font-medium"
                value={section.title}
                onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
              />
              <div className="flex items-center space-x-2">
                {sections.length > 1 && (
                  <button 
                    className="text-gray-500 hover:text-red-500"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-3">
              {section.exercises.length === 0 ? (
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-md p-4 text-center"
                  onClick={() => {
                    // If there are exercises available, add the first one to this section
                    if (exercises.length > 0) {
                      addExerciseToSection(section.id, exercises[0])
                    }
                  }}
                >
                  <p className="text-gray-500 text-sm">
                    {exercises.length > 0 
                      ? "Click to add an exercise or drag exercises here" 
                      : "Drag exercises here"}
                  </p>
                </div>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={section.exercises.map(ex => ex.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {section.exercises.map((exercise) => (
                      <SortableExerciseItem 
                        key={exercise.id} 
                        exercise={exercise} 
                        onRemove={removeExerciseFromSection} 
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        ))}
        
        <button 
          className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center justify-center"
          onClick={handleAddSection}
        >
          <Plus size={16} className="mr-1" />
          Add Section
        </button>
      </div>
      
      <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
          Save as Draft
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Workout
        </button>
      </div>
    </div>
  )
}