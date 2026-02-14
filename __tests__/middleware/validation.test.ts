/**
 * Tests for lib/middleware/validation.ts
 * validateBody(), validateQuery(), validateParams(), validate(), customValidation()
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, validate, customValidation } from '@/lib/middleware/validation';

// Suppress console.error from handleApiError
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive('Age must be positive'),
});

describe('validateBody', () => {
  it('returns validated data on valid body', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', age: 30 }),
    });

    const result = await validateBody(request, testSchema);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('returns 400 on invalid body (ZodError)', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', age: -1 }),
    });

    const result = await validateBody(request, testSchema);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.length).toBeGreaterThan(0);
  });

  it('handles JSON parse errors', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{',
    });

    const result = await validateBody(request, testSchema);

    expect(result).toBeInstanceOf(NextResponse);
  });
});

describe('validateQuery', () => {
  const querySchema = z.object({
    page: z.string(),
    limit: z.string().optional(),
  });

  it('returns validated data on valid query', () => {
    const searchParams = new URLSearchParams('page=1&limit=10');
    const result = validateQuery(searchParams, querySchema);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ page: '1', limit: '10' });
  });

  it('returns 400 on invalid query', () => {
    const searchParams = new URLSearchParams('limit=10');
    const result = validateQuery(searchParams, querySchema);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it('handles array query parameters', () => {
    const arraySchema = z.object({
      tags: z.array(z.string()),
    });

    const searchParams = new URLSearchParams('tags=a&tags=b');
    const result = validateQuery(searchParams, arraySchema);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).tags).toEqual(['a', 'b']);
  });

  it('handles three or more array query parameters (push case)', () => {
    const arraySchema = z.object({
      tags: z.array(z.string()),
    });

    const searchParams = new URLSearchParams('tags=a&tags=b&tags=c');
    const result = validateQuery(searchParams, arraySchema);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).tags).toEqual(['a', 'b', 'c']);
  });

  it('handles single value that could be array', () => {
    const flexSchema = z.object({
      name: z.string(),
    });

    const searchParams = new URLSearchParams('name=test');
    const result = validateQuery(searchParams, flexSchema);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).name).toBe('test');
  });

  it('handles non-ZodError exceptions in validateQuery', () => {
    const badSchema = {
      parse: () => {
        throw new Error('Unexpected error');
      },
    } as any;

    const searchParams = new URLSearchParams('page=1');
    const result = validateQuery(searchParams, badSchema);

    expect(result).toBeInstanceOf(NextResponse);
  });
});

describe('validateParams', () => {
  const paramSchema = z.object({
    id: z.string().uuid('Invalid ID format'),
  });

  it('returns validated data on valid params', () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const result = validateParams(params, paramSchema);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('returns 400 on invalid params', () => {
    const params = { id: 'not-a-uuid' };
    const result = validateParams(params, paramSchema);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it('handles non-ZodError exceptions in validateParams', () => {
    const badSchema = {
      parse: () => {
        throw new Error('Unexpected error');
      },
    } as any;

    const params = { id: 'test' };
    const result = validateParams(params, badSchema);

    expect(result).toBeInstanceOf(NextResponse);
  });
});

describe('validate (combined)', () => {
  it('validates body only', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', age: 25 }),
    });

    const result = await validate(request, { body: testSchema });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).body).toEqual({ name: 'Test', age: 25 });
  });

  it('returns error when body validation fails', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });

    const result = await validate(request, { body: testSchema });

    expect(result).toBeInstanceOf(NextResponse);
  });

  it('validates query when nextUrl is present', async () => {
    const querySchema = z.object({ page: z.string() });
    const searchParams = new URLSearchParams('page=1');
    const request = Object.assign(
      new Request('http://localhost:3000/api/test?page=1'),
      { nextUrl: { searchParams } }
    );

    const result = await validate(request, { query: querySchema });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).query).toEqual({ page: '1' });
  });

  it('skips query validation when nextUrl is absent', async () => {
    const querySchema = z.object({ page: z.string() });
    const request = new Request('http://localhost:3000/api/test');

    const result = await validate(request, { query: querySchema });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).query).toBeUndefined();
  });

  it('validates params when present on request', async () => {
    const paramSchema = z.object({ id: z.string() });
    const request = Object.assign(
      new Request('http://localhost:3000/api/test'),
      { params: { id: 'abc' } }
    );

    const result = await validate(request, { params: paramSchema });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).params).toEqual({ id: 'abc' });
  });

  it('returns empty object when no schemas provided', async () => {
    const request = new Request('http://localhost:3000/api/test');
    const result = await validate(request, {});

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({});
  });
});

describe('customValidation', () => {
  it('returns null when condition is true', () => {
    const result = customValidation(true, 'Some error');
    expect(result).toBeNull();
  });

  it('returns 400 when condition is false', async () => {
    const result = customValidation(false, 'Validation failed');

    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.success).toBe(false);
    expect(body.error.details[0].message).toBe('Validation failed');
  });

  it('includes field name when provided', async () => {
    const result = customValidation(false, 'Required', 'email');

    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.error.details[0].field).toBe('email');
    expect(body.error.details[0].message).toBe('Required');
  });

  it('omits field when not provided', async () => {
    const result = customValidation(false, 'Something wrong');

    const body = await result!.json();
    expect(body.error.details[0].field).toBeUndefined();
    expect(body.error.details[0].message).toBe('Something wrong');
  });
});
