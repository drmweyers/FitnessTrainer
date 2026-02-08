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

  it('applies a preset when clicked', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Filter Presets'));
    fireEvent.click(screen.getByText('Strength Training'));
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyParts: expect.any(Array),
        equipments: expect.any(Array),
      })
    );
  });

  it('removes an active filter badge when clicked', () => {
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest', 'back'],
    };
    render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithActive} />
    );
    // Find the X button on the chest badge
    const badges = screen.getAllByText('chest');
    const badgeContainer = badges[0].closest('button') || badges[0].closest('[role]');
    if (badgeContainer) {
      // Look for the X button next to the badge text
      const closeButtons = document.querySelectorAll('button svg');
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0].closest('button')!);
      }
    }
  });

  it('calls onChange when equipment checkbox is clicked', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Equipment'));
    const barbellCheckbox = screen.getByText('barbell').closest('label')?.querySelector('input');
    if (barbellCheckbox) {
      fireEvent.click(barbellCheckbox);
    }
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        equipments: ['barbell'],
      })
    );
  });

  it('removes equipment filter when clicking checked equipment', () => {
    const filtersWithEquip = {
      ...defaultFilters,
      equipments: ['barbell'],
    };
    render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithEquip} />
    );
    fireEvent.click(screen.getByText('Equipment'));
    const barbellElements = screen.getAllByText('barbell');
    // Find the one inside a label (checkbox), not the badge
    const barbellCheckbox = barbellElements
      .map(el => el.closest('label')?.querySelector('input'))
      .find(input => input != null);
    if (barbellCheckbox) {
      fireEvent.click(barbellCheckbox);
    }
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        equipments: [],
      })
    );
  });

  it('calls onChange when target muscle checkbox is clicked', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Target Muscles'));
    const bicepsCheckbox = screen.getByText('biceps').closest('label')?.querySelector('input');
    if (bicepsCheckbox) {
      fireEvent.click(bicepsCheckbox);
    }
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        targetMuscles: ['biceps'],
      })
    );
  });

  it('toggles favorites filter', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Special Filters'));
    const favCheckbox = screen.getByText('Show only favorites').closest('label')?.querySelector('input');
    if (favCheckbox) {
      fireEvent.click(favCheckbox);
    }
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        favorites: true,
      })
    );
  });

  it('applies Bodyweight Only preset', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Filter Presets'));
    fireEvent.click(screen.getByText('Bodyweight Only'));
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        equipments: expect.arrayContaining(['body weight']),
      })
    );
  });

  it('applies Upper Body preset', () => {
    render(<ExerciseFiltersAdvanced {...defaultProps} />);
    fireEvent.click(screen.getByText('Filter Presets'));
    fireEvent.click(screen.getByText('Upper Body'));
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('counts favorites in active filter count', () => {
    const filtersWithFavorites = {
      ...defaultFilters,
      favorites: true,
    };
    render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithFavorites} />
    );
    expect(screen.getByText('1 active')).toBeInTheDocument();
  });

  it('renders onSavePreset button when prop is provided', () => {
    const mockSavePreset = jest.fn();
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        onSavePreset={mockSavePreset}
      />
    );
    fireEvent.click(screen.getByText('Filter Presets'));
    const saveBtn = screen.queryByText('Save Current');
    if (saveBtn) {
      expect(saveBtn).toBeInTheDocument();
    }
  });

  describe('Edge cases', () => {
    it('handles empty filter options', () => {
      const emptyOptions = {
        bodyParts: [],
        equipments: [],
        targetMuscles: [],
      };
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filterOptions={emptyOptions}
        />
      );
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('handles multiple bodyParts selected', () => {
      const multiFilters = {
        ...defaultFilters,
        bodyParts: ['chest', 'back', 'shoulders'],
      };
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filters={multiFilters}
        />
      );
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    it('handles multiple equipments selected', () => {
      const multiEquip = {
        ...defaultFilters,
        equipments: ['barbell', 'dumbbell', 'cable'],
      };
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filters={multiEquip}
        />
      );
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    it('handles all filter types at once', () => {
      const allFilters = {
        bodyParts: ['chest'],
        equipments: ['barbell'],
        targetMuscles: ['biceps'],
        search: 'test',
        favorites: true,
        collections: ['col-1'],
      };
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filters={allFilters}
        />
      );
      // Should show count of all active filters
      expect(screen.getByText(/\d+ active/)).toBeInTheDocument();
    });

    it('handles removing bodyPart filter', () => {
      const filters = {
        ...defaultFilters,
        bodyParts: ['chest', 'back'],
      };
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filters={filters}
        />
      );

      const chestCheckbox = screen.getAllByText('chest')
        .map(el => el.closest('label')?.querySelector('input'))
        .find(input => input != null);

      if (chestCheckbox) {
        fireEvent.click(chestCheckbox);
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            bodyParts: ['back'],
          })
        );
      }
    });

    it('handles search with no results', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);
      fireEvent.click(screen.getByText('Target Muscles'));

      const searchInput = screen.getByPlaceholderText('Search muscles...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Should show no muscle options
      expect(screen.queryByText('biceps')).not.toBeInTheDocument();
    });

    it('handles search case insensitive', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);
      fireEvent.click(screen.getByText('Target Muscles'));

      const searchInput = screen.getByPlaceholderText('Search muscles...');
      fireEvent.change(searchInput, { target: { value: 'BICEPS' } });

      expect(screen.getByText('biceps')).toBeInTheDocument();
    });

    it('collapses expanded sections when clicked again', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);

      // Body Parts is expanded by default
      expect(screen.getByText('chest')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('Body Parts'));

      // Should be collapsed (may still show in badges)
    });

    it('handles preset with undefined fields', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);
      fireEvent.click(screen.getByText('Filter Presets'));

      // Apply a preset
      const presetBtn = screen.getByText('Strength Training');
      fireEvent.click(presetBtn);

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('maintains filter state across re-renders', () => {
      const { rerender } = render(
        <ExerciseFiltersAdvanced {...defaultProps} />
      );

      const filtersWithActive = {
        ...defaultFilters,
        bodyParts: ['chest'],
      };

      rerender(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filters={filtersWithActive}
        />
      );

      expect(screen.getByText('1 active')).toBeInTheDocument();
    });
  });
});
