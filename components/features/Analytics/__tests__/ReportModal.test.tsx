/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportModal from '../ReportModal';

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

describe('ReportModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(<ReportModal isOpen={false} onClose={mockOnClose} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Progress Report')).toBeInTheDocument();
    });

    it('should render date inputs with default values', () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;

      expect(startDateInput).toBeInTheDocument();
      expect(endDateInput).toBeInTheDocument();
      expect(startDateInput.value).toBeTruthy(); // Should have a default value (1 month ago)
      expect(endDateInput.value).toBeTruthy(); // Should have a default value (today)
    });

    it('should render generate report button', () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('should allow changing start date', () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;

      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      expect(startDateInput.value).toBe('2024-01-01');
    });

    it('should allow changing end date', () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;

      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      expect(endDateInput.value).toBe('2024-12-31');
    });
  });

  describe('Report Generation', () => {
    const mockReportData = {
      id: 'report-1',
      generatedAt: '2024-02-10T12:00:00Z',
      period: { startDate: '2024-01-01', endDate: '2024-01-31' },
      summary: {
        totalWorkouts: 20,
        completedWorkouts: 18,
        completionRate: 90,
        totalDurationMinutes: 1200,
        totalVolume: 15000,
        averageRpe: 7.5,
      },
      workouts: [],
      measurements: [
        { weight: 80, bodyFat: 15, muscleMass: 68, date: '2024-01-15' },
      ],
      goals: [
        {
          type: 'weight_loss',
          specific: 'Lose 5kg',
          target: 75,
          targetDate: '2024-03-01',
          latestProgress: { value: 78, percentage: 60 },
        },
      ],
    };

    it('should generate report on button click', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockReportData }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      const generateButton = screen.getByText('Generate Report');

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/analytics/reports',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
      });
    });

    it('should display loading state while generating', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ json: async () => ({ success: true, data: mockReportData }) }), 100))
      );

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      const generateButton = screen.getByText('Generate Report');

      fireEvent.click(generateButton);

      expect(screen.getByText('Generating Report...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });

    it('should display report after successful generation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockReportData }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Workout Summary')).toBeInTheDocument();
      });

      expect(screen.getByText('18')).toBeInTheDocument(); // Completed workouts
      expect(screen.getByText('90%')).toBeInTheDocument(); // Completion rate
    });

    it('should display error message on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Failed to generate report' }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Failed to generate report')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Failed to generate report')).toBeInTheDocument();
      });
    });
  });

  describe('Report Display', () => {
    const mockReportData = {
      id: 'report-1',
      generatedAt: '2024-02-10T12:00:00Z',
      period: { startDate: '2024-01-01', endDate: '2024-01-31' },
      summary: {
        totalWorkouts: 20,
        completedWorkouts: 18,
        completionRate: 90,
        totalDurationMinutes: 1200,
        totalVolume: 15000,
        averageRpe: 7.5,
      },
      workouts: [],
      measurements: [
        { weight: 80, bodyFat: 15, muscleMass: 68, date: '2024-01-15' },
      ],
      goals: [
        {
          type: 'weight_loss',
          specific: 'Lose 5kg',
          target: 75,
          targetDate: '2024-03-01',
          latestProgress: { value: 78, percentage: 60 },
        },
      ],
    };

    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockReportData }),
      });
    });

    it('should display workout summary statistics', async () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('18')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
        expect(screen.getByText('20h')).toBeInTheDocument();
      });
    });

    it('should display body measurements if available', async () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Body Measurements')).toBeInTheDocument();
        expect(screen.getByText('80 kg')).toBeInTheDocument();
      });
    });

    it('should display active goals if available', async () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Active Goals')).toBeInTheDocument();
        expect(screen.getByText('weight loss')).toBeInTheDocument();
        expect(screen.getByText('60%')).toBeInTheDocument();
      });
    });

    it('should allow generating another report', async () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Generate Another')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Generate Another'));
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: '' }); // SVG button

      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear report when closing modal', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            id: 'report-1',
            generatedAt: '2024-02-10T12:00:00Z',
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
            summary: {
              totalWorkouts: 20,
              completedWorkouts: 18,
              completionRate: 90,
              totalDurationMinutes: 1200,
              totalVolume: 15000,
              averageRpe: 7.5,
            },
            workouts: [],
            measurements: [],
            goals: [],
          },
        }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle report with no measurements', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            id: 'report-1',
            generatedAt: '2024-02-10T12:00:00Z',
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
            summary: {
              totalWorkouts: 20,
              completedWorkouts: 18,
              completionRate: 90,
              totalDurationMinutes: 0,
              totalVolume: 0,
              averageRpe: 0,
            },
            workouts: [],
            measurements: [],
            goals: [],
          },
        }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.queryByText('Body Measurements')).not.toBeInTheDocument();
      });
    });

    it('should handle report with no goals', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            id: 'report-1',
            generatedAt: '2024-02-10T12:00:00Z',
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
            summary: {
              totalWorkouts: 20,
              completedWorkouts: 18,
              completionRate: 90,
              totalDurationMinutes: 1200,
              totalVolume: 15000,
              averageRpe: 7.5,
            },
            workouts: [],
            measurements: [],
            goals: [],
          },
        }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.queryByText('Active Goals')).not.toBeInTheDocument();
      });
    });

    it('should display N/A for zero volume and RPE', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            id: 'report-1',
            generatedAt: '2024-02-10T12:00:00Z',
            period: { startDate: '2024-01-01', endDate: '2024-01-31' },
            summary: {
              totalWorkouts: 20,
              completedWorkouts: 18,
              completionRate: 90,
              totalDurationMinutes: 0,
              totalVolume: 0,
              averageRpe: 0,
            },
            workouts: [],
            measurements: [],
            goals: [],
          },
        }),
      });

      render(<ReportModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getAllByText('N/A')).toHaveLength(2);
      });
    });
  });
});
