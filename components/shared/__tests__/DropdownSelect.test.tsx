/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
}));

import DropdownSelect from '../DropdownSelect';

describe('DropdownSelect', () => {
  const defaultProps = {
    label: 'Category',
    name: 'category',
    value: 'strength',
    onChange: jest.fn(),
    options: [
      { value: 'strength', label: 'Strength' },
      { value: 'cardio', label: 'Cardio' },
      { value: 'flexibility', label: 'Flexibility' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the label', () => {
    render(<DropdownSelect {...defaultProps} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<DropdownSelect {...defaultProps} />);
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
    expect(screen.getByText('Flexibility')).toBeInTheDocument();
  });

  it('should have the correct selected value', () => {
    render(<DropdownSelect {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('strength');
  });

  it('should call onChange when value changes', () => {
    render(<DropdownSelect {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cardio' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('cardio');
  });

  it('should render error message when provided', () => {
    render(<DropdownSelect {...defaultProps} error="Please select a category" />);
    expect(screen.getByText('Please select a category')).toBeInTheDocument();
  });

  it('should render chevron down icon', () => {
    render(<DropdownSelect {...defaultProps} />);
    expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
  });

  it('should handle boolean values', () => {
    const boolProps = {
      ...defaultProps,
      value: true,
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ],
    };
    render(<DropdownSelect {...boolProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'false' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(false);
  });
});
