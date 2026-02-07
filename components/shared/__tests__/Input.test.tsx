/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { Input } from '../Input';

describe('Input', () => {
  it('should render an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should not render label when not provided', () => {
    render(<Input name="email" placeholder="Email" />);
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('should render error message when provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should render left icon when provided', () => {
    render(<Input leftIcon={<span data-testid="left-icon" />} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render right icon when provided', () => {
    render(<Input rightIcon={<span data-testid="right-icon" />} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should call onChange when value changes', () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} placeholder="Type here" />);
    fireEvent.change(screen.getByPlaceholderText('Type here'), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should show character count when showCharCount and maxLength are set', () => {
    render(
      <Input showCharCount maxLength={100} value="hello" onChange={() => {}} />
    );
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is set', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref input" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
