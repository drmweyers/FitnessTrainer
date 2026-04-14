'use client'

import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import * as Slider from '@radix-ui/react-slider'
import { X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PercentageCalculator from './PercentageCalculator'
import { useProgramBuilder } from './ProgramBuilderContext'
import { SetType } from '@/types/program'
import type { ExerciseConfigurationData, WorkoutExerciseDataExtended } from '@/types/program'
import type { UseExerciseLibraryReturn } from './useExerciseLibrary'

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: SetType.WARMUP, label: 'Warm-up' },
  { value: SetType.WORKING, label: 'Working' },
  { value: SetType.DROP, label: 'Drop Set' },
  { value: SetType.PYRAMID, label: 'Pyramid' },
  { value: SetType.AMRAP, label: 'AMRAP' },
  { value: SetType.CLUSTER, label: 'Cluster' },
  { value: SetType.REST_PAUSE, label: 'Rest-Pause' },
]

function makeDefaultSet(setNumber: number): ExerciseConfigurationData {
  return {
    setNumber,
    setType: SetType.WORKING,
    reps: '8',
    weightGuidance: '',
    restSeconds: 90,
    tempo: '',
    rpe: undefined,
    rir: undefined,
    notes: '',
  }
}

interface SetsTabProps {
  sets: ExerciseConfigurationData[]
  onChange: (sets: ExerciseConfigurationData[]) => void
}

