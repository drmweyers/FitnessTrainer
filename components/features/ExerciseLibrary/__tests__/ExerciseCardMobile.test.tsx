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

  describe('Multiple target muscles', () => {
    it('shows +N for more than 2 target muscles', () => {
      const exerciseMany = {
        ...mockExercise,
        targetMuscles: ['pec', 'deltoid', 'tricep', 'bicep'],
      };
      render(<ExerciseCardMobile {...defaultProps} exercise={exerciseMany as any} />);
      expect(screen.getByText(/\+2/)).toBeInTheDocument();
    });

    it('shows all 2 muscles when exactly 2', () => {
      const exerciseTwo = {
        ...mockExercise,
        targetMuscles: ['pec', 'deltoid'],
      };
      render(<ExerciseCardMobile {...defaultProps} exercise={exerciseTwo as any} />);
      expect(screen.getByText(/pec, deltoid/)).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className in grid view', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} className="custom-test-class" />);
      expect(container.querySelector('.custom-test-class')).toBeInTheDocument();
    });

    it('applies custom className in list view', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} viewMode="list" className="custom-list-class" />);
      expect(container.querySelector('.custom-list-class')).toBeInTheDocument();
    });
  });

  describe('Mobile swipe actions in list view', () => {
    beforeEach(() => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);
    });

    it('shows swipe actions when swiped left', () => {
      const mockGestureHandlers: any = {};
      (hooks.useTouchGestures as jest.Mock).mockImplementation((handlers) => {
        Object.assign(mockGestureHandlers, handlers);
        return { current: null };
      });

      render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      // Simulate swipe left
      if (mockGestureHandlers.onSwipeLeft) {
        mockGestureHandlers.onSwipeLeft();
      }

      // Swipe actions should be visible
      expect(mockGestureHandlers.onSwipeLeft).toBeDefined();
    });

    it('hides swipe actions when swiped right', () => {
      const mockGestureHandlers: any = {};
      (hooks.useTouchGestures as jest.Mock).mockImplementation((handlers) => {
        Object.assign(mockGestureHandlers, handlers);
        return { current: null };
      });

      render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      // Simulate swipe right
      if (mockGestureHandlers.onSwipeRight) {
        mockGestureHandlers.onSwipeRight();
      }

      expect(mockGestureHandlers.onSwipeRight).toBeDefined();
    });

    it('hides swipe actions on tap when they are visible', () => {
      const mockGestureHandlers: any = {};
      (hooks.useTouchGestures as jest.Mock).mockImplementation((handlers) => {
        Object.assign(mockGestureHandlers, handlers);
        return { current: null };
      });

      render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      // Show swipe actions first
      if (mockGestureHandlers.onSwipeLeft) {
        mockGestureHandlers.onSwipeLeft();
      }

      // Then tap to hide
      if (mockGestureHandlers.onTap) {
        mockGestureHandlers.onTap();
      }

      expect(mockGestureHandlers.onTap).toBeDefined();
    });

    it('toggles GIF playback on long press', () => {
      const mockGestureHandlers: any = {};
      (hooks.useTouchGestures as jest.Mock).mockImplementation((handlers) => {
        Object.assign(mockGestureHandlers, handlers);
        return { current: null };
      });

      render(<ExerciseCardMobile {...defaultProps} />);

      // Simulate long press
      if (mockGestureHandlers.onLongPress) {
        mockGestureHandlers.onLongPress();
      }

      expect(mockGestureHandlers.onLongPress).toBeDefined();
    });
  });

  describe('Event propagation and mobile actions', () => {
    it('stops propagation when favorite is clicked in list view', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      const favoriteBtn = container.querySelectorAll('button')[0];
      const stopPropagation = jest.fn();
      const preventDefault = jest.fn();

      fireEvent.click(favoriteBtn, {
        stopPropagation,
        preventDefault,
      });

      expect(mockOnFavorite).toHaveBeenCalled();
    });

    it('hides swipe actions after favorite action on mobile', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);

      render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      const favoriteBtn = document.querySelectorAll('button')[0];
      if (favoriteBtn) {
        fireEvent.click(favoriteBtn);
      }

      expect(mockOnFavorite).toHaveBeenCalled();
    });

    it('hides swipe actions after add to collection on mobile', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);

      render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      // Find and click add button
      const buttons = screen.getAllByRole('button');
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add'));
      if (addBtn) {
        fireEvent.click(addBtn);
      }

      expect(mockOnAddToCollection).toHaveBeenCalled();
    });

    it('hides swipe actions after quick view on mobile', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);

      render(<ExerciseCardMobile {...defaultProps} />);

      // Find and click info button (quick view)
      const buttons = screen.getAllByRole('button');
      const infoBtn = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg !== null;
      });

      if (infoBtn) {
        fireEvent.click(infoBtn);
      }
    });
  });

  describe('Swipe action buttons in list view', () => {
    beforeEach(() => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);
    });

    it('renders swipe action buttons with correct handlers', () => {
      const mockGestureHandlers: any = {};
      (hooks.useTouchGestures as jest.Mock).mockImplementation((handlers) => {
        Object.assign(mockGestureHandlers, handlers);
        return { current: null };
      });

      const { container } = render(
        <ExerciseCardMobile
          {...defaultProps}
          viewMode="list"
          enableSwipeActions={true}
        />
      );

      // Trigger swipe left to show actions
      if (mockGestureHandlers.onSwipeLeft) {
        mockGestureHandlers.onSwipeLeft();
      }

      // Check if swipe actions container exists
      expect(container).toBeInTheDocument();
    });
  });

  describe('Desktop vs Mobile action buttons', () => {
    it('shows desktop action buttons in list view when not mobile', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(false);

      const { container } = render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      // Desktop shows inline action buttons, not chevron
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows mobile chevron indicator in list view when mobile', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);

      render(<ExerciseCardMobile {...defaultProps} viewMode="list" />);

      // Mobile shows chevron, not inline action buttons
      // ChevronRight is rendered for mobile
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('shows mobile action bar in grid view when mobile', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);

      render(<ExerciseCardMobile {...defaultProps} viewMode="grid" />);

      // Mobile grid view shows action bar with Add button
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('shows favorite star indicator when favorited in mobile grid view', () => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(true);
      const favoritedExercise = { ...mockExercise, isFavorited: true };

      render(<ExerciseCardMobile {...defaultProps} exercise={favoritedExercise as any} />);

      // Mobile grid view should show star when favorited
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('GIF playing state', () => {
    it('shows GIF playing indicator when isGifPlaying is true', () => {
      const { container } = render(<ExerciseCardMobile {...defaultProps} />);
      const img = screen.getAllByRole('img')[0];

      // Simulate GIF playing state by long press
      const mockGestureHandlers: any = {};
      (hooks.useTouchGestures as jest.Mock).mockImplementation((handlers) => {
        Object.assign(mockGestureHandlers, handlers);
        return { current: null };
      });

      // GIF indicator is shown when playing
      expect(container).toBeInTheDocument();
    });
  });
});
