/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseDetailView } from '../ExerciseDetailView';
import { ExerciseWithUserData } from '@/types/exercise';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock GifPlayer
jest.mock('../GifPlayer', () => ({
  GifPlayer: (props: any) => (
    <div data-testid="gif-player" data-exercise-name={props.exerciseName}>
      GIF Player
    </div>
  ),
}));

// Mock RelatedExercises
jest.mock('../RelatedExercises', () => ({
  RelatedExercises: (props: any) => (
    <div data-testid="related-exercises">Related Exercises</div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: (props: any) => <span data-testid="icon-play" {...props} />,
  Pause: (props: any) => <span data-testid="icon-pause" {...props} />,
  RotateCcw: (props: any) => <span data-testid="icon-reset" {...props} />,
  Target: (props: any) => <span data-testid="icon-target" {...props} />,
  Dumbbell: (props: any) => <span data-testid="icon-dumbbell" {...props} />,
  User: (props: any) => <span data-testid="icon-user" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  ChevronRight: (props: any) => <span data-testid="icon-chevron" {...props} />,
  Heart: ({ fill, ...props }: any) => <span data-testid="icon-heart" data-fill={fill} {...props} />,
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
  Share2: (props: any) => <span data-testid="icon-share" {...props} />,
  Download: (props: any) => <span data-testid="icon-download" {...props} />,
  Info: (props: any) => <span data-testid="icon-info" {...props} />,
  Zap: (props: any) => <span data-testid="icon-zap" {...props} />,
}));

const createMockExercise = (overrides: Partial<ExerciseWithUserData> = {}): ExerciseWithUserData => ({
  id: 'ex-uuid-1',
  exerciseId: '0001',
  name: '3/4 Sit-Up',
  gifUrl: '0001.gif',
  targetMuscles: ['abs'],
  bodyParts: ['waist'],
  equipments: ['body weight'],
  secondaryMuscles: ['hip flexors', 'obliques'],
  instructions: [
    'Step:1 Lie on your back with knees bent',
    'Step:2 Place hands behind your head',
    'Step:3 Lift torso to 3/4 of the way up',
    'Step:4 Lower back down slowly',
  ],
  difficulty: 'beginner',
  isFavorited: false,
  usageCount: 10,
  ...overrides,
});

describe('ExerciseDetailView', () => {
  const defaultExercise = createMockExercise();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the GIF player', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByTestId('gif-player')).toBeInTheDocument();
    });

    it('renders related exercises section', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByTestId('related-exercises')).toBeInTheDocument();
    });

    it('renders difficulty badge', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      // Difficulty label appears in the badge on the GIF player
      expect(screen.getAllByText('Beginner').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render difficulty when not provided', () => {
      const exercise = createMockExercise({ difficulty: undefined });
      render(<ExerciseDetailView exercise={exercise} />);
      expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
      expect(screen.queryByText('Intermediate')).not.toBeInTheDocument();
      expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ExerciseDetailView exercise={defaultExercise} className="custom-detail" />
      );
      expect(container.firstChild).toHaveClass('custom-detail');
    });
  });

  describe('Exercise Information', () => {
    it('renders exercise information heading', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Exercise Information')).toBeInTheDocument();
    });

    it('renders body parts', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Body Parts')).toBeInTheDocument();
      expect(screen.getByText('waist')).toBeInTheDocument();
    });

    it('renders equipment', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('body weight')).toBeInTheDocument();
    });

    it('renders primary muscles', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Primary Muscles')).toBeInTheDocument();
      expect(screen.getByText('abs')).toBeInTheDocument();
    });

    it('renders secondary muscles', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Secondary Muscles')).toBeInTheDocument();
      expect(screen.getByText('hip flexors')).toBeInTheDocument();
      expect(screen.getByText('obliques')).toBeInTheDocument();
    });

    it('does not render secondary muscles when empty', () => {
      const exercise = createMockExercise({ secondaryMuscles: [] });
      render(<ExerciseDetailView exercise={exercise} />);
      expect(screen.queryByText('Secondary Muscles')).not.toBeInTheDocument();
    });

    it('shows usage count when no difficulty', () => {
      const exercise = createMockExercise({ difficulty: undefined, usageCount: 15 });
      render(<ExerciseDetailView exercise={exercise} />);
      expect(screen.getByText('Usage')).toBeInTheDocument();
      expect(screen.getByText('15 times')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('renders Add to Favorites button', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });

    it('renders Favorited text when exercise is favorited', () => {
      const exercise = createMockExercise({ isFavorited: true });
      render(<ExerciseDetailView exercise={exercise} />);
      expect(screen.getByText('Favorited')).toBeInTheDocument();
    });

    it('renders Add to Collection button', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Add to Collection')).toBeInTheDocument();
    });

    it('calls onFavorite when favorite button is clicked', () => {
      const onFavorite = jest.fn();
      render(<ExerciseDetailView exercise={defaultExercise} onFavorite={onFavorite} />);
      fireEvent.click(screen.getByText('Add to Favorites'));
      expect(onFavorite).toHaveBeenCalledWith(defaultExercise.id);
    });

    it('calls onAddToCollection when collection button is clicked', () => {
      const onAddToCollection = jest.fn();
      render(
        <ExerciseDetailView exercise={defaultExercise} onAddToCollection={onAddToCollection} />
      );
      fireEvent.click(screen.getByText('Add to Collection'));
      expect(onAddToCollection).toHaveBeenCalledWith(defaultExercise.id);
    });
  });

  describe('Tab Navigation', () => {
    it('shows Instructions tab by default', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Step-by-Step Instructions')).toBeInTheDocument();
    });

    it('renders all 3 tabs', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Instructions')).toBeInTheDocument();
      expect(screen.getByText('Tips & Form')).toBeInTheDocument();
      expect(screen.getByText('Variations')).toBeInTheDocument();
    });

    it('switches to Tips tab when clicked', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      fireEvent.click(screen.getByText('Tips & Form'));
      expect(screen.getByText('Form Tips & Common Mistakes')).toBeInTheDocument();
      expect(screen.getByText('Proper Form')).toBeInTheDocument();
      expect(screen.getByText('Breathing')).toBeInTheDocument();
    });

    it('switches to Variations tab when clicked', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      fireEvent.click(screen.getByText('Variations'));
      expect(screen.getByText('Exercise Variations')).toBeInTheDocument();
      expect(screen.getByText('Full Sit-up')).toBeInTheDocument();
      expect(screen.getByText('Russian Twist')).toBeInTheDocument();
      expect(screen.getByText('Weighted 3/4 Sit-up')).toBeInTheDocument();
    });
  });

  describe('Instructions Tab', () => {
    it('renders all instruction steps', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Lie on your back with knees bent')).toBeInTheDocument();
      expect(screen.getByText('Place hands behind your head')).toBeInTheDocument();
      expect(screen.getByText('Lift torso to 3/4 of the way up')).toBeInTheDocument();
      expect(screen.getByText('Lower back down slowly')).toBeInTheDocument();
    });

    it('shows progress tracker', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed Steps')).toBeInTheDocument();
      expect(screen.getByText('0 / 4')).toBeInTheDocument();
    });

    it('toggles step completion when clicked', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      const step1 = screen.getByText('Lie on your back with knees bent');
      fireEvent.click(step1.closest('[class*="cursor-pointer"]')!);
      expect(screen.getByText('1 / 4')).toBeInTheDocument();
    });

    it('un-toggles step when clicked again', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      const step1 = screen.getByText('Lie on your back with knees bent');
      const stepEl = step1.closest('[class*="cursor-pointer"]')!;
      fireEvent.click(stepEl);
      expect(screen.getByText('1 / 4')).toBeInTheDocument();
      fireEvent.click(stepEl);
      expect(screen.getByText('0 / 4')).toBeInTheDocument();
    });

    it('shows Reset button when steps are completed', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      const step1 = screen.getByText('Lie on your back with knees bent');
      fireEvent.click(step1.closest('[class*="cursor-pointer"]')!);
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('does not show Reset button when no steps completed', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      expect(screen.queryByText('Reset')).not.toBeInTheDocument();
    });

    it('resets all steps when Reset is clicked', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      const step1 = screen.getByText('Lie on your back with knees bent');
      const step2 = screen.getByText('Place hands behind your head');
      fireEvent.click(step1.closest('[class*="cursor-pointer"]')!);
      fireEvent.click(step2.closest('[class*="cursor-pointer"]')!);
      expect(screen.getByText('2 / 4')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Reset'));
      expect(screen.getByText('0 / 4')).toBeInTheDocument();
    });
  });

  describe('Variations Tab', () => {
    it('renders variation difficulty badges', () => {
      render(<ExerciseDetailView exercise={defaultExercise} />);
      fireEvent.click(screen.getByText('Variations'));
      expect(screen.getAllByText('Intermediate').length).toBe(2);
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });
});
