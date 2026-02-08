/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseFiltersAdvanced } from '../ExerciseFiltersAdvanced';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ExerciseFiltersAdvanced', () => {
  const mockOnChange = jest.fn();

  const defaultFilters = {
    bodyParts: [] as string[],
    equipments: [] as string[],
    targetMuscles: [] as string[],
    search: '',
    favorites: false,
    collections: [] as string[],
  };

  const defaultFilterOptions = {
    bodyParts: ['chest', 'back', 'shoulders', 'legs'],
    equipments: ['barbell', 'dumbbell', 'body weight', 'cable'],
    targetMuscles: ['biceps', 'triceps', 'quadriceps', 'hamstrings', 'deltoids'],
  };

  const defaultProps = {
    filters: defaultFilters,
    onChange: mockOnChange,
    filterOptions: defaultFilterOptions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the filter header with title', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders body parts section expanded by default', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    expect(screen.getByText('Body Parts')).toBeInTheDocument();
    expect(screen.getByText('chest')).toBeInTheDocument();
    expect(screen.getByText('back')).toBeInTheDocument();
  });

  it('renders equipment section', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('renders target muscles section', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    expect(screen.getByText('Target Muscles')).toBeInTheDocument();
  });

  it('renders special filters section', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    expect(screen.getByText('Special Filters')).toBeInTheDocument();
  });

  it('renders filter presets section', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    expect(screen.getByText('Filter Presets')).toBeInTheDocument();
  });

  it('calls onChange when a body part checkbox is clicked', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    const chestCheckbox = screen.getByText('chest').closest('label')?.querySelector('input');
    if (chestCheckbox) {
      fireEvent.click(chestCheckbox);
    }
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyParts: ['chest'],
      })
    );
  });

  it('shows active filter count when filters are applied', () => {
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest', 'back'],
      equipments: ['barbell'],
    };

    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
      />
    );

    expect(screen.getByText('3 active')).toBeInTheDocument();
  });

  it('shows active filter badges when filters are applied', () => {
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
      favorites: true,
    };

    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
      />
    );

    // 'chest' appears in both body parts list and badge, so use getAllByText
    expect(screen.getAllByText('chest').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('toggles section expansion on click', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);

    // Equipment section should be collapsed initially
    // Click to expand
    fireEvent.click(screen.getByText('Equipment'));
    expect(screen.getByText('barbell')).toBeInTheDocument();
    expect(screen.getByText('dumbbell')).toBeInTheDocument();
  });

  it('renders default presets', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    // Expand presets
    fireEvent.click(screen.getByText('Filter Presets'));
    expect(screen.getByText('Strength Training')).toBeInTheDocument();
    expect(screen.getByText('Bodyweight Only')).toBeInTheDocument();
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
  });

  it('has search muscles input in target muscles section', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    // Expand target muscles
    fireEvent.click(screen.getByText('Target Muscles'));
    expect(screen.getByPlaceholderText('Search muscles...')).toBeInTheDocument();
  });

  it('filters muscles when searching', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Target Muscles'));

    const searchInput = screen.getByPlaceholderText('Search muscles...');
    fireEvent.change(searchInput, { target: { value: 'biceps' } });

    expect(screen.getByText('biceps')).toBeInTheDocument();
    expect(screen.queryByText('hamstrings')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', () => {
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };

    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
      />
    );

    // Click the clear button (RotateCcw icon button)
    const clearButton = screen.getByTitle('Clear all filters');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      search: '',
      favorites: false,
      collections: [],
    });
  });
});
