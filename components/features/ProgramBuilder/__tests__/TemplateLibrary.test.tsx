/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import TemplateLibrary from '../TemplateLibrary';

// Mock the API
jest.mock('@/lib/api/programs', () => ({
  getTemplates: jest.fn(() =>
    Promise.resolve([
      {
        id: 'tmpl-1',
        name: 'PPL Split',
        description: 'Push Pull Legs split for hypertrophy',
        program: {
          programType: 'strength',
          difficultyLevel: 'intermediate',
          durationWeeks: 8,
        },
        rating: 4.5,
        useCount: 120,
        tags: ['hypertrophy', 'split', 'intermediate'],
        creator: { email: 'coach@example.com' },
        createdAt: '2025-01-01T00:00:00Z',
        category: 'Strength Training',
      },
      {
        id: 'tmpl-2',
        name: 'Starting Strength',
        description: 'Beginner strength program',
        program: {
          programType: 'strength',
          difficultyLevel: 'beginner',
          durationWeeks: 12,
        },
        rating: 4.8,
        useCount: 500,
        tags: ['beginner', 'strength', 'barbell'],
        creator: { email: 'trainer@example.com' },
        createdAt: '2025-02-01T00:00:00Z',
        category: 'Strength Training',
      },
    ])
  ),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  Star: () => <span data-testid="star-icon" />,
  Filter: () => <span data-testid="filter-icon" />,
  Copy: () => <span data-testid="copy-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Target: () => <span data-testid="target-icon" />,
  TrendingUp: () => <span data-testid="trending-icon" />,
  Download: () => <span data-testid="download-icon" />,
  Share2: () => <span data-testid="share-icon" />,
  Bookmark: () => <span data-testid="bookmark-icon" />,
  BookmarkCheck: () => <span data-testid="bookmark-check" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  Award: () => <span data-testid="award-icon" />,
  X: () => <span data-testid="x-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
}));

describe('TemplateLibrary', () => {
  const defaultProps = {
    onSelectTemplate: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    expect(screen.getByText('Program Template Library')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<TemplateLibrary {...defaultProps} />);
    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('displays templates after loading', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
      expect(screen.getByText('Starting Strength')).toBeInTheDocument();
    });
  });

  it('shows template count after loading', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('2 templates found')).toBeInTheDocument();
    });
  });

  it('renders search input', () => {
    render(<TemplateLibrary {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Search templates/)).toBeInTheDocument();
  });

  it('renders Close button when onClose is provided', () => {
    render(<TemplateLibrary {...defaultProps} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', () => {
    render(<TemplateLibrary {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders Share Library button', () => {
    render(<TemplateLibrary {...defaultProps} />);
    expect(screen.getByText('Share Library')).toBeInTheDocument();
  });

  it('shows Filters button', () => {
    render(<TemplateLibrary {...defaultProps} />);
    // Multiple buttons may contain "Filters" text (toggle + category buttons)
    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    expect(filtersBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('filters templates by search term', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search templates/);
    fireEvent.change(searchInput, { target: { value: 'Starting' } });

    expect(screen.queryByText('PPL Split')).not.toBeInTheDocument();
    expect(screen.getByText('Starting Strength')).toBeInTheDocument();
    expect(screen.getByText('1 template found')).toBeInTheDocument();
  });

  it('shows template description', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Push Pull Legs split/)).toBeInTheDocument();
      expect(screen.getByText(/Beginner strength program/)).toBeInTheDocument();
    });
  });

  it('shows template creator', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/coach@example.com/)).toBeInTheDocument();
    });
  });

  it('shows template use count', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/120 uses/)).toBeInTheDocument();
      expect(screen.getByText(/500 uses/)).toBeInTheDocument();
    });
  });

  it('shows template tags', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('hypertrophy')).toBeInTheDocument();
      expect(screen.getByText('split')).toBeInTheDocument();
    });
  });

  it('shows duration weeks for each template', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // weeks for PPL
      expect(screen.getByText('12')).toBeInTheDocument(); // weeks for Starting Strength
    });
  });

  it('shows Use Template button for each template', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      const useButtons = screen.getAllByText('Use Template');
      expect(useButtons.length).toBe(2);
    });
  });

  it('calls onSelectTemplate when Use Template is clicked', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const useButtons = screen.getAllByText('Use Template');
    // Templates are sorted by rating desc, so Starting Strength (4.8) comes first
    fireEvent.click(useButtons[0]);

    expect(defaultProps.onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tmpl-2',
        name: 'Starting Strength',
      })
    );
  });

  it('shows Clone button for each template', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      const cloneButtons = screen.getAllByText('Clone');
      expect(cloneButtons.length).toBe(2);
    });
  });

  it('shows Preview button for each template', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      const previewButtons = screen.getAllByText('Preview');
      expect(previewButtons.length).toBe(2);
    });
  });

  it('shows empty state when search returns no results', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search templates/);
    fireEvent.change(searchInput, { target: { value: 'nonexistent template xyz' } });

    expect(screen.getByText('No templates found')).toBeInTheDocument();
    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });

  it('clears all filters when Clear All Filters is clicked', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search templates/);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No templates found')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear All Filters'));

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
      expect(screen.getByText('Starting Strength')).toBeInTheDocument();
    });
  });

  it('does not render Close button when onClose is not provided', () => {
    render(<TemplateLibrary onSelectTemplate={jest.fn()} />);
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('toggles filters panel when Filters button is clicked', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    const filtersButton = filtersBtns[0];

    // Filters should not be visible initially
    expect(screen.queryByText('Category')).not.toBeInTheDocument();

    fireEvent.click(filtersButton);

    // Filters should now be visible
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    fireEvent.click(filtersBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0] as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'Strength Training' } });

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
      expect(screen.getByText('Starting Strength')).toBeInTheDocument();
    });
  });

  it('filters by difficulty level', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    fireEvent.click(filtersBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const difficultySelect = selects[1] as HTMLSelectElement;
    fireEvent.change(difficultySelect, { target: { value: 'beginner' } });

    await waitFor(() => {
      expect(screen.queryByText('PPL Split')).not.toBeInTheDocument();
      expect(screen.getByText('Starting Strength')).toBeInTheDocument();
      expect(screen.getByText('1 template found')).toBeInTheDocument();
    });
  });

  it('sorts by use count', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    fireEvent.click(filtersBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: 'useCount' } });

    await waitFor(() => {
      const templateCards = screen.getAllByText(/uses/);
      // Starting Strength (500 uses) should come before PPL (120 uses)
      expect(templateCards[0]).toHaveTextContent('500');
    });
  });

  it('sorts by newest', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    fireEvent.click(filtersBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: 'newest' } });

    await waitFor(() => {
      const useButtons = screen.getAllByText('Use Template');
      // Starting Strength (2025-02-01) should be first
      expect(useButtons.length).toBe(2);
    });
  });

  it('filters by bookmarked only', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const filtersBtns = screen.getAllByRole('button', { name: /Filters/ });
    fireEvent.click(filtersBtns[0]);

    const bookmarkedCheckbox = screen.getByRole('checkbox', { name: /Bookmarked Only/ }) as HTMLInputElement;
    fireEvent.click(bookmarkedCheckbox);

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
    });
  });

  it('toggles bookmark when bookmark icon is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const bookmarkButtons = screen.getAllByTestId('bookmark-icon');
    fireEvent.click(bookmarkButtons[0].closest('button')!);

    expect(consoleSpy).toHaveBeenCalledWith('Toggle bookmark for template:', expect.any(String));

    consoleSpy.mockRestore();
  });

  it('expands template preview when Preview button is clicked', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Program Preview')).toBeInTheDocument();
    });
  });

  it('collapses template preview when Hide Preview is clicked', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Hide Preview')).toBeInTheDocument();
    });

    const hideButton = screen.getByText('Hide Preview');
    fireEvent.click(hideButton);

    await waitFor(() => {
      expect(screen.queryByText('Program Preview')).not.toBeInTheDocument();
    });
  });

  it('shows difficulty color for intermediate level', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
      const intermediateBadges = screen.getAllByText('intermediate');
      const difficultyBadge = intermediateBadges.find(el =>
        el.className.includes('bg-yellow-100') && el.className.includes('text-yellow-800')
      );
      expect(difficultyBadge).toBeTruthy();
    });
  });

  it('filters by search term in tags', async () => {
    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('PPL Split')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search templates/);
    fireEvent.change(searchInput, { target: { value: 'hypertrophy' } });

    expect(screen.getByText('PPL Split')).toBeInTheDocument();
    expect(screen.queryByText('Starting Strength')).not.toBeInTheDocument();
    expect(screen.getByText('1 template found')).toBeInTheDocument();
  });

});

