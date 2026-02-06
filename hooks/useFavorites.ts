'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExerciseFavorite } from '@/types/exercise'

interface UseFavoritesOptions {
  autoSync?: boolean
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

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export function useFavorites(options: UseFavoritesOptions = {}): UseFavoritesReturn {
  const { autoSync = true } = options

  const [favorites, setFavorites] = useState<ExerciseFavorite[]>([])
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/exercises/favorites', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setFavorites([])
          setFavoriteExerciseIds(new Set())
          return
        }
        throw new Error('Failed to fetch favorites')
      }

      const result = await response.json()
      const data = result.data || []
      const mapped: ExerciseFavorite[] = data.map((fav: any) => ({
        id: fav.id,
        userId: fav.userId,
        exerciseId: fav.exerciseId,
        favoritedAt: fav.favoritedAt,
      }))

      setFavorites(mapped)
      setFavoriteExerciseIds(new Set(mapped.map(f => f.exerciseId)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoSync) {
      loadFavorites()
    }
  }, [autoSync, loadFavorites])

  const addFavorite = useCallback(async (exerciseId: string) => {
    try {
      setError(null)
      const response = await fetch('/api/exercises/favorites', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ exerciseId }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add favorite')
      }

      const fav: ExerciseFavorite = {
        id: result.data.id,
        userId: result.data.userId,
        exerciseId: result.data.exerciseId,
        favoritedAt: result.data.favoritedAt,
      }

      setFavorites(prev => [...prev, fav])
      setFavoriteExerciseIds(prev => new Set([...prev, exerciseId]))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const removeFavorite = useCallback(async (exerciseId: string) => {
    try {
      setError(null)
      const response = await fetch('/api/exercises/favorites', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ exerciseId }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove favorite')
      }

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

  const toggleFavorite = useCallback(async (exerciseId: string) => {
    if (favoriteExerciseIds.has(exerciseId)) {
      await removeFavorite(exerciseId)
    } else {
      await addFavorite(exerciseId)
    }
  }, [favoriteExerciseIds, addFavorite, removeFavorite])

  const isFavorited = useCallback((exerciseId: string) => {
    return favoriteExerciseIds.has(exerciseId)
  }, [favoriteExerciseIds])

  const clearFavorites = useCallback(async () => {
    try {
      setError(null)
      await Promise.all(
        favorites.map(fav =>
          fetch('/api/exercises/favorites', {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ exerciseId: fav.exerciseId }),
          })
        )
      )
      setFavorites([])
      setFavoriteExerciseIds(new Set())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear favorites'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [favorites])

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
    refreshFavorites,
  }
}
