/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressionSuggestion } from '@/components/workouts/ProgressionSuggestion'

describe('ProgressionSuggestion', () => {
  const baseSuggestion = {
    suggestedWeight: 105,
    suggestedReps: 10,
    strategy: 'increase_weight',
    reason: 'Average RPE 6.5 with all reps hit. Ready to add 5 lbs.',
    confidence: 'high' as const,
    dataPoints: 10,
  }

  it('renders suggestion card with weight and reps', () => {
    render(<ProgressionSuggestion suggestion={baseSuggestion} />)

    expect(screen.getByText('105 lbs')).toBeInTheDocument()
    expect(screen.getByText('x 10 reps')).toBeInTheDocument()
    expect(screen.getByText('Next Session Suggestion')).toBeInTheDocument()
  })

  it('shows weight change indicator (+5 lbs)', () => {
    render(<ProgressionSuggestion suggestion={baseSuggestion} currentWeight={100} />)

    expect(screen.getByText('(+5 lbs)')).toBeInTheDocument()
  })

  it('shows strategy reason text', () => {
    render(<ProgressionSuggestion suggestion={baseSuggestion} />)

    expect(screen.getByText(baseSuggestion.reason)).toBeInTheDocument()
  })

  it('shows green confidence badge for high confidence', () => {
    render(<ProgressionSuggestion suggestion={{ ...baseSuggestion, confidence: 'high' }} />)

    const badge = screen.getByText('high confidence')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-700')
  })

  it('shows yellow confidence badge for medium confidence', () => {
    render(<ProgressionSuggestion suggestion={{ ...baseSuggestion, confidence: 'medium' }} />)

    const badge = screen.getByText('medium confidence')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-yellow-100')
    expect(badge.className).toContain('text-yellow-700')
  })

  it('shows orange confidence badge for low confidence', () => {
    render(<ProgressionSuggestion suggestion={{ ...baseSuggestion, confidence: 'low' }} />)

    const badge = screen.getByText('low confidence')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-orange-100')
    expect(badge.className).toContain('text-orange-700')
  })

  it('calls onAccept when Accept button is clicked', () => {
    const onAccept = jest.fn()
    render(<ProgressionSuggestion suggestion={baseSuggestion} onAccept={onAccept} />)

    fireEvent.click(screen.getByText('Accept'))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when Dismiss button is clicked', () => {
    const onDismiss = jest.fn()
    render(<ProgressionSuggestion suggestion={baseSuggestion} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows "Log 3+ sets" message when dataPoints < 3', () => {
    const lowDataSuggestion = { ...baseSuggestion, dataPoints: 2 }
    render(<ProgressionSuggestion suggestion={lowDataSuggestion} />)

    expect(screen.getByText('Log 3+ sets to get progression suggestions.')).toBeInTheDocument()
    expect(screen.queryByText('Next Session Suggestion')).not.toBeInTheDocument()
  })

  it('handles zero weight change (shows = sign)', () => {
    render(<ProgressionSuggestion suggestion={baseSuggestion} currentWeight={105} />)

    // No weight change indicator should be rendered when change is 0
    expect(screen.queryByText(/lbs\)/)).not.toBeInTheDocument()
  })

  it('handles negative weight change (reduce)', () => {
    const reduceSuggestion = {
      ...baseSuggestion,
      suggestedWeight: 95,
      strategy: 'reduce',
      reason: 'Weight is too heavy. Reduce by 5 lbs.',
    }
    render(<ProgressionSuggestion suggestion={reduceSuggestion} currentWeight={100} />)

    expect(screen.getByText('(-5 lbs)')).toBeInTheDocument()
    expect(screen.getByText('95 lbs')).toBeInTheDocument()
  })

  it('does not render Accept button when onAccept is not provided', () => {
    render(<ProgressionSuggestion suggestion={baseSuggestion} />)

    expect(screen.queryByText('Accept')).not.toBeInTheDocument()
  })

  it('does not render Dismiss button when onDismiss is not provided', () => {
    render(<ProgressionSuggestion suggestion={baseSuggestion} />)

    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument()
  })

  it('applies correct border color for increase_weight strategy', () => {
    const { container } = render(<ProgressionSuggestion suggestion={baseSuggestion} />)

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border-green-200')
    expect(card.className).toContain('bg-green-50')
  })

  it('applies correct border color for reduce strategy', () => {
    const reduceSuggestion = { ...baseSuggestion, strategy: 'reduce' }
    const { container } = render(<ProgressionSuggestion suggestion={reduceSuggestion} />)

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border-red-200')
    expect(card.className).toContain('bg-red-50')
  })
})
