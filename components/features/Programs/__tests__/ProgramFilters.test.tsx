/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  SlidersHorizontal: () => <span data-testid="icon-sliders" />,
  Grid3X3: () => <span data-testid="icon-grid" />,
  List: () => <span data-testid="icon-list" />,
}));

import ProgramFilters from '../ProgramFilters';
import { ProgramFilters as ProgramFiltersType } from '@/types/program';

describe('ProgramFilters', () => {
  const defaultProps = {
    filters: {} as ProgramFiltersType,
    onFiltersChange: jest.fn(),
    viewMode: 'grid' as const,
    onViewModeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the search input', () => {
    render(<ProgramFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search programs...')).toBeInTheDocument();
  });

  it('should render the program type filter', () => {
    render(<ProgramFilters {...defaultProps} />);
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
  });

  it('should render the difficulty filter', () => {
    render(<ProgramFilters {...defaultProps} />);
    expect(screen.getByDisplayValue('All Levels')).toBeInTheDocument();
  });

  it('should render view mode toggle buttons', () => {
    render(<ProgramFilters {...defaultProps} />);
    expect(screen.getByTestId('icon-grid')).toBeInTheDocument();
    expect(screen.getByTestId('icon-list')).toBeInTheDocument();
  });

  it('should call onFiltersChange when search input changes', () => {
    render(<ProgramFilters {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search programs...');
    fireEvent.change(searchInput, { target: { value: 'strength' } });
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'strength' })
    );
  });

  it('should call onFiltersChange when program type changes', () => {
    render(<ProgramFilters {...defaultProps} />);
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.change(typeSelect, { target: { value: 'strength' } });
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ programType: 'strength' })
    );
  });

  it('should call onFiltersChange when difficulty changes', () => {
    render(<ProgramFilters {...defaultProps} />);
    const levelSelect = screen.getByDisplayValue('All Levels');
    fireEvent.change(levelSelect, { target: { value: 'beginner' } });
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ difficultyLevel: 'beginner' })
    );
  });

  it('should call onViewModeChange when grid button is clicked', () => {
    render(<ProgramFilters {...defaultProps} viewMode="list" />);
    const gridBtn = screen.getByTestId('icon-grid').closest('button')!;
    fireEvent.click(gridBtn);
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('grid');
  });

  it('should call onViewModeChange when list button is clicked', () => {
    render(<ProgramFilters {...defaultProps} />);
    const listBtn = screen.getByTestId('icon-list').closest('button')!;
    fireEvent.click(listBtn);
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('list');
  });

  it('should toggle advanced filters', () => {
    render(<ProgramFilters {...defaultProps} />);
    const filtersBtn = screen.getByText('Filters');
    fireEvent.click(filtersBtn);
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText('Templates only')).toBeInTheDocument();
  });

  it('should show clear filters when filters are active', () => {
    render(<ProgramFilters {...defaultProps} filters={{ search: 'test' } as ProgramFiltersType} />);
    const filtersBtn = screen.getByText('Filters');
    fireEvent.click(filtersBtn);
    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('should call onFiltersChange with empty object when clearing', () => {
    render(<ProgramFilters {...defaultProps} filters={{ search: 'test' } as ProgramFiltersType} />);
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('Clear all filters'));
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({});
  });
});
