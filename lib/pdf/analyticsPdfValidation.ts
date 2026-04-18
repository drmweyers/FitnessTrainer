import { z } from 'zod';

const ALL_SECTIONS = [
  'cover',
  'workoutSummary',
  'measurements',
  'bodyComposition',
  'trainingLoad',
  'goals',
  'performance',
] as const;

export type PdfSection = (typeof ALL_SECTIONS)[number];

export const PdfRequestSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sections: z
    .array(z.enum(ALL_SECTIONS))
    .default([...ALL_SECTIONS]),
});

export type PdfRequest = z.infer<typeof PdfRequestSchema>;

export function validatePdfRequest(body: unknown): { success: true; data: PdfRequest } | { success: false; error: string } {
  const parsed = PdfRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(i => i.message).join(', ') };
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (end < start) {
    return { success: false, error: 'The end date must be after the start date' };
  }

  return { success: true, data: parsed.data };
}
