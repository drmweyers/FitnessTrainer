// src/components/features/levels/LevelDetail.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'
import { useToast } from '@/components/shared/use-toast'

interface Level {
  id: string
  name: string
  description: string
  numChallenges: number
  thumbnailUrl: string
}

interface LevelDetailProps {
  level: Level
}

export default function LevelDetail({ level }: LevelDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/levels/${level.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete level')
      
      toast({
        title: 'Success',
        description: 'Level deleted successfully',
      })
      
      router.push('/levels')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete level',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        {level.thumbnailUrl && (
          <img 
            src={level.thumbnailUrl} 
            alt={level.name} 
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{level.name}</h1>
          <p className="text-gray-500">Challenges required: {level.numChallenges}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-2">Description</h2>
        <p>{level.description}</p>
      </div>
      
      <div className="flex justify-between">
        <Link href="/levels">
          <Button variant="outline">Back to Levels</Button>
        </Link>
        
        <div className="space-x-2">
          <Link href={`/levels/${level.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Confirm Deletion</h3>
            <p className="mb-4">
              Are you sure you want to delete the level "{level.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}