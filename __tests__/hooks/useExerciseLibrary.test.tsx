/**
 * @jest-environment jsdom
 *
 * Tests for useExerciseLibrary hook
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock global fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

function mockResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response)
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// Import hook after mocks are set up
import { useExerciseLibrary } from '@/components/features/ProgramBuilder/useExerciseLibrary'

const FILTERS_RESPONSE = {
  targetMuscles: ['chest', 'back', 'legs'],
  equipments: ['barbell', 'dumbbell', 'bodyweight'],
}

const EXERCISES_PAGE_1 = {
  exercises: [
    { id: '1', exerciseId: 'ex-1', name: 'Bench Press', gifUrl: '', bodyPart: 'chest', equipment: 'barbell', targetMuscle: 'pectorals', secondaryMuscles: [], instructions: [], difficulty: 'intermediate', isActive: true, createdAt: new Date(), updatedAt: null },
    { id: '2', exerciseId: 'ex-2', name: 'Squat', gifUrl: '', bodyPart: 'legs', equipment: 'barbell', targetMuscle: 'quads', secondaryMuscles: [], instructions: [], difficulty: 'intermediate', isActive: true, createdAt: new Date(), updatedAt: null },
  ],
  pagination: { total: 5, page: 1, limit: 30, totalPages: 1 },
}

const EXERCISES_PAGE_2 = {
  exercises: [
    { id: '3', exerciseId: 'ex-3', name: 'Row', gifUrl: '', bodyPart: 'back', equipment: 'barbell', targetMuscle: 'lats', secondaryMuscles: [], instructions: [], difficulty: 'intermediate', isActive: true, createdAt: new Date(), updatedAt: null },
  ],
  pagination: { total: 3, page: 2, limit: 2, totalPages: 2 },
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  // Default: filters + exercises
  mockFetch.mockImplementation((url: RequestInfo | URL) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    if (urlStr.includes('/api/exercises/filters')) {
      return mockResponse(FILTERS_RESPONSE)
    }
    if (urlStr.includes('/api/exercises/favorites')) {
      return mockResponse({ data: [] })
    }
    if (urlStr.includes('/api/exercises/collections')) {
      return mockResponse({ data: [] })
    }
    if (urlStr.includes('/api/exercises')) {
      return mockResponse(EXERCISES_PAGE_1)
    }
    return mockResponse({})
  })
})

// ─── Default query ─────────────────────────────────────────────────────────────

describe('useExerciseLibrary — default query', () => {
  it('returns exercises from GET /api/exercises on initial load', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.exercises).toHaveLength(2)
    expect(result.current.exercises[0].name).toBe('Bench Press')
  })

  it('starts with tab=all, no filters, no search', () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    expect(result.current.tab).toBe('all')
    expect(result.current.search).toBe('')
    expect(result.current.muscleGroup).toBeNull()
    expect(result.current.equipment).toBeNull()
    expect(result.current.hasVideo).toBe(false)
  })

  it('loads filter options from /api/exercises/filters', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.filters.muscleGroups.length).toBeGreaterThan(0))
    expect(result.current.filters.muscleGroups).toContain('chest')
    expect(result.current.filters.equipment).toContain('barbell')
  })

  it('reports no error on successful fetch', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
  })
})

// ─── Search debouncing ─────────────────────────────────────────────────────────

describe('useExerciseLibrary — search debouncing', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does not fire a new query immediately when search changes', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    // Wait for initial load
    jest.runAllTimers()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const callCountBefore = mockFetch.mock.calls.filter(c => {
      const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
      return url?.includes('/api/exercises?')
    }).length

    act(() => {
      result.current.setSearch('bench')
    })

    // Immediately after — debounce has not fired yet, so count should not have increased yet
    const callCountAfter = mockFetch.mock.calls.filter(c => {
      const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
      return url?.includes('search=bench')
    }).length
    expect(callCountAfter).toBe(0)
  })

  it('fires new query with search term after 250ms debounce', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    jest.runAllTimers()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setSearch('squat')
    })

    // Advance past debounce
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(c => {
        const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
        return url?.includes('search=squat')
      })
      expect(calls.length).toBeGreaterThan(0)
    })
  })
})

// ─── Filter change ─────────────────────────────────────────────────────────────

describe('useExerciseLibrary — filter change triggers new query', () => {
  it('includes muscleGroup in query when set', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setMuscleGroup('chest')
    })

    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(c => {
        const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
        return url?.includes('targetMuscle=chest')
      })
      expect(calls.length).toBeGreaterThan(0)
    })
  })

  it('includes equipment in query when set', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setEquipment('barbell')
    })

    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(c => {
        const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
        return url?.includes('equipment=barbell')
      })
      expect(calls.length).toBeGreaterThan(0)
    })
  })
})

// ─── Pagination ────────────────────────────────────────────────────────────────

describe('useExerciseLibrary — pagination via loadMore', () => {
  it('exposes hasMore=true when not all results have loaded (total=5, loaded=2)', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // EXERCISES_PAGE_1 has total=5, page 1 returned 2 items → 2 < 5 → hasMore=true
    expect(result.current.hasMore).toBe(true)
  })

  it('loadMore fetches next page when hasMore=true', async () => {
    // Override to simulate paginated results
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/exercises/filters')) return mockResponse(FILTERS_RESPONSE)
      if (urlStr.includes('/api/exercises')) {
        if (urlStr.includes('page=2')) return mockResponse(EXERCISES_PAGE_2)
        // First page: total=3, PAGE_SIZE=30 but limit=30 and we return 2 so hasMore=true
        return mockResponse({
          exercises: EXERCISES_PAGE_1.exercises,
          pagination: { total: 3, page: 1, limit: 2, totalPages: 2 },
        })
      }
      return mockResponse({})
    })

    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // First page returned 2 items, total=3 so hasMore should be true
    // (total=3, page 1 has 2 items, 1+2=3 < 3 is false, but page*limit < total: 1*2 < 3 → yes)
    // Actually our hook: offset=0, 0+2 < 3 → hasMore=true
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      const page2Calls = mockFetch.mock.calls.filter(c => {
        const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
        return url?.includes('page=2')
      })
      expect(page2Calls.length).toBeGreaterThan(0)
    })
  })
})

// ─── Tab switching ────────────────────────────────────────────────────────────

describe('useExerciseLibrary — tab switching', () => {
  it('calls /api/exercises/favorites when tab=favorites', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setTab('favorites')
    })

    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(c => {
        const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
        return url?.includes('/api/exercises/favorites')
      })
      expect(calls.length).toBeGreaterThan(0)
    })
  })

  it('calls /api/exercises/collections when tab=collections', async () => {
    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setTab('collections')
    })

    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(c => {
        const url = typeof c[0] === 'string' ? c[0] : c[0]?.toString()
        return url?.includes('/api/exercises/collections')
      })
      expect(calls.length).toBeGreaterThan(0)
    })
  })
})

// ─── Error handling ────────────────────────────────────────────────────────────

describe('useExerciseLibrary — error handling', () => {
  it('returns error when fetch fails with 401', async () => {
    mockFetch.mockImplementation((url: RequestInfo | URL) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/exercises/filters')) return mockResponse(FILTERS_RESPONSE)
      if (urlStr.includes('/api/exercises')) return mockResponse({ error: 'Unauthorized' }, 401)
      return mockResponse({})
    })

    const { result } = renderHook(() => useExerciseLibrary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 3000 })
    expect(result.current.error?.message).toContain('Unauthorized')
  })
})
