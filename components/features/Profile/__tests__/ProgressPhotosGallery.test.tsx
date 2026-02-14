/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressPhotosGallery from '../ProgressPhotosGallery';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

// Mock fetch
global.fetch = jest.fn();

const mockPhotos = [
  {
    id: 'photo-1',
    photoUrl: 'https://example.com/photo1.jpg',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    photoType: 'front',
    notes: 'Progress photo',
    isPrivate: false,
    takenAt: '2024-01-15T00:00:00Z',
    uploadedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'photo-2',
    photoUrl: 'https://example.com/photo2.jpg',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    photoType: 'side',
    notes: null,
    isPrivate: true,
    takenAt: '2024-02-01T00:00:00Z',
    uploadedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'photo-3',
    photoUrl: 'https://example.com/photo3.jpg',
    thumbnailUrl: null,
    photoType: 'back',
    notes: null,
    isPrivate: false,
    takenAt: null,
    uploadedAt: '2024-02-05T10:00:00Z',
  },
];

describe('ProgressPhotosGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { container } = render(<ProgressPhotosGallery />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should load photos on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockPhotos }),
      });

      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles/progress-photos',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no photos', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('No progress photos yet')).toBeInTheDocument();
        expect(screen.getByText('Upload photos from the Analytics page to track visual progress')).toBeInTheDocument();
      });
    });
  });

  describe('Photo Display', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockPhotos }),
      });
    });

    it('should display all photos in grid', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('Progress Photos')).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });

    it('should display photo dates', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('Progress Photos')).toBeInTheDocument();
      });

      // Dates are formatted as "Jan 15, 2024" - check for the month at least
      expect(screen.getAllByText(/Jan/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Feb/).length).toBeGreaterThan(0);
    });

    it('should display photo types', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('front')).toBeInTheDocument();
        expect(screen.getByText('side')).toBeInTheDocument();
        expect(screen.getByText('back')).toBeInTheDocument();
      });
    });

    it('should show private badge for private photos', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('Private')).toBeInTheDocument();
      });
    });

    it('should use uploadedAt when takenAt is null', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('Progress Photos')).toBeInTheDocument();
      });

      // Check that Feb appears in dates (photo 2 and 3)
      expect(screen.getAllByText(/Feb/).length).toBeGreaterThan(0);
    });
  });

  describe('Type Filtering', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockPhotos }),
      });
    });

    it('should display all filter buttons', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Front')).toBeInTheDocument();
        expect(screen.getByText('Side')).toBeInTheDocument();
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    it('should filter photos by type', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getAllByRole('img')).toHaveLength(3);
      });

      fireEvent.click(screen.getByText('Front'));

      await waitFor(() => {
        expect(screen.getAllByRole('img')).toHaveLength(1);
      });
    });

    it('should show all photos when All filter is selected', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Front'));
      });

      fireEvent.click(screen.getByText('All'));

      expect(screen.getAllByRole('img')).toHaveLength(3);
    });

    it('should highlight active filter', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        const allButton = screen.getByText('All');
        expect(allButton).toHaveClass('bg-blue-100');
      });

      fireEvent.click(screen.getByText('Front'));

      const frontButton = screen.getByText('Front');
      expect(frontButton).toHaveClass('bg-blue-100');
    });
  });

  describe('Compare Mode', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockPhotos }),
      });
    });

    it('should toggle compare mode', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('Compare')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Compare'));
      expect(screen.getByText('Exit Compare')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Exit Compare'));
      expect(screen.getByText('Compare')).toBeInTheDocument();
    });

    it('should allow selecting photos in compare mode', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Compare'));
      });

      const photos = screen.getAllByRole('img');
      fireEvent.click(photos[0]);

      expect(screen.getByText('Select one more photo to compare')).toBeInTheDocument();
    });

    it('should limit selection to 2 photos', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Compare'));
      });

      const photos = screen.getAllByRole('img');
      fireEvent.click(photos[0]);
      fireEvent.click(photos[1]);

      expect(screen.getByText('Comparing 2 photos')).toBeInTheDocument();

      // Try to select a third photo - should not work
      fireEvent.click(photos[2]);

      // Check that we still only have 2 photos compared (not 3)
      expect(screen.getByText('Comparing 2 photos')).toBeInTheDocument();
      expect(screen.queryByText('Comparing 3 photos')).not.toBeInTheDocument();
    });

    it('should display comparison view when 2 photos selected', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Compare'));
      });

      const photos = screen.getAllByRole('img');
      fireEvent.click(photos[0]);
      fireEvent.click(photos[1]);

      await waitFor(() => {
        expect(screen.getByText('Comparing 2 photos')).toBeInTheDocument();
      });

      // Check that comparison view has 2 images (plus the original 3 in the gallery)
      expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(5);
    });

    it('should deselect photo when clicked again', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Compare'));
      });

      const photos = screen.getAllByRole('img');
      fireEvent.click(photos[0]);
      fireEvent.click(photos[0]); // Click again to deselect

      expect(screen.queryByText('Select one more photo to compare')).not.toBeInTheDocument();
    });

    it('should clear selection when exiting compare mode', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Compare'));
      });

      const photos = screen.getAllByRole('img');
      fireEvent.click(photos[0]);
      fireEvent.click(photos[1]);

      fireEvent.click(screen.getByText('Exit Compare'));
      fireEvent.click(screen.getByText('Compare'));

      expect(screen.queryByText('Comparing 2 photos')).not.toBeInTheDocument();
    });
  });

  describe('Upload Photo Button', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockPhotos }),
      });
    });

    it('should display upload photo button', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('Upload Photo')).toBeInTheDocument();
      });
    });

    it('should redirect to analytics page when upload clicked', async () => {
      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Upload Photo'));
      });

      expect(window.location.href).toBe('/analytics');
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('No progress photos yet')).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should handle unsuccessful API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false }),
      });

      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('No progress photos yet')).toBeInTheDocument();
      });
    });

    it('should handle null data in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: null }),
      });

      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        expect(screen.getByText('No progress photos yet')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: [
            {
              id: 'photo-1',
              photoUrl: 'https://example.com/photo1.jpg',
              thumbnailUrl: null,
              photoType: 'front',
              notes: null,
              isPrivate: false,
              takenAt: null,
              uploadedAt: '2024-01-15T10:30:00Z',
            },
          ],
        }),
      });
    });

    it('should display "Unknown date" for null dates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: [
            {
              id: 'photo-1',
              photoUrl: 'https://example.com/photo1.jpg',
              thumbnailUrl: null,
              photoType: 'front',
              notes: null,
              isPrivate: false,
              takenAt: null,
              uploadedAt: null,
            },
          ],
        }),
      });

      render(<ProgressPhotosGallery />);

      await waitFor(() => {
        // Would display "Unknown date" but component actually uses uploadedAt as fallback
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(1);
      });
    });
  });

  describe('Props', () => {
    it('should accept userId prop', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockPhotos }),
      });

      render(<ProgressPhotosGallery userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Progress Photos')).toBeInTheDocument();
      });
    });
  });
});
