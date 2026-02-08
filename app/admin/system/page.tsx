'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { tokenUtils } from '@/lib/api/auth'
import {
  Database,
  Server,
  Cpu,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

interface HealthData {
  status: 'healthy' | 'degraded' | 'error'
  database: {
    status: string
    latencyMs: number
  }
  server: {
    uptime: string
    uptimeMs: number
    environment: string
    nodeVersion: string
    platform: string
  }
  memory: {
    heapUsedMB: number
    heapTotalMB: number
    rssMB: number
  }
  timestamp: string
}

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const { accessToken } = tokenUtils.getTokens()
      const res = await fetch('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setHealth(data.data)
        setError(null)
      } else {
        setError(data.error || 'Health check failed')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHealth, 30000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, fetchHealth])

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'healthy' || status === 'connected') {
      return <CheckCircle size={20} className="text-green-500" />
    }
    if (status === 'degraded') {
      return <AlertTriangle size={20} className="text-yellow-500" />
    }
    return <XCircle size={20} className="text-red-500" />
  }

  const statusColor = (status: string) => {
    if (status === 'healthy' || status === 'connected') return 'text-green-600 bg-green-50 border-green-200'
    if (status === 'degraded') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          {health && (
            <p className="mt-1 text-sm text-gray-500">
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={fetchHealth}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle size={16} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {health && (
        <>
          {/* Overall Status */}
          <div className={`rounded-xl border p-6 ${statusColor(health.status)}`}>
            <div className="flex items-center gap-3">
              <StatusIcon status={health.status} />
              <div>
                <span className="text-lg font-semibold capitalize">{health.status}</span>
                <p className="text-sm opacity-80">
                  {health.status === 'healthy'
                    ? 'All systems are operating normally'
                    : health.status === 'degraded'
                      ? 'Some services may be experiencing issues'
                      : 'System is experiencing errors'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Database size={20} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Database</h3>
              </div>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="flex items-center gap-2">
                    <StatusIcon status={health.database.status} />
                    <span className="text-sm font-medium capitalize">{health.database.status}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Latency</dt>
                  <dd className="text-sm font-medium text-gray-900">{health.database.latencyMs}ms</dd>
                </div>
              </dl>
            </div>

            {/* Server */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Server size={20} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Server</h3>
              </div>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Uptime</dt>
                  <dd className="text-sm font-medium text-gray-900">{health.server.uptime}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Environment</dt>
                  <dd className="text-sm font-medium text-gray-900 capitalize">{health.server.environment}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Node.js</dt>
                  <dd className="text-sm font-medium text-gray-900">{health.server.nodeVersion}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Platform</dt>
                  <dd className="text-sm font-medium text-gray-900">{health.server.platform}</dd>
                </div>
              </dl>
            </div>

            {/* Memory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Cpu size={20} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Memory</h3>
              </div>
              <dl className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <dt className="text-sm text-gray-500">Heap Used</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {health.memory.heapUsedMB} / {health.memory.heapTotalMB} MB
                    </dd>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((health.memory.heapUsedMB / health.memory.heapTotalMB) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">RSS</dt>
                  <dd className="text-sm font-medium text-gray-900">{health.memory.rssMB} MB</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
