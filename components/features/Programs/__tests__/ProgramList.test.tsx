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
});
