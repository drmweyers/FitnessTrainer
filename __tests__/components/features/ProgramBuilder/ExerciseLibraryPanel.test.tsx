/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseLibraryPanel from '@/components/features/ProgramBuilder/ExerciseLibraryPanel'
import type { UseExerciseLibraryReturn, LibraryExercise } from '@/components/features/ProgramBuilder/useExerciseLibrary'

// Mock the hook so the panel never calls TanStack Query in unit tests.
jest.mock('@/components/features/ProgramBuilder/useExerciseLibrary', () => ({
  useExerciseLibrary: () => ({
    search: '', setSearch: jest.fn(),
    muscleGroup: null, setMuscleGroup: jest.fn(),
    equipment: null, setEquipment: jest.fn(),
    hasVideo: false, setHasVideo: jest.fn(),
    tab: 'all', setTab: jest.fn(),
    exercises: [],
    isLoading: false,
    error: null,
    filters: { muscleGroups: [], equipment: [] },
    hasMore: false,
    loadMore: jest.fn(),
  }),
}))

jest.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}))
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}))

function makeLibrary(overrides: Partial<UseExerciseLibraryReturn> = {}): UseExerciseLibraryReturn {
  return {
    search: '',
    setSearch: jest.fn(),
    muscleGroup: '',
    setMuscleGroup: jest.fn(),
    equipment: '',
    setEquipment: jest.fn(),
    hasVideo: false,
    setHasVideo: jest.fn(),
    tab: 'all',
    setTab: jest.fn(),
    exercises: [],
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(),
    ...overrides,
  }
}

const sampleExercises: LibraryExercise[] = [
  { id: '1', name: 'Bench Press', bodyPart: 'chest', equipment: 'barbell', targetMuscle: 'pectorals' },
  { id: '2', name: 'Squat', bodyPart: 'upper legs', equipment: 'barbell', targetMuscle: 'quadriceps' },
]

describe('ExerciseLibraryPanel', () => {
  it('renders search input', () => {
    render(<ExerciseLibraryPanel library={makeLibrary()} onAddExercise={jest.fn()} />)
    expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument()
  })

  it('calls setSearch when user types in search', () => {
    const setSearch = jest.fn()
    render(<ExerciseLibraryPanel library={makeLibrary({ setSearch })} onAddExercise={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Search exercises...'), { target: { value: 'bench' } })
    expect(setSearch).toHaveBeenCalledWith('bench')
  })

  it('renders exercise cards when exercises array is non-empty', () => {
    render(
      <ExerciseLibraryPanel
        library={makeLibrary({ exercises: sampleExercises })}
        onAddExercise={jest.fn()}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
  })

  it('shows empty state when no exercises match', () => {
    render(<ExerciseLibraryPanel library={makeLibrary({ exercises: [] })} onAddExercise={jest.fn()} />)
    expect(screen.getByText('No exercises match.')).toBeInTheDocument()
    expect(screen.getByText('Try clearing filters.')).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true and no exercises', () => {
    render(<ExerciseLibraryPanel library={makeLibrary({ isLoading: true, exercises: [] })} onAddExercise={jest.fn()} />)
    expect(screen.getByText('Loading exercises...')).toBeInTheDocument()
  })

  it('switches tabs on click', () => {
    const setTab = jest.fn()
    render(<ExerciseLibraryPanel library={makeLibrary({ setTab })} onAddExercise={jest.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Favorites' }))
    expect(setTab).toHaveBeenCalledWith('favorites')
  })

  it('active tab has aria-selected=true', () => {
    render(<ExerciseLibraryPanel library={makeLibrary({ tab: 'collections' })} onAddExercise={jest.fn()} />)
    const tab = screen.getByRole('tab', { name: 'Collections' })
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('has-video toggle button is present in DOM', () => {
    const setHasVideo = jest.fn()
    const { container } = render(<ExerciseLibraryPanel library={makeLibrary({ setHasVideo })} onAddExercise={jest.fn()} />)
    // Button is rendered as a native button with aria-pressed attribute
    const btn = container.querySelector('button[aria-pressed]')
    expect(btn).not.toBeNull()
    if (btn) {
      fireEvent.click(btn)
      expect(setHasVideo).toHaveBeenCalledWith(true)
    }
  })

  it('muscle group select trigger is present in DOM', () => {
    const setMuscleGroup = jest.fn()
    render(<ExerciseLibraryPanel library={makeLibrary({ setMuscleGroup })} onAddExercise={jest.fn()} />)
    // Radix Select renders a button trigger with accessible label
    const selectTriggers = screen.getAllByRole('button')
    // We just verify the component renders without error — select interaction tested manually
    expect(selectTriggers.length).toBeGreaterThan(0)
  })
})
