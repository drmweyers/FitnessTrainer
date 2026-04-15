'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Exercise } from '@/lib/types/exercise'

// Re-export for components that need the library item shape
export type LibraryExercise = Exercise

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExerciseLibraryTab = 'all' | 'favorites' | 'collections'
type Tab = ExerciseLibraryTab

export interface ExerciseLibraryFilters {
  muscleGroups: string[]
  equipment: string[]
}

export interface UseExerciseLibraryReturn {
  search: string
  setSearch: (_s: string) => void
  muscleGroup: string | null
  setMuscleGroup: (_m: string | null) => void
  equipment: string | null
  setEquipment: (_e: string | null) => void
  hasVideo: boolean
  setHasVideo: (_v: boolean) => void
  tab: Tab
  setTab: (_t: Tab) => void
  exercises: Exercise[]
  isLoading: boolean
  error: Error | null
  filters: ExerciseLibraryFilters
  hasMore: boolean
  loadMore: () => void
}

const PAGE_SIZE = 30

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

async function fetchExercisePage(
  search: string,
  muscleGroup: string | null,
  equipment: string | null,
  tab: Tab,
  page: number,
): Promise<{ exercises: Exercise[]; hasMore: boolean }> {
  if (tab === 'favorites') {
    const res = await fetch('/api/exercises/favorites', { headers: getAuthHeaders() })
    if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
    if (!res.ok) throw new Error('Failed to fetch favorites')
    const json = await res.json()
    // API returns ExerciseFavorite[] with nested exercise — unwrap to Exercise[]
    const raw: any[] = json.data ?? json.exercises ?? []
    const all: Exercise[] = raw.map((item) => item.exercise ?? item).filter(Boolean)
    // Favorites endpoint returns all; do client-side pagination
    const offset = (page - 1) * PAGE_SIZE
    const slice = all.slice(offset, offset + PAGE_SIZE)
    return { exercises: slice, hasMore: offset + PAGE_SIZE < all.length }
  }

  if (tab === 'collections') {
    const res = await fetch('/api/exercises/collections', { headers: getAuthHeaders() })
    if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
    if (!res.ok) throw new Error('Failed to fetch collections')
    const json = await res.json()
    // Collections endpoint returns collection objects; flatten exercise IDs
    // The exercises within collections are referenced by ID only — return empty for now;
    // Stream C renders the full collection browser separately.
    const exercises: Exercise[] = json.data ?? []
    return { exercises, hasMore: false }
  }

  // Default: GET /api/exercises
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (muscleGroup) params.set('targetMuscle', muscleGroup)
  if (equipment) params.set('equipment', equipment)
  params.set('limit', String(PAGE_SIZE))
  params.set('page', String(page))

  const res = await fetch(`/api/exercises?${params.toString()}`, { headers: getAuthHeaders() })
  if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  if (!res.ok) throw new Error('Failed to fetch exercises')
  const json = await res.json()

  const exercises: Exercise[] = json.exercises ?? json.data ?? []
  const pagination = json.pagination ?? {}
  const total: number = pagination.total ?? exercises.length
  const hasMore = (page - 1) * PAGE_SIZE + exercises.length < total

  return { exercises, hasMore }
}

async function fetchFilters(): Promise<ExerciseLibraryFilters> {
  const res = await fetch('/api/exercises/filters', { headers: getAuthHeaders() })
  if (!res.ok) return { muscleGroups: [], equipment: [] }
  const json = await res.json()
  return {
    muscleGroups: json.targetMuscles ?? json.muscleGroups ?? [],
    equipment: json.equipments ?? json.equipment ?? [],
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExerciseLibrary(): UseExerciseLibraryReturn {
  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null)
  const [equipment, setEquipment] = useState<string | null>(null)
  const [hasVideo, setHasVideo] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)
  const [accumulatedExercises, setAccumulatedExercises] = useState<Exercise[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input at 250ms
  const setSearch = useCallback((s: string) => {
    setSearchRaw(s)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(s)
      setPage(1)
      setAccumulatedExercises([])
    }, 250)
  }, [])

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1)
    setAccumulatedExercises([])
  }, [muscleGroup, equipment, hasVideo, tab])

  // Fetch filter options (cached forever)
  const { data: filtersData } = useQuery({
    queryKey: ['exercises', 'filters'],
    queryFn: fetchFilters,
    staleTime: Infinity,
  })

  // Fetch current page of exercises
  const queryKey = ['exercises', { search: debouncedSearch, muscleGroup, equipment, hasVideo, tab, page }] as const

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchExercisePage(debouncedSearch, muscleGroup, equipment, tab, page),
    staleTime: 60_000,
    retry: (failureCount, err: unknown) => {
      if (err instanceof Error && (err as any).status === 401) return false
      return failureCount < 2
    },
  })

  // Accumulate exercises across pages
  useEffect(() => {
    if (!data) return
    if (page === 1) {
      setAccumulatedExercises(data.exercises)
    } else {
      setAccumulatedExercises(prev => [...prev, ...data.exercises])
    }
  }, [data, page])

  const loadMore = useCallback(() => {
    if (data?.hasMore) {
      setPage(p => p + 1)
    }
  }, [data?.hasMore])

  return {
    search,
    setSearch,
    muscleGroup,
    setMuscleGroup,
    equipment,
    setEquipment,
    hasVideo,
    setHasVideo,
    tab,
    setTab,
    exercises: accumulatedExercises,
    isLoading,
    error: error instanceof Error ? error : null,
    filters: filtersData ?? { muscleGroups: [], equipment: [] },
    hasMore: data?.hasMore ?? false,
    loadMore,
  }
}
