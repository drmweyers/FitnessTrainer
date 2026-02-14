/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileCompletionWidget from '../ProfileCompletionWidget';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

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

// Mock fetch
global.fetch = jest.fn();

describe('ProfileCompletionWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Loading State', () => {
    it('should not render during loading', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { container } = render(<ProfileCompletionWidget />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render if API call fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should not render if no completion data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      });

      const { container } = render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('100% Complete Profile', () => {
    it('should not render when profile is 100% complete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 100,
              basicInfo: true,
              profilePhoto: true,
              healthInfo: true,
              goalsSet: true,
              measurements: true,
            },
          },
        }),
      });

      const { container } = render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Incomplete Profile Display', () => {
    const mockPartialCompletion = {
      success: true,
      data: {
        profileCompletion: {
          completionPercentage: 60,
          basicInfo: true,
          profilePhoto: true,
          healthInfo: true,
          goalsSet: false,
          measurements: false,
        },
      },
    };

    it('should render widget for incomplete profile', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPartialCompletion,
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      });
    });

    it('should display completion percentage', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPartialCompletion,
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument();
      });
    });

    it('should display progress bar with correct width', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPartialCompletion,
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-yellow-500');
        expect(progressBar).toHaveStyle({ width: '60%' });
      });
    });

    it('should show missing items', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPartialCompletion,
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
        expect(screen.getByText('Body Measurements')).toBeInTheDocument();
      });
    });

    it('should show completed items section', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockPartialCompletion,
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
        expect(screen.getByText('Profile Photo')).toBeInTheDocument();
        expect(screen.getByText('Health Information')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Bar Color', () => {
    it('should show red color for 0-25% completion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 20,
              basicInfo: true,
              profilePhoto: false,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-red-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show orange color for 25-50% completion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 40,
              basicInfo: true,
              profilePhoto: true,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-orange-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show yellow color for 50-75% completion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 60,
              basicInfo: true,
              profilePhoto: true,
              healthInfo: true,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-yellow-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show green color for 75-99% completion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 80,
              basicInfo: true,
              profilePhoto: true,
              healthInfo: true,
              goalsSet: true,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-green-500');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Checklist Items', () => {
    it('should display all checklist items with correct links', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 0,
              basicInfo: false,
              profilePhoto: false,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
        expect(screen.getByText('Profile Photo')).toBeInTheDocument();
        expect(screen.getByText('Health Information')).toBeInTheDocument();
        expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
        expect(screen.getByText('Body Measurements')).toBeInTheDocument();
      });

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
    });

    it('should show descriptions for checklist items', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 0,
              basicInfo: false,
              profilePhoto: false,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.getByText('Add bio, date of birth, gender')).toBeInTheDocument();
        expect(screen.getByText('Upload a profile picture')).toBeInTheDocument();
        expect(screen.getByText('Add medical history and health data')).toBeInTheDocument();
        expect(screen.getByText('Set your fitness goals')).toBeInTheDocument();
        expect(screen.getByText('Record your first measurement')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch profile completion from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 50,
              basicInfo: true,
              profilePhoto: true,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles/me',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
      });
    });

    it('should handle API error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { container } = render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing localStorage token', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 50,
              basicInfo: true,
              profilePhoto: false,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles/me',
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('should not show completed section if no items completed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            profileCompletion: {
              completionPercentage: 0,
              basicInfo: false,
              profilePhoto: false,
              healthInfo: false,
              goalsSet: false,
              measurements: false,
            },
          },
        }),
      });

      render(<ProfileCompletionWidget />);

      await waitFor(() => {
        expect(screen.queryByText('Completed')).not.toBeInTheDocument();
      });
    });
  });
});
