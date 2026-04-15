import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { createGitHubIssue } from '@/lib/services/githubIssueService'
import { appendBugToHalBridge } from '@/lib/services/halBridgeService'

export const dynamic = 'force-dynamic'

const submitSchema = z.object({
  category: z.enum([
    'ui_issue', 'data_accuracy', 'feature_request', 'performance',
    'sync_issue', 'auth_access', 'notification', 'integration', 'crash', 'other',
  ]),
  description: z.string().min(10, 'Please provide at least 10 characters').max(5000),
  screenshotBase64: z.string().optional(),
  context: z.object({
    url: z.string().optional(),
    browser: z.string().optional(),
    userAgent: z.string().optional(),
    userRole: z.string().optional(),
    userId: z.string().optional(),
  }).optional(),
})

type BugCategory = 'ui_issue' | 'data_accuracy' | 'feature_request' | 'performance' |
  'sync_issue' | 'auth_access' | 'notification' | 'integration' | 'crash' | 'other'

type BugPriority = 'low' | 'medium' | 'high' | 'critical'

function autoPriority(category: BugCategory): BugPriority {
  const criticalCats: BugCategory[] = ['crash', 'auth_access']
  const highCats: BugCategory[] = ['sync_issue', 'data_accuracy', 'performance']
  const lowCats: BugCategory[] = ['feature_request', 'other']

  if (criticalCats.includes(category)) return 'critical'
  if (highCats.includes(category)) return 'high'
  if (lowCats.includes(category)) return 'low'
  return 'medium'
}

// POST /api/bugs — authenticated submit
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  if (!req.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { category, description, screenshotBase64, context } = parsed.data
  const priority = autoPriority(category)
  const title = description.replace(/\n/g, ' ').substring(0, 255)

  try {
    const bug = await prisma.bugReport.create({
      data: {
        reporterId: req.user.id,
        category,
        priority,
        status: 'open',
        title,
        description,
        screenshotBase64: screenshotBase64 ?? null,
        context: context as object ?? null,
      },
      include: {
        reporter: { select: { email: true } },
      },
    })

    // Run side effects inline with a 4s timeout — reliable on Vercel serverless
    try {
      const ghResult = await Promise.race([
        createGitHubIssue({
          id: bug.id,
          category: bug.category,
          priority: bug.priority,
          description: bug.description,
          context: bug.context as Record<string, unknown> | null,
          reporterEmail: bug.reporter?.email,
        }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
      ])

      if (ghResult) {
        await prisma.bugReport.update({
          where: { id: bug.id },
          data: {
            githubIssueUrl: ghResult.url,
            githubIssueNumber: ghResult.number,
          },
        })
      }

      // Hal bridge: log to Vercel function logs (filesystem is read-only on serverless)
      appendBugToHalBridge({
        id: bug.id,
        category: bug.category,
        priority: bug.priority,
        description: bug.description,
        githubIssueUrl: ghResult?.url,
      }).catch(() => {})
    } catch {
      // Side effects never block the user response
    }

    return NextResponse.json({ success: true, data: { id: bug.id } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/bugs]', err)
    return NextResponse.json({ success: false, error: 'Failed to submit report' }, { status: 500 })
  }
}

// GET /api/bugs — admin list with pagination + filters
export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const statusFilter = searchParams.get('status')
  const categoryFilter = searchParams.get('category')

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter
  if (categoryFilter) where.category = categoryFilter

  try {
    const [bugs, total] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bugReport.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        bugs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (err) {
    console.error('[GET /api/bugs]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 })
  }
}
