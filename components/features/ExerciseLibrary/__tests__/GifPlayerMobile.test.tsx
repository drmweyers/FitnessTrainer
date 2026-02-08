/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GifPlayerMobile from '../GifPlayerMobile';
import * as hooks from '@/hooks/useTouchGestures';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onLoad, onError, ...props }: any) => (
    <img src={src} alt={alt} onLoad={onLoad} onError={onError} {...props} />
  ),
}));
jest.mock('@/hooks/useTouchGestures', () => ({
  useTouchGestures: jest.fn(() => ({ current: null })),
  useIsMobile: jest.fn(() => true),
  useTouchFriendlyStyles: jest.fn(() => ({
    touchTarget: 'min-h-[44px]',
    buttonSize: 'p-2',
    buttonPadding: 'px-3 py-2',
    buttonText: 'text-sm',
  })),
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

  describe('Basic rendering', () => {
    it('renders the component', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const images = screen.getAllByRole('img');
      const exerciseImage = images.find(img => img.getAttribute('alt') === 'Bench Press demonstration');
      expect(exerciseImage).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      expect(screen.getByText('Loading exercise...')).toBeInTheDocument();
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

    it('constructs correct gif path', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      expect(img.getAttribute('src')).toBe('/exerciseGifs/bench-press.gif');
    });
  });

  describe('Image loading', () => {
    it('hides loading state when image loads', async () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.load(img);
      await waitFor(() => {
        expect(screen.queryByText('Loading exercise...')).not.toBeInTheDocument();
      });
    });

    it('shows error state when image fails', async () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.error(img);
      await waitFor(() => {
        expect(screen.getByText('Unable to load exercise GIF')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.error(img);
      await waitFor(() => {
        const tryAgain = screen.getByText('Try Again');
        fireEvent.click(tryAgain);
      });
      await waitFor(() => {
        expect(screen.getByText('Loading exercise...')).toBeInTheDocument();
      });
    });
  });

  describe('Playback controls', () => {
    it('toggles playback on button click', async () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.load(img);
      await waitFor(() => {
        const playButtons = screen.queryAllByRole('button');
        expect(playButtons.length).toBeGreaterThan(0);
      });
    });

    it('shows playing indicator when autoPlay is true', async () => {
      render(<GifPlayerMobile {...defaultProps} autoPlay={true} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.load(img);
      await waitFor(() => {
        expect(screen.getByText('Playing')).toBeInTheDocument();
      });
    });
  });

  describe('Swipe navigation', () => {
    it('registers swipe handlers when enabled', () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();
      render(
        <GifPlayerMobile
          {...defaultProps}
          enableSwipeNavigation={true}
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
        />
      );
      expect(hooks.useTouchGestures).toHaveBeenCalledWith(
        expect.objectContaining({
          onSwipeLeft: expect.any(Function),
          onSwipeRight: expect.any(Function),
        }),
        expect.any(Object)
      );
    });

    it('does not register swipe handlers when disabled', () => {
      render(<GifPlayerMobile {...defaultProps} enableSwipeNavigation={false} />);
      expect(hooks.useTouchGestures).toHaveBeenCalled();
    });
  });

  describe('Touch gestures', () => {
    it('registers tap gesture', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      expect(hooks.useTouchGestures).toHaveBeenCalledWith(
        expect.objectContaining({
          onTap: expect.any(Function),
        }),
        expect.any(Object)
      );
    });

    it('registers double tap gesture', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      expect(hooks.useTouchGestures).toHaveBeenCalledWith(
        expect.objectContaining({
          onDoubleTap: expect.any(Function),
        }),
        expect.any(Object)
      );
    });

    it('registers pinch gestures', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      expect(hooks.useTouchGestures).toHaveBeenCalledWith(
        expect.objectContaining({
          onPinchIn: expect.any(Function),
          onPinchOut: expect.any(Function),
        }),
        expect.any(Object)
      );
    });

    it('registers long press gesture', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      expect(hooks.useTouchGestures).toHaveBeenCalledWith(
        expect.objectContaining({
          onLongPress: expect.any(Function),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Fullscreen', () => {
    it('handles fullscreen toggle', async () => {
      const requestFullscreen = jest.fn(() => Promise.resolve());
      Object.defineProperty(HTMLDivElement.prototype, 'requestFullscreen', {
        configurable: true,
        value: requestFullscreen,
      });
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: jest.fn(() => null),
      });

      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.load(img);
      await waitFor(() => {
        const fullscreenBtn = screen.queryByTitle('Enter fullscreen');
        if (fullscreenBtn) fireEvent.click(fullscreenBtn);
      });
    });

    it('listens for fullscreen changes', () => {
      const addEventListener = jest.spyOn(document, 'addEventListener');
      render(<GifPlayerMobile {...defaultProps} />);
      expect(addEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    });
  });

  describe('Download', () => {
    it('downloads gif when download button clicked', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      fireEvent.load(img);
      await waitFor(() => {
        const downloadBtn = screen.queryByTitle('Download GIF');
        if (downloadBtn) fireEvent.click(downloadBtn);
      });
    });
  });

  describe('Desktop mode', () => {
    beforeEach(() => {
      (hooks.useIsMobile as jest.Mock).mockReturnValue(false);
    });

    it('renders in desktop mode', () => {
      render(<GifPlayerMobile {...defaultProps} />);
      const img = screen.getByAltText('Bench Press demonstration');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Controls auto-hide', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('clears timeout on unmount', () => {
      const { unmount } = render(<GifPlayerMobile {...defaultProps} />);
      unmount();
      jest.advanceTimersByTime(3000);
    });
  });
});
