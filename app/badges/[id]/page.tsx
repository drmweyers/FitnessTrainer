'use client'

import { useState, useCallback } from 'react'
import BadgeList from '@/components/features/Badges/BadgeList'
import { useToast } from '@/components/shared'
import { Card } from '@/components/shared'
import Link from 'next/link'
import { PlusCircle, Award } from 'lucide-react'
import Layout from '@/components/layout/Layout'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  status: 'active' | 'inactive'
}

const MOCK_BADGES: Badge[] = [
  { 
    id: '1',
    name: 'First Workout',
    description: 'Complete your first workout',
    icon: '🏋️',
    category: 'Achievement',
    points: 100,
    status: 'active'
  },
  { 
    id: '2',
    name: 'Consistency King',
    description: 'Complete workouts for 7 consecutive days',
    icon: '👑',
    category: 'Streak',
    points: 500,
    status: 'active'
  },
  { 
    id: '3',
    name: 'Nutrition Master',
    description: 'Follow a meal plan for 30 days',
    icon: '🥗',
    category: 'Nutrition',
    points: 1000,
    status: 'active'
  },
  { 
    id: '4',
    name: 'Strength Milestone',
    description: 'Lift 100kg in any exercise',
    icon: '💪',
    category: 'Strength',
    points: 750,
    status: 'active'
  },
  { 
    id: '5',
    name: 'Early Bird',
    description: 'Complete 5 workouts before 7am',
    icon: '🌅',
    category: 'Lifestyle',
    points: 300,
    status: 'inactive'
  },
]

export default function BadgesPage() {
  const { toast } = useToast()
  const [badges, setBadges] = useState<Badge[]>(MOCK_BADGES)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setBadges(prev => prev.filter(badge => badge.id !== id))
      
      toast({
        title: 'Success',
        description: 'Badge deleted successfully'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete badge'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <span className="text-lg">⚠️</span> {error}
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      )
    }

    if (!badges.length) {
      return (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first badge.</p>
          <Link 
            href="/badges/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Badge
          </Link>
        </div>
      )
    }

    return (
      <BadgeList 
        badges={badges} 
        isLoading={isLoading} 
        onDelete={handleDelete}
      />
    )
  }
  
  return (
    <Layout>
      <main className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Badges</h1>
            <p className="text-gray-600">Manage achievement badges for users</p>
          </div>
          {badges.length > 0 && (
            <Link
              href="/badges/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Badge
            </Link>
          )}
        </div>

        <Card className="overflow-hidden">
          {badges.length > 0 && (
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium">All Badges</h2>
              <div className="text-sm text-gray-500">
                {badges.length} {badges.length === 1 ? 'badge' : 'badges'} total
              </div>
            </div>
          )}

          <div className="p-4">
            {renderContent()}
          </div>
        </Card>
      </main>
    </Layout>
  )
}