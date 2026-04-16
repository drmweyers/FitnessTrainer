'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AIWorkoutBuilder from '@/components/features/AIWorkoutBuilder/AIWorkoutBuilder'

export default function WorkoutBuilderPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      window.location.replace('/auth/login')
      return
    }
    if (user.role === 'client') {
      window.location.replace('/workouts')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (user?.role === 'client') return null

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">AI Workout Builder</h1>
          <p className="text-gray-600">Create personalized workouts using AI powered by our extensive exercise database</p>
        </div>

        <AIWorkoutBuilder />
      </div>
  )
}
