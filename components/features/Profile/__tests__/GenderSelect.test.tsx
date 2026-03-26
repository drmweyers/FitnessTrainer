/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GenderSelect from '../GenderSelect';

describe('GenderSelect', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the gender select with label', () => {
    render(<GenderSelect value="" onChange={mockOnChange} />);
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
  });

  it('renders all four gender options', () => {
    render(<GenderSelect value="" onChange={mockOnChange} />);
    const select = screen.getByLabelText('Gender');
    const options = Array.from((select as HTMLSelectElement).options).map(o => o.value);
    expect(options).toContain('male');
    expect(options).toContain('female');
    expect(options).toContain('non-binary');
    expect(options).toContain('prefer-not-to-say');
  });

  it('renders a blank placeholder option', () => {
    render(<GenderSelect value="" onChange={mockOnChange} />);
    const select = screen.getByLabelText('Gender');
    const firstOption = (select as HTMLSelectElement).options[0];
    expect(firstOption.value).toBe('');
    expect(firstOption.text).toMatch(/select gender/i);
  });

  it('reflects the current value', () => {
    render(<GenderSelect value="female" onChange={mockOnChange} />);
    const select = screen.getByLabelText('Gender') as HTMLSelectElement;
    expect(select.value).toBe('female');
  });

  it('calls onChange when selection changes', () => {
    render(<GenderSelect value="" onChange={mockOnChange} />);
    const select = screen.getByLabelText('Gender');
    fireEvent.change(select, { target: { value: 'non-binary' } });
    expect(mockOnChange).toHaveBeenCalledWith('non-binary');
  });

  it('displays option labels in title case', () => {
    render(<GenderSelect value="" onChange={mockOnChange} />);
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Non-Binary')).toBeInTheDocument();
    expect(screen.getByText('Prefer Not To Say')).toBeInTheDocument();
  });

  it('has an id of gender for accessibility', () => {
    render(<GenderSelect value="" onChange={mockOnChange} />);
    expect(screen.getByLabelText('Gender')).toHaveAttribute('id', 'gender');
  });
});
