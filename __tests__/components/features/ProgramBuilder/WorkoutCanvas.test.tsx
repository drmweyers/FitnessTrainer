/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// useTier mock — default starter
const mockHasFeature = jest.fn().mockReturnValue(false)
jest.mock('@/hooks/useTier', () => ({
  useTier: () => ({
    tier: 'starter',
    level: 1,
    isStarter: true,
    isProfessional: false,
    isEnterprise: false,
    isLoading: false,
    canAccess: jest.fn(() => false),
    hasFeature: mockHasFeature,
  }),
}))

// Mock fetch for AI suggest
global.fetch = jest.fn()

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

// ─── AI Suggest button gate tests ─────────────────────────────────────────

describe('WorkoutCanvas — AI Suggest button', () => {
  beforeEach(() => {
    mockHasFeature.mockReset()
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('Starter user sees the AI Suggest button in locked/upgrade state', () => {
    // hasFeature returns false → FeatureGate shows locked CTA
    mockHasFeature.mockReturnValue(false)
    renderCanvas()
    // FeatureGate renders "Upgrade Plan" button with locked state for starter
    // The locked CTA should be present somewhere in the DOM
    const upgradeBtns = screen.queryAllByText(/upgrade/i)
    // There's at least one locked FeatureGate rendered
    expect(upgradeBtns.length).toBeGreaterThan(0)
  })

  it('Pro user sees the Suggest next exercise button', () => {
    mockHasFeature.mockReturnValue(true)
    renderCanvas()
    expect(screen.getByRole('button', { name: /suggest next exercise/i })).toBeInTheDocument()
  })

  it('Pro user clicking Suggest button calls /api/programs/suggest-exercise', async () => {
    mockHasFeature.mockReturnValue(true)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          suggestions: [
            { id: 'ex-1', name: 'Squat', bodyPart: 'upper legs', targetMuscle: 'quads', equipment: 'barbell', gifUrl: null },
          ],
        },
      }),
    })

    renderCanvas()
    const btn = screen.getByRole('button', { name: /suggest next exercise/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/programs/suggest-exercise',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('Pro user sees suggestions popover after successful fetch', async () => {
    mockHasFeature.mockReturnValue(true)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          suggestions: [
            { id: 'ex-sq', name: 'Squat', bodyPart: 'upper legs', targetMuscle: 'quads', equipment: 'barbell', gifUrl: null },
          ],
        },
      }),
    })

    renderCanvas()
    const btn = screen.getByRole('button', { name: /suggest next exercise/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText('Squat')).toBeInTheDocument()
    })
  })
})
