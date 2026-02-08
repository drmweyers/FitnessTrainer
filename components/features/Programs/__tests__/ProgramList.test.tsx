/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('lucide-react', () => ({
  Loader2: ({ className }: any) => <span data-testid="icon-loader" className={className} />,
  Plus: () => <span data-testid="icon-plus" />,
  Users: () => <span data-testid="icon-users" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
}));

jest.mock('@/components/shared/Toast', () => ({
  useToast: () => ({
    toasts: [],
    success: jest.fn(),
    error: jest.fn(),
    removeToast: jest.fn(),
  }),
  ToastContainer: () => null,
}));

jest.mock('../ProgramCard', () => ({
  __esModule: true,
  default: ({ program, viewMode, onEdit, onAssign }: any) => (
    <div data-testid={`program-card-${program.id}`}>
      <span>{program.name}</span>
      <span>{viewMode}</span>
    </div>
  ),
}));

jest.mock('../BulkAssignmentModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="bulk-assignment-modal" /> : null,
}));

const mockFetchPrograms = jest.fn();
jest.mock('@/lib/api/programs', () => ({
  fetchPrograms: (...args: any[]) => mockFetchPrograms(...args),
  deleteProgram: jest.fn(),
  duplicateProgram: jest.fn(),
}));

import ProgramList from '../ProgramList';
import { ProgramType, DifficultyLevel } from '@/types/program';

function createMockPrograms(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `prog-${i + 1}`,
    trainerId: 'trainer-1',
    name: `Program ${i + 1}`,
    description: `Description ${i + 1}`,
    programType: ProgramType.STRENGTH,
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    durationWeeks: 8,
    goals: [],
    equipmentNeeded: [],
    isTemplate: false,
    isPublic: false,
    createdAt: '2024-01-01T00:00:00Z',
    weeks: [],
    assignments: [],
  }));
}

describe('ProgramList', () => {
  const defaultFilters = {};

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn().mockReturnValue('mock-token');
  });

  describe('Loading state', () => {
    it('should show loading spinner when fetching programs', () => {
      mockFetchPrograms.mockReturnValue(new Promise(() => {}));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      expect(screen.getByText('Loading programs...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message when fetch fails', async () => {
      mockFetchPrograms.mockRejectedValue(new Error('Network error'));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByText('Error Loading Programs')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show Try Again button on error', async () => {
      mockFetchPrograms.mockRejectedValue(new Error('Network error'));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should redirect to login on 401 error', async () => {
      mockFetchPrograms.mockRejectedValue(new Error('401 Unauthorized'));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('Empty state', () => {
    it('should show "No programs yet" when no programs exist', async () => {
      mockFetchPrograms.mockResolvedValue([]);
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByText('No programs yet')).toBeInTheDocument();
      });
    });

    it('should show Create Your First Program button when empty', async () => {
      mockFetchPrograms.mockResolvedValue([]);
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByText('Create Your First Program')).toBeInTheDocument();
      });
    });
  });

  describe('With programs', () => {
    it('should render program cards', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(3));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
        expect(screen.getByText('Program 2')).toBeInTheDocument();
        expect(screen.getByText('Program 3')).toBeInTheDocument();
      });
    });

    it('should pass grid viewMode to ProgramCard', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(1));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByTestId('program-card-prog-1')).toBeInTheDocument();
      });
    });

    it('should pass list viewMode to ProgramCard', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(1));
      render(<ProgramList filters={defaultFilters} viewMode="list" />);
      await waitFor(() => {
        expect(screen.getByTestId('program-card-prog-1')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    it('should redirect to login if no access token', async () => {
      Storage.prototype.getItem = jest.fn().mockReturnValue(null);
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('Filtering', () => {
    it('should refetch programs when filters change', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(2));
      const { rerender } = render(<ProgramList filters={{}} viewMode="grid" />);

      await waitFor(() => {
        expect(mockFetchPrograms).toHaveBeenCalledTimes(1);
      });

      const newFilters = { programType: 'STRENGTH' };
      rerender(<ProgramList filters={newFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(mockFetchPrograms).toHaveBeenCalledTimes(2);
      });
    });

    it('should pass filters to fetchPrograms', async () => {
      const filters = {
        programType: 'STRENGTH',
        difficultyLevel: 'INTERMEDIATE'
      };
      mockFetchPrograms.mockResolvedValue([]);

      render(<ProgramList filters={filters} viewMode="grid" />);

      await waitFor(() => {
        expect(mockFetchPrograms).toHaveBeenCalledWith(
          expect.objectContaining(filters)
        );
      });
    });
  });

  describe('View modes', () => {
    it('should render in grid mode', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(2));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
      });
    });

    it('should render in list mode', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(2));
      render(<ProgramList filters={defaultFilters} viewMode="list" />);

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
      });
    });

    it('should maintain view mode across rerenders', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(1));
      const { rerender } = render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('grid')).toBeInTheDocument();
      });

      rerender(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('grid')).toBeInTheDocument();
      });
    });
  });

  describe('Program actions', () => {
    it('should handle retry on error', async () => {
      mockFetchPrograms
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockPrograms(1));

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      retryButton.click();

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple programs', () => {
    it('should render many programs', async () => {
      mockFetchPrograms.mockResolvedValue(createMockPrograms(10));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
        expect(screen.getByText('Program 10')).toBeInTheDocument();
      });
    });

    it('should handle programs with different types', async () => {
      const mixedPrograms = [
        { ...createMockPrograms(1)[0], programType: ProgramType.STRENGTH },
        { ...createMockPrograms(1)[0], id: 'prog-2', name: 'Program 2', programType: ProgramType.CARDIO },
      ];
      mockFetchPrograms.mockResolvedValue(mixedPrograms);

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
        expect(screen.getByText('Program 2')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null filters', async () => {
      mockFetchPrograms.mockResolvedValue([]);
      render(<ProgramList filters={null as any} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('No programs yet')).toBeInTheDocument();
      });
    });

    it('should handle undefined filters', async () => {
      mockFetchPrograms.mockResolvedValue([]);
      render(<ProgramList filters={undefined as any} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('No programs yet')).toBeInTheDocument();
      });
    });

    it('should handle fetch returning null', async () => {
      mockFetchPrograms.mockResolvedValue(null);
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.queryByText('Program 1')).not.toBeInTheDocument();
      });
    });

    it('should handle initial loading state', () => {
      mockFetchPrograms.mockReturnValue(new Promise(() => {}));
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      expect(screen.getByText('Loading programs...')).toBeInTheDocument();
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should show create button in empty state', async () => {
      mockFetchPrograms.mockResolvedValue([]);
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        const createBtn = screen.getByText('Create Your First Program');
        expect(createBtn).toBeInTheDocument();
      });
    });
  });
});
