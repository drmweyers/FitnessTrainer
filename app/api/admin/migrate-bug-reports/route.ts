import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// One-shot migration endpoint — DELETE THIS FILE AFTER USE
const MIGRATION_SECRET = 'bci-migrate-bug-reports-2026'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret')
  if (secret !== MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "BugReportCategory" AS ENUM (
          'ui_issue','data_accuracy','feature_request','performance',
          'sync_issue','auth_access','notification','integration','crash','other'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "BugReportStatus" AS ENUM (
          'open','triaged','in_progress','resolved','closed'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "BugReportPriority" AS ENUM (
          'low','medium','high','critical'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "bug_reports" (
        "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
        "reporter_id"         UUID,
        "category"            "BugReportCategory" NOT NULL DEFAULT 'other',
        "priority"            "BugReportPriority" NOT NULL DEFAULT 'medium',
        "status"              "BugReportStatus"   NOT NULL DEFAULT 'open',
        "title"               VARCHAR(255) NOT NULL,
        "description"         TEXT NOT NULL,
        "screenshot_base64"   TEXT,
        "context"             JSONB,
        "github_issue_url"    VARCHAR(500),
        "github_issue_number" INTEGER,
        "assigned_to_hal"     BOOLEAN NOT NULL DEFAULT false,
        "assigned_at"         TIMESTAMP,
        "resolved_at"         TIMESTAMP,
        "admin_notes"         TEXT,
        "created_at"          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "bug_reports_reporter_id_fkey"
          FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `)

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bug_reports_status_idx"     ON "bug_reports"("status");`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bug_reports_category_idx"   ON "bug_reports"("category");`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bug_reports_reporter_idx"   ON "bug_reports"("reporter_id");`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bug_reports_created_at_idx" ON "bug_reports"("created_at");`)

    return NextResponse.json({ success: true, message: 'bug_reports table ready' })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
