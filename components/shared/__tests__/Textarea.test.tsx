/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('should render a textarea element', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should not render label when not provided', () => {
    render(<Textarea placeholder="No label" />);
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<Textarea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should call onChange when value changes', () => {
    const onChange = jest.fn();
    render(<Textarea onChange={onChange} placeholder="Type here" />);
    fireEvent.change(screen.getByPlaceholderText('Type here'), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is set', () => {
    render(<Textarea disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="Ref textarea" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('should apply error styling when error is provided', () => {
    render(<Textarea error="Error" placeholder="Error input" />);
    const textarea = screen.getByPlaceholderText('Error input');
    expect(textarea.className).toContain('border-red-500');
  });

  it('should apply custom className', () => {
    render(<Textarea className="custom-class" placeholder="Custom" />);
    const textarea = screen.getByPlaceholderText('Custom');
    expect(textarea.className).toContain('custom-class');
  });
});
