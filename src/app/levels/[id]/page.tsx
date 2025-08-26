// src/app/levels/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import LevelDetail from '@/components/features/Levels/LevelDetail'
import { useToast } from '@/components/shared/use-toast'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function LevelDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const [level, setLevel] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchLevel = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/levels/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Level not found')
        }
        
        const data = await response.json()
        setLevel(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch level',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLevel()
  }, [params.id, toast])
  
  if (isLoading) return <div>Loading...</div>
  if (!level) return <div>Level not found</div>
  
  return (
    <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    
    <div className="flex-1 ml-60">
      <Header />
      
      <main className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Level {params.id}</h1>
        </div>
        <LevelDetail level={level} />   
      </main>
    </div>
    </div>
  
  )
}