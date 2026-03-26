/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PARQuestionnaire, { PAR_Q_QUESTIONS } from '../PARQuestionnaire';

describe('PARQuestionnaire', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 7 PAR-Q questions', () => {
    render(<PARQuestionnaire responses={{}} onChange={mockOnChange} />);
    expect(screen.getAllByRole('group')).toHaveLength(7);
  });

  it('renders each question text', () => {
    render(<PARQuestionnaire responses={{}} onChange={mockOnChange} />);
    PAR_Q_QUESTIONS.forEach(q => {
      expect(screen.getByText(q.question)).toBeInTheDocument();
    });
  });

  it('renders yes, no, and unsure options for each question', () => {
    render(<PARQuestionnaire responses={{}} onChange={mockOnChange} />);
    const yesButtons = screen.getAllByText('Yes');
    const noButtons = screen.getAllByText('No');
    const unsureButtons = screen.getAllByText('Unsure');
    expect(yesButtons).toHaveLength(7);
    expect(noButtons).toHaveLength(7);
    expect(unsureButtons).toHaveLength(7);
  });

  it('calls onChange when a response is selected', () => {
    render(<PARQuestionnaire responses={{}} onChange={mockOnChange} />);
    const yesButtons = screen.getAllByText('Yes');
    fireEvent.click(yesButtons[0]);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ [PAR_Q_QUESTIONS[0].id]: 'yes' })
    );
  });

  it('reflects current responses in the UI', () => {
    const responses = { q1: 'yes', q2: 'no', q3: 'unsure' };
    render(<PARQuestionnaire responses={responses} onChange={mockOnChange} />);
    // Verify the component renders without throwing — selected state is reflected via aria-pressed
    const yesButtons = screen.getAllByRole('button', { name: 'Yes' });
    expect(yesButtons[0]).toHaveAttribute('aria-pressed', 'true');
    const noButtons = screen.getAllByRole('button', { name: 'No' });
    expect(noButtons[1]).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows doctor consultation warning when any response is yes', () => {
    const responses = { q1: 'yes' };
    render(<PARQuestionnaire responses={responses} onChange={mockOnChange} />);
    expect(
      screen.getByText(/consult your doctor before starting an exercise program/i)
    ).toBeInTheDocument();
  });

  it('does not show warning when no yes responses', () => {
    const responses = { q1: 'no', q2: 'no' };
    render(<PARQuestionnaire responses={responses} onChange={mockOnChange} />);
    expect(
      screen.queryByText(/consult your doctor/i)
    ).not.toBeInTheDocument();
  });

  it('does not show warning when all responses are unsure', () => {
    const responses = { q1: 'unsure', q2: 'unsure' };
    render(<PARQuestionnaire responses={responses} onChange={mockOnChange} />);
    expect(screen.queryByText(/consult your doctor/i)).not.toBeInTheDocument();
  });

  it('does not show warning when responses is empty', () => {
    render(<PARQuestionnaire responses={{}} onChange={mockOnChange} />);
    expect(screen.queryByText(/consult your doctor/i)).not.toBeInTheDocument();
  });

  it('includes all 7 question IDs q1-q7', () => {
    const ids = PAR_Q_QUESTIONS.map(q => q.id);
    expect(ids).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  });
});
