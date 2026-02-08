'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory'
import { Dumbbell, Plus, Clock, TrendingUp, History } from 'lucide-react'
import Link from 'next/link'

export default function WorkoutsPage() {
  const router = useRouter()
  const [activeWorkouts, setActiveWorkouts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActiveWorkouts = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const res = await fetch('/api/workouts/active', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const result = await res.json()
          if (result.success && result.data) {
            setActiveWorkouts(Array.isArray(result.data) ? result.data : [])
          }
        }
      } catch (err) {
        console.error('Failed to load active workouts:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveWorkouts()
  }, [router])

  return (
    <Layout breadcrumbItems={[{ label: "Workouts", href: "/workouts" }]}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
            <p className="text-gray-600 mt-1">Track, build, and review your workout sessions</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/workouts/builder"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              New Workout
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/workouts/builder"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <Dumbbell size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Workout Builder</p>
              <p className="text-sm text-gray-500">Create a custom workout</p>
            </div>
          </Link>

          <Link
            href="/workouts/history"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <History size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Full History</p>
              <p className="text-sm text-gray-500">View all past sessions</p>
            </div>
          </Link>

          <Link
            href="/workouts/progress"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Progress</p>
              <p className="text-sm text-gray-500">Track your improvements</p>
            </div>
          </Link>
        </div>

        {/* Active Workouts */}
        {!isLoading && activeWorkouts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-yellow-600" />
              Active Workouts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workouts/${workout.id}`}
                  className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {workout.programWorkout?.name || 'In Progress Workout'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Started {new Date(workout.startTime).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                      In Progress
                    </span>
                  </div>
                  {workout.completedSets !== undefined && (
                    <div className="mt-3 flex gap-4 text-sm text-gray-600">
                      <span>{workout.completedSets}/{workout.totalSets || '?'} sets</span>
                      {workout.totalVolume > 0 && <span>{workout.totalVolume} lbs volume</span>}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Workout History */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Workouts</h2>
          <WorkoutHistory limit={5} />
        </div>
      </div>
    </Layout>
  )
}
