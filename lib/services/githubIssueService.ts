/**
 * GitHub Issue Service
 * Creates GitHub issues from bug reports (fire-and-forget)
 * Silently skips if env vars are not configured
 */

interface BugReportData {
  id: string
  category: string
  priority: string
  description: string
  context?: Record<string, unknown> | null
  reporterEmail?: string
}

interface GitHubIssueResult {
  url: string
  number: number
}

export async function createGitHubIssue(
  bug: BugReportData,
): Promise<GitHubIssueResult | null> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME

  if (!token || !owner || !repo) {
    return null
  }

  const prefix = bug.category === 'feature_request' ? '[FEATURE]' : '[BUG]'
  const shortDesc = bug.description
    .replace(/\n/g, ' ')
    .substring(0, 80)
  const title = `${prefix} ${shortDesc}`

  const contextStr = bug.context
    ? Object.entries(bug.context)
        .map(([k, v]) => `- **${k}:** ${v}`)
        .join('\n')
    : 'N/A'

  const body = `## Bug Report — EvoFit Trainer

| Field | Value |
|-------|-------|
| **Category** | ${bug.category} |
| **Priority** | ${bug.priority} |
| **Reporter** | ${bug.reporterEmail ?? 'Unknown'} |
| **Report ID** | ${bug.id} |

## Description

${bug.description}

## Context

${contextStr}
`

  const categoryLabel = `category:${bug.category.replace(/_/g, '-')}`
  const priorityLabel = `priority:${bug.priority}`

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          labels: [categoryLabel, priorityLabel],
        }),
      },
    )

    if (!response.ok) {
      console.error('[GithubIssueService] Failed to create issue:', response.status)
      return null
    }

    const data = (await response.json()) as { html_url: string; number: number }
    return { url: data.html_url, number: data.number }
  } catch (err) {
    console.error('[GithubIssueService] Error creating issue:', err)
    return null
  }
}
