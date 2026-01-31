'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import BadgeList from '@/components/BadgeList'
import { useToast } from '@/components/shared'
import { Card } from '@/components/shared'
import Link from 'next/link'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Badge } from '@/types/badge'

const MOCK_BADGES: Badge[] = [
  { 
    id: '1',
    name: 'First Workout',
    description: 'Complete your first workout',
    imageUrl: '/badges/first-workout.png',
    category: 'Achievement',
    points: 100,
    status: 'active'
  },
  { 
    id: '2',
    name: 'Consistency King',
    description: 'Complete workouts for 7 consecutive days',
    imageUrl: '/badges/consistency-king.png',
    category: 'Streak',
    points: 500,
    status: 'active'
  },
  { 
    id: '3',
    name: 'Nutrition Master',
    description: 'Follow a meal plan for 30 days',
    imageUrl: '/badges/nutrition-master.png',
    category: 'Nutrition',
    points: 1000,
    status: 'active'
  },
  { 
    id: '4',
    name: 'Strength Milestone',
    description: 'Lift 100kg in any exercise',
    imageUrl: '/badges/strength-milestone.png',
    category: 'Strength',
    points: 750,
    status: 'active'
  },
  { 
    id: '5',
    name: 'Early Bird',
    description: 'Complete 5 workouts before 7am',
    imageUrl: '/badges/early-bird.png',
    category: 'Lifestyle',
    points: 300,
    status: 'inactive'
  },
]

export default function BadgesPage() {
  const { toast } = useToast()
  const [badges, setBadges] = useState<Badge[]>(MOCK_BADGES)
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) return
    
    try {
      // Simulate API call delay
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setBadges(prev => prev.filter(badge => badge.id !== id))
      
      toast({
        title: 'Success',
        description: 'Badge deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete badge',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Badges</h1>
          <p className="text-gray-600">Manage achievement badges for users</p>
        </div>
        
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium">All Badges</h2>
            <Link 
              href="/badges/add" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Badge
            </Link>
          </div>
          
          <div className="p-4">
            {isMobile ? (
              <BadgeList.Mobile 
                badges={badges} 
                isLoading={isLoading} 
                onDelete={handleDelete}
              />
            ) : (
              <BadgeList.Desktop 
                badges={badges} 
                isLoading={isLoading} 
                onDelete={handleDelete}
              />
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}