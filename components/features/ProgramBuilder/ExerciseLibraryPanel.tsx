'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { Search, Filter, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DraggableExerciseCard from './DraggableExerciseCard'
import { useExerciseLibrary } from './useExerciseLibrary'
import type { UseExerciseLibraryReturn, LibraryExercise } from './useExerciseLibrary'

const MUSCLE_GROUPS = [
  'back', 'cardio', 'chest', 'lower arms', 'lower legs',
  'neck', 'shoulders', 'upper arms', 'upper legs', 'waist',
]

const EQUIPMENT_OPTIONS = [
  'barbell', 'cable', 'dumbbell', 'ez barbell', 'kettlebell',
  'leverage machine', 'medicine ball', 'olympic barbell',
  'resistance band', 'smith machine', 'body weight', 'band',
]

interface ExerciseLibraryPanelProps {
  library?: UseExerciseLibraryReturn
  isMobile?: boolean
  onAddExercise: (exercise: LibraryExercise) => void
}

const TAB_LABELS: Record<UseExerciseLibraryReturn['tab'], string> = {
  all: 'All',
  favorites: 'Favorites',
  collections: 'Collections',
}

const ExerciseLibraryPanel: React.FC<ExerciseLibraryPanelProps> = ({
  library: libraryProp,
  isMobile = false,
  onAddExercise,
}) => {
  const hookLibrary = useExerciseLibrary()
  const library = libraryProp ?? hookLibrary
  const {
    search, setSearch,
    muscleGroup, setMuscleGroup,
    equipment, setEquipment,
    hasVideo, setHasVideo,
    tab, setTab,
    exercises,
    isLoading,
    hasMore,
    loadMore,
  } = library

  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore()
      }
    },
    [hasMore, isLoading, loadMore],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleObserver])

  const tabs: UseExerciseLibraryReturn['tab'][] = ['all', 'favorites', 'collections']

  return (
    <aside
      data-testid="exercise-library-panel"
      className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white"
      aria-label="Exercise library"
    >
      <div className="p-3 border-b border-gray-200 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            data-testid="library-search-input"
            placeholder="Search exercises..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search exercises"
          />
        </div>

        <div className="flex gap-2">
          <Select value={muscleGroup || 'all'} onValueChange={(v) => setMuscleGroup(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-7 text-xs flex-1" aria-label="Filter by muscle group">
              <SelectValue placeholder="Muscle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All muscles</SelectItem>
              {MUSCLE_GROUPS.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={equipment || 'all'} onValueChange={(v) => setEquipment(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-7 text-xs flex-1" aria-label="Filter by equipment">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All equipment</SelectItem>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <SelectItem key={eq} value={eq} className="capitalize">
                  {eq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => setHasVideo(!hasVideo)}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors ${
            hasVideo
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={hasVideo}
          aria-label="Show only exercises with video"
        >
          <Video className="w-3 h-3" />
          Has video
        </button>

        <div className="flex border border-gray-200 rounded-md overflow-hidden" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1.5 transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && exercises.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading exercises...</div>
          ) : exercises.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Filter className="w-8 h-8 text-gray-300 mx-auto" />
              {tab === 'favorites' ? (
                <>
                  <p className="text-sm text-gray-500">No favorites yet.</p>
                  <p className="text-xs text-gray-400">Star exercises in the Exercise Library to add them here.</p>
                </>
              ) : tab === 'collections' ? (
                <>
                  <p className="text-sm text-gray-500">No collections yet.</p>
                  <p className="text-xs text-gray-400">Create collections in the Exercise Library to organize exercises.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">No exercises match.</p>
                  <p className="text-xs text-gray-400">Try clearing filters.</p>
                </>
              )}
            </div>
          ) : (
            exercises.map((exercise) => (
              <DraggableExerciseCard
                key={exercise.id}
                exercise={exercise}
                isMobile={isMobile}
                onAddViaKeyboard={onAddExercise}
              />
            ))
          )}

          {hasMore && (
            <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
          )}

          {isLoading && exercises.length > 0 && (
            <div className="py-2 text-center text-xs text-gray-400">Loading more...</div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

export default ExerciseLibraryPanel
