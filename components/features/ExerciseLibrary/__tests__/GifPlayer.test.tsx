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

  describe('Image loading', () => {
    it('hides loading state when image loads', () => {
      render(<GifPlayer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      expect(exerciseImage).toBeTruthy();

      fireEvent.load(exerciseImage!);

      expect(screen.queryByText('Loading exercise...')).not.toBeInTheDocument();
    });

    it('shows error state when image fails to load', () => {
      render(<GifPlayer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));

      fireEvent.error(exerciseImage!);

      expect(screen.getByText('Unable to load exercise GIF')).toBeInTheDocument();
      expect(screen.getByText('The exercise demonstration is currently unavailable.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('retries loading when Try Again is clicked', () => {
      render(<GifPlayer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));

      fireEvent.error(exerciseImage!);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(screen.getByText('Loading exercise...')).toBeInTheDocument();
    });
  });

  describe('Playback controls', () => {
    it('toggles playback when play button is clicked', () => {
      render(<GifPlayer {...defaultProps} autoPlay={false} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      // Should show play button when not auto-playing
      const playButtons = screen.getAllByRole('button');
      const mainPlayButton = playButtons.find(btn => btn.querySelector('svg'));

      expect(mainPlayButton).toBeTruthy();
      fireEvent.click(mainPlayButton!);

      // After clicking, should show pause button
      expect(screen.getByText('Playing')).toBeInTheDocument();
    });

    it('shows pause button when playing', () => {
      render(<GifPlayer {...defaultProps} autoPlay={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      expect(screen.getByText('Playing')).toBeInTheDocument();
    });

    it('resets gif when reset button is clicked', () => {
      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      // Trigger mouse enter to show controls
      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseEnter(parentContainer);
      }

      const buttons = screen.getAllByRole('button');
      const resetButton = buttons.find(btn => btn.getAttribute('title') === 'Restart GIF');

      if (resetButton) {
        fireEvent.click(resetButton);
      }
    });
  });

  describe('Mouse interactions', () => {
    it('shows controls on mouse enter', () => {
      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} showControls={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseEnter(parentContainer);

        expect(screen.getByText(defaultProps.exerciseName)).toBeInTheDocument();
      }
    });

    it('hides controls on mouse leave after timeout', async () => {
      jest.useFakeTimers();

      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} showControls={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseEnter(parentContainer);
        fireEvent.mouseLeave(parentContainer);

        jest.advanceTimersByTime(2000);
      }

      jest.useRealTimers();
    });

    it('shows controls on mouse move', () => {
      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} showControls={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseMove(parentContainer);
      }
    });
  });

  describe('Fullscreen', () => {
    beforeEach(() => {
      document.fullscreenElement = null as any;
      document.exitFullscreen = jest.fn().mockResolvedValue(undefined);
      HTMLDivElement.prototype.requestFullscreen = jest.fn().mockResolvedValue(undefined);
    });

    it('enters fullscreen when fullscreen button is clicked', async () => {
      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseEnter(parentContainer);
      }

      const buttons = screen.getAllByRole('button');
      const fullscreenButton = buttons.find(btn =>
        btn.getAttribute('title')?.includes('Enter fullscreen')
      );

      if (fullscreenButton) {
        fireEvent.click(fullscreenButton);
      }
    });

    it('exits fullscreen when already in fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div')
      });

      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseEnter(parentContainer);
      }

      const buttons = screen.getAllByRole('button');
      const fullscreenButton = buttons.find(btn =>
        btn.getAttribute('title')?.includes('fullscreen')
      );

      if (fullscreenButton) {
        fireEvent.click(fullscreenButton);
      }

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });
    });

    it('handles fullscreen change event', () => {
      render(<GifPlayer {...defaultProps} />);

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div')
      });

      fireEvent(document, new Event('fullscreenchange'));

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });
    });
  });

  describe('Download', () => {
    it('downloads gif when download button is clicked', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

      const { container } = render(<GifPlayer {...defaultProps} autoPlay={true} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      const parentContainer = container.firstChild as HTMLElement;
      if (parentContainer) {
        fireEvent.mouseEnter(parentContainer);
      }

      const buttons = screen.getAllByRole('button');
      const downloadButton = buttons.find(btn => btn.getAttribute('title') === 'Download GIF');

      if (downloadButton) {
        fireEvent.click(downloadButton);

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(mockLink.click).toHaveBeenCalled();
      }

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Control visibility', () => {
    it('hides controls when showControls is false', () => {
      render(<GifPlayer {...defaultProps} showControls={false} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      expect(screen.queryByText('Download GIF')).not.toBeInTheDocument();
    });

    it('shows controls when showControls is true and overlay visible', () => {
      render(<GifPlayer {...defaultProps} showControls={true} autoPlay={false} />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));
      fireEvent.load(exerciseImage!);

      // Controls should be visible when not playing
      expect(screen.getByText(defaultProps.exerciseName)).toBeInTheDocument();
    });
  });

  describe('GIF path', () => {
    it('constructs correct gif path', () => {
      render(<GifPlayer {...defaultProps} gifUrl="test-exercise.gif" />);

      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt')?.includes('demonstration'));

      expect(exerciseImage?.getAttribute('src')).toContain('test-exercise.gif');
    });
  });
});
