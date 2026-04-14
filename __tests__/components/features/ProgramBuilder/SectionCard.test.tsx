/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SectionCard, { CanvasSection } from '@/components/features/ProgramBuilder/SectionCard'
import type { WorkoutExerciseDataExtended } from '@/types/program'
import { SetType } from '@/types/program'

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const baseExercise: WorkoutExerciseDataExtended = {
  exerciseId: 'ex-001',
  orderIndex: 0,
  setsConfig: [],
  sectionType: 'regular',
  configurations: [
    { setNumber: 1, setType: SetType.WORKING, reps: '8', restSeconds: 90 },
  ],
}

function makeSection(overrides: Partial<CanvasSection> = {}): CanvasSection {
  return {
    id: 'section-regular-0',
    type: 'regular',
    exercises: [baseExercise],
    ...overrides,
  }
}

const defaultProps = {
  exerciseNames: { 'ex-001': 'Bench Press' },
  selectedExerciseIds: new Set<string>(),
  onSelectExercise: jest.fn(),
  onOpenConfig: jest.fn(),
  onRemoveExercise: jest.fn(),
  onUngroup: jest.fn(),
  onUpdateMetadata: jest.fn(),
}

describe('SectionCard', () => {
  it('renders exercise row with name', () => {
    render(<SectionCard section={makeSection()} {...defaultProps} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('does not show header for regular section', () => {
    render(<SectionCard section={makeSection({ type: 'regular' })} {...defaultProps} />)
    expect(screen.queryByText(/superset/i)).toBeNull()
    expect(screen.queryByText(/circuit/i)).toBeNull()
  })

  it('shows superset header with letter', () => {
    render(
      <SectionCard
        section={makeSection({ type: 'superset', supersetLetter: 'A', id: 'section-superset-A' })}
        {...defaultProps}
      />,
    )
    expect(screen.getByText('Superset A')).toBeInTheDocument()
  })

  it('shows circuit header with rounds from metadata', () => {
    render(
      <SectionCard
        section={makeSection({ type: 'circuit', id: 'section-circuit', metadata: { rounds: 4 } })}
        {...defaultProps}
      />,
    )
    expect(screen.getByText('Circuit × 4 rounds')).toBeInTheDocument()
  })

  it('shows interval header', () => {
    render(
      <SectionCard
        section={makeSection({ type: 'interval', id: 'section-interval', metadata: { intervalWork: 30, intervalRest: 15 } })}
        {...defaultProps}
      />,
    )
    expect(screen.getByText('Interval 30s / 15s')).toBeInTheDocument()
  })

  it('calls onUngroup when trash icon is clicked', () => {
    const onUngroup = jest.fn()
    render(
      <SectionCard
        section={makeSection({ type: 'superset', supersetLetter: 'B', id: 'section-superset-B' })}
        {...defaultProps}
        onUngroup={onUngroup}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /remove section/i }))
    expect(onUngroup).toHaveBeenCalledWith('section-superset-B')
  })

  it('calls onOpenConfig when exercise row is clicked', () => {
    const onOpenConfig = jest.fn()
    render(<SectionCard section={makeSection()} {...defaultProps} onOpenConfig={onOpenConfig} />)
    fireEvent.click(screen.getByText('Bench Press'))
    expect(onOpenConfig).toHaveBeenCalledWith(baseExercise)
  })

  it('calls onSelectExercise when checkbox is clicked', () => {
    const onSelect = jest.fn()
    render(<SectionCard section={makeSection()} {...defaultProps} onSelectExercise={onSelect} />)
    const checkbox = screen.getByRole('checkbox', { name: /select bench press/i })
    fireEvent.click(checkbox)
    expect(onSelect).toHaveBeenCalledWith('ex-001')
  })

  it('highlights selected exercises', () => {
    const { container } = render(
      <SectionCard
        section={makeSection()}
        {...defaultProps}
        selectedExerciseIds={new Set(['ex-001'])}
      />,
    )
    expect(container.querySelector('.bg-blue-50')).toBeTruthy()
  })

  it('opens metadata popover for circuit section', () => {
    render(
      <SectionCard
        section={makeSection({ type: 'circuit', id: 'section-circuit', metadata: {} })}
        {...defaultProps}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /edit section settings/i }))
    expect(screen.getByLabelText('Rounds')).toBeInTheDocument()
  })
})
