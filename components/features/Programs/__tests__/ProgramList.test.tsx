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
  default: ({ program, viewMode, onEdit, onDuplicate, onDelete, onAssign }: any) => (
    <div data-testid={`program-card-${program.id}`}>
      <span>{program.name}</span>
      <span>{viewMode}</span>
      <button onClick={() => onEdit(program)} data-testid={`edit-${program.id}`}>Edit</button>
      <button onClick={() => onDuplicate(program)} data-testid={`duplicate-${program.id}`}>Duplicate</button>
      <button onClick={() => onDelete(program)} data-testid={`delete-${program.id}`}>Delete</button>
      <button onClick={() => onAssign(program)} data-testid={`assign-${program.id}`}>Assign</button>
    </div>
  ),
}));

jest.mock('../BulkAssignmentModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="bulk-assignment-modal" /> : null,
}));

const mockFetchPrograms = jest.fn();
const mockDeleteProgram = jest.fn();
const mockDuplicateProgram = jest.fn();
jest.mock('@/lib/api/programs', () => ({
  fetchPrograms: (...args: any[]) => mockFetchPrograms(...args),
  deleteProgram: (...args: any[]) => mockDeleteProgram(...args),
  duplicateProgram: (...args: any[]) => mockDuplicateProgram(...args),
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
          expect.any(String), // token
          expect.objectContaining(filters) // filters
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

    it('should handle generic error without Error instance', async () => {
      mockFetchPrograms.mockRejectedValue('String error');
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to load programs')).toBeInTheDocument();
      });
    });
  });

  describe('Client-side filtering', () => {
    const programsWithVariety = [
      {
        id: 'prog-1',
        trainerId: 'trainer-1',
        name: 'Strength Builder',
        description: 'Build muscle strength',
        programType: ProgramType.STRENGTH,
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        durationWeeks: 8,
        goals: ['muscle gain', 'strength'],
        equipmentNeeded: ['barbell', 'dumbbells'],
        isTemplate: false,
        isPublic: false,
        createdAt: '2024-01-01T00:00:00Z',
        weeks: [],
        assignments: [],
      },
      {
        id: 'prog-2',
        trainerId: 'trainer-1',
        name: 'Cardio Master',
        description: 'Improve cardiovascular endurance',
        programType: ProgramType.CARDIO,
        difficultyLevel: DifficultyLevel.BEGINNER,
        durationWeeks: 4,
        goals: ['endurance', 'weight loss'],
        equipmentNeeded: ['treadmill'],
        isTemplate: true,
        isPublic: true,
        createdAt: '2024-02-01T00:00:00Z',
        weeks: [],
        assignments: [],
      },
    ];

    it('should filter by search term in name', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ search: 'strength' }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Strength Builder')).toBeInTheDocument();
        expect(screen.queryByText('Cardio Master')).not.toBeInTheDocument();
      });
    });

    it('should filter by search term in description', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ search: 'cardiovascular' }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.queryByText('Strength Builder')).not.toBeInTheDocument();
        expect(screen.getByText('Cardio Master')).toBeInTheDocument();
      });
    });

    it('should filter by search term in goals', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ search: 'endurance' }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.queryByText('Strength Builder')).not.toBeInTheDocument();
        expect(screen.getByText('Cardio Master')).toBeInTheDocument();
      });
    });

    it('should filter by search term in equipment', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ search: 'barbell' }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Strength Builder')).toBeInTheDocument();
        expect(screen.queryByText('Cardio Master')).not.toBeInTheDocument();
      });
    });

    it('should filter by programType', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ programType: ProgramType.CARDIO }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.queryByText('Strength Builder')).not.toBeInTheDocument();
        expect(screen.getByText('Cardio Master')).toBeInTheDocument();
      });
    });

    it('should filter by difficultyLevel', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ difficultyLevel: DifficultyLevel.BEGINNER }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.queryByText('Strength Builder')).not.toBeInTheDocument();
        expect(screen.getByText('Cardio Master')).toBeInTheDocument();
      });
    });

    it('should filter by isTemplate=true', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ isTemplate: true }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.queryByText('Strength Builder')).not.toBeInTheDocument();
        expect(screen.getByText('Cardio Master')).toBeInTheDocument();
      });
    });

    it('should filter by isTemplate=false', async () => {
      mockFetchPrograms.mockResolvedValue(programsWithVariety);
      render(<ProgramList filters={{ isTemplate: false }} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Strength Builder')).toBeInTheDocument();
        expect(screen.queryByText('Cardio Master')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    const programsForSorting = [
      {
        id: 'prog-1',
        trainerId: 'trainer-1',
        name: 'Zebra Program',
        description: 'Last alphabetically',
        programType: ProgramType.STRENGTH,
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        durationWeeks: 8,
        goals: [],
        equipmentNeeded: [],
        isTemplate: false,
        isPublic: false,
        createdAt: '2024-03-01T00:00:00Z',
        weeks: [],
        assignments: [],
      },
      {
        id: 'prog-2',
        trainerId: 'trainer-1',
        name: 'Alpha Program',
        description: 'First alphabetically',
        programType: ProgramType.CARDIO,
        difficultyLevel: DifficultyLevel.BEGINNER,
        durationWeeks: 4,
        goals: [],
        equipmentNeeded: [],
        isTemplate: false,
        isPublic: false,
        createdAt: '2024-01-01T00:00:00Z',
        weeks: [],
        assignments: [],
      },
    ];

    it('should sort by name ascending', async () => {
      mockFetchPrograms.mockResolvedValue(programsForSorting);
      render(<ProgramList filters={{ sortBy: 'name', sortOrder: 'asc' }} viewMode="grid" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/program-card/);
        expect(cards[0]).toHaveTextContent('Alpha Program');
        expect(cards[1]).toHaveTextContent('Zebra Program');
      });
    });

    it('should sort by name descending', async () => {
      mockFetchPrograms.mockResolvedValue(programsForSorting);
      render(<ProgramList filters={{ sortBy: 'name', sortOrder: 'desc' }} viewMode="grid" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/program-card/);
        expect(cards[0]).toHaveTextContent('Zebra Program');
        expect(cards[1]).toHaveTextContent('Alpha Program');
      });
    });

    it('should sort by createdAt ascending', async () => {
      mockFetchPrograms.mockResolvedValue(programsForSorting);
      render(<ProgramList filters={{ sortBy: 'createdAt', sortOrder: 'asc' }} viewMode="grid" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/program-card/);
        expect(cards[0]).toHaveTextContent('Alpha Program'); // Earlier date
        expect(cards[1]).toHaveTextContent('Zebra Program'); // Later date
      });
    });

    it('should sort by createdAt descending (default)', async () => {
      mockFetchPrograms.mockResolvedValue(programsForSorting);
      render(<ProgramList filters={{}} viewMode="grid" />);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/program-card/);
        expect(cards[0]).toHaveTextContent('Zebra Program'); // Later date
        expect(cards[1]).toHaveTextContent('Alpha Program'); // Earlier date
      });
    });
  });

  describe('Program actions - Edit', () => {
    it('should navigate to edit page when edit is clicked', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('edit-prog-1').click();
      expect(mockPush).toHaveBeenCalledWith('/programs/prog-1/edit');
    });
  });

  describe('Program actions - Duplicate', () => {
    beforeEach(() => {
      window.confirm = jest.fn();
    });

    it('should duplicate program and reload list', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      mockDuplicateProgram.mockResolvedValue({ id: 'prog-1-copy' });

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('duplicate-prog-1').click();

      await waitFor(() => {
        expect(mockDuplicateProgram).toHaveBeenCalledWith('prog-1', 'mock-token', 'Program 1 (Copy)');
        expect(mockFetchPrograms).toHaveBeenCalledTimes(2); // Initial + reload
      });
    });

    it('should redirect to login if no token when duplicating', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      Storage.prototype.getItem = jest.fn().mockReturnValueOnce('mock-token').mockReturnValueOnce(null);

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('duplicate-prog-1').click();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should handle duplicate error with Error instance', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      mockDuplicateProgram.mockRejectedValue(new Error('Duplicate failed'));

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('duplicate-prog-1').click();

      await waitFor(() => {
        expect(screen.getByText('Duplicate failed')).toBeInTheDocument();
      });
    });

    it('should handle duplicate error with generic error', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      mockDuplicateProgram.mockRejectedValue('String error');

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('duplicate-prog-1').click();

      await waitFor(() => {
        expect(screen.getByText('Failed to duplicate program')).toBeInTheDocument();
      });
    });
  });

  describe('Program actions - Delete', () => {
    beforeEach(() => {
      window.confirm = jest.fn();
    });

    it('should not delete if user cancels confirmation', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      (window.confirm as jest.Mock).mockReturnValue(false);

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('delete-prog-1').click();

      expect(mockDeleteProgram).not.toHaveBeenCalled();
    });

    it('should delete program and remove from list when confirmed', async () => {
      const programs = createMockPrograms(2);
      mockFetchPrograms.mockResolvedValue(programs);
      (window.confirm as jest.Mock).mockReturnValue(true);
      mockDeleteProgram.mockResolvedValue({});

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument();
        expect(screen.getByText('Program 2')).toBeInTheDocument();
      });

      screen.getByTestId('delete-prog-1').click();

      await waitFor(() => {
        expect(mockDeleteProgram).toHaveBeenCalledWith('prog-1', 'mock-token');
        expect(screen.queryByText('Program 1')).not.toBeInTheDocument();
        expect(screen.getByText('Program 2')).toBeInTheDocument();
      });
    });

    it('should redirect to login if no token when deleting', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      (window.confirm as jest.Mock).mockReturnValue(true);
      Storage.prototype.getItem = jest.fn().mockReturnValueOnce('mock-token').mockReturnValueOnce(null);

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('delete-prog-1').click();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should handle delete error with Error instance and reload programs', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      (window.confirm as jest.Mock).mockReturnValue(true);
      mockDeleteProgram.mockRejectedValue(new Error('Delete failed'));

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('delete-prog-1').click();

      await waitFor(() => {
        expect(mockDeleteProgram).toHaveBeenCalledWith('prog-1', 'mock-token');
        expect(mockFetchPrograms).toHaveBeenCalledTimes(2); // Initial + reload after error
      });
    });

    it('should handle delete error with generic error and reload programs', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);
      (window.confirm as jest.Mock).mockReturnValue(true);
      mockDeleteProgram.mockRejectedValue('String error');

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-prog-1')).toBeInTheDocument();
      });

      screen.getByTestId('delete-prog-1').click();

      await waitFor(() => {
        expect(mockDeleteProgram).toHaveBeenCalledWith('prog-1', 'mock-token');
        expect(mockFetchPrograms).toHaveBeenCalledTimes(2); // Initial + reload after error
      });
    });
  });

  describe('Program actions - Assign', () => {
    it('should open bulk assignment modal when assign is clicked', async () => {
      const programs = createMockPrograms(1);
      mockFetchPrograms.mockResolvedValue(programs);

      render(<ProgramList filters={defaultFilters} viewMode="grid" />);

      await waitFor(() => {
        expect(screen.getByTestId('assign-prog-1')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('bulk-assignment-modal')).not.toBeInTheDocument();

      screen.getByTestId('assign-prog-1').click();

      await waitFor(() => {
        expect(screen.getByTestId('bulk-assignment-modal')).toBeInTheDocument();
      });
    });
  });
});
