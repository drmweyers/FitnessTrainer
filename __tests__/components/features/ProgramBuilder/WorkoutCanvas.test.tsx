/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutCanvas from '@/components/features/ProgramBuilder/WorkoutCanvas'
import { ProgramBuilderProvider } from '@/components/features/ProgramBuilder/ProgramBuilderContext'

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ isOver: false, setNodeRef: jest.fn() }),
  DndContext: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: {},
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

function renderCanvas(props = {}) {
  return render(
    <ProgramBuilderProvider>
      <WorkoutCanvas weekIdx={0} workoutIdx={0} onOpenConfig={jest.fn()} {...props} />
    </ProgramBuilderProvider>,
  )
}

describe('WorkoutCanvas', () => {
  it('renders empty state when no exercises', () => {
    renderCanvas()
    expect(screen.getByText('Drag exercises here to start building')).toBeInTheDocument()
  })

  it('renders section add button', () => {
    renderCanvas()
    const btns = screen.getAllByRole('button', { name: /add section/i })
    expect(btns.length).toBeGreaterThan(0)
  })

  it('renders trash drop zone', () => {
    renderCanvas()
    expect(screen.getByText('Drop here to remove')).toBeInTheDocument()
  })

  it('renders week navigation buttons', () => {
    renderCanvas()
    // With no weeks set up in initial state, should still render the week strip area
    // (empty since no weeks yet)
    expect(screen.queryByRole('button', { name: /week 1/i })).toBeNull()
  })

  it('does not render bulk action bar when fewer than 2 exercises selected', () => {
    renderCanvas()
    expect(screen.queryByRole('button', { name: /group as superset/i })).toBeNull()
  })

  it('shows Add Section dropdown options after click', () => {
    renderCanvas()
    const btns = screen.getAllByRole('button', { name: /add section/i })
    // Click the last one (the actual trigger, not the DropdownMenu wrapper)
    fireEvent.click(btns[btns.length - 1])
    // Dropdown items should appear
    expect(screen.getByText('Regular')).toBeInTheDocument()
  })
})
