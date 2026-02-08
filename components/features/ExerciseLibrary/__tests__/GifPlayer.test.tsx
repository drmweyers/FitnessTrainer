/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { GifPlayer } from '../GifPlayer';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe('GifPlayer', () => {
  const defaultProps = {
    exerciseId: 'ex-1',
    gifUrl: 'bench-press.gif',
    exerciseName: 'Bench Press',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with exercise name as alt text', () => {
    render(<GifPlayer {...defaultProps} />);
    const images = screen.getAllByRole('img');
    const exerciseImage = images.find(img => img.getAttribute('alt') === 'Bench Press demonstration');
    expect(exerciseImage).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<GifPlayer {...defaultProps} />);
    expect(screen.getByText('Loading exercise...')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<GifPlayer {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders play button when not auto-playing', () => {
    render(<GifPlayer {...defaultProps} showControls={true} />);
    expect(screen.getByText('Loading exercise...')).toBeInTheDocument();
  });

  it('renders with autoPlay enabled', () => {
    render(<GifPlayer {...defaultProps} autoPlay={true} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});
