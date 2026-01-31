// src/components/features/levels/LevelList.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/shared/Button'
import LevelCard from '@/components/features/Levels/LevelCard'

interface Level {
  id: string
  name: string
  description: string
  numChallenges: number
  thumbnailUrl: string
}

interface LevelListProps {
  levels: Level[]
  isLoading: boolean
}

export default function LevelList({ levels, isLoading }: LevelListProps) {
  if (isLoading) {
    return <div>Loading levels...</div>
  }
  
  if (levels.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No levels found</h3>
        <p className="text-gray-500 mt-2">Create your first level to get started</p>
        <Link href="/levels/add" className="mt-4 inline-block">
          <Button>Create Level</Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {levels.map(level => (
        <LevelCard key={level.id} level={level} />
      ))}
    </div>
  )
}