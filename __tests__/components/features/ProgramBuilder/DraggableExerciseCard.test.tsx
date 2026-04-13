/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DraggableExerciseCard from '@/components/features/ProgramBuilder/DraggableExerciseCard'
import type { LibraryExercise } from '@/components/features/ProgramBuilder/_stubs'

// Mock @dnd-kit/core useDraggable
jest.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: { role: 'button', tabIndex: 0 },
    listeners: { onPointerDown: jest.fn() },
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}))

const mockExercise: LibraryExercise = {
  id: 'ex-001',
  name: 'Bench Press',
  gifUrl: '',
  bodyPart: 'chest',
  equipment: 'barbell',
  targetMuscle: 'pectorals',
}

describe('DraggableExerciseCard', () => {
  it('renders exercise name', () => {
    render(<DraggableExerciseCard exercise={mockExercise} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('renders primary muscle badge', () => {
    render(<DraggableExerciseCard exercise={mockExercise} />)
    expect(screen.getByText('pectorals')).toBeInTheDocument()
  })

  it('renders equipment badge', () => {
    render(<DraggableExerciseCard exercise={mockExercise} />)
    expect(screen.getByText('barbell')).toBeInTheDocument()
  })

  it('renders Dumbbell icon when gifUrl is empty', () => {
    const { container } = render(<DraggableExerciseCard exercise={mockExercise} />)
    // icon rendered as SVG, check there's no img with src
    const img = container.querySelector('img')
    expect(img).toBeNull()
  })

  it('renders img when gifUrl is set', () => {
    const ex = { ...mockExercise, gifUrl: 'http://example.com/bench.gif' }
    render(<DraggableExerciseCard exercise={ex} />)
    const img = screen.getByRole('img', { name: 'Bench Press' })
    expect(img).toHaveAttribute('src', 'http://example.com/bench.gif')
  })

  it('calls onAddViaKeyboard on Enter key press', () => {
    const onAdd = jest.fn()
    render(<DraggableExerciseCard exercise={mockExercise} onAddViaKeyboard={onAdd} />)
    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith(mockExercise)
  })

  it('renders Plus button in mobile mode', () => {
    const onAdd = jest.fn()
    render(<DraggableExerciseCard exercise={mockExercise} isMobile onAddViaKeyboard={onAdd} />)
    const addBtn = screen.getByRole('button', { name: /add bench press/i })
    fireEvent.click(addBtn)
    expect(onAdd).toHaveBeenCalledWith(mockExercise)
  })

  it('does not render add button in desktop mode', () => {
    render(<DraggableExerciseCard exercise={mockExercise} />)
    expect(screen.queryByRole('button', { name: /add bench press/i })).toBeNull()
  })
})