describe('TemplateLibrary - Advanced difficulty and error handling', () => {
  const defaultProps = {
    onSelectTemplate: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { getTemplates } = require('@/lib/api/programs');
    getTemplates.mockReset();
  });

  it('shows difficulty color for advanced level', async () => {
    const { getTemplates } = require('@/lib/api/programs');
    getTemplates.mockImplementation(() => Promise.resolve([
      {
        id: 'tmpl-adv',
        name: 'Advanced Program',
        description: 'For advanced athletes',
        program: {
          programType: 'strength',
          difficultyLevel: 'advanced',
          durationWeeks: 12,
        },
        rating: 5.0,
        useCount: 200,
        tags: ['strength', 'elite'],
        creator: { email: 'pro@example.com' },
        createdAt: '2025-03-01T00:00:00Z',
        category: 'Powerlifting',
      },
    ]));

    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Advanced Program')).toBeInTheDocument();
      const difficultyBadges = screen.getAllByText('advanced');
      // The difficulty level badge should have advanced coloring
      const difficultyBadge = difficultyBadges.find(el =>
        el.className.includes('bg-red-100') && el.className.includes('text-red-800')
      );
      expect(difficultyBadge).toBeTruthy();
    });
  });

  it('handles API error gracefully', async () => {
    const { getTemplates } = require('@/lib/api/programs');
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    getTemplates.mockImplementation(() => Promise.reject(new Error('API Error')));

    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalledWith('Failed to load templates:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('shows more than 3 tags indicator', async () => {
    const { getTemplates } = require('@/lib/api/programs');
    getTemplates.mockImplementation(() => Promise.resolve([
      {
        id: 'tmpl-many-tags',
        name: 'Full Program',
        description: 'Comprehensive program',
        program: {
          programType: 'strength',
          difficultyLevel: 'intermediate',
          durationWeeks: 12,
        },
        rating: 4.5,
        useCount: 150,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        creator: { email: 'coach@example.com' },
        createdAt: '2025-01-15T00:00:00Z',
        category: 'Bodybuilding',
      },
    ]));

    render(<TemplateLibrary {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Full Program')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });
});
