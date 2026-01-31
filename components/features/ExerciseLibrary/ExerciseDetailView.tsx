'use client'

import { useState } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Target, 
  Dumbbell, 
  User,
  Clock,
  CheckCircle,
  ChevronRight,
  Heart,
  Plus,
  Share2,
  Download,
  Info
} from 'lucide-react'
import { ExerciseWithUserData } from '@/types/exercise'
import { GifPlayer } from './GifPlayer'
import { RelatedExercises } from './RelatedExercises'

interface ExerciseDetailViewProps {
  exercise: ExerciseWithUserData
  onFavorite?: (exerciseId: string) => void
  onAddToCollection?: (exerciseId: string) => void
  className?: string
}

export function ExerciseDetailView({
  exercise,
  onFavorite,
  onAddToCollection,
  className = ''
}: ExerciseDetailViewProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<'instructions' | 'tips' | 'variations'>('instructions')

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepIndex)
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    )
  }

  const resetSteps = () => {
    setCompletedSteps([])
  }

  // Mock related exercises and tips
  const tips = [
    {
      title: "Proper Form",
      content: "Keep your lower back pressed against the floor throughout the movement to protect your spine."
    },
    {
      title: "Breathing",
      content: "Exhale as you lift your torso up, inhale as you lower back down. Don't hold your breath."
    },
    {
      title: "Common Mistakes",
      content: "Avoid pulling on your neck with your hands. Let your abs do the work, not your neck."
    },
    {
      title: "Progression",
      content: "Start with 2-3 sets of 10-15 reps. Gradually increase reps as you get stronger."
    }
  ]

  const variations = [
    {
      name: "Full Sit-up",
      description: "Complete the full range of motion by sitting up completely",
      difficulty: "Intermediate"
    },
    {
      name: "Russian Twist",
      description: "Add rotation to engage obliques while in the raised position",
      difficulty: "Intermediate"
    },
    {
      name: "Weighted 3/4 Sit-up",
      description: "Hold a weight plate against your chest for added resistance",
      difficulty: "Advanced"
    }
  ]

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GIF Player Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <GifPlayer
              exerciseId={exercise.exerciseId}
              gifUrl={exercise.gifUrl}
              exerciseName={exercise.name}
              className="aspect-video"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => onFavorite?.(exercise.id)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-all ${
                exercise.isFavorited
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600'
              }`}
            >
              <Heart size={16} className="mr-2" fill={exercise.isFavorited ? 'currentColor' : 'none'} />
              {exercise.isFavorited ? 'Favorited' : 'Add to Favorites'}
            </button>

            <button
              onClick={() => onAddToCollection?.(exercise.id)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Add to Collection
            </button>

            <button className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 size={16} />
            </button>
          </div>

          {/* Exercise Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercise Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Body Parts</div>
                  <div className="font-medium capitalize">{exercise.bodyParts.join(', ')}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Dumbbell size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Equipment</div>
                  <div className="font-medium capitalize">{exercise.equipments.join(', ')}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target size={18} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Primary Muscles</div>
                  <div className="font-medium capitalize">{exercise.targetMuscles.join(', ')}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock size={18} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Usage</div>
                  <div className="font-medium">{exercise.usageCount || 0} times</div>
                </div>
              </div>
            </div>

            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-2">Secondary Muscles</div>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondaryMuscles.map(muscle => (
                    <span
                      key={muscle}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full capitalize"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions & Information Section */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'instructions'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Instructions
                </button>
                <button
                  onClick={() => setActiveTab('tips')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'tips'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tips & Form
                </button>
                <button
                  onClick={() => setActiveTab('variations')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'variations'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Variations
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'instructions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Step-by-Step Instructions</h3>
                    {completedSteps.length > 0 && (
                      <button
                        onClick={resetSteps}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        <RotateCcw size={14} className="mr-1" />
                        Reset
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {exercise.instructions.map((instruction, index) => {
                      const isCompleted = completedSteps.includes(index)
                      const stepNumber = instruction.match(/Step:(\d+)/)?.[1]
                      const stepText = instruction.replace(/Step:\d+\s*/, '')
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleStep(index)}
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle size={16} />
                            ) : (
                              stepNumber || index + 1
                            )}
                          </div>
                          <div className={`flex-1 ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                            <p className={isCompleted ? 'line-through' : ''}>{stepText}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Info size={16} className="text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Progress</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-blue-600 mb-1">
                        <span>Completed Steps</span>
                        <span>{completedSteps.length} / {exercise.instructions.length}</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(completedSteps.length / exercise.instructions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tips' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Form Tips & Common Mistakes</h3>
                  
                  <div className="space-y-4">
                    {tips.map((tip, index) => (
                      <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">{tip.title}</h4>
                        <p className="text-yellow-700 text-sm">{tip.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'variations' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Exercise Variations</h3>
                  
                  <div className="space-y-3">
                    {variations.map((variation, index) => (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{variation.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            variation.difficulty === 'Beginner'
                              ? 'bg-green-100 text-green-800'
                              : variation.difficulty === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {variation.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{variation.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Exercises */}
      <div className="mt-12">
        <RelatedExercises
          currentExercise={exercise}
          onExerciseClick={(exercise) => {
            // This would navigate to the new exercise
            console.log('Navigate to exercise:', exercise.id)
          }}
        />
      </div>
    </div>
  )
}