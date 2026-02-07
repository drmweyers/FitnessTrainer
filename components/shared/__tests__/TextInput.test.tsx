/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import TextInput from '../TextInput';

describe('TextInput', () => {
  const defaultProps = {
    label: 'Name',
    name: 'name',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the label', () => {
    render(<TextInput {...defaultProps} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should render the input element', () => {
    render(<TextInput {...defaultProps} placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('should display the current value', () => {
    render(<TextInput {...defaultProps} value="John" />);
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('should call onChange when typing', () => {
    render(<TextInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('test');
  });

  it('should render error message', () => {
    render(<TextInput {...defaultProps} error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('should show character count when showCharCount and maxLength are set', () => {
    render(<TextInput {...defaultProps} value="hello" showCharCount maxLength={50} />);
    expect(screen.getByText('5/50')).toBeInTheDocument();
  });

  it('should not show character count when showCharCount is false', () => {
    render(<TextInput {...defaultProps} value="hello" maxLength={50} />);
    expect(screen.queryByText('5/50')).not.toBeInTheDocument();
  });

  it('should apply error styling when error is provided', () => {
    render(<TextInput {...defaultProps} error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-300');
  });

  it('should set maxLength attribute', () => {
    render(<TextInput {...defaultProps} maxLength={100} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '100');
  });
});
