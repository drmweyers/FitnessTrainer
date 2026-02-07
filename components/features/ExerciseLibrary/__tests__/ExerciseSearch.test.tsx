/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  X: () => <span data-testid="icon-x" />,
}));

import { ExerciseSearch } from '../ExerciseSearch';

describe('ExerciseSearch', () => {
  const defaultProps = {
    onSearch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the search input', () => {
    render(<ExerciseSearch {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
  });

  it('should render custom placeholder', () => {
    render(<ExerciseSearch {...defaultProps} placeholder="Find workouts..." />);
    expect(screen.getByPlaceholderText('Find workouts...')).toBeInTheDocument();
  });

  it('should render initial value', () => {
    render(<ExerciseSearch {...defaultProps} initialValue="bicep" />);
    expect(screen.getByDisplayValue('bicep')).toBeInTheDocument();
  });

  it('should render search icon', () => {
    render(<ExerciseSearch {...defaultProps} />);
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
  });

  it('should call onSearch when Enter is pressed', () => {
    render(<ExerciseSearch {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(input, { target: { value: 'bench press' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onSearch).toHaveBeenCalledWith('bench press');
  });

  it('should not call onSearch on regular typing', () => {
    render(<ExerciseSearch {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(input, { target: { value: 'squat' } });
    expect(defaultProps.onSearch).not.toHaveBeenCalled();
  });

  it('should show clear button when there is text', () => {
    render(<ExerciseSearch {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByTestId('icon-x')).toBeInTheDocument();
  });

  it('should not show clear button when input is empty', () => {
    render(<ExerciseSearch {...defaultProps} />);
    expect(screen.queryByTestId('icon-x')).not.toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', () => {
    render(<ExerciseSearch {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(input, { target: { value: 'test' } });
    const clearBtn = screen.getByTestId('icon-x').closest('button')!;
    fireEvent.click(clearBtn);
    expect(input).toHaveValue('');
  });
});
