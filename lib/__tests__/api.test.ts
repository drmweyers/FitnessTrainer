/**
 * Tests for lib/api.ts re-exports
 */
import * as api from '../api';

describe('lib/api re-exports', () => {
  it('exports programsApi', () => {
    expect(api.programsApi).toBeDefined();
  });

  it('exports fetchPrograms', () => {
    expect(api.fetchPrograms).toBeDefined();
    expect(typeof api.fetchPrograms).toBe('function');
  });

  it('exports fetchProgram', () => {
    expect(api.fetchProgram).toBeDefined();
    expect(typeof api.fetchProgram).toBe('function');
  });

  it('exports createProgram', () => {
    expect(api.createProgram).toBeDefined();
    expect(typeof api.createProgram).toBe('function');
  });

  it('exports updateProgram', () => {
    expect(api.updateProgram).toBeDefined();
    expect(typeof api.updateProgram).toBe('function');
  });

  it('exports deleteProgram', () => {
    expect(api.deleteProgram).toBeDefined();
    expect(typeof api.deleteProgram).toBe('function');
  });

  it('exports duplicateProgram', () => {
    expect(api.duplicateProgram).toBeDefined();
    expect(typeof api.duplicateProgram).toBe('function');
  });

  it('exports assignProgram', () => {
    expect(api.assignProgram).toBeDefined();
    expect(typeof api.assignProgram).toBe('function');
  });

  it('exports getTemplates', () => {
    expect(api.getTemplates).toBeDefined();
    expect(typeof api.getTemplates).toBe('function');
  });

  it('exports getClientPrograms', () => {
    expect(api.getClientPrograms).toBeDefined();
    expect(typeof api.getClientPrograms).toBe('function');
  });

  it('exports ProgramApiError', () => {
    expect(api.ProgramApiError).toBeDefined();
  });

  it('exports authApi', () => {
    expect(api.authApi).toBeDefined();
  });

  it('exports tokenUtils', () => {
    expect(api.tokenUtils).toBeDefined();
  });

  it('exports AuthApiError', () => {
    expect(api.AuthApiError).toBeDefined();
  });

  it('exports apiClient', () => {
    expect(api.apiClient).toBeDefined();
  });

  it('exports ApiClientError', () => {
    expect(api.ApiClientError).toBeDefined();
  });

  it('exports isApiError', () => {
    expect(api.isApiError).toBeDefined();
    expect(typeof api.isApiError).toBe('function');
  });

  it('exports handleApiError', () => {
    expect(api.handleApiError).toBeDefined();
    expect(typeof api.handleApiError).toBe('function');
  });
});
