/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Edit2: () => <span data-testid="icon-edit" />,
  Copy: () => <span data-testid="icon-copy" />,
  Trash2: () => <span data-testid="icon-trash" />,
  UserPlus: () => <span data-testid="icon-user-plus" />,
  Clock: () => <span data-testid="icon-clock" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Users: () => <span data-testid="icon-users" />,
  Target: () => <span data-testid="icon-target" />,
  Dumbbell: () => <span data-testid="icon-dumbbell" />,
  MoreVertical: () => <span data-testid="icon-more-vertical" />,
  Star: () => <span data-testid="icon-star" />,
}));

import ProgramCard from '../ProgramCard';
import { Program, ProgramType, DifficultyLevel } from '@/types/program';

function createMockProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    trainerId: 'trainer-1',
    name: 'Strength Builder Pro',
    description: 'A comprehensive strength building program',
    programType: ProgramType.STRENGTH,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    durationWeeks: 8,
    goals: ['Build Strength', 'Increase Muscle Mass', 'Improve Endurance', 'Better Flexibility'],
    equipmentNeeded: ['Barbell', 'Dumbbells', 'Bench', 'Pull-up Bar'],
    isTemplate: false,
    isPublic: false,
    createdAt: '2024-01-01T00:00:00Z',
    weeks: [
      {
        weekNumber: 1,
        name: 'Week 1',
        isDeload: false,
        workouts: [
          { dayNumber: 1, name: 'Day 1', isRestDay: false, exercises: [] },
          { dayNumber: 2, name: 'Day 2', isRestDay: false, exercises: [] },
          { dayNumber: 3, name: 'Day 3', isRestDay: false, exercises: [] },
        ],
      },
    ],
    assignments: [
      { id: 'a1', programId: 'prog-1', clientId: 'c1', trainerId: 'trainer-1', startDate: '2024-01-01', isActive: true, assignedAt: '2024-01-01' },
      { id: 'a2', programId: 'prog-1', clientId: 'c2', trainerId: 'trainer-1', startDate: '2024-01-01', isActive: false, assignedAt: '2024-01-01' },
    ],
    ...overrides,
  };
}

