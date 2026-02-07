/**
 * Tests for lib/utils.ts
 * cn() utility function
 */

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates conflicting tailwind classes', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles empty string', () => {
    expect(cn('')).toBe('');
  });

  it('handles no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object inputs', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('merges tailwind responsive classes correctly', () => {
    const result = cn('text-sm', 'text-lg');
    expect(result).toBe('text-lg');
  });
});
