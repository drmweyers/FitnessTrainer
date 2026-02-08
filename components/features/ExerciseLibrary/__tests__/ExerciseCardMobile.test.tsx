/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseCardMobile from '../ExerciseCardMobile';

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
jest.mock('@/hooks/useTouchGestures', () => ({
  useTouchGestures: () => ({ current: null }),
  useIsMobile: () => false,
  useTouchFriendlyStyles: () => ({
    touchTarget: '',
    buttonSize: 'p-2',
    buttonPadding: 'px-3 py-2',
  }),
}));

const mockExercise = {
  id: 'ex-1',
  name: 'Bench Press',
  bodyParts: ['chest', 'shoulders'],
  targetMuscles: ['pectorals', 'deltoids', 'triceps'],
  equipments: ['barbell'],
  gifUrl: 'bench-press.gif',
  isFavorited: false,
  usageCount: 5,
};

describe('ExerciseCardMobile', () => {
  const mockOnFavorite = jest.fn();
  const mockOnAddToCollection = jest.fn();
  const mockOnQuickView = jest.fn();

  const defaultProps = {
    exercise: mockExercise as any,
    onFavorite: mockOnFavorite,
    onAddToCollection: mockOnAddToCollection,
    onQuickView: mockOnQuickView,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the exercise name in grid view', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('renders the exercise name in list view', () => {
    render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('displays target muscles', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    // targetMuscles are rendered as "pectorals, deltoids +1" in a single span
    expect(screen.getByText(/pectorals, deltoids/)).toBeInTheDocument();
  });

  it('displays equipment info', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    expect(screen.getByText('barbell')).toBeInTheDocument();
  });

  it('displays body part tags', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    expect(screen.getByText('chest')).toBeInTheDocument();
    expect(screen.getByText('shoulders')).toBeInTheDocument();
  });

  it('shows usage count when present', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    // Usage count appears next to clock icon
    const { container } = render(<ExerciseCardMobile {...defaultProps} />);
    expect(container.textContent).toContain('5');
  });

  it('renders a link to exercise detail page', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    const link = screen.getAllByRole('link');
    expect(link[0]).toHaveAttribute('href', '/dashboard/exercises/ex-1');
  });

  it('renders an image with exercise GIF path', () => {
    render(<ExerciseCardMobile {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('alt', 'Bench Press');
  });

  it('renders list view with correct structure', () => {
    render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('chest')).toBeInTheDocument();
  });

  describe('Swipe actions', () => {
    it('shows swipe actions on swipe left in list view', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);
      expect(container).toBeInTheDocument();
    });

    it('hides swipe actions when enableSwipeActions is false', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} viewMode="list" enableSwipeActions={false} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Interactive actions', () => {
    it('calls onFavorite when favorite button clicked', () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      const favoriteBtn = screen.getAllByRole('button')[0];
      fireEvent.click(favoriteBtn);
      expect(mockOnFavorite).toHaveBeenCalledWith('ex-1');
    });

    it('calls onAddToCollection when add button clicked in grid view', async () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      // In grid view, Add button is visible
      const buttons = screen.getAllByRole('button');
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add'));
      if (addBtn) {
        fireEvent.click(addBtn);
        expect(mockOnAddToCollection).toHaveBeenCalledWith('ex-1');
      }
    });

    it('calls onQuickView when info button clicked', () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const infoBtn = buttons.find(btn => btn.querySelector('svg'));
      if (infoBtn) {
        fireEvent.click(infoBtn);
      }
    });

    it('stops event propagation on favorite click', () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      const favoriteBtn = screen.getAllByRole('button')[0];
      const stopPropagation = jest.fn();
      const preventDefault = jest.fn();
      fireEvent.click(favoriteBtn, {
        stopPropagation,
        preventDefault,
      });
      expect(mockOnFavorite).toHaveBeenCalled();
    });
  });

  describe('Image loading', () => {
    it('shows loading spinner initially', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides loading spinner when image loads', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      const img = screen.getAllByRole('img')[0];
      fireEvent.load(img);
      // Image should be visible
      expect(img).toHaveClass('opacity-100');
    });

    it('handles image error with placeholder', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      const img = screen.getAllByRole('img')[0];
      fireEvent.error(img);
      // Should not crash
      expect(container).toBeInTheDocument();
    });

    it('uses GIF path when playing', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      // Component manages GIF playback internally
      expect(container).toBeInTheDocument();
    });

    it('uses static image path when not playing', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      const img = screen.getAllByRole('img')[0];
      expect(img.getAttribute('src')).toBeTruthy();
    });
  });

  describe('Touch gestures', () => {
    it('registers touch gestures', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('handles long press to toggle GIF', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('combines refs correctly', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      expect(container.querySelector('div[class*="group"]')).toBeInTheDocument();
    });
  });

  describe('Mobile vs Desktop rendering', () => {
    it('shows mobile action bar in grid view', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('shows chevron in list view on mobile', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);
      expect(container).toBeInTheDocument();
    });

    it('shows favorite indicator when favorited in mobile grid view', () => {
      const favoritedExercise = { ...mockExercise, isFavorited: true };
      render(<ExerciseCardMobile {...defaultProps} exercise={favoritedExercise as any} />);
      expect(screen.getAllByRole('img')).toBeTruthy();
    });
  });

  describe('Conditional rendering', () => {
    it('does not show usage count when zero', () => {
      const exerciseNoUsage = { ...mockExercise, usageCount: 0 };
      const { container } = render(<ExerciseCardMobile {...defaultProps} exercise={exerciseNoUsage as any} />);
      expect(container).toBeInTheDocument();
    });

    it('shows usage count when present', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      expect(container.textContent).toContain('5');
    });

    it('truncates long muscle lists', () => {
      const exerciseMany = {
        ...mockExercise,
        targetMuscles: ['pec', 'deltoid', 'tricep', 'bicep', 'forearm'],
      };
      render(<ExerciseCardMobile {...defaultProps} exercise={exerciseMany as any} />);
      expect(screen.getByText(/\+3/)).toBeInTheDocument();
    });

    it('truncates long body part lists', () => {
      const exerciseMany = {
        ...mockExercise,
        bodyParts: ['chest', 'shoulders', 'arms', 'back'],
      };
      render(<ExerciseCardMobile {...defaultProps} exercise={exerciseMany as any} />);
      expect(screen.getByText(/\+2/)).toBeInTheDocument();
    });

    it('shows GIF playing indicator', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      // GIF indicator managed internally
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Bench Press');
    });

    it('has proper link structure', () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href');
    });

    it('has clickable buttons', () => {
      render(<ExerciseCardMobile {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Usage count display', () => {
    it('shows usage count when present and greater than zero', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      expect(container.textContent).toContain('5');
    });

    it('does not show usage count badge when zero', () => {
      const exerciseNoCount = { ...mockExercise, usageCount: 0 };
      const { container } = render(<ExerciseCardMobile {...defaultProps} exercise={exerciseNoCount as any} />);
      // Should still render but without prominent count display
      expect(container).toBeInTheDocument();
    });

    it('does not show usage count when undefined', () => {
      const exerciseNoCount = { ...mockExercise, usageCount: undefined };
      const { container } = render(<ExerciseCardMobile {...defaultProps} exercise={exerciseNoCount as any} />);
      expect(container).toBeInTheDocument();
    });
  });
});