describe('ProgramCard', () => {
  const defaultProps = {
    program: createMockProgram(),
    onEdit: jest.fn(),
    onDuplicate: jest.fn(),
    onDelete: jest.fn(),
    onAssign: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Grid View (default)', () => {
    it('should render the program name', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('Strength Builder Pro')).toBeInTheDocument();
    });

    it('should render the program description', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('A comprehensive strength building program')).toBeInTheDocument();
    });

    it('should render the program type badge', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('Strength')).toBeInTheDocument();
    });

    it('should render the difficulty level badge', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('should render the duration in weeks', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Weeks')).toBeInTheDocument();
    });

    it('should render the workout count', () => {
      render(<ProgramCard {...defaultProps} />);
      // 3 workouts in week 1
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Workouts')).toBeInTheDocument();
    });

    it('should render active assignment count', () => {
      render(<ProgramCard {...defaultProps} />);
      // 1 active assignment
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render Assign to Client button', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('Assign to Client')).toBeInTheDocument();
    });

    it('should call onAssign when Assign to Client is clicked', () => {
      render(<ProgramCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Assign to Client'));
      expect(defaultProps.onAssign).toHaveBeenCalledWith(defaultProps.program);
    });

    it('should show star icon for template programs', () => {
      const templateProgram = createMockProgram({ isTemplate: true });
      render(<ProgramCard {...defaultProps} program={templateProgram} />);
      expect(screen.getByTestId('icon-star')).toBeInTheDocument();
    });

    it('should not show star icon for non-template programs', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.queryByTestId('icon-star')).not.toBeInTheDocument();
    });

    it('should render goals section', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('Goals')).toBeInTheDocument();
      expect(screen.getByText('Build Strength')).toBeInTheDocument();
      expect(screen.getByText('Increase Muscle Mass')).toBeInTheDocument();
      expect(screen.getByText('Improve Endurance')).toBeInTheDocument();
    });

    it('should show "+N more" for goals beyond 3', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('should render equipment section', () => {
      render(<ProgramCard {...defaultProps} />);
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('should show dropdown menu when more button is clicked', () => {
      render(<ProgramCard {...defaultProps} />);
      const moreButtons = screen.getAllByTestId('icon-more-vertical');
      const moreButton = moreButtons[0].closest('button');
      if (moreButton) fireEvent.click(moreButton);
      expect(screen.getByText('Edit Program')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onEdit when Edit Program is clicked', () => {
      render(<ProgramCard {...defaultProps} />);
      const moreButtons = screen.getAllByTestId('icon-more-vertical');
      const moreButton = moreButtons[0].closest('button');
      if (moreButton) fireEvent.click(moreButton);
      fireEvent.click(screen.getByText('Edit Program'));
      expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.program);
    });

    it('should call onDuplicate when Duplicate is clicked', () => {
      render(<ProgramCard {...defaultProps} />);
      const moreButtons = screen.getAllByTestId('icon-more-vertical');
      const moreButton = moreButtons[0].closest('button');
      if (moreButton) fireEvent.click(moreButton);
      fireEvent.click(screen.getByText('Duplicate'));
      expect(defaultProps.onDuplicate).toHaveBeenCalledWith(defaultProps.program);
    });

    it('should call onDelete when Delete is clicked', () => {
      render(<ProgramCard {...defaultProps} />);
      const moreButtons = screen.getAllByTestId('icon-more-vertical');
      const moreButton = moreButtons[0].closest('button');
      if (moreButton) fireEvent.click(moreButton);
      fireEvent.click(screen.getByText('Delete'));
      expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.program);
    });
  });

  describe('List View', () => {
    it('should render program name in list view', () => {
      render(<ProgramCard {...defaultProps} viewMode="list" />);
      expect(screen.getByText('Strength Builder Pro')).toBeInTheDocument();
    });

    it('should render description in list view', () => {
      render(<ProgramCard {...defaultProps} viewMode="list" />);
      expect(screen.getByText('A comprehensive strength building program')).toBeInTheDocument();
    });

    it('should render Assign button in list view', () => {
      render(<ProgramCard {...defaultProps} viewMode="list" />);
      expect(screen.getByText('Assign')).toBeInTheDocument();
    });

    it('should call onAssign when Assign is clicked in list view', () => {
      render(<ProgramCard {...defaultProps} viewMode="list" />);
      fireEvent.click(screen.getByText('Assign'));
      expect(defaultProps.onAssign).toHaveBeenCalledWith(defaultProps.program);
    });

    it('should render type badge in list view', () => {
      render(<ProgramCard {...defaultProps} viewMode="list" />);
      expect(screen.getByText('Strength')).toBeInTheDocument();
    });

    it('should render difficulty badge in list view', () => {
      render(<ProgramCard {...defaultProps} viewMode="list" />);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });
  });

  describe('No data edge cases', () => {
    it('should handle program with no goals', () => {
      const noGoals = createMockProgram({ goals: [] });
      render(<ProgramCard {...defaultProps} program={noGoals} />);
      expect(screen.queryByText('Goals')).not.toBeInTheDocument();
    });

    it('should handle program with no equipment', () => {
      const noEquip = createMockProgram({ equipmentNeeded: [] });
      render(<ProgramCard {...defaultProps} program={noEquip} />);
      expect(screen.queryByText('Equipment')).not.toBeInTheDocument();
    });

    it('should handle program with no description', () => {
      const noDesc = createMockProgram({ description: undefined });
      render(<ProgramCard {...defaultProps} program={noDesc} />);
      expect(screen.getByText('Strength Builder Pro')).toBeInTheDocument();
    });

    it('should handle program with no assignments', () => {
      const noAssign = createMockProgram({ assignments: [] });
      render(<ProgramCard {...defaultProps} program={noAssign} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle program with no weeks', () => {
      const noWeeks = createMockProgram({ weeks: [] });
      render(<ProgramCard {...defaultProps} program={noWeeks} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
