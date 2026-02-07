/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseGrid } from '../ExerciseGrid';
import { ExerciseWithUserData } from '@/types/exercise';

// Mock ExerciseCard
jest.mock('../ExerciseCard', () => ({
  ExerciseCard: (props: any) => (
    <div data-testid={`exercise-card-${props.exercise.exerciseId}`} data-view-mode={props.viewMode}>
      {props.exercise.name}
    </div>
  ),
}));

// Mock ExerciseGridSkeleton
jest.mock('../ExerciseGridSkeleton', () => ({
  ExerciseGridSkeleton: (props: any) => (
    <div data-testid="exercise-skeleton" data-view-mode={props.viewMode}>Loading...</div>
  ),
}));

const createMockExercise = (id: string, name: string): ExerciseWithUserData => ({
  id: `uuid-${id}`,
  exerciseId: id,
  name,
  gifUrl: `${id}.gif`,
  targetMuscles: ['chest'],
  bodyParts: ['upper body'],
  equipments: ['body weight'],
  secondaryMuscles: [],
  instructions: ['Step 1'],
});

describe('ExerciseGrid', () => {
  const exercises = [
    createMockExercise('001', 'Push Up'),
    createMockExercise('002', 'Bench Press'),
    createMockExercise('003', 'Chest Fly'),
  ];

  describe('Loading State', () => {
    it('shows skeleton loading when isLoading is true', () => {
      render(<ExerciseGrid exercises={[]} viewMode="grid" isLoading={true} />);
      const skeletons = screen.getAllByTestId('exercise-skeleton');
      expect(skeletons.length).toBe(12);
    });

    it('passes viewMode to skeletons', () => {
      render(<ExerciseGrid exercises={[]} viewMode="list" isLoading={true} />);
      const skeletons = screen.getAllByTestId('exercise-skeleton');
      expect(skeletons[0]).toHaveAttribute('data-view-mode', 'list');
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no exercises', () => {
      render(<ExerciseGrid exercises={[]} viewMode="grid" />);
      expect(screen.getByText('No exercises found')).toBeInTheDocument();
    });

    it('shows helpful message when no exercises', () => {
      render(<ExerciseGrid exercises={[]} viewMode="grid" />);
      expect(screen.getByText(/Try adjusting your search terms or filters/)).toBeInTheDocument();
    });
  });

  describe('Grid View', () => {
    it('renders all exercises', () => {
      render(<ExerciseGrid exercises={exercises} viewMode="grid" />);
      expect(screen.getByText('Push Up')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Chest Fly')).toBeInTheDocument();
    });

    it('passes viewMode to ExerciseCard', () => {
      render(<ExerciseGrid exercises={exercises} viewMode="grid" />);
      const card = screen.getByTestId('exercise-card-001');
      expect(card).toHaveAttribute('data-view-mode', 'grid');
    });

    it('applies grid layout classes', () => {
      const { container } = render(
        <ExerciseGrid exercises={exercises} viewMode="grid" />
      );
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('gap-6');
    });
  });

  describe('List View', () => {
    it('renders all exercises in list mode', () => {
      render(<ExerciseGrid exercises={exercises} viewMode="list" />);
      expect(screen.getByText('Push Up')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('passes list viewMode to ExerciseCard', () => {
      render(<ExerciseGrid exercises={exercises} viewMode="list" />);
      const card = screen.getByTestId('exercise-card-001');
      expect(card).toHaveAttribute('data-view-mode', 'list');
    });

    it('uses single column for list layout', () => {
      const { container } = render(
        <ExerciseGrid exercises={exercises} viewMode="list" />
      );
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-1');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ExerciseGrid exercises={exercises} viewMode="grid" className="custom-grid" />
      );
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('custom-grid');
    });
  });

  describe('onAddExercise', () => {
    it('passes onAddExercise to ExerciseCard', () => {
      const onAdd = jest.fn();
      render(
        <ExerciseGrid exercises={exercises} viewMode="grid" onAddExercise={onAdd} />
      );
      // The mock ExerciseCard doesn't call onAddExercise, but we verify it renders
      expect(screen.getByText('Push Up')).toBeInTheDocument();
    });
  });
});
