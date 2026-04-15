'use client'

import { useState, useEffect, useCallback } from 'react'
import { tokenUtils } from '@/lib/api/auth'
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// ─── Types ────────────────────────────────────────────────────────────────────

type BugStatus = 'open' | 'triaged' | 'in_progress' | 'resolved' | 'closed'
type BugPriority = 'low' | 'medium' | 'high' | 'critical'
type BugCategory =
  | 'ui_issue' | 'data_accuracy' | 'feature_request' | 'performance'
  | 'sync_issue' | 'auth_access' | 'notification' | 'integration' | 'crash' | 'other'

interface BugReport {
  id: string
  category: BugCategory
  priority: BugPriority
  status: BugStatus
  title: string
  description: string
  screenshotBase64: string | null
  context: Record<string, string> | null
  githubIssueUrl: string | null
  githubIssueNumber: number | null
  assignedToHal: boolean
  assignedAt: string | null
  resolvedAt: string | null
  adminNotes: string | null
  createdAt: string
  reporter: { id: string; email: string } | null
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Badge Helpers ─────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<BugPriority, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
}

const STATUS_COLORS: Record<BugStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  triaged: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

const Badge = ({ label, colorClass }: { label: string; colorClass: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
    {label.replace(/_/g, ' ')}
  </span>
)

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<BugReport | null>(null)
  const [updateStatus, setUpdateStatus] = useState<BugStatus | ''>('')
  const [updatePriority, setUpdatePriority] = useState<BugPriority | ''>('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const fetchBugs = useCallback(async () => {
    setLoading(true)
    const { accessToken } = tokenUtils.getTokens()
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)

    try {
      const res = await fetch(`/api/bugs?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setBugs(data.data.bugs)
        setPagination(data.data.pagination)
      }
    } catch {
      showToast('Failed to load bug reports')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, categoryFilter])

  useEffect(() => {
    void fetchBugs()
  }, [fetchBugs])

  const openDetail = (bug: BugReport) => {
    setSelected(bug)
    setUpdateStatus(bug.status)
    setUpdatePriority(bug.priority)
    setAdminNotes(bug.adminNotes ?? '')
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const { accessToken } = tokenUtils.getTokens()

    try {
      // Update status
      if (updateStatus && updateStatus !== selected.status) {
        const res = await fetch(`/api/bugs/${selected.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: updateStatus, adminNotes }),
        })
        if (!res.ok) throw new Error('Failed to update status')
      }

      // Update priority
      if (updatePriority && updatePriority !== selected.priority) {
        const res = await fetch(`/api/bugs/${selected.id}/priority`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ priority: updatePriority }),
        })
        if (!res.ok) throw new Error('Failed to update priority')
      }

      showToast('Bug report updated')
      setSelected(null)
      void fetchBugs()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      showToast(msg)
    } finally {
      setSaving(false)
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bug Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination ? `${pagination.total} total reports` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="triaged">Triaged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ui_issue">UI Issue</SelectItem>
            <SelectItem value="data_accuracy">Data Accuracy</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="sync_issue">Sync Issue</SelectItem>
            <SelectItem value="auth_access">Auth / Access</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
            <SelectItem value="integration">Integration</SelectItem>
            <SelectItem value="crash">Crash</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : bugs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No bug reports found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reporter</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">GitHub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bugs.map((bug) => (
                <tr
                  key={bug.id}
                  onClick={() => openDetail(bug)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <Badge label={bug.priority} colorClass={PRIORITY_COLORS[bug.priority]} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={bug.status} colorClass={STATUS_COLORS[bug.status]} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{bug.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{bug.title.substring(0, 60)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                    {bug.reporter?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(bug.createdAt)}</td>
                  <td className="px-4 py-3">
                    {bug.githubIssueUrl ? (
                      <a
                        href={bug.githubIssueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Badge label={selected.priority} colorClass={PRIORITY_COLORS[selected.priority]} />
                <Badge label={selected.status} colorClass={STATUS_COLORS[selected.status]} />
                <span className="text-xs text-gray-400">#{selected.id.substring(0, 8)}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-gray-800 whitespace-pre-wrap text-sm">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</p>
                  <p className="text-gray-700">{selected.category.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reporter</p>
                  <p className="text-gray-700">{selected.reporter?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                  <p className="text-gray-700">{fmtDate(selected.createdAt)}</p>
                </div>
                {selected.githubIssueUrl && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">GitHub</p>
                    <a
                      href={selected.githubIssueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm"
                    >
                      Issue #{selected.githubIssueNumber}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {selected.context && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Context</p>
                  <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 font-mono space-y-1">
                    {Object.entries(selected.context).map(([k, v]) => (
                      <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div>
                    ))}
                  </div>
                </div>
              )}

              {selected.screenshotBase64 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Screenshot</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.screenshotBase64}
                    alt="Bug screenshot"
                    className="rounded border border-gray-200 max-h-64 object-contain"
                  />
                </div>
              )}

              {/* Edit Form */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Update Status</Label>
                    <Select
                      value={updateStatus}
                      onValueChange={(v) => setUpdateStatus(v as BugStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="triaged">Triaged</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Update Priority</Label>
                    <Select
                      value={updatePriority}
                      onValueChange={(v) => setUpdatePriority(v as BugPriority)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Admin Notes</Label>
                  <Textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for this report…"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
