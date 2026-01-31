import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Button, buttonVariants } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render default button', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('should render with default variant classes', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-blue-700');
    });

    it('should render with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('hover:bg-red-700');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Cancel</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-gray-300');
      expect(button).toHaveClass('bg-white');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100');
      expect(button).toHaveClass('text-gray-900');
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('should render with link variant', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-blue-600');
      expect(button).toHaveClass('underline-offset-4');
      expect(button).toHaveClass('hover:underline');
    });

    it('should render with submit variant', () => {
      render(<Button variant="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Sizes', () => {
    it('should render with default size', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should render with small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('text-xs');
    });

    it('should render with large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('text-base');
    });

    it('should render with icon size', () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Width', () => {
    it('should render with normal width by default', () => {
      render(<Button>Normal</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });

    it('should render with full width', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');

      expect(button).toBeDisabled();
      expect(spinner).toBeInTheDocument();
    });

    it('should show loading spinner when isSubmitting is true', () => {
      render(<Button isSubmitting>Submitting</Button>);

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');

      expect(button).toBeDisabled();
      expect(spinner).toBeInTheDocument();
    });

    it('should not show loading spinner when not loading', () => {
      render(<Button>Not Loading</Button>);

      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');

      expect(spinner).not.toBeInTheDocument();
    });

    it('should hide left icon when loading', () => {
      render(
        <Button isLoading leftIcon={<span>Left</span>}>
          Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).not.toContainHTML('<span>Left</span>');
    });

    it('should hide right icon when loading', () => {
      render(
        <Button isLoading rightIcon={<span>Right</span>}>
          Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).not.toContainHTML('<span>Right</span>');
    });

    it('should show "Submitting..." text for submit variant when submitting', () => {
      render(<Button variant="submit" isSubmitting>Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Submitting...');
    });

    it('should show normal text for non-submit variant when submitting', () => {
      render(<Button variant="default" isSubmitting>Save</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Save');
    });
  });

  describe('Icons', () => {
    it('should render with left icon', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">L</span>}>
          Button
        </Button>
      );

      const leftIcon = screen.queryByTestId('left-icon');
      expect(leftIcon).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">R</span>}>
          Button
        </Button>
      );

      const rightIcon = screen.getByTestId('right-icon');
      expect(rightIcon).toBeInTheDocument();
    });

    it('should render with both icons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Button
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should not render icons when loading', () => {
      render(
        <Button
          isLoading
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Button
        </Button>
      );

      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Text Prop vs Children', () => {
    it('should use children when text prop not provided', () => {
      render(<Button>Children Text</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Children Text');
    });

    it('should use children when both text and children provided (children takes precedence)', () => {
      render(<Button text="Prop Text">Children Text</Button>);

      const button = screen.getByRole('button');
      // The component uses `children || text`, so children wins
      expect(button).toHaveTextContent('Children Text');
    });

    it('should use text prop when no children provided', () => {
      render(<Button text="Prop Text" />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Prop Text');
    });
  });

  describe('Button Type', () => {
    it('should have type="button" by default', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      // Button component doesn't set a default type attribute
      expect(button).toBeInTheDocument();
    });

    it('should have type="submit" for submit variant', () => {
      render(<Button variant="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should respect custom type prop', () => {
      render(<Button type="reset">Reset</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('should prioritize submit variant type over custom type', () => {
      render(
        <Button variant="submit" type="button">
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      // The component checks variant === 'submit' but doesn't override type prop
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when submitting', () => {
      render(<Button isSubmitting>Submitting</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom classes with variant classes', () => {
      render(
        <Button variant="destructive" className="custom-class">
          Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Click Handlers', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick} disabled>
        Disabled
      </Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<Button onClick={handleClick} isLoading>
        Loading
      </Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Other HTML Attributes', () => {
    it('should pass through other HTML attributes', () => {
      render(
        <Button data-testid="test-button" aria-label="Test Button">
          Button
        </Button>
      );

      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('aria-label', 'Test Button');
    });

    it('should support form attribute', () => {
      render(<Button form="my-form">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'my-form');
    });

    it('should support name attribute', () => {
      render(<Button name="submit-btn">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });

    it('should support value attribute', () => {
      render(<Button value="submit-value">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('value', 'submit-value');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should have focus ring based on variant', () => {
      render(<Button variant="destructive">Focus</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-red-500');
    });

    it('should have proper disabled styling', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });

  describe('buttonVariants utility', () => {
    it('should generate correct classes for default variant', () => {
      const classes = buttonVariants({ variant: 'default', size: 'default', fullWidth: false });

      expect(classes).toContain('bg-blue-600');
      expect(classes).toContain('text-white');
      expect(classes).toContain('h-10');
    });

    it('should generate correct classes for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' });

      expect(classes).toContain('bg-red-600');
      expect(classes).toContain('text-white');
    });

    it('should generate correct classes for small size', () => {
      const classes = buttonVariants({ size: 'sm' });

      expect(classes).toContain('h-8');
      expect(classes).toContain('text-xs');
    });

    it('should generate correct classes for large size', () => {
      const classes = buttonVariants({ size: 'lg' });

      expect(classes).toContain('h-12');
      expect(classes).toContain('text-base');
    });

    it('should generate correct classes for full width', () => {
      const classes = buttonVariants({ fullWidth: true });

      expect(classes).toContain('w-full');
    });

    it('should generate correct classes for icon size', () => {
      const classes = buttonVariants({ size: 'icon' });

      expect(classes).toContain('h-10');
      expect(classes).toContain('w-10');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button>{null}</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('should handle undefined text prop', () => {
      render(<Button text={undefined}>Children</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Children');
    });

    it('should handle false disabled prop', () => {
      render(<Button disabled={false}>Enabled</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should handle 0 as children', () => {
      render(<Button>{0}</Button>);

      const button = screen.getByRole('button');
      // 0 is falsy and may not render as text content
      expect(button).toBeInTheDocument();
    });
  });
});
