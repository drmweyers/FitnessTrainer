// src/components/features/levels/LevelCard.tsx
'use client'

import Link from 'next/link'
import { Card } from '@/components/shared/Card'

interface Level {
  id: string
  name: string
  description: string
  numChallenges: number
  thumbnailUrl: string
}

interface LevelCardProps {
  level: Level
}

export default function LevelCard({ level }: LevelCardProps) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {level.thumbnailUrl && (
            <img 
              src={level.thumbnailUrl} 
              alt={level.name} 
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div>
            <Card.Title>{level.name}</Card.Title>
            <Card.Description className="line-clamp-2">
              {level.description}
            </Card.Description>
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="font-medium">Challenges:</span> {level.numChallenges}
        </div>
      </div>
      
      <Card.Footer className="flex justify-between">
        <Link href={`/levels/${level.id}`} className="text-blue-600 hover:underline">
          View
        </Link>
        <Link href={`/levels/${level.id}/edit`} className="text-amber-600 hover:underline">
          Edit
        </Link>
      </Card.Footer>
    </Card>
  )
}