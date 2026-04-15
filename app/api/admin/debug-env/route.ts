import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-debug-secret')
  if (secret !== 'bci-debug-2026') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo  = process.env.GITHUB_REPO_NAME

  // Test live issue creation right here
  let ghTest: unknown = null
  if (token && owner && repo) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '[DEBUG] env-check test', body: 'Auto-close me', labels: ['bug'] }),
    })
    const data = await res.json()
    ghTest = { status: res.status, url: data.html_url, error: data.message }
  }

  return NextResponse.json({
    GITHUB_TOKEN: token ? `${token.slice(0, 10)}...` : 'MISSING',
    GITHUB_REPO_OWNER: owner || 'MISSING',
    GITHUB_REPO_NAME: repo  || 'MISSING',
    ghTest,
  })
}
