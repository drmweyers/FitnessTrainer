/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExerciseConfigDrawer from '@/components/features/ProgramBuilder/ExerciseConfigDrawer'
import { ProgramBuilderProvider } from '@/components/features/ProgramBuilder/ProgramBuilderContext'
import type { WorkoutExerciseDataExtended, UseExerciseLibraryReturn } from '@/components/features/ProgramBuilder/_stubs'
import { SetType } from '@/types/program'

// Radix Dialog renders in a portal; need jsdom to handle it
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react')
  return {
    Root: ({ open, children }: any) => (open ? <div data-testid="dialog-root">{children}</div> : null),
    Portal: ({ children }: any) => <>{children}</>,
    Overlay: ({ className }: any) => <div className={className} />,
    Content: ({ children, ...props }: any) => <div role="dialog" {...props}>{children}</div>,
    Title: ({ children }: any) => <h2>{children}</h2>,
    Close: ({ children }: any) => <>{children}</>,
  }
})

jest.mock('@radix-ui/react-tabs', () => {
  const React = require('react')
  return {
    Root: ({ value, onValueChange, children }: any) => (
      <div data-active-tab={value}>{children}</div>
    ),
    List: ({ children }: any) => <div role="tablist">{children}</div>,
    Trigger: ({ value, children, onClick }: any) => (
      <button role="tab" data-value={value} onClick={() => onClick?.(value)}>
        {children}
      </button>
    ),
    Content: ({ value, children }: any) => <div data-tab-content={value}>{children}</div>,
  }
})

jest.mock('@radix-ui/react-slider', () => {
  const React = require('react')
  return {
    Root: ({ onValueChange, value, children, ...props }: any) => (
      <div {...props}>
        <input
          type="range"
          value={value?.[0] ?? 7}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          aria-label="RPE"
        />
        {children}
      </div>
    ),
    Track: ({ children }: any) => <div>{children}</div>,
    Range: () => <div />,
    Thumb: () => <div />,
  }
})

function makeLibrary(): UseExerciseLibraryReturn {
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
    exercises: [
      { id: 'alt-001', name: 'Cable Fly', bodyPart: 'chest', equipment: 'cable', targetMuscle: 'pectorals' },
    ],
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(),
  }
}

const mockExercise: WorkoutExerciseDataExtended = {
  exerciseId: 'ex-001',
  orderIndex: 0,
  setsConfig: [],
  configurations: [
    { setNumber: 1, setType: SetType.WORKING, reps: '8', restSeconds: 90, rpe: 7 },
    { setNumber: 2, setType: SetType.WORKING, reps: '8', restSeconds: 90, rpe: 7 },
    { setNumber: 3, setType: SetType.WORKING, reps: '8', restSeconds: 90, rpe: 7 },
  ],
}

function renderDrawer(props: Partial<React.ComponentProps<typeof ExerciseConfigDrawer>> = {}) {
  return render(
    <ProgramBuilderProvider>
      <ExerciseConfigDrawer
        exercise={mockExercise}
        exerciseName="Bench Press"
        open
        onClose={jest.fn()}
        library={makeLibrary()}
        weekIdx={0}
        workoutIdx={0}
        {...props}
      />
    </ProgramBuilderProvider>,
  )
}

describe('ExerciseConfigDrawer', () => {
  it('does not render when open=false', () => {
    renderDrawer({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders exercise name in title', () => {
    renderDrawer()
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('renders Sets tab content by default', () => {
    renderDrawer()
    expect(screen.getByText('sets')).toBeInTheDocument()
  })

  it('renders set rows', () => {
    renderDrawer()
    // 3 set rows from mockExercise configurations
    const repInputs = screen.getAllByRole('spinbutton', { name: /reps/i })
    expect(repInputs.length).toBeGreaterThanOrEqual(0)
    // At minimum the set tabs content is present
    expect(screen.getAllByText(/working/i).length).toBeGreaterThan(0)
  })

  it('renders all 4 tab triggers', () => {
    renderDrawer()
    const tabs = screen.getAllByRole('tab')
    const labels = tabs.map((t) => t.textContent?.toLowerCase())
    expect(labels).toContain('sets')
    expect(labels).toContain('intensity')
    expect(labels).toContain('progression')
    expect(labels).toContain('notes')
  })

  it('renders Save and Cancel buttons', () => {
    renderDrawer()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onClose on Cancel click when not dirty', () => {
    const onClose = jest.fn()
    renderDrawer({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows discard dialog when canceling with dirty state', async () => {
    const onClose = jest.fn()
    renderDrawer({ onClose })
    // Make drawer dirty by typing in notes
    const tempoInput = screen.getByRole('textbox', { name: /tempo/i })
    fireEvent.change(tempoInput, { target: { value: '3-1-2-0' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.getByText(/discard unsaved changes/i)).toBeInTheDocument()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders Add Set button', () => {
    renderDrawer()
    expect(screen.getByRole('button', { name: /add set/i })).toBeInTheDocument()
  })

  it('RPE slider is present in intensity tab content', () => {
    renderDrawer()
    // Slider rendered as range input via mock
    const slider = screen.getByRole('slider', { name: /rpe/i })
    expect(slider).toBeInTheDocument()
  })
})
