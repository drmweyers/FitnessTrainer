/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Minus: () => <span data-testid="icon-minus">-</span>,
  Plus: () => <span data-testid="icon-plus">+</span>,
}));

import NumberInput from '../NumberInput';

describe('NumberInput', () => {
  const defaultProps = {
    label: 'Sets',
    name: 'sets',
    value: 5,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the label', () => {
    render(<NumberInput {...defaultProps} />);
    expect(screen.getByText('Sets')).toBeInTheDocument();
  });

  it('should render the current value', () => {
    render(<NumberInput {...defaultProps} />);
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should call onChange when increment button is clicked', () => {
    render(<NumberInput {...defaultProps} />);
    const plusBtn = screen.getByTestId('icon-plus').closest('button')!;
    fireEvent.click(plusBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith(6);
  });

  it('should call onChange when decrement button is clicked', () => {
    render(<NumberInput {...defaultProps} />);
    const minusBtn = screen.getByTestId('icon-minus').closest('button')!;
    fireEvent.click(minusBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith(4);
  });

  it('should not increment beyond max', () => {
    render(<NumberInput {...defaultProps} value={100} max={100} />);
    const plusBtn = screen.getByTestId('icon-plus').closest('button')!;
    fireEvent.click(plusBtn);
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('should not decrement below min', () => {
    render(<NumberInput {...defaultProps} value={0} min={0} />);
    const minusBtn = screen.getByTestId('icon-minus').closest('button')!;
    fireEvent.click(minusBtn);
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('should disable decrement button at min', () => {
    render(<NumberInput {...defaultProps} value={0} min={0} />);
    const minusBtn = screen.getByTestId('icon-minus').closest('button')!;
    expect(minusBtn).toBeDisabled();
  });

  it('should disable increment button at max', () => {
    render(<NumberInput {...defaultProps} value={100} max={100} />);
    const plusBtn = screen.getByTestId('icon-plus').closest('button')!;
    expect(plusBtn).toBeDisabled();
  });

  it('should call onChange when input value changes', () => {
    render(<NumberInput {...defaultProps} />);
    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '10' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(10);
  });

  it('should render error message', () => {
    render(<NumberInput {...defaultProps} error="Invalid value" />);
    expect(screen.getByText('Invalid value')).toBeInTheDocument();
  });

  it('should use custom step value', () => {
    render(<NumberInput {...defaultProps} value={10} step={5} />);
    const plusBtn = screen.getByTestId('icon-plus').closest('button')!;
    fireEvent.click(plusBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith(15);
  });
});
