/**
 * Hal Bridge Service
 * Appends bug entries to the dev-updates markdown file so Hal (OpenClaw) can pick them up.
 * Fire-and-forget, silent on error.
 */

import fs from 'fs'
import path from 'path'

const DEFAULT_DEV_UPDATES_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  'Claude/second-brain/dev-updates/evofit.md',
)

interface BugReportData {
  id: string
  category: string
  priority: string
  description: string
  githubIssueUrl?: string | null
}

export async function appendBugToHalBridge(bug: BugReportData): Promise<void> {
  const filePath = process.env.HAL_DEV_UPDATES_PATH || DEFAULT_DEV_UPDATES_PATH

  const timestamp = new Date().toISOString()
  const shortDesc = bug.description.replace(/\n/g, ' ').substring(0, 100)
  const githubLink = bug.githubIssueUrl ? ` | [GitHub](${bug.githubIssueUrl})` : ''

  const entry = `\n## Bug Report [${bug.priority.toUpperCase()}] — ${timestamp}\n- **ID:** ${bug.id}\n- **Category:** ${bug.category}\n- **Priority:** ${bug.priority}\n- **Description:** ${shortDesc}${githubLink}\n`

  try {
    fs.appendFileSync(filePath, entry, 'utf-8')
  } catch {
    // Silent — dev-updates file may not exist in all environments
  }
}
