/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgramList } from '../ProgramList';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/programs',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  Grid3X3: () => <span data-testid="icon-grid" />,
  List: () => <span data-testid="icon-list" />,
  MoreVertical: () => <span data-testid="icon-more" />,
  Copy: () => <span data-testid="icon-copy" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Edit: () => <span data-testid="icon-edit" />,
  UserPlus: () => <span data-testid="icon-user-plus" />,
}));

const mockDeleteMutateAsync = jest.fn();
const mockDuplicateMutateAsync = jest.fn();

const mockPrograms = [
  {
    id: 'prog-1',
    name: 'Strength Builder',
    description: 'Build strength with compound movements',
    programType: 'STRENGTH',
    difficultyLevel: 'INTERMEDIATE',
    durationWeeks: 12,
    isActive: true,
  },
  {
    id: 'prog-2',
    name: 'Hypertrophy Max',
    description: '',
    programType: 'HYPERTROPHY',
    difficultyLevel: 'ADVANCED',
    durationWeeks: 8,
    isActive: true,
  },
];

const mockUsePrograms = jest.fn();

jest.mock('@/hooks/usePrograms', () => ({
  usePrograms: (...args: any[]) => mockUsePrograms(...args),
  useDeleteProgram: () => ({ mutateAsync: mockDeleteMutateAsync }),
  useDuplicateProgram: () => ({ mutateAsync: mockDuplicateMutateAsync }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, ...props }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
      <input
        data-testid={`select-trigger-${value || 'all'}`}
        type="hidden"
        onChange={(e: any) => onValueChange && onValueChange(e.target.value)}
      />
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => <input onChange={onChange} {...props} />,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, asChild, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('ProgramList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrograms.mockReturnValue({
      data: mockPrograms,
      isLoading: false,
      error: null,
    });
    window.confirm = jest.fn(() => true);
  });

  describe('loading state', () => {
    it('renders loading message', () => {
      mockUsePrograms.mockReturnValue({ data: undefined, isLoading: true, error: null });
      render(<ProgramList />);
      expect(screen.getByText('Loading programs...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message', () => {
      mockUsePrograms.mockReturnValue({ data: undefined, isLoading: false, error: new Error('fail') });
      render(<ProgramList />);
      expect(screen.getByText('Failed to load programs')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty message when no programs', () => {
      mockUsePrograms.mockReturnValue({ data: [], isLoading: false, error: null });
      render(<ProgramList />);
      expect(screen.getByText('No programs found')).toBeInTheDocument();
    });

    it('renders create first program link', () => {
      mockUsePrograms.mockReturnValue({ data: [], isLoading: false, error: null });
      render(<ProgramList />);
      expect(screen.getByText('Create your first program')).toBeInTheDocument();
    });

    it('renders empty when data is null', () => {
      mockUsePrograms.mockReturnValue({ data: null, isLoading: false, error: null });
      render(<ProgramList />);
      expect(screen.getByText('No programs found')).toBeInTheDocument();
    });
  });

  describe('grid view (default)', () => {
    it('renders program names', () => {
      render(<ProgramList />);
      expect(screen.getByText('Strength Builder')).toBeInTheDocument();
      expect(screen.getByText('Hypertrophy Max')).toBeInTheDocument();
    });

    it('renders program descriptions', () => {
      render(<ProgramList />);
      expect(screen.getByText('Build strength with compound movements')).toBeInTheDocument();
      // Empty description shows fallback
      expect(screen.getAllByText('No description').length).toBeGreaterThanOrEqual(1);
    });

    it('renders program type badges', () => {
      render(<ProgramList />);
      expect(screen.getByText('STRENGTH')).toBeInTheDocument();
      expect(screen.getByText('HYPERTROPHY')).toBeInTheDocument();
    });

    it('renders difficulty level badges', () => {
      render(<ProgramList />);
      expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
      expect(screen.getByText('ADVANCED')).toBeInTheDocument();
    });

    it('renders duration badges', () => {
      render(<ProgramList />);
      expect(screen.getByText('12 weeks')).toBeInTheDocument();
      expect(screen.getByText('8 weeks')).toBeInTheDocument();
    });

    it('renders view details links', () => {
      render(<ProgramList />);
      const viewLinks = screen.getAllByText('View Details');
      expect(viewLinks).toHaveLength(2);
    });

    it('renders edit links in dropdown', () => {
      render(<ProgramList />);
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders duplicate buttons in dropdown', () => {
      render(<ProgramList />);
      const dupButtons = screen.getAllByText('Duplicate');
      expect(dupButtons).toHaveLength(2);
    });

    it('renders assign links in dropdown', () => {
      render(<ProgramList />);
      const assignButtons = screen.getAllByText('Assign');
      expect(assignButtons).toHaveLength(2);
    });

    it('renders delete buttons in dropdown', () => {
      render(<ProgramList />);
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('list view', () => {
    it('switches to list view when list button clicked', () => {
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      // In list view, program names still show
      expect(screen.getByText('Strength Builder')).toBeInTheDocument();
      expect(screen.getByText('Hypertrophy Max')).toBeInTheDocument();
    });

    it('renders list item descriptions', () => {
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      expect(screen.getByText('Build strength with compound movements')).toBeInTheDocument();
    });

    it('renders list item badges', () => {
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      expect(screen.getByText('STRENGTH')).toBeInTheDocument();
      expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
      expect(screen.getByText('12 weeks')).toBeInTheDocument();
    });

    it('renders list item action buttons', () => {
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      // List view has direct icon buttons instead of dropdown
      expect(screen.getAllByTestId('icon-edit').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByTestId('icon-copy').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByTestId('icon-trash').length).toBeGreaterThanOrEqual(2);
    });

    it('switches back to grid view', () => {
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      const gridBtn = screen.getByTestId('icon-grid').closest('button')!;
      fireEvent.click(gridBtn);
      // Back in grid view - dropdown menus visible
      expect(screen.getAllByText('View Details').length).toBe(2);
    });
  });

  describe('actions', () => {
    it('calls deleteProgram when delete clicked and confirmed', async () => {
      mockDeleteMutateAsync.mockResolvedValue(undefined);
      render(<ProgramList />);
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this program?');
      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('prog-1');
      });
    });

    it('does not delete when confirm cancelled', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      render(<ProgramList />);
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });

    it('handles delete error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDeleteMutateAsync.mockRejectedValue(new Error('Delete failed'));
      render(<ProgramList />);
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete program:', expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    it('calls duplicateProgram when duplicate clicked', async () => {
      mockDuplicateMutateAsync.mockResolvedValue(undefined);
      render(<ProgramList />);
      const dupButtons = screen.getAllByText('Duplicate');
      fireEvent.click(dupButtons[0]);
      await waitFor(() => {
        expect(mockDuplicateMutateAsync).toHaveBeenCalledWith({ id: 'prog-1' });
      });
    });

    it('handles duplicate error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDuplicateMutateAsync.mockRejectedValue(new Error('Dup failed'));
      render(<ProgramList />);
      const dupButtons = screen.getAllByText('Duplicate');
      fireEvent.click(dupButtons[0]);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to duplicate program:', expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    it('calls delete on list view trash button', async () => {
      mockDeleteMutateAsync.mockResolvedValue(undefined);
      render(<ProgramList />);
      // Switch to list view
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      // Click trash icon on first program
      const trashBtns = screen.getAllByTestId('icon-trash');
      fireEvent.click(trashBtns[0].closest('button')!);
      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('prog-1');
      });
    });

    it('calls duplicate on list view copy button', async () => {
      mockDuplicateMutateAsync.mockResolvedValue(undefined);
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      const copyBtns = screen.getAllByTestId('icon-copy');
      fireEvent.click(copyBtns[0].closest('button')!);
      await waitFor(() => {
        expect(mockDuplicateMutateAsync).toHaveBeenCalledWith({ id: 'prog-1' });
      });
    });
  });

  describe('filters', () => {
    it('renders search input', () => {
      render(<ProgramList />);
      expect(screen.getByPlaceholderText('Search programs...')).toBeInTheDocument();
    });

    it('updates search filter on input change', () => {
      render(<ProgramList />);
      const searchInput = screen.getByPlaceholderText('Search programs...');
      fireEvent.change(searchInput, { target: { value: 'strength' } });
      expect(searchInput).toHaveValue('strength');
    });

    it('renders program type filter', () => {
      render(<ProgramList />);
      expect(screen.getByText('Program Type')).toBeInTheDocument();
    });

    it('renders difficulty filter', () => {
      render(<ProgramList />);
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
    });

    it('renders create program button', () => {
      render(<ProgramList />);
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    it('renders view mode toggle buttons', () => {
      render(<ProgramList />);
      expect(screen.getByTestId('icon-grid')).toBeInTheDocument();
      expect(screen.getByTestId('icon-list')).toBeInTheDocument();
    });
  });

  describe('links', () => {
    it('has edit link pointing to program edit page', () => {
      render(<ProgramList />);
      const editLinks = screen.getAllByText('Edit');
      const editLink = editLinks[0].closest('a');
      expect(editLink).toHaveAttribute('href', '/programs/prog-1/edit');
    });

    it('has assign link pointing to program assign page', () => {
      render(<ProgramList />);
      const assignLinks = screen.getAllByText('Assign');
      const assignLink = assignLinks[0].closest('a');
      expect(assignLink).toHaveAttribute('href', '/programs/prog-1/assign');
    });

    it('has view details link pointing to program page', () => {
      render(<ProgramList />);
      const viewLinks = screen.getAllByText('View Details');
      const viewLink = viewLinks[0].closest('a');
      expect(viewLink).toHaveAttribute('href', '/programs/prog-1');
    });

    it('has edit link in list view', () => {
      render(<ProgramList />);
      const listBtn = screen.getByTestId('icon-list').closest('button')!;
      fireEvent.click(listBtn);
      const editLinks = screen.getAllByTestId('icon-edit');
      const link = editLinks[0].closest('a');
      expect(link).toHaveAttribute('href', '/programs/prog-1/edit');
    });
  });
});
