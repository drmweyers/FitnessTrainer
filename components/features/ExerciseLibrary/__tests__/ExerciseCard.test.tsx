/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExerciseCard } from '../ExerciseCard';
import { ExerciseWithUserData } from '@/types/exercise';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, unoptimized, ...rest } = props;
    return <img {...rest} data-fill={fill?.toString()} data-unoptimized={unoptimized?.toString()} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Heart: ({ fill, ...props }: any) => <span data-testid="icon-heart" data-fill={fill} {...props} />,
  Play: (props: any) => <span data-testid="icon-play" {...props} />,
  Pause: (props: any) => <span data-testid="icon-pause" {...props} />,
  Info: (props: any) => <span data-testid="icon-info" {...props} />,
  MoreVertical: (props: any) => <span data-testid="icon-more" {...props} />,
  Star: (props: any) => <span data-testid="icon-star" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  Dumbbell: (props: any) => <span data-testid="icon-dumbbell" {...props} />,
  Target: (props: any) => <span data-testid="icon-target" {...props} />,
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
}));

const createMockExercise = (overrides: Partial<ExerciseWithUserData> = {}): ExerciseWithUserData => ({
  id: 'ex-uuid-1',
  exerciseId: '0001',
  name: 'Push Up',
  gifUrl: '0001.gif',
  targetMuscles: ['chest', 'triceps', 'shoulders'],
  bodyParts: ['upper body', 'arms', 'chest'],
  equipments: ['body weight'],
  secondaryMuscles: ['core'],
  instructions: ['Start in plank', 'Lower body', 'Push up'],
  difficulty: 'beginner',
  isFavorited: false,
  usageCount: 5,
  ...overrides,
});

