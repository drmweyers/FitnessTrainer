/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseLibrary } from '../ExerciseLibrary';

jest.mock('../ExerciseGrid', () => ({
  ExerciseGrid: ({ exercises, viewMode, onAddExercise }: any) => (
    <div data-testid="exercise-grid">
      {exercises.map((e: any) => (
        <div key={e.id} data-testid={`exercise-${e.id}`}>{e.name}</div>
      ))}
    </div>
  ),
}));

jest.mock('../ExerciseGridSkeleton', () => ({
  ExerciseGridSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

const mockExercises = [
  { id: 'ex-1', name: 'Bench Press', muscleGroup: 'chest' },
  { id: 'ex-2', name: 'Squat', muscleGroup: 'legs' },
];

describe('ExerciseLibrary', () => {
  const defaultProps = {
    exercises: mockExercises as any,
    viewMode: 'grid' as const,
    currentPage: 1,
    totalPages: 3,
    hasNextPage: true,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when loading', () => {
    render(<ExerciseLibrary {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders exercise grid when not loading', () => {
    render(<ExerciseLibrary {...defaultProps} />);
    expect(screen.getByTestId('exercise-grid')).toBeInTheDocument();
  });

  it('renders exercises in the grid', () => {
    render(<ExerciseLibrary {...defaultProps} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
  });

  it('renders pagination when totalPages > 1', () => {
    render(<ExerciseLibrary {...defaultProps} />);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('renders Previous and Next buttons', () => {
    render(<ExerciseLibrary {...defaultProps} />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('disables Previous on first page', () => {
    render(<ExerciseLibrary {...defaultProps} currentPage={1} />);
    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('disables Next when no next page', () => {
    render(<ExerciseLibrary {...defaultProps} hasNextPage={false} />);
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('calls onPageChange when Next is clicked', () => {
    render(<ExerciseLibrary {...defaultProps} />);
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when Previous is clicked', () => {
    render(<ExerciseLibrary {...defaultProps} currentPage={2} />);
    fireEvent.click(screen.getByText('Previous'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('does not render pagination when totalPages is 1', () => {
    render(<ExerciseLibrary {...defaultProps} totalPages={1} />);
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
  });

  it('renders no results message when exercises empty', () => {
    render(<ExerciseLibrary {...defaultProps} exercises={[]} />);
    expect(screen.getByText('No exercises found matching your criteria')).toBeInTheDocument();
  });

  it('renders page number buttons', () => {
    render(<ExerciseLibrary {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const pageButtons = buttons.filter(b => /^\d+$/.test(b.textContent || ''));
    expect(pageButtons.length).toBeGreaterThanOrEqual(3);
  });
});
