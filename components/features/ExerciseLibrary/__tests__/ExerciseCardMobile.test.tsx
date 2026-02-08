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
});
