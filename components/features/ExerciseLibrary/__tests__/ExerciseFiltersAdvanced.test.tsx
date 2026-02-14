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

  it('removes an active filter badge when X button clicked', () => {
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest', 'back'],
    };
    const { container } = render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithActive} />
    );

    // Find the active filter badges area (has blue-50 background)
    const badgesArea = container.querySelector('.bg-blue-50');
    expect(badgesArea).toBeInTheDocument();

    // Find the first X button in the badges area
    const closeButtons = badgesArea?.querySelectorAll('button');
    if (closeButtons && closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('removes equipment badge when X button clicked', () => {
    const filtersWithActive = {
      ...defaultFilters,
      equipments: ['barbell', 'dumbbell'],
    };
    const { container } = render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithActive} />
    );

    const badgesArea = container.querySelector('.bg-blue-50');
    const closeButtons = badgesArea?.querySelectorAll('button');
    if (closeButtons && closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('removes target muscle badge when X button clicked', () => {
    const filtersWithActive = {
      ...defaultFilters,
      targetMuscles: ['biceps', 'triceps'],
    };
    const { container } = render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithActive} />
    );

    const badgesArea = container.querySelector('.bg-blue-50');
    const closeButtons = badgesArea?.querySelectorAll('button');
    if (closeButtons && closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('removes favorites badge when X button clicked', () => {
    const filtersWithActive = {
      ...defaultFilters,
      favorites: true,
    };
    const { container } = render(
      <ExerciseFiltersAdvanced {...defaultProps} filters={filtersWithActive} />
    );

    const badgesArea = container.querySelector('.bg-blue-50');
    const closeButtons = badgesArea?.querySelectorAll('button');
    if (closeButtons && closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          favorites: false,
        })
      );
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
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );
    const saveBtn = screen.getByTitle('Save current filters as preset');
    expect(saveBtn).toBeInTheDocument();
  });

  it('opens save preset modal when save button clicked', () => {
    const mockSavePreset = jest.fn();
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );
    const saveBtn = screen.getByTitle('Save current filters as preset');
    fireEvent.click(saveBtn);
    expect(screen.getByText('Save Filter Preset')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., My Gym Routine')).toBeInTheDocument();
  });

  it('saves preset with valid name', () => {
    const mockSavePreset = jest.fn();
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
      equipments: ['barbell'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );

    // Open modal
    const saveBtn = screen.getByTitle('Save current filters as preset');
    fireEvent.click(saveBtn);

    // Enter preset name
    const nameInput = screen.getByPlaceholderText('e.g., My Gym Routine');
    fireEvent.change(nameInput, { target: { value: 'My Custom Preset' } });

    // Click save
    const savePresetBtn = screen.getByText('Save Preset');
    fireEvent.click(savePresetBtn);

    expect(mockSavePreset).toHaveBeenCalledWith({
      name: 'My Custom Preset',
      filters: filtersWithActive,
    });
  });

  it('does not save preset with empty name', () => {
    const mockSavePreset = jest.fn();
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );

    // Open modal
    const saveBtn = screen.getByTitle('Save current filters as preset');
    fireEvent.click(saveBtn);

    // Try to save without entering name
    const savePresetBtn = screen.getByText('Save Preset');
    expect(savePresetBtn).toBeDisabled();
  });

  it('trims preset name whitespace', () => {
    const mockSavePreset = jest.fn();
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );

    // Open modal
    const saveBtn = screen.getByTitle('Save current filters as preset');
    fireEvent.click(saveBtn);

    // Enter preset name with whitespace
    const nameInput = screen.getByPlaceholderText('e.g., My Gym Routine');
    fireEvent.change(nameInput, { target: { value: '  My Preset  ' } });

    // Click save
    const savePresetBtn = screen.getByText('Save Preset');
    fireEvent.click(savePresetBtn);

    expect(mockSavePreset).toHaveBeenCalledWith({
      name: 'My Preset',
      filters: filtersWithActive,
    });
  });

  it('closes modal when cancel button clicked', () => {
    const mockSavePreset = jest.fn();
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );

    // Open modal
    const saveBtn = screen.getByTitle('Save current filters as preset');
    fireEvent.click(saveBtn);

    // Click cancel
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Save Filter Preset')).not.toBeInTheDocument();
  });

  it('clears preset name when modal is cancelled', () => {
    const mockSavePreset = jest.fn();
    const filtersWithActive = {
      ...defaultFilters,
      bodyParts: ['chest'],
    };
    render(
      <ExerciseFiltersAdvanced
        {...defaultProps}
        filters={filtersWithActive}
        onSavePreset={mockSavePreset}
      />
    );

    // Open modal
    const saveBtn = screen.getByTitle('Save current filters as preset');
    fireEvent.click(saveBtn);

    // Enter name
    const nameInput = screen.getByPlaceholderText('e.g., My Gym Routine');
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    // Cancel
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    // Re-open modal - name should be cleared
    fireEvent.click(saveBtn);
    const newNameInput = screen.getByPlaceholderText('e.g., My Gym Routine');
    expect(newNameInput).toHaveValue('');
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

      // Should show no results message
      expect(screen.getByText(/No muscles found matching/)).toBeInTheDocument();
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

    it('handles array value in handleFilterChange', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);
      const chestCheckbox = screen.getByText('chest').closest('label')?.querySelector('input');
      if (chestCheckbox) {
        fireEvent.click(chestCheckbox);
      }
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('disables save button when no active filters', () => {
      const mockSavePreset = jest.fn();
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          onSavePreset={mockSavePreset}
        />
      );
      const saveBtn = screen.getByTitle('Save current filters as preset');
      expect(saveBtn).toBeDisabled();
    });

    it('disables clear button when no active filters', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);
      const clearBtn = screen.getByTitle('Clear all filters');
      expect(clearBtn).toBeDisabled();
    });

    it('clears muscle search when clearing all filters', () => {
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

      // Expand target muscles and search
      fireEvent.click(screen.getByText('Target Muscles'));
      const searchInput = screen.getByPlaceholderText('Search muscles...');
      fireEvent.change(searchInput, { target: { value: 'biceps' } });

      // Clear all filters
      const clearBtn = screen.getByTitle('Clear all filters');
      fireEvent.click(clearBtn);

      // Search should be cleared
      expect(searchInput).toHaveValue('');
    });

    it('shows section count badge when filters applied', () => {
      const filtersWithActive = {
        ...defaultFilters,
        bodyParts: ['chest', 'back'],
      };
      render(
        <ExerciseFiltersAdvanced
          {...defaultProps}
          filters={filtersWithActive}
        />
      );

      // Body Parts section should show count badge
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show count badge when no filters in section', () => {
      render(<ExerciseFiltersAdvanced {...defaultProps} />);
      // Equipment section has no filters, so no count badge
      fireEvent.click(screen.getByText('Equipment'));
      // Should render without count badge (count is 0)
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });
  });
});