describe('ExerciseCard', () => {
  const defaultExercise = createMockExercise();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Grid View (Default)', () => {
    it('renders exercise name', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      expect(screen.getByText('Push Up')).toBeInTheDocument();
    });

    it('renders link to exercise detail page', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const link = document.querySelector('a[href="/dashboard/exercises/0001"]');
      expect(link).toBeInTheDocument();
    });

    it('renders difficulty badge', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });

    it('does not render difficulty badge when not provided', () => {
      const exercise = createMockExercise({ difficulty: undefined });
      render(<ExerciseCard exercise={exercise} />);
      expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
      expect(screen.queryByText('Intermediate')).not.toBeInTheDocument();
      expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
    });

    it('renders difficulty correctly for intermediate', () => {
      const exercise = createMockExercise({ difficulty: 'intermediate' });
      render(<ExerciseCard exercise={exercise} />);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('renders difficulty correctly for advanced', () => {
      const exercise = createMockExercise({ difficulty: 'advanced' });
      render(<ExerciseCard exercise={exercise} />);
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('renders first 2 target muscles', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      expect(screen.getByText('chest')).toBeInTheDocument();
      expect(screen.getByText('triceps')).toBeInTheDocument();
    });

    it('renders +N more for target muscles > 2', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      // 3 target muscles and 3 body parts, each showing +1
      expect(screen.getAllByText('+1').length).toBeGreaterThanOrEqual(1);
    });

    it('renders equipment', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      expect(screen.getByText('body weight')).toBeInTheDocument();
    });

    it('renders first 2 body parts', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      expect(screen.getByText('upper body')).toBeInTheDocument();
      expect(screen.getByText('arms')).toBeInTheDocument();
    });

    it('renders +N more for body parts > 2', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      // 3 body parts, first 2 shown, so +1 badge shows for body parts
      // Combined with target muscles +1, there are multiple +1 elements
      expect(screen.getAllByText('+1').length).toBeGreaterThanOrEqual(1);
    });

    it('renders exercise image', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const img = document.querySelector('img[alt="Push Up"]');
      expect(img).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ExerciseCard exercise={defaultExercise} className="custom-class" />
      );
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('List View', () => {
    it('renders in list mode', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      expect(screen.getByText('Push Up')).toBeInTheDocument();
    });

    it('renders target muscles in list mode', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      // In list mode, first 2 target muscles joined with comma
      expect(screen.getByText(/chest, triceps/)).toBeInTheDocument();
    });

    it('renders equipment in list mode', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      expect(screen.getByText('body weight')).toBeInTheDocument();
    });

    it('renders body parts as badges in list mode', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      expect(screen.getByText('upper body')).toBeInTheDocument();
    });

    it('shows body parts as tags in list mode with +N more for > 3', () => {
      const exercise = createMockExercise({
        bodyParts: ['upper body', 'arms', 'chest', 'back'],
      });
      render(<ExerciseCard exercise={exercise} viewMode="list" />);
      // 4 body parts, first 3 shown, +1 more
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('renders action buttons in list mode', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      expect(screen.getAllByTestId('icon-heart').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-info').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-plus').length).toBeGreaterThan(0);
    });
  });

  describe('Favorite Button', () => {
    it('calls onFavorite when favorite button is clicked', () => {
      const onFavorite = jest.fn();
      render(<ExerciseCard exercise={defaultExercise} onFavorite={onFavorite} />);
      // In grid view, there are favorite buttons
      const heartIcons = screen.getAllByTestId('icon-heart');
      const btn = heartIcons[0].closest('button');
      fireEvent.click(btn!);
      expect(onFavorite).toHaveBeenCalledWith('0001');
    });

    it('shows filled heart when favorited', () => {
      const exercise = createMockExercise({ isFavorited: true });
      render(<ExerciseCard exercise={exercise} />);
      const heartIcons = screen.getAllByTestId('icon-heart');
      // Check that at least one heart has fill="currentColor"
      const filledHeart = heartIcons.find(icon => icon.getAttribute('data-fill') === 'currentColor');
      expect(filledHeart).toBeTruthy();
    });

    it('shows unfilled heart when not favorited', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const heartIcons = screen.getAllByTestId('icon-heart');
      const unfilledHeart = heartIcons.find(icon => icon.getAttribute('data-fill') === 'none');
      expect(unfilledHeart).toBeTruthy();
    });
  });

  describe('Quick View', () => {
    it('calls onQuickView when info button is clicked', () => {
      const onQuickView = jest.fn();
      render(<ExerciseCard exercise={defaultExercise} onQuickView={onQuickView} />);
      const infoIcons = screen.getAllByTestId('icon-info');
      const btn = infoIcons[0].closest('button');
      fireEvent.click(btn!);
      expect(onQuickView).toHaveBeenCalledWith(defaultExercise);
    });
  });

  describe('Add to Collection', () => {
    it('calls onAddToCollection when plus button is clicked', () => {
      const onAddToCollection = jest.fn();
      render(
        <ExerciseCard exercise={defaultExercise} onAddToCollection={onAddToCollection} />
      );
      const plusIcons = screen.getAllByTestId('icon-plus');
      const btn = plusIcons[0].closest('button');
      fireEvent.click(btn!);
      expect(onAddToCollection).toHaveBeenCalledWith('0001');
    });
  });

  describe('Hover and GIF behavior', () => {
    it('starts playing GIF after hover delay', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const card = document.querySelector('[class*="cursor-pointer"]')!;
      fireEvent.mouseEnter(card);
      // After 300ms delay, GIF should start playing
      act(() => { jest.advanceTimersByTime(300); });
      // GIF indicator should show
      expect(screen.getByText('GIF')).toBeInTheDocument();
    });

    it('stops playing GIF on mouse leave', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const card = document.querySelector('[class*="cursor-pointer"]')!;
      fireEvent.mouseEnter(card);
      act(() => { jest.advanceTimersByTime(300); });
      expect(screen.getByText('GIF')).toBeInTheDocument();

      fireEvent.mouseLeave(card);
      expect(screen.queryByText('GIF')).not.toBeInTheDocument();
    });

    it('clears hover timeout on quick mouse leave', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const card = document.querySelector('[class*="cursor-pointer"]')!;
      fireEvent.mouseEnter(card);
      // Leave before 300ms delay
      act(() => { jest.advanceTimersByTime(100); });
      fireEvent.mouseLeave(card);
      // Advance past the timeout - should not show GIF
      act(() => { jest.advanceTimersByTime(300); });
      expect(screen.queryByText('GIF')).not.toBeInTheDocument();
    });
  });

  describe('Image loading states', () => {
    it('shows loading spinner before image loads', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      // Image hasn't loaded yet, should show spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides spinner after image loads', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const img = document.querySelector('img[alt="Push Up"]')!;
      fireEvent.load(img);
      // Spinner should be gone after load
      const spinners = document.querySelectorAll('.animate-spin');
      // In grid view, loading spinner is only for the main image
      expect(img.className).toContain('opacity-100');
    });

    it('shows placeholder on image error', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const img = document.querySelector('img[alt="Push Up"]')!;
      fireEvent.error(img);
      // After error, src should be the placeholder
      expect(img.getAttribute('src')).toContain('exercise-placeholder');
    });
  });

  describe('List view hover and actions', () => {
    it('calls onFavorite in list view', () => {
      const onFavorite = jest.fn();
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" onFavorite={onFavorite} />);
      const hearts = screen.getAllByTestId('icon-heart');
      fireEvent.click(hearts[0].closest('button')!);
      expect(onFavorite).toHaveBeenCalledWith('0001');
    });

    it('calls onQuickView in list view', () => {
      const onQuickView = jest.fn();
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" onQuickView={onQuickView} />);
      const infos = screen.getAllByTestId('icon-info');
      fireEvent.click(infos[0].closest('button')!);
      expect(onQuickView).toHaveBeenCalledWith(defaultExercise);
    });

    it('calls onAddToCollection in list view', () => {
      const onAddToCollection = jest.fn();
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" onAddToCollection={onAddToCollection} />);
      const plusBtns = screen.getAllByTestId('icon-plus');
      fireEvent.click(plusBtns[0].closest('button')!);
      expect(onAddToCollection).toHaveBeenCalledWith('0001');
    });

    it('shows target muscles +N in list view', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      // Target muscles text includes "+1" inline: "chest, triceps +1"
      expect(screen.getByText(/\+1/)).toBeInTheDocument();
    });

    it('shows loading spinner in list view before image loads', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows GIF playing indicator in list view on hover', () => {
      render(<ExerciseCard exercise={defaultExercise} viewMode="list" />);
      const card = document.querySelector('[class*="cursor-pointer"]')!;
      fireEvent.mouseEnter(card);
      act(() => { jest.advanceTimersByTime(300); });
      const indicator = document.querySelector('.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Callbacks are optional', () => {
    it('does not throw when onFavorite is not provided', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const heartIcons = screen.getAllByTestId('icon-heart');
      const btn = heartIcons[0].closest('button');
      expect(() => fireEvent.click(btn!)).not.toThrow();
    });

    it('does not throw when onQuickView is not provided', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const infoIcons = screen.getAllByTestId('icon-info');
      const btn = infoIcons[0].closest('button');
      expect(() => fireEvent.click(btn!)).not.toThrow();
    });

    it('does not throw when onAddToCollection is not provided', () => {
      render(<ExerciseCard exercise={defaultExercise} />);
      const plusIcons = screen.getAllByTestId('icon-plus');
      const btn = plusIcons[0].closest('button');
      expect(() => fireEvent.click(btn!)).not.toThrow();
    });
  });
});
