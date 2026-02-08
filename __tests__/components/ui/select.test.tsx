/** @jest-environment jsdom */

import { render, screen, fireEvent } from '@testing-library/react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

describe('Select Component', () => {
  describe('Basic Select (native HTML)', () => {
    it('should render a select element', () => {
      render(
        <Select>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe('SELECT');
    });

    it('should render options correctly', () => {
      render(
        <Select>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
          <SelectItem value="3">Option 3</SelectItem>
        </Select>
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Option 1');
      expect(options[1]).toHaveTextContent('Option 2');
      expect(options[2]).toHaveTextContent('Option 3');
    });

    it('should call onValueChange when selection changes', () => {
      const handleChange = jest.fn();

      render(
        <Select onValueChange={handleChange}>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </Select>
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '2' } });

      expect(handleChange).toHaveBeenCalledWith('2');
    });

    it('should accept custom className', () => {
      render(
        <Select className="custom-class">
          <SelectItem value="1">Option 1</SelectItem>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
    });
  });

  describe('SelectTrigger', () => {
    it('should be a passthrough wrapper (no-op)', () => {
      const { container } = render(
        <SelectTrigger>
          <div>Content</div>
        </SelectTrigger>
      );

      // SelectTrigger just renders its children
      expect(container.querySelector('div')).toHaveTextContent('Content');
    });

    it('should not render a select element by itself', () => {
      const { container } = render(
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      );

      // SelectTrigger alone doesn't create a select
      const selects = container.querySelectorAll('select');
      expect(selects).toHaveLength(0);
    });
  });

  describe('SelectContent', () => {
    it('should render children directly (passthrough)', () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });
  });

  describe('SelectItem', () => {
    it('should render as option element', () => {
      render(
        <Select>
          <SelectItem value="test">Test Option</SelectItem>
        </Select>
      );

      const option = screen.getByRole('option');
      expect(option.tagName).toBe('OPTION');
      expect(option).toHaveValue('test');
      expect(option).toHaveTextContent('Test Option');
    });
  });

  describe('SelectValue', () => {
    it('should not render anything (no-op for native select)', () => {
      const { container } = render(<SelectValue placeholder="Select an option" />);

      // SelectValue returns null, so container should be empty
      expect(container.firstChild).toBeNull();
    });

    it('should accept props without errors', () => {
      // Should render without throwing
      expect(() => {
        render(<SelectValue placeholder="Test" className="custom-value-class" />);
      }).not.toThrow();
    });
  });

  describe('Radix UI Pattern Compatibility', () => {
    it('should work with Radix UI-like usage pattern', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const selects = container.querySelectorAll('select');
      expect(selects).toHaveLength(1); // Only one select element

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    it('should prevent nested select warning', () => {
      // This test ensures the component structure doesn't create <select> inside <select>
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const selects = container.querySelectorAll('select');
      expect(selects.length).toBe(1); // Only one select element should exist

      // Ensure no select is inside another select
      selects.forEach(select => {
        const nestedSelects = select.querySelectorAll('select');
        expect(nestedSelects.length).toBe(0); // No nested selects
      });
    });
  });
});
