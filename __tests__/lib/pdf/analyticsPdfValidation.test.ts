import { validatePdfRequest, PdfRequestSchema } from '@/lib/pdf/analyticsPdfValidation';

describe('analyticsPdfValidation', () => {
  const validRequest = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    sections: ['cover', 'workoutSummary', 'measurements'],
  };

  it('accepts a valid request with all fields', () => {
    const result = PdfRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientId).toBe(validRequest.clientId);
      expect(result.data.startDate).toBe(validRequest.startDate);
      expect(result.data.endDate).toBe(validRequest.endDate);
      expect(result.data.sections).toEqual(validRequest.sections);
    }
  });

  it('rejects missing clientId', () => {
    const { clientId, ...noClient } = validRequest;
    const result = PdfRequestSchema.safeParse(noClient);
    expect(result.success).toBe(false);
  });

  it('rejects invalid date range (end before start)', () => {
    const result = validatePdfRequest({
      ...validRequest,
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('end date');
    }
  });

  it('defaults sections to all when not specified', () => {
    const { sections, ...noSections } = validRequest;
    const result = PdfRequestSchema.safeParse(noSections);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections).toEqual([
        'cover',
        'workoutSummary',
        'measurements',
        'bodyComposition',
        'trainingLoad',
        'goals',
        'performance',
      ]);
    }
  });
});
