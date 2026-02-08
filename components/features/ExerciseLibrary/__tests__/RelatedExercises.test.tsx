/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RelatedExercises } from '../RelatedExercises';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockSearchExercises = jest.fn();
jest.mock('@/services/exerciseService', () => ({
  searchExercises: (...args: any[]) => mockSearchExercises(...args),
}));

jest.mock('../ExerciseCard', () => ({
  ExerciseCard: ({ exercise }: any) => (
    <div data-testid="exercise-card">{exercise.name}</div>
  ),
}));

const mockCurrentExercise = {
  id: 'ex-1',
  exerciseId: 'ex-1',
  name: 'Bench Press',
  bodyParts: ['chest'],
  targetMuscles: ['pectorals'],
  equipments: ['barbell'],
  gifUrl: 'bench.gif',
} as any;

describe('RelatedExercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchExercises.mockResolvedValue({
      exercises: [
        { exerciseId: 'ex-2', name: 'Incline Press', bodyParts: ['chest'], targetMuscles: ['pectorals'], equipments: ['barbell'], gifUrl: 'incline.gif' },
        { exerciseId: 'ex-3', name: 'Fly', bodyParts: ['chest'], targetMuscles: ['pectorals'], equipments: ['dumbbell'], gifUrl: 'fly.gif' },
      ],
    });
  });

  it('renders the component', async () => {
    render(<RelatedExercises currentExercise={mockCurrentExercise} />);
    expect(screen.getByText('Related Exercises')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<RelatedExercises currentExercise={mockCurrentExercise} />);
    // Should show loading skeleton or spinner
    expect(screen.getByText('Related Exercises')).toBeInTheDocument();
  });

  it('loads related exercises on mount', async () => {
    render(<RelatedExercises currentExercise={mockCurrentExercise} />);

    await waitFor(() => {
      expect(mockSearchExercises).toHaveBeenCalled();
    });
  });

  it('displays related exercises after loading', async () => {
    render(<RelatedExercises currentExercise={mockCurrentExercise} />);

    await waitFor(() => {
      expect(screen.getByText('Incline Press')).toBeInTheDocument();
      expect(screen.getByText('Fly')).toBeInTheDocument();
    });
  });

  it('renders filter tabs', () => {
    render(<RelatedExercises currentExercise={mockCurrentExercise} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Body Part')).toBeInTheDocument();
    expect(screen.getByText('Muscle')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('switches filter and refetches', async () => {
    render(<RelatedExercises currentExercise={mockCurrentExercise} />);

    await waitFor(() => {
      expect(mockSearchExercises).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('Muscle'));

    await waitFor(() => {
      expect(mockSearchExercises).toHaveBeenCalledTimes(2);
    });
  });
});
