'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExerciseWithUserData, ExerciseFavorite } from '@/types/exercise'

interface UseFavoritesOptions {
  userId?: string
  autoSync?: boolean
  cacheKey?: string
}

interface UseFavoritesReturn {
  favorites: ExerciseFavorite[]
  favoriteExerciseIds: Set<string>
  isLoading: boolean
  error: string | null
  toggleFavorite: (exerciseId: string) => Promise<void>
  addFavorite: (exerciseId: string) => Promise<void>
  removeFavorite: (exerciseId: string) => Promise<void>
  isFavorited: (exerciseId: string) => boolean
  clearFavorites: () => Promise<void>
  refreshFavorites: () => Promise<void>
}

// Mock API functions - replace with actual API calls
const mockFavoritesApi = {
  async getFavorites(userId?: string): Promise<ExerciseFavorite[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get from localStorage for now
    const stored = localStorage.getItem('exercise-favorites')
    if (!stored) return []
    
    try {
      const favorites = JSON.parse(stored)
      return favorites.map((fav: any) => ({
        id: fav.id,
        userId: userId || 'current-user',
        exerciseId: fav.exerciseId,
        favoritedAt: fav.favoritedAt
      }))
    } catch {
      return []
    }
  },

  async addFavorite(exerciseId: string, userId?: string): Promise<ExerciseFavorite> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const favorite: ExerciseFavorite = {
      id: `fav-${Date.now()}`,
      userId: userId || 'current-user',
      exerciseId,
      favoritedAt: new Date().toISOString()
    }

    // Store in localStorage
    const stored = localStorage.getItem('exercise-favorites')
    const favorites = stored ? JSON.parse(stored) : []
    
    // Check if already exists
    const exists = favorites.some((fav: any) => fav.exerciseId === exerciseId)
    if (exists) {
      throw new Error('Exercise is already favorited')
    }

    favorites.push(favorite)
    localStorage.setItem('exercise-favorites', JSON.stringify(favorites))
    
    return favorite
  },

  async removeFavorite(exerciseId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const stored = localStorage.getItem('exercise-favorites')
    if (!stored) return
    
    const favorites = JSON.parse(stored)
    const filtered = favorites.filter((fav: any) => fav.exerciseId !== exerciseId)
    localStorage.setItem('exercise-favorites', JSON.stringify(filtered))
  },

  async clearFavorites(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    localStorage.removeItem('exercise-favorites')
  }
}

export function useFavorites(options: UseFavoritesOptions = {}): UseFavoritesReturn {
  const { userId, autoSync = true, cacheKey = 'exercise-favorites' } = options
  
  const [favorites, setFavorites] = useState<ExerciseFavorite[]>([])
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load favorites on mount
  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const userFavorites = await mockFavoritesApi.getFavorites(userId)
      setFavorites(userFavorites)
      
      const exerciseIds = new Set(userFavorites.map(fav => fav.exerciseId))
      setFavoriteExerciseIds(exerciseIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (autoSync) {
      loadFavorites()
    }
  }, [autoSync, loadFavorites])

  // Add favorite
  const addFavorite = useCallback(async (exerciseId: string) => {
    try {
      setError(null)
      
      const newFavorite = await mockFavoritesApi.addFavorite(exerciseId, userId)
      
      setFavorites(prev => [...prev, newFavorite])
      setFavoriteExerciseIds(prev => new Set([...prev, exerciseId]))
      
      // Show success feedback
      // You could dispatch a toast notification here
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Remove favorite
  const removeFavorite = useCallback(async (exerciseId: string) => {
    try {
      setError(null)
      
      await mockFavoritesApi.removeFavorite(exerciseId)
      
      setFavorites(prev => prev.filter(fav => fav.exerciseId !== exerciseId))
      setFavoriteExerciseIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(exerciseId)
        return newSet
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Toggle favorite
  const toggleFavorite = useCallback(async (exerciseId: string) => {
    if (favoriteExerciseIds.has(exerciseId)) {
      await removeFavorite(exerciseId)
    } else {
      await addFavorite(exerciseId)
    }
  }, [favoriteExerciseIds, addFavorite, removeFavorite])

  // Check if exercise is favorited
  const isFavorited = useCallback((exerciseId: string) => {
    return favoriteExerciseIds.has(exerciseId)
  }, [favoriteExerciseIds])

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    try {
      setError(null)
      
      await mockFavoritesApi.clearFavorites()
      
      setFavorites([])
      setFavoriteExerciseIds(new Set())
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear favorites'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Refresh favorites
  const refreshFavorites = useCallback(async () => {
    await loadFavorites()
  }, [loadFavorites])

  return {
    favorites,
    favoriteExerciseIds,
    isLoading,
    error,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isFavorited,
    clearFavorites,
    refreshFavorites
  }
}