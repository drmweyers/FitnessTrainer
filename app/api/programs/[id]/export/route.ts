/**
 * Program PDF Export Route (Professional + Enterprise)
 *
 * GET /api/programs/[id]/export
 *
 * Uses puppeteer (already in package.json) to render an HTML program summary
 * to PDF and stream it back as application/pdf.
 *
 * In-memory LRU cache (10 entries, keyed by programId + updatedAt) prevents
 * re-rendering unchanged programs on repeated requests.
 *
 * Rate-limit header X-RateLimit-Remaining is returned on every response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { withTier } from '@/lib/subscription/withTier';

export const dynamic = 'force-dynamic';

// ── In-memory LRU cache (10 entries) ──────────────────────────────────────

const CACHE_MAX = 10;
const cache = new Map<string, Buffer>();

function cacheKey(programId: string, updatedAt: Date): string {
  return `${programId}::${updatedAt.toISOString()}`;
}

function cacheGet(key: string): Buffer | undefined {
  const val = cache.get(key);
  if (val) {
    // Refresh recency: delete + re-insert
    cache.delete(key);
    cache.set(key, val);
  }
  return val;
}

function cacheSet(key: string, val: Buffer): void {
  if (cache.size >= CACHE_MAX) {
    // Evict least-recently-used (first key in insertion order)
    const lruKey = cache.keys().next().value;
    if (lruKey !== undefined) cache.delete(lruKey);
  }
  cache.set(key, val);
}

// ── HTML template ─────────────────────────────────────────────────────────

function buildHtml(program: ProgramWithWeeks): string {
  const weekRows = program.weeks
    .map((week) => {
      const workoutRows = week.workouts
        .map((wo) => {
          const exerciseList = wo.exercises
            .map(
              (ex) =>
                `<li>${ex.exercise?.name ?? 'Exercise'} — ${
                  ex.configurations?.[0]
                    ? `${ex.configurations[0].sets} × ${ex.configurations[0].reps}`
                    : 'See notes'
                }</li>`,
            )
            .join('');
          return `<div class="workout"><strong>${wo.name}</strong><ul>${exerciseList}</ul></div>`;
        })
        .join('');
      return `<section class="week"><h3>Week ${week.weekNumber}${week.isDeload ? ' (Deload)' : ''}: ${week.name}</h3>${workoutRows}</section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${program.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
    h1   { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
    .week { margin-bottom: 20px; page-break-inside: avoid; }
    h3   { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .workout { margin: 8px 0 8px 16px; }
    ul   { margin: 4px 0 0 0; padding-left: 18px; }
    li   { font-size: 13px; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>${program.name}</h1>
  <div class="meta">
    ${program.description ? `<p>${program.description}</p>` : ''}
    <p>${program.durationWeeks} weeks</p>
  </div>
  ${weekRows}
</body>
</html>`;
}

// ── Types ─────────────────────────────────────────────────────────────────

interface ProgramWithWeeks {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  updatedAt: Date;
  weeks: Array<{
    weekNumber: number;
    name: string;
    isDeload: boolean;
    workouts: Array<{
      name: string;
      exercises: Array<{
        exercise: { name: string } | null;
        configurations: Array<{ sets: number; reps: number }>;
      }>;
    }>;
  }>;
}

// ── Simple rate limiter (per-process, resets on cold start) ───────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(trainerId: string): number {
  const now = Date.now();
  const entry = rateLimitMap.get(trainerId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(trainerId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return RATE_LIMIT - 1;
  }
  entry.count++;
  return Math.max(0, RATE_LIMIT - entry.count);
}

// ── Route handler ─────────────────────────────────────────────────────────

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = (authResult as AuthenticatedRequest).user!;

  const { id: programId } = params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(programId)) {
    return NextResponse.json({ success: false, error: 'Invalid program ID' }, { status: 400 });
  }

  const remaining = checkRateLimit(user.id);

  const program = (await prisma.program.findFirst({
    where: { id: programId, trainerId: user.id },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          workouts: {
            include: {
              exercises: {
                include: {
                  exercise: { select: { name: true } },
                  configurations: { select: { sets: true, reps: true }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  })) as ProgramWithWeeks | null;

  if (!program) {
    return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 });
  }

  const key = cacheKey(programId, program.updatedAt);
  const cached = cacheGet(key);
  const rateLimitHeaders = { 'X-RateLimit-Remaining': String(remaining) };

  if (cached) {
    return new NextResponse(cached, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="program-${programId}.pdf"`,
        ...rateLimitHeaders,
      },
    });
  }

  // Generate via puppeteer
  try {
    // Dynamic import — puppeteer is a large package and we only need it here
    const puppeteer = await import('puppeteer');
    const html = buildHtml(program);
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 10_000 });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: false });
      const buf = Buffer.from(pdfBuffer);

      cacheSet(key, buf);

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="program-${programId}.pdf"`,
          ...rateLimitHeaders,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (puppeteerError) {
    // TODO: replace with a dedicated PDF renderer (e.g. react-pdf) in v3.
    // Puppeteer failed (sandbox, memory, etc.) — fall back to HTML response.
    console.error('[export] Puppeteer failed, falling back to HTML:', puppeteerError);
    const html = buildHtml(program);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="program-${programId}.html"`,
        ...rateLimitHeaders,
      },
    });
  }
}

// Gate: Professional + Enterprise (pdfExport is true for both in TIER_FEATURES)
export const GET = withTier({ feature: 'programBuilder.pdfExport' })(handler);
