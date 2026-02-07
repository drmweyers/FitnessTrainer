import { cn } from '../utils';

describe('cn utility function', () => {
  describe('basic functionality', () => {
    it('should merge class names using clsx and tailwind-merge', () => {
      const result = cn('text-red-500', 'bg-blue-500');

      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle single class name', () => {
      const result = cn('text-red-500');

      expect(result).toBe('text-red-500');
    });

    it('should handle empty input', () => {
      const result = cn();

      expect(result).toBe('');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'text-red-500', '');

      expect(result).toBe('text-red-500');
    });
  });

  describe('conditional classes', () => {
    it('should include class when condition is true', () => {
      const result = cn('base-class', true && 'conditional-class');

      expect(result).toContain('conditional-class');
    });

    it('should exclude class when condition is false', () => {
      const result = cn('base-class', false && 'conditional-class');

      expect(result).not.toContain('conditional-class');
      expect(result).toBe('base-class');
    });

    it('should handle multiple conditions', () => {
      const result = cn(
        'base-class',
        true && 'class1',
        false && 'class2',
        true && 'class3'
      );

      expect(result).toContain('class1');
      expect(result).not.toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle ternary operators', () => {
      const isActive = true;
      const result = cn('base-class', isActive ? 'active' : 'inactive');

      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
    });
  });

  describe('tailwind conflict resolution', () => {
    it('should resolve conflicting tailwind classes (last wins)', () => {
      const result = cn('text-red-500', 'text-blue-500');

      expect(result).toBe('text-blue-500');
    });

    it('should keep non-conflicting classes', () => {
      const result = cn('text-red-500', 'bg-blue-500');

      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should resolve multiple conflicts', () => {
      const result = cn(
        'text-red-500 bg-blue-500 p-4',
        'text-green-500 bg-yellow-500 m-4'
      );

      // The exact order may vary, but all classes should be present
      expect(result).toContain('text-green-500');
      expect(result).toContain('bg-yellow-500');
      expect(result).toContain('p-4');
      expect(result).toContain('m-4');
      // Should not have the overridden classes
      expect(result).not.toContain('text-red-500');
      expect(result).not.toContain('bg-blue-500');
    });

    it('should handle arbitrary values', () => {
      const result = cn('text-[12px]', 'text-[16px]');

      // tailwind-merge keeps the last conflicting arbitrary value
      expect(result).toContain('text-[16px]');
      expect(result).not.toContain('text-[12px]');
    });

    it('should handle responsive variants', () => {
      const result = cn('text-red-500 md:text-blue-500', 'md:text-green-500');

      expect(result).toContain('text-red-500');
      expect(result).toContain('md:text-green-500');
    });

    it('should handle hover and focus states', () => {
      const result = cn('hover:text-red-500', 'hover:text-blue-500');

      expect(result).toBe('hover:text-blue-500');
    });

    it('should handle dark mode variants', () => {
      const result = cn('text-red-500 dark:text-blue-500', 'dark:text-green-500');

      expect(result).toContain('text-red-500');
      expect(result).toContain('dark:text-green-500');
    });
  });

  describe('array inputs', () => {
    it('should handle array of class names', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);

      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should flatten nested arrays', () => {
      const result = cn(['text-red-500', ['bg-blue-500', 'p-4']]);

      expect(result).toBe('text-red-500 bg-blue-500 p-4');
    });

    it('should handle array with conditions', () => {
      const result = cn(['text-red-500', true && 'bg-blue-500', false && 'p-4']);

      expect(result).toBe('text-red-500 bg-blue-500');
    });
  });

  describe('object inputs', () => {
    it('should handle object with boolean values', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': true,
        'p-4': false,
      });

      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('p-4');
    });

    it('should handle mixed object and string inputs', () => {
      const result = cn(
        'base-class',
        {
          'text-red-500': true,
          'bg-blue-500': false,
        }
      );

      expect(result).toContain('base-class');
      expect(result).toContain('text-red-500');
      expect(result).not.toContain('bg-blue-500');
    });

    it('should handle multiple objects', () => {
      const result = cn(
        { 'text-red-500': true, 'bg-blue-500': true },
        { 'p-4': true, 'm-4': false }
      );

      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
      expect(result).not.toContain('m-4');
    });
  });

  describe('complex scenarios', () => {
    it('should handle complex real-world scenario', () => {
      const isActive = true;
      const isDisabled = false;
      const size = 'large';

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class',
        size === 'large' && 'large-class',
        'text-red-500',
        'bg-blue-500',
        {
          'hover:bg-blue-600': !isDisabled,
          'opacity-50': isDisabled,
        }
      );

      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
      expect(result).toContain('large-class');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).not.toContain('opacity-50');
    });

    it('should handle component composition', () => {
      const baseClasses = 'px-4 py-2 rounded';
      const variantClasses = 'bg-blue-500 text-white hover:bg-blue-600';
      const sizeClasses = 'text-lg font-bold';
      const customClasses = 'shadow-lg';

      const result = cn(baseClasses, variantClasses, sizeClasses, customClasses);

      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('rounded');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('text-lg');
      expect(result).toContain('font-bold');
      expect(result).toContain('shadow-lg');
    });

    it('should handle conditional utility override', () => {
      const isError = true;

      const result = cn('text-red-500', isError && 'text-green-500');

      expect(result).toBe('text-green-500');
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined', () => {
      const result = cn('text-red-500', null, undefined, 'bg-blue-500');

      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle numbers (converts to string)', () => {
      const result = cn('text-red-500', 123);

      expect(result).toContain('123');
    });

    it('should handle duplicate classes', () => {
      const result = cn('text-red-500', 'text-red-500');

      expect(result).toBe('text-red-500');
    });

    it('should handle whitespace', () => {
      const result = cn('  text-red-500  ', '  bg-blue-500  ');

      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle empty arrays and objects', () => {
      const result = cn('text-red-500', [], {}, 'bg-blue-500');

      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle class names with special characters', () => {
      const result = cn('text-red-500', 'hover:bg-blue-500', 'dark:text-white');

      expect(result).toContain('text-red-500');
      expect(result).toContain('hover:bg-blue-500');
      expect(result).toContain('dark:text-white');
    });

    it('should handle important modifier', () => {
      const result = cn('text-red-500', '!text-blue-500');

      expect(result).toContain('!text-blue-500');
    });
  });

  describe('performance', () => {
    it('should handle large number of classes efficiently', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);

      const startTime = performance.now();
      const result = cn(...classes);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('real-world use cases', () => {
    it('should work with button component classes', () => {
      const isActive = true;
      const size = 'lg';

      const result = cn(
        'inline-flex items-center justify-center rounded-md',
        'text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        isActive && 'bg-blue-600 text-white',
        size === 'lg' && 'h-12 px-6',
        'hover:bg-blue-700'
      );

      expect(result).toContain('bg-blue-600');
      expect(result).toContain('text-white');
      expect(result).toContain('h-12');
      expect(result).toContain('px-6');
    });

    it('should work with card component classes', () => {
      const isHovered = true;

      const result = cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        isHovered && 'shadow-lg scale-105',
        'transition-all duration-200'
      );

      expect(result).toContain('shadow-lg');
      expect(result).toContain('scale-105');
    });

    it('should work with form input classes', () => {
      const hasError = false;

      const result = cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
        'text-sm ring-offset-background file:border-0 file:bg-transparent',
        'file:text-sm file:font-medium placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasError && 'border-red-500 focus-visible:ring-red-500'
      );

      expect(result).not.toContain('border-red-500');
      expect(result).toContain('border-input');
    });
  });
});
