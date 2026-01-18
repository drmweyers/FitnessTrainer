// src/app/levels/page.tsx
'use client'

import { useState, useEffect } from 'react'
import LevelList from '@/components/features/Levels/LevelList'
import { useToast } from '@/components/shared'
import Link from 'next/link'
import { Card } from '@/components/shared'
import Layout from '@/components/layout/Layout'

export default function LevelsPage() {
  const { toast } = useToast()
  const [levels, setLevels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchLevels = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/levels')
        const data = await response.json()
        setLevels(data.data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch levels',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLevels()
  }, [toast])
  
  return (
    <Layout>
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Levels</h1>
            <p className="text-gray-600">Manage progression levels for users</p>
          </div>
          
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium">All Levels</h2>
              <Link 
                href="/levels/add" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Level
              </Link>
            </div>
            
            <div className="p-4">
              <LevelList levels={levels} isLoading={isLoading} />
            </div>
          </Card>
        </main>
      </Layout>
  )
}