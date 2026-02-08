/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import GifPlayerMobile from '../GifPlayerMobile';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock('@/hooks/useTouchGestures', () => ({
  useTouchGestures: () => ({ current: null }),
  useIsMobile: () => true,
  useTouchFriendlyStyles: () => ({
    touchTarget: '',
    buttonSize: 'p-2',
    buttonPadding: 'px-3 py-2',
  }),
}));

describe('GifPlayerMobile', () => {
  const defaultProps = {
    exerciseId: 'ex-1',
    gifUrl: 'bench-press.gif',
    exerciseName: 'Bench Press',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component', () => {
    render(<GifPlayerMobile {...defaultProps} />);
    const images = screen.getAllByRole('img');
    const exerciseImage = images.find(img => img.getAttribute('alt') === 'Bench Press');
    expect(exerciseImage).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<GifPlayerMobile {...defaultProps} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<GifPlayerMobile {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with autoPlay', () => {
    render(<GifPlayerMobile {...defaultProps} autoPlay={true} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('renders with controls hidden', () => {
    render(<GifPlayerMobile {...defaultProps} showControls={false} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});
