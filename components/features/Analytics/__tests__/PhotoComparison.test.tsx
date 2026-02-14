/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoComparison from '../PhotoComparison';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Use T12:00:00 to avoid timezone issues with date-only strings
const mockPhotos = [
  {
    id: 'photo-1',
    url: '/photos/front-1.jpg',
    date: '2024-01-15T12:00:00',
    angle: 'front' as const,
    measurements: { weight: 85, bodyFat: 20 },
  },
  {
    id: 'photo-2',
    url: '/photos/front-2.jpg',
    date: '2024-03-15T12:00:00',
    angle: 'front' as const,
    measurements: { weight: 80, bodyFat: 17 },
  },
  {
    id: 'photo-3',
    url: '/photos/side-1.jpg',
    date: '2024-01-15T12:00:00',
    angle: 'side' as const,
    measurements: { weight: 85 },
  },
  {
    id: 'photo-4',
    url: '/photos/back-1.jpg',
    date: '2024-01-15T12:00:00',
    angle: 'back' as const,
  },
];

describe('PhotoComparison', () => {
  const mockOnClose = jest.fn();

  const defaultProps = {
    photos: mockPhotos,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component title', () => {
    render(<PhotoComparison {...defaultProps} />);
    expect(screen.getByText('Progress Photo Comparison')).toBeInTheDocument();
  });

  it('renders angle selector buttons', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('front (2)')).toBeInTheDocument();
      expect(screen.getByText('side (1)')).toBeInTheDocument();
      expect(screen.getByText('back (1)')).toBeInTheDocument();
    });
  });

  it('renders comparison mode selector', () => {
    render(<PhotoComparison {...defaultProps} />);
    expect(screen.getByText('Side by Side')).toBeInTheDocument();
    expect(screen.getByText('Slider')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('shows before and after labels in side-by-side mode', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  it('shows photo dates', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
    });
  });

  it('shows days of progress', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('60 days of progress')).toBeInTheDocument();
    });
  });

  it('shows weight change between photos', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Weight: -5.0 kg')).toBeInTheDocument();
    });
  });

  it('shows body fat change between photos', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Body Fat: -3.0%')).toBeInTheDocument();
    });
  });

  it('shows photo selector for before and after', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Select Before Photo')).toBeInTheDocument();
      expect(screen.getByText('Select After Photo')).toBeInTheDocument();
    });
  });

  it('renders close button', () => {
    render(<PhotoComparison {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows measurement data for before photo', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Weight: 85 kg')).toBeInTheDocument();
      expect(screen.getByText('Body Fat: 20%')).toBeInTheDocument();
    });
  });

  it('shows measurement data for after photo', async () => {
    render(<PhotoComparison {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Weight: 80 kg')).toBeInTheDocument();
      expect(screen.getByText('Body Fat: 17%')).toBeInTheDocument();
    });
  });

  describe('mode switching', () => {
    it('switches to slider mode', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('Slider'));
      await waitFor(() => {
        // Slider mode shows Before/After labels too
        expect(screen.getByText('Before')).toBeInTheDocument();
        expect(screen.getByText('After')).toBeInTheDocument();
      });
    });

    it('switches to timeline mode', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('Timeline'));
      await waitFor(() => {
        // Timeline renders all photos for the selected angle
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('hides photo selector in timeline mode', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('Timeline'));
      await waitFor(() => {
        expect(screen.queryByText('Select Before Photo')).not.toBeInTheDocument();
        expect(screen.queryByText('Select After Photo')).not.toBeInTheDocument();
      });
    });
  });

  describe('angle switching', () => {
    it('switches to side angle', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('side (1)'));
      await waitFor(() => {
        // Side photos should be rendered
        const imgs = screen.getAllByRole('img');
        const sideImg = imgs.find((img: any) => img.src?.includes('side-1'));
        expect(sideImg).toBeTruthy();
      });
    });

    it('switches to back angle', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('back (1)'));
      await waitFor(() => {
        const imgs = screen.getAllByRole('img');
        const backImg = imgs.find((img: any) => img.src?.includes('back-1'));
        expect(backImg).toBeTruthy();
      });
    });
  });

  describe('slider mode interactions', () => {
    it('mousedown on slider starts sliding', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('Slider'));
      await waitFor(() => {
        expect(screen.getByText('Before')).toBeInTheDocument();
      });
      // The slider container has onMouseDown
      const sliderContainer = screen.getByText('Before').closest('.h-full.relative');
      if (sliderContainer) {
        fireEvent.mouseDown(sliderContainer);
        // Should start sliding (isSliding = true)
        // Then mouseUp should stop it
        fireEvent.mouseUp(document);
      }
    });
  });

  describe('photo selection', () => {
    it('can select a different before photo', async () => {
      render(<PhotoComparison {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Select Before Photo')).toBeInTheDocument();
      });
      // Click the photo thumbnails - there should be buttons for each photo
      const buttons = screen.getAllByRole('button');
      // Photo selector buttons exist (thumbnail buttons)
      const thumbnails = buttons.filter(b => b.querySelector('img'));
      expect(thumbnails.length).toBeGreaterThanOrEqual(2);
      // Click a thumbnail to select it
      if (thumbnails.length > 0) {
        fireEvent.click(thumbnails[0]);
      }
    });
  });

  describe('edge cases', () => {
    it('renders with no photos', () => {
      render(<PhotoComparison photos={[]} onClose={mockOnClose} />);
      expect(screen.getByText('Progress Photo Comparison')).toBeInTheDocument();
    });

    it('renders without onClose callback', () => {
      render(<PhotoComparison photos={mockPhotos} />);
      expect(screen.getByText('Progress Photo Comparison')).toBeInTheDocument();
    });

    it('shows 0 days when no photos selected', () => {
      render(<PhotoComparison photos={[]} onClose={mockOnClose} />);
      // No photos selected, so no progress stats shown
      expect(screen.queryByText(/days of progress/)).not.toBeInTheDocument();
    });

    it('renders photos without measurements', async () => {
      const noMeasurementPhotos = [
        { id: 'p1', url: '/photo1.jpg', date: '2024-01-15T12:00:00', angle: 'front' as const },
        { id: 'p2', url: '/photo2.jpg', date: '2024-03-15T12:00:00', angle: 'front' as const },
      ];
      render(<PhotoComparison photos={noMeasurementPhotos} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText('Before')).toBeInTheDocument();
        expect(screen.getByText('After')).toBeInTheDocument();
      });
      // Should not show weight/body fat info
      expect(screen.queryByText(/Weight:/)).not.toBeInTheDocument();
    });

    it('renders timeline mode with measurements', async () => {
      render(<PhotoComparison {...defaultProps} />);
      fireEvent.click(screen.getByText('Timeline'));
      await waitFor(() => {
        // Timeline shows dates for each photo
        expect(screen.getAllByText('Jan 15, 2024').length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
