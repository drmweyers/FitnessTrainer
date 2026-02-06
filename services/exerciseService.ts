'use client'

import { ExerciseWithUserData, ExerciseFilters, FilterOptions } from '@/types/exercise'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Transform backend exercise data to frontend format with user data
const transformExercise = (backendExercise: any): ExerciseWithUserData => ({
  id: backendExercise.id,
  exerciseId: backendExercise.exerciseId,
  name: backendExercise.name,
  gifUrl: backendExercise.gifUrl,
  targetMuscles: [backendExercise.targetMuscle], // Convert single to array
  bodyParts: [backendExercise.bodyPart], // Convert single to array
  equipments: [backendExercise.equipment], // Convert single to array
  secondaryMuscles: backendExercise.secondaryMuscles || [],
  instructions: backendExercise.instructions || [],
  createdAt: backendExercise.createdAt,
  updatedAt: backendExercise.updatedAt,
  // Add default user data - these will be populated when we implement favorites/collections
  isFavorited: false,
  usageCount: 0,
  lastUsed: undefined,
  collections: []
})

// Load exercises from the API
export const loadExercises = async (): Promise<ExerciseWithUserData[]> => {
  try {
    // Load all exercises from the API
    const response = await fetch(`${API_BASE_URL}/exercises?limit=1324`)
    if (!response.ok) {
      throw new Error(`Failed to load exercises: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'API returned error')
    }
    
    // Transform backend exercises to frontend format
    return data.data.exercises.map(transformExercise)
  } catch (error) {
    console.error('Error loading exercises:', error)
    // Return empty array as fallback
    return []
  }
}

// Get filter options from the API
export const getFilterOptions = async (): Promise<FilterOptions> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/filters`)
    if (!response.ok) {
      throw new Error(`Failed to load filters: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      bodyParts: data.bodyParts || [],
      equipments: data.equipments || [],
      targetMuscles: data.targetMuscles || [],
      secondaryMuscles: [] // Backend doesn't provide this aggregated data
    }
  } catch (error) {
    console.error('Error loading filter options:', error)
    // Return empty arrays as fallback
    return {
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      secondaryMuscles: []
    }
  }
}

// Get exercise by ID
export const getExerciseById = async (exerciseId: string): Promise<ExerciseWithUserData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/${exerciseId}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null // Exercise not found
      }
      throw new Error(`Failed to load exercise: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'API returned error')
    }
    
    return transformExercise(data.data)
  } catch (error) {
    console.error('Error loading exercise:', error)
    return null
  }
}

// Search and filter exercises using API
export const searchExercises = async (
  filters: ExerciseFilters,
  page = 1,
  pageSize = 20
): Promise<{
  exercises: ExerciseWithUserData[]
  totalCount: number
  hasNextPage: boolean
}> => {
  try {
    // Build query parameters
    const params = new URLSearchParams()
    params.set('limit', pageSize.toString())
    params.set('offset', ((page - 1) * pageSize).toString())
    
    // Add search term
    if (filters.search && filters.search.trim()) {
      params.set('search', filters.search.trim())
    }
    
    // Add filters (send comma-separated for multi-select)
    if (filters.bodyParts.length > 0) {
      params.set('bodyPart', filters.bodyParts.join(','))
    }

    if (filters.equipments.length > 0) {
      params.set('equipment', filters.equipments.join(','))
    }

    if (filters.targetMuscles.length > 0) {
      params.set('targetMuscle', filters.targetMuscles.join(','))
    }
    
    const response = await fetch(`${API_BASE_URL}/exercises?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to search exercises: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'API returned error')
    }
    
    return {
      exercises: data.data.exercises.map(transformExercise),
      totalCount: data.data.pagination.total,
      hasNextPage: data.data.pagination.hasMore
    }
  } catch (error) {
    console.error('Error searching exercises:', error)
    return {
      exercises: [],
      totalCount: 0,
      hasNextPage: false
    }
  }
}

// Get exercises by IDs (for collections) - uses individual API calls
export const getExercisesByIds = async (exerciseIds: string[]): Promise<ExerciseWithUserData[]> => {
  const exercises = await Promise.all(
    exerciseIds.map(async (id) => {
      const exercise = await getExerciseById(id)
      return exercise
    })
  )
  return exercises.filter(exercise => exercise !== null) as ExerciseWithUserData[]
}

// Get popular exercises using API search
export const getPopularExercises = async (limit = 10): Promise<ExerciseWithUserData[]> => {
  // Mock popularity by searching for common exercises
  const popularKeywords = ['push', 'squat', 'pull', 'plank', 'press']
  
  try {
    for (const keyword of popularKeywords) {
      const result = await searchExercises({ 
        search: keyword, 
        bodyParts: [], 
        equipments: [], 
        targetMuscles: [] 
      }, 1, limit)
      
      if (result.exercises.length >= limit) {
        return result.exercises.slice(0, limit)
      }
    }
    
    // Fallback: get first exercises
    const result = await searchExercises({ 
      search: '', 
      bodyParts: [], 
      equipments: [], 
      targetMuscles: [] 
    }, 1, limit)
    return result.exercises
  } catch (error) {
    console.error('Error getting popular exercises:', error)
    return []
  }
}

// Get exercises by body part using API
export const getExercisesByBodyPart = async (bodyPart: string, limit = 20): Promise<ExerciseWithUserData[]> => {
  const result = await searchExercises({
    search: '',
    bodyParts: [bodyPart],
    equipments: [],
    targetMuscles: []
  }, 1, limit)
  return result.exercises
}

// Get exercises by equipment using API
export const getExercisesByEquipment = async (equipment: string, limit = 20): Promise<ExerciseWithUserData[]> => {
  const result = await searchExercises({
    search: '',
    bodyParts: [],
    equipments: [equipment],
    targetMuscles: []
  }, 1, limit)
  return result.exercises
}

// Get random exercises using API
export const getRandomExercises = async (count = 6): Promise<ExerciseWithUserData[]> => {
  // Get a random page of exercises as a simple randomization
  const randomPage = Math.floor(Math.random() * 10) + 1
  const result = await searchExercises({
    search: '',
    bodyParts: [],
    equipments: [],
    targetMuscles: []
  }, randomPage, count)
  return result.exercises
}