// Core exercise data structure matching ExerciseDB format
export interface Exercise {
  id: string // Generated UUID for database
  exerciseId: string // Original exerciseDB identifier (matches GIF filename)
  name: string
  gifUrl: string // GIF filename
  targetMuscles: string[] // Primary muscles worked
  bodyParts: string[] // Body parts targeted
  equipments: string[] // Required equipment
  secondaryMuscles: string[] // Secondary muscles worked
  instructions: string[] // Step-by-step instructions
  createdAt?: string
  updatedAt?: string
}

// Enhanced exercise data with user-specific features
export interface ExerciseWithUserData extends Exercise {
  isFavorited?: boolean
  usageCount?: number
  lastUsed?: string
  collections?: string[] // IDs of collections containing this exercise
}

// Exercise filtering and search
export interface ExerciseFilters {
  bodyParts: string[]
  equipments: string[]
  targetMuscles: string[]
  search: string
  collections?: string[]
  favorites?: boolean
}

// Exercise collections for organization
export interface ExerciseCollection {
  id: string
  name: string
  description: string
  userId: string
  exerciseIds: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Exercise usage tracking
export interface ExerciseUsage {
  id: string
  userId: string
  exerciseId: string
  context: 'program' | 'workout' | 'viewed' | 'favorited'
  usedAt: string
}

// Exercise search history
export interface ExerciseSearchHistory {
  id: string
  userId: string
  query: string
  filters: ExerciseFilters
  resultCount: number
  searchedAt: string
}

// Exercise favorites
export interface ExerciseFavorite {
  id: string
  userId: string
  exerciseId: string
  favoritedAt: string
}

// Filter options for UI
export interface FilterOptions {
  bodyParts: string[]
  equipments: string[]
  targetMuscles: string[]
  secondaryMuscles: string[]
}

// Search and filter state
export interface ExerciseSearchState {
  query: string
  filters: ExerciseFilters
  sortBy: 'name' | 'usage' | 'created' | 'favorited'
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list'
  pageSize: number
  currentPage: number
}

// Exercise list response from API
export interface ExerciseListResponse {
  exercises: ExerciseWithUserData[]
  totalCount: number
  page: number
  pageSize: number
  hasNextPage: boolean
  filters: FilterOptions
}