function SetsTab({ sets, onChange }: SetsTabProps) {
  const [showCalc, setShowCalc] = useState<number | null>(null)

  const updateSet = (idx: number, partial: Partial<ExerciseConfigurationData>) => {
    onChange(sets.map((s, i) => (i === idx ? { ...s, ...partial } : s)))
  }

  const addSet = () => {
    onChange([...sets, makeDefaultSet(sets.length + 1)])
  }

  const removeSet = (idx: number) => {
    onChange(sets.filter((_, i) => i !== idx).map((s, i) => ({ ...s, setNumber: i + 1 })))
  }

  return (
    <div data-testid="config-sets-input" className="space-y-2 p-3">
      <div className="grid grid-cols-[24px_1fr_80px_90px_60px_24px] gap-1 text-xs text-gray-500 font-medium px-1">
        <span>#</span>
        <span>Type</span>
        <span>Reps</span>
        <span>Weight</span>
        <span>Rest(s)</span>
        <span />
      </div>

      {sets.map((set, idx) => (
        <div key={idx} className="grid grid-cols-[24px_1fr_80px_90px_60px_24px] gap-1 items-center">
          <span className="text-xs text-gray-500 text-center">{idx + 1}</span>

          <Select
            value={set.setType}
            onValueChange={(v) => updateSet(idx, { setType: v as SetType })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SET_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            data-testid="config-reps-input"
            className="h-7 text-xs text-center"
            value={set.reps}
            onChange={(e) => updateSet(idx, { reps: e.target.value })}
            placeholder="8"
            aria-label="Reps"
          />

          <div className="flex items-center gap-0.5">
            <Input
              className="h-7 text-xs flex-1"
              value={set.weightGuidance ?? ''}
              onChange={(e) => updateSet(idx, { weightGuidance: e.target.value })}
              placeholder="weight"
              aria-label="Weight guidance"
            />
            <button
              type="button"
              onClick={() => setShowCalc(showCalc === idx ? null : idx)}
              className="text-xs text-blue-500 hover:text-blue-700 flex-shrink-0"
              aria-label="Open percentage calculator"
              title="%1RM"
            >
              %
            </button>
          </div>

          <Input
            data-testid="config-rest-input"
            className="h-7 text-xs text-center"
            type="number"
            value={set.restSeconds ?? ''}
            onChange={(e) => updateSet(idx, { restSeconds: parseInt(e.target.value) || undefined })}
            placeholder="90"
            aria-label="Rest seconds"
          />

          <button
            type="button"
            onClick={() => removeSet(idx)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove set"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {showCalc === idx && (
            <div className="col-span-6 border rounded-lg p-3 bg-gray-50 mt-1">
              <PercentageCalculator
                currentWeight={parseInt(set.weightGuidance ?? '0') || 0}
                onApply={(weeklyIncrease) => {
                  updateSet(idx, { weightGuidance: `${Math.round(weeklyIncrease)}lbs/wk` })
                  setShowCalc(null)
                }}
              />
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="text-xs w-full mt-1" onClick={addSet}>
        <Plus className="w-3 h-3 mr-1" />
        Add Set
      </Button>

      <div className="pt-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Tempo (eccentric-pause-concentric-pause)</label>
        <Input
          className="h-7 text-sm"
          value={sets[0]?.tempo ?? ''}
          onChange={(e) => onChange(sets.map((s) => ({ ...s, tempo: e.target.value })))}
          placeholder="3-1-2-0"
          aria-label="Tempo"
        />
      </div>
    </div>
  )
}

interface IntensityTabProps {
  rpe: number | undefined
  rir: number | undefined
  onChange: (rpe: number | undefined, rir: number | undefined) => void
}

function IntensityTab({ rpe, rir, onChange }: IntensityTabProps) {
  return (
    <div className="space-y-4 p-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">RPE</label>
          <span className="text-sm font-semibold text-blue-700">{rpe ?? '—'}</span>
        </div>
        <Slider.Root
          data-testid="config-rpe-input"
          className="relative flex items-center select-none touch-none w-full h-5"
          value={rpe !== undefined ? [rpe] : [7]}
          min={1}
          max={10}
          step={0.5}
          onValueChange={([v]) => onChange(v, rir)}
          aria-label="RPE"
        >
          <Slider.Track className="bg-gray-200 relative grow rounded-full h-1.5">
            <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer" />
        </Slider.Root>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RIR (Reps in Reserve)</label>
        <Input
          type="number"
          className="h-8 text-sm w-24"
          min={0}
          max={10}
          step={0.5}
          value={rir ?? ''}
          onChange={(e) => onChange(rpe, parseFloat(e.target.value) || undefined)}
          placeholder="e.g. 2"
          aria-label="Reps in reserve"
        />
        <p className="text-xs text-gray-400 mt-1">Number of reps you could still perform</p>
      </div>
    </div>
  )
}

interface AlternatePickerProps {
  currentAlternateId: string | undefined
  library: UseExerciseLibraryReturn
  onChange: (id: string | undefined) => void
}

function AlternatePicker({ currentAlternateId, library, onChange }: AlternatePickerProps) {
  const [search, setSearch] = useState('')
  const filtered = library.exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.targetMuscle.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">Alternate exercise</label>
      <Input
        className="h-7 text-xs"
        placeholder="Search alternate..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search alternate exercise"
      />
      {currentAlternateId && (
        <div className="flex items-center justify-between text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
          <span className="text-blue-700">
            {library.exercises.find((e) => e.id === currentAlternateId)?.name ?? currentAlternateId}
          </span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-blue-400 hover:text-blue-700"
            aria-label="Clear alternate exercise"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="max-h-36 overflow-y-auto space-y-0.5">
        {filtered.slice(0, 20).map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onChange(ex.id)}
            className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 transition-colors ${
              currentAlternateId === ex.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>
    </div>
  )
}

interface ExerciseConfigDrawerProps {
  exercise: WorkoutExerciseDataExtended | null
  exerciseName: string
  open: boolean
  onClose: () => void
  library?: UseExerciseLibraryReturn
  weekIdx: number
  workoutIdx: number
}

const ExerciseConfigDrawer: React.FC<ExerciseConfigDrawerProps> = ({
  exercise,
  exerciseName,
  open,
  onClose,
  library: libraryProp,
  weekIdx,
  workoutIdx,
}) => {
  const { dispatch, state } = useProgramBuilder()

  // Resolve exerciseIdx by finding this exercise in the current workout.
  // Required because the reducer uses positional indexes, not exerciseId lookups.
  const exerciseIdx = React.useMemo(() => {
    if (!exercise) return -1
    const workout = state.weeks[weekIdx]?.workouts?.[workoutIdx]
    return (workout?.exercises ?? []).findIndex((ex) => ex.exerciseId === exercise.exerciseId)
  }, [exercise, state.weeks, weekIdx, workoutIdx])
  const library = libraryProp

  const initialSets = (): ExerciseConfigurationData[] => {
    if (exercise?.configurations?.length) return [...exercise.configurations]
    return [makeDefaultSet(1), makeDefaultSet(2), makeDefaultSet(3)]
  }

  const [sets, setSets] = useState<ExerciseConfigurationData[]>(initialSets)
  const [rpe, setRpe] = useState<number | undefined>(exercise?.configurations?.[0]?.rpe)
  const [rir, setRir] = useState<number | undefined>(exercise?.configurations?.[0]?.rir)
  const [notes, setNotes] = useState(exercise?.notes ?? '')
  const [alternateId, setAlternateId] = useState<string | undefined>(exercise?.alternateExerciseId)
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('sets')

  useEffect(() => {
    if (open && exercise) {
      setSets(exercise.configurations?.length ? [...exercise.configurations] : [makeDefaultSet(1), makeDefaultSet(2), makeDefaultSet(3)])
      setRpe(exercise.configurations?.[0]?.rpe)
      setRir(exercise.configurations?.[0]?.rir)
      setNotes(exercise.notes ?? '')
      setAlternateId(exercise.alternateExerciseId)
      setIsDirty(false)
      setActiveTab('sets')
    }
  }, [open, exercise])

  const handleSetsChange = (next: ExerciseConfigurationData[]) => {
    setSets(next)
    setIsDirty(true)
  }

  const handleIntensityChange = (nextRpe: number | undefined, nextRir: number | undefined) => {
    setRpe(nextRpe)
    setRir(nextRir)
    setIsDirty(true)
  }

  const handleSave = () => {
    if (!exercise || exerciseIdx === -1) return
    const updatedSets = sets.map((s) => ({ ...s, rpe, rir }))
    dispatch({
      type: 'UPDATE_EXERCISE_CONFIG',
      payload: {
        weekIdx,
        workoutIdx,
        exerciseIdx,
        configurations: updatedSets,
        notes,
      },
    })
    if (alternateId !== exercise.alternateExerciseId) {
      dispatch({
        type: 'SET_ALTERNATE_EXERCISE',
        payload: { weekIdx, workoutIdx, exerciseIdx, alternateExerciseId: alternateId ?? null },
      })
    }
    setIsDirty(false)
    onClose()
  }

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onClose()
    }
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && handleAttemptClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
          <Dialog.Content
            data-testid="exercise-config-drawer"
            className="fixed right-0 top-0 h-full w-96 max-w-full bg-white shadow-xl z-50 flex flex-col"
            aria-label="Exercise configuration"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <div>
                <Dialog.Title className="text-sm font-semibold text-gray-900 truncate max-w-[280px]">
                  {exerciseName}
                </Dialog.Title>
                <p className="text-xs text-gray-500">Configure sets, intensity & progression</p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <Tabs.Root
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col flex-1 min-h-0"
            >
              <Tabs.List className="flex border-b border-gray-200 flex-shrink-0 bg-gray-50">
                {['sets', 'intensity', 'progression', 'notes'].map((t) => (
                  <Tabs.Trigger
                    key={t}
                    value={t}
                    className="flex-1 text-xs py-2 capitalize font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 transition-colors"
                  >
                    {t}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <div className="flex-1 overflow-y-auto">
                <Tabs.Content value="sets" className="outline-none">
                  <SetsTab sets={sets} onChange={handleSetsChange} />
                </Tabs.Content>

                <Tabs.Content value="intensity" className="outline-none">
                  <IntensityTab rpe={rpe} rir={rir} onChange={handleIntensityChange} />
                </Tabs.Content>

                <Tabs.Content value="progression" className="outline-none p-3">
                  <p className="text-xs text-gray-500 mb-2">Configure progression for this exercise across weeks.</p>
                  <div className="text-xs text-gray-400 border border-dashed border-gray-300 rounded p-4 text-center">
                    Progression settings apply program-wide. Use the Progression Builder on the main view for full configuration.
                  </div>
                </Tabs.Content>

                <Tabs.Content value="notes" className="outline-none p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md text-sm p-2 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={notes}
                      onChange={(e) => { setNotes(e.target.value); setIsDirty(true) }}
                      placeholder="Cues, form notes, coaching points..."
                      aria-label="Exercise notes"
                    />
                  </div>

                  {library ? (
                    <AlternatePicker
                      currentAlternateId={alternateId}
                      library={library}
                      onChange={(id) => { setAlternateId(id); setIsDirty(true) }}
                    />
                  ) : null}
                </Tabs.Content>
              </div>
            </Tabs.Root>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
              <Button variant="outline" size="sm" onClick={handleAttemptClose}>
                Cancel
              </Button>
              <Button data-testid="config-drawer-save" size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {showDiscardDialog && (
        <Dialog.Root open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-5 shadow-xl z-50 w-80">
              <Dialog.Title className="text-sm font-semibold text-gray-900 mb-2">
                Discard unsaved changes?
              </Dialog.Title>
              <p className="text-xs text-gray-600 mb-4">
                You have unsaved changes to this exercise. Closing will discard them.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDiscardDialog(false)}>
                  Keep editing
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setShowDiscardDialog(false)
                    setIsDirty(false)
                    onClose()
                  }}
                >
                  Discard
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  )
}

export default ExerciseConfigDrawer
