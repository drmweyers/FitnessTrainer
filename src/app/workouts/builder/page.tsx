'use client'

import Layout from '@/components/layout/Layout'
import AIWorkoutBuilder from '@/components/features/AIWorkoutBuilder/AIWorkoutBuilder'

export default function WorkoutBuilderPage() {
  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">AI Workout Builder</h1>
          <p className="text-gray-600">Create personalized workouts using AI powered by our extensive exercise database</p>
        </div>

        <AIWorkoutBuilder />
      </div>
    </Layout>
  )
}
